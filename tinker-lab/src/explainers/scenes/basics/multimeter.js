// Measuring with a multimeter: volts in parallel, amps in series, ohms out of circuit, continuity beep.
import { scene } from '../../engine.js';
import { wire, battery, resistor, led, pathOf } from '../../kit.js';

const MODES = [['V', 'V'], ['mA', 'mA'], ['ohm', 'Ω'], ['beep', 'Beep']];
const WHERE = [['battery', 'Battery'], ['resistor', 'Resistor'], ['series', 'In series'], ['alone', 'Alone'], ['wire', 'Wire']];
const ANG = { V: -140, mA: -90, ohm: -40, beep: 10 };

function reading(mode, where) {
  // 9 V battery, 470 Ω resistor, red LED ≈ 2 V → I = 7 V ÷ 470 Ω ≈ 14.9 mA
  const powered = where !== 'alone' && where !== 'wire';
  if (mode === 'V') return { battery: ['9.00', 'V', 'ok'], resistor: ['7.00', 'V', 'ok'], series: ['', '', 'For volts, touch across a part.'], alone: ['0.00', 'V', 'No battery, no volts.'], wire: ['0.00', 'V', 'A wire has (almost) no volts across it.'] }[where];
  if (mode === 'mA') return { battery: ['FUSE', '', 'Never! Across a battery the meter is a short circuit.'], resistor: ['', '', 'Wrong: amps must flow through the meter, in series.'], series: ['14.9', 'mA', 'ok'], alone: ['0.0', 'mA', 'Nothing flows here.'], wire: ['', '', 'Wrong: break the loop and go in series.'] }[where];
  if (mode === 'ohm') return powered ? ['', '', 'Power off first: ohms need a dead circuit.'] : where === 'alone' ? ['470', 'Ω', 'ok'] : ['0.2', 'Ω', 'ok'];
  return powered ? ['', '', 'Power off first.'] : where === 'wire' ? ['0.2', 'Ω', 'beep'] : ['470', 'Ω', 'No beep: 470 Ω is not a connection.'];
}

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A multimeter measuring a battery, resistor and LED circuit',
  steps: [
    'A multimeter measures volts, amps and ohms. Turn the dial to choose.',
    'Volts: touch the probes across a part, side by side.',
    'Amps: open the loop so the current flows through the meter.',
    'Ohms: take the part out, power off, then measure it.',
    'Continuity: it beeps when two points are connected.',
    'Your turn: choose a mode and a place to measure.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { mode: 'V', where: 'resistor', dial: ANG.V, gap: 0, lift: 0 };
    // ---------- the meter
    d.shadow(155, 470, 220);
    d.rect(40, 36, 230, 424, { fill: C.yellow, stroke: C.ink, strokeWidth: 2.4, roughness: 0.6 });
    d.rect(56, 52, 198, 392, { fill: '#2a2b31', stroke: 'none', roughness: 0.4 });
    d.rect(70, 66, 170, 84, { fill: '#cfd8c4', stroke: C.ink, strokeWidth: 1.6, roughness: 0.4 });
    const lcd = d.text(222, 108, '', { size: 40, fill: '#1d2219', mono: true, weight: 500, anchor: 'end' });
    const unit = d.text(226, 132, '', { size: 16, fill: '#1d2219', mono: true, anchor: 'end' });
    const DX = 155, DY = 270;
    d.circle(DX, DY, 150, { fill: '#3a3c44', stroke: '#111', strokeWidth: 2 });
    for (const [m, lab] of MODES) {
      const a = (ANG[m] * Math.PI) / 180;
      d.text(DX + Math.cos(a) * 96, DY + Math.sin(a) * 96, lab === 'Beep' ? '•)))' : lab, { size: 17, fill: '#fff', mono: true, weight: 500 });
    }
    const dial = d.g();
    d.into(dial, () => { d.circle(DX, DY, 104, { fill: '#18191d', stroke: '#000', strokeWidth: 2 }); d.line(DX, DY, DX + 58, DY, { stroke: '#fff', strokeWidth: 6, roughness: 0.3 }); });
    const sockets = { COM: [100, 404], V: [155, 404], mA: [210, 404] };
    for (const [k, [x, y]] of Object.entries(sockets)) { d.circle(x, y, 26, { fill: '#111', stroke: k === 'COM' ? '#888' : C.accent, strokeWidth: 3 }); d.text(x, y + 30, k === 'V' ? 'VΩ' : k, { size: 13, fill: '#fff', mono: true }); }
    S.tap(dial, () => { const i = MODES.findIndex(([m]) => m === st.mode); modeC.set(MODES[(i + 1) % 4][0]); }, 'Turn the dial');

    // ---------- the circuit
    const L = 390, R = 750, T = 130, B = 410;
    const bat = battery(S, 570, B, { len: 140, h: 48, label: '9 V', flip: true });
    const resG = d.g();
    const res = resistor(S, 480, T, { len: 76, lead: 18, bands: ['yellow', 'violet', 'brown', 'gold'], parent: resG });
    const LED = led(S, 640, 62, { color: C.accent, leg: 24 });
    wire(S, [bat.plus, [L, B], [L, T], res.a]);
    wire(S, [res.b, [631, T], [631, T - 2]]);
    wire(S, [[649, T - 14], [649, T], [R, T], [R, 250]]);
    const gapG = d.g();
    wire(S, [[R, 250], [R, 290]], { parent: gapG });
    wire(S, [[R, 290], [R, B], bat.minus]);
    const holeG = d.g(undefined, { opacity: 0 });
    d.into(holeG, () => { d.circle(R, 250, 10, { fill: C.ink }); d.circle(R, 290, 10, { fill: C.ink }); });
    const fl = S.flow(pathOf([bat.minus, [R, B], [R, T], [L, T], [L, B], bat.plus]), { gap: 34, r: 6, speed: 70, parent: S.layers.back });
    // probes
    const leadR = d.el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 5, 'stroke-linecap': 'round' }, S.layers.top);
    const leadB = d.el('path', { fill: 'none', stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round' }, S.layers.top);
    const tipR = d.g(S.layers.top), tipB = d.g(S.layers.top);
    d.into(tipR, () => d.path('M0 0 L-5 -14 L-8 -52 L8 -52 L5 -14 Z', { fill: C.accent, stroke: C.ink, strokeWidth: 1.6, roughness: 0.4 }));
    d.into(tipB, () => d.path('M0 0 L-5 -14 L-8 -52 L8 -52 L5 -14 Z', { fill: C.ink, stroke: C.ink, strokeWidth: 1.6, roughness: 0.4 }));
    const msg = d.text(570, 470, '', { size: 17, fill: C.accentInk, mono: true });
    const beep = [0, 1, 2].map(() => d.el('path', { fill: 'none', stroke: C.green, 'stroke-width': 3, 'stroke-linecap': 'round' }, S.layers.fx));
    const pos = (w) => ({
      battery: [bat.plus, bat.minus], resistor: [[res.a[0] + 6, T], [res.b[0] - 6, T]], series: [[R, 250], [R, 290]],
      alone: [[res.a[0] + 6, 300 - 0], [res.b[0] - 6, 300]], wire: [[L, 200], [L, 340]],
    }[w]);

    const modeC = S.ui.choice({ options: MODES, value: 'V', onChange: (v) => (st.mode = v) });
    const whereC = S.ui.choice({ options: WHERE, value: 'resistor', onChange: (v) => (st.where = v) });

    let cur = { r: [500, 300], b: [560, 300] };
    S.onTick((dt, t) => {
      st.dial += (ANG[st.mode] - st.dial) * Math.min(1, dt * 10);
      dial.setAttribute('transform', `rotate(${st.dial.toFixed(1)} ${DX} ${DY})`);
      const gapT = st.where === 'series' ? 1 : 0, liftT = st.where === 'alone' ? 1 : 0;
      st.gap += (gapT - st.gap) * Math.min(1, dt * 8); st.lift += (liftT - st.lift) * Math.min(1, dt * 6);
      gapG.setAttribute('opacity', (1 - st.gap).toFixed(2)); holeG.setAttribute('opacity', st.gap.toFixed(2));
      resG.setAttribute('transform', `translate(0 ${(st.lift * 170).toFixed(1)})`);
      const powered = st.where !== 'alone';
      const closed = powered && (st.where !== 'series' || st.mode === 'mA');
      LED.set(closed ? 0.8 : 0); fl.set(closed);
      const [pr, pb] = pos(st.where);
      for (const k of ['r', 'b']) { const tgt = k === 'r' ? pr : pb; cur[k] = [cur[k][0] + (tgt[0] - cur[k][0]) * Math.min(1, dt * 7), cur[k][1] + (tgt[1] - cur[k][1]) * Math.min(1, dt * 7)]; }
      S.at(tipR, cur.r[0], cur.r[1], -18); S.at(tipB, cur.b[0], cur.b[1], 18);
      const sR = st.mode === 'mA' ? sockets.mA : sockets.V, sB = sockets.COM;
      const curve = (s, p, bend) => `M${s[0]} ${s[1]} C ${s[0] + 40} ${s[1] + 120 + bend}, ${p[0] - 60} ${p[1] + 120}, ${p[0] + (p === cur.r ? 16 : -16)} ${p[1] - 50}`;
      leadR.setAttribute('d', curve(sR, cur.r, 0)); leadB.setAttribute('d', curve(sB, cur.b, 30));
      const [val, u, note] = reading(st.mode, st.where);
      lcd.textContent = val || '– – –'; unit.textContent = u;
      lcd.setAttribute('fill', val === 'FUSE' ? C.accentInk : '#1d2219');
      msg.textContent = note === 'ok' || note === 'beep' ? '' : note;
      const b = note === 'beep';
      beep.forEach((p, i) => {
        const r = 26 + i * 14 + ((t * 30) % 14);
        p.setAttribute('d', b ? `M${240 + i * 0} ${60 - r * 0.2} m${r * 0.3} 0 a${r} ${r} 0 0 1 0 ${r * 0.9}` : '');
        p.setAttribute('opacity', b ? (0.9 - i * 0.25).toFixed(2) : 0);
      });
    }, { essential: true });

    const set = (m, w) => { modeC.set(m); whereC.set(w); };
    return {
      step(i) {
        if (i === 0) { set('V', 'battery'); S.play(async (w) => { for (const m of ['mA', 'ohm', 'beep', 'V']) { await w(0.8); await S.hand.tap(DX + 30, DY - 10); modeC.set(m); } await w(0.3); S.hand.hide(); }); }
        if (i === 1) set('V', 'resistor');
        if (i === 2) set('mA', 'series');
        if (i === 3) set('ohm', 'alone');
        if (i === 4) set('beep', 'wire');
      },
    };
  },
});
