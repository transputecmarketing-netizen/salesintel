// Open and closed circuits: a loop, a switch, a loose wire, a short circuit and a push button.
import { scene } from '../../engine.js';
import { wire, battery, bulb, knife, pathOf } from '../../kit.js';

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A battery, bulb and switch in a loop',
  steps: [
    'A circuit is a loop: out of the battery and back again.',
    'Open the switch: the loop breaks and everything stops.',
    'Close it again: the bulb lights at once.',
    'A gap anywhere breaks the loop. Tap the loose wire to fix it.',
    'Short circuit: a path with no bulb. Huge current, hot wire!',
    'A push button only connects while you hold it down.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { closed: 1, loose: 0, short: 0, button: 0, pressed: 0, lit: 0, heat: 0 };
    const L = 120, R = 680, T = 150, B = 390;

    const bat = battery(S, 400, B, { label: '4.5 V', len: 140 });
    const bl = bulb(S, 300, 82, { r: 38 });
    // wires
    wire(S, [[L + 110, B], [L, B], [L, T], [bl.left[0], T], bl.left]);
    wire(S, [bl.right, [bl.right[0], T], [500, T]]);
    wire(S, [[590, T], [R, T], [R, B], bat.plus]);
    const looseG = d.g();
    wire(S, [[L + 110, B], bat.minus], { parent: looseG });
    const looseEnd = d.el('circle', { cx: bat.minus[0] - 6, cy: B, r: 7, fill: C.ink }, looseG);
    S.tap(looseG, () => { if (st.loose > 0.5) S.to(st, { loose: 0 }, 0.4); }, 'Reconnect the loose wire');
    // the switch, or a push button in the same place
    const sw = knife(S, 500, T, 90);
    S.tap(sw.hit, () => { if (!st.button) S.to(st, { closed: st.closed > 0.5 ? 0 : 1 }, 0.35); }, 'Toggle the switch');
    const pb = d.g(undefined, { opacity: 0 });
    let cap;
    d.into(pb, () => {
      d.rect(498, T - 6, 94, 34, { fill: C.subtle2, stroke: C.ink, strokeWidth: 2, roughness: 0.5 });
      d.circle(508, T, 12, { fill: '#fff' }); d.circle(582, T, 12, { fill: '#fff' });
      cap = d.g(pb);
      d.into(cap, () => {
        d.line(504, T - 18, 586, T - 18, { strokeWidth: 4.5, roughness: 0.4 });
        d.rect(530, T - 56, 30, 38, { fill: C.accent, stroke: C.ink, strokeWidth: 2 });
      });
    });
    const pbHit = d.el('rect', { x: 496, y: T - 70, width: 100, height: 100, fill: 'transparent' }, pb);
    S.drag(pbHit, { start: () => { st.pressed = 1; }, end: () => { st.pressed = 0; }, cursor: 'pointer' });
    // the short circuit wire, straight across the battery
    const shortG = d.g(undefined, { opacity: 0 });
    let hotWire;
    d.into(shortG, () => {
      hotWire = d.el('path', { d: pathOf([bat.minus, [bat.minus[0], B + 60], [bat.plus[0], B + 60], bat.plus]), stroke: C.ink, 'stroke-width': 4, fill: 'none', 'stroke-linejoin': 'round' });
      d.text(400, B + 88, 'never do this: the battery and wire get dangerously hot', { size: 17, fill: C.accentInk, mono: true });
    });
    const heat = d.glow(400, B + 50, 120, C.accent);

    const loop = pathOf([bat.minus, [L, B], [L, T], [bl.left[0], T], [bl.right[0], T], [R, T], [R, B], bat.plus]);
    const fl = S.flow(loop, { gap: 34, r: 6.5, speed: 70, parent: S.layers.back });
    const sfl = S.flow(pathOf([bat.minus, [bat.minus[0], B + 60], [bat.plus[0], B + 60], bat.plus]), { gap: 18, r: 5.5, speed: 420, on: false });

    const lab = d.text(300, 20, '', { size: 20, fill: C.ink2, mono: true });
    S.onTick((dt, t) => {
      S.at(looseG, 0, 0);
      looseG.setAttribute('transform', `rotate(${(-st.loose * 22).toFixed(2)} ${L + 110} ${B})`);
      looseEnd.setAttribute('opacity', st.loose > 0.05 ? 1 : 0);
      sw.g.setAttribute('opacity', (1 - st.button).toFixed(3));
      pb.setAttribute('opacity', st.button.toFixed(3));
      pb.style.pointerEvents = st.button > 0.5 ? '' : 'none';
      sw.g.style.pointerEvents = st.button > 0.5 ? 'none' : '';
      sw.set(st.closed);
      S.at(cap, 0, st.pressed * 16);
      const closed = st.button > 0.5 ? st.pressed > 0.5 : st.closed > 0.95;
      const ok = closed && st.loose < 0.05;
      const shorted = ok && st.short > 0.5;
      bl.set(ok && !shorted ? 1 : 0);
      fl.set(ok && !shorted);
      sfl.set(shorted);
      shortG.setAttribute('opacity', st.short.toFixed(3));
      const h = shorted ? 0.7 + 0.3 * Math.sin(t * 9) : 0;
      heat.setAttribute('opacity', h.toFixed(3));
      hotWire.setAttribute('stroke', shorted ? C.accent : C.ink);
      lab.textContent = shorted ? 'all the current skips the bulb' : ok ? 'closed loop: current flows' : 'open loop: no current';
      lab.setAttribute('fill', ok && !shorted ? C.green : C.accentInk);
    }, { essential: true });

    const tapSwitch = (w, to) => S.play(async (ww) => { await ww(0.7); await S.hand.tap(545, T - 14); S.to(st, { closed: to }, 0.35); await ww(0.5); S.hand.hide(); });
    return {
      step(i) {
        const base = { loose: 0, short: 0, button: 0, pressed: 0 };
        if (i === 0) S.to(st, { ...base, closed: 1 }, 0.4);
        if (i === 1) { S.to(st, { ...base, closed: 1 }, 0.3); tapSwitch(null, 0); }
        if (i === 2) { S.to(st, { ...base, closed: 0 }, 0.3); tapSwitch(null, 1); }
        if (i === 3) { S.to(st, { ...base, closed: 1 }, 0.3); S.play(async (w) => { await w(0.8); await S.to(st, { loose: 1 }, 0.5, { ease: 'back' }); }); }
        if (i === 4) { S.to(st, { ...base, closed: 1 }, 0.3); S.play(async (w) => { await w(0.6); await S.to(st, { short: 1 }, 0.6); }); }
        if (i === 5) {
          S.to(st, { ...base, button: 1, closed: 1 }, 0.4);
          S.play(async (w) => {
            await w(0.9);
            await S.hand.move(545, T - 30);
            st.pressed = 1; await w(1.4); st.pressed = 0; await w(0.6);
            st.pressed = 1; await w(0.8); st.pressed = 0; await w(0.3); S.hand.hide();
          });
        }
      },
    };
  },
});
