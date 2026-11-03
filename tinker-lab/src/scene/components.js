// Electronic components. Each factory takes the world positions of the
// breadboard holes its legs go into and returns { group, ... } with a small API.
import * as THREE from 'three';
import { mat, mesh, box, cyl, at, bentLeg, rod, metal, glowSprite, glowPool, canvasTexture, COLORS } from './kit.js';

const UP = new THREE.Vector3(0, 1, 0);
const mid = (...ps) => ps.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / ps.length);

/** Legs from holes up into a body whose base sits at height `h` above the holes. */
function legs(group, holes, feet, h, r = 0.022, material = metal()) {
  holes.forEach((p, i) => {
    const f = feet[i];
    const top = new THREE.Vector3(f.x, p.y + h, f.z);
    const pts = [p.clone().addScaledVector(UP, -0.05), p.clone().addScaledVector(UP, Math.min(0.25, h * 0.4))];
    if (p.distanceTo(new THREE.Vector3(f.x, p.y, f.z)) > 0.02) pts.push(top.clone().addScaledVector(UP, -Math.min(0.2, h * 0.3)));
    pts.push(top);
    group.add(pts.length > 2 ? bentLeg(pts, r, material) : rod(pts[0], pts[1], r, material));
  });
}

/** "220 Ω", "4.7 kΩ", "1 MΩ" (for part labels). */
export function formatOhms(ohms) {
  const f = (v) => String(Math.round(v * 100) / 100);
  return ohms >= 1e6 ? `${f(ohms / 1e6)} MΩ` : ohms >= 1000 ? `${f(ohms / 1000)} kΩ` : `${f(ohms)} Ω`;
}
const colourWord = (name) => (name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Red');

function emissiveMat(color, opts = {}) {
  return mat(color, { emissive: color, emissiveIntensity: 0, unique: true, rough: 0.3, ...opts });
}

// ---------------------------------------------------------------- LED
export function makeLED(colorName, anode, cathode, opts = {}) {
  const g = new THREE.Group();
  const c = COLORS[colorName] ?? COLORS.red;
  const m = mid(anode, cathode);
  const h = opts.height ?? 0.55;
  const feet = [m.clone().add(new THREE.Vector3(0.09, 0, 0)), m.clone().add(new THREE.Vector3(-0.09, 0, 0))];
  legs(g, [anode, cathode], feet, h);
  const body = new THREE.Group();
  const lens = emissiveMat(c, { opacity: 0.92 });
  body.add(at(cyl(0.29, 0.29, 0.09, lens), 0, 0.045, 0));
  body.add(at(cyl(0.25, 0.25, 0.42, lens), 0, 0.3, 0));
  const dome = mesh(new THREE.SphereGeometry(0.25, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lens, { outline: false });
  body.add(at(dome, 0, 0.51, 0));
  body.position.set(m.x, m.y + h, m.z);
  g.add(body);
  const glow = glowSprite(c, 2.2);
  glow.position.set(m.x, m.y + h + 0.45, m.z);
  g.add(glow);
  const pool = glowPool(c, 3.4);
  pool.position.set(m.x, m.y + 0.01, m.z);
  g.add(pool);
  const light = new THREE.PointLight(c, 0, 4, 1.6);
  light.position.set(m.x, m.y + h + 0.5, m.z);
  g.add(light);
  let level = 0;
  const api = {
    group: g,
    pick: body,
    anchor: new THREE.Vector3(m.x, m.y + h + 0.8, m.z),
    get level() { return level; },
    color: colorName,
    kind: 'led',
    label: `${colourWord(COLORS[colorName] ? colorName : 'red')} LED`,
    set(v) {
      level = Math.max(0, Math.min(1, v));
      lens.emissiveIntensity = level * 1.6;
      glow.material.opacity = level * 0.85;
      glow.scale.setScalar(glow.userData.baseSize * (0.6 + level * 0.5));
      pool.material.opacity = level * 0.55;
      light.intensity = level * 3.5;
    },
    setColor(name) {
      const col = COLORS[name] ?? COLORS.red;
      api.color = name;
      api.label = `${colourWord(COLORS[name] ? name : 'red')} LED`;
      lens.color.setHex(col);
      lens.emissive.setHex(col);
      glow.material.color.setHex(col);
      pool.material.color.setHex(col);
      light.color.setHex(col);
    },
  };
  return api;
}

// ---------------------------------------------------------------- RGB LED
export function makeRGBLED(holes /* [R, GND, G, B] */) {
  const g = new THREE.Group();
  const m = mid(...holes);
  const h = 0.6;
  const feet = [-0.15, -0.05, 0.05, 0.15].map((dx) => m.clone().add(new THREE.Vector3(dx, 0, 0)));
  legs(g, holes, feet, h);
  const lens = mat(0xf2efe8, { emissive: 0xffffff, emissiveIntensity: 0, unique: true, opacity: 0.95, rough: 0.5 });
  const body = new THREE.Group();
  body.add(at(cyl(0.31, 0.31, 0.09, lens), 0, 0.045, 0));
  body.add(at(cyl(0.27, 0.27, 0.45, lens), 0, 0.32, 0));
  body.add(at(mesh(new THREE.SphereGeometry(0.27, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lens, { outline: false }), 0, 0.545, 0));
  body.position.set(m.x, m.y + h, m.z);
  g.add(body);
  const glow = glowSprite(0xffffff, 2.6);
  glow.position.set(m.x, m.y + h + 0.45, m.z);
  g.add(glow);
  const pool = glowPool(0xffffff, 3.8);
  pool.position.set(m.x, m.y + 0.01, m.z);
  g.add(pool);
  const light = new THREE.PointLight(0xffffff, 0, 4.5, 1.6);
  light.position.set(m.x, m.y + h + 0.5, m.z);
  g.add(light);
  const col = new THREE.Color();
  return {
    group: g,
    pick: body,
    anchor: new THREE.Vector3(m.x, m.y + h + 0.85, m.z),
    kind: 'rgb-led',
    label: 'RGB LED (common cathode)',
    set(r, gr, b) {
      // r, g, b are 0..255 PWM values
      const max = Math.max(r, gr, b) / 255;
      col.setRGB(r / 255, gr / 255, b / 255);
      if (max > 0) lens.emissive.copy(col).multiplyScalar(1 / max);
      lens.emissiveIntensity = max * 1.3;
      glow.material.color.copy(col).multiplyScalar(1 / Math.max(max, 0.01));
      glow.material.opacity = max * 0.85;
      pool.material.color.copy(glow.material.color);
      pool.material.opacity = max * 0.55;
      light.color.copy(glow.material.color);
      light.intensity = max * 3.5;
    },
  };
}

// ---------------------------------------------------------------- resistor
const BAND = ['#1b1b1b', '#7a4a24', '#d8352a', '#f08a2c', '#f2cf2a', '#3a9b4a', '#3164c8', '#7d4bb5', '#8d8d8d', '#f4f2ea'];
function bandsFor(ohms) {
  const e = Math.floor(Math.log10(ohms)) - 1;
  const digits = Math.round(ohms / 10 ** e);
  return [Math.floor(digits / 10), digits % 10, e].map((i) => BAND[i]).concat('#c9a646');
}

export function makeResistor(a, b, ohms = 220, opts = {}) {
  const g = new THREE.Group();
  const m = mid(a, b);
  const h = opts.height ?? 0.32;
  const dir = new THREE.Vector3().subVectors(b, a).setY(0).normalize();
  const half = 0.36;
  const ea = m.clone().addScaledVector(dir, -half - 0.08);
  const eb = m.clone().addScaledVector(dir, half + 0.08);
  for (const [hole, end] of [[a, ea], [b, eb]]) {
    g.add(bentLeg([hole.clone().addScaledVector(UP, -0.05), hole.clone().addScaledVector(UP, h * 0.75), hole.clone().addScaledVector(UP, h).lerp(end.clone().setY(hole.y + h), 0.35), end.clone().setY(hole.y + h)], 0.02));
  }
  const body = new THREE.Group();
  const beige = mat(0xe6cfa0, { rough: 0.6 });
  const core = mesh(new THREE.CapsuleGeometry(0.1, 0.52, 6, 16), beige);
  core.rotation.z = Math.PI / 2;
  body.add(core);
  for (const s of [-1, 1]) body.add(at(mesh(new THREE.SphereGeometry(0.125, 16, 12), beige, { outline: false }), s * 0.27, 0, 0));
  const bandMats = [];
  [-0.22, -0.11, 0, 0.2].forEach((x, i) => {
    const bm = mat(0xffffff, { unique: true, rough: 0.5 });
    bandMats.push(bm);
    const band = cyl(i === 0 ? 0.128 : 0.106, i === 0 ? 0.128 : 0.106, 0.045, bm, { outline: false });
    band.rotation.z = Math.PI / 2;
    body.add(at(band, x, 0, 0));
  });
  body.position.set(m.x, m.y + h, m.z);
  body.rotation.y = -Math.atan2(dir.z, dir.x);
  g.add(body);
  const api = {
    group: g,
    pick: body,
    anchor: new THREE.Vector3(m.x, m.y + h + 0.15, m.z),
    ohms,
    kind: 'resistor',
    label: `${formatOhms(ohms)} resistor`,
    setValue(v) {
      api.ohms = v;
      api.label = `${formatOhms(v)} resistor`;
      bandsFor(v).forEach((c, i) => bandMats[i].color.set(c));
    },
  };
  api.setValue(ohms);
  return api;
}

// ---------------------------------------------------------------- push button
export function makeButton(holes, capColor = 0xd8443a) {
  const g = new THREE.Group();
  const m = mid(...holes);
  const h = 0.12;
  legs(g, holes, holes.map((p) => p.clone().lerp(m, 0.15)), h, 0.03);
  const base = new THREE.Group();
  base.add(at(box(0.62, 0.32, 0.86, mat(0x26282f)), 0, 0.16, 0));
  base.add(at(box(0.64, 0.04, 0.88, metal()), 0, 0.34, 0));
  const cap = new THREE.Group();
  cap.add(at(cyl(0.24, 0.26, 0.2, mat(capColor, { rough: 0.45 })), 0, 0.1, 0));
  cap.position.y = 0.36;
  base.add(cap);
  base.position.set(m.x, m.y + h, m.z);
  g.add(base);
  let pressed = false;
  return {
    group: g,
    pick: base,
    anchor: new THREE.Vector3(m.x, m.y + h + 0.6, m.z),
    kind: 'button',
    label: 'Push button',
    get pressed() { return pressed; },
    press(v) {
      pressed = v;
      cap.position.y = v ? 0.29 : 0.36;
    },
  };
}

// ---------------------------------------------------------------- potentiometer
export function makePot(holes /* 3 in a row */) {
  const g = new THREE.Group();
  const m = mid(...holes);
  const h = 0.15;
  legs(g, holes, holes.map((p) => p.clone().lerp(m, 0.2)), h, 0.03);
  const body = new THREE.Group();
  body.add(at(box(1.05, 0.45, 1.0, mat(0x3462b8)), 0, 0.225, 0));
  body.add(at(cyl(0.42, 0.42, 0.12, metal()), 0, 0.51, 0));
  const knob = new THREE.Group();
  const knurl = cyl(0.38, 0.4, 0.62, mat(0x26282f, { rough: 0.55 }), { seg: 18 });
  knob.add(at(knurl, 0, 0.31, 0));
  knob.add(at(box(0.07, 0.03, 0.32, mat(0xf3f1e8)), 0, 0.63, -0.16));
  knob.position.y = 0.57;
  body.add(knob);
  body.position.set(m.x, m.y + h, m.z);
  g.add(body);
  return {
    group: g,
    pick: body,
    anchor: new THREE.Vector3(m.x, m.y + h + 1.2, m.z),
    kind: 'pot',
    label: 'Potentiometer',
    set(v) { knob.rotation.y = -(v - 0.5) * (Math.PI * 1.5); },
  };
}

// ---------------------------------------------------------------- LDR
export function makeLDR(a, b) {
  const g = new THREE.Group();
  const m = mid(a, b);
  const h = 0.55;
  legs(g, [a, b], [m.clone().add(new THREE.Vector3(-0.1, 0, 0)), m.clone().add(new THREE.Vector3(0.1, 0, 0))], h);
  const tex = canvasTexture(128, 128, (ctx) => {
    ctx.fillStyle = '#e9a23a';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#8a3d1c';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(20, 30);
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(108, 30 + i * 17);
      ctx.lineTo(108, 38 + i * 17);
      ctx.lineTo(20, 38 + i * 17);
      ctx.lineTo(20, 47 + i * 17);
    }
    ctx.stroke();
  });
  const head = new THREE.Group();
  head.add(at(cyl(0.26, 0.26, 0.12, mat(0xd8c9a2)), 0, 0.06, 0));
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }));
  face.rotation.x = -Math.PI / 2;
  head.add(at(face, 0, 0.125, 0));
  head.position.set(m.x, m.y + h, m.z);
  g.add(head);
  return { group: g, pick: head, anchor: new THREE.Vector3(m.x, m.y + h + 0.2, m.z), kind: 'ldr', label: 'Photoresistor (LDR)' };
}

// ---------------------------------------------------------------- piezo buzzer
export function makeBuzzer(a, b) {
  const g = new THREE.Group();
  const m = mid(a, b);
  const h = 0.12;
  legs(g, [a, b], [a.clone().lerp(m, 0.2), b.clone().lerp(m, 0.2)], h, 0.03);
  const body = new THREE.Group();
  body.add(at(cyl(0.6, 0.6, 0.5, mat(0x23252c, { rough: 0.5 }), { seg: 32 }), 0, 0.25, 0));
  body.add(at(cyl(0.12, 0.12, 0.02, mat(0x0a0a0c), { outline: false }), 0, 0.505, 0));
  body.add(at(box(0.08, 0.02, 0.08, mat(0xf3f1e8), { outline: false }), 0.4, 0.505, -0.15));
  body.position.set(m.x, m.y + h, m.z);
  g.add(body);
  const rings = [0, 1, 2].map(() => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.025, 6, 48), new THREE.MeshBasicMaterial({ color: 0x2aa7a1, transparent: true, opacity: 0 }));
    r.rotation.x = Math.PI / 2;
    r.position.set(m.x, m.y + h + 0.6, m.z);
    r.raycast = () => {};
    g.add(r);
    return r;
  });
  let on = false, t = 0, pitch = 1;
  return {
    group: g,
    pick: body,
    anchor: new THREE.Vector3(m.x, m.y + h + 0.6, m.z),
    kind: 'buzzer',
    label: 'Piezo buzzer',
    set(v, freq = 440) { on = v; pitch = freq / 440; },
    tick(dt) {
      t += dt * (on ? 1.2 * Math.sqrt(pitch) : 0);
      rings.forEach((r, i) => {
        const p = (t + i / 3) % 1;
        r.scale.setScalar(1 + p * 1.8);
        r.position.y = m.y + h + 0.55 + p * 0.5;
        r.material.opacity = on ? (1 - p) * 0.8 : Math.max(0, r.material.opacity - dt * 3);
      });
    },
  };
}

// ---------------------------------------------------------------- TO-92 package (transistor / TMP36)
export function makeTO92(holes, label = '', color = 0x24262c) {
  const g = new THREE.Group();
  const m = mid(...holes);
  const h = 0.45;
  legs(g, holes, holes.map((p, i) => m.clone().add(new THREE.Vector3((i - 1) * 0.1, 0, 0))), h);
  const body = new THREE.Group();
  const half = cyl(0.25, 0.25, 0.6, mat(color, { rough: 0.5 }), { thetaStart: Math.PI / 2, thetaLength: Math.PI });
  body.add(at(half, 0, 0.3, 0));
  if (label) {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.6),
      new THREE.MeshBasicMaterial({
        transparent: true,
        map: canvasTexture(128, 160, (ctx) => {
          ctx.fillStyle = '#d6d8de';
          ctx.font = '600 30px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(label, 64, 90);
        }),
      }),
    );
    body.add(at(face, 0, 0.3, 0.252));
  }
  body.position.set(m.x, m.y + h, m.z);
  g.add(body);
  const to92 = /TMP36|LM35/.test(label) ? `${label} temperature sensor` : label === 'NPN' || label === 'PNP' ? `${label} transistor` : label ? `${label} (TO-92)` : 'Transistor';
  return { group: g, pick: body, anchor: new THREE.Vector3(m.x, m.y + h + 0.7, m.z), kind: /TMP36|LM35/.test(label) ? 'sensor' : 'transistor', label: to92 };
}

// ---------------------------------------------------------------- diode (axial, like the resistor)
export function makeDiode(a, b) {
  const g = new THREE.Group();
  const m = mid(a, b);
  const h = 0.3;
  const dir = new THREE.Vector3().subVectors(b, a).setY(0).normalize();
  const ea = m.clone().addScaledVector(dir, -0.3), eb = m.clone().addScaledVector(dir, 0.3);
  for (const [hole, end] of [[a, ea], [b, eb]])
    g.add(bentLeg([hole.clone().addScaledVector(UP, -0.05), hole.clone().addScaledVector(UP, h * 0.75), end.clone().setY(hole.y + h)], 0.02));
  const body = new THREE.Group();
  const c = cyl(0.09, 0.09, 0.45, mat(0x1f2026), { seg: 16 });
  c.rotation.z = Math.PI / 2;
  body.add(c);
  const band = cyl(0.095, 0.095, 0.06, mat(0xd6d6d0), { outline: false, seg: 16 });
  band.rotation.z = Math.PI / 2;
  body.add(at(band, 0.16, 0, 0));
  body.position.set(m.x, m.y + h, m.z);
  body.rotation.y = -Math.atan2(dir.z, dir.x);
  g.add(body);
  return { group: g, pick: body, anchor: new THREE.Vector3(m.x, m.y + h + 0.1, m.z), kind: 'diode', label: 'Diode (1N4001)' };
}

// ---------------------------------------------------------------- DC motor with fan
export function makeMotor(pos) {
  const g = new THREE.Group();
  g.position.copy(pos);
  const stand = box(1.4, 0.5, 1.6, mat(0xd8cdb4));
  stand.position.y = 0.25;
  g.add(stand);
  const can = new THREE.Group();
  const shell = cyl(0.62, 0.62, 1.5, mat(0xc9c6bd, { metal: 0.55, rough: 0.35 }), { seg: 28 });
  shell.rotation.x = Math.PI / 2;
  can.add(shell);
  const back = cyl(0.5, 0.5, 0.12, mat(0x2a2c33), { seg: 28 });
  back.rotation.x = Math.PI / 2;
  can.add(at(back, 0, 0, -0.8));
  const shaft = cyl(0.05, 0.05, 0.5, metal(), { outline: false });
  shaft.rotation.x = Math.PI / 2;
  can.add(at(shaft, 0, 0, 1.0));
  const fan = new THREE.Group();
  const hub = cyl(0.17, 0.17, 0.2, mat(0xf0a22c), { seg: 16 });
  hub.rotation.x = Math.PI / 2;
  fan.add(hub);
  for (let i = 0; i < 3; i++) {
    const blade = box(0.32, 1.25, 0.04, mat(0xf0a22c, { rough: 0.5 }));
    blade.position.y = 0.7;
    const arm = new THREE.Group();
    blade.rotation.y = 0.35;
    arm.add(blade);
    arm.rotation.z = (i * Math.PI * 2) / 3;
    fan.add(arm);
  }
  fan.position.z = 1.25;
  can.add(fan);
  can.position.y = 1.15;
  g.add(can);
  // terminals at the back
  const terms = [-0.25, 0.25].map((x) => {
    const t = box(0.08, 0.2, 0.04, metal(), { outline: false });
    t.position.set(x, 1.15, -0.9);
    g.add(t);
    return new THREE.Vector3(x, 1.15, -0.92).add(pos);
  });
  let speed = 0, angle = 0;
  return {
    group: g,
    pick: can,
    anchor: new THREE.Vector3(pos.x, pos.y + 2.0, pos.z + 1.2),
    terminals: terms,
    kind: 'motor',
    label: 'DC motor with fan',
    set(v) { speed = v; },
    tick(dt) {
      angle += dt * speed * 28;
      fan.rotation.z = angle;
    },
  };
}

// ---------------------------------------------------------------- micro servo
export function makeServo(pos) {
  const g = new THREE.Group();
  g.position.copy(pos);
  const blue = mat(0x2f5fbf, { rough: 0.5 });
  g.add(at(box(2.3, 1.2, 1.2, blue), 0, 0.6, 0));
  g.add(at(box(3.2, 0.1, 1.2, blue), 0, 0.95, 0));
  for (const s of [-1, 1]) g.add(at(cyl(0.1, 0.1, 0.12, mat(0x16171b), { outline: false }), s * 1.4, 0.96, 0));
  g.add(at(cyl(0.55, 0.55, 0.3, blue), -0.55, 1.35, 0));
  g.add(at(cyl(0.22, 0.22, 0.25, mat(0xf3f1e8)), -0.55, 1.6, 0));
  const horn = new THREE.Group();
  horn.add(at(box(2.2, 0.1, 0.32, mat(0xf3f1e8)), 0.75, 0, 0));
  horn.add(at(cyl(0.3, 0.3, 0.12, mat(0xf3f1e8)), 0, 0, 0));
  for (let i = 0; i < 5; i++) horn.add(at(cyl(0.04, 0.04, 0.11, mat(0x9a978d), { outline: false, seg: 8 }), 0.45 + i * 0.3, 0.005, 0));
  horn.position.set(-0.55, 1.75, 0);
  g.add(horn);
  // cable stub leaving the side
  const lead = (i) => new THREE.Vector3(1.15, 0.35, -0.15 + i * 0.15).add(pos);
  return {
    group: g,
    pick: g,
    anchor: new THREE.Vector3(pos.x - 0.55, pos.y + 1.9, pos.z),
    leads: [0, 1, 2].map(lead),
    kind: 'servo',
    label: 'Micro servo (SG90)',
    set(deg) { horn.rotation.y = THREE.MathUtils.degToRad(90 - deg); },
  };
}

// ---------------------------------------------------------------- HC-SR04 ultrasonic sensor
export function makeUltrasonic(holes /* VCC, TRIG, ECHO, GND left→right */) {
  const g = new THREE.Group();
  const m = mid(...holes);
  const h = 0.35;
  legs(g, holes, holes, h, 0.03);
  const board = new THREE.Group();
  board.add(at(box(4.5, 2.0, 0.14, mat(0x2b62c4, { rough: 0.5 })), 0, 1.0, 0));
  board.add(at(box(1.0, 0.25, 0.25, mat(0x23262e)), 0, 0.12, 0));
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    const can = cyl(0.78, 0.78, 0.62, mat(0xd7d4cb, { metal: 0.55, rough: 0.35 }), { seg: 32 });
    can.rotation.x = Math.PI / 2;
    eye.add(can);
    const mesh_ = cyl(0.62, 0.62, 0.02, mat(0x2d2f36, { rough: 0.9 }), { seg: 32, outline: false });
    mesh_.rotation.x = Math.PI / 2;
    eye.add(at(mesh_, 0, 0, 0.31));
    eye.position.set(s * 1.3, 1.1, 0.38);
    board.add(eye);
  }
  board.add(at(cyl(0.18, 0.18, 0.3, mat(0xd7d4cb, { metal: 0.5 })), 0, 1.6, 0.15));
  board.position.set(m.x, m.y + h, m.z);
  g.add(board);
  return {
    group: g,
    pick: board,
    anchor: new THREE.Vector3(m.x, m.y + h + 2.0, m.z),
    front: new THREE.Vector3(m.x, m.y + h + 1.1, m.z + 0.7),
    kind: 'sensor',
    label: 'Ultrasonic sensor (HC-SR04)',
  };
}

// ---------------------------------------------------------------- traffic light module
export function makeTrafficLight(holes /* R, Y, G, GND */) {
  const g = new THREE.Group();
  const m = mid(...holes);
  const h = 0.25;
  legs(g, holes, holes, h, 0.03);
  const head = new THREE.Group();
  head.add(at(box(1.05, 0.2, 0.3, mat(0x23262e)), 0, 0.1, 0));
  head.add(at(box(0.18, 1.2, 0.18, mat(0x3a3d46)), 0, 0.8, 0));
  head.add(at(box(1.0, 2.7, 0.7, mat(0x26282f, { rough: 0.6 })), 0, 2.75, 0));
  const lamps = {};
  [['red', 3.6], ['yellow', 2.75], ['green', 1.9]].forEach(([name, y]) => {
    const c = COLORS[name];
    const lens = emissiveMat(c, { rough: 0.35 });
    lens.color.multiplyScalar(0.55);
    const lamp = mesh(new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lens);
    lamp.rotation.x = Math.PI / 2;
    head.add(at(lamp, 0, y, 0.35));
    const visor = cyl(0.38, 0.38, 0.3, mat(0x1b1d22), { thetaStart: -Math.PI / 2, thetaLength: Math.PI, outline: false });
    visor.rotation.x = Math.PI / 2;
    head.add(at(visor, 0, y, 0.5));
    const glow = glowSprite(c, 2.0);
    glow.position.set(0, y, 0.75);
    head.add(glow);
    lamps[name] = { lens, glow };
  });
  head.position.set(m.x, m.y + h, m.z);
  g.add(head);
  return {
    group: g,
    pick: head,
    anchor: new THREE.Vector3(m.x, m.y + h + 4.2, m.z),
    kind: 'module',
    label: 'Traffic light module',
    set(name, v) {
      const l = lamps[name];
      l.lens.emissiveIntensity = v ? 1.8 : 0;
      l.glow.material.opacity = v ? 0.9 : 0;
    },
  };
}

// ---------------------------------------------------------------- toy car (obstacle)
export function makeCar(pos, color = 0xe5412e) {
  const g = new THREE.Group();
  g.position.copy(pos);
  const paint = mat(color, { rough: 0.45 });
  g.add(at(box(1.9, 0.6, 3.2, paint), 0, 0.65, 0));
  g.add(at(box(1.6, 0.6, 1.6, paint), 0, 1.25, 0.2));
  g.add(at(box(1.62, 0.42, 0.04, mat(0x9fc4d6, { rough: 0.2 })), 0, 1.27, -0.62));
  g.add(at(box(0.04, 0.4, 1.3, mat(0x9fc4d6, { rough: 0.2 })), 0.81, 1.27, 0.2));
  g.add(at(box(0.04, 0.4, 1.3, mat(0x9fc4d6, { rough: 0.2 })), -0.81, 1.27, 0.2));
  for (const s of [-1, 1]) g.add(at(box(0.4, 0.15, 0.05, mat(0xfff3c4, { emissive: 0xfff0b0, emissiveIntensity: 0.4 })), s * 0.6, 0.7, -1.61));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const w = cyl(0.42, 0.42, 0.32, mat(0x24262c), { seg: 20 });
    w.rotation.z = Math.PI / 2;
    g.add(at(w, x * 0.95, 0.42, z * 1.0));
    const hub = cyl(0.18, 0.18, 0.34, mat(0xd8d4c8), { seg: 12, outline: false });
    hub.rotation.z = Math.PI / 2;
    g.add(at(hub, x * 0.96, 0.42, z * 1.0));
  }
  return { group: g, pick: g, anchor: new THREE.Vector3(pos.x, pos.y + 1.7, pos.z), kind: 'prop', label: 'Toy car' };
}

/** Simple box obstacle (used for the distance lesson). */
export function makeBlock(pos) {
  const g = new THREE.Group();
  g.position.copy(pos);
  g.add(at(box(3.2, 2.6, 0.5, mat(0xd9c9a3)), 0, 1.3, 0));
  g.add(at(box(3.2, 0.12, 1.2, mat(0xc4b48c)), 0, 0.06, 0.2));
  return { group: g, pick: g, anchor: new THREE.Vector3(pos.x, pos.y + 2.7, pos.z), kind: 'prop', label: 'Obstacle (a book or box)' };
}

// ---------------------------------------------------------------- ultrasonic "ping" (visual only)
export function makePing(origin) {
  const g = new THREE.Group();
  const arcs = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.04, 6, 32, Math.PI * 0.6),
      new THREE.MeshBasicMaterial({ color: 0x2aa7a1, transparent: true, opacity: 0, depthWrite: false }),
    );
    m.rotation.set(0, 0, Math.PI * 0.2);
    m.raycast = () => {};
    g.add(m);
    return m;
  });
  const pings = [];
  return {
    group: g,
    kind: 'effect',
    label: null,
    /** Send a ping that travels `dist` world units forward (+z) and back. */
    fire(dist) { pings.push({ t: 0, dist }); },
    tick(dt) {
      arcs.forEach((a) => (a.material.opacity = 0));
      for (let i = pings.length - 1; i >= 0; i--) {
        const p = pings[i];
        p.t += dt * 1.6;
        if (p.t > 1) { pings.splice(i, 1); continue; }
        const a = arcs[i % arcs.length];
        const out = p.t < 0.5;
        const k = out ? p.t * 2 : 2 - p.t * 2;
        a.position.set(origin.x, origin.y, origin.z + k * p.dist);
        a.rotation.y = out ? 0 : Math.PI;
        a.scale.setScalar(0.6 + k * 0.6);
        a.material.opacity = 0.85 * (1 - p.t * 0.5);
      }
    },
  };
}
