// Track — Capstone projects: complete builds that combine earlier lessons.
import * as THREE from 'three';
import { mat, box, cyl, at } from '../scene/kit.js';
import { makeBuzzer, makeLDR, makeResistor, makeUltrasonic, makePing } from '../scene/components.js';
import {
  makeOLED, makeLCD1602, makeRelay, makeLamp, makeL298N, makePIR, makePerson, makeDHT11, makeKeypad, makeSoilSensor, makeRobotCar,
} from '../scene/modules.js';
import { v, clamp, BB, ledOnPin } from './helpers.js';

// ---------------------------------------------------------------- shared helpers
/** Arduino's integer map(). */
const mapInt = (x, a, b, c, d) => Math.trunc(((x - a) * (d - c)) / (b - a)) + c;
/** Callout anchor that follows a moving Vector3 (ctx.anchor clones what it's given). */
const live = (vec) => ({ clone: () => vec });
const tubeMat = () => mat(0xbfe6ff, { rough: 0.15, opacity: 0.6 });

/** 4×AA battery holder lying flat, with red (+) and black (–) terminal posts on top. */
function makeBatteryPack(pos, { label = '4×AA · 6 V', rotY = 0 } = {}) {
  const g = new THREE.Group();
  g.add(at(box(6.0, 1.5, 4.4, mat(0x24252a, { rough: 0.6 })), 0, 0.75, 0));
  for (let i = 0; i < 4; i++) {
    const cell = cyl(0.68, 0.68, 4.9, mat(0x3a6fd0, { rough: 0.4 }), { seg: 20 });
    cell.rotation.z = Math.PI / 2;
    g.add(at(cell, 0.1, 1.2, -1.53 + i * 1.02));
    const band = cyl(0.69, 0.69, 1.1, mat(0x2a2c33), { seg: 20, outline: false });
    band.rotation.z = Math.PI / 2;
    g.add(at(band, i % 2 ? 1.95 : -1.75, 1.2, -1.53 + i * 1.02));
  }
  const posts = [];
  for (const [z, c] of [[-0.7, 0xd8443a], [0.7, 0x2a2c33]]) {
    g.add(at(box(0.7, 0.5, 0.7, mat(c)), -2.75, 1.75, z));
    g.add(at(cyl(0.12, 0.12, 0.3, mat(0xd6b46a, { metal: 0.6, rough: 0.35 })), -2.75, 2.15, z));
    posts.push(v(-2.75, 2.3, z));
  }
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshBasicMaterial({ map: labelTex(label), transparent: true }));
  tag.rotation.x = -Math.PI / 2;
  tag.position.set(0.5, 1.92, 0);
  tag.raycast = () => {};
  g.add(tag);
  g.position.copy(pos);
  g.rotation.y = rotY;
  g.updateMatrixWorld(true);
  return { group: g, pick: g, anchor: g.localToWorld(v(0, 2.6, 0)), plus: g.localToWorld(posts[0].clone()), minus: g.localToWorld(posts[1].clone()) };
}

function labelTex(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 48;
  const x = c.getContext('2d');
  x.fillStyle = '#f3f1e8';
  x.font = '600 30px "Barlow Semi Condensed", sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, 128, 26);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * A clear cup of water with a small submersible pump; a silicone tube runs from
 * the pump to `tubeEnd` (world). Pump leads come up to the rim (leadPlus / leadMinus).
 */
function makePumpCup(pos, tubeEnd, soilY) {
  const g = new THREE.Group();
  const R = 1.9, H = 4.6;
  g.add(at(cyl(R, R * 0.9, H, mat(0xdff3ff, { rough: 0.1, opacity: 0.32 }), { seg: 32 }), 0, H / 2, 0));
  const water = cyl(R - 0.12, R * 0.9 - 0.1, 3.0, mat(0x4aa6e8, { rough: 0.2, opacity: 0.55 }), { seg: 32, outline: false });
  g.add(at(water, 0, 1.55, 0));
  // pump body + outlet
  const pump = new THREE.Group();
  pump.add(at(box(1.5, 1.3, 1.1, mat(0x2a2c33, { rough: 0.55 })), 0, 0.65, 0));
  pump.add(at(cyl(0.45, 0.45, 0.3, mat(0x3a3d46), { seg: 16 }), 0, 0.05, 0));
  pump.add(at(cyl(0.16, 0.16, 0.7, mat(0x2a2c33), { seg: 12 }), 0.35, 1.6, 0));
  g.add(at(pump, 0, 0.12, 0));
  g.position.copy(pos);
  g.updateMatrixWorld(true);
  const W = (x, y, z) => g.localToWorld(v(x, y, z));
  // leads: from the pump up over the rim
  const leadPlus = W(-R - 0.4, H + 0.2, -0.4), leadMinus = W(-R - 0.4, H + 0.2, 0.4);
  const leads = [[leadPlus, 0xd8443a, -0.25], [leadMinus, 0x2a2c33, 0.25]].map(([end, c, dz]) => {
    const curve = new THREE.CatmullRomCurve3([W(-0.6, 0.9, dz), W(-1.2, 2.0, dz), W(-R + 0.2, H + 0.5, dz * 1.6), W(-R - 0.3, H + 0.7, dz * 1.6), end]);
    return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.06, 6, false), mat(c));
  });
  // tube: outlet → up out of the cup → arc → down over the pot
  const top = W(0.35, 2.05, 0);
  const rise = W(0.6, H + 2.4, 0);
  const mid = rise.clone().lerp(tubeEnd, 0.5);
  mid.y = Math.max(rise.y, tubeEnd.y) + 1.6;
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([top, W(0.4, H - 0.5, 0), rise, mid, tubeEnd.clone().add(v(0, 1.0, 0)), tubeEnd]), 64, 0.16, 10, false),
    tubeMat(),
  );
  // water drops
  const drops = [];
  const dropMat = mat(0x4aa6e8, { rough: 0.15, opacity: 0.8 });
  for (let i = 0; i < 7; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), dropMat);
    d.visible = false;
    d.raycast = () => {};
    drops.push({ m: d, t: i / 7 });
  }
  let on = false, buzz = 0;
  const api = {
    group: g,
    pick: g,
    extras: [tube, ...leads, ...drops.map((d) => d.m)],
    anchor: W(0, H + 1.2, 0),
    leadPlus,
    leadMinus,
    get on() { return on; },
    set(x) { on = !!x; },
    tick(dt) {
      buzz += dt * 60;
      pump.position.x = on ? Math.sin(buzz) * 0.03 : 0;
      for (const d of drops) {
        if (!on && d.m.position.y <= soilY + 0.05) { d.m.visible = false; continue; }
        d.t += dt * 1.6;
        if (d.t > 1) { d.t -= 1; d.m.visible = on; }
        d.m.position.set(tubeEnd.x, tubeEnd.y - 0.15 - d.t * (tubeEnd.y - soilY - 0.15), tubeEnd.z);
        if (d.t > 0.98 && !on) d.m.visible = false;
      }
    },
  };
  return api;
}

const ESP_IP = '192.168.1.42';

export const projects = [
  // ------------------------------------------------------------------ 1
  {
    id: 'proj-smart-plant', title: 'Smart plant waterer', icon: 'plant', board: 'uno',
    thumb: () => makeSoilSensor(v(0, 0, 0), { moisture: 0.8 }).group,
    view: { center: [9.8, 3.2, -4.0], size: 29 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const b = ctx.board;
      // power rails: 5 V and GND along the back of the breadboard
      ctx.wire(b.pin('5V'), bb.hole(1, 'top+'), 'red', { signal: '5V', lift: 2.6 });
      ctx.wire(b.pin('GND'), bb.hole(2, 'top-'), 'black', { signal: 'GND', dir: -1, lift: 1.2 });
      // OLED in front of the board: 3V3, GND_3, A4 (SDA), A5 (SCL)
      const oled = ctx.add(makeOLED(v(1.6, 0, 6.6)));
      ctx.wire(b.pin('3V3'), oled.pin('VCC'), 'red', { lift: 1.0 });
      ctx.wire(b.pin('GND_3'), oled.pin('GND'), 'black', { lift: 1.3, dir: -1 });
      ctx.wire(b.pin('A4'), oled.pin('SDA'), 'blue', { signal: 'A4', lift: 1.4 });
      ctx.wire(b.pin('A5'), oled.pin('SCL'), 'yellow', { signal: 'A5', lift: 1.7 });
      // relay behind the breadboard
      const relay = ctx.add(makeRelay(v(8.6, 0, -6.8)));
      const inW = ctx.wire(b.pin('D7'), relay.pin('IN'), 'orange', { signal: 'D7', lift: 2.0 });
      ctx.wire(bb.hole(4, 'top+'), relay.pin('VCC'), 'red', { lift: 1.4 });
      ctx.wire(bb.hole(5, 'top-'), relay.pin('GND'), 'black', { lift: 1.1, dir: -1 });
      // soil probe in its pot, to the right
      const soil = ctx.add(makeSoilSensor(v(15.4, 0, -10.6), { moisture: 0.45 }));
      ctx.wire(bb.hole(28, 'top+'), soil.pin('VCC'), 'red', { lift: 1.2 });
      ctx.wire(bb.hole(29, 'top-'), soil.pin('GND'), 'black', { lift: 1.0, dir: -1 });
      const aW = ctx.wire(soil.pin('AOUT'), b.pin('A0'), 'green', { signal: 'A0', lift: 1.0, dir: -1 });
      // pump in a cup of water, battery pack, relay as the switch
      const soilY = 6.15; // pot soil surface
      const tubeEnd = v(16.8, 8.4, -9.4);
      const pump = makePumpCup(v(21.8, 0, -5.4), tubeEnd, soilY);
      ctx.add(pump);
      pump.extras.forEach((o) => ctx.addObject(o));
      const bat = ctx.add(makeBatteryPack(v(17.0, 0, -0.6), { rotY: Math.PI / 2 }));
      const pw1 = ctx.wire(bat.plus, relay.pin('COM'), 'red', { lift: 1.6 });
      const pw2 = ctx.wire(relay.pin('NO'), pump.leadPlus, 'red', { lift: 1.6 });
      const pw3 = ctx.wire(pump.leadMinus, bat.minus, 'black', { lift: 2.2 });
      const motorWires = [pw1, pw2, pw3];

      const state = { m: 0.45, dry: 2, running: false, pump };
      soil.setMoisture(state.m);
      ctx.onTick((dt) => {
        if (!state.running) return;
        state.m = clamp(state.m - (state.dry / 100) * dt + (pump.on ? 0.09 * dt : 0), 0, 1);
        soil.setMoisture(state.m);
      });
      const ctl = [
        { type: 'range', label: 'Soil moisture', min: 0, max: 100, step: 1, get: () => Math.round(state.m * 100), set: (x) => { state.m = x / 100; soil.setMoisture(state.m); }, format: (x) => `${x}%` },
        { type: 'range', label: 'Sun (drying speed)', min: 0, max: 6, step: 0.5, get: () => state.dry, set: (x) => (state.dry = x), format: (x) => `${x}% / s` },
      ];
      ctx.interact(soil, { name: 'Plant + soil probe', hint: 'Dry the soil out or water it by hand', controls: ctl, note: () => 'Time runs ~1000× faster than real life' });
      ctx.interact(pump, { name: 'Pump in a cup of water', hint: 'Switched by the relay', note: () => (pump.on ? 'Pumping…' : 'Off') });
      ctx.interact(relay, { name: 'Relay module', hint: 'D7 HIGH closes COM–NO and the pump runs' });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'soil %', color: '#3aa65a', min: 0, max: 100 }, { name: 'start', color: '#ef8a2b', min: 0, max: 100 }, { name: 'stop', color: '#3a6fd0', min: 0, max: 100 }] });
      ctx.anchor('oled', oled.anchor);
      ctx.anchor('relay', relay.anchor);
      ctx.anchor('soil', soil.anchor);
      ctx.anchor('pump', pump.anchor);
      ctx.anchor('a0', aW.mid);
      ctx.anchor('d7', inW.mid);
      return { oled, relay, soil, pump, state, plot, motorWires };
    },
    callouts: [
      { anchor: 'relay', x: 0.04, y: 0.17, icon: 'bolt', title: 'Relay on D7', text: 'Switches the pump’s battery circuit — the board never powers the pump.' },
      { anchor: 'a0', x: 0.36, y: 0.12, icon: 'wave', title: 'AOUT → A0', text: 'Capacitive probe: the voltage FALLS as the soil gets wetter.' },
      { anchor: 'soil', x: 0.7, y: 0.17, icon: 'plant', title: 'Plant + probe', text: 'Click it to dry the soil out or speed up the sun.' },
      { anchor: 'oled', x: 0.04, y: 0.68, icon: 'info', title: 'OLED face', text: 'Smiles or frowns with the moisture, plus the % reading.' },
      { anchor: 'pump', x: 0.36, y: 0.74, icon: 'motor', title: 'Mini pump', text: '3–6 V submersible pump; the tube drips onto the soil.' },
    ],
    overview: {
      heading: 'Smart plant waterer',
      text: 'A soil probe (<em>Sense light</em>-style analog reading), a relay (<em>Relays</em>) and an OLED (<em>OLED</em>) team up: when the soil drops below START % the pump runs until STOP %, with a time limit and a cooldown so it never floods the pot.',
      features: [['wave', 'Calibrated <code>map()</code> from raw reading to %'], ['bolt', 'Hysteresis + timeout + cooldown = safe automation'], ['plant', 'A face on the OLED via Adafruit_SSD1306 / GFX']],
    },
    pinout: [['A0', 'Probe AOUT', 'Wetter = lower'], ['D7', 'Relay IN', 'Active-HIGH module'], ['A4 / A5', 'OLED SDA / SCL', 'I²C, address 0x3C'], ['3V3 / GND_3', 'OLED VCC / GND', ''], ['5V / GND → rails', 'Relay and probe VCC / GND', 'Via the breadboard rails'], ['Battery + → COM, NO → pump +', 'Pump – → battery –', 'Pump circuit is separate']],
    example: {
      text: 'Greenhouses, vertical farms and garden irrigation controllers run exactly this loop — sense, decide with hysteresis, act, and include fail-safes so a stuck sensor can’t empty the tank.',
      points: ['Calibrate: read the probe in dry air and in a glass of water, then set <code>DRY_RAW</code> / <code>WET_RAW</code>', 'Close START and STOP together and watch the pump chatter — that’s why hysteresis exists', 'Add a float switch so the pump never runs dry'],
    },
    specs: [['Parts', 'Uno, capacitive soil probe v1.2, 5 V relay, 3–6 V pump, 4×AA pack, SSD1306 OLED'], ['Libraries', 'Wire, Adafruit_GFX, Adafruit_SSD1306'], ['Probe output', '≈ 2.9 V dry → 1.4 V in water'], ['Pump', '≈ 100–200 mA at 5 V'], ['Relay coil', '≈ 70 mA from 5 V'], ['Control', 'START / STOP hysteresis, 6 s max run, cooldown']],
    quiz: [
      { q: 'Why have separate START and STOP thresholds?', options: ['To save memory', 'Hysteresis: it stops the pump flicking on and off around one value', 'The sensor needs two readings', 'The relay needs two signals'], answer: 1, explain: 'With one threshold, noise near that value would toggle the pump many times a second.' },
      { q: 'Why is the pump powered from a battery through the relay instead of from a pin?', options: ['A pin can only supply ≈20 mA; the pump needs 100+ mA and makes electrical noise', 'Pins are AC', 'It runs faster', 'The relay is decoration'], answer: 0, explain: 'The relay is a switch in a separate circuit, so the board only drives the relay’s input.' },
      { q: 'With DRY_RAW = 620 and WET_RAW = 280, what % is a reading of 450?', options: ['25%', '50%', '72%', '100%'], answer: 1, explain: 'map(450, 620, 280, 0, 100) = (450 − 620) × 100 / (280 − 620) = 50.' },
      { q: 'What does MAX_PUMP_MS protect against?', options: ['A probe that fell out of the pot (reads dry forever) flooding the room', 'The OLED overheating', 'Low battery', 'I²C errors'], answer: 0, explain: 'A safety timeout stops the pump even if the sensor never reports “wet”.' },
    ],
    challenges: ['Show “WATER ME” on the OLED and blink it when the battery would be needed.', 'Log the moisture once a minute and print the daily minimum and maximum.', 'Add a float switch on D8 that blocks the pump when the cup is empty, and show a sad face.'],
    code: `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

const int SOIL_PIN = A0;
const int PUMP_PIN = 7;              // relay IN
const int DRY_RAW = 620;             // calibrate: probe in dry air
const int WET_RAW = 280;             // calibrate: probe in water
const int START_PCT = {{start}};       // water when drier than this...
const int STOP_PCT = {{stop}};        // ...until it reaches this
const unsigned long MAX_PUMP_MS = 6000;
const unsigned long COOLDOWN_MS = {{cooldown}} * 1000UL;

Adafruit_SSD1306 display(128, 64, &Wire, -1);
bool pumping = false;
unsigned long pumpStart = 0;
unsigned long lastStop = 0;          // also waits COOLDOWN after power-up

void setup() {
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);
  Serial.begin(9600);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.setTextColor(SSD1306_WHITE);
}

void setPump(bool on) {
  pumping = on;
  digitalWrite(PUMP_PIN, on ? HIGH : LOW);
  if (on) pumpStart = millis(); else lastStop = millis();
  Serial.println(on ? "Pump ON" : "Pump OFF");
}

void drawFace(int pct) {
  display.clearDisplay();
  display.drawCircle(32, 32, 26, SSD1306_WHITE);
  display.fillCircle(23, 24, 3, SSD1306_WHITE);
  display.fillCircle(41, 24, 3, SSD1306_WHITE);
  int curve = map(pct, 0, 100, -6, 6);          // frown -> smile
  for (int x = -10; x <= 10; x++)
    display.drawPixel(32 + x, 40 + curve - curve * x * x / 100, SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(68, 12);
  display.print(pct);
  display.print('%');
  display.setTextSize(1);
  display.setCursor(68, 40);
  display.print(pumping ? "WATERING" : pct < START_PCT ? "THIRSTY" : "HAPPY");
  display.display();
}

void loop() {
  int raw = analogRead(SOIL_PIN);
  int pct = constrain(map(raw, DRY_RAW, WET_RAW, 0, 100), 0, 100);
  unsigned long now = millis();
  if (!pumping && pct < START_PCT && now - lastStop >= COOLDOWN_MS) {
    setPump(true);
  } else if (pumping && (pct >= STOP_PCT || now - pumpStart >= MAX_PUMP_MS)) {
    setPump(false);                  // wet enough, or safety timeout
  }
  drawFace(pct);
  Serial.print("Soil ");
  Serial.print(pct);
  Serial.println("%");
  delay(500);
}`,
    params: { start: { value: 35, min: 5, max: 90 }, stop: { value: 60, min: 10, max: 100 }, cooldown: { value: 8, min: 0, max: 60 } },
    async setup(io, b) {
      b.state.running = true;
      b.t0 = performance.now();
      b.pumping = false; b.pumpStart = 0; b.lastStop = 0;
      io.line('pinMode(PUMP_PIN'); await io.delay(80);
      io.line('digitalWrite(PUMP_PIN, LOW)'); io.pin('D7', 'LOW', false); await io.delay(80);
      io.line('display.begin'); io.pin('A4', 'SDA', true); await io.delay(150);
    },
    async loop(io, b, p) {
      const millis = () => performance.now() - b.t0;
      const setPump = async (on) => {
        io.line('void setPump');
        b.pumping = on;
        io.line('digitalWrite(PUMP_PIN, on');
        b.relay.set(on); b.pump.set(on); io.pin('D7', on ? 'HIGH' : 'LOW', on);
        b.motorWires.forEach((w) => (w.live = on));
        if (on) b.pumpStart = millis(); else b.lastStop = millis();
        io.line('Serial.println(on'); io.print(on ? 'Pump ON' : 'Pump OFF');
        await io.delay(60);
      };
      io.line('int raw = analogRead');
      const raw = Math.round(620 - b.state.m * 340 + (Math.random() - 0.5) * 6);
      io.pin('A0', String(raw), true);
      io.line('int pct = constrain');
      const pct = clamp(mapInt(raw, 620, 280, 0, 100), 0, 100);
      const now = millis();
      io.line('if (!pumping && pct < START_PCT');
      if (!b.pumping && pct < p.start && now - b.lastStop >= p.cooldown * 1000) await setPump(true);
      else if (b.pumping && (pct >= p.stop || now - b.pumpStart >= 6000)) { io.line('setPump(false)'); await setPump(false); }
      io.line('drawFace(pct);');
      drawFace(b.oled, pct, b.pumping, p.start);
      io.line('Serial.println("%")'); io.print(`Soil ${pct}%`);
      b.plot.push(pct, p.start, p.stop);
      io.line('delay(500)'); await io.delay(500);
    },
    reset(b) {
      b.state.running = false;
      b.relay.set(false); b.pump.set(false); b.oled.clear(); b.plot.reset();
      b.motorWires.forEach((w) => (w.live = false));
    },
  },
  // ------------------------------------------------------------------ 2
  {
    id: 'proj-weather-station', title: 'Weather station', icon: 'thermo', board: 'esp32',
    thumb: () => makeDHT11(v(0, 0, 0)).group,
    view: { center: [-2.6, 0.6, 3.0], size: 16 },
    build(ctx) {
      const b = ctx.board;
      const bb = ctx.breadboard(-8.4, 0.9);
      // 3.3 V and GND onto the front rails (both modules are 3.3 V parts here)
      ctx.wire(b.pin('3V3'), bb.hole(29, 'bot+'), 'red', { signal: '3V3', lift: 1.2 });
      ctx.wire(b.pin('GND_2'), bb.hole(28, 'bot-'), 'black', { signal: 'GND', dir: -1, lift: 1.0 });
      const oled = ctx.add(makeOLED(v(1.7, 0, 6.2)));
      const sda = ctx.wire(b.pin('GPIO21'), oled.pin('SDA'), 'blue', { signal: 'GPIO21', lift: 1.2 });
      ctx.wire(b.pin('GPIO22'), oled.pin('SCL'), 'yellow', { signal: 'GPIO22', lift: 1.5 });
      ctx.wire(bb.hole(26, 'bot+'), oled.pin('VCC'), 'red', { lift: 1.6 });
      ctx.wire(bb.hole(25, 'bot-'), oled.pin('GND'), 'black', { lift: 1.3, dir: -1 });
      const dht = ctx.add(makeDHT11(v(-6.4, 0, 6.6)));
      ctx.wire(bb.hole(20, 'bot+'), dht.pin('VCC'), 'red', { lift: 1.0 });
      ctx.wire(bb.hole(19, 'bot-'), dht.pin('GND'), 'black', { lift: 0.8, dir: -1 });
      const data = ctx.wire(dht.pin('DATA'), b.pin('GPIO4'), 'green', { signal: 'GPIO4', lift: 2.2, dir: -1 });
      const state = { t: 22, h: 48, req: null };
      ctx.interact(dht, {
        name: 'DHT11 sensor', hint: 'Change the weather around it',
        controls: [
          { type: 'range', label: 'Temperature', min: 0, max: 50, step: 0.5, get: () => state.t, set: (x) => (state.t = x), format: (x) => `${Number(x).toFixed(1)} °C` },
          { type: 'range', label: 'Humidity', min: 20, max: 90, step: 1, get: () => state.h, set: (x) => (state.h = x), format: (x) => `${x} %` },
        ],
        note: () => 'DHT11: whole degrees, ±2 °C, ±5 % RH, one reading per second at most',
      });
      ctx.interact(oled, { name: 'OLED display', hint: 'Shows the latest reading and today’s min / max' });
      const web = { t: NaN, h: NaN, min: NaN, max: NaN, up: false };
      const fmt = (x, d) => (Number.isNaN(x) ? 'nan' : x.toFixed(d));
      const browser = ctx.browser({
        url: `http://${ESP_IP}/`, title: 'Weather station',
        render: () => (web.up
          ? `<h5>Weather station</h5><div class="row"><span>Temperature</span><span class="big">${fmt(web.t, 1)} °C</span></div><div class="row"><span>Humidity</span><b>${fmt(web.h, 0)} %</b></div><div class="row"><span>Min / max</span><b>${fmt(web.min, 1)} / ${fmt(web.max, 1)} °C</b></div><div class="row"><span class="muted">Refreshes every 5 s</span><button data-action="reset">Reset min/max</button></div>`
          : '<h5>Weather station</h5><p class="muted">Waiting for the ESP32 to join Wi-Fi… press Run.</p>'),
        onAction: (a) => { if (a === 'reset') state.req = 'reset'; },
      });
      ctx.anchor('dht', dht.anchor);
      ctx.anchor('data', data.mid);
      ctx.anchor('oled', oled.anchor);
      ctx.anchor('sda', sda.mid);
      return { oled, dht, state, browser, web };
    },
    callouts: [
      { anchor: 'dht', x: 0.04, y: 0.17, icon: 'thermo', title: 'DHT11 on GPIO4', text: 'Temperature + humidity over one data wire. Click it to change the weather.' },
      { anchor: 'chip', x: 0.36, y: 0.12, icon: 'globe', title: 'ESP32 web server', text: 'Joins your Wi-Fi and serves the page on port 80.' },
      { anchor: 'sda', x: 0.7, y: 0.17, icon: 'serial', title: 'I²C: GPIO21 / 22', text: 'SDA and SCL for the OLED.' },
      { anchor: 'oled', x: 0.36, y: 0.74, icon: 'info', title: 'OLED', text: 'Big temperature and humidity, plus min / max.' },
      { anchor: 'data', x: 0.04, y: 0.68, icon: 'plug', title: '3.3 V rails', text: 'Both modules run from 3V3, so every signal stays 3.3 V-safe.' },
    ],
    overview: {
      heading: 'Weather station',
      text: 'Combine the DHT11 (<em>Temperature & humidity</em>), an I²C OLED (<em>OLED</em>) and the ESP32 web server (<em>Serve a web page</em>): read the sensor every few seconds without blocking, keep the min and max, and show them on the screen and on any phone on your Wi-Fi.',
      features: [['thermo', 'DHT library: <code>readTemperature()</code>, <code>readHumidity()</code>'], ['globe', '<code>WebServer</code> with <code>/</code> and <code>/reset</code> routes'], ['timer', 'A <code>millis()</code> timer keeps <code>handleClient()</code> responsive']],
    },
    pinout: [['GPIO4', 'DHT11 DATA', 'Module has its own pull-up'], ['GPIO21 / GPIO22', 'OLED SDA / SCL', 'Default ESP32 I²C pins'], ['3V3 → + rail', 'DHT11 VCC, OLED VCC', ''], ['GND → – rail', 'DHT11 GND, OLED GND', '']],
    example: {
      text: 'Home weather stations, greenhouse monitors and server-room sensors all follow this pattern: sample slowly, keep statistics, publish over the network. Swap the DHT11 for a BME280 for pressure and better accuracy.',
      points: ['Click <b>Reset min/max</b> in the phone browser — the request is handled by <code>handleReset()</code>', 'Change the reading interval in the code (the DHT11 needs at least 1000 ms)', 'Add a <code>/json</code> route so another device can log the readings'],
    },
    specs: [['Board', 'ESP32 DevKit, 3.3 V logic'], ['Sensor', 'DHT11: 0–50 °C ±2 °C, 20–90 % RH ±5 %'], ['Display', 'SSD1306 128 × 64, I²C 0x3C'], ['Libraries', 'WiFi, WebServer, DHT sensor library, Adafruit_SSD1306 / GFX'], ['Page', 'Auto-refresh every 5 s'], ['Supply', 'USB 5 V → 3.3 V regulator']],
    quiz: [
      { q: 'Why does loop() return early until the interval has passed, instead of calling delay()?', options: ['delay() would stop server.handleClient() from answering web requests', 'delay() is not allowed on the ESP32', 'To save flash', 'The DHT11 needs it'], answer: 0, explain: 'A long delay() freezes everything; the millis() check lets the web server stay responsive between readings.' },
      { q: 'Why are the modules powered from 3V3 and not VIN (5 V)?', options: ['So their data / I²C lines stay at 3.3 V, which the ESP32 can safely read', '5 V is too weak', 'VIN is input only', 'It doesn’t matter'], answer: 0, explain: 'ESP32 pins are not 5 V tolerant; powering sensors at 3.3 V keeps their outputs safe.' },
      { q: 'What happens when the phone opens /reset?', options: ['The ESP32 reboots', 'handleReset() sets min and max to the current temperature, then redirects to /', 'Wi-Fi disconnects', 'The OLED clears'], answer: 1, explain: 'server.on("/reset", handleReset) maps the URL to the function; the 303 sends the browser back to the main page.' },
      { q: 'Why check isnan() after reading the DHT11?', options: ['A failed read returns NaN — skip it rather than store garbage', 'To round the value', 'To convert to °F', 'It’s required by WiFi'], answer: 0, explain: 'Long wires or reading too fast can make the DHT11 time out; NaN marks a failed reading.' },
    ],
    challenges: ['Show the temperature in °F on the web page as well.', 'Add a <code>/json</code> endpoint that returns <code>{"t":…, "h":…}</code>.', 'Keep the last 24 readings in an array and draw a mini graph on the OLED.'],
    code: `#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

const char* SSID = "your-wifi";
const char* PASS = "your-password";

DHT dht(4, DHT11);                  // DATA on GPIO4
Adafruit_SSD1306 oled(128, 64, &Wire, -1);
WebServer server(80);
float t = NAN, h = NAN, tMin = NAN, tMax = NAN;
unsigned long lastRead = 0;

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>"
    "<meta name='viewport' content='width=device-width'>"
    "<meta http-equiv='refresh' content='5'></head><body>"
    "<h2>Weather station</h2>";
  html += "<p>Temperature: <b>" + String(t, 1) + " &deg;C</b></p>";
  html += "<p>Humidity: <b>" + String(h, 0) + " %</b></p>";
  html += "<p>Min / max: " + String(tMin, 1) + " / " + String(tMax, 1) + "</p>";
  html += "<p><a href='/reset'>Reset min/max</a></p></body></html>";
  server.send(200, "text/html", html);
}

void handleReset() {
  tMin = tMax = t;
  server.sendHeader("Location", "/");
  server.send(303);
}

void showOled() {
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.print(WiFi.localIP());
  oled.setTextSize(2);
  oled.setCursor(0, 16);
  oled.print(t, 1);
  oled.print(" C");
  oled.setCursor(0, 36);
  oled.print(h, 0);
  oled.print(" %");
  oled.setTextSize(1);
  oled.setCursor(0, 56);
  oled.printf("min %.0f  max %.0f", tMin, tMax);
  oled.display();
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  Wire.begin(21, 22);               // SDA, SCL
  oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  oled.setTextColor(SSD1306_WHITE);
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) delay(250);
  Serial.print("Open http://");
  Serial.println(WiFi.localIP());
  server.on("/", handleRoot);
  server.on("/reset", handleReset);
  server.begin();
}

void loop() {
  server.handleClient();
  if (millis() - lastRead < {{interval}}) return;  // DHT11: max 1 read/s
  lastRead = millis();
  float nt = dht.readTemperature();
  float nh = dht.readHumidity();
  if (isnan(nt) || isnan(nh)) {
    Serial.println("DHT11 read failed");
    return;
  }
  t = nt;
  h = nh;
  if (isnan(tMin) || t < tMin) tMin = t;
  if (isnan(tMax) || t > tMax) tMax = t;
  Serial.printf("%.1f C  %.0f %%\\n", t, h);
  showOled();
}`,
    params: { interval: { value: 2000, min: 1000, max: 60000 } },
    async setup(io, b) {
      Object.assign(b.web, { t: NaN, h: NaN, min: NaN, max: NaN, up: false });
      b.state.req = null;
      b.lastRead = -1e9; b.lastPage = -1e9; b.t0 = performance.now();
      io.line('dht.begin()'); await io.delay(80);
      io.line('Wire.begin'); await io.delay(80);
      io.line('oled.begin'); b.oled.text(['Connecting...'], { y: 28 }); await io.delay(120);
      io.line('WiFi.begin'); io.print('Connecting to your-wifi…');
      io.line('while (WiFi.status()'); await io.delay(900);
      io.line('Serial.println(WiFi.localIP'); io.print(`Open http://${ESP_IP}`);
      io.line('server.begin()'); b.web.up = true; b.browser.update(); await io.delay(100);
    },
    async loop(io, b, p) {
      const now = performance.now() - b.t0;
      io.line('server.handleClient()');
      if (b.state.req === 'reset') {
        b.state.req = null;
        io.line('void handleReset'); await io.delay(80);
        io.line('tMin = tMax = t'); b.web.min = b.web.max = b.web.t;
        io.line('server.send(303)'); io.print('GET /reset → 303');
        b.browser.update(); await io.delay(80);
      }
      if (now - b.lastPage >= 5000) { b.lastPage = now; b.browser.update(); }
      io.line('if (millis() - lastRead');
      if (now - b.lastRead < p.interval) { await io.delay(50); return; }
      b.lastRead = now;
      io.line('float nt = dht'); await io.delay(30);
      const t = Math.round(b.state.t + (Math.random() - 0.5) * 0.9);
      const h = Math.round(b.state.h + (Math.random() - 0.5) * 2);
      io.pin('GPIO4', `${t}°C ${h}%`, true);
      io.line('t = nt;'); b.web.t = t; b.web.h = h;
      io.line('if (isnan(tMin)'); if (Number.isNaN(b.web.min) || t < b.web.min) b.web.min = t;
      io.line('if (isnan(tMax)'); if (Number.isNaN(b.web.max) || t > b.web.max) b.web.max = t;
      io.line('Serial.printf'); io.print(`${t.toFixed(1)} C  ${h} %`);
      io.line('showOled()');
      const o = b.oled;
      o.text([ESP_IP], { y: 0 });
      o.text([`${t.toFixed(1)} C`], { size: 2, y: 16, clear: false });
      o.text([`${h} %`], { size: 2, y: 36, clear: false });
      o.text([`min ${b.web.min.toFixed(0)}  max ${b.web.max.toFixed(0)}`], { y: 56, clear: false });
      io.pin('GPIO21', 'SDA', true);
      await io.delay(50);
    },
    reset(b) { b.oled.clear(); b.web.up = false; b.browser.update(); },
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'proj-robot-car', title: 'Obstacle-avoiding robot', icon: 'car', board: 'uno',
    thumb: () => makeRobotCar(v(0, 0, -4)).group,
    view: { center: [0, 3, 0], size: 66 },
    build: buildRobot,
    callouts: [
      { anchor: 'us', x: 0.04, y: 0.17, icon: 'radar', title: 'HC-SR04 · D3 / D2', text: 'Pings ahead every 60 ms; distances come from real ray-casts against the blocks.' },
      { anchor: 'uno', x: 0.36, y: 0.12, icon: 'chip', title: 'Uno on the deck', text: 'Runs the drive → back → scan → turn state machine.' },
      { anchor: 'drv', x: 0.7, y: 0.17, icon: 'motor', title: 'L298N driver', text: 'Two H-bridges: IN pins set direction, ENA / ENB PWM set speed.' },
      { anchor: 'bat', x: 0.04, y: 0.68, icon: 'bolt', title: '4×AA pack', text: 'Feeds the motors through the L298N and the Uno through VIN.' },
      { anchor: 'blocks', x: 0.36, y: 0.74, icon: 'hand', title: 'Obstacles', text: 'Click the car to pick another course.' },
    ],
    overview: {
      heading: 'Obstacle-avoiding robot',
      text: 'The ultrasonic sensor (<em>Read a sensor</em>), an L298N motor driver (<em>Motor drivers</em>) and a state machine (<em>Non-blocking code</em>) make a robot that drives until something is close, backs off, looks left and right, and turns towards the clearer side.',
      features: [['radar', 'HC-SR04 distance with a <code>pulseIn()</code> timeout'], ['motor', '<code>motors(left, right)</code>: −255…255 per side'], ['code', '<code>enum State { DRIVE, BACK, SCAN }</code>']],
    },
    pinout: [['D5 ~ / D6 ~', 'L298N ENA / ENB', 'PWM speed (remove the jumpers)'], ['D7, D8', 'IN1, IN2', 'Left motor direction'], ['D9, D11', 'IN3, IN4', 'Right motor direction'], ['D3 / D2', 'HC-SR04 TRIG / ECHO', ''], ['5V, GND', 'HC-SR04 VCC, GND', ''], ['Battery + → L298N 12V → Uno VIN', 'Battery – → L298N GND → Uno GND', 'Common ground']],
    example: {
      text: 'Robot vacuums, warehouse robots and toy cars use the same sense → decide → act loop, usually with more sensors (bump switches, IR cliff sensors, lidar) and wheel encoders for precise turns.',
      points: ['Raise <code>STOP_CM</code> if it clips corners; lower <code>SPEED</code> for tighter control', '<code>TURN_MS</code> is calibrated for ≈ 45° — measure your car and adjust', 'The sensor sees a 15° cone, so thin or angled objects can be missed'],
    },
    specs: [['Chassis', '2WD acrylic, 2 × TT gear motors, ball caster'], ['Driver', 'L298N dual H-bridge, ≈ 2 V drop'], ['Battery', '4×AA (6 V); 2 × 18650 (7.4 V) is punchier'], ['Sensor', 'HC-SR04, 2–400 cm, 15° cone'], ['Top speed', '≈ 14 cm/s at full PWM'], ['Libraries', 'None — plain Arduino']],
    quiz: [
      { q: 'What do IN1 = HIGH, IN2 = LOW do on the L298N?', options: ['Brake', 'Spin that motor one way; swap them to reverse', 'Set the speed', 'Nothing without IN3'], answer: 1, explain: 'IN1/IN2 choose the H-bridge direction; ENA (PWM) sets how fast.' },
      { q: 'Why give pulseIn() a 25000 µs timeout?', options: ['So a missing echo can’t stall the robot for a whole second', 'To measure further', 'To make it more accurate', 'The L298N needs it'], answer: 0, explain: 'Without a timeout pulseIn() waits up to 1 s; 25 ms covers about 4 m.' },
      { q: 'motors(-160, 160) makes the robot…', options: ['Drive forward', 'Reverse', 'Spin on the spot (pivot)', 'Stop'], answer: 2, explain: 'One wheel backwards and one forwards at the same speed turns it in place.' },
      { q: 'Why not power the motors from the Uno’s 5 V pin?', options: ['Motors draw far more current than the Uno can supply and inject noise', '5 V is too high', 'It would drive backwards', 'It is fine'], answer: 0, explain: 'The battery feeds the motors directly through the L298N; the Uno only sends control signals.' },
    ],
    challenges: ['Make it beep a buzzer while reversing.', 'Turn the scan into three looks (left, centre, right) and pick the best of three.', 'Add a servo so the sensor turns instead of the whole robot.'],
    code: `// Obstacle-avoiding robot: drive, back off, look both ways, turn.
const int ENA = 5, IN1 = 7, IN2 = 8;     // left motor
const int ENB = 6, IN3 = 9, IN4 = 11;    // right motor
const int TRIG = 3, ECHO = 2;
const int SPEED = {{speed}};               // 0-255
const int STOP_CM = {{stop}};
const int TURN_SPEED = 160;
const int TURN_MS = 450;                 // ~45 degrees at TURN_SPEED
const int LEFT = 1, RIGHT = -1;

enum State { DRIVE, BACK, SCAN };
State state = DRIVE;
unsigned long since = 0;

void motors(int left, int right) {       // -255..255 each
  digitalWrite(IN1, left > 0);
  digitalWrite(IN2, left < 0);
  digitalWrite(IN3, right > 0);
  digitalWrite(IN4, right < 0);
  analogWrite(ENA, abs(left));
  analogWrite(ENB, abs(right));
}

long readCm() {
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 25000);  // no echo in 25 ms: clear
  return us ? us * 0.0343 / 2 : 400;
}

void pivot(int dir, int times) {         // LEFT = counter-clockwise
  motors(-dir * TURN_SPEED, dir * TURN_SPEED);
  delay(TURN_MS * times);
  motors(0, 0);
  delay(150);
}

void setup() {
  int pins[] = {ENA, IN1, IN2, ENB, IN3, IN4, TRIG};
  for (int p : pins) pinMode(p, OUTPUT);
  pinMode(ECHO, INPUT);
  Serial.begin(9600);
}

void loop() {
  long cm = readCm();
  switch (state) {
    case DRIVE:
      motors(SPEED, SPEED);
      if (cm < STOP_CM) {
        Serial.print("Obstacle at ");
        Serial.println(cm);
        state = BACK;
        since = millis();
      }
      break;
    case BACK:
      motors(-SPEED, -SPEED);
      if (millis() - since > 400) {
        motors(0, 0);
        state = SCAN;
      }
      break;
    case SCAN: {
      pivot(LEFT, 1);                    // look left
      long left = readCm();
      pivot(RIGHT, 2);                   // look right
      long right = readCm();
      Serial.print("L ");
      Serial.print(left);
      Serial.print("  R ");
      Serial.println(right);
      if (left < STOP_CM && right < STOP_CM) pivot(RIGHT, 3);  // dead end
      else if (right >= left) pivot(RIGHT, 1);                 // 90 deg right
      else pivot(LEFT, 3);                                      // 90 deg left
      state = DRIVE;
      break;
    }
  }
  delay(60);                             // HC-SR04: 60 ms between pings
}`,
    params: { speed: { value: 180, min: 80, max: 255 }, stop: { value: 18, min: 5, max: 60 } },
    async setup(io, b) {
      b.reset();
      io.line('for (int p : pins)'); await io.delay(100);
      io.line('Serial.begin'); await io.delay(80);
      b.st = 'DRIVE';
    },
    async loop(io, b, p) {
      const motors = (l, r, k = 1) => {
        io.line('void motors', k);
        b.car.setWheels(l / 255, r / 255);
        b.wheelsLive(l !== 0 || r !== 0);
      };
      const readCm = async (n = 1) => {
        io.line('long cm = readCm()', n);
        b.ping();
        await io.delay(20);
        const cm = Math.round(b.distance());
        b.plot.push(Math.min(cm, 150), p.stop);
        return cm;
      };
      const pivot = async (dir, times, label) => {
        io.line(label);
        b.car.setWheels((-dir * 160) / 255, (dir * 160) / 255);
        b.wheelsLive(true);
        await io.delay(450 * times);
        b.car.stop(); b.wheelsLive(false);
        await io.delay(150);
      };
      const cm = await readCm();
      if (b.st === 'DRIVE') {
        io.line('case DRIVE:');
        motors(p.speed, p.speed);
        io.line('if (cm < STOP_CM)');
        if (cm < p.stop) {
          io.line('Serial.println(cm)'); io.print(`Obstacle at ${cm}`);
          b.st = 'BACK'; b.since = performance.now();
        }
      } else if (b.st === 'BACK') {
        io.line('case BACK:');
        motors(-p.speed, -p.speed);
        if (performance.now() - b.since > 400) { io.line('motors(0, 0);', 1); b.car.stop(); b.wheelsLive(false); b.st = 'SCAN'; }
      } else {
        io.line('case SCAN:');
        await pivot(1, 1, 'pivot(LEFT, 1)');
        io.line('long left = readCm()'); b.ping(); await io.delay(30);
        const left = Math.round(b.distance());
        await pivot(-1, 2, 'pivot(RIGHT, 2)');
        io.line('long right = readCm()'); b.ping(); await io.delay(30);
        const right = Math.round(b.distance());
        io.line('Serial.println(right)'); io.print(`L ${left}  R ${right}`);
        if (left < p.stop && right < p.stop) await pivot(-1, 3, 'pivot(RIGHT, 3)');
        else if (right >= left) await pivot(-1, 1, 'pivot(RIGHT, 1)');
        else await pivot(1, 3, 'pivot(LEFT, 3)');
        b.st = 'DRIVE';
      }
      io.line('delay(60)'); await io.delay(60);
    },
    reset(b) { b.reset(); },
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'proj-smart-home', title: 'Smart home hub', icon: 'home', board: 'esp32',
    thumb: () => { const l = makeLamp(v(0, 0, 0)); l.set(true); return l.group; },
    view: { center: [-2.2, 1.6, -3.4], size: 25 },
    build(ctx) {
      const b = ctx.board;
      const bb = ctx.breadboard(-8.6, 0.4);
      // rails: back = 5 V (VIN) / GND, front = 3.3 V / GND
      ctx.wire(b.pin('VIN'), bb.hole(29, 'top+'), 'red', { signal: '5V', lift: 1.0 });
      ctx.wire(b.pin('GND'), bb.hole(28, 'top-'), 'black', { signal: 'GND', dir: -1, lift: 0.8 });
      ctx.wire(b.pin('3V3'), bb.hole(29, 'bot+'), 'red', { signal: '3V3', lift: 1.0 });
      ctx.wire(b.pin('GND_2'), bb.hole(28, 'bot-'), 'black', { signal: 'GND', dir: -1, lift: 0.8 });
      // LDR + 10 kΩ divider → GPIO34
      const ldr = ctx.add(makeLDR(bb.hole(21, 'i'), bb.hole(22, 'i')));
      ctx.add(makeResistor(bb.hole(22, 'e'), bb.hole(22, 'g'), 10000, { height: 0.45 }));
      ctx.wire(bb.hole(21, 'j'), bb.hole(21, 'bot+'), 'red', { lift: 0.4 });
      ctx.wire(bb.hole(22, 'a'), bb.hole(22, 'top-'), 'black', { lift: 0.4 });
      const a34 = ctx.wire(b.pin('GPIO34'), bb.hole(22, 'f'), 'green', { signal: 'GPIO34', lift: 1.6 });
      // PIR behind the breadboard
      const pir = ctx.add(makePIR(v(-8.8, 0, -6.2)));
      ctx.wire(bb.hole(12, 'top+'), pir.pin('VCC'), 'red', { lift: 1.0 });
      ctx.wire(bb.hole(13, 'top-'), pir.pin('GND'), 'black', { lift: 0.8, dir: -1 });
      const outW = ctx.wire(pir.pin('OUT'), b.pin('GPIO27'), 'yellow', { signal: 'GPIO27', lift: 2.0, dir: -1 });
      // relay + lamp behind the board
      const relay = ctx.add(makeRelay(v(2.8, 0, -6.0)));
      const inW = ctx.wire(b.pin('GPIO26'), relay.pin('IN'), 'orange', { signal: 'GPIO26', lift: 1.4 });
      ctx.wire(bb.hole(25, 'top+'), relay.pin('VCC'), 'red', { lift: 1.6 });
      ctx.wire(bb.hole(26, 'top-'), relay.pin('GND'), 'black', { lift: 1.3, dir: -1 });
      const lamp = ctx.add(makeLamp(v(9.2, 0, -6.4)));
      const lw = [ctx.wire(relay.pin('COM'), lamp.terminal(0), 'red', { lift: 1.2 }), ctx.wire(relay.pin('NO'), lamp.terminal(1), 'black', { lift: 1.6 })];
      // someone walking past
      const person = ctx.add(makePerson(v(-15, 0, -10.2), { rotY: Math.PI / 2 }));
      const state = { light: 0.3, walking: false, wx: -15, dir: 1, pirHold: 0, motion: false };
      ctx.setDarkness(1 - state.light);
      const walk = () => { state.walking = true; state.dir = state.wx < -6 ? 1 : -1; };
      ctx.onTick((dt) => {
        if (state.walking) {
          state.wx += state.dir * 7 * dt;
          if (state.wx > 3 || state.wx < -15) { state.wx = clamp(state.wx, -15, 3); state.walking = false; }
          person.group.position.x = state.wx;
          person.group.rotation.y = state.dir * Math.PI / 2;
          person.group.position.y = Math.abs(Math.sin(state.wx * 1.4)) * 0.25;
        }
        // HC-SR501: OUT goes high while someone moves in range, held for ~3 s
        const near = Math.abs(state.wx - pir.group.position.x) < 8;
        if (near && state.walking) state.pirHold = 3;
        state.pirHold = Math.max(0, state.pirHold - dt);
        state.motion = state.pirHold > 0;
        pir.trigger(state.motion);
      });
      const walkCtl = { type: 'button', label: 'Walk past the sensor', press: walk };
      ctx.interact(person, { name: 'Someone at home', hint: 'Make them walk past the PIR', controls: [walkCtl] });
      ctx.interact(pir, { name: 'PIR motion sensor', hint: 'Detects warm moving bodies', controls: [walkCtl], note: () => (state.motion ? 'OUT = HIGH (motion)' : 'OUT = LOW') });
      ctx.interact(ldr, {
        name: 'Light sensor (LDR)', hint: 'Make the room darker or brighter',
        controls: [{ type: 'range', label: 'Daylight', min: 0, max: 100, step: 1, get: () => Math.round(state.light * 100), set: (x) => { state.light = x / 100; ctx.setDarkness(1 - state.light); }, format: (x) => `${x}%` }],
      });
      const hub = { auto: true, lamp: false, light: 0, up: false, req: null };
      const browser = ctx.browser({
        url: `http://${ESP_IP}/`, title: 'Smart home',
        render: () => (hub.up
          ? `<h5>Smart home</h5><div class="row"><span>Lamp</span><button data-action="lamp" class="${hub.lamp ? 'on' : 'off'}">${hub.lamp ? 'ON' : 'OFF'}</button></div><div class="row"><span>Auto mode</span><button data-action="auto" class="${hub.auto ? 'on' : 'off'}">${hub.auto ? 'ON' : 'OFF'}</button></div><div class="row"><span>Light</span><b>${Math.round((hub.light * 100) / 4095)} %</b></div><div class="row"><span>Motion</span><b>${state.motion ? 'yes' : 'no'}</b></div><p class="muted">Switching the lamp by hand turns auto mode off.</p>`
          : '<h5>Smart home</h5><p class="muted">Waiting for the ESP32… press Run.</p>'),
        onAction: (a) => { hub.req = a; },
      });
      ctx.anchor('pir', pir.anchor);
      ctx.anchor('relay', relay.anchor);
      ctx.anchor('lamp', lamp.anchor);
      ctx.anchor('ldr', ldr.anchor ?? a34.mid);
      ctx.anchor('person', person.anchor);
      ctx.anchor('out', outW.mid);
      ctx.anchor('in', inW.mid);
      return { relay, lamp, pir, person, state, hub, browser, lw };
    },
    callouts: [
      { anchor: 'pir', x: 0.04, y: 0.17, icon: 'radar', title: 'PIR → GPIO27', text: 'HIGH for a few seconds after it sees movement.' },
      { anchor: 'relay', x: 0.36, y: 0.12, icon: 'bolt', title: 'Relay ← GPIO26', text: 'Switches the low-voltage lamp circuit.' },
      { anchor: 'lamp', x: 0.7, y: 0.17, icon: 'led', title: 'Lamp', text: 'On when it’s dark and someone is about — or from the phone.' },
      { anchor: 'ldr', x: 0.04, y: 0.68, icon: 'sun', title: 'LDR → GPIO34', text: 'ADC1 pin, so it still works while Wi-Fi is on. Click to dim the room.' },
      { anchor: 'person', x: 0.36, y: 0.74, icon: 'hand', title: 'Walk past', text: 'Click the person to trigger the motion sensor.' },
    ],
    overview: {
      heading: 'Smart home hub',
      text: 'Motion (<em>PIR</em>), light level (<em>Sense light</em>) and a relay-switched lamp (<em>Relays</em>), controlled by an ESP32 web dashboard (<em>Web control</em>). In auto mode the lamp turns on when it’s dark and someone moves, and off again after a hold time; the phone can take over at any moment.',
      features: [['globe', 'Routes <code>/</code>, <code>/lamp?on=1</code>, <code>/auto?on=0</code>'], ['radar', 'Motion timer with <code>millis()</code>'], ['sun', 'Analog light level on an ADC1 pin']],
    },
    pinout: [['GPIO26', 'Relay IN', '3.3 V drives most opto relay boards'], ['GPIO27', 'PIR OUT', '3.3 V output'], ['GPIO34', 'LDR / 10 kΩ midpoint', 'ADC1, input-only'], ['VIN (5 V) → back rail', 'Relay VCC, PIR VCC', 'Both need 5 V'], ['3V3 → front rail', 'LDR top', 'Keeps the ADC under 3.3 V'], ['Relay COM / NO', 'Lamp supply', 'Low voltage only']],
    example: {
      text: 'Hallway lights, porch lights and smart plugs combine exactly these pieces. Commercial hubs add schedules, voice assistants and a cloud service, but underneath it’s sensors, relays and a web API.',
      points: ['Open the dashboard and switch the lamp — auto mode turns off, just like a real override', 'Change <code>HOLD_MS</code> to keep the light on longer', 'Never put mains wiring on a breadboard — use a certified smart plug for 230 V / 120 V loads'],
    },
    specs: [['Board', 'ESP32 DevKit'], ['Relay', '5 V coil, 10 A contacts (use low voltage!)'], ['PIR', 'HC-SR501, ≈ 7 m, 3–300 s hold'], ['LDR divider', 'LDR to 3V3, 10 kΩ to GND'], ['ADC', '12-bit, 0–4095'], ['Libraries', 'WiFi, WebServer']],
    quiz: [
      { q: 'Why is the LDR on GPIO34 and not, say, GPIO25?', options: ['GPIO34 is on ADC1; ADC2 pins can’t be read while Wi-Fi is running', 'GPIO25 is output-only', 'GPIO34 is 5 V tolerant', 'No reason'], answer: 0, explain: 'The Wi-Fi driver uses ADC2, so analog inputs in Wi-Fi projects belong on ADC1 (GPIO32–39).' },
      { q: 'Why does the code only switch the lamp ON when it’s dark, but leaves it on until the timer ends?', options: ['Otherwise the lamp’s own light would make it “bright” and switch it straight off again', 'To save power', 'The relay is slow', 'The PIR needs it'], answer: 0, explain: 'Checking the light only before switching on avoids a feedback loop where the lamp turns itself off.' },
      { q: 'What does server.arg("on") return for /lamp?on=1?', options: ['"1"', '1 as a number', '"lamp"', 'Nothing'], answer: 0, explain: 'Query parameters arrive as Strings, so the code compares with "1".' },
      { q: 'Why is lastMotion > 0 part of the condition?', options: ['So the lamp doesn’t switch on at power-up before anyone has moved', 'To avoid overflow', 'It’s required by WebServer', 'To debounce the relay'], answer: 0, explain: 'lastMotion starts at 0; without the check, millis() − 0 would look like “recent motion” for the first HOLD_MS.' },
    ],
    challenges: ['Show the time since the last motion on the dashboard.', 'Add a brightness slider that sets a PWM LED strip instead of an on/off relay.', 'Save auto mode in Preferences (flash) so it survives a reboot.'],
    code: `#include <WiFi.h>
#include <WebServer.h>

const char* SSID = "your-wifi";
const char* PASS = "your-password";
const int RELAY_PIN = 26;
const int PIR_PIN = 27;
const int LDR_PIN = 34;                    // ADC1: fine with Wi-Fi on
const int DARK = {{dark}};                   // 0-4095: below = dark
const unsigned long HOLD_MS = {{hold}} * 1000UL;

WebServer server(80);
bool autoMode = true, lampOn = false;
unsigned long lastMotion = 0;
int light = 0;

void setLamp(bool on) {
  if (on == lampOn) return;
  lampOn = on;
  digitalWrite(RELAY_PIN, on ? HIGH : LOW);
  Serial.println(on ? "Lamp ON" : "Lamp OFF");
}

void back() {                              // redirect to the dashboard
  server.sendHeader("Location", "/");
  server.send(303);
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta name='viewport' "
    "content='width=device-width'></head><body><h2>Smart home</h2>";
  html += "<p>Lamp: " + String(lampOn ? "ON" : "OFF");
  html += " <a href='/lamp?on=" + String(lampOn ? 0 : 1) + "'>switch</a></p>";
  html += "<p>Auto: " + String(autoMode ? "ON" : "OFF");
  html += " <a href='/auto?on=" + String(autoMode ? 0 : 1) + "'>switch</a></p>";
  html += "<p>Light " + String(light * 100 / 4095) + " %, motion ";
  html += String(digitalRead(PIR_PIN) ? "yes" : "no") + "</p></body></html>";
  server.send(200, "text/html", html);
}

void handleLamp() {
  autoMode = false;                        // manual override
  setLamp(server.arg("on") == "1");
  back();
}

void handleAuto() {
  autoMode = server.arg("on") == "1";
  back();
}

void setup() {
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(PIR_PIN, INPUT);
  Serial.begin(115200);
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) delay(250);
  Serial.println(WiFi.localIP());
  server.on("/", handleRoot);
  server.on("/lamp", handleLamp);
  server.on("/auto", handleAuto);
  server.begin();
}

void loop() {
  server.handleClient();
  light = analogRead(LDR_PIN);
  if (digitalRead(PIR_PIN) == HIGH) lastMotion = millis();
  if (autoMode) {
    bool recent = lastMotion > 0 && millis() - lastMotion < HOLD_MS;
    if (!recent) setLamp(false);
    else if (light < DARK) setLamp(true);  // only switch ON in the dark
  }
  delay(50);
}`,
    params: { dark: { value: 1500, min: 0, max: 4095 }, hold: { value: 8, min: 1, max: 120 } },
    async setup(io, b) {
      Object.assign(b.hub, { auto: true, lamp: false, up: false, req: null });
      b.lastMotion = 0; b.t0 = performance.now(); b.lastPage = 0;
      io.line('pinMode(RELAY_PIN'); await io.delay(80);
      io.line('WiFi.begin'); io.print('Connecting to your-wifi…');
      io.line('while (WiFi.status()'); await io.delay(900);
      io.line('Serial.println(WiFi.localIP'); io.print(ESP_IP);
      io.line('server.begin()'); b.hub.up = true; b.browser.update(); await io.delay(100);
    },
    async loop(io, b, p) {
      const now = performance.now() - b.t0 + 1;
      const setLamp = async (on) => {
        if (on === b.hub.lamp) return;
        io.line('void setLamp');
        b.hub.lamp = on;
        io.line('digitalWrite(RELAY_PIN'); b.relay.set(on); b.lamp.set(on); io.pin('GPIO26', on ? 'HIGH' : 'LOW', on);
        b.lw.forEach((w) => (w.live = on));
        io.line('Serial.println(on'); io.print(on ? 'Lamp ON' : 'Lamp OFF');
        b.browser.update();
        await io.delay(60);
      };
      io.line('server.handleClient()');
      const req = b.hub.req;
      b.hub.req = null;
      if (req === 'lamp') {
        io.line('void handleLamp'); io.print(`GET /lamp?on=${b.hub.lamp ? 0 : 1}`);
        io.line('autoMode = false'); b.hub.auto = false;
        await setLamp(!b.hub.lamp);
        b.browser.update(); await io.delay(60);
      } else if (req === 'auto') {
        io.line('void handleAuto'); io.print(`GET /auto?on=${b.hub.auto ? 0 : 1}`);
        b.hub.auto = !b.hub.auto; b.browser.update(); await io.delay(60);
      }
      io.line('light = analogRead');
      const rLdr = 200000 * 10 ** (-2.3 * b.state.light);
      b.hub.light = Math.round((4095 * 10000) / (10000 + rLdr));
      io.pin('GPIO34', String(b.hub.light), true);
      io.line('if (digitalRead(PIR_PIN)');
      io.pin('GPIO27', b.state.motion ? 'HIGH' : 'LOW', b.state.motion);
      if (b.state.motion) b.lastMotion = now;
      if (b.hub.auto) {
        io.line('bool recent');
        const recent = b.lastMotion > 0 && now - b.lastMotion < p.hold * 1000;
        if (!recent) await setLamp(false);
        else if (b.hub.light < p.dark) { io.line('else if (light < DARK)'); await setLamp(true); }
      }
      if (now - b.lastPage > 1000) { b.lastPage = now; b.browser.update(); }
      io.line('delay(50)'); await io.delay(50);
    },
    reset(b) {
      b.relay.set(false); b.lamp.set(false); b.lw.forEach((w) => (w.live = false));
      b.hub.up = false; b.hub.lamp = false; b.browser.update();
    },
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'proj-security', title: 'Security system', icon: 'radar', board: 'mega',
    thumb: () => makeKeypad(v(0, 0, -3)).group,
    view: { center: [4.2, 1.2, -3.0], size: 30 },
    build(ctx) {
      const b = ctx.board;
      // keypad behind the board, ribbon plugged onto the double header
      const kp = ctx.add(makeKeypad(v(3.4, 0, -13.6)));
      const rows = ['D22', 'D24', 'D26', 'D28'], cols = ['D30', 'D32', 'D34', 'D36'];
      const kcol = ['orange', 'yellow', 'green', 'blue', 'purple', 'white', 'brown', 'orange'];
      ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'].forEach((n, i) =>
        ctx.wire(kp.pin(n), b.pin(i < 4 ? rows[i] : cols[i - 4]), kcol[i], { lift: 1.0 + i * 0.12 }));
      // LCD on I²C, back left
      const lcd = ctx.add(makeLCD1602(v(-5.6, 0, -7.6), { variant: 'blue' }));
      ctx.wire(lcd.pin('SDA'), b.pin('SDA'), 'blue', { signal: 'SDA', lift: 1.6 });
      ctx.wire(lcd.pin('SCL'), b.pin('SCL'), 'yellow', { signal: 'SCL', lift: 1.4 });
      ctx.wire(lcd.pin('VCC'), b.pin('5V'), 'red', { lift: 2.4 });
      ctx.wire(lcd.pin('GND'), b.pin('GND'), 'black', { lift: 1.8, dir: -1 });
      // PIR front right
      const pir = ctx.add(makePIR(v(11.8, 0, -4.2)));
      ctx.wire(pir.pin('VCC'), b.pin('5V_3'), 'red', { lift: 1.6 });
      ctx.wire(pir.pin('GND'), b.pin('GND_5'), 'black', { lift: 1.2, dir: -1 });
      const outW = ctx.wire(pir.pin('OUT'), b.pin('D2'), 'green', { signal: 'D2', lift: 2.4, dir: -1 });
      // breadboard in front: buzzer on D8 + armed LED on D13
      const bb = ctx.breadboard(0.4, 7.8);
      const bz = ctx.add(makeBuzzer(bb.hole(18, 'd'), bb.hole(21, 'd')));
      ctx.wire(b.pin('D8'), bb.hole(18, 'b'), 'orange', { signal: 'D8', lift: 2.0 });
      ctx.wire(b.pin('GND_3'), bb.hole(21, 'b'), 'black', { signal: 'GND', dir: -1, lift: 1.0 });
      const led = ledOnPin(ctx, bb, { pin: 'D13', col: 6, color: 'red', gnd: 'GND_2' });
      // intruder
      const person = ctx.add(makePerson(v(22, 0, 0.4), { rotY: -Math.PI / 2, shirt: 0x6a5acd }));
      const state = { keys: [], px: 22, walking: 0, pirHold: 0, motion: false };
      const keysCtl = { type: 'keys', label: 'Keypad', keys: kp.keys, down: (k) => { kp.press(k); state.keys.push(k); }, up: () => kp.release() };
      ctx.interact(kp, { name: '4×4 keypad', hint: 'Type the PIN then # (default 1234). * clears.', controls: [keysCtl] });
      const walkCtl = [
        { type: 'button', label: 'Walk in', press: () => (state.walking = -1) },
        { type: 'button', label: 'Walk out', press: () => (state.walking = 1) },
      ];
      ctx.interact(person, { name: 'Visitor', hint: 'Walk them in front of the PIR sensor', controls: walkCtl });
      ctx.interact(pir, { name: 'PIR motion sensor', hint: 'Triggers when someone moves nearby', controls: walkCtl, note: () => (state.motion ? 'OUT = HIGH' : 'OUT = LOW') });
      ctx.onTick((dt) => {
        if (state.walking) {
          state.px += state.walking * 8 * dt;
          if (state.px < 12 || state.px > 22) { state.px = clamp(state.px, 12, 22); state.walking = 0; }
          person.group.position.x = state.px;
          person.group.rotation.y = state.walking > 0 ? Math.PI / 2 : -Math.PI / 2;
          person.group.position.y = state.walking ? Math.abs(Math.sin(state.px * 1.4)) * 0.25 : 0;
        }
        const near = Math.hypot(state.px - pir.group.position.x, 0.4 - pir.group.position.z) < 9;
        if (near && state.walking) state.pirHold = 2.5;
        state.pirHold = Math.max(0, state.pirHold - dt);
        state.motion = state.pirHold > 0;
        pir.trigger(state.motion);
      });
      ctx.anchor('kp', kp.anchor);
      ctx.anchor('lcd', lcd.anchor);
      ctx.anchor('pir', pir.anchor);
      ctx.anchor('bz', bz.anchor);
      ctx.anchor('person', person.anchor);
      ctx.anchor('out', outW.mid);
      return { kp, lcd, pir, bz, led, person, state };
    },
    callouts: [
      { anchor: 'lcd', x: 0.04, y: 0.17, icon: 'info', title: 'LCD 16×2 (I²C)', text: 'Shows the state and a * for each digit typed.' },
      { anchor: 'kp', x: 0.36, y: 0.12, icon: 'pins', title: '4×4 keypad', text: 'Rows on D22–28, columns on D30–36. Click it to type.' },
      { anchor: 'pir', x: 0.7, y: 0.17, icon: 'radar', title: 'PIR on D2', text: 'While armed, movement starts the entry delay.' },
      { anchor: 'bz', x: 0.04, y: 0.68, icon: 'sound', title: 'Buzzer on D8', text: 'Chirps during the entry delay, wails in ALARM.' },
      { anchor: 'person', x: 0.7, y: 0.68, icon: 'hand', title: 'Visitor', text: 'Click them to walk in front of the sensor.' },
    ],
    overview: {
      heading: 'Security system',
      text: 'A keypad (<em>Keypad</em>), PIR (<em>Motion sensor</em>), I²C LCD (<em>LCD</em>) and buzzer (<em>Make a sound</em>) become a proper alarm: enter the PIN + # to arm, leave during the exit delay, and anyone who walks in must disarm before the entry delay runs out — or the siren sounds.',
      features: [['code', '<code>enum State</code>: DISARMED → EXIT_DELAY → ARMED → ENTRY_DELAY → ALARM'], ['pins', 'Keypad library scans the 4×4 matrix'], ['timer', 'Every delay is a <code>millis()</code> timer']],
    },
    pinout: [['D22, D24, D26, D28', 'Keypad R1–R4', ''], ['D30, D32, D34, D36', 'Keypad C1–C4', ''], ['SDA / SCL (20 / 21)', 'LCD SDA / SCL', 'Backpack at 0x27'], ['D2', 'PIR OUT', ''], ['D8', 'Buzzer +', 'tone()'], ['D13', '220 Ω → red LED', 'Armed light']],
    example: {
      text: 'Home alarm panels work the same way: a state machine with exit and entry timers, a PIN pad, sensors on doors and rooms, and a siren. Real ones add tamper switches, a backup battery and a link to a monitoring service.',
      points: ['Default PIN is 1234 — type <b>1 2 3 4 #</b> on the keypad to arm', 'Walk the visitor in while armed and disarm before the countdown ends', 'Change <code>ENTRY_MS</code> to give yourself more time'],
    },
    specs: [['Board', 'Mega 2560 (plenty of pins for the keypad)'], ['Keypad', '4×4 membrane, matrix scanned'], ['Display', '16×2 LCD, PCF8574 backpack, 0x27'], ['Sensor', 'HC-SR501 PIR'], ['Siren', 'Passive buzzer, 1.2 / 1.8 kHz'], ['Libraries', 'Keypad, Wire, LiquidCrystal_I2C']],
    quiz: [
      { q: 'Why is there an exit delay after arming?', options: ['So you can leave without your own movement setting off the alarm', 'The PIR needs to warm up only', 'The LCD is slow', 'To save power'], answer: 0, explain: 'The PIR is ignored during EXIT_DELAY; only ARMED reacts to motion.' },
      { q: 'How many pins does a 4×4 matrix keypad need?', options: ['16', '8', '4', '2'], answer: 1, explain: '4 rows + 4 columns: the library drives each row and reads the columns to find the key.' },
      { q: 'What does entering the correct PIN + # do while the siren is sounding?', options: ['Nothing until reset', 'go(DISARMED): stops the buzzer and turns the LED off', 'Re-arms', 'Restarts the entry delay'], answer: 1, explain: 'Any state other than DISARMED goes back to DISARMED with the right PIN.' },
      { q: 'Why use millis() timers instead of delay(10000) for the entry delay?', options: ['delay() would stop the keypad being read, so you could never disarm in time', 'delay() is inaccurate', 'millis() uses less power', 'The Mega has no delay()'], answer: 0, explain: 'The loop must keep scanning the keypad while the countdown runs.' },
    ],
    challenges: ['Lock the keypad for 30 s after three wrong PINs.', 'Show the entry countdown in seconds on the LCD.', 'Add a door magnet switch on D3 that triggers the entry delay too.'],
    code: `#include <Keypad.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

const byte ROWS = 4, COLS = 4;
char keys[ROWS][COLS] = {{'1', '2', '3', 'A'}, {'4', '5', '6', 'B'},
                         {'7', '8', '9', 'C'}, {'*', '0', '#', 'D'}};
byte rowPins[ROWS] = {22, 24, 26, 28};
byte colPins[COLS] = {30, 32, 34, 36};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);
LiquidCrystal_I2C lcd(0x27, 16, 2);

const int PIR_PIN = 2, BUZZER = 8, LED = 13;
const String PIN_CODE = "{{pin}}";
const unsigned long EXIT_MS = 10000;
const unsigned long ENTRY_MS = {{entry}} * 1000UL;

enum State { DISARMED, EXIT_DELAY, ARMED, ENTRY_DELAY, ALARM };
const char* NAMES[] = {"DISARMED", "EXIT DELAY", "ARMED", "ENTER PIN NOW", "** ALARM **"};
State state = DISARMED;
unsigned long since = 0;
String entered = "";

void show() {
  lcd.clear();
  lcd.print(NAMES[state]);
  lcd.setCursor(0, 1);
  lcd.print("PIN: ");
  for (unsigned int i = 0; i < entered.length(); i++) lcd.print('*');
}

void go(State s) {
  state = s;
  since = millis();
  entered = "";
  digitalWrite(LED, s == DISARMED ? LOW : HIGH);
  noTone(BUZZER);
  Serial.println(NAMES[s]);
  show();
}

void setup() {
  pinMode(PIR_PIN, INPUT);
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
  lcd.init();
  lcd.backlight();
  go(DISARMED);
}

void loop() {
  char k = keypad.getKey();
  if (k == '#') {
    if (entered == PIN_CODE) go(state == DISARMED ? EXIT_DELAY : DISARMED);
    else { Serial.println("Wrong PIN"); entered = ""; show(); }
  } else if (k == '*') {
    entered = "";
    show();
  } else if (k) {
    entered += k;
    show();
  }

  unsigned long t = millis() - since;
  if (state == EXIT_DELAY && t > EXIT_MS) go(ARMED);
  if (state == ARMED && digitalRead(PIR_PIN) == HIGH) go(ENTRY_DELAY);
  if (state == ENTRY_DELAY) {
    if (t > ENTRY_MS) go(ALARM);
    else if ((t / 500) % 2 == 0) tone(BUZZER, 2000);   // warning chirps
    else noTone(BUZZER);
  }
  if (state == ALARM) tone(BUZZER, (t / 300) % 2 ? 1800 : 1200);  // siren
}`,
    params: { pin: { value: 1234, min: 1000, max: 9999 }, entry: { value: 10, min: 3, max: 60 } },
    async setup(io, b) {
      b.st = 0; b.entered = ''; b.since = performance.now(); b.state.keys.length = 0; b.tone = 0;
      io.line('pinMode(PIR_PIN'); await io.delay(80);
      io.line('lcd.init()'); b.lcd.backlight(true); await io.delay(80);
      await secGo(io, b, 0);
    },
    async loop(io, b, p) {
      const NAMES = SEC_NAMES;
      io.line('char k = keypad.getKey()');
      const k = b.state.keys.shift();
      if (k === '#') {
        io.line("if (k == '#')");
        if (b.entered === String(p.pin)) { io.line('if (entered == PIN_CODE)'); await secGo(io, b, b.st === 0 ? 1 : 0); }
        else { io.line('Serial.println("Wrong PIN")'); io.print('Wrong PIN'); b.entered = ''; secShow(b); }
      } else if (k === '*') { io.line("} else if (k == '*')"); b.entered = ''; secShow(b); }
      else if (k) { io.line('entered += k'); b.entered += k; secShow(b); }
      const t = performance.now() - b.since;
      io.line('unsigned long t = millis()');
      io.pin('D2', b.state.motion ? 'HIGH' : 'LOW', b.state.motion);
      if (b.st === 1 && t > 10000) { io.line('go(ARMED)'); await secGo(io, b, 2); }
      else if (b.st === 2 && b.state.motion) { io.line('go(ENTRY_DELAY)'); await secGo(io, b, 3); }
      else if (b.st === 3) {
        if (t > p.entry * 1000) { io.line('go(ALARM)'); await secGo(io, b, 4); }
        else if (Math.floor(t / 500) % 2 === 0) { io.line('tone(BUZZER, 2000)'); secTone(io, b, 2000); }
        else { io.line('else noTone(BUZZER)'); secTone(io, b, 0); }
      } else if (b.st === 4) { io.line('if (state == ALARM)'); secTone(io, b, Math.floor(t / 300) % 2 ? 1800 : 1200); }
      void NAMES;
      await io.delay(40);
    },
    reset(b, io) { b.bz.set(false); io?.noTone(); b.led.led.set(0); io?.board.setBuiltinLed(0); b.lcd.clear(); b.lcd.backlight(false); },
  },
];

// ---------------------------------------------------------------- security helpers
const SEC_NAMES = ['DISARMED', 'EXIT DELAY', 'ARMED', 'ENTER PIN NOW', '** ALARM **'];
function secShow(b) {
  b.lcd.clear();
  b.lcd.print(0, 0, SEC_NAMES[b.st]);
  b.lcd.print(1, 0, `PIN: ${'*'.repeat(b.entered.length)}`);
}
function secTone(io, b, f) {
  if (f === b.tone) return;
  b.tone = f;
  if (f) { io.tone(f); b.bz.set(true, f); io.pin('D8', `${f} Hz`, true); }
  else { io.noTone(); b.bz.set(false); io.pin('D8', 'LOW', false); }
}
async function secGo(io, b, s) {
  io.line('void go(State s)');
  b.st = s; b.since = performance.now(); b.entered = '';
  io.line('digitalWrite(LED');
  const on = s !== 0;
  b.led.on(on ? 1 : 0); io.board.setBuiltinLed(on ? 1 : 0); io.pin('D13', on ? 'HIGH' : 'LOW', on);
  io.line('noTone(BUZZER);'); secTone(io, b, 0);
  io.line('Serial.println(NAMES[s])'); io.print(SEC_NAMES[s]);
  secShow(b);
  await io.delay(60);
}

// ---------------------------------------------------------------- robot car scene
const ARENA = { x: 32, z: 22 };
const COURSES = {
  a: [[-14, 6, 7, 7], [8, -4, 8, 8], [20, 12, 7, 9], [-2, 15, 12, 5], [4, -16, 10, 5]],
  b: [[-10, -2, 6, 14], [6, 8, 14, 6], [18, -8, 8, 8], [24, 14, 6, 6]],
  c: [[2, 0, 10, 10]],
};
const START = { pos: v(-22, 0, -12), rotY: 0.9 };

/** 2D ray (o, d) against an axis-aligned box → hit distance or Infinity. */
function rayBox(ox, oz, dx, dz, b) {
  let t0 = -Infinity, t1 = Infinity;
  for (const [o, d, lo, hi] of [[ox, dx, b.x0, b.x1], [oz, dz, b.z0, b.z1]]) {
    if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return Infinity; continue; }
    let a = (lo - o) / d, c = (hi - o) / d;
    if (a > c) [a, c] = [c, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, c);
  }
  if (t1 < Math.max(t0, 0)) return Infinity;
  return Math.max(t0, 0);
}

function buildRobot(ctx) {
  const arena = new THREE.Group();
  const wood = mat(0xc9a46b, { rough: 0.7 });
  const walls = [];
  const wall = (x0, x1, z0, z1) => {
    arena.add(at(box(x1 - x0, 3.5, z1 - z0, wood), (x0 + x1) / 2, 1.75, (z0 + z1) / 2));
    walls.push({ x0, x1, z0, z1 });
  };
  const T = 1.2;
  wall(-ARENA.x - T, ARENA.x + T, -ARENA.z - T, -ARENA.z);
  wall(-ARENA.x - T, ARENA.x + T, ARENA.z, ARENA.z + T);
  wall(-ARENA.x - T, -ARENA.x, -ARENA.z, ARENA.z);
  wall(ARENA.x, ARENA.x + T, -ARENA.z, ARENA.z);
  ctx.addObject(arena);
  // obstacle blocks (a pool, re-placed per course)
  const colors = [0xe5412e, 0x3a6fd0, 0xf2c230, 0x3aa65a, 0x8a5cc6];
  const blocks = colors.map((c) => {
    const m = box(1, 7, 1, mat(c, { rough: 0.6 }));
    m.position.y = 3.5;
    ctx.addObject(m);
    return { m, x0: 0, x1: 0, z0: 0, z1: 0, on: false };
  });
  const blockAnchor = v(0, 7.5, 0);
  const setCourse = (key) => {
    const list = COURSES[key];
    blocks.forEach((b, i) => {
      const s = list[i];
      b.on = !!s;
      b.m.visible = b.on;
      if (!s) return;
      const [cx, cz, w, d] = s;
      b.m.scale.set(w, 1, d);
      b.m.position.set(cx, 3.5, cz);
      Object.assign(b, { x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
    });
    blockAnchor.set(list[0][0], 7.4, list[0][1]);
  };
  setCourse('a');
  const solids = () => [...walls, ...blocks.filter((b) => b.on)];

  // ---- the car, with the Uno on standoffs above the battery pack
  const car = makeRobotCar(START.pos, { rotY: START.rotY });
  ctx.addObject(car.group);
  const cg = car.group;
  const D = car.deckY;
  const holder = new THREE.Group();
  holder.position.set(0, D + 2.5, -0.3);
  holder.rotation.y = -Math.PI / 2; // USB to the rear, digital header on the car's left (+x)
  cg.add(holder);
  holder.add(ctx.board.group);
  const brass = mat(0xd6b46a, { metal: 0.6, rough: 0.35 });
  for (const [x, z] of [[-2.2, -3.0], [2.2, -3.0], [-2.2, 2.4], [2.2, 2.4]]) cg.add(at(cyl(0.18, 0.18, 0.95, brass, { seg: 8 }), x, D + 2.02, z));
  const drv = makeL298N(v(0, 0, 0), { rotY: Math.PI });
  drv.group.position.set(0, D, 9.2);
  cg.add(drv.group);
  // sensor bracket: a 2×4 female header block at the nose
  const bracket = new THREE.Group();
  bracket.add(at(box(1.4, 0.55, 0.62, mat(0x24252a, { rough: 0.6 })), 0, 0.275, 0));
  cg.add(at(bracket, 0, D, 11.82));
  const usHoles = [-0.381, -0.127, 0.127, 0.381].map((x) => v(x, D + 0.55, 11.95));
  const us = makeUltrasonic(usHoles);
  cg.add(us.group);
  const ping = makePing(v(0, D + 1.45, 12.75));
  cg.add(ping.group);
  cg.updateMatrixWorld(true);
  const W = (x, y, z) => cg.localToWorld(v(x, y, z));
  const b = ctx.board;
  const wires = [];
  const wire = (a, c, color, opts = {}) => { const w = ctx.wire(a, c, color, opts); wires.push(w); return w; };
  // control: Uno → L298N
  [['D5', 'ENA', 'orange'], ['D7', 'IN1', 'yellow'], ['D8', 'IN2', 'green'], ['D9', 'IN3', 'blue'], ['D11', 'IN4', 'purple'], ['D6', 'ENB', 'white']]
    .forEach(([p, q, c], i) => wire(b.pin(p), drv.pin(q), c, { lift: 1.0 + i * 0.15 }));
  // sensor: plugs in the back row of the bracket
  const usPin = (i) => W(-0.381 + i * 0.254, D + 0.55, 11.68);
  wire(b.pin('5V'), usPin(0), 'red', { lift: 2.4 });
  wire(b.pin('D3'), usPin(1), 'yellow', { lift: 2.6 });
  wire(b.pin('D2'), usPin(2), 'green', { lift: 2.8 });
  wire(b.pin('GND'), usPin(3), 'black', { lift: 3.0 });
  // power: battery → L298N → Uno VIN, common ground
  const batR = W(2.5, D + 0.15, 3.8), batB = W(2.5, D + 0.15, 4.4);
  const motorWires = [
    wire(batR, drv.pin('12V'), 'red', { lift: 1.0 }),
    wire(batB, drv.pin('GND'), 'black', { lift: 1.2 }),
  ];
  wire(drv.pin('12V'), b.pin('VIN'), 'red', { lift: 2.0 });
  wire(drv.pin('GND'), b.pin('GND_2'), 'black', { lift: 1.8 });
  // motors: leads come up through the plate to OUT1–OUT4
  const PY = car.wheelRadius + 0.95;
  motorWires.push(
    wire(W(1.29 - 0.3, PY, 6.6), drv.pin('OUT1'), 'red', { lift: 1.0 }),
    wire(W(1.29 + 0.3, PY, 6.6), drv.pin('OUT2'), 'black', { lift: 1.2 }),
    wire(W(-1.29 + 0.3, PY, 6.6), drv.pin('OUT3'), 'red', { lift: 1.0 }),
    wire(W(-1.29 - 0.3, PY, 6.6), drv.pin('OUT4'), 'black', { lift: 1.2 }),
  );
  wires.forEach((w) => cg.attach(w.group));

  // ---- live anchors that ride along with the car
  const L = { uno: v(0, D + 3.6, -0.3), drv: v(0, D + 3.2, 9.2), us: v(0, D + 2.6, 12.0), bat: v(3.4, D + 1.6, 0) };
  const anchors = Object.fromEntries(Object.keys(L).map((k) => [k, v()]));
  const sync = () => { for (const k in L) anchors[k].copy(cg.localToWorld(L[k].clone())); };
  sync();
  for (const k in anchors) ctx.anchor(k, live(anchors[k]));
  ctx.anchor('blocks', live(blockAnchor));

  // ---- physics: integrate, but don't drive through walls or blocks
  const FOOT = [];
  for (const z of [-4.2, 0, 4.2, 8.4, 12.9]) for (const x of [-6.3, 6.3]) FOOT.push(v(x, 0, z));
  FOOT.push(v(0, 0, -4.2), v(-3, 0, 12.9), v(0, 0, 12.9), v(3, 0, 12.9));
  const hit = () => {
    const ss = solids();
    for (const p of FOOT) {
      const w = cg.localToWorld(p.clone());
      if (Math.abs(w.x) > ARENA.x || Math.abs(w.z) > ARENA.z) return true;
      if (ss.some((s) => w.x > s.x0 && w.x < s.x1 && w.z > s.z0 && w.z < s.z1)) return true;
    }
    // block corners inside the car's footprint
    for (const s of blocks.filter((q) => q.on)) {
      for (const [x, z] of [[s.x0, s.z0], [s.x1, s.z0], [s.x0, s.z1], [s.x1, s.z1]]) {
        const l = cg.worldToLocal(v(x, 0, z));
        if (Math.abs(l.x) < 6.3 && l.z > -4.2 && l.z < 12.9) return true;
      }
    }
    return false;
  };
  ctx.onTick((dt) => {
    const p0 = cg.position.clone(), r0 = cg.rotation.y;
    car.tick(dt);
    if (hit()) { cg.position.copy(p0); cg.rotation.y = r0; cg.updateMatrixWorld(true); }
    ping.tick(dt);
    us.tick?.(dt);
    sync();
  });

  /** What the HC-SR04 would report: nearest surface in a ±7.5° cone, in cm. */
  const distance = () => {
    const o = cg.localToWorld(v(0, D + 1.45, 12.95));
    const h = cg.rotation.y;
    const ss = solids();
    let best = Infinity;
    for (const da of [-7.5, -3.75, 0, 3.75, 7.5]) {
      const a = h + (da * Math.PI) / 180;
      for (const s of ss) best = Math.min(best, rayBox(o.x, o.z, Math.sin(a), Math.cos(a), s));
    }
    return clamp(best + (Math.random() - 0.5) * 0.6, 2, 400);
  };
  const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'distance cm', color: '#2aa7a1', min: 0, max: 150 }, { name: 'STOP_CM', color: '#ef8a2b', min: 0, max: 150 }] });
  const state = { course: 'a' };
  ctx.interact(car, {
    name: 'Robot car', hint: 'Pick a course or put the car back',
    controls: [
      { type: 'choice', label: 'Course', options: [['a', 'Five blocks'], ['b', 'Corridors'], ['c', 'Open floor']], get: () => state.course, set: (k) => { state.course = k; setCourse(k); car.reset(); sync(); } },
      { type: 'button', label: 'Put it back at the start', press: () => { car.reset(); sync(); } },
    ],
    note: () => `Heading ${Math.round(((cg.rotation.y * 180) / Math.PI) % 360)}°, front sensor ≈ ${Math.round(distance())} cm`,
  });
  return {
    car, plot, wires,
    distance,
    ping: () => ping.fire(Math.min(distance(), 60)),
    wheelsLive: (on) => motorWires.forEach((w) => (w.live = on)),
    reset() { car.reset(); car.stop(); motorWires.forEach((w) => (w.live = false)); plot.reset(); sync(); this.st = 'DRIVE'; },
  };
}

/** The plant's OLED face — mirrors drawFace() in the sketch. */
function drawFace(oled, pct, pumping, startPct) {
  const curve = mapInt(pct, 0, 100, -6, 6);
  oled.draw((c) => {
    const px = (x, y) => c.fillRect(Math.round(x), Math.round(y), 1, 1);
    for (let a = 0; a < 360; a += 1.2) px(32 + 26 * Math.cos((a * Math.PI) / 180), 32 + 26 * Math.sin((a * Math.PI) / 180));
    for (const ex of [23, 41]) { c.beginPath(); c.arc(ex + 0.5, 24.5, 3.4, 0, Math.PI * 2); c.fill(); }
    for (let x = -10; x <= 10; x++) px(32 + x, 40 + curve - Math.trunc((curve * x * x) / 100));
  });
  oled.text([`${pct}%`], { size: 2, x: 68, y: 12, clear: false });
  oled.text([pumping ? 'WATERING' : pct < startPct ? 'THIRSTY' : 'HAPPY'], { x: 68, y: 40, clear: false });
}

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['plant', 'Capacitive soil probe', 'Analog moisture sensor that doesn’t corrode; lower voltage = wetter.', 'proj-smart-plant'],
  ['motor', 'Mini water pump', '3–6 V submersible pump, switched by a relay from its own battery.', 'proj-smart-plant'],
  ['bolt', 'Battery pack (4×AA)', 'A separate 6 V supply for pumps and motors, sharing ground with the board.', 'proj-robot-car'],
  ['car', '2WD robot chassis', 'Acrylic deck, two TT gear motors and a ball caster — steer by wheel speed.', 'proj-robot-car'],
  ['globe', 'ESP32 web dashboard', 'WebServer routes that read sensors and switch outputs from a phone.', 'proj-smart-home'],
];
