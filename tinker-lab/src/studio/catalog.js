// The Studio parts bin. Each part type describes:
//  • how it mounts: 'bb' (legs into breadboard holes; `legs` are local [x, z]
//    offsets in cm from leg 0, matching the 0.1" grid and the 0.3" channel) or
//    'free' (stands on the table; pins point up),
//  • its pins, default props and inspector controls,
//  • build(): the 3D model (reusing the lesson components and modules),
//  • circuit(): the electrical model stamped into the solver,
//  • read(): what the part does with the solved circuit (brightness, burn-out…).
import * as THREE from 'three';
import {
  makeLED, makeRGBLED, makeResistor, makeButton, makePot, makeLDR, makeBuzzer, makeTO92, makeDiode,
  makeMotor, makeServo, makeUltrasonic, makeBlock,
} from '../scene/components.js';
import {
  makeOLED, makeLCD1602, makeNeoPixelRing, makeNeoPixelStrip, makeSevenSegment, makeRelay, makeLamp,
  makePIR, makeDHT11, makeJoystick, makeKeypad,
} from '../scene/modules.js';
import { mat, box, cyl, at, metal, canvasTexture, glowSprite } from '../scene/kit.js';

export const P = 0.254; // 0.1" pitch in cm
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- LED physics
// Forward voltage at 20 mA for common 5 mm LEDs; Shockley model with n = 2 and a few ohms of series resistance.
export const LED_TYPES = {
  red: { vf: 2.0, rs: 8, label: 'Red', nm: '625 nm' },
  orange: { vf: 2.05, rs: 8, label: 'Orange', nm: '605 nm' },
  yellow: { vf: 2.1, rs: 8, label: 'Yellow', nm: '590 nm' },
  green: { vf: 2.2, rs: 8, label: 'Green', nm: '570 nm' },
  blue: { vf: 3.1, rs: 12, label: 'Blue', nm: '470 nm' },
  white: { vf: 3.1, rs: 12, label: 'White', nm: 'phosphor' },
};
const LED_N = 2;
const NVT = LED_N * 0.025852;
export const ledIs = (vf, rs) => 0.02 / Math.exp((vf - 0.02 * rs) / NVT);
export const LED_MAX_MA = 30;         // absolute maximum continuous current for a 5 mm LED
/** Perceived brightness 0–1 from LED current (A). */
export const ledLevel = (i) => (i <= 2e-5 ? 0 : Math.min(1, Math.sqrt(i / 0.02)));

// E12-style values for the resistor picker
export const OHM_PRESETS = [10, 47, 100, 150, 220, 330, 470, 680, 1000, 2200, 4700, 10000, 22000, 47000, 100000, 1000000];
export function fmtOhms(r) {
  if (r >= 1e6) return `${+(r / 1e6).toPrecision(3)} MΩ`;
  if (r >= 1e3) return `${+(r / 1e3).toPrecision(3)} kΩ`;
  return `${+r.toPrecision(3)} Ω`;
}
/** Two significant figures, 10 Ω – 10 MΩ: what a 4-band colour code can show. */
export function snapOhms(r) {
  r = Math.min(1e7, Math.max(10, Number(r) || 220));
  const e = Math.floor(Math.log10(r)) - 1;
  return Math.round(r / 10 ** e) * 10 ** e;
}
const BAND_NAMES = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
export function bandNames(r) {
  const e = Math.floor(Math.log10(r)) - 1;
  const d = Math.round(r / 10 ** e);
  return [BAND_NAMES[Math.floor(d / 10)], BAND_NAMES[d % 10], BAND_NAMES[e], 'gold'];
}

// ---------------------------------------------------------------- helpers
/** Burnt-out look: darken the LED lens, add a scorch mark and a curl of smoke. */
function burnFx(group, at3) {
  const g = new THREE.Group();
  g.visible = false;
  const smokeTex = canvasTexture(64, 64, (ctx, w) => {
    const gr = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, 'rgba(80,80,86,.75)');
    gr.addColorStop(1, 'rgba(80,80,86,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, w);
  });
  const puffs = [0, 1, 2].map((i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 }));
    s.raycast = () => {};
    s.userData.phase = i / 3;
    g.add(s);
    return s;
  });
  g.position.copy(at3);
  group.add(g);
  let t = 0;
  return {
    set(on) { g.visible = on; },
    tick(dt) {
      if (!g.visible) return;
      t += dt * 0.45;
      for (const s of puffs) {
        const p = (t + s.userData.phase) % 1;
        s.position.set(Math.sin(p * 6 + s.userData.phase * 4) * 0.15, p * 1.6, 0);
        s.scale.setScalar(0.35 + p * 0.9);
        s.material.opacity = 0.55 * (1 - p);
      }
    },
  };
}

function scorchLens(api) {
  // every material in the LED body: darken it
  api.pick.traverse((o) => {
    if (o.isMesh && o.material?.emissive) {
      o.material.color.setHex(0x4a3a30);
      o.material.emissive.setHex(0x000000);
    }
  });
}

/** Wrap a free-standing object (built at the origin) so it can be moved and rotated. */
function freeWrap(inner, pinsLocal, { pos, rot }) {
  const outer = new THREE.Group();
  outer.add(inner.group);
  outer.position.copy(pos);
  outer.rotation.y = -rot * (Math.PI / 2);
  outer.updateMatrixWorld(true);
  return {
    group: outer,
    pick: outer,
    inner,
    pinWorld(name) {
      const p = pinsLocal[name];
      return p ? outer.localToWorld(p.clone()) : null;
    },
    anchor: outer.localToWorld((inner.anchorLocal ?? V3(0, 2, 0)).clone()),
  };
}

function localPins(api, names) {
  const out = {};
  api.group.updateMatrixWorld(true);
  for (const n of names) out[n] = api.pin(n);
  return out;
}

// simple slide switch (SPDT), 3 legs at 0.1"
function makeSlideSwitch(holes) {
  const g = new THREE.Group();
  const m = holes[1].clone();
  const dir = new THREE.Vector3().subVectors(holes[2], holes[0]).normalize();
  const yaw = Math.atan2(-dir.z, dir.x);
  for (const h of holes) {
    const leg = box(0.05, 0.32, 0.03, metal(), { outline: false });
    leg.position.set(h.x, h.y + 0.12, h.z);
    leg.rotation.y = yaw;
    g.add(leg);
  }
  const body = new THREE.Group();
  body.add(at(box(0.86, 0.36, 0.36, mat(0x26282f)), 0, 0.18, 0));
  body.add(at(box(0.9, 0.04, 0.4, metal()), 0, 0.38, 0));
  const knob = box(0.2, 0.26, 0.16, mat(0xe9e5d8));
  knob.position.set(-0.16, 0.5, 0);
  body.add(knob);
  body.position.set(m.x, m.y + 0.2, m.z);
  body.rotation.y = yaw;
  g.add(body);
  return {
    group: g,
    pick: body,
    anchor: V3(m.x, m.y + 1.0, m.z),
    set(pos) { knob.position.x = pos === 'R' ? 0.16 : -0.16; },
  };
}

// 9 V battery / DC supply with two terminal posts
function makeSupply(volts) {
  const g = new THREE.Group();
  const w = 2.6, d = 4.6, h = 1.7;
  const label = canvasTexture(256, 452, (ctx, cw, ch) => {
    ctx.fillStyle = '#26282f';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#e5132d';
    ctx.fillRect(0, ch * 0.62, cw, ch * 0.38);
    ctx.fillStyle = '#f3f1e8';
    ctx.font = '600 92px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${volts}V`, cw / 2, ch * 0.42);
    ctx.font = '500 30px "IBM Plex Mono", monospace';
    ctx.fillText('DC SUPPLY', cw / 2, ch * 0.82);
  });
  const side = mat(0x26282f, { rough: 0.5 });
  const top = mat(0xffffff, { map: label, rough: 0.6, unique: true });
  g.add(at(box(w, h, d, [side, side, top, side, side, side]), 0, h / 2, 0));
  const post = (x, color) => {
    g.add(at(cyl(0.22, 0.22, 0.25, mat(color, { rough: 0.4 })), x, h + 0.12, -d / 2 + 0.6));
    g.add(at(cyl(0.08, 0.08, 0.3, metal()), x, h + 0.36, -d / 2 + 0.6));
  };
  post(-0.6, 0xd8443a);
  post(0.6, 0x2a2c33);
  return { group: g, pick: g, pins: { '+': V3(-0.6, h + 0.5, -d / 2 + 0.6), '−': V3(0.6, h + 0.5, -d / 2 + 0.6) }, anchorLocal: V3(0, h + 1, 0) };
}

/** A grey obstacle block that slides in front of the ultrasonic sensor. */
function obstacle(group, front, dirZ, cm) {
  const b = makeBlock(V3());
  b.group.scale.setScalar(0.7);
  group.add(b.group);
  const place = (c) => {
    const dist = 1.2 + c * 0.09;
    b.group.position.copy(front).addScaledVector(dirZ, dist).setY(0);
    b.group.rotation.y = Math.atan2(dirZ.x, dirZ.z);
  };
  place(cm);
  return place;
}

// ---------------------------------------------------------------- the catalog
// circuit(ctx) gets ctx = { c (Circuit), n(pin) → node, props, state, board } and returns handles.
// read(h, sol, props, state) returns a result object; sol.V(node), sol.I(el) are PWM-averaged.

const ledCircuit = (c, a, k, color) => {
  const t = LED_TYPES[color] ?? LED_TYPES.red;
  return c.D(a, k, ledIs(t.vf, t.rs), LED_N, t.rs);
};

export const PARTS = [
  // ============================== Basics
  {
    type: 'led', name: 'LED', cat: 'Basics', keywords: 'light diode red green blue yellow white',
    mount: 'bb', legs: [[0, 0], [P, 0]], pins: ['A', 'K'], pinLabels: { A: 'anode (+, long leg)', K: 'cathode (−, short leg)' },
    defaults: { color: 'red' },
    controls: [{ type: 'choice', key: 'color', label: 'Colour', options: Object.entries(LED_TYPES).map(([k, t]) => [k, t.label]) }],
    describe: (p) => `${LED_TYPES[p.color]?.label ?? 'Red'} LED · Vf ≈ ${LED_TYPES[p.color]?.vf ?? 2} V · max ${LED_MAX_MA} mA`,
    build({ holes, props }) {
      const api = makeLED(props.color, holes[0], holes[1]);
      const fx = burnFx(api.group, api.anchor.clone().add(V3(0, -0.2, 0)));
      return { ...api, fx, tick: (dt) => fx.tick(dt) };
    },
    circuit({ c, n, props, state }) {
      if (state.burnt) return {};
      return { d: ledCircuit(c, n('A'), n('K'), props.color) };
    },
    read(h, sol) {
      const i = h.d ? sol.I(h.d) : 0;
      return { i, v: h.d ? sol.Vd(h.d) : 0 };
    },
    view(api, r, state) {
      if (state.burnt) {
        if (!api.scorched) { scorchLens(api); api.scorched = true; }
        api.set(0);
        api.fx.set(true);
        return;
      }
      api.set(ledLevel(r.i ?? 0));
    },
  },
  {
    type: 'rgb', name: 'RGB LED', cat: 'Basics', keywords: 'colour common cathode',
    mount: 'bb', legs: [[0, 0], [P, 0], [2 * P, 0], [3 * P, 0]], pins: ['R', 'GND', 'G', 'B'],
    pinLabels: { R: 'red anode', GND: 'common cathode (longest leg)', G: 'green anode', B: 'blue anode' },
    defaults: {},
    describe: () => 'Common-cathode RGB LED · R ≈ 2.0 V, G/B ≈ 3.1 V',
    build({ holes }) { return makeRGBLED(holes); },
    circuit({ c, n, state }) {
      if (state.burnt) return {};
      const k = n('GND');
      return { r: ledCircuit(c, n('R'), k, 'red'), g: ledCircuit(c, n('G'), k, 'green'), b: ledCircuit(c, n('B'), k, 'blue') };
    },
    read(h, sol) {
      if (!h.r) return { i: 0, ch: [0, 0, 0] };
      const ch = [sol.I(h.r), sol.I(h.g), sol.I(h.b)];
      return { i: Math.max(...ch), ch };
    },
    view(api, r, state) {
      if (state.burnt) return api.set(0, 0, 0);
      const [a, b, c] = (r.ch ?? [0, 0, 0]).map((i) => ledLevel(i) * 255);
      api.set(a, b, c);
    },
  },
  {
    type: 'resistor', name: 'Resistor', cat: 'Basics', keywords: 'ohm current limit pull',
    mount: 'bb', legs: [[0, 0], [4 * P, 0]], pins: ['1', '2'],
    defaults: { ohms: 220 },
    controls: [{ type: 'ohms', key: 'ohms', label: 'Resistance' }],
    describe: (p) => `${fmtOhms(p.ohms)} · ${bandNames(p.ohms).join(' · ')} · ¼ W`,
    build({ holes, props }) { return makeResistor(holes[0], holes[1], props.ohms); },
    circuit({ c, n, props }) { return { r: c.R(n('1'), n('2'), props.ohms) }; },
    read(h, sol) {
      const i = sol.I(h.r);
      return { i, p: sol.P(h.r) };
    },
  },
  {
    type: 'diode', name: 'Diode', cat: 'Basics', keywords: '1n4007 flyback rectifier',
    mount: 'bb', legs: [[0, 0], [4 * P, 0]], pins: ['A', 'K'], pinLabels: { A: 'anode', K: 'cathode (band)' },
    defaults: {},
    describe: () => '1N4007-style rectifier · Vf ≈ 0.7 V · 1 A',
    build({ holes }) { return makeDiode(holes[0], holes[1]); },
    circuit({ c, n }) { return { d: c.D(n('A'), n('K'), 5e-9, 1.8, 0.04) }; },
    read(h, sol) { return { i: sol.I(h.d) }; },
  },
  {
    type: 'npn', name: 'NPN transistor', cat: 'Basics', keywords: 'pn2222 2n2222 switch bjt',
    mount: 'bb', legs: [[0, 0], [P, 0], [2 * P, 0]], pins: ['E', 'B', 'C'], pinLabels: { E: 'emitter', B: 'base', C: 'collector' },
    defaults: {},
    describe: () => 'PN2222A-style NPN · pins E B C (flat face toward you) · hFE ≈ 150 · 600 mA',
    build({ holes }) { return makeTO92(holes, 'NPN'); },
    circuit({ c, n }) { return { q: c.Q(n('C'), n('B'), n('E'), { is: 1e-14, bf: 150, br: 2 }) }; },
    read(h, sol) {
      const q = sol.Iq(h.q);
      return { i: q.ic, ib: q.ib, vce: sol.V(h.q.c) - sol.V(h.q.e) };
    },
  },

  // ============================== Inputs
  {
    type: 'button', name: 'Push button', cat: 'Inputs', keywords: 'switch tactile momentary press',
    mount: 'bb', legs: [[0, 0], [2 * P, 0], [0, 3 * P], [2 * P, 3 * P]], pins: ['1a', '2a', '1b', '2b'],
    pinLabels: { '1a': 'side 1', '1b': 'side 1 (joined to 1a)', '2a': 'side 2', '2b': 'side 2 (joined to 2a)' },
    defaults: {}, hold: true,
    describe: () => '6 mm tactile switch · legs across the channel are always joined; pressing joins left to right',
    build({ holes }) { return makeButton(holes); },
    circuit({ c, n, state }) {
      c.R(n('1a'), n('1b'), 0.02);
      c.R(n('2a'), n('2b'), 0.02);
      if (state.pressed) c.R(n('1a'), n('2a'), 0.05);
      return {};
    },
    view(api, r, state) { if (api.pressed !== !!state.pressed) api.press(!!state.pressed); },
  },
  {
    type: 'slide', name: 'Slide switch', cat: 'Inputs', keywords: 'spdt toggle on off',
    mount: 'bb', legs: [[0, 0], [P, 0], [2 * P, 0]], pins: ['L', 'C', 'R'], pinLabels: { L: 'left throw', C: 'common', R: 'right throw' },
    defaults: { pos: 'L' }, toggle: true,
    controls: [{ type: 'choice', key: 'pos', label: 'Position', options: [['L', 'Left'], ['R', 'Right']] }],
    describe: (p) => `SPDT slide switch · common joined to the ${p.pos === 'R' ? 'right' : 'left'} pin`,
    build({ holes }) { return makeSlideSwitch(holes); },
    circuit({ c, n, props }) {
      c.R(n('C'), n(props.pos === 'R' ? 'R' : 'L'), 0.05);
      return {};
    },
    view(api, r, state, props) { api.set(props.pos); },
  },
  {
    type: 'pot', name: 'Potentiometer', cat: 'Inputs', keywords: 'knob variable resistor dial',
    mount: 'bb', legs: [[0, 0], [2 * P, 0], [4 * P, 0]], pins: ['1', 'W', '3'], pinLabels: { 1: 'end 1', W: 'wiper', 3: 'end 3' },
    defaults: { ohms: 10000, pos: 0.5 },
    controls: [
      { type: 'range', key: 'pos', label: 'Knob', min: 0, max: 1, step: 0.01, live: true, format: (v) => `${Math.round(v * 100)} %` },
      { type: 'choice', key: 'ohms', label: 'Track', options: [[1000, '1 kΩ'], [10000, '10 kΩ'], [100000, '100 kΩ']] },
    ],
    describe: (p) => `${fmtOhms(p.ohms)} linear pot · wiper at ${Math.round(p.pos * 100)} % from pin 1`,
    build({ holes }) { return makePot(holes); },
    circuit({ c, n, props }) {
      const R = props.ohms, t = Math.min(1, Math.max(0, props.pos));
      c.R(n('1'), n('W'), Math.max(0.5, t * R));
      c.R(n('W'), n('3'), Math.max(0.5, (1 - t) * R));
      return {};
    },
    view(api, r, state, props) { api.set(props.pos); },
  },
  {
    type: 'ldr', name: 'Light sensor (LDR)', cat: 'Inputs', keywords: 'photoresistor light dependent resistor',
    mount: 'bb', legs: [[0, 0], [P, 0]], pins: ['1', '2'],
    defaults: { lux: 300 },
    controls: [{ type: 'range', key: 'lux', label: 'Light', min: 0, max: 1000, step: 1, live: true, format: (v) => `${Math.round(v)} lux` }],
    describe: (p) => `GL5528-style LDR · ${fmtOhms(ldrOhms(p.lux))} at ${Math.round(p.lux)} lux`,
    build({ holes }) { return makeLDR(holes[0], holes[1]); },
    circuit({ c, n, props }) { return { r: c.R(n('1'), n('2'), ldrOhms(props.lux)) }; },
    read(h, sol) { return { i: sol.I(h.r) }; },
  },
  {
    type: 'joystick', name: 'Joystick', cat: 'Inputs', keywords: 'thumbstick ky-023 analog xy',
    mount: 'free', pins: ['GND', '+5V', 'VRX', 'VRY', 'SW'], defaults: {},
    pinLabels: { VRX: 'X pot wiper', VRY: 'Y pot wiper', SW: 'push switch to GND (use INPUT_PULLUP)' },
    controls: [
      { type: 'range', key: 'x', label: 'X', min: -1, max: 1, step: 0.01, state: true, live: true },
      { type: 'range', key: 'y', label: 'Y', min: -1, max: 1, step: 0.01, state: true, live: true },
      { type: 'hold', key: 'pressed', label: 'Press stick' },
    ],
    describe: () => 'Two 10 kΩ pots and a push switch',
    build({ pos, rot }) {
      const api = makeJoystick(V3());
      api.anchorLocal = V3(0, 3, 0);
      return { ...freeWrap(api, localPins(api, ['GND', '+5V', 'VRX', 'VRY', 'SW']), { pos, rot }), set: api.set, press: api.press };
    },
    circuit({ c, n, state }) {
      for (const [w, v] of [['VRX', state.x ?? 0], ['VRY', state.y ?? 0]]) {
        const t = (v + 1) / 2;
        c.R(n('+5V'), n(w), Math.max(0.5, (1 - t) * 10000));
        c.R(n(w), n('GND'), Math.max(0.5, t * 10000));
      }
      if (state.pressed) c.R(n('SW'), n('GND'), 0.1);
      return {};
    },
    view(api, r, state) { api.set(state.x ?? 0, state.y ?? 0); api.press(!!state.pressed); },
  },
  {
    type: 'keypad', name: 'Keypad 4×4', cat: 'Inputs', keywords: 'membrane matrix keys',
    mount: 'free', pins: ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'], defaults: {},
    controls: [{ type: 'keys', key: 'key', label: 'Press a key', keys: ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D'] }],
    describe: () => 'Membrane matrix: a key joins its row to its column',
    build({ pos, rot }) {
      const api = makeKeypad(V3());
      api.anchorLocal = V3(0, 1.6, -1);
      return { ...freeWrap(api, localPins(api, ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4']), { pos, rot }), press: api.press, release: api.release };
    },
    circuit({ c, n, state }) {
      const keys = '123A456B789C*0#D';
      const k = keys.indexOf(state.key ?? '');
      if (k >= 0) c.R(n(`R${Math.floor(k / 4) + 1}`), n(`C${(k % 4) + 1}`), 50);
      return {};
    },
    view(api, r, state) {
      if (api.shown === state.key) return;
      api.shown = state.key;
      if (state.key) api.press(state.key); else api.release();
    },
  },

  // ============================== Sensors
  {
    type: 'ultrasonic', name: 'Ultrasonic sensor', cat: 'Sensors', keywords: 'hc-sr04 distance sonar echo',
    mount: 'bb', legs: [[0, 0], [P, 0], [2 * P, 0], [3 * P, 0]], pins: ['VCC', 'TRIG', 'ECHO', 'GND'], defaults: { cm: 30 },
    controls: [{ type: 'range', key: 'cm', label: 'Obstacle', min: 2, max: 200, step: 1, live: true, format: (v) => `${Math.round(v)} cm` }],
    describe: (p) => `HC-SR04 · 5 V · obstacle at ${Math.round(p.cm)} cm`,
    needs: { power: ['VCC', 'GND'], min: 4.5 },
    build({ holes, props }) {
      const api = makeUltrasonic(holes);
      const along = new THREE.Vector3().subVectors(holes[3], holes[0]).setY(0).normalize();
      const fwd = V3(-along.z, 0, along.x); // the eyes face +z when legs run along +x
      const place = obstacle(api.group, api.front, fwd, props.cm);
      return { ...api, place };
    },
    circuit({ c, n }) {
      return { load: c.R(n('VCC'), n('GND'), 333), trig: c.R(n('TRIG'), n('GND'), 10000), echo: c.V(n('ECHO'), n('GND'), 0, 200) };
    },
    read(h, sol) { return { vcc: sol.V(h.load.a) - sol.V(h.load.b) }; },
    view(api, r, state, props) { if (api.cm !== props.cm) { api.cm = props.cm; api.place(props.cm); } },
  },
  {
    type: 'pir', name: 'Motion sensor (PIR)', cat: 'Sensors', keywords: 'hc-sr501 infrared presence',
    mount: 'free', pins: ['VCC', 'OUT', 'GND'], defaults: {},
    controls: [{ type: 'hold', key: 'motion', label: 'Wave in front of it' }],
    describe: () => 'HC-SR501 · 5–20 V supply · OUT goes to 3.3 V on motion',
    needs: { power: ['VCC', 'GND'], min: 4.5 },
    build({ pos, rot }) {
      const api = makePIR(V3());
      api.anchorLocal = V3(0.2, 2.2, 0);
      return { ...freeWrap(api, localPins(api, ['VCC', 'OUT', 'GND']), { pos, rot }), trigger: api.trigger, tick: (dt) => api.tick(dt) };
    },
    circuit({ c, n, state, powered }) {
      const h = { load: c.R(n('VCC'), n('GND'), 75000) };
      if (powered('VCC', 'GND', 4.5)) h.out = c.V(n('OUT'), n('GND'), state.motion ? 3.3 : 0, 200);
      return h;
    },
    read(h, sol) { return { vcc: sol.V(h.load.a) - sol.V(h.load.b) }; },
    view(api, r, state) { api.trigger(!!state.motion && (r.vcc ?? 0) > 4.5); },
  },
  {
    type: 'dht11', name: 'DHT11', cat: 'Sensors', keywords: 'temperature humidity weather',
    mount: 'free', pins: ['VCC', 'DATA', 'GND'], defaults: { temp: 22, hum: 45 },
    controls: [
      { type: 'range', key: 'temp', label: 'Temperature', min: 0, max: 50, step: 1, live: true, format: (v) => `${v} °C` },
      { type: 'range', key: 'hum', label: 'Humidity', min: 20, max: 90, step: 1, live: true, format: (v) => `${v} %` },
    ],
    describe: (p) => `DHT11 module (10 kΩ pull-up on board) · ${p.temp} °C, ${p.hum} % RH`,
    needs: { power: ['VCC', 'GND'], min: 3.0 },
    build({ pos, rot }) {
      const api = makeDHT11(V3());
      api.anchorLocal = V3(0, 1.5, 0);
      return freeWrap(api, localPins(api, ['VCC', 'DATA', 'GND']), { pos, rot });
    },
    circuit({ c, n }) { return { load: c.R(n('VCC'), n('GND'), 5000), pu: c.R(n('DATA'), n('VCC'), 10000) }; },
    read(h, sol) { return { vcc: sol.V(h.load.a) - sol.V(h.load.b) }; },
  },

  // ============================== Outputs
  {
    type: 'buzzer', name: 'Piezo buzzer', cat: 'Outputs', keywords: 'sound tone speaker beep',
    mount: 'bb', legs: [[0, 0], [3 * P, 0]], pins: ['+', '−'], defaults: { kind: 'passive' },
    controls: [{ type: 'choice', key: 'kind', label: 'Type', options: [['passive', 'Passive (use tone())'], ['active', 'Active (beeps on DC)']] }],
    describe: (p) => (p.kind === 'active' ? 'Active buzzer · beeps ≈ 2.3 kHz when powered' : 'Passive piezo · plays the frequency you send with tone()'),
    build({ holes }) { return makeBuzzer(holes[0], holes[1]); },
    circuit({ c, n, props }) { return { r: c.R(n('+'), n('−'), props.kind === 'active' ? 200 : 20000) }; },
    read(h, sol) { return { v: sol.V(h.r.a) - sol.V(h.r.b), i: sol.I(h.r) }; },
    view(api, r) { api.set(!!r.sound, r.sound || 440); },
  },
  {
    type: 'servo', name: 'Micro servo', cat: 'Outputs', keywords: 'sg90 motor angle',
    mount: 'free', pins: ['GND', 'V+', 'SIG'], pinLabels: { GND: 'brown', 'V+': 'red, 5 V', SIG: 'orange, signal' }, defaults: {},
    describe: () => 'SG90-style servo · 4.8–6 V · 0–180°',
    needs: { power: ['V+', 'GND'], min: 4.0 },
    build({ pos, rot }) {
      const api = makeServo(V3());
      api.anchorLocal = V3(-0.55, 2, 0);
      const pins = { GND: V3(1.15, 0.35, -0.15), 'V+': V3(1.15, 0.35, 0), SIG: V3(1.15, 0.35, 0.15) };
      return { ...freeWrap(api, pins, { pos, rot }), set: api.set };
    },
    circuit({ c, n, state }) { return { load: c.R(n('V+'), n('GND'), state.moving ? 25 : 500), sig: c.R(n('SIG'), n('GND'), 100000) }; },
    read(h, sol) { return { vcc: sol.V(h.load.a) - sol.V(h.load.b), i: sol.I(h.load) }; },
  },
  {
    type: 'motor', name: 'DC motor', cat: 'Outputs', keywords: 'fan spin 130',
    mount: 'free', pins: ['T1', 'T2'], defaults: {},
    describe: () => '130-size hobby motor · ≈ 8 Ω winding · stall ≈ 600 mA at 5 V: never drive it straight from a pin',
    build({ pos, rot }) {
      const api = makeMotor(V3());
      api.anchorLocal = V3(0, 2, 1.2);
      return { ...freeWrap(api, { T1: V3(-0.25, 1.15, -0.95), T2: V3(0.25, 1.15, -0.95) }, { pos, rot }), set: api.set, tick: (dt) => api.tick(dt) };
    },
    circuit({ c, n, state }) { return { m: c.V(n('T1'), n('T2'), MOTOR.k * (state.w ?? 0), MOTOR.r) }; },
    read(h, sol) { return { i: sol.I(h.m) }; },
    // mechanical model: J dω/dt = k·i − b·ω
    step(state, r, dt) {
      const w = state.w ?? 0;
      const next = w + ((MOTOR.k * (r.i ?? 0) - MOTOR.b * w) / MOTOR.j) * dt;
      state.w = Math.abs(next) < 1e-4 ? 0 : next;
      return Math.abs(state.w - w) > 1e-4;
    },
    view(api, r, state) { api.set(state.w ?? 0); },
  },
  {
    type: 'relay', name: 'Relay module', cat: 'Outputs', keywords: 'switch mains coil 5v',
    mount: 'free', pins: ['IN', 'VCC', 'GND', 'NO', 'COM', 'NC'], defaults: {},
    pinLabels: { IN: 'HIGH = on', NO: 'normally open', COM: 'common', NC: 'normally closed' },
    describe: () => '1-channel 5 V relay module (active HIGH) · contacts 10 A',
    needs: { power: ['VCC', 'GND'], min: 4.0 },
    build({ pos, rot }) {
      const api = makeRelay(V3());
      api.anchorLocal = V3(0.15, 2.4, 0);
      return { ...freeWrap(api, localPins(api, ['IN', 'VCC', 'GND', 'NO', 'COM', 'NC']), { pos, rot }), set: api.set, tick: (dt) => api.tick(dt) };
    },
    circuit({ c, n, state }) {
      // IN drives the module's transistor through ≈1 kΩ and a base–emitter junction
      const h = { inD: c.D(n('IN'), n('GND'), 1e-14, 1, 1000), coil: c.R(n('VCC'), n('GND'), state.on ? 70 : 2000) };
      c.R(n('COM'), n(state.on ? 'NO' : 'NC'), 0.03);
      return h;
    },
    read(h, sol) { return { iin: sol.I(h.inD), vcc: sol.V(h.coil.a) - sol.V(h.coil.b) }; },
    settle(state, r) {
      const on = (r.iin ?? 0) > 0.4e-3 && (r.vcc ?? 0) > 3.8;
      if (on === !!state.on) return false;
      state.on = on;
      return true;
    },
    view(api, r, state) { api.set(!!state.on); },
  },
  {
    type: 'lamp', name: 'Lamp (12 V)', cat: 'Outputs', keywords: 'bulb light load',
    mount: 'free', pins: ['T1', 'T2'], defaults: {},
    describe: () => '12 V 5 W bulb · ≈ 29 Ω hot · needs its own supply',
    build({ pos, rot }) {
      const api = makeLamp(V3());
      api.anchorLocal = V3(-0.3, 6, 0.6);
      return { ...freeWrap(api, { T1: api.terminal(0), T2: api.terminal(1) }, { pos, rot }), set: api.set };
    },
    circuit({ c, n }) { return { r: c.R(n('T1'), n('T2'), 28.8) }; },
    read(h, sol) { return { p: sol.P(h.r) }; },
    view(api, r) { api.set((r.p ?? 0) > 1); },
  },

  // ============================== Displays
  {
    type: 'sevenseg', name: '7-segment digit', cat: 'Displays', keywords: 'number display common cathode',
    mount: 'bb', legs: [[0, 0], [P, 0], [2 * P, 0], [3 * P, 0], [4 * P, 0], [0, 3 * P], [P, 3 * P], [2 * P, 3 * P], [3 * P, 3 * P], [4 * P, 3 * P]],
    pins: ['g', 'f', 'COM', 'a', 'b', 'e', 'd', 'COM2', 'c', 'DP'], defaults: {},
    describe: () => 'Common-cathode digit · each segment is a red LED (needs its own resistor)',
    build({ holes }) { return makeSevenSegment(holes); },
    circuit({ c, n, state }) {
      if (state.burnt) return {};
      c.R(n('COM'), n('COM2'), 0.05);
      const segs = {};
      for (const s of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'DP']) segs[s] = c.D(n(s), n('COM'), ledIs(1.9, 10), LED_N, 10);
      return { segs };
    },
    read(h, sol) {
      if (!h.segs) return { i: 0, mask: 0 };
      let mask = 0, i = 0;
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'DP'].forEach((s, k) => {
        const cur = sol.I(h.segs[s]);
        i = Math.max(i, cur);
        if (cur > 0.3e-3) mask |= 1 << k;
      });
      return { i, mask };
    },
    view(api, r) { if (api.mask !== r.mask) api.setSegments(r.mask ?? 0); },
  },
  {
    type: 'oled', name: 'OLED 128×64', cat: 'Displays', keywords: 'ssd1306 i2c screen display',
    mount: 'free', pins: ['GND', 'VCC', 'SCL', 'SDA'], defaults: { addr: 0x3c },
    describe: () => 'SSD1306 I²C OLED · 3.3–5 V · address 0x3C',
    needs: { power: ['VCC', 'GND'], min: 3.0, i2c: true },
    build({ pos, rot }) {
      const api = makeOLED(V3());
      api.anchorLocal = V3(0, 1.4, 0);
      return { ...freeWrap(api, localPins(api, ['GND', 'VCC', 'SCL', 'SDA']), { pos, rot }), screen: api };
    },
    circuit({ c, n }) { return { load: c.R(n('VCC'), n('GND'), 220), pa: c.R(n('SDA'), n('VCC'), 4700), pb: c.R(n('SCL'), n('VCC'), 4700) }; },
    read(h, sol) { return { vcc: sol.V(h.load.a) - sol.V(h.load.b) }; },
  },
  {
    type: 'lcd', name: 'LCD 16×2 (I²C)', cat: 'Displays', keywords: 'character display pcf8574 liquidcrystal',
    mount: 'free', pins: ['GND', 'VCC', 'SDA', 'SCL'], defaults: { addr: 0x27 },
    describe: () => '1602 LCD with PCF8574 backpack · 5 V · address 0x27',
    needs: { power: ['VCC', 'GND'], min: 4.5, i2c: true },
    build({ pos, rot }) {
      const api = makeLCD1602(V3());
      api.anchorLocal = V3(0, 2.2, 0);
      return { ...freeWrap(api, localPins(api, ['GND', 'VCC', 'SDA', 'SCL']), { pos, rot }), screen: api };
    },
    circuit({ c, n }) { return { load: c.R(n('VCC'), n('GND'), 160), pa: c.R(n('SDA'), n('VCC'), 4700), pb: c.R(n('SCL'), n('VCC'), 4700) }; },
    read(h, sol) { return { vcc: sol.V(h.load.a) - sol.V(h.load.b) }; },
  },
  {
    type: 'ring', name: 'NeoPixel ring', cat: 'Displays', keywords: 'ws2812 addressable rgb 12',
    mount: 'free', pins: ['DIN', '5V', 'GND'], defaults: { count: 12 },
    describe: () => '12 × WS2812B · 5 V · up to 60 mA per pixel at full white',
    needs: { power: ['5V', 'GND'], min: 3.5, data: 'DIN' },
    build({ pos, rot }) {
      const api = makeNeoPixelRing(V3());
      api.anchorLocal = V3(0, 1.2, 0);
      return { ...freeWrap(api, localPins(api, ['DIN', '5V', 'GND']), { pos, rot }), pixels: api };
    },
    circuit({ c, n, state }) { return { load: c.R(n('5V'), n('GND'), 5 / Math.max(0.004, state.draw ?? 0.012)), din: c.R(n('DIN'), n('GND'), 100000) }; },
    read(h, sol) { return { vcc: sol.V(h.load.a) - sol.V(h.load.b), i: sol.I(h.load) }; },
  },
  {
    type: 'strip', name: 'NeoPixel strip', cat: 'Displays', keywords: 'ws2812 addressable rgb 8 led strip',
    mount: 'free', pins: ['DIN', '5V', 'GND'], defaults: { count: 8 },
    describe: () => '8 × WS2812B (60/m) · 5 V',
    needs: { power: ['5V', 'GND'], min: 3.5, data: 'DIN' },
    build({ pos, rot }) {
      const api = makeNeoPixelStrip(V3(), 8);
      api.anchorLocal = V3(0, 1.2, 0);
      return { ...freeWrap(api, localPins(api, ['DIN', '5V', 'GND']), { pos, rot }), pixels: api };
    },
    circuit({ c, n, state }) { return { load: c.R(n('5V'), n('GND'), 5 / Math.max(0.003, state.draw ?? 0.008)), din: c.R(n('DIN'), n('GND'), 100000) }; },
    read(h, sol) { return { vcc: sol.V(h.load.a) - sol.V(h.load.b), i: sol.I(h.load) }; },
  },

  // ============================== Power
  {
    type: 'supply', name: 'DC supply', cat: 'Power', keywords: 'battery 9v 12v external power',
    mount: 'free', pins: ['+', '−'], defaults: { volts: 12 },
    controls: [{ type: 'choice', key: 'volts', label: 'Voltage', options: [[6, '6 V'], [9, '9 V'], [12, '12 V']] }],
    describe: (p) => `${p.volts} V external supply (separate from the board: join its − to GND to share a ground)`,
    build({ pos, rot, props }) {
      const api = makeSupply(props.volts);
      return freeWrap(api, api.pins, { pos, rot });
    },
    circuit({ c, n, props }) { return { s: c.V(n('+'), n('−'), props.volts, 0.5) }; },
    read(h, sol) { return { i: -sol.I(h.s) }; },
  },
];

export const MOTOR = { r: 8, k: 3.8, b: 0.57, j: 0.17 };
export function ldrOhms(lux) {
  if (lux <= 0.05) return 1e6;
  return Math.min(1e6, Math.max(80, 15000 * (lux / 10) ** -0.7));
}

export const PART = Object.fromEntries(PARTS.map((p) => [p.type, p]));
export const CATEGORIES = ['Basics', 'Inputs', 'Sensors', 'Outputs', 'Displays', 'Power'];

/** World positions of a breadboard part's legs for leg 0 at `origin`, rotated `rot` quarter-turns. */
export function legPositions(def, origin, rot) {
  const c = Math.cos((rot * Math.PI) / 2), s = Math.sin((rot * Math.PI) / 2);
  return def.legs.map(([x, z]) => V3(origin.x + x * c - z * s, origin.y, origin.z + x * s + z * c));
}

/** A standalone 3D model of a part for thumbnails. */
export function thumbObject(def) {
  if (def.mount === 'bb') {
    const holes = legPositions(def, V3(), 0);
    const cx = holes.reduce((a, h) => a + h.x, 0) / holes.length, cz = holes.reduce((a, h) => a + h.z, 0) / holes.length;
    holes.forEach((h) => { h.x -= cx; h.z -= cz; });
    return def.build({ holes, props: { ...def.defaults }, rot: 0 }).group;
  }
  return def.build({ pos: V3(), rot: 0, props: { ...def.defaults } }).group;
}

export { glowSprite };
