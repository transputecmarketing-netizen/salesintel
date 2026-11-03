// Infrared: the invisible colour, reflection sensors and remote controls (38 kHz bursts, NEC code).
import { scene, clamp } from '../../engine.js';
import { panel } from '../../kit.js';

const CODES = { 1: 0x0c, 2: 0x18, 3: 0x5e }; // common NEC remote: buttons 1, 2, 3, address 0x00
const MS = 9.6; // px per millisecond on the waveform

function necFrame(cmd) {
  // [isBurst, ms] pieces, least significant bit first
  const out = [[1, 9], [0, 4.5]];
  const bytes = [0x00, 0xff, cmd, (~cmd) & 0xff];
  const bits = [];
  for (const b of bytes) for (let i = 0; i < 8; i++) bits.push((b >> i) & 1);
  for (const bit of bits) out.push([1, 0.5625], [0, bit ? 1.6875 : 0.5625]);
  out.push([1, 0.5625]);
  return { out, bits };
}

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'Infrared light: the spectrum, a reflection sensor and a TV remote sending a code',
  steps: [
    'Infrared is light just past red: our eyes can’t see it.',
    'An IR LED shines; a nearby surface reflects some back.',
    'White surfaces bounce lots back. Black ones swallow it.',
    'A remote flashes its IR LED in a pattern: a code.',
    'Each flash is a fast 38 kHz burst, so lamps can’t fool it.',
    'The receiver turns the flashes back into ones and zeros.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { spec: 1, refl: 0, rem: 0, zoom: 0, dec: 0, white: 1, key: 1, t: 99 };
    const defs = S.svg.querySelector('defs');

    // ---------- A. the spectrum
    const aG = d.g();
    const gid = `${S.uid}spec`;
    const lg = d.el('linearGradient', { id: gid, x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
    [['0', '#7b3fbf'], ['0.17', '#2a63d6'], ['0.4', '#2c9a4a'], ['0.6', '#f5cf1d'], ['0.75', '#f07c1a'], ['1', '#d8262a']].forEach(([o, c]) => d.el('stop', { offset: o, 'stop-color': c }, lg));
    d.into(aG, () => {
      d.el('rect', { x: 80, y: 170, width: 480, height: 60, fill: `url(#${gid})`, rx: 4 });
      d.rect(560, 170, 180, 60, { fill: '#3a1a1a', fillStyle: 'hachure', hachureGap: 6, stroke: C.ink, strokeWidth: 1.6, roughness: 0.8 });
      d.rect(80, 170, 660, 60, { fill: 'none', stroke: C.ink, strokeWidth: 2, roughness: 0.6 });
      for (const [nm, t] of [[400, '400'], [700, '700'], [1000, '1000 nm']]) d.text(80 + (nm - 400) * 1.6, 252, t, { size: 15, fill: C.muted, mono: true });
      d.text(320, 146, 'colours we can see', { size: 21, fill: C.ink2 });
      d.text(650, 146, 'infrared', { size: 21, fill: C.accentInk });
      d.text(650, 290, '(invisible to us)', { size: 16, fill: C.muted, mono: true });
      const x940 = 80 + (940 - 400) * 1.6;
      d.arrow(x940, 330, x940, 236, { stroke: C.accent, strokeWidth: 2, head: 10 });
      d.text(x940, 350, '940 nm: TV remotes', { size: 16, fill: C.accentInk, mono: true });
      d.text(400, 430, 'Tip: a phone camera can often see a remote’s IR LED flash.', { size: 18, fill: C.muted });
    });

    // ---------- B. reflection sensor
    const bG = d.g(undefined, { opacity: 0 });
    let surf, meterBar;
    const rays = [];
    d.into(bG, () => {
      d.rect(40, 170, 120, 150, { fill: C.blue, stroke: C.ink, roughness: 0.6 });
      d.circle(100, 210, 46, { fill: '#cfd6e8', stroke: C.ink, strokeWidth: 2 });
      d.circle(100, 280, 46, { fill: '#1b1b1d', stroke: C.ink, strokeWidth: 2 });
      d.text(100, 340, 'IR LED + light sensor', { size: 15, fill: C.muted, mono: true });
      surf = d.g(bG);
      for (let i = 0; i < 5; i++) {
        rays.push(d.el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 3, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }, bG));
        rays.push(d.el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 3, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }, bG));
      }
      d.text(300, 140, 'dashes = infrared light (drawn so you can see it)', { size: 15, fill: C.muted, mono: true });
      panel(S, 640, 150, 120, 220, { parent: bG });
      d.rect(680, 180, 40, 160, { fill: '#fff', stroke: C.ink, strokeWidth: 2, roughness: 0.5 });
      meterBar = d.el('rect', { x: 684, width: 32, fill: C.accent }, bG);
      d.text(700, 360, 'light back', { size: 14, fill: C.muted, mono: true });
    });
    const drawSurf = () => { d.seed = 900; d.redraw(surf, () => d.rect(440, 160, 60, 180, { fill: st.white > 0.5 ? '#ffffff' : '#1b1b1d', fillStyle: 'solid', stroke: C.ink, strokeWidth: 2.2 })); };
    drawSurf();

    // ---------- C. remote and receiver
    const cG = d.g(undefined, { opacity: 0 });
    const keys = {};
    let flashDot, recvGlow;
    const flyers = [];
    d.into(cG, () => {
      d.rect(50, 80, 100, 250, { fill: '#2a2b31', stroke: C.ink, roughness: 0.6 });
      d.circle(100, 100, 18, { fill: '#5b1a1a', stroke: C.ink, strokeWidth: 1.4 });
      for (const [k, y] of [[1, 170], [2, 225], [3, 280]]) {
        const g = d.g(cG);
        d.into(g, () => { d.circle(100, y, 44, { fill: '#4a4b52', stroke: '#111', strokeWidth: 1.6 }); d.text(100, y + 1, String(k), { size: 20, fill: '#fff', mono: true, weight: 500 }); });
        keys[k] = { g, y };
        S.tap(g, () => press(k), `Button ${k}`);
      }
      flashDot = d.glow(100, 100, 40, C.accent, cG);
      // receiver (three-leg dome)
      d.rect(668, 170, 64, 70, { fill: '#1b1b1d', stroke: C.ink, roughness: 0.5 });
      d.circle(700, 190, 40, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 1.4 });
      for (const x of [682, 700, 718]) d.line(x, 240, x, 290, { stroke: '#9a9ca3', strokeWidth: 3 });
      d.text(700, 308, 'OUT GND VCC', { size: 11, fill: C.muted, mono: true });
      d.text(700, 150, 'IR receiver', { size: 15, fill: C.muted, mono: true });
      recvGlow = d.glow(700, 190, 50, C.accent, cG);
      for (let i = 0; i < 8; i++) flyers.push(d.el('circle', { r: 5, fill: C.accent }, cG));
    });
    // waveform panel
    const wG = d.g(undefined, { opacity: 0 });
    const wave = d.g(wG);
    const head = d.el('line', { y1: 372, y2: 432, stroke: C.iris, 'stroke-width': 2 }, wG);
    const decT = d.text(400, 470, '', { size: 18, fill: C.ink, mono: true, parent: wG });
    const bitsG = d.g(wG);
    // zoom inset on one burst
    const zG = d.g(S.layers.top, { opacity: 0 });
    d.into(zG, () => {
      panel(S, 250, 60, 360, 150, { parent: zG, fill: '#fff' });
      let p = 'M270 170';
      for (let i = 0; i < 21; i++) { const x = 270 + i * 15; p += ` L${x} 110 L${x + 7.5} 110 L${x + 7.5} 170 L${x + 15} 170`; }
      d.el('path', { d: p, fill: 'none', stroke: C.accent, 'stroke-width': 2.5 }, zG);
      d.text(430, 86, 'one flash = 21 tiny blinks at 38,000 per second', { size: 15, fill: C.ink2, mono: true });
      d.text(430, 196, '0.56 ms', { size: 14, fill: C.muted, mono: true });
    });
    let frame = necFrame(CODES[1]);
    const drawWave = () => {
      d.seed = 500;
      d.redraw(wave, () => {
        panel(S, 30, 356, 740, 130, { parent: wave });
        let x = 50, pd = `M${x} 428`;
        for (const [b, ms] of frame.out) { const w = ms * MS * 0.98; pd += b ? ` L${x} 380 L${x + w} 380 L${x + w} 428` : ` L${x + w} 428`; x += w; }
        d.el('path', { d: pd, fill: 'none', stroke: C.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, wave);
        d.text(50, 370, 'start', { size: 12, fill: C.muted, mono: true, anchor: 'start' });
      });
      d.redraw(bitsG, () => {
        // bracket over the command byte (bits 16–23)
        let x = 50 + 13.5 * MS * 0.98;
        const xs = [];
        frame.bits.forEach((bit) => { xs.push(x); x += (0.5625 + (bit ? 1.6875 : 0.5625)) * MS * 0.98; });
        const a = xs[16], b = xs[24];
        d.line(a, 446, b, 446, { stroke: C.iris, strokeWidth: 2, roughness: 0.3 });
        frame.bits.slice(16, 24).forEach((bit, i) => d.text((xs[16 + i] + (xs[17 + i] ?? b)) / 2, 458, String(bit), { size: 12, fill: C.irisInk, mono: true }));
        d.text(a - 6, 446, 'command →', { size: 12, fill: C.irisInk, mono: true, anchor: 'end' });
      });
    };
    drawWave();
    const frameMs = frame.out.reduce((s, [, ms]) => s + ms, 0);

    function press(k) {
      st.key = k; frame = necFrame(CODES[k]); drawWave(); st.t = 0;
    }

    S.onTick((dt) => {
      aG.setAttribute('opacity', st.spec.toFixed(2));
      bG.setAttribute('opacity', st.refl.toFixed(2));
      cG.setAttribute('opacity', st.rem.toFixed(2));
      wG.setAttribute('opacity', st.rem.toFixed(2));
      zG.setAttribute('opacity', st.zoom.toFixed(2));
      bitsG.setAttribute('opacity', st.dec.toFixed(2));
      // reflection rays
      const R = st.white > 0.5 ? 0.85 : 0.08;
      rays.forEach((r, i) => {
        const k = (i >> 1) - 2, y0 = 210, yh = 250 + k * 14;
        if (i % 2 === 0) r.setAttribute('d', `M122 ${y0} L440 ${yh}`);
        else { r.setAttribute('d', `M440 ${yh} L122 280`); r.setAttribute('opacity', R.toFixed(2)); }
        r.setAttribute('stroke-dashoffset', (-S.time * 40).toFixed(1));
      });
      const lvl = R;
      meterBar.setAttribute('y', (336 - 152 * lvl).toFixed(1)); meterBar.setAttribute('height', (152 * lvl).toFixed(1));
      // remote: play the frame in slow motion (≈ 40× slower than real)
      st.t += dt * 1000 / 40;
      let on = 0, acc = 0;
      for (const [b, ms] of frame.out) { if (st.t >= acc && st.t < acc + ms) { on = b; break; } acc += ms; }
      flashDot.setAttribute('opacity', st.rem * on);
      recvGlow.setAttribute('opacity', st.rem * on * 0.8);
      const prog = clamp(st.t / frameMs);
      head.setAttribute('x1', 50 + prog * frameMs * MS * 0.98); head.setAttribute('x2', 50 + prog * frameMs * MS * 0.98);
      head.setAttribute('opacity', st.t < frameMs ? 1 : 0);
      flyers.forEach((f, i) => { const p = ((S.time * 0.9) + i / 8) % 1; f.setAttribute('cx', 120 + p * 560); f.setAttribute('cy', 100 + p * 90); f.setAttribute('opacity', st.t < frameMs ? (on ? 0.9 : 0.15) : 0); });
      if (st.t > frameMs + 2500 / 40 * 4) st.t = 0;
      decT.textContent = st.dec > 0.5 ? `command 0x${CODES[st.key].toString(16).toUpperCase().padStart(2, '0')} = button ${st.key}` : `button ${st.key} pressed`;
    }, { essential: true });

    const surfC = S.ui.choice({ label: 'Surface', options: [['white', 'White'], ['black', 'Black']], value: 'white', onChange: (v) => { st.white = v === 'white' ? 1 : 0; drawSurf(); } });
    return {
      step(i) {
        surfC.show(i === 1 || i === 2);
        S.to(st, { spec: i === 0 ? 1 : 0, refl: i === 1 || i === 2 ? 1 : 0, rem: i >= 3 ? 1 : 0, zoom: i === 4 ? 1 : 0, dec: i === 5 ? 1 : 0 }, 0.5);
        if (i === 1) surfC.set('white');
        if (i === 2) { surfC.set('white'); S.play(async (w) => { await w(0.8); await S.hand.press(surfC.el.querySelectorAll('button')[1]); surfC.set('black'); await w(0.4); S.hand.hide(); }); }
        if (i === 3) S.play(async (w) => { await w(0.6); await S.hand.tap(100, keys[1].y); press(1); await w(0.4); S.hand.hide(); });
        if (i === 5) S.play(async (w) => { await w(1.5); await S.hand.tap(100, keys[2].y); press(2); await w(0.4); S.hand.hide(); });
      },
    };
  },
});
