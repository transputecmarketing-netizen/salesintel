// Resistors and the colour code: an interactive four-band picker.
import { scene, si } from '../../engine.js';
import { resistor, BAND, panel } from '../../kit.js';

const DIG = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
const MUL = [['silver', -2], ['gold', -1], ...DIG.slice(0, 7).map((c, i) => [c, i])];
const TOL = [['brown', 1], ['red', 2], ['gold', 5], ['silver', 10]];

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A large resistor with four colour bands you can change',
  steps: [
    'A resistor limits current, turning a little energy into heat.',
    'Its coloured bands are a code for its value in ohms.',
    'Bands 1 and 2 are digits: red is 2, red is 2.',
    'Band 3 is the multiplier: brown means × 10.',
    'Band 4 is the tolerance: gold means within 5 %.',
    'Your turn: tap a band, pick a colour, read the value.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { bands: [2, 2, 3, 2], sel: 0, heat: 0, hi: -1, cut: 0 }; // indices into DIG, DIG, MUL(+2), TOL
    const RX = 400, RY = 150;
    const R = resistor(S, RX, RY, { len: 440, h: 112, lead: 70, bandW: 28 });
    // the cutaway film spiral (step 1)
    const cutG = d.g(undefined, { opacity: 0 });
    d.into(cutG, () => {
      for (let i = 0; i < 9; i++) d.line(RX - 150 + i * 36, RY + 50, RX - 124 + i * 36, RY - 50, { stroke: '#8a6a3a', strokeWidth: 3, roughness: 0.6 });
      d.text(RX, RY + 92, 'a thin spiral of carbon film on a ceramic rod', { size: 18, fill: C.muted, mono: true });
    });
    const heatG = d.g(S.layers.fx, { opacity: 0 });
    const waves = [0, 1, 2, 3].map((i) => d.el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.6 }, heatG));

    // band hit areas, selection marker and labels above each band
    const hits = [0, 1, 2, 3].map((i) => {
      const r = d.el('rect', { x: R.bandX(i) - 26, y: RY - 70, width: 52, height: 140, fill: 'transparent' }, S.layers.top);
      S.tap(r, () => { st.sel = i; render(); }, `Band ${i + 1}`);
      return r;
    });
    const marker = d.el('path', { fill: C.iris, d: 'M-12 0 L12 0 L0 -16 Z' }, S.layers.top);
    const tops = [0, 1, 2, 3].map((i) => d.text(R.bandX(i), RY - 84, '', { size: 22, fill: C.ink, mono: true, weight: 500 }));

    // the palette for the selected band
    const palG = d.g();
    const valT = d.text(RX, 440, '', { size: 46, fill: C.ink, weight: 400 });
    const mathT = d.text(RX, 476, '', { size: 18, fill: C.muted, mono: true });
    const palPanel = panel(S, 40, 258, 720, 120);
    const palTitle = d.text(60, 284, '', { size: 16, fill: C.muted, mono: true, anchor: 'start' });

    function options(i) { return i < 2 ? DIG.map((c, k) => [c, String(k)]) : i === 2 ? MUL.map(([c, p]) => [c, p < 0 ? `×${10 ** p}` : `×${si(10 ** p, '')}`]) : TOL.map(([c, p]) => [c, `±${p}%`]); }
    function render() {
      const b = st.bands;
      const names = [DIG[b[0]], DIG[b[1]], MUL[b[2]][0], TOL[b[3]][0]];
      R.setBands(names);
      const v = (b[0] * 10 + b[1]) * 10 ** MUL[b[2]][1];
      valT.textContent = `${si(v, 'Ω')}  ± ${TOL[b[3]][1]} %`;
      mathT.textContent = `${b[0]}${b[1]} × ${10 ** MUL[b[2]][1]} = ${+(v.toPrecision(3))} Ω  (${si(v * (1 - TOL[b[3]][1] / 100), 'Ω')} to ${si(v * (1 + TOL[b[3]][1] / 100), 'Ω')})`;
      tops[0].textContent = String(b[0]); tops[1].textContent = String(b[1]);
      tops[2].textContent = `×${MUL[b[2]][1] < 0 ? 10 ** MUL[b[2]][1] : si(10 ** MUL[b[2]][1], '')}`;
      tops[3].textContent = `±${TOL[b[3]][1]}%`;
      tops.forEach((t, k) => t.setAttribute('opacity', st.hi < 0 || st.hi === k || (st.hi === 0 && k === 1) ? 1 : 0.18));
      S.at(marker, R.bandX(st.sel), RY + 80);
      palTitle.textContent = ['band 1: first digit', 'band 2: second digit', 'band 3: multiplier', 'band 4: tolerance'][st.sel];
      const opts = options(st.sel);
      d.seed = 7000 + st.sel * 50;
      d.redraw(palG, () => {
        const n = opts.length, w = Math.min(64, 680 / n), x0 = RX - (n * w) / 2;
        opts.forEach(([c, t], k) => {
          const x = x0 + k * w + w / 2, on = (st.sel === 0 || st.sel === 1 ? DIG.indexOf(c) === b[st.sel] : st.sel === 2 ? k === b[2] : k === b[3]);
          const g = d.g(palG);
          d.into(g, () => {
            d.rect(x - w / 2 + 5, 300, w - 10, 40, { fill: BAND[c], fillStyle: 'solid', stroke: on ? C.iris : C.ink, strokeWidth: on ? 4 : 1.4, roughness: 0.6 });
            d.text(x, 360, t, { size: 15, fill: on ? C.irisInk : C.ink2, mono: true, weight: on ? 500 : 400 });
          });
          S.tap(g, () => { b[st.sel] = st.sel < 2 ? k : k; render(); }, `${c} ${t}`);
        });
      });
    }
    render();

    S.onTick((dt, t) => {
      cutG.setAttribute('opacity', st.cut.toFixed(3));
      heatG.setAttribute('opacity', st.heat.toFixed(3));
      waves.forEach((w, i) => {
        const ph = (t * 0.6 + i / 4) % 1, x = RX - 120 + i * 80, y = RY - 70 - ph * 60;
        w.setAttribute('d', `M${x} ${y} q8 -10 0 -20 q-8 -10 0 -20`);
        w.setAttribute('opacity', (Math.sin(ph * Math.PI) * 0.8).toFixed(2));
      });
      palG.setAttribute('opacity', (1 - st.cut).toFixed(3));
      palPanel.setAttribute('opacity', (1 - st.cut).toFixed(3));
      palTitle.setAttribute('opacity', (1 - st.cut).toFixed(3));
    });

    const reset = () => { st.bands = [2, 2, 3, 2]; };
    return {
      step(i) {
        S.to(st, { heat: i === 0 ? 1 : 0, cut: i === 0 ? 1 : 0 }, 0.5);
        reset();
        st.hi = [-1, -1, 0, 2, 3, -1][i];
        st.sel = [0, 0, 0, 2, 3, 0][i];
        render();
        if (i === 5) S.play(async (w) => {
          await w(0.8);
          await S.hand.tap(R.bandX(2), RY); st.sel = 2; render();
          await w(0.5);
          const n = MUL.length, ww = Math.min(64, 680 / n), x = RX - (n * ww) / 2 + 5 * ww + ww / 2;
          await S.hand.tap(x, 320); st.bands[2] = 5; render();
          await w(0.6); S.hand.hide();
        });
      },
    };
  },
});
