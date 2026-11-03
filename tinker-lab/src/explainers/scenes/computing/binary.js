// Bits and binary: eight switches, place values, adding them up, counting like an odometer, letters as numbers.
import { scene } from '../../engine.js';

const VAL = [128, 64, 32, 16, 8, 4, 2, 1];

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'Eight switches that make a binary number',
  steps: [
    'A bit is a switch: off means 0, on means 1.',
    'Put eight bits side by side and you have a byte.',
    'Each switch is worth double the one on its right: 1, 2, 4, 8…',
    'Add up the values of the switches that are on.',
    'Counting up: the switches flip like a car’s mileage counter.',
    'A byte counts from 0 to 255. Letters are numbers too: A is 65.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { n: 1, show: 1, vals: 0, sum: 0, count: 0, chr: 0, t: 0 };
    const X0 = 92, DX = 88;
    const sw = VAL.map((v, k) => {
      const x = X0 + k * DX, g = d.g();
      const glow = d.glow(x, 140, 70, C.yellow, g);
      let knob, lamp;
      d.into(g, () => {
        d.circle(x, 140, 56, { fill: '#fff', stroke: C.ink, strokeWidth: 2 });
        lamp = d.el('circle', { cx: x, cy: 140, r: 22, fill: C.yellow, opacity: 0 }, g);
        d.rect(x - 26, 210, 52, 110, { fill: C.subtle, stroke: C.ink, strokeWidth: 2.2, roughness: 0.6 });
        knob = d.g(g);
        d.into(knob, () => d.rect(x - 18, 0, 36, 46, { fill: C.ink2, stroke: C.ink, strokeWidth: 1.6, roughness: 0.4 }));
      });
      const bit = d.text(x, 352, '0', { size: 34, fill: C.ink, mono: true, weight: 500, parent: g });
      const val = d.text(x, 392, String(v), { size: 20, fill: C.accentInk, mono: true, parent: g, opacity: 0 });
      S.tap(g, () => { st.n ^= 1 << (7 - k); st.count = 0; }, `Bit worth ${v}`);
      return { g, glow, lamp, knob, bit, val, x };
    });
    const decT = d.text(400, 450, '', { size: 34, fill: C.ink, weight: 400 });
    const sumT = d.text(400, 52, '', { size: 22, fill: C.ink2, mono: true });
    const chrG = d.g(S.layers.top, { opacity: 0 });
    const chrT = d.text(700, 450, '', { size: 44, fill: C.iris, weight: 500, parent: chrG });
    d.text(610, 452, 'as a letter:', { size: 16, fill: C.irisInk, mono: true, anchor: 'end', parent: chrG });

    const rdD = S.ui.readout({ label: 'Decimal', color: C.accent });
    const rdH = S.ui.readout({ label: 'Hex', color: C.ink });
    const cntT = S.ui.toggle({ label: 'Count', value: false, onChange: (on) => (st.count = on ? 1 : 0) });
    S.ui.button({ label: 'Clear', icon: 'rotate-ccw', onClick: () => { st.n = 0; cntT.set(false); } });

    S.onTick((dt) => {
      if (st.count) { st.t += dt; if (st.t > 0.35) { st.t = 0; st.n = (st.n + 1) & 255; } }
      const bits = [];
      sw.forEach((s, k) => {
        const on = (st.n >> (7 - k)) & 1;
        bits.push(on);
        const visible = st.show >= 1 || k === 7;
        s.g.setAttribute('opacity', visible ? 1 : 0.12);
        s.glow.setAttribute('opacity', on ? 0.8 : 0);
        s.lamp.setAttribute('opacity', on ? 0.85 : 0);
        S.at(s.knob, 0, on ? 218 : 266);
        s.bit.textContent = String(on);
        s.bit.setAttribute('fill', on ? C.accentInk : C.muted);
        s.val.setAttribute('opacity', st.vals.toFixed(2));
      });
      const parts = VAL.filter((v, k) => bits[k]);
      sumT.textContent = st.sum > 0.5 ? (parts.length ? `${parts.join(' + ')} = ${st.n}` : '0') : '';
      decT.textContent = st.show >= 1 ? `${bits.join('')} = ${st.n}` : `${bits[7]}`;
      rdD.set(String(st.n)); rdH.set(`0x${st.n.toString(16).toUpperCase().padStart(2, '0')}`);
      chrG.setAttribute('opacity', st.chr.toFixed(2));
      chrT.textContent = st.n >= 33 && st.n <= 126 ? `“${String.fromCharCode(st.n)}”` : '–';
    }, { essential: true });

    return {
      step(i) {
        cntT.set(false);
        S.to(st, { vals: i >= 2 ? 1 : 0, sum: i >= 3 ? 1 : 0, chr: i === 5 ? 1 : 0 }, 0.5);
        st.show = i === 0 ? 0 : 1;
        if (i === 0) { st.n = 1; S.play(async (w) => { for (let k = 0; k < 4; k++) { await w(0.9); await S.hand.tap(sw[7].x, 260); st.n ^= 1; } await w(0.3); S.hand.hide(); }); }
        if (i === 1) st.n = 0b10110010;
        if (i === 2) st.n = 0b00001111;
        if (i === 3) { st.n = 0b00101101; S.play(async (w) => { await w(1); await S.hand.tap(sw[1].x, 260); st.n ^= 64; await w(0.4); S.hand.hide(); }); }
        if (i === 4) { st.n = 0; cntT.set(true); }
        if (i === 5) st.n = 65;
      },
    };
  },
});
