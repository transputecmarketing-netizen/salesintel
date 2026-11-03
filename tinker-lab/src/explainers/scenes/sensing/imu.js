// Accelerometer and gyroscope: a MEMS proof mass on springs, comb capacitors, gravity, shaking and Coriolis.
import { scene, clamp } from '../../engine.js';
import { panel } from '../../kit.js';

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A phone and a magnified view of the tiny mass on springs inside its motion sensor',
  steps: [
    'Inside the chip: a mass smaller than a grain of sand, hung on springs.',
    'Tilt the phone: gravity pulls the mass sideways and the springs stretch.',
    'Comb-shaped fingers sense the gap as a change in capacitance.',
    'Even when it is not moving, it feels gravity: 1 g.',
    'Shake it: the mass lags behind, which measures the acceleration.',
    'A gyroscope wiggles a mass. Turning nudges it sideways (Coriolis).',
    'Phones combine both to know which way is up and how they turn.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { tilt: 0, shake: 0, gyro: 0, rot: 0, comb: 0, ui: 0, grav: 0 };
    // ---------- the phone (left)
    const PX = 170, PY = 250;
    const phone = d.g();
    let screenIcon;
    d.into(phone, () => {
      d.rect(-75, -140, 150, 280, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2.4, roughness: 0.6 });
      d.rect(-64, -124, 128, 236, { fill: '#f4f6ff', stroke: 'none', roughness: 0.3 });
      d.rect(-14, 116, 28, 10, { fill: '#4a4b52', stroke: 'none' });
      d.rect(-12, 10, 24, 24, { fill: '#2a2b31', stroke: C.iris, strokeWidth: 2 });
      screenIcon = d.g(phone);
      d.into(screenIcon, () => { d.rect(-36, -90, 72, 48, { fill: C.irisSoft, stroke: C.iris, strokeWidth: 1.6 }); d.circle(-14, -72, 12, { fill: C.yellow, stroke: 'none' }); d.path('M-36 -46 L-10 -64 L8 -52 L36 -70 L36 -42 L-36 -42 Z', { fill: C.green, stroke: 'none' }); });
    });
    d.text(PX, 470, 'chip', { size: 14, fill: C.irisInk, mono: true });
    d.line(PX + 14, 460, PX + 6, 300, { stroke: C.iris, strokeWidth: 1.2, strokeLineDash: [4, 5] });
    const gArrow = d.g(S.layers.top);
    d.into(gArrow, () => { d.arrow(PX + 120, 160, PX + 120, 250, { stroke: C.ink2, strokeWidth: 2.4, head: 12 }); d.text(PX + 138, 205, 'gravity', { size: 14, fill: C.ink2, mono: true, anchor: 'start' }); });

    // ---------- the magnified accelerometer (right)
    const MX = 575, MY = 255;
    panel(S, 360, 50, 420, 400);
    const zoomT = d.text(570, 76, 'magnified about 500 ×', { size: 14, fill: C.muted, mono: true });
    const accG = d.g();
    let mass, springL, springR, fingersM, cBar1, cBar2;
    d.into(accG, () => {
      d.rect(390, 120, 370, 270, { fill: 'none', stroke: C.ink2, strokeWidth: 2, roughness: 0.6 });
      d.rect(380, 230, 16, 50, { fill: '#9a9ca3', stroke: C.ink, strokeWidth: 1.4 });
      d.rect(754, 230, 16, 50, { fill: '#9a9ca3', stroke: C.ink, strokeWidth: 1.4 });
      // fixed comb fingers above and below
      for (let k = 0; k < 6; k++) { const x = 505 + k * 26; d.rect(x, 130, 7, 52, { fill: '#9a9ca3', stroke: 'none' }); d.rect(x, 328, 7, 52, { fill: '#9a9ca3', stroke: 'none' }); }
      springL = d.el('path', { fill: 'none', stroke: C.ink, 'stroke-width': 2.5 }, accG);
      springR = d.el('path', { fill: 'none', stroke: C.ink, 'stroke-width': 2.5 }, accG);
      mass = d.g(accG);
      d.into(mass, () => {
        d.rect(-80, -50, 160, 100, { fill: C.accentSoft, stroke: C.accent, strokeWidth: 2.4 });
        d.text(0, 0, 'proof mass', { size: 16, fill: C.accentInk, mono: true });
        fingersM = d.g(mass);
        d.into(fingersM, () => { for (let k = 0; k < 6; k++) { const x = -57 + k * 26; d.rect(x, -100, 7, 52, { fill: C.accent, stroke: 'none' }); d.rect(x, 48, 7, 52, { fill: C.accent, stroke: 'none' }); } });
      });
      d.text(400, 410, 'spring', { size: 14, fill: C.muted, mono: true, anchor: 'start' });
    });
    const combG = d.g(S.layers.top, { opacity: 0 });
    d.into(combG, () => {
      d.text(560, 108, 'gaps change → capacitance changes', { size: 14, fill: C.irisInk, mono: true });
      d.text(420, 414, 'C1', { size: 14, fill: C.ink2, mono: true, anchor: 'start' });
      d.text(600, 414, 'C2', { size: 14, fill: C.ink2, mono: true, anchor: 'start' });
    });
    cBar1 = d.el('rect', { x: 446, y: 404, height: 12, fill: C.iris }, combG);
    cBar2 = d.el('rect', { x: 626, y: 404, height: 12, fill: C.iris }, combG);
    // ---------- the gyroscope
    const gyG = d.g(undefined, { opacity: 0 });
    let gmass, trail;
    d.into(gyG, () => {
      d.rect(380, 110, 390, 290, { fill: '#fff', stroke: C.ink2, strokeWidth: 2, roughness: 0.6 });
      d.text(575, 132, 'wiggled up and down, all the time', { size: 14, fill: C.muted, mono: true });
      trail = d.el('path', { fill: 'none', stroke: C.iris, 'stroke-width': 2, opacity: 0.6 }, gyG);
      gmass = d.g(gyG);
      d.into(gmass, () => d.rect(-46, -32, 92, 64, { fill: C.irisSoft, stroke: C.iris, strokeWidth: 2.4 }));
      d.text(575, 384, 'turning pushes it sideways', { size: 14, fill: C.irisInk, mono: true });
    });

    const tiltS = S.ui.slider({ label: 'Tilt', min: -90, max: 90, step: 1, value: 0, format: (v) => `${v}°`, onInput: (v) => (st.tilt = v) });
    const shakeB = S.ui.button({ label: 'Shake', icon: 'vibrate', onClick: () => (st.shake = 1) }).show(false);
    const rotT = S.ui.toggle({ label: 'Turn', value: false, onChange: (on) => S.to(st, { rot: on ? 1 : 0 }, 0.8) }).show(false);
    const rdX = S.ui.readout({ label: 'X', color: C.accent });
    const rdY = S.ui.readout({ label: 'Y', color: C.ink });
    const rdG = S.ui.readout({ label: 'Turning', color: C.iris }).show(false);

    const zig = (x0, x1, y) => { let p = `M${x0} ${y}`; const n = 8; for (let k = 1; k <= n; k++) p += ` L${(x0 + ((x1 - x0) * k) / n).toFixed(1)} ${y + (k === n ? 0 : k % 2 ? -14 : 14)}`; return p; };
    let ph = 0, spin = 0, hist = [];
    S.onTick((dt, t) => {
      ph += dt;
      st.shake = Math.max(0, st.shake - dt * 0.6);
      const sh = st.shake * Math.sin(ph * 14); // phone acceleration while shaking (in g, sideways)
      spin += st.rot * dt * 1.2;
      const ang = st.tilt + ((spin * 180) / Math.PI) * (st.gyro > 0.5 ? 1 : 0);
      S.at(phone, PX + sh * -18, PY, ang);
      gArrow.setAttribute('opacity', st.grav.toFixed(2));
      // what the sensor reports (like a phone does): acceleration minus gravity, in the phone's own axes
      const th = (ang * Math.PI) / 180;
      const ax = sh * 0.8 - Math.sin(th), ay = Math.cos(th);
      // the mass sags towards gravity and lags behind the shake: it moves opposite to the reading
      const disp = clamp(-ax, -1.6, 1.6) * 30;
      S.at(mass, MX + disp, MY);
      springL.setAttribute('d', zig(396, MX + disp - 80, MY));
      springR.setAttribute('d', zig(MX + disp + 80, 754, MY));
      combG.setAttribute('opacity', st.comb.toFixed(2));
      cBar1.setAttribute('width', (60 + disp * 1.4).toFixed(1)); cBar2.setAttribute('width', (60 - disp * 1.4).toFixed(1));
      accG.setAttribute('opacity', (1 - st.gyro).toFixed(2));
      gyG.setAttribute('opacity', st.gyro.toFixed(2));
      zoomT.setAttribute('opacity', (1 - st.gyro).toFixed(2));
      // gyroscope: drive up and down; Coriolis force sideways ∝ rotation rate × drive velocity
      const drive = Math.sin(ph * 7) * 90, vel = Math.cos(ph * 7);
      const gx = MX + st.rot * vel * 60, gy = MY + drive;
      S.at(gmass, gx, gy);
      hist.push([gx, gy]); if (hist.length > 40) hist.shift();
      trail.setAttribute('d', 'M' + hist.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join(' L'));
      screenIcon.setAttribute('transform', `rotate(${st.ui > 0.5 ? -Math.round(ang / 90) * 90 : 0})`);
      rdX.set(`${ax.toFixed(2)} g`); rdY.set(`${ay.toFixed(2)} g`);
      rdG.set(`${Math.round(st.rot * 1.2 * 57.3)} °/s`);
    }, { essential: true });

    return {
      step(i) {
        tiltS.show(i <= 4 || i === 6); shakeB.show(i === 4); rotT.show(i === 5 || i === 6); rdG.show(i >= 5);
        S.to(st, { comb: i === 2 ? 1 : 0, gyro: i === 5 ? 1 : 0, grav: i === 3 || i === 1 ? 1 : 0, ui: i === 6 ? 1 : 0 }, 0.6);
        if (i !== 5 && i !== 6) rotT.set(false);
        if (i === 0 || i === 3) tiltS.set(0);
        if (i === 1) { tiltS.set(0); S.play(async (w) => { await w(0.6); await S.hand.slide(tiltS, 35, 1.5); await w(0.4); S.hand.hide(); }); }
        if (i === 2) tiltS.set(25);
        if (i === 4) { tiltS.set(0); S.play(async (w) => { await w(0.7); await S.hand.press(shakeB.el); st.shake = 1; await w(0.4); S.hand.hide(); }); }
        if (i === 5) { tiltS.set(0); S.play(async (w) => { await w(1.6); await S.hand.press(rotT.el); rotT.set(true); await w(0.4); S.hand.hide(); }); }
        if (i === 6) { tiltS.set(0); rotT.set(false); S.play(async (w) => { await w(0.6); await S.hand.slide(tiltS, 90, 1.8); await w(0.4); S.hand.hide(); }); }
      },
    };
  },
});
