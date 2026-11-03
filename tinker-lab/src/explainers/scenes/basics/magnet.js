// Magnets, motors and generators: Oersted's compasses, an electromagnet, a DC motor end-on, a hand-cranked generator.
import { scene, clamp } from '../../engine.js';
import { wire, battery, led, panel } from '../../kit.js';

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'Compasses around a wire, an electromagnet, a motor and a generator',
  steps: [
    'Current in a wire makes an invisible magnetic field around it.',
    'Coil the wire: the fields add up, like a bar magnet.',
    'A motor: the magnets push one side of the coil up, the other down.',
    'Every half turn the commutator flips the current, so it keeps turning.',
    'A generator is a motor in reverse: turn it to make electricity.',
    'Turn faster: more voltage, and the LED glows brighter.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { oe: 1, em: 0, mo: 0, gen: 0, cur: 0, comm: 0, crank: 0, ang: 0, spin: 0 };

    // ---------- A. compasses around a wire (current out of the page)
    const oG = d.g();
    const OX = 400, OY = 250;
    const needles = [];
    const ringG = d.g(oG, { opacity: 0 });
    d.into(oG, () => {
      d.into(ringG, () => { for (const r of [60, 150, 210]) d.circle(OX, OY, r * 2, { stroke: C.iris, strokeWidth: 1.5, fill: 'none', strokeLineDash: [6, 8], roughness: 0.6 }); });
      d.circle(OX, OY, 46, { fill: C.copperSoft, stroke: C.copper, strokeWidth: 3 });
      d.circle(OX, OY, 10, { fill: C.ink, stroke: 'none' });
      d.text(OX, OY + 50, 'wire, seen end-on', { size: 15, fill: C.muted, mono: true });
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, x = OX + Math.cos(a) * 140, y = OY + Math.sin(a) * 140;
        d.circle(x, y, 50, { fill: '#fff', stroke: C.ink, strokeWidth: 1.8 });
        const n = d.g(oG);
        d.into(n, () => { d.poly([[x, y - 20], [x - 6, y], [x + 6, y]], { fill: C.accent, stroke: 'none', roughness: 0.3 }); d.poly([[x, y + 20], [x - 6, y], [x + 6, y]], { fill: C.ink2, stroke: 'none', roughness: 0.3 }); });
        needles.push({ n, x, y, a, cur: 0 });
      }
    });
    const oLab = d.text(OX, 30, '', { size: 18, fill: C.ink2, mono: true, parent: oG });

    // ---------- B. electromagnet: a coil on an iron nail with field lines
    const eG = d.g(undefined, { opacity: 0 });
    d.into(eG, () => {
      for (const s of [1, 2]) {
        const h = 70 + s * 50;
        d.path(`M520 250 C 560 ${250 - h} , 240 ${250 - h}, 280 250`, { stroke: C.iris, strokeWidth: 1.6, fill: 'none', roughness: 0.6 });
        d.path(`M520 250 C 560 ${250 + h} , 240 ${250 + h}, 280 250`, { stroke: C.iris, strokeWidth: 1.6, fill: 'none', roughness: 0.6 });
      }
      d.rect(250, 236, 300, 28, { fill: '#b9bcc2', stroke: C.ink, strokeWidth: 2 });
      for (let i = 0; i < 12; i++) d.ellipse(290 + i * 20, 250, 16, 64, { stroke: C.copper, strokeWidth: 4, fill: 'none', roughness: 0.4 });
      d.text(230, 250, 'S', { size: 34, fill: C.blue, weight: 500 });
      d.text(572, 250, 'N', { size: 34, fill: C.accent, weight: 500 });
      d.text(400, 330, 'copper coil on an iron nail', { size: 18, fill: C.muted, mono: true });
      wire(S, [[290, 282], [290, 400], [340, 400]], { parent: eG, color: C.copper });
      wire(S, [[510, 282], [510, 400], [470, 400]], { parent: eG, color: C.copper });
      battery(S, 405, 400, { len: 120, h: 40, parent: eG, flip: true });
    });

    // ---------- C. motor / generator, seen along the shaft
    const mG = d.g(undefined, { opacity: 0 });
    const MX = 360, MY = 250, MR = 110;
    let coilG, sideA, sideB, fA, fB, comm, crankG, hint;
    d.into(mG, () => {
      d.rect(110, 130, 80, 240, { fill: C.accent, stroke: C.ink, roughness: 0.6 });
      d.text(150, 250, 'N', { size: 44, fill: '#fff', weight: 500 });
      d.rect(530, 130, 80, 240, { fill: C.blue, stroke: C.ink, roughness: 0.6 });
      d.text(570, 250, 'S', { size: 44, fill: '#fff', weight: 500 });
      for (const y of [160, 210, 290, 340]) d.arrow(200, y, 520, y, { stroke: C.iris, strokeWidth: 1.3, head: 9, roughness: 0.4, opacity: 0.55 });
      d.text(MX, 112, 'magnetic field', { size: 15, fill: C.irisInk, mono: true });
    });
    coilG = d.g(mG);
    d.into(coilG, () => d.line(MX - MR, MY, MX + MR, MY, { stroke: C.copper, strokeWidth: 7, roughness: 0.3 }));
    sideA = d.g(mG); sideB = d.g(mG);
    const symA = d.text(0, 0, '', { size: 22, fill: '#fff', weight: 500, parent: mG });
    const symB = d.text(0, 0, '', { size: 22, fill: '#fff', weight: 500, parent: mG });
    d.into(sideA, () => d.circle(0, 0, 40, { fill: C.copper, stroke: C.ink, strokeWidth: 2 }));
    d.into(sideB, () => d.circle(0, 0, 40, { fill: C.copper, stroke: C.ink, strokeWidth: 2 }));
    mG.appendChild(symA); mG.appendChild(symB);
    fA = d.el('path', { stroke: C.accent, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, mG);
    fB = d.el('path', { stroke: C.accent, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, mG);
    // commutator (split ring) and brushes
    comm = d.g(mG);
    d.into(comm, () => {
      d.path(`M${MX} ${MY - 26} A26 26 0 0 1 ${MX} ${MY + 26}`, { stroke: '#c9a227', strokeWidth: 9, fill: 'none', roughness: 0.3 });
      d.path(`M${MX} ${MY + 26} A26 26 0 0 1 ${MX} ${MY - 26}`, { stroke: '#a88a1f', strokeWidth: 9, fill: 'none', roughness: 0.3 });
    });
    const commGlow = d.glow(MX, MY, 70, C.yellow, mG);
    d.into(mG, () => { d.rect(MX - 52, MY - 7, 20, 14, { fill: C.ink2, stroke: 'none' }); d.rect(MX + 32, MY - 7, 20, 14, { fill: C.ink2, stroke: 'none' }); });
    const commLab = d.text(MX, MY + 64, 'commutator', { size: 15, fill: '#8a6d12', mono: true, parent: mG });
    // crank for the generator
    crankG = d.g(mG, { opacity: 0 });
    let crankArm;
    d.into(crankG, () => {
      crankArm = d.g(crankG);
      d.into(crankArm, () => { d.line(MX, MY, MX, MY - 150, { stroke: C.ink2, strokeWidth: 8, roughness: 0.3 }); d.circle(MX, MY - 150, 34, { fill: C.accent, stroke: C.ink, strokeWidth: 2 }); });
    });
    hint = d.text(MX, 470, 'drag the red handle round and round', { size: 15, fill: C.muted, mono: true, opacity: 0 });
    const crankHit = d.el('circle', { cx: MX, cy: MY, r: 190, fill: 'transparent' }, crankG);
    let lastA = null, dragW = 0;
    S.drag(crankHit, {
      start: () => { lastA = null; },
      move: (x, y) => { const a = Math.atan2(y - MY, x - MX); if (lastA != null) { let da = a - lastA; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; st.ang += Math.abs(da); dragW += Math.abs(da); } lastA = a; },
      end: () => { lastA = null; },
    });
    // output: LED and wires from the brushes
    const outG = d.g(mG, { opacity: 0 });
    const L1 = led(S, 690, 170, { color: C.accent, size: 1.3, leg: 40, parent: outG });
    d.into(outG, () => {
      wire(S, [[MX + 52, MY], [MX + 60, MY], [MX + 60, 440], [L1.cathode[0], 440], L1.cathode], { parent: outG });
      wire(S, [[MX - 52, MY], [MX - 70, MY], [MX - 70, 470], [L1.anode[0], 470], L1.anode], { parent: outG });
      panel(S, 630, 330, 150, 80, { parent: outG });
    });
    const vT = d.text(705, 380, '', { size: 26, fill: C.ink, mono: true, weight: 500, parent: outG });
    const batG = d.g(mG, { opacity: 0 });
    d.into(batG, () => {
      wire(S, [[MX + 52, MY], [MX + 60, MY], [MX + 60, 440], [460, 440]], { parent: batG });
      wire(S, [[MX - 52, MY], [MX - 70, MY], [MX - 70, 440], [340, 440]], { parent: batG });
      battery(S, 400, 440, { len: 110, h: 38, parent: batG, flip: true });
    });

    const curT = S.ui.toggle({ label: 'Current', value: false, onChange: (on) => S.to(st, { cur: on ? 1 : 0 }, 0.8) });
    const spd = S.ui.slider({ label: 'Turns/s', min: 0, max: 3, step: 0.1, value: 0, format: (v) => v.toFixed(1), onInput: (v) => (st.crank = v) }).show(false);
    const rdV = S.ui.readout({ label: 'Voltage', color: C.accent }).show(false);

    let w = 0, Vs = 0;
    S.onTick((dt, t) => {
      oG.setAttribute('opacity', st.oe.toFixed(3));
      ringG.setAttribute('opacity', (st.cur * 0.8).toFixed(3));
      for (const nd of needles) {
        // field circles anticlockwise around a current flowing towards you (right-hand rule)
        let deg = (nd.a * 180) / Math.PI; if (deg > 180) deg -= 360;
        nd.n.setAttribute('transform', `rotate(${(st.cur * deg).toFixed(1)} ${nd.x} ${nd.y})`);
      }
      oLab.textContent = st.cur > 0.5 ? 'current flows towards you: needles circle the wire' : 'no current: every needle points north';
      eG.setAttribute('opacity', st.em.toFixed(3));
      mG.setAttribute('opacity', st.mo.toFixed(3));
      crankG.setAttribute('opacity', st.gen.toFixed(3));
      crankG.style.pointerEvents = st.gen > 0.5 ? '' : 'none';
      outG.setAttribute('opacity', st.gen.toFixed(3));
      batG.setAttribute('opacity', (st.mo * (1 - st.gen)).toFixed(3));
      hint.setAttribute('opacity', st.gen.toFixed(3));
      // motor drive or crank
      if (st.gen > 0.5) {
        const fromDrag = dragW / Math.max(dt, 1e-3) / (Math.PI * 2);
        dragW = 0;
        const target = Math.max(st.crank, Math.min(4, fromDrag));
        w += (target - w) * Math.min(1, dt * (fromDrag > 0.05 ? 6 : 1.5));
        st.ang += w * Math.PI * 2 * dt * (fromDrag > 0.05 ? 0 : 1);
      } else if (st.spin) { w = 0.45; st.ang += w * Math.PI * 2 * dt; }
      const phi = -st.ang; // anticlockwise on screen
      const ax = MX + Math.cos(phi) * MR, ay = MY + Math.sin(phi) * MR, bx = MX - Math.cos(phi) * MR, by = MY - Math.sin(phi) * MR;
      coilG.setAttribute('transform', `rotate(${((phi * 180) / Math.PI).toFixed(2)} ${MX} ${MY})`);
      comm.setAttribute('transform', `rotate(${((phi * 180) / Math.PI).toFixed(2)} ${MX} ${MY})`);
      S.at(sideA, ax, ay); S.at(sideB, bx, by);
      // the commutator keeps the right-hand side "out of the page" (⊙), so it is pushed up
      const aRight = ax >= MX;
      symA.textContent = aRight ? '•' : '×'; symB.textContent = aRight ? '×' : '•';
      symA.setAttribute('x', ax); symA.setAttribute('y', ay + 1); symB.setAttribute('x', bx); symB.setAttribute('y', by + 1);
      const F = st.gen > 0.5 ? 0 : 46;
      fA.setAttribute('d', F ? `M${ax} ${ay} L${ax} ${ay + (aRight ? -F : F)}` : '');
      fB.setAttribute('d', F ? `M${bx} ${by} L${bx} ${by + (aRight ? F : -F)}` : '');
      const nearFlip = Math.abs(Math.cos(phi)) < 0.18;
      commGlow.setAttribute('opacity', (st.comm * (nearFlip ? 1 : 0.15)).toFixed(2));
      commLab.setAttribute('opacity', (0.4 + st.comm * 0.6).toFixed(2));
      S.at(crankArm, 0, 0); crankArm.setAttribute('transform', `rotate(${((phi * 180) / Math.PI + 90).toFixed(2)} ${MX} ${MY})`);
      // generator output: V ≈ 2 V per turn per second, rectified by the commutator
      const Vt = 2 * w * Math.abs(Math.cos(phi)) * 1.57;
      Vs += (Vt - Vs) * Math.min(1, dt * 10);
      L1.set(st.gen > 0.5 ? clamp((Vs - 1.8) / 3) : 0);
      vT.textContent = `${Vs.toFixed(1)} V`;
      rdV.set(`${Vs.toFixed(1)} V`);
    }, { essential: true });

    return {
      step(i) {
        curT.show(i === 0); spd.show(i >= 4); rdV.show(i >= 4);
        S.to(st, { oe: i === 0 ? 1 : 0, em: i === 1 ? 1 : 0, mo: i >= 2 ? 1 : 0, gen: i >= 4 ? 1 : 0, comm: i === 3 ? 1 : 0 }, 0.6);
        st.spin = i === 2 || i === 3 ? 1 : 0;
        if (i === 0) { curT.set(false); S.play(async (ww) => { await ww(0.9); await S.hand.press(curT.el); curT.set(true); await ww(0.4); S.hand.hide(); }); }
        if (i === 4) { spd.set(0); S.play(async (ww) => {
          await ww(0.7);
          const p = (k) => [MX + Math.cos(-st.ang - Math.PI / 2) * 150, MY + Math.sin(-st.ang - Math.PI / 2) * 150];
          await S.hand.move(...p());
          spd.set(1.2);
          for (let k = 0; k < 60; k++) { await ww(0.05); S.hand.show(...p()); }
          S.hand.hide();
        }); }
        if (i === 5) spd.set(2.5);
      },
    };
  },
});
