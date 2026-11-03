// Microcontroller vs microprocessor: everything on one chip vs a brain with memory and storage outside.
import { scene } from '../../engine.js';
import { panel } from '../../kit.js';

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A microcontroller chip with everything inside, beside a microprocessor with separate memory and storage',
  steps: [
    'A microcontroller is a whole tiny computer on one chip.',
    'It runs one program, starts instantly and sips power.',
    'A microprocessor is just the brain. Memory and storage sit outside.',
    'It runs an operating system and many programs at once.',
    'Compare: 2 KB of memory versus 8 GB, about four million times more.',
    'An Arduino uses a microcontroller. A Raspberry Pi uses a microprocessor.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { mcu: 1, mcuIn: 0, mcuStat: 0, mpu: 0, os: 0, cmp: 0, boards: 0 };
    // ---------- microcontroller
    const mG = d.g();
    const blocks = d.g(mG, { opacity: 0 });
    d.into(mG, () => {
      for (let k = 0; k < 8; k++) for (const side of [0, 1, 2, 3]) {
        const t = 104 + k * 28;
        if (side === 0) d.line(t, 84, t, 100, { stroke: '#9a9ca3', strokeWidth: 4, roughness: 0.2 });
        if (side === 1) d.line(t, 330, t, 346, { stroke: '#9a9ca3', strokeWidth: 4, roughness: 0.2 });
        if (side === 2) d.line(74, t + 2, 90, t + 2, { stroke: '#9a9ca3', strokeWidth: 4, roughness: 0.2 });
        if (side === 3) d.line(320, t + 2, 336, t + 2, { stroke: '#9a9ca3', strokeWidth: 4, roughness: 0.2 });
      }
      d.rect(90, 100, 230, 230, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2.4, roughness: 0.5 });
      d.text(205, 362, 'microcontroller', { size: 20, fill: C.ink, weight: 500 });
    });
    mG.appendChild(blocks);
    d.into(blocks, () => {
      const b = (x, y, w, h, t, c) => { d.rect(x, y, w, h, { fill: c, stroke: 'none', roughness: 0.5 }); d.text(x + w / 2, y + h / 2, t, { size: 13, fill: '#fff', mono: true, weight: 500 }); };
      b(104, 114, 96, 70, 'CPU', C.accent); b(210, 114, 96, 70, 'flash', C.iris);
      b(104, 194, 96, 54, 'RAM', C.blue); b(210, 194, 96, 54, 'timers', '#5a5c66');
      b(104, 258, 96, 58, 'ADC', '#5a5c66'); b(210, 258, 96, 58, 'pins', C.green);
    });
    const mStat = d.g(S.layers.top, { opacity: 0 });
    d.into(mStat, () => {
      panel(S, 40, 390, 340, 92, { parent: mStat, fill: '#fff' });
      d.text(60, 414, 'ATmega328P (Arduino Uno)', { size: 14, fill: C.ink, mono: true, weight: 500, anchor: 'start' });
      d.text(60, 440, '16 MHz · 32 KB flash · 2 KB RAM', { size: 14, fill: C.ink2, mono: true, anchor: 'start' });
      d.text(60, 464, 'on in a blink · ≈ 0.1 W', { size: 14, fill: C.green, mono: true, anchor: 'start' });
    });
    // ---------- microprocessor system
    const pG = d.g(undefined, { opacity: 0 });
    d.into(pG, () => {
      d.lines([[500, 180], [560, 180]], { strokeWidth: 4, stroke: C.line2 }); d.lines([[680, 180], [700, 180]], { strokeWidth: 4, stroke: C.line2 });
      d.lines([[620, 240], [620, 280]], { strokeWidth: 4, stroke: C.line2 });
      d.rect(560, 120, 120, 120, { fill: '#3a3c44', stroke: C.ink, strokeWidth: 2.4 });
      for (let k = 0; k < 4; k++) d.rect(572 + (k % 2) * 52, 132 + Math.floor(k / 2) * 52, 44, 44, { fill: C.accent, stroke: 'none', roughness: 0.4 });
      d.text(620, 104, 'microprocessor: just the cores', { size: 14, fill: C.ink, mono: true });
      for (let k = 0; k < 2; k++) { d.rect(436 + k * 34, 120, 26, 130, { fill: '#2e8b57', stroke: C.ink, strokeWidth: 1.8 }); for (let j = 0; j < 4; j++) d.rect(441 + k * 34, 130 + j * 28, 16, 20, { fill: '#1b1b1d', stroke: 'none' }); }
      d.text(470, 272, 'RAM 8 GB', { size: 14, fill: C.ink2, mono: true });
      d.rect(700, 150, 80, 60, { fill: '#c7c9cf', stroke: C.ink, strokeWidth: 2 });
      d.text(740, 182, 'SSD', { size: 14, fill: C.ink, mono: true, weight: 500 });
      d.text(740, 228, 'storage', { size: 13, fill: C.muted, mono: true });
      d.rect(570, 280, 100, 44, { fill: C.subtle, stroke: C.ink, strokeWidth: 2 });
      d.text(620, 302, 'power', { size: 13, fill: C.ink2, mono: true });
      d.text(620, 352, 'plus a cooler, graphics, a board…', { size: 13, fill: C.muted, mono: true });
    });
    const osG = d.g(S.layers.top, { opacity: 0 });
    const wins = [];
    d.into(osG, () => {
      panel(S, 420, 380, 360, 102, { parent: osG, fill: '#fff' });
      d.text(440, 402, 'boots an operating system (≈ 20 s)', { size: 13, fill: C.ink2, mono: true, anchor: 'start' });
      ['browser', 'music', 'games', 'camera'].forEach((t, k) => {
        const g = d.g(osG);
        d.into(g, () => { d.rect(440 + k * 84, 418, 74, 52, { fill: '#fff', stroke: C.ink, strokeWidth: 1.8 }); d.rect(440 + k * 84, 418, 74, 12, { fill: C.iris, stroke: 'none' }); d.text(477 + k * 84, 452, t, { size: 12, fill: C.ink2, mono: true }); });
        wins.push(g);
      });
    });
    // ---------- comparison (log bars)
    const cG = d.g(S.layers.top, { opacity: 0 });
    d.into(cG, () => {
      panel(S, 40, 70, 720, 380, { parent: cG, fill: '#fff' });
      d.text(400, 100, 'log scale: every grid line is 10 × more', { size: 14, fill: C.muted, mono: true });
      const rowsC = [['memory (RAM)', 2048, 8 * 2 ** 30, '2 KB', '8 GB', 3, 10], ['speed (clock)', 16e6, 2.4e9, '16 MHz', '2.4 GHz', 6, 10], ['power', 0.1, 8, '≈ 0.1 W', '≈ 8 W', -2, 2]];
      rowsC.forEach(([t, a, b, ta, tb, lo, hi], k) => {
        const y = 150 + k * 100, X0 = 230, W = 480, px = (v) => X0 + ((Math.log10(v) - lo) / (hi - lo)) * W;
        d.text(214, y + 14, t, { size: 17, fill: C.ink, anchor: 'end' });
        for (let e = lo; e <= hi; e++) d.line(X0 + ((e - lo) / (hi - lo)) * W, y - 14, X0 + ((e - lo) / (hi - lo)) * W, y + 46, { stroke: C.line, strokeWidth: 1, roughness: 0.2 });
        d.rect(X0, y - 6, Math.max(8, px(a) - X0), 20, { fill: C.green, stroke: 'none', roughness: 0.4 });
        d.text(Math.max(X0 + 8, px(a)) + 8, y + 4, `${ta} microcontroller`, { size: 13, fill: C.ink, mono: true, anchor: 'start' });
        d.rect(X0, y + 20, px(b) - X0, 20, { fill: C.accent, stroke: 'none', roughness: 0.4 });
        d.text(Math.min(px(b) + 8, 700), y + 30, `${tb} processor`, { size: 13, fill: C.ink, mono: true, anchor: px(b) > 600 ? 'end' : 'start' });
      });
    });
    // ---------- boards
    const bG = d.g(S.layers.top, { opacity: 0 });
    d.into(bG, () => {
      d.rect(20, 40, 760, 456, { fill: '#fff', stroke: 'none' });
      d.rect(80, 150, 250, 180, { fill: '#1f6f8b', stroke: C.ink, strokeWidth: 2.4 });
      d.rect(170, 220, 90, 40, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 1.6 });
      for (let k = 0; k < 14; k++) d.rect(100 + k * 15, 160, 9, 14, { fill: '#1b1b1d', stroke: 'none' });
      d.rect(60, 180, 40, 40, { fill: '#c7c9cf', stroke: C.ink, strokeWidth: 1.6 });
      d.text(205, 360, 'Arduino-style board', { size: 18, fill: C.ink, weight: 500 });
      d.text(205, 386, 'microcontroller: one job, instantly', { size: 14, fill: C.muted, mono: true });
      d.rect(450, 150, 280, 180, { fill: '#2e8b57', stroke: C.ink, strokeWidth: 2.4 });
      d.rect(560, 200, 70, 70, { fill: '#3a3c44', stroke: C.ink, strokeWidth: 1.6 });
      d.rect(470, 200, 60, 80, { fill: '#1b1b1d', stroke: 'none' });
      for (let k = 0; k < 20; k++) d.rect(470 + k * 12, 160, 8, 12, { fill: '#c9a227', stroke: 'none' });
      d.rect(660, 260, 60, 50, { fill: '#c7c9cf', stroke: C.ink, strokeWidth: 1.6 });
      d.text(590, 360, 'Raspberry Pi-style board', { size: 18, fill: C.ink, weight: 500 });
      d.text(590, 386, 'microprocessor: a full computer', { size: 14, fill: C.muted, mono: true });
    });

    S.onTick((dt, t) => {
      mG.setAttribute('opacity', st.mcu.toFixed(2)); blocks.setAttribute('opacity', st.mcuIn.toFixed(2));
      mStat.setAttribute('opacity', st.mcuStat.toFixed(2)); pG.setAttribute('opacity', st.mpu.toFixed(2));
      osG.setAttribute('opacity', st.os.toFixed(2));
      wins.forEach((g, k) => g.setAttribute('transform', `translate(0 ${(Math.sin(t * 2 + k) * 3).toFixed(1)})`));
      cG.setAttribute('opacity', st.cmp.toFixed(2)); bG.setAttribute('opacity', st.boards.toFixed(2));
    });
    return {
      step(i) {
        S.to(st, { mcu: 1, mcuIn: i >= 0 ? 1 : 0, mcuStat: i >= 1 ? 1 : 0, mpu: i >= 2 ? 1 : 0, os: i >= 3 ? 1 : 0, cmp: i === 4 ? 1 : 0, boards: i === 5 ? 1 : 0 }, 0.6);
        if (i === 0) { st.mcuIn = 0; S.to(st, { mcuIn: 1 }, 1.2, { delay: 0.5 }); }
      },
    };
  },
});
