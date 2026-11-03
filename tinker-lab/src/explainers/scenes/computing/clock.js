// The clock: a quartz crystal, a square wave, every part stepping on the rising edge, MHz vs GHz, heat.
import { scene, clamp } from '../../engine.js';
import { panel } from '../../kit.js';

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A quartz crystal making a clock signal that steps a counter',
  steps: [
    'A quartz crystal vibrates at a very precise rate when powered.',
    'That vibration becomes a clock signal: high, low, high, low.',
    'On every rising edge, all the parts take one step together.',
    'An Arduino Uno ticks 16 million times every second.',
    'A phone or laptop processor ticks billions of times a second.',
    'Faster ticking does more work, but uses more power and makes heat.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { f: 1, ph: 0, count: 0, wave: 0, parts: 0, bars: 0, ghz: 0, heat: 0, shake: 1 };
    // ---------- crystal
    const xtal = d.g();
    d.into(xtal, () => {
      d.rect(-56, -34, 112, 68, { fill: '#d5d7dc', stroke: C.ink, strokeWidth: 2.4, roughness: 0.6 });
      d.text(0, -6, '16.000', { size: 18, fill: C.ink, mono: true, weight: 500 });
      d.text(0, 16, 'MHz', { size: 14, fill: C.ink2, mono: true });
      d.line(-20, 34, -20, 70, { stroke: '#9a9ca3', strokeWidth: 3 }); d.line(20, 34, 20, 70, { stroke: '#9a9ca3', strokeWidth: 3 });
    });
    d.text(120, 70, 'quartz crystal', { size: 15, fill: C.muted, mono: true });
    d.lines([[180, 150], [226, 150]], { strokeWidth: 2.4 });
    // ---------- clock wave
    const wG = d.g();
    panel(S, 230, 60, 540, 150, { parent: wG, fill: '#fff' });
    const wave = d.el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 4, 'stroke-linejoin': 'round' }, wG);
    const edgeMark = d.el('circle', { r: 10, fill: C.iris, opacity: 0 }, wG);
    d.text(250, 84, 'clock signal (slowed right down)', { size: 13, fill: C.muted, mono: true, anchor: 'start' });
    const nowLine = d.el('line', { x1: 700, x2: 700, y1: 92, y2: 196, stroke: C.iris, 'stroke-width': 1.6, 'stroke-dasharray': '4 5' }, wG);
    // ---------- parts that step together
    const pG = d.g();
    const parts = [['counter', 160], ['program counter', 400], ['registers', 640]].map(([t, x]) => {
      const g = d.g(pG);
      const flash = d.el('rect', { x: x - 100, y: 250, width: 200, height: 110, rx: 10, fill: C.yellow, opacity: 0 }, g);
      d.into(g, () => { d.rect(x - 100, 250, 200, 110, { fill: 'none', stroke: C.ink, strokeWidth: 2.2 }); d.text(x, 276, t, { size: 15, fill: C.muted, mono: true }); });
      const v = d.text(x, 322, '', { size: 34, fill: C.ink, mono: true, weight: 500, parent: g });
      d.line(x, 210, x, 250, { stroke: C.accent, strokeWidth: 2, roughness: 0.4, parent: g });
      return { flash, v };
    });
    // ---------- speed comparison (log scale bars)
    const bG = d.g(S.layers.top, { opacity: 0 });
    const BAR = [['Arduino Uno', 16e6, C.accent], ['Raspberry Pi 5', 2.4e9, C.iris], ['laptop (boost)', 5.5e9, C.ink2]];
    const barEls = [];
    d.into(bG, () => {
      panel(S, 40, 236, 720, 170, { parent: bG, fill: '#fff' });
      d.text(60, 258, 'ticks per second (log scale: each line is ×10)', { size: 13, fill: C.muted, mono: true, anchor: 'start' });
      for (let e = 6; e <= 10; e++) { const x = 250 + (e - 6) * 120; d.line(x, 270, x, 396, { stroke: C.line, strokeWidth: 1, roughness: 0.2 }); d.text(x, 400, ['1 M', '10 M', '100 M', '1 G', '10 G'][e - 6], { size: 12, fill: C.muted, mono: true }); }
      BAR.forEach(([t, f, c], k) => {
        const y = 290 + k * 36;
        d.text(240, y, t, { size: 15, fill: C.ink, anchor: 'end' });
        barEls.push({ r: d.el('rect', { x: 250, y: y - 12, height: 24, rx: 12, fill: c, width: 0 }, bG), w: (Math.log10(f) - 6) * 120, t: d.text(0, y, `${f >= 1e9 ? f / 1e9 + ' GHz' : f / 1e6 + ' MHz'}`, { size: 14, fill: C.ink, mono: true, anchor: 'start', parent: bG }), k });
      });
    });
    const ghzT = d.text(400, 450, '', { size: 17, fill: C.ink2, mono: true, parent: S.layers.top });
    // ---------- heat
    const hG = d.g(S.layers.top, { opacity: 0 });
    let pBar, heatGlow;
    d.into(hG, () => {
      panel(S, 520, 236, 240, 170, { parent: hG, fill: '#fff' });
      d.rect(560, 270, 60, 60, { fill: '#2a2b31', stroke: C.ink, roughness: 0.5 });
      heatGlow = d.glow(590, 300, 90, C.accent, hG);
      d.text(640, 264, 'power', { size: 13, fill: C.muted, mono: true, anchor: 'start' });
      d.rect(640, 280, 100, 20, { fill: '#fff', stroke: C.ink, strokeWidth: 1.6 });
      pBar = d.el('rect', { x: 642, y: 282, height: 16, fill: C.accent }, hG);
      d.text(640, 340, 'more ticks + more volts', { size: 12, fill: C.muted, mono: true, anchor: 'start' });
      d.text(640, 360, '= much more heat', { size: 12, fill: C.muted, mono: true, anchor: 'start' });
    });

    const fS = S.ui.slider({ label: 'Clock (slow-mo)', min: 0.3, max: 3, step: 0.1, value: 1, format: (v) => `${v.toFixed(1)} Hz`, onInput: (v) => (st.f = v) });
    const rdC = S.ui.readout({ label: 'Ticks', color: C.iris });
    const xs = [];
    let prevHigh = 0, flashT = 0;
    S.onTick((dt, t) => {
      xtal.setAttribute('transform', `translate(${120 + (st.shake ? Math.sin(t * 60) * 1.6 : 0)} 150)`);
      st.ph += dt * st.f;
      const high = st.ph % 1 < 0.5 ? 1 : 0;
      if (high && !prevHigh) { st.count++; flashT = 1; }
      prevHigh = high;
      flashT = Math.max(0, flashT - dt * 3);
      // scrolling wave: the newest value is at the "now" line
      let p = '';
      for (let x = 250; x <= 700; x += 3) {
        const phx = st.ph - (700 - x) / 150;
        const h = ((phx % 1) + 1) % 1 < 0.5 ? 1 : 0;
        p += `${p ? 'L' : 'M'}${x} ${h ? 112 : 186}`;
      }
      wave.setAttribute('d', p);
      wave.setAttribute('opacity', st.wave.toFixed(2));
      nowLine.setAttribute('opacity', st.wave.toFixed(2));
      edgeMark.setAttribute('cx', 700); edgeMark.setAttribute('cy', 149); edgeMark.setAttribute('opacity', (flashT * st.parts).toFixed(2));
      pG.setAttribute('opacity', (st.parts * (1 - Math.max(st.bars, st.heat * 0.9))).toFixed(2));
      parts.forEach((pt, k) => { pt.flash.setAttribute('opacity', (flashT * 0.6).toFixed(2)); pt.v.textContent = k === 0 ? (st.count % 16).toString(2).padStart(4, '0') : k === 1 ? String(st.count % 10) : `A=${(st.count * 3) % 10}`; });
      bG.setAttribute('opacity', st.bars.toFixed(2));
      barEls.forEach((b) => { const shown = b.k === 0 ? 1 : st.ghz; const w = b.w * shown; b.r.setAttribute('width', Math.max(0, w).toFixed(1)); b.t.setAttribute('x', 260 + w); b.t.setAttribute('opacity', shown > 0.5 ? 1 : 0); });
      ghzT.textContent = st.ghz > 0.5 ? 'at 3 GHz, light travels only 10 cm in one tick' : st.bars > 0.5 ? 'one tick every 62.5 nanoseconds' : '';
      hG.setAttribute('opacity', st.heat.toFixed(2));
      const P = clamp(st.f / 3) * (0.5 + 0.5 * clamp(st.f / 3)) ** 2;
      pBar.setAttribute('width', (96 * P).toFixed(1)); heatGlow.setAttribute('opacity', (P * st.heat).toFixed(2));
      rdC.set(String(st.count));
    }, { essential: true });

    return {
      step(i) {
        S.to(st, { wave: i >= 1 ? 1 : 0, parts: i >= 2 ? 1 : 0, bars: i === 3 || i === 4 ? 1 : 0, ghz: i === 4 ? 1 : 0, heat: i === 5 ? 1 : 0 }, 0.6);
        st.shake = i === 0 ? 1 : 0;
        if (i === 5) S.play(async (w) => { fS.set(0.5); await w(0.6); await S.hand.slide(fS, 3, 1.8); await w(0.4); S.hand.hide(); });
        else if (i <= 2) fS.set(1);
      },
    };
  },
});
