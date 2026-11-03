// LEDs and polarity: the diode as a one-way valve, LED anatomy and the series resistor.
import { scene, si, clamp } from '../../engine.js';
import { wire, led, resistor, pathOf, panel } from '../../kit.js';

const COLS = { red: 2.0, yellow: 2.1, blue: 3.1 };

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'An LED circuit beside a one-way valve',
  steps: [
    'A diode is a one-way valve for current.',
    'Forward: the flap swings open and current flows.',
    'Flip it around: the flap shuts. Nothing flows.',
    'An LED is a diode that gives off light as current flows.',
    'Long leg (anode) goes to +. Short leg and flat edge go to −.',
    'Always add a resistor: (5 V − 2 V) ÷ 220 Ω ≈ 14 mA.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { flip: 0, valve: 1, anat: 0, math: 0, labels: 0, col: 'red', on: 0 };
    const L = 60, R = 360, T = 160, B = 410, LX = 210;

    // --- left: 5 V supply, LED, resistor
    d.rect(150, B - 36, 120, 72, { fill: C.subtle, stroke: C.ink, roughness: 0.6 });
    d.text(210, B - 6, '5 V', { size: 26, fill: C.ink, mono: true, weight: 500 });
    d.text(210, B + 20, 'supply', { size: 15, fill: C.muted, mono: true });
    d.circle(150, B, 18, { fill: C.accent }); d.circle(270, B, 18, { fill: C.ink });
    d.text(130, B - 30, '+', { size: 26, fill: C.accentInk, weight: 500 });
    d.text(290, B - 30, '−', { size: 26, fill: C.ink, weight: 500 });
    wire(S, [[141, B], [L, B], [L, T], [LX - 30, T]]);
    wire(S, [[LX + 30, T], [R, T], [R, 220]]);
    const res = resistor(S, R, 270, { vertical: true, len: 70, lead: 18, bands: ['red', 'red', 'brown', 'gold'] });
    wire(S, [[R, 324], [R, B], [279, B]]);
    // the LED sits in a little socket; flipping mirrors it
    const ledG = d.g();
    const LED = led(S, LX, 92, { color: C.accent, leg: 22, parent: ledG });
    d.into(ledG, () => {
      wire(S, [[LX - 9, T - 2], [LX - 9, T], [LX - 30, T]], { parent: ledG, r: 0 });
      wire(S, [[LX + 9, T - 14], [LX + 9, T], [LX + 30, T]], { parent: ledG, r: 0 });
    });
    const legLab = d.g(S.layers.top);
    const aLab = d.text(LX - 56, T - 40, '+ long', { size: 15, fill: C.accentInk, mono: true, parent: legLab });
    const kLab = d.text(LX + 56, T - 40, '− short', { size: 15, fill: C.ink, mono: true, parent: legLab });
    const fl = S.flow(pathOf([[141, B], [L, B], [L, T], [R, T], [R, B], [279, B]]), { gap: 34, r: 6, speed: 70, parent: S.layers.back, color: C.accent });
    d.text(L + 14, 300, 'current', { size: 15, fill: C.accentInk, mono: true, anchor: 'start' });
    d.arrow(L + 10, 330, L + 10, 260, { stroke: C.accent, strokeWidth: 2, head: 9 });
    const flipB = S.ui.button({ label: 'Flip the LED', icon: 'repeat', onClick: () => S.to(st, { flip: st.flip > 0.5 ? 0 : 1 }, 0.6) });
    const colC = S.ui.choice({ label: 'LED', options: [['red', 'Red'], ['yellow', 'Yellow'], ['blue', 'Blue']], value: 'red', onChange: (v) => (st.col = v) }).show(false);
    const rdI = S.ui.readout({ label: 'Current', color: C.accent });

    // --- right A: the valve analogy
    const vG = d.g();
    let flap, wdots = [];
    d.into(vG, () => {
      panel(S, 420, 50, 360, 300, { parent: vG });
      d.rect(450, 170, 300, 60, { fill: '#e6edff', stroke: '#7b8db8', strokeWidth: 3, roughness: 0.6 });
      d.line(600, 170, 600, 186, { stroke: C.ink, strokeWidth: 4 });
      flap = d.g(vG);
      d.into(flap, () => d.rect(596, 170, 8, 58, { fill: C.ink, stroke: C.ink, roughness: 0.3 }));
      d.circle(600, 172, 10, { fill: C.ink });
      d.path('M600 230 L612 238 L600 246', { stroke: C.ink2, strokeWidth: 1.6, fill: 'none' });
      for (let i = 0; i < 9; i++) wdots.push(d.el('circle', { r: 6, fill: C.blue }, vG));
      d.text(600, 90, 'one-way flap valve', { size: 20, fill: C.ink2 });
      // the diode symbol, same direction
      d.poly([[560, 280], [560, 320], [600, 300]], { fill: C.ink, roughness: 0.3 });
      d.line(602, 278, 602, 322, { strokeWidth: 4, roughness: 0.3 });
      d.line(500, 300, 560, 300, { strokeWidth: 3 }); d.line(602, 300, 700, 300, { strokeWidth: 3 });
      d.text(600, 338, 'diode symbol: flows towards the bar', { size: 15, fill: C.muted, mono: true });
    });

    // --- right B: big LED anatomy
    const aG = d.g(undefined, { opacity: 0 });
    const BIG = led(S, 610, 150, { color: C.accent, size: 2.5, leg: 30, parent: aG });
    const photons = [];
    d.into(aG, () => {
      d.line(590, 210, 590, 150, { stroke: '#8e9097', strokeWidth: 4 }); // anode post
      d.path('M622 210 L622 150 L652 150 L646 140 L622 140', { stroke: '#8e9097', strokeWidth: 4, fill: 'none' }); // cathode anvil
      d.rect(626, 132, 14, 8, { fill: C.yellow, stroke: C.ink, strokeWidth: 1, roughness: 0.2 }); // the chip (die)
      d.path('M592 150 q20 -30 40 -16', { stroke: C.ink2, strokeWidth: 1.2, fill: 'none' });
      for (let i = 0; i < 5; i++) photons.push(d.el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, aG));
    });
    const anatLab = d.g(S.layers.top, { opacity: 0 });
    d.into(anatLab, () => {
      d.text(520, 360, 'anode +', { size: 20, fill: C.accentInk, weight: 500 });
      d.text(520, 384, 'long leg', { size: 15, fill: C.muted, mono: true });
      d.text(716, 320, 'cathode −', { size: 20, fill: C.ink, weight: 500 });
      d.text(716, 344, 'short leg, flat rim', { size: 15, fill: C.muted, mono: true });
      d.line(548, 346, 584, 306, { stroke: C.muted, strokeWidth: 1.3 });
      d.line(684, 312, 640, 280, { stroke: C.muted, strokeWidth: 1.3 });
      d.text(700, 120, 'the light comes from', { size: 15, fill: C.muted, mono: true, anchor: 'start' });
      d.text(700, 140, 'a tiny chip inside', { size: 15, fill: C.muted, mono: true, anchor: 'start' });
    });

    // --- right C: the resistor sum
    const mG = d.g(undefined, { opacity: 0 });
    const mT = d.text(600, 200, '', { size: 24, fill: C.ink, mono: true });
    const mT2 = d.text(600, 250, '', { size: 18, fill: C.ink2, mono: true });
    d.into(mG, () => {
      panel(S, 420, 120, 360, 200, { parent: mG });
      d.text(600, 150, 'resistor = leftover volts ÷ current', { size: 16, fill: C.muted, mono: true });
      d.text(600, 290, 'no resistor? far too much current: pop!', { size: 15, fill: C.accentInk, mono: true });
    });
    mG.appendChild(mT); mG.appendChild(mT2);

    S.onTick((dt, t) => {
      const f = st.flip;
      ledG.setAttribute('transform', `translate(${LX} 0) scale(${(1 - 2 * f).toFixed(3)} 1) translate(${-LX} 0)`);
      aLab.setAttribute('x', f > 0.5 ? LX + 56 : LX - 56); kLab.setAttribute('x', f > 0.5 ? LX - 56 : LX + 56);
      const Vf = COLS[st.col];
      const forward = f < 0.5;
      const I = forward ? (5 - Vf) / 220 : 0;
      const colour = st.col === 'red' ? C.accent : st.col === 'yellow' ? C.yellow : C.blue;
      LED.set(clamp(I / 0.014));
      fl.set(forward);
      rdI.set(si(I, 'A'));
      // valve
      vG.setAttribute('opacity', st.valve.toFixed(3));
      flap.setAttribute('transform', `rotate(${forward && st.on ? -78 : 0} 600 172)`);
      wdots.forEach((w, i) => {
        const x = forward && st.on ? 455 + (((i / 9) + t * 0.25) % 1) * 290 : 455 + (i / 9) * 140;
        w.setAttribute('cx', x.toFixed(1)); w.setAttribute('cy', 200 + Math.sin(i * 2.3) * 12);
      });
      // anatomy
      aG.setAttribute('opacity', st.anat.toFixed(3));
      anatLab.setAttribute('opacity', st.labels.toFixed(3));
      BIG.set(st.anat > 0.5 ? 1 : 0);
      photons.forEach((p, i) => {
        const ph = (t * 0.7 + i / 5) % 1, a = -2.4 + i * 0.45, r0 = 40 + ph * 90;
        const x = 633 + Math.cos(a) * r0, y = 120 + Math.sin(a) * r0;
        p.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)} q${(Math.cos(a + 1.2) * 6).toFixed(1)} ${(Math.sin(a + 1.2) * 6).toFixed(1)} ${(Math.cos(a) * 14).toFixed(1)} ${(Math.sin(a) * 14).toFixed(1)}`);
        p.setAttribute('opacity', (Math.sin(ph * Math.PI) * st.anat).toFixed(2));
      });
      mG.setAttribute('opacity', st.math.toFixed(3));
      mT.textContent = `(5 V − ${Vf.toFixed(1)} V) ÷ 220 Ω`;
      mT2.textContent = `= ${si((5 - Vf) / 220, 'A')}  (${st.col} LED ≈ ${Vf.toFixed(1)} V)`;
      if (colour !== st.lastCol) { st.lastCol = colour; LED.setColor(colour); }
    }, { essential: true });

    return {
      step(i) {
        flipB.show(i <= 2 || i === 5);
        colC.show(i === 5);
        if (i !== 5) colC.set('red');
        S.to(st, { valve: i <= 2 ? 1 : 0, anat: i === 3 || i === 4 ? 1 : 0, labels: i === 4 ? 1 : 0, math: i === 5 ? 1 : 0, on: i === 0 ? 0 : 1 }, 0.5);
        if (i !== 2) S.to(st, { flip: 0 }, 0.4);
        if (i === 2) { st.flip = 0; S.play(async (w) => { await w(0.8); await S.hand.press(flipB.el); S.to(st, { flip: 1 }, 0.6); await w(0.6); S.hand.hide(); }); }
      },
    };
  },
});
