// Potentiometers and voltage dividers: a draggable knob, a split track and Vout = Vin × R2 ÷ (R1 + R2).
import { scene, si, clamp } from '../../engine.js';
import { resistor, panel } from '../../kit.js';

const RT = 10000, VIN = 5;

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'Inside a potentiometer, beside a voltage divider diagram',
  steps: [
    'A potentiometer: a resistor track with a sliding contact, the wiper.',
    'Turn the knob and the wiper slides along the track.',
    'The wiper splits the track into two resistors.',
    'Voltage divider: Vout = 5 V × R2 ÷ (R1 + R2).',
    'Halfway round, the two halves are equal: 2.5 V.',
    'An Arduino reads that voltage as a number from 0 to 1023.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { f: 0.3, labels: 1, split: 0, formula: 0, ard: 0 };
    const cx = 220, cy = 240, R = 128;
    const A0 = (135 * Math.PI) / 180, SPAN = (270 * Math.PI) / 180;
    const P = (a, r = R) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    const arcD = (a, b, r = R) => { const [x1, y1] = P(a, r), [x2, y2] = P(b, r); return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${b - a > Math.PI ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`; };

    // ---------- the pot, top view
    d.shadow(cx, 432, 300);
    d.circle(cx, cy, 330, { fill: C.subtle, stroke: C.ink, strokeWidth: 2.4 });
    // terminals
    const tabs = [[cx - 90, 'GND'], [cx, 'out'], [cx + 90, '5 V']];
    for (const [x, t] of tabs) { d.rect(x - 12, 398, 24, 44, { fill: '#c7c9cf', stroke: C.ink, strokeWidth: 1.8, roughness: 0.4 }); d.text(x, 462, t, { size: 17, fill: C.ink2, mono: true }); }
    const [sx, sy] = P(A0), [ex, ey] = P(A0 + SPAN);
    d.path(`M${sx} ${sy} L${cx - 90} 398`, { stroke: '#9a9ca3', strokeWidth: 5, fill: 'none' });
    d.path(`M${ex} ${ey} L${cx + 90} 398`, { stroke: '#9a9ca3', strokeWidth: 5, fill: 'none' });
    d.path(`M${cx} ${cy} L${cx} 398`, { stroke: '#9a9ca3', strokeWidth: 5, fill: 'none' });
    const track = d.el('path', { d: arcD(A0, A0 + SPAN), fill: 'none', stroke: '#3a2f2a', 'stroke-width': 26, 'stroke-linecap': 'butt' });
    const r2Arc = d.el('path', { fill: 'none', stroke: C.iris, 'stroke-width': 26, opacity: 0 });
    const r1Arc = d.el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 26, opacity: 0 });
    const wiper = d.g();
    d.into(wiper, () => {
      d.line(cx, cy, cx + R + 6, cy, { strokeWidth: 6, stroke: '#9a9ca3', roughness: 0.3 });
      d.circle(cx + R, cy, 20, { fill: '#c9a227', stroke: C.ink, strokeWidth: 1.6 });
    });
    d.circle(cx, cy, 120, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2 });
    const knob = d.g();
    d.into(knob, () => d.line(cx + 12, cy, cx + 54, cy, { stroke: '#fff', strokeWidth: 6, roughness: 0.3 }));
    const hit = d.el('circle', { cx, cy, r: 170, fill: 'transparent' });
    S.drag(hit, { move: (x, y) => { let a = Math.atan2(y - cy, x - cx); if (a < A0 - Math.PI) a += Math.PI * 2; if (a < A0 - 0.6) a += Math.PI * 2; st.f = clamp((a - A0) / SPAN); } });
    const labs = d.g(S.layers.top);
    d.into(labs, () => {
      d.text(cx, 64, 'carbon track', { size: 18, fill: C.ink2 });
      d.text(cx, 245, 'knob', { size: 15, fill: '#fff', mono: true });
    });
    const wLab = d.text(0, 0, 'wiper', { size: 17, fill: '#8a6d12', weight: 500, parent: S.layers.top });
    const r1T = d.text(0, 0, 'R1', { size: 20, fill: C.accentInk, weight: 500, parent: S.layers.top });
    const r2T = d.text(0, 0, 'R2', { size: 20, fill: C.irisInk, weight: 500, parent: S.layers.top });

    // ---------- the divider diagram
    const DX = 590;
    panel(S, 470, 30, 320, 440);
    d.text(DX, 62, '5 V', { size: 22, fill: C.accentInk, mono: true, weight: 500 });
    const res1 = resistor(S, DX, 150, { vertical: true, len: 80, lead: 30, bands: [] });
    const res2 = resistor(S, DX, 330, { vertical: true, len: 80, lead: 30, bands: [] });
    d.line(DX, 80, DX, 80 + 0, {});
    d.line(DX, 220, DX, 260, { strokeWidth: 3 });
    d.circle(DX, 240, 12, { fill: C.ink });
    d.line(DX, 240, 690, 240, { strokeWidth: 3 });
    d.line(DX - 22, 410, DX + 22, 410, { strokeWidth: 3 }); d.line(DX - 14, 418, DX + 14, 418, { strokeWidth: 3 }); d.line(DX - 6, 426, DX + 6, 426, { strokeWidth: 3 });
    const r1V = d.text(DX - 36, 150, '', { size: 17, fill: C.accentInk, mono: true, anchor: 'end' });
    const r2V = d.text(DX - 36, 330, '', { size: 17, fill: C.irisInk, mono: true, anchor: 'end' });
    d.text(DX + 30, 150, 'R1', { size: 20, fill: C.accentInk, anchor: 'start', weight: 500 });
    d.text(DX + 30, 330, 'R2', { size: 20, fill: C.irisInk, anchor: 'start', weight: 500 });
    d.text(700, 214, 'Vout', { size: 16, fill: C.muted, mono: true });
    const vT = d.text(712, 246, '', { size: 26, fill: C.ink, mono: true, weight: 500 });
    const fG = d.g(S.layers.top, { opacity: 0 });
    const fT = d.text(630, 458, '', { size: 15, fill: C.ink2, mono: true, parent: fG });
    const aG = d.g(S.layers.top, { opacity: 0 });
    let aT;
    d.into(aG, () => {
      d.rect(650, 290, 120, 92, { fill: '#1f6f8b', stroke: C.ink, roughness: 0.6 });
      d.rect(668, 306, 40, 40, { fill: '#2a2b31', stroke: 'none', roughness: 0.3 });
      d.text(710, 368, 'A0 reads', { size: 13, fill: '#fff', mono: true });
      aT = d.text(738, 326, '', { size: 22, fill: '#fff', mono: true, weight: 500 });
      d.line(690, 250, 690, 290, { strokeWidth: 3 });
    });

    S.onTick(() => {
      const a = A0 + SPAN * st.f;
      wiper.setAttribute('transform', `rotate(${((a * 180) / Math.PI).toFixed(2)} ${cx} ${cy})`);
      knob.setAttribute('transform', `rotate(${((a * 180) / Math.PI).toFixed(2)} ${cx} ${cy})`);
      r2Arc.setAttribute('d', st.f > 0.002 ? arcD(A0, a) : '');
      r1Arc.setAttribute('d', st.f < 0.998 ? arcD(a, A0 + SPAN) : '');
      r1Arc.setAttribute('opacity', (st.split * 0.9).toFixed(2)); r2Arc.setAttribute('opacity', (st.split * 0.9).toFixed(2));
      const [wx, wy] = P(a, R + 44);
      wLab.setAttribute('x', wx.toFixed(1)); wLab.setAttribute('y', wy.toFixed(1));
      const [x1, y1] = P(a + (A0 + SPAN - a) / 2, R + 40), [x2, y2] = P(A0 + (a - A0) / 2, R + 40);
      r1T.setAttribute('x', x1); r1T.setAttribute('y', y1); r2T.setAttribute('x', x2); r2T.setAttribute('y', y2);
      r1T.setAttribute('opacity', st.split * (st.f < 0.9 ? 1 : 0)); r2T.setAttribute('opacity', st.split * (st.f > 0.1 ? 1 : 0));
      labs.setAttribute('opacity', st.labels.toFixed(2));
      const R2 = st.f * RT, R1 = RT - R2, V = VIN * st.f;
      r1V.textContent = si(R1, 'Ω'); r2V.textContent = si(R2, 'Ω');
      vT.textContent = `${V.toFixed(2)} V`;
      fG.setAttribute('opacity', st.formula.toFixed(2));
      fT.textContent = `5 × ${si(R2, '')} ÷ (${si(R1, '')} + ${si(R2, '')}) = ${V.toFixed(2)} V`;
      aG.setAttribute('opacity', st.ard.toFixed(2));
      aT.textContent = String(Math.round((V / VIN) * 1023));
    }, { essential: true });

    const turn = (to, dur = 1.6) => S.play(async (w) => {
      await w(0.6);
      const from = st.f, a0 = A0 + SPAN * from;
      const [hx, hy] = P(a0, 80);
      await S.hand.move(hx, hy);
      await S.tween({ dur, onUpdate: (k) => { st.f = from + (to - from) * k; const [x, y] = P(A0 + SPAN * st.f, 80); S.hand.show(x, y); } }).promise;
      await w(0.5); S.hand.hide();
    });
    return {
      step(i) {
        S.to(st, { labels: i === 0 ? 1 : 0, split: i >= 2 ? 1 : 0, formula: i >= 3 ? 1 : 0, ard: i === 5 ? 1 : 0 }, 0.5);
        if (i === 0) S.to(st, { f: 0.3 }, 0.6);
        if (i === 1) { st.f = 0.15; turn(0.85); }
        if (i === 2) S.to(st, { f: 0.3 }, 0.6);
        if (i === 4) { turn(0.5, 1.0); }
        if (i === 5) S.to(st, { f: 0.5 }, 0.4);
      },
    };
  },
});
