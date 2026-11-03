// Lidar: laser time of flight, a spinning scanner and a point cloud built by real ray casting.
import { scene, clamp } from '../../engine.js';

const PXM = 64, CL = 299792458; // 64 px per metre
const WALLS = [[60, 40, 740, 40], [740, 40, 740, 300], [740, 300, 640, 300], [640, 300, 640, 440], [640, 440, 60, 440], [60, 440, 60, 40]];
const BOX = [520, 96, 96, 72];
const PILLARS = [[230, 340, 34], [430, 330, 22]];
const segs = [...WALLS, [BOX[0], BOX[1], BOX[0] + BOX[2], BOX[1]], [BOX[0] + BOX[2], BOX[1], BOX[0] + BOX[2], BOX[1] + BOX[3]], [BOX[0] + BOX[2], BOX[1] + BOX[3], BOX[0], BOX[1] + BOX[3]], [BOX[0], BOX[1] + BOX[3], BOX[0], BOX[1]]];

function cast(ox, oy, a) {
  const dx = Math.cos(a), dy = Math.sin(a);
  let best = 2000;
  for (const [x1, y1, x2, y2] of segs) {
    const ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((x1 - ox) * ey - (y1 - oy) * ex) / den, u = ((x1 - ox) * dy - (y1 - oy) * dx) / den;
    if (t > 0.5 && u >= 0 && u <= 1 && t < best) best = t;
  }
  for (const [cx, cy, r] of PILLARS) {
    const fx = ox - cx, fy = oy - cy, b = fx * dx + fy * dy, c = fx * fx + fy * fy - r * r, disc = b * b - c;
    if (disc >= 0) { const t = -b - Math.sqrt(disc); if (t > 0.5 && t < best) best = t; }
  }
  return best;
}

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A lidar scanner in a room, building a map of dots',
  steps: [
    'Lidar fires short pulses of invisible laser light.',
    'Each pulse bounces back. Its travel time gives the distance.',
    'Light is fast: a wall 10 m away answers in about 67 nanoseconds.',
    'A spinning mirror sweeps the beam all the way around.',
    'Thousands of dots build a map called a point cloud.',
    'Drag the robot: it maps the room as it moves.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { room: 1, spin: 0, pulse: 1, rx: 300, ry: 210, ang: 0, pt: 0 };
    const roomG = d.g();
    d.into(roomG, () => {
      d.poly([[60, 40], [740, 40], [740, 300], [640, 300], [640, 440], [60, 440]], { fill: '#fbfaf7', stroke: C.ink, strokeWidth: 3, roughness: 0.6 });
      d.rect(...BOX, { fill: C.yellowSoft, stroke: C.ink, strokeWidth: 2.2 });
      d.text(BOX[0] + BOX[2] / 2, BOX[1] + BOX[3] / 2, 'box', { size: 15, fill: C.ink2, mono: true });
      for (const [x, y, r] of PILLARS) d.circle(x, y, r * 2, { fill: C.subtle2, stroke: C.ink, strokeWidth: 2.2 });
      d.text(700, 470, '1 m', { size: 13, fill: C.muted, mono: true });
      d.line(668, 482, 732, 482, { stroke: C.muted, strokeWidth: 2, roughness: 0.2 });
    });
    const cloud = d.g(S.layers.fx);
    const beam = d.el('line', { stroke: C.accent, 'stroke-width': 2, opacity: 0.7 }, S.layers.fx);
    const pulse = d.el('circle', { r: 7, fill: C.accent }, S.layers.fx);
    const robot = d.g(S.layers.top);
    let mirror;
    d.into(robot, () => {
      d.circle(0, 0, 58, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2 });
      mirror = d.g(robot);
      d.into(mirror, () => { d.circle(0, 0, 26, { fill: '#c7c9cf', stroke: C.ink, strokeWidth: 1.4 }); d.line(0, 0, 13, 0, { stroke: C.accent, strokeWidth: 3 }); });
    });
    const rHit = d.el('circle', { r: 40, fill: 'transparent' }, robot);
    S.drag(rHit, { move: (x, y) => { st.rx = clamp(x, 100, 700); st.ry = clamp(y, 80, 400); if (st.rx > 600 && st.ry > 280) st.ry = 280; } });
    const info = d.text(400, 22, '', { size: 16, fill: C.ink2, mono: true, parent: S.layers.top });
    const rdD = S.ui.readout({ label: 'Distance', color: C.ink });
    const rdT = S.ui.readout({ label: 'Round trip', color: C.accent });
    const roomT = S.ui.toggle({ label: 'Show room', value: true, onChange: (on) => S.to(st, { room: on ? 1 : 0 }, 0.6) }).show(false);

    const pts = [];
    let pulseT = 0, tgtA = -0.35;
    S.onTick((dt) => {
      roomG.setAttribute('opacity', (0.12 + 0.88 * st.room).toFixed(2));
      S.at(robot, st.rx, st.ry);
      const prevA = st.ang;
      if (st.spin) st.ang += dt * Math.PI * 2 * 0.6;
      else st.ang = tgtA;
      mirror.setAttribute('transform', `rotate(${((st.ang * 180) / Math.PI).toFixed(1)})`);
      const dist = cast(st.rx, st.ry, st.ang);
      const ex = st.rx + Math.cos(st.ang) * dist, ey = st.ry + Math.sin(st.ang) * dist;
      beam.setAttribute('x1', st.rx); beam.setAttribute('y1', st.ry); beam.setAttribute('x2', ex.toFixed(1)); beam.setAttribute('y2', ey.toFixed(1));
      beam.setAttribute('opacity', st.spin ? 0.5 : 0.25);
      const m = dist / PXM, ns = (2 * m / CL) * 1e9;
      // a pulse travelling out and back, in extreme slow motion
      if (!st.spin && st.pulse) {
        pulseT = (pulseT + dt * 300) % (2 * dist + 120);
        const s = pulseT < dist ? pulseT : pulseT < 2 * dist ? 2 * dist - pulseT : 0;
        pulse.setAttribute('cx', (st.rx + Math.cos(st.ang) * s).toFixed(1)); pulse.setAttribute('cy', (st.ry + Math.sin(st.ang) * s).toFixed(1));
        pulse.setAttribute('opacity', pulseT < 2 * dist ? 1 : 0);
        pulse.setAttribute('fill', pulseT < dist ? C.accent : C.iris);
      } else pulse.setAttribute('opacity', 0);
      // sample points along the sweep
      if (st.spin) {
        for (let a = prevA; a < st.ang; a += 0.012) {
          const r = cast(st.rx, st.ry, a);
          if (r > 1500) continue;
          const el = d.el('circle', { cx: (st.rx + Math.cos(a) * r).toFixed(1), cy: (st.ry + Math.sin(a) * r).toFixed(1), r: 2.6, fill: C.accent }, cloud);
          pts.push({ el, life: 1 });
        }
      }
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        p.life -= dt / 9;
        if (p.life <= 0 || pts.length > 2600) { p.el.remove(); pts.splice(i, 1); continue; }
        p.el.setAttribute('opacity', p.life.toFixed(2));
      }
      info.textContent = st.spin ? `${pts.length} dots in the map` : `${m.toFixed(2)} m · ${ns.toFixed(1)} ns there and back`;
      rdD.set(`${m.toFixed(2)} m`); rdT.set(`${ns.toFixed(1)} ns`);
    }, { essential: true });

    const clear = () => { for (const p of pts) p.el.remove(); pts.length = 0; };
    return {
      step(i) {
        st.spin = i >= 3 ? 1 : 0;
        roomT.show(i >= 4);
        if (i < 4) roomT.set(true);
        if (i <= 2) { clear(); st.rx = 300; st.ry = 210; }
        if (i === 0) tgtA = -0.35;
        if (i === 1) tgtA = 0.15;
        if (i === 2) { st.rx = 100; st.ry = 200; tgtA = 0; } // the far wall, 10.0 m away
        if (i === 4) roomT.set(false);
        if (i === 5) { roomT.set(true); S.play(async (w) => { await w(1.2); await S.hand.drag(st.rx, st.ry, 520, 260, 2.2, (k) => { st.rx = 300 + (520 - 300) * k; st.ry = 210 + 50 * k; }); await w(0.3); S.hand.hide(); }); }
      },
    };
  },
});
