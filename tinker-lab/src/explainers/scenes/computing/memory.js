// Memory: a button that forgets, an SR latch that remembers, then bytes at numbered addresses (RAM).
import { scene } from '../../engine.js';
import { panel } from '../../kit.js';

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A latch made of two NOR gates, then a grid of memory with addresses',
  steps: [
    'A plain button forgets: let go and the light goes out.',
    'Two NOR gates feeding each other make a latch.',
    'Press Set: Q turns on, and stays on after you let go.',
    'Press Reset: Q turns off, and stays off.',
    'Eight latches store a byte. Each byte gets a numbered address.',
    'RAM: pick an address, then write a byte there or read it back.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { S: 0, R: 0, Q: 0, Qb: 1, held: 0, plain: 1, latch: 0, ram: 0, addr: 2, data: 0b01000001, flash: -1, ft: 0 };
    const mem = [0x12, 0xa7, 0x48, 0x00, 0xff, 0x3c, 0x81, 0x55];
    const on = (v) => (v ? C.accent : C.ink2);

    // ---------- A. a button that forgets
    const aG = d.g();
    let aCap, aLamp;
    d.into(aG, () => {
      d.rect(200, 220, 100, 50, { fill: C.subtle2, stroke: C.ink, strokeWidth: 2 });
      aCap = d.g(aG);
      d.into(aCap, () => d.rect(225, 186, 50, 36, { fill: C.accent, stroke: C.ink, strokeWidth: 2 }));
      d.lines([[300, 245], [520, 245]], { strokeWidth: 3 });
      d.circle(560, 245, 70, { fill: '#fff', stroke: C.ink, strokeWidth: 2.2 });
      aLamp = d.el('circle', { cx: 560, cy: 245, r: 30, fill: C.yellow, opacity: 0 }, aG);
      d.text(250, 310, 'hold me', { size: 16, fill: C.muted, mono: true });
    });
    const aGlow = d.glow(560, 245, 110, C.yellow, aG);
    const aHit = d.el('rect', { x: 190, y: 170, width: 120, height: 110, fill: 'transparent' }, aG);
    S.drag(aHit, { cursor: 'pointer', start: () => (st.held = 1), end: () => (st.held = 0) });

    // ---------- B. SR latch
    const bG = d.g(undefined, { opacity: 0 });
    const W = {};
    const nor = (x, y) => {
      d.path(`M${x} ${y - 40} Q ${x + 60} ${y - 40} ${x + 110} ${y} Q ${x + 60} ${y + 40} ${x} ${y + 40} Q ${x + 26} ${y} ${x} ${y - 40} Z`, { fill: C.irisSoft, stroke: C.iris, strokeWidth: 3 });
      d.circle(x + 122, y, 22, { fill: '#fff', stroke: C.iris, strokeWidth: 3 });
      d.text(x + 50, y, 'NOR', { size: 16, fill: C.irisInk, mono: true, weight: 500 });
    };
    const btn = (x, y, t, key) => {
      const g = d.g(bG);
      d.into(g, () => { d.circle(x, y, 60, { fill: '#fff', stroke: C.ink, strokeWidth: 2.2 }); d.text(x, y + 1, t, { size: 22, fill: C.ink, weight: 500 }); });
      const ring = d.el('circle', { cx: x, cy: y, r: 34, fill: 'none', stroke: C.accent, 'stroke-width': 5, opacity: 0 }, bG);
      S.drag(g, { cursor: 'pointer', start: () => (st[key] = 1), end: () => (st[key] = 0) });
      return ring;
    };
    d.into(bG, () => {
      nor(300, 150); nor(300, 350);
      const wp = (k, dd) => (W[k] = d.el('path', { d: dd, fill: 'none', 'stroke-width': 4, 'stroke-linejoin': 'round' }, bG));
      wp('R', 'M150 130 H312');
      wp('S', 'M150 370 H312');
      wp('Q', 'M444 150 H600 M520 150 V250 L260 280 V330 H316');
      wp('Qb', 'M444 350 H600 M520 350 V300 L260 220 V170 H316');
      d.circle(520, 150, 10, { fill: C.ink }); d.circle(520, 350, 10, { fill: C.ink });
      d.text(640, 150, 'Q', { size: 26, fill: C.ink, weight: 500 });
      d.text(640, 350, 'not Q', { size: 18, fill: C.ink2, mono: true });
      d.text(90, 200, 'Reset', { size: 15, fill: C.muted, mono: true }); d.text(90, 300, 'Set', { size: 15, fill: C.muted, mono: true });
    });
    const ringR = btn(90, 130, 'R', 'R'), ringS = btn(90, 370, 'S', 'S');
    const qGlow = d.glow(700, 150, 80, C.yellow, bG);
    const qLamp = d.el('circle', { cx: 700, cy: 150, r: 26, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, bG);

    // ---------- C. RAM
    const cG = d.g(undefined, { opacity: 0 });
    const rows = [];
    let dataBits = [], rowHi;
    d.into(cG, () => {
      d.text(220, 60, 'address', { size: 14, fill: C.muted, mono: true });
      d.text(470, 60, 'stored byte (8 latches each)', { size: 14, fill: C.muted, mono: true });
      rowHi = d.el('rect', { x: 180, width: 520, height: 38, rx: 19, fill: C.accentSoft }, cG);
      for (let r = 0; r < 8; r++) {
        const y = 92 + r * 40;
        d.text(220, y, String(r), { size: 22, fill: C.ink, mono: true, weight: 500 });
        const bits = [];
        for (let k = 0; k < 8; k++) bits.push(d.el('rect', { x: 300 + k * 44, y: y - 16, width: 36, height: 32, rx: 5, stroke: C.ink, 'stroke-width': 1.5 }, cG));
        rows.push(bits);
      }
      panel(S, 280, 420, 400, 64, { parent: cG, fill: '#fff' });
      d.text(232, 452, 'data', { size: 15, fill: C.muted, mono: true });
      for (let k = 0; k < 8; k++) {
        const g = d.g(cG);
        const r = d.el('rect', { x: 300 + k * 44, y: 436, width: 36, height: 32, rx: 5, stroke: C.ink, 'stroke-width': 1.5 }, g);
        S.tap(g, () => { st.data ^= 1 << (7 - k); }, `Data bit ${k}`);
        dataBits.push(r);
      }
    });
    const valT = d.text(720, 452, '', { size: 18, fill: C.ink, mono: true, parent: cG });

    const addrC = S.ui.choice({ label: 'Address', options: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [k, String(k)]), value: 2, onChange: (v) => (st.addr = Number(v)) }).show(false);
    const wB = S.ui.button({ label: 'Write', icon: 'download', primary: true, onClick: () => { mem[st.addr] = st.data; st.flash = st.addr; st.ft = 1; } }).show(false);
    const rB = S.ui.button({ label: 'Read', icon: 'upload', onClick: () => { st.data = mem[st.addr]; st.flash = st.addr; st.ft = 1; } }).show(false);

    S.onTick((dt) => {
      aG.setAttribute('opacity', st.plain.toFixed(2)); bG.setAttribute('opacity', st.latch.toFixed(2)); cG.setAttribute('opacity', st.ram.toFixed(2));
      aG.style.pointerEvents = st.plain > 0.5 ? '' : 'none'; bG.style.pointerEvents = st.latch > 0.5 ? '' : 'none'; cG.style.pointerEvents = st.ram > 0.5 ? '' : 'none';
      S.at(aCap, 0, st.held * 14);
      aLamp.setAttribute('opacity', st.held ? 0.9 : 0); aGlow.setAttribute('opacity', st.held ? 0.8 : 0);
      // the latch settles: Q = NOR(R, not Q), not Q = NOR(S, Q)
      for (let k = 0; k < 3; k++) { st.Q = st.R || st.Qb ? 0 : 1; st.Qb = st.S || st.Q ? 0 : 1; }
      W.R.setAttribute('stroke', on(st.R)); W.S.setAttribute('stroke', on(st.S)); W.Q.setAttribute('stroke', on(st.Q)); W.Qb.setAttribute('stroke', on(st.Qb));
      ringR.setAttribute('opacity', st.R); ringS.setAttribute('opacity', st.S);
      qLamp.setAttribute('fill', st.Q ? C.yellow : '#fff'); qGlow.setAttribute('opacity', st.Q ? 0.8 : 0);
      st.ft = Math.max(0, st.ft - dt * 1.5);
      rowHi.setAttribute('y', 92 + st.addr * 40 - 19);
      rows.forEach((bits, r) => bits.forEach((b, k) => { const v = (mem[r] >> (7 - k)) & 1; b.setAttribute('fill', v ? (r === st.flash && st.ft > 0 ? C.yellow : C.iris) : '#fff'); }));
      dataBits.forEach((b, k) => b.setAttribute('fill', (st.data >> (7 - k)) & 1 ? C.accent : '#fff'));
      valT.textContent = `= ${st.data}`;
    }, { essential: true });

    const press = (key, x, y) => S.play(async (w) => { await w(0.8); await S.hand.move(x, y); st[key] = 1; await w(0.5); st[key] = 0; await w(0.6); S.hand.hide(); });
    return {
      step(i) {
        addrC.show(i === 5); wB.show(i === 5); rB.show(i === 5);
        S.to(st, { plain: i === 0 ? 1 : 0, latch: i >= 1 && i <= 3 ? 1 : 0, ram: i >= 4 ? 1 : 0 }, 0.5);
        if (i === 0) S.play(async (w) => { await w(0.8); await S.hand.move(250, 200); st.held = 1; await w(1.2); st.held = 0; await w(0.4); S.hand.move(250, 120); });
        if (i === 1) { st.S = 0; st.R = 0; }
        if (i === 2) { st.Q = 0; st.Qb = 1; press('S', 90, 370); }
        if (i === 3) { st.Q = 1; st.Qb = 0; press('R', 90, 130); }
        if (i === 5) S.play(async (w) => { await w(0.8); await S.hand.press(addrC.el.querySelectorAll('button')[5]); addrC.set(5); await w(0.4); await S.hand.press(rB.el); st.data = mem[5]; st.flash = 5; st.ft = 1; await w(0.5); S.hand.hide(); });
      },
    };
  },
});
