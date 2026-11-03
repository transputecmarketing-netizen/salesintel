// Module gallery / visual QA harness.
//   /dev/modules.html            → every module in a grid
//   /dev/modules.html?m=oled     → one module, framed
//   &pins=1 → red markers at pin(name); &wires=1 → a jumper on every pin; &az=90 → rotate view; &zoom=1.5
import '@fontsource/barlow-semi-condensed/500.css';
import '@fontsource/barlow-semi-condensed/600.css';
import '@fontsource/barlow-semi-condensed/700.css';
import '@fontsource/ibm-plex-mono/600.css';
import * as THREE from 'three';
import { Stage } from '../src/scene/stage.js';
import { makeBreadboard } from '../src/scene/breadboard.js';
import { makeWire } from '../src/scene/wire.js';
import * as M from '../src/scene/modules.js';

const q = new URLSearchParams(location.search);
const only = q.get('m');
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const OPTS = { rotY: THREE.MathUtils.degToRad(+(q.get('rotY') ?? 0)) };

const hsv = (h) => {
  const c = new THREE.Color().setHSL(h % 1, 1, 0.5);
  return [c.r * 255, c.g * 255, c.b * 255].map(Math.round);
};

// key → (pos) => { parts: [...], tick?(dt, t) }
const DEMOS = {
  oled: (p) => {
    const o = M.makeOLED(p, OPTS);
    o.text(['Tinker Lab', '', 'Temp  23.5°C', 'Light 68%'], { size: 1, y: 2 });
    o.text(['OK'], { size: 2, x: 104, y: 2, clear: false });
    o.bar(4, 48, 120, 12, 0.68);
    return { parts: [o] };
  },
  lcd: (p) => {
    const l = M.makeLCD1602(p, OPTS);
    l.print(0, 0, 'Hello, world!');
    l.print(1, 0, 'Temp: 23.5°C');
    return { parts: [l] };
  },
  ring: (p) => {
    const r = M.makeNeoPixelRing(p, OPTS);
    return { parts: [r], tick: (dt, t) => { for (let i = 0; i < r.count; i++) r.setPixel(i, ...hsv(i / r.count + t * 0.2)); r.show(); } };
  },
  strip: (p) => {
    const s = M.makeNeoPixelStrip(p.clone().add(V(-6, 0, 0)), 8);
    return { parts: [s], tick: (dt, t) => { for (let i = 0; i < s.count; i++) s.setPixel(i, ...hsv(i / s.count + t * 0.2)); s.show(); } };
  },
  stepper: (p) => {
    const s = M.makeStepper(p.clone().add(V(-2, 0, 0)), OPTS);
    s.setAngle(40);
    return { parts: [s], tick: () => s.step(1) };
  },
  relay: (p) => {
    const r = M.makeRelay(p.clone().add(V(-2.5, 0, 0)));
    const lamp = M.makeLamp(p.clone().add(V(3.6, 0, -1)));
    r.set(true);
    lamp.set(true);
    const w1 = makeWire(r.pin('COM'), lamp.terminal(0), 'red', { lift: 1.2 });
    const w2 = makeWire(r.pin('NO'), lamp.terminal(1), 'black', { lift: 1.6 });
    return { parts: [r, lamp, w1, w2] };
  },
  lamp: (p) => {
    const lamp = M.makeLamp(p);
    lamp.set(true);
    return { parts: [lamp] };
  },
  pir: (p) => {
    const s = M.makePIR(p.clone().add(V(-1.8, 0, 0)));
    const man = M.makePerson(p.clone().add(V(2.5, 0, 0.5)), { rotY: -0.6 });
    s.trigger(true);
    return { parts: [s, man] };
  },
  person: (p) => ({ parts: [M.makePerson(p)] }),
  dht: (p) => ({ parts: [M.makeDHT11(p, OPTS)] }),
  joystick: (p) => {
    const j = M.makeJoystick(p, OPTS);
    return { parts: [j], tick: (dt, t) => j.set(Math.cos(t), Math.sin(t)) };
  },
  ir: (p) => {
    const r = M.makeIRReceiver(p.clone().add(V(-2.5, 0, -2)));
    const rem = M.makeRemote(p.clone().add(V(2, 0, 2.5)), { rotY: 0.5 });
    return { parts: [r, rem], tick: (dt, t) => { if ((t % 1.2) < dt) { rem.flash(); r.flash(); } } };
  },
  keypad: (p) => {
    const k = M.makeKeypad(p.clone().add(V(0, 0, -2.5)), OPTS);
    k.press('5');
    return { parts: [k] };
  },
  mpu: (p) => {
    const m = M.makeMPU6050(p, OPTS);
    return { parts: [m], tick: (dt, t) => m.setTilt(Math.sin(t) * 20, Math.cos(t * 0.7) * 15) };
  },
  soil: (p) => {
    const s = M.makeSoilSensor(p, OPTS);
    s.setMoisture(0.5);
    return { parts: [s] };
  },
  soilDry: (p) => {
    const a = M.makeSoilSensor(p.clone().add(V(-3.2, 0, 0)));
    a.setMoisture(0);
    const b = M.makeSoilSensor(p.clone().add(V(3.2, 0, 0)));
    b.setMoisture(1);
    return { parts: [a, b] };
  },
  sound: (p) => {
    const s = M.makeSoundSensor(p, OPTS);
    s.hear(true);
    return { parts: [s] };
  },
  gas: (p) => {
    const s = M.makeGasSensor(p, OPTS);
    s.setDetect(true);
    return { parts: [s] };
  },
  flame: (p) => ({ parts: [M.makeFlameSensor(p, OPTS)] }),
  encoder: (p) => {
    const e = M.makeRotaryEncoder(p, OPTS);
    return { parts: [e], tick: (dt, t) => e.setAngle(t * 60) };
  },
  rtc: (p) => ({ parts: [M.makeRTC(p, OPTS)] }),
  sd: (p) => ({ parts: [M.makeSDCard(p, OPTS)] }),
  hc05: (p) => ({ parts: [M.makeHC05(p, OPTS)] }),
  l298n: (p) => ({ parts: [M.makeL298N(p, OPTS)] }),
  fsr: (p) => {
    const f = M.makeFSR(p.clone().add(V(0, 0, -1.5)), OPTS);
    f.press(0.7);
    return { parts: [f] };
  },
  car: (p) => {
    const c = M.makeRobotCar(p.clone().add(V(0, 0, -4)));
    if (q.get('drive')) c.setWheels(0.7, 0.45);
    return { parts: [c] };
  },
  breadboard: (p) => {
    const bb = makeBreadboard();
    bb.group.position.copy(p);
    bb.group.updateMatrixWorld(true);
    const seg = M.makeSevenSegment([...[2, 3, 4, 5, 6].map((c) => bb.hole(c, 'c')), ...[2, 3, 4, 5, 6].map((c) => bb.hole(c, 'h'))]);
    seg.showDigit(8, true);
    const dipHoles = [...[9, 10, 11, 12, 13, 14, 15, 16].map((c) => bb.hole(c, 'f')), ...[16, 15, 14, 13, 12, 11, 10, 9].map((c) => bb.hole(c, 'e'))];
    const dip = M.makeDIP(dipHoles, '74HC595', 16);
    const bar = M.makeLEDBar([...[19, 20, 21, 22, 23, 24, 25, 26, 27, 28].map((c) => bb.hole(c, 'f')), ...[19, 20, 21, 22, 23, 24, 25, 26, 27, 28].map((c) => bb.hole(c, 'e'))]);
    bar.setLevel(7);
    return { parts: [{ group: bb.group }, seg, dip, bar], tick: (dt, t) => seg.showDigit(Math.floor(t) % 10, Math.floor(t) % 2 === 0) };
  },
};

// grid order for the overview
const ORDER = ['oled', 'lcd', 'ring', 'strip', 'stepper', 'relay', 'pir', 'dht', 'joystick', 'ir', 'keypad', 'mpu', 'soil', 'sound', 'gas', 'flame', 'encoder', 'rtc', 'sd', 'hc05', 'l298n', 'fsr', 'breadboard', 'car'];

async function main() {
  await Promise.all([
    document.fonts.load('600 20px "Barlow Semi Condensed"'),
    document.fonts.load('700 20px "Barlow Semi Condensed"'),
    document.fonts.load('600 20px "IBM Plex Mono"'),
  ]).catch(() => {});
  const nav = document.getElementById('nav');
  nav.innerHTML = `<a href="?" class="${only ? '' : 'on'}">all</a>` + Object.keys(DEMOS).map((k) => `<a href="?m=${k}" class="${k === only ? 'on' : ''}">${k}</a>`).join('');
  document.getElementById('title').textContent = only ?? 'all modules';

  const stage = new Stage(document.getElementById('c'), document.getElementById('host'));
  window.stage = stage;
  const root = new THREE.Group();
  const tickers = [];
  const add = (key, p) => {
    const { parts, tick } = DEMOS[key](p);
    for (const part of parts) {
      root.add(part.group);
      if (part.tick) tickers.push((dt) => part.tick(dt));
      if (q.get('pins') && part.pin)
        for (const name of part.pins) {
          const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
          s.position.copy(part.pin(name));
          root.add(s);
        }
      if (q.get('wires') && part.pin) {
        const cols = ['black', 'red', 'yellow', 'green', 'blue', 'orange', 'white', 'purple', 'brown'];
        part.pins.forEach((name, i) => {
          const a = part.pin(name);
          const w = makeWire(a, a.clone().add(V(-3 + i * 0.4, -a.y, 5)), cols[i % cols.length]);
          root.add(w.group);
        });
      }
    }
    if (tick) tickers.push(tick);
  };

  if (only) {
    add(only, V(0, 0, 0));
  } else {
    const cols = 6, cell = 14;
    ORDER.forEach((k, i) => add(k, V((i % cols - (cols - 1) / 2) * cell + (k === 'car' ? 6 : 0), 0, (Math.floor(i / cols) - 1.5) * cell + (k === 'car' ? 8 : 0))));
  }
  stage.setContent(root);
  root.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(root);
  const c = bbox.getCenter(V());
  const size = bbox.getSize(V());
  const zoom = +(q.get('zoom') ?? 1);
  stage.frame({ center: [c.x, only ? c.y * 0.8 : 0.5, c.z], size: Math.max(size.x, size.z, size.y * 1.3, 4) * 1.05 / zoom, az: +(q.get('az') ?? 0) }, true);
  let t = q.get('t') ? +q.get('t') : 0;
  // run fixed-time demo states first (for deterministic screenshots)
  for (const fn of tickers) fn(1 / 60, t);
  stage.onTick((dt) => {
    t += dt;
    for (const fn of tickers) fn(dt, t);
  });
  window.__ready = true;
}
main();
