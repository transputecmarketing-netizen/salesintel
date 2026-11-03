// How a camera sees: lens, pixel grid, brightness numbers, the Bayer filter, demosaicing and exposure.
import { scene, clamp } from '../../engine.js';
import { panel } from '../../kit.js';

const NX = 24, NY = 16, CW = 14;
const GX = 424, GY = 140;
const WX = 30, WY = 150, WW = 270, WH = 190;

// the little world in front of the camera, as colour at (u, v) in 0..1
function world(u, v, bird) {
  if (bird && (u - bird) ** 2 + ((v - 0.24) * 1.4) ** 2 < 0.0012) return [40, 40, 50];
  if ((u - 0.78) ** 2 + (v - 0.2) ** 2 < 0.0081) return [255, 214, 64];
  if (u > 0.64 && u < 0.68 && v > 0.55 && v < 0.8) return [110, 70, 40];
  if ((u - 0.66) ** 2 + (v - 0.48) ** 2 < 0.0121) return [50, 150, 70];
  if (u > 0.29 && u < 0.35 && v > 0.6 && v < 0.8) return [90, 50, 30];
  if (u > 0.21 && u < 0.27 && v > 0.48 && v < 0.56) return [250, 240, 200];
  if (u > 0.18 && u < 0.46 && v > 0.42 && v < 0.8) return [214, 64, 52];
  if (v > 0.28 && v <= 0.42 && Math.abs(u - 0.32) < ((v - 0.28) / 0.14) * 0.17) return [70, 60, 70];
  if (v < 0.62) return [120 + v * 110, 180 + v * 70, 240];
  return v > 0.82 ? [70, 150, 70] : [90, 175, 85];
}

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A scene focused by a lens onto a grid of camera pixels',
  steps: [
    'A lens focuses light onto a grid of tiny sensors. It lands upside down!',
    'Each pixel counts the light it gets: more light, a bigger number.',
    'On their own, pixels only measure brightness, not colour.',
    'So tiny colour filters sit on top: the Bayer pattern.',
    'Twice as many green, like our eyes. The camera fills in the gaps.',
    'Longer exposure lets in more light, but moving things blur.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { mode: 'gray', flip: 1, zoom: 0, exp: 1, rays: 1 };
    // ---------- the world, hand drawn
    const wG = d.g();
    const U = (u) => WX + u * WW, V = (v) => WY + v * WH;
    d.into(wG, () => {
      d.rect(WX, WY, WW, WH * 0.62, { fill: '#a6d0f2', stroke: 'none', roughness: 0.4 });
      d.rect(WX, V(0.62), WW, WH * 0.38, { fill: '#5aaf55', stroke: 'none', roughness: 0.4 });
      d.circle(U(0.78), V(0.2), WW * 0.18, { fill: '#ffd640', stroke: C.ink, strokeWidth: 1.6 });
      d.rect(U(0.18), V(0.42), WW * 0.28, WH * 0.38, { fill: '#d64034', stroke: C.ink, strokeWidth: 1.8 });
      d.poly([[U(0.15), V(0.42)], [U(0.32), V(0.28)], [U(0.49), V(0.42)]], { fill: '#463c46', stroke: C.ink, strokeWidth: 1.8 });
      d.rect(U(0.29), V(0.6), WW * 0.06, WH * 0.2, { fill: '#5a321e', stroke: C.ink, strokeWidth: 1.4 });
      d.rect(U(0.21), V(0.48), WW * 0.06, WH * 0.08, { fill: '#faf0c8', stroke: C.ink, strokeWidth: 1.4 });
      d.rect(U(0.64), V(0.55), WW * 0.04, WH * 0.25, { fill: '#6e4628', stroke: C.ink, strokeWidth: 1.4 });
      d.circle(U(0.66), V(0.48), WW * 0.22, { fill: '#329646', stroke: C.ink, strokeWidth: 1.6 });
      d.rect(WX, WY, WW, WH, { fill: 'none', stroke: C.ink, strokeWidth: 2.2 });
    });
    const birdEl = d.el('circle', { r: 7, fill: '#28282f' }, wG);
    // ---------- lens and rays
    const raysG = d.g();
    d.into(raysG, () => {
      d.ellipse(352, 245, 30, 150, { fill: C.blueSoft, stroke: C.ink, strokeWidth: 2 });
      for (const [y0, y1] of [[WY + 10, GY + NY * CW - 10], [WY + WH - 10, GY + 10]]) d.lines([[WX + WW, y0], [352, 245], [GX, y1]], { stroke: C.yellow, strokeWidth: 2.2, roughness: 0.4 });
      d.text(352, 342, 'lens', { size: 15, fill: C.muted, mono: true });
    });
    // ---------- the pixel grid
    const gridG = d.g();
    const cells = [];
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) cells.push({ i, j, el: d.el('rect', { x: GX + i * CW, y: GY + j * CW, width: CW - 1, height: CW - 1, fill: '#000' }, gridG), last: '' });
    d.rect(GX - 4, GY - 4, NX * CW + 7, NY * CW + 7, { fill: 'none', stroke: C.ink, strokeWidth: 2.2, roughness: 0.5 });
    const gLab = d.text(GX + (NX * CW) / 2, GY - 22, '', { size: 16, fill: C.ink2, mono: true });
    // ---------- zoom with numbers
    const zG = d.g(S.layers.top, { opacity: 0 });
    const zc = [];
    d.into(zG, () => {
      panel(S, GX - 10, 382, 356, 108, { parent: zG, fill: '#fff' });
      for (let k = 0; k < 16; k++) { const x = GX + (k % 8) * 42, y = 390 + Math.floor(k / 8) * 46; zc.push({ r: d.el('rect', { x, y, width: 40, height: 44, fill: '#000' }, zG), t: d.text(x + 20, y + 23, '', { size: 14, mono: true, fill: '#fff', parent: zG }) }); }
    });
    const zMark = d.el('rect', { x: GX + 15 * CW, y: GY + 2 * CW, width: 8 * CW, height: 2 * CW, fill: 'none', stroke: C.iris, 'stroke-width': 2.5, opacity: 0 }, S.layers.top);

    const modeC = S.ui.choice({ options: [['gray', 'Brightness'], ['bayer', 'Filters'], ['color', 'Colour']], value: 'gray', onChange: (v) => (st.mode = v) });
    const expS = S.ui.slider({ label: 'Shutter', min: -1.5, max: 0.6, step: 0.1, value: 0, format: (v) => { const s = (1 / 125) * 10 ** v; return s >= 0.1 ? `${s.toFixed(2)} s` : `1/${Math.round(1 / s)} s`; }, onInput: (v) => (st.exp = 10 ** v) }).show(false);

    let bt = 0;
    const raw = new Float32Array(NX * NY * 3);
    S.onTick((dt) => {
      bt += dt;
      const birdAt = (t) => 0.08 + ((t * 0.09) % 0.84);
      birdEl.setAttribute('cx', U(birdAt(bt)).toFixed(1)); birdEl.setAttribute('cy', V(0.24).toFixed(1));
      // expose: average the scene over the shutter time (the bird smears), scaled by how much light got in
      const shutter = (1 / 125) * st.exp, gain = st.exp, samples = Math.max(1, Math.min(10, Math.round(shutter * 40)));
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        let r = 0, g = 0, b = 0, n = 0;
        for (let s = 0; s < samples; s++) {
          const bird = birdAt(bt - (shutter * 6 * s) / samples);
          for (const [ou, ov] of [[0.25, 0.25], [0.75, 0.75], [0.25, 0.75], [0.75, 0.25]]) { const c = world((i + ou) / NX, (j + ov) / NY, bird); r += c[0]; g += c[1]; b += c[2]; n++; }
        }
        const k = (j * NX + i) * 3;
        raw[k] = Math.min(255, (r / n) * gain); raw[k + 1] = Math.min(255, (g / n) * gain); raw[k + 2] = Math.min(255, (b / n) * gain);
      }
      const ch = (i, j) => ((j % 2) === 0 ? ((i % 2) === 0 ? 0 : 1) : ((i % 2) === 0 ? 1 : 2)); // RGGB
      const val = (i, j, c) => raw[(clamp(j, 0, NY - 1) * NX + clamp(i, 0, NX - 1)) * 3 + c];
      for (const cell of cells) {
        const { i, j } = cell;
        let col;
        if (st.mode === 'gray') { const y = Math.round(0.299 * val(i, j, 0) + 0.587 * val(i, j, 1) + 0.114 * val(i, j, 2)); col = `rgb(${y},${y},${y})`; }
        else if (st.mode === 'bayer') { const c = ch(i, j), v = Math.round(val(i, j, c)); col = c === 0 ? `rgb(${v},0,0)` : c === 1 ? `rgb(0,${v},0)` : `rgb(0,0,${v})`; }
        else {
          // demosaic: each channel averaged from the neighbours that have that filter
          const out = [0, 0, 0], cnt = [0, 0, 0];
          for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= NX || jj >= NY) continue; const c = ch(ii, jj); out[c] += val(ii, jj, c); cnt[c]++; }
          col = `rgb(${Math.round(out[0] / cnt[0])},${Math.round(out[1] / cnt[1])},${Math.round(out[2] / cnt[2])})`;
        }
        if (col !== cell.last) { cell.el.setAttribute('fill', col); cell.last = col; }
      }
      gridG.setAttribute('transform', `rotate(${(180 * st.flip).toFixed(1)} ${GX + (NX * CW) / 2} ${GY + (NY * CW) / 2})`);
      gLab.textContent = st.flip > 0.5 ? 'the image on the sensor (upside down)' : st.mode === 'gray' ? 'brightness only' : st.mode === 'bayer' ? 'what each filtered pixel sees' : 'full colour, filled in';
      zG.setAttribute('opacity', st.zoom.toFixed(2)); zMark.setAttribute('opacity', st.zoom.toFixed(2));
      if (st.zoom > 0.01) zc.forEach((z, k) => {
        const i = 15 + (k % 8), j = 2 + Math.floor(k / 8);
        const y = Math.round(0.299 * val(i, j, 0) + 0.587 * val(i, j, 1) + 0.114 * val(i, j, 2));
        z.r.setAttribute('fill', `rgb(${y},${y},${y})`); z.t.textContent = String(y); z.t.setAttribute('fill', y > 140 ? C.ink : '#fff');
      });
    }, { essential: true });

    return {
      step(i) {
        expS.show(i === 5);
        if (i !== 5) { expS.set(0); }
        S.to(st, { flip: i === 0 ? 1 : 0, zoom: i === 1 ? 1 : 0 }, 0.9);
        modeC.set(i <= 2 ? 'gray' : i === 3 ? 'bayer' : 'color');
        if (i === 5) S.play(async (w) => { await w(0.8); await S.hand.slide(expS, 0.6, 1.6); await w(0.4); S.hand.hide(); });
      },
    };
  },
});
