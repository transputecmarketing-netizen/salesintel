// Logic gates from switches: NOT, AND, OR, XOR as real switch circuits, gate symbols and truth tables.
import { scene } from '../../engine.js';
import { wire, battery, bulb, knife, panel, resistor } from '../../kit.js';

const FN = { one: (a) => a, not: (a) => 1 - a, and: (a, b) => a & b, or: (a, b) => a | b, xor: (a, b) => a ^ b };
const NAME = { one: 'switch', not: 'NOT', and: 'AND', or: 'OR', xor: 'XOR' };

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'Switch circuits that behave like logic gates, with truth tables',
  steps: [
    'A transistor is a switch that an electrical signal can flip.',
    'NOT: the output is the opposite of the input.',
    'AND: two switches in a row. Both must be on.',
    'OR: two switches side by side. Either one will do.',
    'XOR: one or the other, but not both.',
    'Your turn: flip the inputs and fill in every row.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { gate: 'one', a: 0, b: 0, seen: new Set(), quiz: false };
    const left = d.g(), mid = d.g(), tbl = d.g();
    let lamp, switches = {};
    panel(S, 20, 54, 410, 400);
    const leftT = d.text(225, 78, '', { size: 15, fill: C.muted, mono: true });

    function drawLeft() {
      d.seed = 100 + Object.keys(FN).indexOf(st.gate) * 300;
      d.redraw(left, () => {
        const g = st.gate, T = 130, B = 410;
        const bat = battery(S, 64, 270, { len: 110, h: 40, label: '5 V' });
        bat.g.setAttribute('transform', 'rotate(-90 64 270)');
        lamp = bulb(S, 370, 250, { r: 28, glowParent: left });
        const lt = [lamp.left[0], 300], rt = [lamp.right[0], 300];
        wire(S, [[64, 206], [64, T], [110, T]]);
        wire(S, [[64, 334], [64, B], [rt[0], B], lamp.right]);
        switches = {};
        if (g === 'one') { switches.a = knife(S, 180, T, 90); wire(S, [[110, T], [180, T]]); wire(S, [[270, T], [lt[0], T], lamp.left]); }
        if (g === 'and') { switches.a = knife(S, 140, T, 80); switches.b = knife(S, 250, T, 80); wire(S, [[110, T], [140, T]]); wire(S, [[220, T], [250, T]]); wire(S, [[330, T], [lt[0], T], lamp.left]); }
        if (g === 'or') { switches.a = knife(S, 180, T, 80); switches.b = knife(S, 180, 210, 80); wire(S, [[110, T], [180, T]]); wire(S, [[130, T], [130, 210], [180, 210]], { r: 0 }); wire(S, [[260, T], [lt[0], T], lamp.left]); wire(S, [[260, 210], [310, 210], [310, T]], { r: 0 }); d.circle(130, T, 10, { fill: C.ink }); d.circle(310, T, 10, { fill: C.ink }); }
        if (g === 'not') {
          resistor(S, 170, T, { len: 60, lead: 14, bands: ['brown', 'black', 'red', 'gold'] });
          wire(S, [[110, T], [126, T]]); wire(S, [[214, T], [lt[0], T], lamp.left]);
          d.circle(240, T, 10, { fill: C.ink });
          wire(S, [[240, T], [240, 300]], { r: 0 });
          switches.a = knife(S, 240, 300, 70); switches.a.g.setAttribute('transform', 'rotate(90 240 300)');
          wire(S, [[240, 370], [240, B]], { r: 0 }); d.circle(240, B, 10, { fill: C.ink });
          d.text(300, 214, 'switch shorts the lamp', { size: 13, fill: C.muted, mono: true });
        }
        if (g === 'xor') {
          // two-way "staircase" switches: the lamp lights when they pick different wires
          wire(S, [[110, T], [130, T], [130, 190]]);
          for (const y of [160, 240]) { d.circle(170, y, 12, { fill: '#fff' }); d.circle(270, y, 12, { fill: '#fff' }); wire(S, [[176, y], [264, y]], { r: 0 }); }
          d.circle(130, 200, 13, { fill: '#fff' }); d.circle(310, 200, 13, { fill: '#fff' });
          switches.a = { lever: d.el('line', { x1: 130, y1: 200, stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round' }, left), hit: d.el('rect', { x: 110, y: 140, width: 60, height: 120, fill: 'transparent' }, left), xor: 'a' };
          switches.b = { lever: d.el('line', { x1: 310, y1: 200, stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round' }, left), hit: d.el('rect', { x: 270, y: 140, width: 60, height: 120, fill: 'transparent' }, left), xor: 'b' };
          wire(S, [[310, 200], [lt[0], 200], lamp.left], { r: 0 });
          d.text(220, 280, 'like stairs lights: two switches, one lamp', { size: 13, fill: C.muted, mono: true });
        }
        for (const k of ['a', 'b']) if (switches[k]) {
          S.tap(switches[k].hit, () => { st[k] ^= 1; }, `Switch ${k.toUpperCase()}`);
          const p = switches[k].xor ? [+switches[k].lever.getAttribute('x1') - 26, 120] : [switches[k].a[0] + (k === 'a' && g === 'not' ? -26 : 40), switches[k].a[1] - 34];
          d.text(p[0], p[1], k.toUpperCase(), { size: 22, fill: C.accentInk, weight: 500 });
        }
      });
      leftT.textContent = st.gate === 'one' ? 'a switch flipped by a signal' : 'each switch is really a transistor';
    }

    // ---------- gate symbol
    const outLamp = d.el('circle', { cx: 668, cy: 250, r: 16, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, S.layers.top);
    let inA, inB, outW;
    function drawMid() {
      d.seed = 4000 + Object.keys(FN).indexOf(st.gate) * 50;
      d.redraw(mid, () => {
        const g = st.gate;
        inA = d.el('path', { d: g === 'not' || g === 'one' ? 'M440 250 H480' : 'M440 210 H490', fill: 'none', 'stroke-width': 4 }, mid);
        inB = d.el('path', { d: g === 'not' || g === 'one' ? '' : 'M440 290 H490', fill: 'none', 'stroke-width': 4 }, mid);
        outW = d.el('path', { d: 'M600 250 H652', fill: 'none', 'stroke-width': 4 }, mid);
        const sty = { fill: C.irisSoft, stroke: C.iris, strokeWidth: 3, roughness: 0.6 };
        if (g === 'and') d.path('M480 180 H530 A70 70 0 0 1 530 320 H480 Z', sty);
        if (g === 'or' || g === 'xor') d.path('M478 180 Q 540 180 600 250 Q 540 320 478 320 Q 510 250 478 180 Z', sty);
        if (g === 'xor') d.path('M462 180 Q 494 250 462 320', { stroke: C.iris, strokeWidth: 3, fill: 'none' });
        if (g === 'not') { d.path('M480 190 L480 310 L578 250 Z', sty); d.circle(590, 250, 22, { fill: '#fff', stroke: C.iris, strokeWidth: 3 }); }
        if (g === 'one') d.rect(480, 200, 110, 100, { ...sty, fill: C.subtle });
        d.text(540, 160, NAME[g], { size: 26, fill: C.irisInk, weight: 500 });
        d.text(430, g === 'not' || g === 'one' ? 250 : 210, 'A', { size: 18, fill: C.ink, anchor: 'end', weight: 500 });
        if (g !== 'not' && g !== 'one') d.text(430, 290, 'B', { size: 18, fill: C.ink, anchor: 'end', weight: 500 });
      });
    }
    // ---------- truth table
    let rows = [];
    function drawTable() {
      d.seed = 6000;
      d.redraw(tbl, () => {
        const one = st.gate === 'not' || st.gate === 'one';
        const combos = one ? [[0, 0], [1, 0]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
        panel(S, 640, 330, 150, 34 + combos.length * 30, { parent: tbl, fill: '#fff' });
        d.text(665, 348, 'A', { size: 15, fill: C.muted, mono: true, parent: tbl });
        if (!one) d.text(705, 348, 'B', { size: 15, fill: C.muted, mono: true, parent: tbl });
        d.text(755, 348, 'out', { size: 15, fill: C.muted, mono: true, parent: tbl });
        rows = combos.map(([a, b], k) => {
          const y = 378 + k * 30;
          const hi = d.el('rect', { x: 646, y: y - 14, width: 138, height: 28, rx: 14, fill: C.accentSoft, opacity: 0 }, tbl);
          d.text(665, y, String(a), { size: 17, fill: C.ink, mono: true, parent: tbl });
          if (!one) d.text(705, y, String(b), { size: 17, fill: C.ink, mono: true, parent: tbl });
          const o = d.text(755, y, String(FN[st.gate](a, b)), { size: 17, fill: C.ink, mono: true, weight: 500, parent: tbl });
          return { a, b, hi, o };
        });
      });
    }
    const set = (g) => { st.gate = g; st.a = 0; st.b = 0; st.seen = new Set(); drawLeft(); drawMid(); drawTable(); gateC.set(g, false); };
    const gateC = S.ui.choice({ label: 'Gate', options: [['not', 'NOT'], ['and', 'AND'], ['or', 'OR'], ['xor', 'XOR']], value: 'not', onChange: (v) => set(v) });

    S.onTick(() => {
      const one = st.gate === 'not' || st.gate === 'one';
      const a = st.a, b = one ? 0 : st.b, out = FN[st.gate](a, b);
      st.seen.add(`${a}${b}`);
      for (const k of ['a', 'b']) {
        const s = switches[k];
        if (!s) continue;
        const v = st[k];
        if (s.xor) { const x1 = +s.lever.getAttribute('x1'); const toY = k === 'a' ? (v ? 240 : 160) : (v ? 160 : 240); s.lever.setAttribute('x2', x1 + (k === 'a' ? 40 : -40)); s.lever.setAttribute('y2', toY); }
        else s.set(v);
      }
      lamp.set(out);
      inA.setAttribute('stroke', a ? C.accent : C.ink2);
      inB.setAttribute('stroke', b ? C.accent : C.ink2);
      outW.setAttribute('stroke', out ? C.accent : C.ink2);
      outLamp.setAttribute('fill', out ? C.yellow : '#fff');
      rows.forEach((r) => {
        const cur = r.a === a && r.b === b;
        r.hi.setAttribute('opacity', cur ? 1 : 0);
        r.o.textContent = st.quiz && !st.seen.has(`${r.a}${r.b}`) ? '?' : String(FN[st.gate](r.a, r.b));
      });
    }, { essential: true });

    const demo = (pairs) => S.play(async (w) => {
      for (const [a, b] of pairs) {
        await w(0.9);
        if (a !== st.a) { const s = switches.a; const r = s.hit.getBBox(); if (st.gate === 'not') await S.hand.tap(250, 335); else await S.hand.tap(r.x + r.width / 2, r.y + r.height / 2); st.a = a; }
        if (b !== st.b && switches.b) { const s = switches.b; const r = s.hit.getBBox(); await S.hand.tap(r.x + r.width / 2, r.y + r.height / 2); st.b = b; }
      }
      await w(0.4); S.hand.hide();
    });
    return {
      step(i) {
        st.quiz = i === 5;
        gateC.show(i === 5);
        const g = ['one', 'not', 'and', 'or', 'xor', 'and'][i];
        set(g);
        if (i === 0 || i === 1) demo([[1, 0], [0, 0], [1, 0]]);
        if (i >= 2 && i <= 4) demo([[1, 0], [1, 1], [0, 1], [0, 0]]);
      },
    };
  },
});
