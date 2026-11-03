// The battery and DC: a cutaway alkaline cell, electrons leaving the − end, DC vs AC, stacking cells, capacity.
import { scene, clamp } from '../../engine.js';
import { wire, bulb, battery, graph, pathOf, panel } from '../../kit.js';

const CAP = 2500; // mAh, a typical AA alkaline at low current

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'Inside an AA battery, and how its voltage behaves',
  steps: [
    'A battery turns a chemical reaction into an electrical push.',
    'The zinc gives up electrons. They leave from the − end.',
    'DC means direct current: one way, steady, a flat line.',
    'Stack cells nose to tail and their voltages add up.',
    'Capacity says how long it lasts: 2500 mAh ≈ 25 hours at 100 mA.',
    'As it empties, the voltage slowly sags until it is flat.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { labels: 1, circuit: 0, dc: 0, stack: 0, cap: 0, curve: 0, cells: 1, mA: 100 };

    // ---------- the cutaway AA cell (+ at the top)
    const X = 100, Y = 82, W = 140, H = 336;
    d.shadow(170, 440, 190);
    d.rect(X, Y, W, H, { fill: '#d9dbe0', stroke: C.ink, strokeWidth: 2.4, roughness: 0.6 });
    d.rect(X + 50, Y - 18, 40, 18, { fill: '#c7c9cf', stroke: C.ink, strokeWidth: 2, roughness: 0.4 });
    d.rect(X + 9, Y + 9, W - 18, H - 22, { fill: '#3b3d44', stroke: 'none', roughness: 0.5 });
    d.rect(X + 38, Y + 20, W - 76, H - 46, { fill: '#fff', stroke: 'none', roughness: 0.3 });
    d.rect(X + 42, Y + 24, W - 84, H - 54, { fill: '#c9ccd3', fillStyle: 'dots', hachureGap: 5, fillWeight: 1.6, stroke: C.ink2, strokeWidth: 1.2, roughness: 0.4 });
    d.line(X + 70, Y + 50, X + 70, Y + H - 10, { stroke: '#c9a227', strokeWidth: 5, roughness: 0.3 });
    d.rect(X + 6, Y + H - 10, W - 12, 10, { fill: '#9a9ca3', stroke: C.ink, strokeWidth: 1.6, roughness: 0.4 });
    d.text(X + 70, Y + 40, '+', { size: 34, fill: '#fff', weight: 500 });
    d.text(X - 8, Y + H - 4, '− end', { size: 18, fill: C.ink, mono: true, anchor: 'end' });
    d.text(X + 44, Y - 8, '+ end', { size: 18, fill: C.accentInk, mono: true, anchor: 'end' });
    const labs = d.g(S.layers.top);
    d.into(labs, () => {
      const lab = (y, ax, t, c) => { d.line(ax, y, 320, y, { stroke: C.muted, strokeWidth: 1.3 }); d.circle(ax, y, 7, { fill: C.muted, stroke: 'none' }); d.text(330, y, t, { size: 20, anchor: 'start', fill: c ?? C.ink2 }); };
      lab(150, X + 22, 'manganese dioxide (+ side)', C.accentInk);
      lab(220, X + 52, 'zinc paste (− side)', C.blue);
      lab(290, X + 70, 'brass collector', C.ink2);
      lab(360, X + 40, 'separator (lets ions through)', C.ink2);
    });
    // ions crossing the separator inside the cell
    const ionG = d.g(S.layers.fx, { opacity: 0 });
    const ions = Array.from({ length: 10 }, (_, i) => ({ y: Y + 50 + i * 28, p: (i * 0.37) % 1, side: i % 2, el: d.el('circle', { r: 4.5, fill: C.iris }, ionG) }));

    // ---------- external circuit with a bulb
    const extG = d.g(undefined, { opacity: 0 });
    const bl = bulb(S, 400, 210, { r: 34, parent: extG });
    const top = [X + 70, Y - 18], bot = [X + 70, Y + H];
    d.into(extG, () => {
      wire(S, [top, [X + 70, 36], [450, 36], [450, bl.right[1]], bl.right], { parent: extG });
      wire(S, [bot, [X + 70, 470], [bl.left[0], 470], bl.left], { parent: extG });
    });
    const fl = S.flow(pathOf([bot, [X + 70, 470], [bl.left[0], 470], bl.left, bl.right, [450, bl.right[1]], [450, 36], [X + 70, 36], top]), { gap: 32, r: 6, speed: 60, on: false });
    const eLab = d.text(300, 492, 'electrons leave the − end', { size: 17, fill: C.blue, mono: true, opacity: 0 });

    // ---------- right panel: DC vs AC
    const RX = 520;
    const dcG = d.g(undefined, { opacity: 0 });
    d.into(dcG, () => {
      panel(S, RX - 14, 70, 290, 380, { parent: dcG });
      d.text(RX + 130, 100, 'battery: DC', { size: 22, fill: C.ink, weight: 500 });
      const g1 = graph(S, RX + 30, 130, 220, 110, { xMax: 1, yMax: 2, xLabel: 'time', yTicks: [[1.5, '1.5 V']], parent: dcG });
      g1.line(() => 1.5, { color: C.accent, width: 4 });
      d.text(RX + 130, 310, 'mains socket: AC', { size: 22, fill: C.ink, weight: 500 });
      const g2 = graph(S, RX + 30, 336, 220, 80, { xMin: 0, xMax: 1, yMin: -1.2, yMax: 1.2, parent: dcG });
      g2.line((t) => Math.sin(t * Math.PI * 2 * 3), { color: C.iris, width: 3, n: 160 });
      d.text(RX + 140, 440, 'flips back and forth, 50 times a second', { size: 14, fill: C.muted, mono: true });
    });

    // ---------- right panel: stacking cells
    const stackG = d.g(undefined, { opacity: 0 });
    const cellGs = [];
    let stackV;
    d.into(stackG, () => {
      panel(S, RX - 14, 70, 290, 380, { parent: stackG });
      for (let i = 0; i < 4; i++) { const g = d.g(stackG); cellGs.push(g); battery(S, RX + 40 + i * 66, 250, { len: 54, h: 40, parent: g }); }
      stackV = d.text(RX + 130, 170, '', { size: 50, fill: C.ink, mono: true, weight: 500 });
      d.text(RX + 130, 214, 'total', { size: 16, fill: C.muted, mono: true });
      d.text(RX + 130, 330, 'each AA cell: 1.5 V', { size: 18, fill: C.ink2, mono: true });
      d.text(RX + 130, 360, '+ of one touches − of the next', { size: 15, fill: C.muted, mono: true });
    });
    const cellsC = S.ui.choice({ label: 'Cells', options: [[1, '1'], [2, '2'], [3, '3'], [4, '4']], value: 1, onChange: (v) => (st.cells = Number(v)) }).show(false);

    // ---------- right panel: capacity (a tank that drains)
    const capG = d.g(undefined, { opacity: 0 });
    let tankLevel, hoursT;
    d.into(capG, () => {
      panel(S, RX - 14, 70, 290, 380, { parent: capG });
      d.rect(RX + 40, 120, 80, 250, { fill: '#fff', stroke: C.ink, strokeWidth: 2.4, roughness: 0.6 });
      tankLevel = d.el('rect', { x: RX + 44, width: 72, fill: C.green, opacity: 0.75 }, capG);
      d.text(RX + 80, 396, `${CAP} mAh`, { size: 18, fill: C.ink2, mono: true });
      hoursT = d.text(RX + 200, 230, '', { size: 40, fill: C.ink, mono: true, weight: 500 });
      d.text(RX + 200, 270, 'of running time', { size: 15, fill: C.muted, mono: true });
      d.text(RX + 200, 300, 'hours = mAh ÷ mA', { size: 15, fill: C.ink2, mono: true });
    });
    const mAS = S.ui.slider({ label: 'Current', min: 20, max: 500, step: 10, value: 100, format: (v) => `${v} mA`, onInput: (v) => (st.mA = v) }).show(false);

    // ---------- right panel: discharge curve
    const curveG = d.g(undefined, { opacity: 0 });
    const alk = (f) => 1.55 - 0.42 * f - 0.22 * f ** 8;
    let cdot;
    d.into(curveG, () => {
      panel(S, RX - 14, 70, 290, 380, { parent: curveG });
      const g = graph(S, RX + 44, 120, 210, 240, { xMax: 25, yMin: 0.8, yMax: 1.6, xLabel: 'hours at 100 mA', yLabel: 'volts', xTicks: [[0, '0'], [25, '25']], yTicks: [[1.5, '1.5'], [1.2, '1.2'], [0.9, '0.9']], parent: curveG });
      g.line((h) => alk(h / 25), { color: C.accent, width: 4 });
      g.line([[0, 0.9], [25, 0.9]], { color: C.muted, width: 1.5, dash: '5 6' });
      d.text(RX + 250, g.py(0.9) + 18, 'empty', { size: 14, fill: C.muted, mono: true, anchor: 'end' });
      cdot = g.dot(C.blue);
      cdot.g = g;
    });

    let ct = 0;
    S.onTick((dt, t) => {
      labs.setAttribute('opacity', st.labels.toFixed(3));
      extG.setAttribute('opacity', st.circuit.toFixed(3));
      eLab.setAttribute('opacity', (st.circuit * (1 - st.dc - st.stack - st.cap - st.curve)).toFixed(3));
      ionG.setAttribute('opacity', st.circuit.toFixed(3));
      fl.set(st.circuit > 0.5);
      bl.set(st.circuit > 0.5 ? 0.85 : 0);
      for (const io of ions) {
        io.p = (io.p + dt * 0.35) % 1;
        const x0 = io.side ? X + W - 22 : X + 22, x1 = X + 56 + (io.side ? 28 : 0);
        io.el.setAttribute('cx', (x0 + (x1 - x0) * io.p).toFixed(1));
        io.el.setAttribute('cy', io.y);
        io.el.setAttribute('opacity', Math.sin(io.p * Math.PI).toFixed(2));
      }
      dcG.setAttribute('opacity', st.dc.toFixed(3));
      stackG.setAttribute('opacity', st.stack.toFixed(3));
      cellGs.forEach((g, i) => g.setAttribute('opacity', i < st.cells ? 1 : 0.12));
      stackV.textContent = `${(1.5 * st.cells).toFixed(1)} V`;
      capG.setAttribute('opacity', st.cap.toFixed(3));
      const hrs = CAP / st.mA;
      hoursT.textContent = `${hrs >= 10 ? hrs.toFixed(0) : hrs.toFixed(1)} h`;
      const lv = 1 - ((t * 0.08 * (st.mA / 100)) % 1);
      tankLevel.setAttribute('y', (124 + 242 * (1 - lv)).toFixed(1));
      tankLevel.setAttribute('height', (242 * lv).toFixed(1));
      curveG.setAttribute('opacity', st.curve.toFixed(3));
      ct = (ct + dt / 7) % 1;
      cdot.at(ct * 25, alk(ct));
    });

    const only = (o) => S.to(st, { labels: 0, circuit: 1, dc: 0, stack: 0, cap: 0, curve: 0, ...o }, 0.6);
    return {
      step(i) {
        cellsC.show(i === 3); mAS.show(i === 4);
        if (i === 0) only({ labels: 1, circuit: 0 });
        if (i === 1) only({});
        if (i === 2) only({ dc: 1 });
        if (i === 3) { only({ stack: 1 }); cellsC.set(1); S.play(async (w) => { for (const n of [2, 3, 4]) { await w(1.1); cellsC.set(n); } }); }
        if (i === 4) { only({ cap: 1 }); mAS.set(100); }
        if (i === 5) only({ curve: 1 });
      },
    };
  },
});
