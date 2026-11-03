// Series and parallel: bulbs dimming in a chain, staying bright side by side.
import { scene, si } from '../../engine.js';
import { wire, battery, bulb, pathOf } from '../../kit.js';

const VB = 6, RB = 30; // a 6 V battery and bulbs treated as fixed 30 Ω loads

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'Bulbs wired in series and in parallel',
  steps: [
    'Series: one single path. The bulbs share the battery’s push.',
    'Add a second bulb in series: both get dimmer.',
    'Unscrew one bulb: the whole chain goes dark.',
    'Parallel: every bulb gets its own path to the battery.',
    'Add more in parallel: each stays bright, but the battery works harder.',
    'Unscrew one: the others keep shining.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { mode: 'series', n: 1, removed: new Set() };
    const L = 110, R = 690, B = 420, CY = 96, BR = 34, T = CY + BR * 1.5, R1 = T + 34, R2 = T + 74;
    const circuitG = d.g();
    const glowG = d.g(S.layers.fx);
    let bulbs = [], flows = [];

    const xs = (n) => (n === 1 ? [400] : n === 2 ? [300, 500] : [230, 400, 570]);
    function build() {
      flows.forEach((f) => f.remove()); flows = [];
      while (glowG.firstChild) glowG.firstChild.remove();
      d.seed = 4000;
      d.redraw(circuitG, () => {
        const bat = battery(S, 400, B, { label: `${VB} V`, len: 150 });
        const X = xs(st.n);
        bulbs = X.map((x, i) => {
          const off = st.removed.has(i) ? -34 : 0;
          const g = d.g();
          const b = bulb(S, x, CY + off, { r: BR, parent: g, glowParent: glowG });
          if (off) d.text(x, CY + off - 52, 'unscrewed', { size: 15, fill: C.accentInk, mono: true });
          S.tap(g, () => { st.removed.has(i) ? st.removed.delete(i) : st.removed.add(i); build(); }, `Bulb ${i + 1}: screw in or out`);
          return { b, x, off, left: [x - BR * 0.42, T], right: [x + BR * 0.42, T] };
        });
        const join = (bb) => { if (!bb.off) return; d.line(bb.left[0], T - 6, bb.left[0], T, { strokeWidth: 3 }); };
        if (st.mode === 'series') {
          wire(S, [bat.minus, [L, B], [L, T], bulbs[0].left]);
          for (let i = 0; i < bulbs.length - 1; i++) wire(S, [bulbs[i].right, bulbs[i + 1].left], { r: 0 });
          wire(S, [bulbs[bulbs.length - 1].right, [R, T], [R, B], bat.plus]);
          bulbs.forEach(join);
          const pts = [bat.minus, [L, B], [L, T], [R, T], [R, B], bat.plus];
          const complete = st.removed.size === 0;
          if (complete) flows.push(S.flow(pathOf(pts), { gap: 34, r: 6.5, speed: 120 / st.n, parent: S.layers.back }));
        } else {
          wire(S, [bat.minus, [L, B], [L, R1], [bulbs[bulbs.length - 1].left[0], R1]], { r: 10 });
          wire(S, [[bulbs[0].right[0], R2], [R, R2], [R, B], bat.plus], { r: 10 });
          for (const bb of bulbs) {
            wire(S, [bb.left, [bb.left[0], R1]], { r: 0 });
            wire(S, [bb.right, [bb.right[0], R2]], { r: 0 });
            d.circle(bb.left[0], R1, 8, { fill: C.ink, stroke: 'none' });
            d.circle(bb.right[0], R2, 8, { fill: C.ink, stroke: 'none' });
          }
          bulbs.forEach((bb, i) => {
            if (st.removed.has(i)) return;
            const pts = [bat.minus, [L, B], [L, R1], [bb.left[0], R1], [bb.left[0], T], [bb.right[0], T], [bb.right[0], R2], [R, R2], [R, B], bat.plus];
            flows.push(S.flow(pathOf(pts, 8), { gap: 46, r: 6, speed: 120, parent: S.layers.back }));
          });
        }
        d.text(400, B + 50, st.mode === 'series' ? 'one path' : `${bulbs.length} separate paths`, { size: 19, fill: C.muted, mono: true });
      });
      apply();
    }
    const rdV = S.ui.readout({ label: 'Each bulb gets', color: C.accent });
    const rdI = S.ui.readout({ label: 'Battery current', color: C.blue });
    const mode = S.ui.choice({ options: [['series', 'Series'], ['parallel', 'Parallel']], value: 'series', onChange: (v) => { st.mode = v; st.removed.clear(); build(); } });
    const count = S.ui.choice({ label: 'Bulbs', options: [[1, '1'], [2, '2'], [3, '3']], value: 1, onChange: (v) => { st.n = Number(v); st.removed.clear(); build(); } });

    function apply() {
      const n = st.n, present = n - st.removed.size;
      let V = 0, I = 0;
      if (st.mode === 'series') { if (!st.removed.size) { V = VB / n; I = VB / (n * RB); } }
      else { V = present ? VB : 0; I = (present * VB) / RB; }
      bulbs.forEach((bb, i) => bb.b.set(st.removed.has(i) ? 0 : st.mode === 'series' ? (st.removed.size ? 0 : 1 / (n * n)) : 1));
      rdV.set(st.removed.size && st.mode === 'series' ? '0 V' : `${V.toFixed(1)} V`);
      rdI.set(si(I, 'A'));
    }
    const set = (m, n, removed = []) => { st.mode = m; st.n = n; st.removed = new Set(removed); mode.set(m, false); count.set(n, false); build(); };
    build();
    return {
      step(i) {
        if (i === 0) set('series', 1);
        if (i === 1) { set('series', 1); S.play(async (w) => { await w(0.7); await S.hand.press(count.el.querySelectorAll('button')[1]); set('series', 2); await w(0.4); S.hand.hide(); }); }
        if (i === 2) { set('series', 2); S.play(async (w) => { await w(0.7); await S.hand.tap(300, CY); set('series', 2, [0]); await w(0.5); S.hand.hide(); }); }
        if (i === 3) set('parallel', 2);
        if (i === 4) { set('parallel', 2); S.play(async (w) => { await w(0.7); await S.hand.press(count.el.querySelectorAll('button')[2]); set('parallel', 3); await w(0.4); S.hand.hide(); }); }
        if (i === 5) { set('parallel', 3); S.play(async (w) => { await w(0.7); await S.hand.tap(400, CY); set('parallel', 3, [1]); await w(0.5); S.hand.hide(); }); }
      },
    };
  },
});
