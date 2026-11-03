// GPUs and parallelism: a few clever cores vs many simple ones, racing to colour 64 pixels; CUDA cores on a Jetson.
import { scene, clamp } from '../../engine.js';
import { panel } from '../../kit.js';

const HEART = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'];
const T_CPU = 0.25, T_GPU = 0.75; // seconds per pixel per core (a GPU core is slower, but there are many)

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A CPU with four cores racing a GPU with sixty-four cores to colour a picture',
  steps: [
    'A CPU has a few powerful cores, like a handful of expert teachers.',
    'A GPU has thousands of simple cores, like a hall full of pupils.',
    'The job: colour 64 pixels. The CPU does four at a time.',
    'The GPU colours them all at once, even though each core is slower.',
    'Graphics and AI repeat one small sum millions of times: perfect for a GPU.',
    'A Jetson Orin Nano has 1024 GPU (CUDA) cores beside 6 CPU cores.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { cpu: 1, gpu: 0, t: -1, racing: 0, sum: 0, jet: 0 };
    const person = (x, y, s, col, parent) => { d.circle(x, y - 10 * s, 12 * s, { fill: col, stroke: 'none', roughness: 0.4, parent }); d.path(`M${x - 9 * s} ${y + 12 * s} Q ${x} ${y - 8 * s} ${x + 9 * s} ${y + 12 * s} Z`, { fill: col, stroke: 'none', roughness: 0.4, parent }); };
    const grid = (x0, y0, parent) => {
      const cells = [];
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) cells.push({ i, j, on: HEART[j][i] === '1', el: d.el('rect', { x: x0 + i * 26, y: y0 + j * 26, width: 24, height: 24, rx: 3, fill: '#fff', stroke: C.line2, 'stroke-width': 1 }, parent) });
      return cells;
    };
    // ---------- CPU side
    const cG = d.g();
    d.into(cG, () => {
      d.text(200, 52, 'CPU: 4 big cores', { size: 20, fill: C.ink, weight: 500 });
      d.rect(90, 70, 220, 110, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2.2 });
      for (let k = 0; k < 4; k++) { d.rect(102 + k * 52, 82, 46, 86, { fill: C.accent, stroke: 'none', roughness: 0.4 }); person(125 + k * 52, 128, 1.2, '#fff', cG); }
    });
    const cpuCells = grid(96, 210, cG);
    const cpuT = d.text(200, 440, '', { size: 18, fill: C.ink, mono: true, weight: 500, parent: cG });
    // ---------- GPU side
    const gG = d.g(undefined, { opacity: 0 });
    d.into(gG, () => {
      d.text(600, 52, 'GPU: many small cores', { size: 20, fill: C.ink, weight: 500 });
      d.rect(490, 70, 220, 110, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2.2 });
      for (let k = 0; k < 64; k++) { const x = 498 + (k % 16) * 13, y = 80 + Math.floor(k / 16) * 25; d.el('rect', { x, y, width: 11, height: 22, rx: 2, fill: C.green }, gG); d.el('circle', { cx: x + 5.5, cy: y + 7, r: 3, fill: '#fff' }, gG); }
    });
    const gpuCells = grid(496, 210, gG);
    const gpuT = d.text(600, 440, '', { size: 18, fill: C.ink, mono: true, weight: 500, parent: gG });
    const sumG = d.g(S.layers.top, { opacity: 0 });
    d.into(sumG, () => {
      panel(S, 250, 160, 300, 120, { parent: sumG, fill: '#fff' });
      d.text(400, 196, 'every pixel, the same sum:', { size: 15, fill: C.muted, mono: true });
      d.text(400, 236, 'colour = light × 1.2 + 10', { size: 22, fill: C.ink, mono: true, weight: 500 });
      d.text(400, 266, 'a 4K screen: 8 million pixels, 60 times a second', { size: 12, fill: C.muted, mono: true });
    });
    // ---------- Jetson
    const jG = d.g(S.layers.top, { opacity: 0 });
    d.into(jG, () => {
      d.rect(20, 30, 760, 450, { fill: '#fff', stroke: 'none' });
      d.text(400, 60, 'Jetson Orin Nano-style module', { size: 20, fill: C.ink, weight: 500 });
      d.rect(80, 90, 180, 300, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2.2 });
      for (let k = 0; k < 6; k++) d.rect(100 + (k % 2) * 76, 110 + Math.floor(k / 2) * 92, 64, 78, { fill: C.accent, stroke: 'none', roughness: 0.4 });
      d.text(170, 420, '6 Arm CPU cores', { size: 16, fill: C.ink, mono: true });
      d.rect(320, 90, 400, 300, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2.2 });
      for (let k = 0; k < 1024; k++) d.el('rect', { x: 330 + (k % 64) * 6, y: 100 + Math.floor(k / 64) * 17.6, width: 4.5, height: 15, fill: C.green }, jG);
      d.text(520, 420, '1024 CUDA cores + 32 tensor cores', { size: 16, fill: C.ink, mono: true });
      d.text(400, 456, 'each green bar is one GPU core', { size: 14, fill: C.muted, mono: true });
    });

    const raceB = S.ui.button({ label: 'Race!', icon: 'play', primary: true, onClick: () => { st.t = 0; st.racing = 1; } });
    S.onTick((dt) => {
      cG.setAttribute('opacity', st.cpu.toFixed(2)); gG.setAttribute('opacity', st.gpu.toFixed(2));
      sumG.setAttribute('opacity', st.sum.toFixed(2)); jG.setAttribute('opacity', st.jet.toFixed(2));
      if (st.racing) st.t += dt;
      const t = Math.max(0, st.t);
      // CPU: 4 cores, each pixel takes T_CPU; pixel k is done at (floor(k/4)+1) × T_CPU
      cpuCells.forEach((c, k) => { const p = clamp((t - Math.floor(k / 4) * T_CPU) / T_CPU); c.el.setAttribute('fill', p >= 1 ? (c.on ? C.accent : C.accentSoft) : p > 0 ? C.yellow : '#fff'); });
      const tg = S.step >= 3 ? t : 0;
      gpuCells.forEach((c) => { const p = clamp(tg / T_GPU); c.el.setAttribute('fill', p >= 1 ? (c.on ? C.accent : C.accentSoft) : p > 0 ? C.yellow : '#fff'); });
      const cpuDone = Math.min(t, 16 * T_CPU), gpuDone = Math.min(tg, T_GPU);
      cpuT.textContent = st.t < 0 ? 'ready' : `${cpuDone.toFixed(2)} s${t >= 16 * T_CPU ? '  done' : ''}`;
      gpuT.textContent = st.t < 0 || S.step < 3 ? 'waiting' : `${gpuDone.toFixed(2)} s${tg >= T_GPU ? '  done' : ''}`;
      if (t > 16 * T_CPU + 2.5 && st.loop) st.t = 0;
    }, { essential: true });

    return {
      step(i) {
        raceB.show(i >= 2 && i <= 4);
        S.to(st, { cpu: i <= 4 ? 1 : 0, gpu: i >= 1 && i <= 4 ? 1 : 0, sum: i === 4 ? 1 : 0, jet: i === 5 ? 1 : 0 }, 0.6);
        st.t = -1; st.racing = 0; st.loop = 0;
        if (i === 2 || i === 3) S.play(async (w) => { await w(0.8); await S.hand.press(raceB.el); st.t = 0; st.racing = 1; st.loop = 1; await w(0.4); S.hand.hide(); });
      },
    };
  },
});
