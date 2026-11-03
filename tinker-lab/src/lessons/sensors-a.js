// Track 2 — Sensors & Inputs (part A): motion, temperature/humidity, soil
// moisture, sound, gas and flame on an Uno-style board.
import * as THREE from 'three';
import { makeBuzzer } from '../scene/components.js';
import { makePIR, makePerson, makeDHT11, makeSoilSensor, makeSoundSensor, makeGasSensor, makeFlameSensor } from '../scene/modules.js';
import { mat, mesh, cyl, at, glowSprite } from '../scene/kit.js';
import { v, BB, clamp, ledOnPin } from './helpers.js';
import { serialPlotter } from '../runtime/devices.js';

const hl = (on) => (on ? 'HIGH' : 'LOW');
const noise = (amp) => Math.round((Math.random() - 0.5) * 2 * amp);
/** Arduino's integer map(): (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin, truncating. */
const amap = (x, a, b, c, d) => (b === a ? c : Math.trunc(((x - a) * (d - c)) / (b - a)) + c);

/** Passive buzzer on the front half of the breadboard: pin → row j, GND → row j. */
function buzzerOn(ctx, bb, { col = 20, pin = 'D8', gnd = 'GND_2' } = {}) {
  const bz = ctx.add(makeBuzzer(bb.hole(col, 'f'), bb.hole(col + 3, 'f')));
  const sig = ctx.wire(ctx.board.pin(pin), bb.hole(col, 'j'), 'orange', { signal: pin });
  const gw = ctx.wire(ctx.board.pin(gnd), bb.hole(col + 3, 'j'), 'black', { signal: 'GND', dir: -1 });
  ctx.interact(bz, { name: 'Piezo buzzer', hint: 'Turn on sound in Settings to hear it' });
  return { bz, sig, gw };
}

/** Soft drifting puffs (breath, gas) around a point; set(0–1) controls density. */
function makePuffs(center, { color = 0xffffff, n = 10, spread = 1.2, rise = 2.2, size = 1.4 } = {}) {
  const g = new THREE.Group();
  const map = glowSprite().material.map;
  const items = [...Array(n)].map((_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, opacity: 0, depthWrite: false }));
    s.raycast = () => {};
    g.add(s);
    return { s, t: i / n, a: (i * 2.4) % (Math.PI * 2) };
  });
  let level = 0;
  return {
    group: g,
    set(x) { level = clamp(x, 0, 1); },
    tick(dt) {
      for (const it of items) {
        it.t = (it.t + dt * 0.22) % 1;
        if (it.t < dt * 0.22) it.a = Math.random() * Math.PI * 2;
        const r = spread * (0.25 + it.t);
        it.s.position.set(center.x + Math.cos(it.a) * r, center.y + it.t * rise, center.z + Math.sin(it.a) * r);
        it.s.scale.setScalar(size * (0.6 + it.t * 1.6));
        it.s.material.opacity = level * 0.55 * Math.sin(it.t * Math.PI);
      }
    },
  };
}

/** Tea-light candle with a flickering flame; setLit(bool). */
function makeCandle(pos) {
  const g = new THREE.Group();
  g.add(at(cyl(0.8, 0.8, 0.55, mat(0xc9c6bd, { rough: 0.35, metal: 0.55 }), { seg: 28 }), 0, 0.275, 0));
  g.add(at(cyl(0.72, 0.72, 0.06, mat(0xf4efe2, { rough: 0.7 }), { seg: 28, outline: false }), 0, 0.53, 0));
  g.add(at(cyl(0.03, 0.03, 0.3, mat(0x2a2522), { seg: 6, outline: false }), 0, 0.68, 0));
  const flame = new THREE.Group();
  const outer = mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffa13a, transparent: true, opacity: 0.92 }), { outline: false, shadow: false });
  outer.scale.set(1, 2.1, 1);
  outer.position.y = 0.32;
  const inner = mesh(new THREE.SphereGeometry(0.11, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff3c0 }), { outline: false, shadow: false });
  inner.scale.set(1, 1.9, 1);
  inner.position.y = 0.26;
  flame.add(outer, inner);
  flame.position.y = 0.72;
  g.add(flame);
  const glow = glowSprite(0xff9a3a, 2.6);
  glow.position.y = 1.15;
  g.add(glow);
  const light = new THREE.PointLight(0xffa04a, 0, 9, 1.6);
  light.position.y = 1.2;
  g.add(light);
  g.position.copy(pos);
  let lit = true, t = 0;
  const api = {
    group: g, pick: g,
    get anchor() { return g.position.clone().add(v(0, 2.0, 0)); },
    get lit() { return lit; },
    flicker: 1,
    setLit(on) { lit = !!on; flame.visible = lit; if (!lit) { glow.material.opacity = 0; light.intensity = 0; } },
    tick(dt) {
      if (!lit) return;
      t += dt;
      const f = 1 + 0.08 * Math.sin(t * 23) + 0.05 * Math.sin(t * 37 + 1) + 0.04 * Math.sin(t * 61);
      api.flicker = f;
      flame.scale.set(1 / Math.sqrt(f), f, 1 / Math.sqrt(f));
      flame.rotation.z = 0.06 * Math.sin(t * 7);
      glow.material.opacity = 0.75 * f;
      light.intensity = 2.2 * f;
    },
  };
  return api;
}

/** Flat translucent sector on the floor (a sensor's field of view). */
function makeZone(center, radius, spread, dirAngle) {
  const geo = new THREE.CircleGeometry(radius, 40, dirAngle - spread / 2, spread);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x2aa7a1, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(center.x, 0.02, center.z);
  m.raycast = () => {};
  return m;
}

/** DHT library's computeHeatIndex(t, h, false): Steadman / Rothfusz with adjustments, °C in and out. */
function heatIndexC(tc, rh) {
  const t = tc * 1.8 + 32;
  let hi = 0.5 * (t + 61.0 + (t - 68.0) * 1.2 + rh * 0.094);
  if (hi > 79) {
    hi = -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh - 0.00683783 * t * t - 0.05481717 * rh * rh
      + 0.00122874 * t * t * rh + 0.00085282 * t * rh * rh - 0.00000199 * t * t * rh * rh;
    if (rh < 13 && t >= 80 && t <= 112) hi -= ((13 - rh) * 0.25) * Math.sqrt((17 - Math.abs(t - 95)) * 0.05882);
    else if (rh > 85 && t >= 80 && t <= 87) hi += ((rh - 85) * 0.1) * ((87 - t) * 0.2);
  }
  return (hi - 32) * 0.55555;
}

export const sensorsA = [
  // ------------------------------------------------------------------ PIR motion alarm
  {
    id: 'pir-alarm', title: 'Motion alarm', icon: 'radar',
    thumb: () => makePIR(v(0, 0, 0)).group,
    view: { center: [6.2, 1.6, 4.9], size: 18 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D13', col: 4, color: 'red' });
      const { bz } = buzzerOn(ctx, bb, { col: 20 });
      const pir = ctx.add(makePIR(v(5.4, 0, 6.0)));
      ctx.wire(ctx.board.pin('5V'), pir.pin('VCC'), 'red', { signal: '5V', dir: -1 });
      const out = ctx.wire(pir.pin('OUT'), ctx.board.pin('D2'), 'yellow', { signal: 'D2', lift: 2.2 });
      ctx.wire(ctx.board.pin('GND_3'), pir.pin('GND'), 'black', { signal: 'GND' });
      const pc = pir.group.localToWorld(v(0.22, 0, 0));
      const R = 6.5;
      const zone = ctx.addObject(makeZone(pc, R, THREE.MathUtils.degToRad(110), -Math.PI / 2));
      const PATH_Z = 10.6, X0 = -4, X1 = 14.5;
      const person = ctx.add(makePerson(v(12, 0, PATH_Z), { rotY: -Math.PI / 2 }));
      const state = { x: 12, dir: -1, auto: true, holdS: 4, running: false, out: false, lastSeen: -1e9, lockUntil: 0, powerOn: 0, lastMotion: 0 };
      const place = () => {
        person.group.position.set(state.x, 0, PATH_Z);
        person.group.rotation.y = state.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      };
      const inZone = () => {
        const dx = state.x - pc.x, dz = PATH_Z - pc.z;
        return Math.hypot(dx, dz) < R && Math.abs(Math.atan2(dx, dz)) < THREE.MathUtils.degToRad(55);
      };
      let bob = 0;
      ctx.onTick((dt) => {
        if (state.auto) {
          state.x += state.dir * dt * 3.2;
          if (state.x > X1) state.dir = -1;
          if (state.x < X0) state.dir = 1;
          bob += dt * 9;
          place();
          person.group.position.y = Math.abs(Math.sin(bob)) * 0.12;
        }
        ctx.anchor('person', person.group.position.clone().add(v(0, 5.9, 0)));
        if (!state.running) return;
        const now = performance.now();
        let o;
        if (now - state.powerOn < 2500) o = Math.sin(now / 260) > 0.2; // settling: random false triggers
        else {
          if (inZone() && now >= state.lockUntil) state.lastSeen = now;
          o = now - state.lastSeen < state.holdS * 1000;
          if (state.out && !o) state.lockUntil = now + 2500; // ≈ 2.5 s block time after each trigger
        }
        state.out = o;
        pir.trigger(o);
        zone.material.color.setHex(o ? 0xf08a2c : 0x2aa7a1);
        zone.material.opacity = o ? 0.2 : 0.12;
      });
      const ctl = [
        { type: 'range', label: 'Position', min: X0, max: X1, step: 0.5, get: () => state.x, set: (x) => { state.auto = false; state.x = x; place(); }, format: (x) => (inZone() ? 'in view' : 'out of view') },
        { type: 'toggle', label: 'Walk automatically', get: () => state.auto, set: (x) => (state.auto = x) },
      ];
      ctx.interact(person, { name: 'Visitor', hint: 'Click to walk them past the sensor yourself', controls: ctl });
      ctx.interact(pir, {
        name: 'HC-SR501 PIR sensor', hint: 'Click to turn the TIME pot or move the visitor',
        controls: [{ type: 'range', label: 'TIME pot (hold)', min: 3, max: 10, step: 0.5, get: () => state.holdS, set: (x) => (state.holdS = x), format: (x) => `${Number(x).toFixed(1)} s` }, ...ctl],
        note: () => (state.running ? `OUT is ${state.out ? 'HIGH' : 'LOW'}` : 'Run the sketch to power the sensor'),
      });
      ctx.anchor('pir', pir.anchor);
      ctx.anchor('person', person.anchor);
      ctx.anchor('out', out.mid);
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('bz', bz.anchor);
      return { ...c, bz, pir, person, zone, state, place };
    },
    hw: (b) => {
      // powering the board powers the PIR: it settles for a few seconds, then OUT follows motion
      Object.assign(b.state, { running: true, powerOn: performance.now(), lastSeen: -1e9, lockUntil: 0, out: false });
      return {
        digitalRead: (pin) => (pin === 2 ? (b.state.out ? 1 : 0) : null),
        digitalWrite: (pin, v) => { if (pin === 13) b.on(v ? 1 : 0); if (pin === 8 && !v) b.bz.set(false); },
        tone: (pin, f) => { if (pin === 8) b.bz.set(true, f); },
        noTone: (pin) => { if (pin === 8) b.bz.set(false); },
      };
    },
    callouts: [
      { anchor: 'out', x: 0.36, y: 0.12, icon: 'pins', title: 'OUT → pin 2', text: 'Goes HIGH (3.3 V) when something warm moves.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'Alarm LED', text: 'Flashes with the buzzer while motion is detected.' },
      { anchor: 'pir', x: 0.04, y: 0.68, icon: 'radar', title: 'PIR sensor', text: 'Its dome splits the room into zones and watches body heat move between them.' },
      { anchor: 'bz', x: 0.7, y: 0.68, icon: 'sound', title: 'Buzzer · pin 8', text: 'Beeps at PITCH Hz. Turn on sound to hear it.' },
      { anchor: 'person', x: 0.04, y: 0.17, icon: 'hand', title: 'Visitor', text: 'Click to walk them yourself.' },
    ],
    overview: {
      heading: 'Motion alarm',
      text: 'A PIR (passive infrared) sensor sees the heat your body gives off. When a warm shape moves across its view, the module pulls its OUT pin HIGH for a few seconds. The sketch just reads that pin like a button and sounds the alarm.',
      features: [['radar', 'HC-SR501 PIR on a digital pin'], ['hand', 'Walk the visitor past it, or let them stroll'], ['sound', 'Flash and beep with <code>tone()</code>']],
    },
    pinout: [
      ['5V', 'PIR VCC', 'Module runs on 5–20 V'],
      ['D2', 'PIR OUT', '3.3 V HIGH — reads as HIGH on a 5 V board'],
      ['GND', 'PIR GND', ''],
      ['D13', '220 Ω → LED', 'Alarm light'],
      ['D8', 'Buzzer +', 'Other leg to GND'],
    ],
    example: {
      text: 'Burglar alarms, automatic porch lights, hand dryers and toilets that flush themselves all use PIR sensors. They draw almost no power, so battery-powered security cameras use one to decide when to wake up.',
      points: ['Turn the TIME pot to change how long OUT stays HIGH', 'Wait for the warm-up before trusting the readings — the sensor settles first'],
    },
    specs: [['Sensor', 'HC-SR501 pyroelectric PIR'], ['Range', '≈ 3–7 m (SENS pot)'], ['View angle', '≈ 110°'], ['Hold time', '≈ 3 s – 5 min (TIME pot)'], ['Block time', '≈ 2.5 s after each trigger'], ['Output', '3.3 V HIGH, LOW when idle'], ['Warm-up', '30–60 s after power-on']],
    quiz: [
      { q: 'What does a PIR sensor actually detect?', options: ['Sound', 'Changes in infrared (heat) as something warm moves', 'Distance with ultrasound', 'Visible light only'], answer: 1, explain: 'It is “passive”: it emits nothing and senses changes in the infrared from warm bodies.' },
      { q: 'Why does the sketch wait a while in setup()?', options: ['The buzzer needs to charge', 'The PIR needs time to settle after power-up and may false-trigger', 'Serial is slow', 'To save power'], answer: 1, explain: 'After power-on the sensor calibrates to the room for up to a minute, and its output is unreliable until then.' },
      { q: 'The visitor walks away but the alarm keeps sounding for a few seconds. Why?', options: ['A bug in loop()', 'The TIME pot holds OUT HIGH after the last movement', 'The buzzer is stuck', 'The LED is still warm'], answer: 1, explain: 'The HC-SR501 keeps OUT HIGH for the hold time set by its TIME potentiometer.' },
      { q: 'OUT gives 3.3 V. Why can a 5 V Uno read it as HIGH?', options: ['It can’t', 'Anything above about 3 V counts as HIGH on a 5 V AVR input', 'The Uno converts it', 'Because of the resistor'], answer: 1, explain: 'The ATmega328P treats inputs above ≈ 0.6 × 5 V = 3 V as HIGH, so 3.3 V works.' },
    ],
    challenges: [
      'Count how many times motion has been detected and print the total.',
      'Add an “arm/disarm” button: the alarm only sounds while armed.',
      'Use millis() to switch a “porch light” LED on for 10 s after the last motion, without delay().',
    ],
    code: `const int PIR_PIN = 2;
const int LED_PIN = 13;
const int BUZZER_PIN = 8;
int lastMotion = LOW;

void setup() {
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("PIR warming up...");
  delay({{warmup}});             // real sensors need 30-60 s
  Serial.println("Alarm armed");
}

void loop() {
  int motion = digitalRead(PIR_PIN);
  if (motion != lastMotion) {
    Serial.println(motion == HIGH ? "Motion detected!" : "All clear");
    lastMotion = motion;
  }
  if (motion == HIGH) {          // flash and beep
    digitalWrite(LED_PIN, HIGH);
    tone(BUZZER_PIN, {{pitch}});
    delay(150);
    digitalWrite(LED_PIN, LOW);
    noTone(BUZZER_PIN);
    delay(150);
  } else {
    delay(50);
  }
}`,
    params: { warmup: { value: 3000, min: 0, max: 10000 }, pitch: { value: 2000, min: 200, max: 5000 } },
    async setup(io, b, p) {
      Object.assign(b.state, { running: true, powerOn: performance.now(), lastSeen: -1e9, lockUntil: 0, lastMotion: 0, out: false });
      io.line('pinMode(PIR_PIN'); await io.delay(80);
      io.line('pinMode(BUZZER_PIN'); await io.delay(80);
      io.line('"PIR warming up..."'); io.print('PIR warming up...');
      io.line('// real sensors'); await io.delay(p.warmup);
      io.line('"Alarm armed"'); io.print('Alarm armed');
    },
    async loop(io, b, p) {
      io.line('digitalRead');
      const motion = b.state.out ? 1 : 0;
      io.pin('D2', hl(motion), motion);
      if (motion !== b.state.lastMotion) {
        io.line('Serial.println(motion');
        io.print(motion ? 'Motion detected!' : 'All clear');
        b.state.lastMotion = motion;
      }
      if (motion) {
        io.line('digitalWrite(LED_PIN, HIGH)'); b.on(); io.board.setBuiltinLed(1); io.pin('D13', 'HIGH', true);
        io.line('tone('); io.tone(p.pitch); b.bz.set(true, p.pitch); io.pin('D8', `${p.pitch} Hz`, true);
        io.line('delay(150)', 1); await io.delay(150);
        io.line('digitalWrite(LED_PIN, LOW)'); b.led.set(0); io.board.setBuiltinLed(0); io.pin('D13', 'LOW', false);
        io.line('noTone'); io.noTone(); b.bz.set(false); io.pin('D8', 'LOW', false);
        io.line('delay(150)', 2); await io.delay(150);
      } else {
        io.line('delay(50)'); await io.delay(50);
      }
    },
    reset(b, io) {
      Object.assign(b.state, { running: false, out: false });
      b.pir.trigger(false);
      b.zone.material.color.setHex(0x2aa7a1);
      b.zone.material.opacity = 0.12;
      b.led.set(0); b.bz.set(false); io.board.setBuiltinLed(0);
    },
  },

  // ------------------------------------------------------------------ DHT11 weather
  {
    id: 'dht-weather', title: 'Temperature & humidity', icon: 'thermo',
    thumb: () => makeDHT11(v(0, 0, 0)).group,
    view: { center: [3.4, 0.9, -1.4], size: 12.5 },
    build(ctx) {
      const dht = ctx.add(makeDHT11(v(6.9, 0, -4.4)));
      ctx.wire(ctx.board.pin('5V'), dht.pin('VCC'), 'red', { signal: '5V', dir: -1, lift: 2.6 });
      const data = ctx.wire(dht.pin('DATA'), ctx.board.pin('D2'), 'yellow', { signal: 'D2' });
      ctx.wire(ctx.board.pin('GND'), dht.pin('GND'), 'black', { signal: 'GND', lift: 1.8 });
      const puffs = ctx.add(makePuffs(dht.group.localToWorld(v(0.5, 0.8, 0)), { color: 0xeef4ff, spread: 0.9, rise: 1.6, size: 1.3 }));
      const plot = ctx.plotter({
        title: 'Serial plotter',
        series: [{ name: 'temp °C', color: '#e5412e', min: 0, max: 50 }, { name: 'humidity %', color: '#3b78e7', min: 0, max: 100 }, { name: 'heat index °C', color: '#f08a2c', min: 0, max: 50 }],
      });
      const state = { t: 23, h: 45, breath: 0, loose: false };
      const read = () => ({ t: state.t + 3 * state.breath, h: state.h + 40 * state.breath });
      ctx.onTick((dt) => { state.breath = Math.max(0, state.breath - dt / 9); puffs.set(state.breath > 0.6 ? (state.breath - 0.6) * 2.5 : 0); });
      ctx.interact(dht, {
        name: 'DHT11 sensor', hint: 'Click to change the weather around it',
        controls: [
          { type: 'range', label: 'Temperature', min: 0, max: 50, step: 0.5, get: () => state.t, set: (x) => (state.t = x), format: (x) => `${Number(x).toFixed(1)} °C` },
          { type: 'range', label: 'Humidity', min: 20, max: 90, step: 1, get: () => state.h, set: (x) => (state.h = x), format: (x) => `${x} %` },
          { type: 'button', label: 'Breathe on it', press: () => (state.breath = 1) },
          { type: 'toggle', label: 'Unplug the DATA wire', get: () => state.loose, set: (x) => { state.loose = x; data.group.visible = !x; } },
        ],
        note: () => { const r = read(); return `Heat index ≈ ${heatIndexC(r.t, r.h).toFixed(1)} °C`; },
      });
      ctx.anchor('dht', dht.anchor);
      ctx.anchor('data', data.mid);
      return { dht, data, plot, state, read };
    },
    hw: (b) => ({
      devices: {
        dht: (pin) => (pin === 2 ? {
          temperature: () => (b.state.loose ? NaN : b.read().t),
          humidity: () => (b.state.loose ? NaN : b.read().h),
        } : null),
      },
      serialWrite: (() => {
        let buf = '';
        return (t) => {
          buf += t;
          const lines = buf.split('\n');
          buf = lines.pop();
          for (const l of lines) {
            const m = /Humidity: ([\d.]+).*Temp: (-?[\d.]+).*Heat index: (-?[\d.]+)/.exec(l);
            if (m) b.plot.push(Number(m[2]), Number(m[1]), Number(m[3]));
          }
        };
      })(),
    }),
    callouts: [
      { anchor: 'dht', x: 0.7, y: 0.17, icon: 'thermo', title: 'DHT11', text: 'Click it to change the temperature and humidity — or breathe on it.' },
      { anchor: 'data', x: 0.36, y: 0.12, icon: 'pins', title: 'DATA → pin 2', text: 'One wire carries 40 bits: humidity, temperature and a checksum.' },
      { anchor: 'power', x: 0.04, y: 0.68, icon: 'plug', title: '5V and GND', text: 'The module already has the 10 kΩ pull-up on DATA.' },
    ],
    overview: {
      heading: 'Temperature & humidity',
      text: 'The DHT11 measures temperature and relative humidity and sends both down a single data wire in a timed pulse code. The DHT library decodes it, and even works out the <em>heat index</em> — how hot it actually feels.',
      features: [['thermo', 'DHT sensor library (Adafruit)'], ['wave', 'Three values on the serial plotter'], ['hand', 'Breathe on it to watch humidity jump']],
    },
    pinout: [['5V', 'VCC', '3.3–5.5 V'], ['D2', 'DATA', 'Pull-up is on the module'], ['GND', 'GND', '']],
    example: {
      text: 'Home weather stations, greenhouse controllers, bathroom extractor fans and server-room monitors all measure humidity with sensors like this. Heat index matters: 32 °C at 70 % humidity feels like over 40 °C.',
      points: ['Install “DHT sensor library” by Adafruit from the Library Manager', 'Read no more than once every 1–2 seconds'],
    },
    specs: [['Temperature', '0–50 °C, ± 2 °C, 1 °C steps'], ['Humidity', '20–90 % RH, ± 5 %'], ['Sample rate', '1 reading per second max'], ['Interface', 'Single-wire, 40-bit frame'], ['Supply', '3.3–5.5 V, ≈ 1 mA while measuring'], ['Library', 'DHT.h (Adafruit DHT sensor library)']],
    quiz: [
      { q: 'Why does the sketch check isnan(h) || isnan(t)?', options: ['To convert to Fahrenheit', 'A failed read returns NaN (“not a number”), e.g. if the wire is loose', 'To round the numbers', 'NaN means it’s too hot'], answer: 1, explain: 'If the timing or checksum fails, the library returns NaN. Try unplugging the DATA wire in the 3D view.' },
      { q: 'Why wait about 2 seconds between readings?', options: ['Serial is slow', 'The DHT11 can only take about one reading per second', 'To save the battery', 'The library needs to reload'], answer: 1, explain: 'The sensor needs time between measurements; reading faster just returns old or failed values.' },
      { q: 'What does the heat index tell you?', options: ['The sensor’s internal temperature', 'How hot it feels to a person, combining temperature and humidity', 'The dew point', 'The maximum temperature today'], answer: 1, explain: 'Humid air slows sweat evaporating, so it feels hotter than the thermometer says.' },
    ],
    challenges: [
      'Print the temperature in Fahrenheit too (<code>dht.readTemperature(true)</code>).',
      'Light an LED when the humidity goes above 70 % (time to open a window).',
      'Track and print the minimum and maximum temperature since power-up.',
    ],
    code: `#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  delay({{rate}});                    // DHT11: one reading per second, max
  float h = dht.readHumidity();
  float t = dht.readTemperature();     // Celsius
  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  float hi = dht.computeHeatIndex(t, h, false);   // false = Celsius
  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.print(" %  Temp: ");
  Serial.print(t);
  Serial.print(" C  Heat index: ");
  Serial.print(hi);
  Serial.println(" C");
}`,
    params: { rate: { value: 2000, min: 1000, max: 10000 } },
    async setup(io, b) { b.plot.reset(); io.line('Serial.begin'); await io.delay(100); io.line('dht.begin'); await io.delay(100); },
    async loop(io, b, p) {
      io.line('delay('); await io.delay(p.rate);
      io.line('readHumidity');
      if (!b.state.loose) io.pin('D2', 'DATA', true);
      await io.delay(40);
      io.line('readTemperature'); await io.delay(30);
      io.pin('D2', 'HIGH', false);
      io.line('isnan');
      if (b.state.loose) {
        io.line('"Failed to read'); io.print('Failed to read from DHT sensor!');
        io.line('return;'); await io.delay(30);
        return;
      }
      const r = b.read();
      const t = Math.round(clamp(r.t, 0, 50));
      const h = Math.round(clamp(r.h, 5, 95));
      io.line('computeHeatIndex'); const hi = heatIndexC(t, h);
      io.line('Serial.println(" C")');
      io.print(`Humidity: ${h.toFixed(2)} %  Temp: ${t.toFixed(2)} C  Heat index: ${hi.toFixed(2)} C`);
      b.plot.push(t, h, hi);
    },
    reset() {},
  },

  // ------------------------------------------------------------------ soil moisture
  {
    id: 'soil-moisture', title: 'Thirsty plant', icon: 'plant',
    thumb: () => makeSoilSensor(v(0, 0, 0), { moisture: 0.7 }).group,
    view: { center: [9.2, 2.4, 1.8], size: 22 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D7', col: 20, color: 'red' });
      const soil = ctx.add(makeSoilSensor(v(15.6, 0, 4.4), { moisture: 0.55 }));
      ctx.wire(ctx.board.pin('GND_2'), soil.pin('GND'), 'black', { signal: 'GND', lift: 2.6 });
      ctx.wire(ctx.board.pin('5V'), soil.pin('VCC'), 'red', { signal: '5V', dir: -1, lift: 3.0 });
      const ao = ctx.wire(soil.pin('AOUT'), ctx.board.pin('A0'), 'yellow', { signal: 'A0', lift: 2.2 });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'moisture %', color: '#3fbf5f', min: 0, max: 100 }, { name: 'raw', color: '#8a5cc6', min: 0, max: 1023 }] });
      const state = { m: 0.55, dry: true, running: false };
      const setM = (m) => { state.m = clamp(m, 0, 1); soil.setMoisture(state.m); };
      ctx.onTick((dt) => { if (state.running && state.dry) setM(state.m - dt * 0.012); });
      ctx.interact(soil, {
        name: 'Capacitive soil sensor', hint: 'Click to water the plant or dry the soil',
        controls: [
          { type: 'range', label: 'Soil moisture', min: 0, max: 100, step: 1, get: () => Math.round(state.m * 100), set: (x) => setM(x / 100), format: (x) => `${x} %` },
          { type: 'button', label: 'Water the plant', press: () => setM(state.m + 0.4) },
          { type: 'toggle', label: 'Soil dries out over time', get: () => state.dry, set: (x) => (state.dry = x) },
        ],
        note: () => `Sensor output ≈ ${(((520 - 260 * state.m) * 5) / 1023).toFixed(2)} V`,
      });
      ctx.anchor('soil', soil.anchor);
      ctx.anchor('probe', soil.group.localToWorld(v(0.75, 7.2, 0.45)));
      ctx.anchor('ao', ao.mid);
      ctx.anchor('led', c.led.anchor);
      return { ...c, soil, plot, state, setM };
    },
    hw: (b) => {
      b.state.running = true;
      return {
        analogRead: (ch) => (ch === 0 ? clamp(Math.round(520 - 260 * b.state.m) + noise(3), 0, 1023) : 0),
        digitalWrite: (pin, v) => { if (pin === 7) b.on(v ? 1 : 0); },
        serialWrite: (() => {
          let buf = '';
          return (t) => {
            buf += t;
            const lines = buf.split('\n');
            buf = lines.pop();
            for (const l of lines) { const m = /Moisture: (-?\d+) %\s+raw: (\d+)/.exec(l); if (m) b.plot.push(Number(m[1]), Number(m[2])); }
          };
        })(),
      };
    },
    callouts: [
      { anchor: 'ao', x: 0.36, y: 0.12, icon: 'wave', title: 'AOUT → A0', text: 'Wetter soil gives a LOWER voltage.' },
      { anchor: 'probe', x: 0.7, y: 0.17, icon: 'plant', title: 'Capacitive probe', text: 'No exposed metal, so it won’t corrode. Click to water.' },
      { anchor: 'led', x: 0.04, y: 0.68, icon: 'led', title: 'Thirsty LED · pin 7', text: 'On when moisture drops below THIRSTY %.' },
      { anchor: 'power', x: 0.04, y: 0.17, icon: 'plug', title: '5V and GND', text: 'The probe works from 3.3 to 5.5 V.' },
    ],
    overview: {
      heading: 'Thirsty plant',
      text: 'A capacitive probe senses how much water is around it: wet soil reads lower, dry soil higher. Every probe is a little different, so you <em>calibrate</em> it — note the reading in dry air and in water — and <code>map()</code> the raw number onto 0–100 %.',
      features: [['plant', 'Click the pot to water or dry the soil'], ['code', 'Calibrate with <code>map()</code> and <code>constrain()</code>'], ['wave', 'Moisture and raw value on the plotter']],
    },
    pinout: [['5V', 'VCC', '3.3–5.5 V'], ['A0', 'AOUT', '≈ 2.5 V dry, ≈ 1.3 V in water'], ['GND', 'GND', ''], ['D7', '220 Ω → LED', 'Thirsty warning']],
    example: {
      text: 'Automatic garden sprinklers, smart plant pots and farm irrigation systems measure soil moisture and only water when it’s needed — saving lots of water.',
      points: ['Calibrate: put DRY_VALUE = reading in air, WET_VALUE = reading in a glass of water', 'Never push the probe in past the line — the electronics aren’t waterproof'],
    },
    specs: [['Sensor', 'Capacitive soil moisture v1.2'], ['Supply', '3.3–5.5 V'], ['Output', 'Analog, ≈ 1.2–2.5 V'], ['Typical raw (5 V)', '≈ 520 in air · ≈ 260 in water'], ['Reading rate', 'Once a second'], ['Wiring', '3-pin JST: GND, VCC, AOUT']],
    quiz: [
      { q: 'In this sketch, what does a smaller raw reading mean?', options: ['Drier soil', 'Wetter soil', 'The sensor is broken', 'Warmer soil'], answer: 1, explain: 'This capacitive probe’s output voltage falls as the moisture around it rises.' },
      { q: 'What does map(raw, DRY_VALUE, WET_VALUE, 0, 100) do?', options: ['Draws a map', 'Scales the raw reading so dry → 0 and wet → 100', 'Rounds to the nearest 100', 'Averages 100 readings'], answer: 1, explain: 'map() stretches one range onto another; because DRY > WET, it also flips the direction.' },
      { q: 'Why is constrain() needed after map()?', options: ['map() can give values below 0 or above 100 if the reading is outside the calibration', 'To make it faster', 'To convert to volts', 'It isn’t needed'], answer: 0, explain: 'Soil drier than air-calibration or wetter than water would map outside 0–100.' },
      { q: 'Why is a capacitive probe better than two bare metal prongs?', options: ['It’s cheaper', 'Its sensing area is coated, so it doesn’t corrode in damp soil', 'It measures temperature too', 'It needs no power'], answer: 1, explain: 'Resistive probes pass current through the soil and their metal corrodes within weeks.' },
    ],
    challenges: [
      'Add hysteresis: switch the LED on below 30 % and off again only above 40 %.',
      'Average 10 readings before converting to a percentage.',
      'Drive a small pump through a transistor or relay for 2 s when the plant is thirsty.',
    ],
    code: `const int SENSOR_PIN = A0;
const int LED_PIN = 7;
const int DRY_VALUE = {{dry}};   // reading in dry air
const int WET_VALUE = {{wet}};   // reading in a glass of water
const int THIRSTY = {{thirsty}};     // % at which the plant needs water

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(SENSOR_PIN);
  int percent = map(raw, DRY_VALUE, WET_VALUE, 0, 100);
  percent = constrain(percent, 0, 100);
  Serial.print("Moisture: ");
  Serial.print(percent);
  Serial.print(" %  raw: ");
  Serial.println(raw);
  digitalWrite(LED_PIN, percent < THIRSTY ? HIGH : LOW);
  delay(1000);
}`,
    params: { dry: { value: 520, min: 300, max: 1023 }, wet: { value: 260, min: 0, max: 600 }, thirsty: { value: 30, min: 0, max: 100 } },
    async setup(io, b) { b.state.running = true; b.plot.reset(); io.line('pinMode'); await io.delay(100); io.line('Serial.begin'); await io.delay(100); },
    async loop(io, b, p) {
      io.line('analogRead');
      const raw = clamp(Math.round(520 - 260 * b.state.m) + noise(3), 0, 1023);
      io.pin('A0', String(raw), true);
      io.line('int percent = map'); let pct = amap(raw, p.dry, p.wet, 0, 100);
      io.line('constrain'); pct = clamp(pct, 0, 100);
      io.line('Serial.println(raw)'); io.print(`Moisture: ${pct} %  raw: ${raw}`);
      b.plot.push(pct, raw);
      io.line('digitalWrite');
      const thirsty = pct < p.thirsty;
      if (thirsty) b.on(); else b.led.set(0);
      io.pin('D7', hl(thirsty), thirsty);
      io.line('delay(1000)'); await io.delay(1000);
    },
    reset(b) { b.state.running = false; b.led.set(0); },
  },

  // ------------------------------------------------------------------ clap switch
  {
    id: 'clap-switch', title: 'Clap switch', icon: 'sound',
    thumb: () => makeSoundSensor(v(0, 0, 0)).group,
    view: { center: [6.4, 1.2, 2.2], size: 17 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D13', col: 8, color: 'yellow' });
      const mic = ctx.add(makeSoundSensor(v(6.2, 0, 5.0)));
      ctx.wire(ctx.board.pin('5V'), mic.pin('+'), 'red', { signal: '5V', dir: -1 });
      ctx.wire(ctx.board.pin('GND_2'), mic.pin('GND'), 'black', { signal: 'GND' });
      const dw = ctx.wire(mic.pin('DO'), ctx.board.pin('D2'), 'yellow', { signal: 'D2', lift: 2.4 });
      // a pair of cartoon hands (with sleeves) next to the microphone
      const hands = new THREE.Group();
      const skin = mat(0xf0c09a, { rough: 0.6 });
      const sleeve = mat(0x3b78e7, { rough: 0.55 });
      const palms = [-1, 1].map((s) => {
        const p = new THREE.Group();
        const palm = mesh(new THREE.CapsuleGeometry(0.42, 0.55, 4, 12), skin);
        palm.scale.set(1, 1, 0.42);
        p.add(palm);
        [-0.27, -0.09, 0.09, 0.27].forEach((x, i) => {
          const f = mesh(new THREE.CapsuleGeometry(0.1, 0.42 + (i === 1 || i === 2 ? 0.1 : 0), 4, 8), skin, { outline: false });
          f.position.set(x, 0.72 + (i === 1 || i === 2 ? 0.05 : 0), 0);
          p.add(f);
        });
        const thumb = mesh(new THREE.CapsuleGeometry(0.11, 0.38, 4, 8), skin, { outline: false });
        thumb.position.set(0.5, 0.05, 0);
        thumb.rotation.z = -0.7;
        p.add(thumb);
        const cuff = mesh(new THREE.CapsuleGeometry(0.34, 0.3, 4, 12), sleeve);
        cuff.scale.set(1, 1, 0.75);
        cuff.position.set(0, -0.82, 0);
        p.add(cuff);
        p.position.z = s * 0.9;
        p.rotation.x = s * 0.18;
        hands.add(p);
        return p;
      });
      hands.position.set(11.4, 2.6, 6.0);
      hands.rotation.y = -0.6;
      ctx.addObject(hands);
      const state = { events: [], clapAnim: 0, hearT: 0, t0: 0, claps: 0, firstClap: 0, lastClap: 0, lightOn: false };
      const clap = () => {
        const t = performance.now();
        state.events.push(t, t + 55); // the clap and its ringing echo both trip DO
        state.clapAnim = 0.25;
        state.hearT = 0.18;
      };
      ctx.onTick((dt) => {
        state.clapAnim = Math.max(0, state.clapAnim - dt);
        const k = state.clapAnim > 0 ? Math.sin((state.clapAnim / 0.25) * Math.PI) : 0;
        palms.forEach((p, i) => { p.position.z = (i ? 1 : -1) * (0.9 - 0.62 * k); });
        state.hearT = Math.max(0, state.hearT - dt);
        mic.hear(state.hearT > 0);
      });
      const ctl = [
        { type: 'button', label: 'Clap once', press: clap },
        { type: 'button', label: 'Clap twice', press: () => { clap(); setTimeout(clap, 320); } },
        { type: 'button', label: 'Two slow claps', press: () => { clap(); setTimeout(clap, 1500); } },
      ];
      ctx.interact(mic, { name: 'KY-038 sound sensor', hint: 'Click to clap at it', controls: ctl });
      ctx.interact({ group: hands }, { name: 'Your hands', hint: 'Click to clap', controls: ctl });
      ctx.anchor('mic', mic.anchor);
      ctx.anchor('do', dw.mid);
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('hands', hands.position.clone().add(v(0, 1.2, 0)));
      return { ...c, mic, state, clap };
    },
    hw: (b) => {
      b.state.events = [];
      return {
        // DO is HIGH for ~15 ms at each clap and again at its echo
        digitalRead: (pin) => {
          if (pin !== 2) return null;
          const now = performance.now();
          const ev = b.state.events;
          while (ev.length && now - ev[0] > 15) ev.shift();
          return ev.length && now >= ev[0] ? 1 : 0;
        },
        digitalWrite: (pin, v) => { if (pin === 13) b.on(v ? 1 : 0); },
      };
    },
    callouts: [
      { anchor: 'do', x: 0.36, y: 0.12, icon: 'pins', title: 'DO → pin 2', text: 'Pulses HIGH whenever the sound is louder than the trimmer setting.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'The light', text: 'Two claps in quick succession flip it on or off.' },
      { anchor: 'mic', x: 0.04, y: 0.68, icon: 'sound', title: 'Sound sensor', text: 'A microphone, an amplifier and a comparator. The blue trimmer sets the threshold.' },
      { anchor: 'hands', x: 0.7, y: 0.68, icon: 'hand', title: 'Clap!', text: 'Click the hands or the sensor to clap.' },
    ],
    overview: {
      heading: 'Clap switch',
      text: 'The sound module’s DO pin pulses HIGH on any loud noise. A single bang shouldn’t switch the lights, so the sketch waits for <em>two</em> claps close together, using <code>millis()</code> timestamps to ignore echoes and claps that are too slow.',
      features: [['sound', 'KY-038 digital output on pin 2'], ['timer', 'Timing windows with <code>millis()</code>'], ['hand', 'Clap once, twice, or too slowly']],
    },
    pinout: [['5V', '+', ''], ['GND', 'GND', ''], ['D2', 'DO', 'HIGH on loud sound (some boards: LOW — check)'], ['AO', 'Not used', 'Raw microphone level'], ['D13', '220 Ω → LED', '']],
    example: {
      text: 'Clap-on lamps were a 1980s gadget hit, and the same timing trick is used to spot double-taps on phones, double-clicks on a mouse and knock patterns on smart locks.',
      points: ['Turn the trimmer until the DO LED only flickers on claps, not on talking', 'Make WINDOW_MS shorter to need quicker claps'],
    },
    specs: [['Module', 'KY-038 (electret mic + LM393)'], ['Supply', '3.3–5 V'], ['DO', 'Digital, threshold set by trimmer'], ['AO', 'Analog microphone level'], ['Echo guard', '120 ms'], ['Double-clap window', 'WINDOW_MS (800 ms default)']],
    quiz: [
      { q: 'Why ignore anything within 120 ms of the last clap?', options: ['To save power', 'One clap rings and bounces for a moment and could count as two', 'Serial needs time', 'The LED is slow'], answer: 1, explain: 'A clap and its echo can trip DO twice in a few milliseconds; ECHO_MS filters that out.' },
      { q: 'What happens if the second clap comes 2 seconds after the first?', options: ['The light toggles', 'The first clap is forgotten after WINDOW_MS and the second counts as a new “first” clap', 'The board resets', 'Both are ignored for ever'], answer: 1, explain: 'Once WINDOW_MS passes with only one clap, claps resets to 0.' },
      { q: 'What sets how loud a sound must be to trigger DO?', options: ['The code', 'The blue trimmer potentiometer on the module', 'The LED resistor', 'The baud rate'], answer: 1, explain: 'The trimmer sets the comparator’s reference voltage — the threshold.' },
    ],
    challenges: [
      'Make three claps do something different, like blink the LED.',
      'Read AO with analogRead() and print the loudness on the serial plotter.',
      'Ignore claps for 2 s after the light changes, so you can’t trigger it twice by accident.',
    ],
    code: `const int SOUND_PIN = 2;            // module DO: HIGH on a loud sound
const int LED_PIN = 13;
const unsigned long ECHO_MS = 120;        // ignore ringing from the same clap
const unsigned long WINDOW_MS = {{window}};   // second clap must come within this

bool lightOn = false;
int claps = 0;
unsigned long firstClap = 0, lastClap = 0;

void setup() {
  pinMode(SOUND_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  unsigned long now = millis();
  if (digitalRead(SOUND_PIN) == HIGH && now - lastClap > ECHO_MS) {
    lastClap = now;
    claps++;
    if (claps == 1) {
      firstClap = now;
      Serial.println("Clap...");
    } else {
      lightOn = !lightOn;                 // two claps in time: toggle
      digitalWrite(LED_PIN, lightOn);
      Serial.println(lightOn ? "Clap clap: light ON" : "Clap clap: light OFF");
      claps = 0;
    }
  }
  if (claps == 1 && now - firstClap > WINDOW_MS) {
    claps = 0;                            // too slow: forget it
    Serial.println("...too slow, ignored");
  }
}`,
    params: { window: { value: 800, min: 200, max: 3000 } },
    async setup(io, b) {
      Object.assign(b.state, { t0: performance.now(), events: [], claps: 0, firstClap: 0, lastClap: 0, lightOn: false });
      io.line('pinMode(SOUND_PIN'); await io.delay(80);
      io.line('Serial.begin'); await io.delay(80);
    },
    async loop(io, b, p) {
      const s = b.state;
      // the real loop() spins far faster than a DO pulse; replay each pulse at the moment it happened
      const ev = s.events.length && s.events[0] <= performance.now() ? s.events.shift() : null;
      const now = Math.floor((ev ?? performance.now()) - s.t0);
      io.line('digitalRead');
      io.pin('D2', hl(ev != null), ev != null);
      if (ev != null && now - s.lastClap > 120) {
        s.lastClap = now;
        s.claps++;
        if (s.claps === 1) {
          s.firstClap = now;
          io.line('"Clap..."'); io.print('Clap...');
        } else {
          s.lightOn = !s.lightOn;
          io.line('digitalWrite(LED_PIN, lightOn)');
          if (s.lightOn) b.on(); else b.led.set(0);
          io.board.setBuiltinLed(s.lightOn ? 1 : 0);
          io.pin('D13', hl(s.lightOn), s.lightOn);
          io.print(s.lightOn ? 'Clap clap: light ON' : 'Clap clap: light OFF');
          s.claps = 0;
        }
      }
      if (s.claps === 1 && now - s.firstClap > p.window) {
        s.claps = 0;
        io.line('"...too slow'); io.print('...too slow, ignored');
      }
      await io.delay(ev != null ? 30 : 8);
    },
    reset(b, io) { b.led.set(0); io.board.setBuiltinLed(0); b.state.events = []; },
  },

  // ------------------------------------------------------------------ MQ-2 gas alarm
  {
    id: 'gas-alarm', title: 'Gas leak alarm', icon: 'wave',
    thumb: () => makeGasSensor(v(0, 0, 0)).group,
    view: { center: [5.8, 1.2, 3.0], size: 16.5 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D13', col: 4, color: 'red' });
      const { bz } = buzzerOn(ctx, bb, { col: 20 });
      const mq = ctx.add(makeGasSensor(v(5.6, 0, 5.6)));
      ctx.wire(ctx.board.pin('5V'), mq.pin('VCC'), 'red', { signal: '5V', dir: -1 });
      ctx.wire(ctx.board.pin('GND_3'), mq.pin('GND'), 'black', { signal: 'GND' });
      const ao = ctx.wire(mq.pin('AO'), ctx.board.pin('A0'), 'green', { signal: 'A0' });
      const cloud = ctx.add(makePuffs(mq.group.localToWorld(v(0.3, 1.0, 0)), { color: 0x9fb08a, n: 14, spread: 1.8, rise: 2.4, size: 2.0 }));
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'Gas', color: '#3fbf5f', min: 0, max: 1023 }, { name: 'Threshold', color: '#e5412e', min: 0, max: 1023 }] });
      const state = { ppm: 0, puff: 0, powerOn: 0, running: false };
      ctx.onTick((dt) => {
        state.puff = Math.max(0, state.puff - dt * 400);
        cloud.set(Math.min(1, (state.ppm + state.puff) / 4000));
        mq.setDetect(state.running && state.ppm + state.puff > 1500);
      });
      ctx.interact(mq, {
        name: 'MQ-2 gas sensor', hint: 'Click to leak some gas near it',
        controls: [
          { type: 'range', label: 'Gas level (LPG)', min: 0, max: 10000, step: 100, get: () => state.ppm, set: (x) => (state.ppm = x), format: (x) => `${x} ppm` },
          { type: 'button', label: 'Puff from a lighter', press: () => (state.puff = 4000) },
        ],
        note: () => `Total ≈ ${Math.round(state.ppm + state.puff)} ppm${state.running ? '' : ' · run the sketch to heat the sensor'}`,
      });
      ctx.anchor('mq', mq.anchor);
      ctx.anchor('ao', ao.mid);
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('bz', bz.anchor);
      // MQ-2 LPG curve: Rs/R0 ≈ 10^(1.28 − 0.47·log10 ppm), 9.8 in clean air; load resistor ≈ R0
      const read = () => {
        const ppm = state.ppm + state.puff;
        const ratio = ppm > 1 ? Math.min(9.8, 10 ** (1.28 - 0.47 * Math.log10(ppm))) : 9.8;
        const settled = 1023 / (ratio + 1);
        const age = performance.now() - state.powerOn;
        const cold = 650 * Math.exp(-age / 4000); // a cold heater reads high, then settles
        return clamp(Math.round(settled + cold) + noise(4), 0, 1023);
      };
      return { ...c, bz, mq, plot, state, read };
    },
    hw: (b) => {
      Object.assign(b.state, { running: true, powerOn: performance.now() });
      b.plot.reset();
      return {
        analogRead: (ch) => (ch === 0 ? b.read() : 0),
        digitalWrite: (pin, v) => { if (pin === 13) b.on(v ? 1 : 0); if (pin === 8 && !v) b.bz.set(false); },
        tone: (pin, f) => { if (pin === 8) b.bz.set(true, f); },
        noTone: (pin) => { if (pin === 8) b.bz.set(false); },
        serialWrite: serialPlotter((gas, thr) => { if (thr !== undefined) b.plot.push(gas, thr); }),
      };
    },
    callouts: [
      { anchor: 'mq', x: 0.04, y: 0.68, icon: 'wave', title: 'MQ-2 sensor', text: 'A tiny heater warms a tin-oxide bead; gas makes it conduct better.' },
      { anchor: 'ao', x: 0.36, y: 0.12, icon: 'pins', title: 'AO → A0', text: 'More gas = higher voltage = bigger reading.' },
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'Alarm LED', text: 'Flashes while the reading is above THRESHOLD.' },
      { anchor: 'bz', x: 0.7, y: 0.17, icon: 'sound', title: 'Buzzer · pin 8', text: 'Beeps with the LED. Turn on sound to hear it.' },
    ],
    overview: {
      heading: 'Gas leak alarm',
      text: 'The MQ-2 has a heated bead of tin oxide whose resistance drops when flammable gas or smoke touches it. Read its voltage with <code>analogRead()</code>, compare it with a threshold and sound an alarm. It needs to warm up first — skip that and you’ll get false alarms.',
      features: [['wave', 'Analog gas level on A0'], ['timer', 'A warm-up loop in <code>setup()</code>'], ['hand', 'Click the sensor to leak some gas']],
    },
    pinout: [['5V', 'VCC', 'Heater draws ≈ 150 mA'], ['GND', 'GND', ''], ['A0', 'AO', 'Analog level'], ['DO', 'Not used', 'On/off output, trimmer threshold'], ['D13', '220 Ω → LED', ''], ['D8', 'Buzzer +', '']],
    example: {
      text: 'Kitchen gas detectors, smoke alarms in caravans and air-quality monitors use sensors like this. A real safety alarm needs a certified detector — this one is for learning.',
      points: ['Set WARMUP_MS to 0 and watch the false alarm at power-up', 'Tune THRESHOLD in clean air: a little above the settled reading'],
    },
    specs: [['Sensor', 'MQ-2 (SnO₂, heated)'], ['Detects', 'LPG, propane, methane, hydrogen, smoke'], ['Range', '≈ 200–10 000 ppm'], ['Heater', '5 V, ≈ 750 mW'], ['Warm-up', '≈ 1–2 min (24 h burn-in when new)'], ['Clean-air reading', '≈ 100 (varies per sensor)']],
    quiz: [
      { q: 'Why does the sketch wait before checking for gas?', options: ['Serial needs time to start', 'The sensor’s heater must reach temperature; until then the readings are wrong', 'The buzzer charges up', 'It doesn’t need to'], answer: 1, explain: 'A cold MQ sensor reads high and drifts until the heater stabilises, causing false alarms.' },
      { q: 'What happens to the A0 reading when gas reaches the sensor?', options: ['It goes up', 'It goes down', 'It stays at 0', 'It becomes negative'], answer: 0, explain: 'The bead’s resistance falls, so the module’s output voltage — and the reading — rises.' },
      { q: 'Why print "Gas:" and "Threshold:" with colons?', options: ['It’s required by C++', 'The Arduino Serial Plotter reads label:value pairs and draws one line per label', 'To make it faster', 'To save memory'], answer: 1, explain: 'The Serial Plotter uses those labels to name and colour each line.' },
      { q: 'Can you power the MQ-2 from a digital pin?', options: ['Yes, any pin', 'No — its heater needs ≈ 150 mA, far more than a pin’s 20 mA', 'Only from pin 13', 'Only with a resistor'], answer: 1, explain: 'Use the 5V pin (or a separate supply) for the heater.' },
    ],
    challenges: [
      'Make the beeping faster the higher the gas level goes.',
      'Add a “silence” button that mutes the buzzer for 30 s but keeps the LED flashing.',
      'Use the module’s DO pin as a second, independent alarm input.',
    ],
    code: `const int GAS_PIN = A0;
const int LED_PIN = 13;
const int BUZZER_PIN = 8;
const int THRESHOLD = {{threshold}};         // raw reading that means "leak"
const unsigned long WARMUP_MS = {{warmup}};  // real sensor: 1-2 minutes

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  Serial.begin(9600);
  while (millis() < WARMUP_MS) {           // let the heater settle
    Serial.print("Warming up... ");
    Serial.println(analogRead(GAS_PIN));
    delay(1000);
  }
  Serial.println("Ready");
}

void loop() {
  int gas = analogRead(GAS_PIN);
  Serial.print("Gas:");
  Serial.print(gas);
  Serial.print(" Threshold:");
  Serial.println(THRESHOLD);
  if (gas > THRESHOLD) {                   // leak! flash and beep
    digitalWrite(LED_PIN, HIGH);
    tone(BUZZER_PIN, 2500);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    noTone(BUZZER_PIN);
    delay(200);
  } else {
    digitalWrite(LED_PIN, LOW);
    delay(400);
  }
}`,
    params: { threshold: { value: 450, min: 50, max: 1000 }, warmup: { value: 10000, min: 0, max: 60000 } },
    async setup(io, b, p) {
      Object.assign(b.state, { running: true, powerOn: performance.now() });
      b.plot.reset();
      io.line('pinMode(LED_PIN'); await io.delay(80);
      io.line('Serial.begin'); await io.delay(80);
      while (performance.now() - b.state.powerOn < p.warmup) {
        io.line('millis() < WARMUP_MS');
        const g = b.read();
        io.pin('A0', String(g), true);
        io.line('Serial.println(analogRead'); io.print(`Warming up... ${g}`);
        b.plot.push(g, p.threshold);
        io.line('delay(1000)'); await io.delay(1000);
      }
      io.line('"Ready"'); io.print('Ready');
    },
    async loop(io, b, p) {
      io.line('int gas = analogRead');
      const gas = b.read();
      io.pin('A0', String(gas), true);
      io.line('Serial.println(THRESHOLD)'); io.print(`Gas:${gas} Threshold:${p.threshold}`);
      b.plot.push(gas, p.threshold);
      if (gas > p.threshold) {
        io.line('digitalWrite(LED_PIN, HIGH)'); b.on(); io.board.setBuiltinLed(1); io.pin('D13', 'HIGH', true);
        io.line('tone('); io.tone(2500); b.bz.set(true, 2500); io.pin('D8', '2500 Hz', true);
        io.line('delay(200)', 1); await io.delay(200);
        io.line('digitalWrite(LED_PIN, LOW)', 1); b.led.set(0); io.board.setBuiltinLed(0); io.pin('D13', 'LOW', false);
        io.line('noTone'); io.noTone(); b.bz.set(false); io.pin('D8', 'LOW', false);
        io.line('delay(200)', 2); await io.delay(200);
      } else {
        io.line('digitalWrite(LED_PIN, LOW)', 2); b.led.set(0); io.board.setBuiltinLed(0); io.pin('D13', 'LOW', false);
        io.line('delay(400)'); await io.delay(400);
      }
    },
    reset(b, io) { b.state.running = false; b.led.set(0); b.bz.set(false); io.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ flame detector
  {
    id: 'flame-detector', title: 'Flame detector', icon: 'sun',
    thumb: () => makeFlameSensor(v(0, 0, 0)).group,
    view: { center: [6.4, 1.0, 3.4], size: 16.5 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const { bz } = buzzerOn(ctx, bb, { col: 12 });
      const fs = ctx.add(makeFlameSensor(v(5.0, 0, 5.6)));
      ctx.wire(ctx.board.pin('5V'), fs.pin('VCC'), 'red', { signal: '5V', dir: -1 });
      ctx.wire(ctx.board.pin('GND_3'), fs.pin('GND'), 'black', { signal: 'GND' });
      const dw = ctx.wire(fs.pin('DO'), ctx.board.pin('D2'), 'yellow', { signal: 'D2', lift: 2.4 });
      const aw = ctx.wire(fs.pin('AO'), ctx.board.pin('A0'), 'green', { signal: 'A0' });
      const state = { lit: true, cm: 30, thr: 500, running: false, ao: 1015, flame: false };
      const xFor = (cm) => fs.front.x + 0.9 + cm * 0.1;
      const candle = ctx.add(makeCandle(v(xFor(state.cm), 0, fs.front.z)));
      const place = () => { candle.group.position.x = xFor(state.cm); ctx.anchor('candle', candle.group.position.clone().add(v(0, 2.2, 0))); };
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'IR level (AO)', color: '#f08a2c', min: 0, max: 1023 }] });
      // AO falls as more infrared reaches the receiver (inverse square with distance)
      const level = () => {
        const ir = state.lit ? 2.7 * (30 / state.cm) ** 2 * candle.flicker : 0;
        return clamp(Math.round(30 + 990 / (1 + ir)), 0, 1023);
      };
      ctx.onTick(() => {
        if (!state.running) return;
        state.ao = level();
        state.flame = state.ao < state.thr; // LM393 comparator: DO goes LOW
        fs.setDetect(state.flame);
      });
      const ctl = [
        { type: 'toggle', label: 'Candle lit', get: () => state.lit, set: (x) => { state.lit = x; candle.setLit(x); } },
        { type: 'range', label: 'Distance', min: 5, max: 100, step: 1, get: () => state.cm, set: (x) => { state.cm = x; place(); }, format: (x) => `${x} cm` },
      ];
      ctx.interact(candle, { name: 'Candle', hint: 'Click to light it, blow it out or move it', controls: ctl });
      ctx.interact(fs, {
        name: 'Flame sensor', hint: 'Click to turn its trimmer or move the candle',
        controls: [{ type: 'range', label: 'Trimmer (DO threshold)', min: 100, max: 1000, step: 10, get: () => state.thr, set: (x) => (state.thr = x) }, ...ctl],
        note: () => (state.running ? `AO ≈ ${state.ao} · DO ${state.flame ? 'LOW (flame)' : 'HIGH'}` : 'Run the sketch to power the sensor'),
      });
      ctx.anchor('fs', fs.anchor);
      place();
      ctx.anchor('do', dw.mid);
      ctx.anchor('ao', aw.mid);
      ctx.anchor('bz', bz.anchor);
      return { bz, fs, candle, plot, state, level };
    },
    hw: (b) => {
      b.state.running = true;
      b.plot.reset();
      let buf = '';
      return {
        analogRead: (ch) => (ch === 0 ? clamp(b.level() + noise(3), 0, 1023) : 0),
        // LM393 comparator output: LOW while AO is below the trimmer threshold
        digitalRead: (pin) => (pin === 2 ? (b.state.flame ? 0 : 1) : null),
        tone: (pin, f) => { if (pin === 8) b.bz.set(true, f); },
        noTone: (pin) => { if (pin === 8) b.bz.set(false); },
        serialWrite: (t) => {
          buf += t;
          const lines = buf.split('\n');
          buf = lines.pop();
          for (const l of lines) { const m = /IR level: (\d+)/.exec(l); if (m) b.plot.push(Number(m[1])); }
        },
      };
    },
    callouts: [
      { anchor: 'do', x: 0.36, y: 0.12, icon: 'pins', title: 'DO → pin 2', text: 'Goes LOW when the IR level passes the trimmer’s threshold.' },
      { anchor: 'bz', x: 0.7, y: 0.17, icon: 'sound', title: 'Buzzer · pin 8', text: 'Sounds while a flame is seen.' },
      { anchor: 'ao', x: 0.04, y: 0.17, icon: 'wave', title: 'AO → A0', text: 'The raw IR level: lower means a stronger flame.' },
      { anchor: 'fs', x: 0.04, y: 0.68, icon: 'sun', title: 'Flame sensor', text: 'Its dark lens only lets through infrared (≈ 760–1100 nm).' },
      { anchor: 'candle', x: 0.36, y: 0.72, icon: 'hand', title: 'Candle', text: 'Click to light it, blow it out or move it.' },
    ],
    overview: {
      heading: 'Flame detector',
      text: 'Flames glow brightly in infrared. The sensor’s dark receiver measures that IR and gives you two outputs: <b>AO</b>, the raw level, and <b>DO</b>, a simple yes/no from an on-board comparator. Light the candle, move it around and watch both.',
      features: [['sun', 'Digital and analog outputs together'], ['hand', 'Light, blow out and move the candle'], ['wave', 'IR level on the serial plotter']],
    },
    pinout: [['5V', 'VCC', '3.3–5 V'], ['GND', 'GND', ''], ['D2', 'DO', 'LOW = flame (active-low)'], ['A0', 'AO', 'Lower = more IR'], ['D8', 'Buzzer +', 'Other leg to GND']],
    example: {
      text: 'Gas boilers watch their own pilot flame and shut the gas off if it goes out. Firefighting robots use arrays of these sensors to steer towards a fire.',
      points: ['Turn the trimmer until DO only triggers inside the distance you want', 'Sunlight and halogen lamps contain IR too — expect false alarms near a window'],
    },
    specs: [['Receiver', 'IR phototransistor (YG1006-style)'], ['Spectrum', '≈ 760–1100 nm'], ['Range', 'Lighter flame ≈ up to 80 cm'], ['View angle', '≈ 60°'], ['DO', 'Active-low, LM393 comparator'], ['Supply', '3.3–5 V']],
    quiz: [
      { q: 'What does DO = LOW mean on this module?', options: ['No flame', 'A flame has been detected', 'The sensor is unplugged', 'The trimmer is broken'], answer: 1, explain: 'The module is active-low: its comparator pulls DO LOW (and lights its LED) when IR passes the threshold.' },
      { q: 'You move the candle further away. What happens to AO?', options: ['It goes down', 'It goes up, towards 1023', 'It stays the same', 'It becomes negative'], answer: 1, explain: 'Less IR reaches the receiver, and on this module less IR means a higher reading.' },
      { q: 'Why use AO as well as DO?', options: ['AO is faster', 'AO tells you how strong or close the flame is, not just yes/no', 'DO doesn’t work', 'AO needs no power'], answer: 1, explain: 'The analog level lets the sketch grade the danger or track the flame.' },
    ],
    challenges: [
      'Ignore DO and decide in code: alarm when AO drops below a number you choose.',
      'Beep faster as the flame gets closer, using AO to set the delay.',
      'Add an LED that stays on for 10 s after the last flame was seen (use millis()).',
    ],
    code: `const int FLAME_DO = 2;      // LOW when a flame is seen
const int FLAME_AO = A0;     // lower = more infrared
const int BUZZER_PIN = 8;

void setup() {
  pinMode(FLAME_DO, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int level = analogRead(FLAME_AO);
  bool flame = digitalRead(FLAME_DO) == LOW;
  Serial.print("IR level: ");
  Serial.print(level);
  Serial.println(flame ? "  FLAME!" : "");
  if (flame) {
    tone(BUZZER_PIN, {{pitch}});
  } else {
    noTone(BUZZER_PIN);
  }
  delay({{rate}});
}`,
    params: { pitch: { value: 3000, min: 200, max: 5000 }, rate: { value: 200, min: 20, max: 2000 } },
    async setup(io, b) {
      Object.assign(b.state, { running: true });
      b.plot.reset();
      io.line('pinMode(FLAME_DO'); await io.delay(80);
      io.line('Serial.begin'); await io.delay(80);
    },
    async loop(io, b, p) {
      io.line('analogRead');
      const lv = clamp(b.level() + noise(3), 0, 1023);
      io.pin('A0', String(lv), true);
      io.line('digitalRead');
      const flame = b.state.flame;
      io.pin('D2', flame ? 'LOW' : 'HIGH', flame);
      io.line('Serial.println(flame'); io.print(`IR level: ${lv}${flame ? '  FLAME!' : ''}`);
      b.plot.push(lv);
      if (flame) { io.line('tone('); io.tone(p.pitch); b.bz.set(true, p.pitch); io.pin('D8', `${p.pitch} Hz`, true); }
      else { io.line('noTone'); io.noTone(); b.bz.set(false); io.pin('D8', 'LOW', false); }
      io.line('delay('); await io.delay(p.rate);
    },
    reset(b) { b.state.running = false; b.state.flame = false; b.fs.setDetect(false); b.bz.set(false); },
  },
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['radar', 'PIR motion sensor', 'HC-SR501: OUT goes HIGH when a warm body moves in view.', 'pir-alarm'],
  ['thermo', 'DHT11', 'Temperature and humidity on one data wire.', 'dht-weather'],
  ['plant', 'Soil moisture probe', 'Capacitive sensor: lower reading in wetter soil.', 'soil-moisture'],
  ['sound', 'Sound sensor', 'KY-038: microphone with digital (DO) and analog (AO) outputs.', 'clap-switch'],
  ['wave', 'MQ-2 gas sensor', 'Heated sensor for LPG, methane and smoke; analog output.', 'gas-alarm'],
  ['sun', 'Flame sensor', 'IR receiver with an active-low DO and analog AO.', 'flame-detector'],
];
