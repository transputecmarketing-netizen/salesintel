// Track — Planet & Environment: ESP32 capstones that measure and protect the
// environment. Wind and solar energy, air and water quality, a wildfire alarm
// over LoRa and a smart irrigation controller. The simulation follows each
// sketch step by step; every reading is derived from the 3D scene (wind on the
// anemometer, sun angle on the LDRs, the sample in the beaker…), with real
// sensor maths and units.
import * as THREE from 'three';
import { makeLED, makeResistor, makeBuzzer } from '../scene/components.js';
import { makeRelay } from '../scene/modules.js';
import { makeESP32 } from '../scene/boards/esp32.js';
import {
  makeWindTurbine, makeAnemometer, makeSun, makeSolarPanel, makeSolarTracker, makePowerBox, makeINA219, makeVoltageSensor, makeDumpLoad,
  makePMS5003, makeSGP30, makeWaterLab, makeWaterTank, makeRainSensor, makeFieldBed, makeRelayBoard, makeForestPatch, makeWildfirePost, makeLoRa,
} from '../scene/modules/planet.js';
import { v, clamp } from './helpers.js';

// ---------------------------------------------------------------- shared helpers
const IP = '192.168.1.57';
const now = () => performance.now();
/** Callout anchor that follows a moving Vector3 (ctx.anchor clones what it is given). */
const follow = (vec) => ({ clone: () => vec });
const K = (part, kind, label) => Object.assign(part, { kind, label });
const gain33 = (ohms) => clamp(((1.3 / ohms) * 1000) / 4, 0.12, 1);
const fmt = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '--');
const noise = (a) => (Math.random() - 0.5) * 2 * a;

/** Resistor + LED from an ESP32 pin to the back GND rail (3.3 V logic). */
function eLed(ctx, bb, { pin, col, color = 'red', ohms = 330, wire = 'orange' }) {
  ctx.step(`${ohms} Ω resistor and ${color} LED for ${pin}`);
  const res = ctx.add(K(makeResistor(bb.hole(col, 'd'), bb.hole(col + 4, 'd'), ohms), 'resistor', `${ohms} Ω resistor`));
  const led = ctx.add(K(makeLED(color, bb.hole(col + 4, 'c'), bb.hole(col + 5, 'c')), 'led', `${color[0].toUpperCase()}${color.slice(1)} LED`));
  const sig = ctx.wire(ctx.board.pin(pin), bb.hole(col, 'a'), wire, { signal: pin, lift: 1.4 });
  ctx.wire(bb.hole(col + 5, 'a'), bb.hole(col + 5, 'top-'), 'black', { signal: 'GND', dir: -1, lift: 0.4 });
  const g = gain33(ohms);
  return { res, led, sig, on: (x = 1) => led.set(x ? g : 0) };
}

/** Breadboard in front of the ESP32 with 3V3 / GND on its back rails. */
function benchRails(ctx, z = 5.6) {
  ctx.step('Breadboard in front of the ESP32: its back rails carry 3.3 V and GND');
  const bb = ctx.breadboard(0, z);
  ctx.step('3V3 to the + rail, GND to the – rail');
  ctx.wire(ctx.board.pin('3V3'), bb.hole(4, 'top+'), 'red', { signal: '3V3', lift: 1.0 });
  ctx.wire(ctx.board.pin('GND_2'), bb.hole(6, 'top-'), 'black', { signal: 'GND', dir: -1, lift: 0.8 });
  return bb;
}

async function joinWifi(io, ssid = 'your-wifi') {
  io.line('WiFi.begin');
  io.print(`Connecting to ${ssid}…`);
  await io.delay(700);
  io.print(`Connected, IP ${IP}`);
}

// ================================================================ lessons
export const projectsPlanet = [
  // ------------------------------------------------------------------ 1 wind
  {
    id: 'eco-wind-turbine', title: 'Wind power monitor', icon: 'gear',
    thumb: () => makeWindTurbine(v(0, 0, 0), { height: 9 }).group,
    view: { center: [1.5, 4.5, -5], size: 40, az: -6 },
    build(ctx) {
      const b = ctx.board;
      const bb = benchRails(ctx);
      ctx.step('Stand the micro wind turbine behind the bench, rotor facing the wind');
      const tur = ctx.add(makeWindTurbine(v(-3, 0, -15), { height: 11 }));
      ctx.step('Mount the cup anemometer on its own mast');
      const an = ctx.add(makeAnemometer(v(-11, 0, -7)));
      ctx.step('Anemometer reed switch: SIG to GPIO27 (internal pull-up), GND to the – rail');
      const wAn = ctx.wire(an.pin('SIG'), b.pin('GPIO27'), 'yellow', { signal: 'GPIO27', lift: 2.2, dir: -1 });
      ctx.wire(an.pin('GND'), bb.hole(1, 'top-'), 'black', { signal: 'GND', lift: 2.6, dir: -1 });
      ctx.step('Brake relay next to the turbine');
      const relay = ctx.add(K(makeRelay(v(-11, 0, -13.5)), 'module', 'Relay module (high-level trigger)'));
      ctx.wire(b.pin('GPIO25'), relay.pin('IN'), 'orange', { signal: 'GPIO25', lift: 2.4 });
      ctx.wire(b.pin('VIN'), relay.pin('VCC'), 'red', { signal: '5V', lift: 2.8 });
      ctx.wire(b.pin('GND'), relay.pin('GND'), 'black', { signal: 'GND', lift: 3.0, dir: -1 });
      ctx.step('Dump load: the brake resistor the relay switches across the generator');
      const dump = ctx.add(makeDumpLoad(v(-15.5, 0, -9.5)));
      ctx.step('200 kΩ / 10 kΩ divider: turbine voltage into GPIO34');
      const div = ctx.add(makeVoltageSensor(v(6, 0, -9), { top: '200k', bottom: '10k', range: '0-69V' }));
      const wDiv = ctx.wire(div.pin('S'), b.pin('GPIO34'), 'green', { signal: 'GPIO34', lift: 2.0, dir: -1 });
      ctx.wire(div.pin('-'), bb.hole(27, 'top-'), 'black', { signal: 'GND', lift: 3.2, dir: -1 });
      ctx.step('INA219 current sensor on the I²C bus');
      const ina = ctx.add(makeINA219(v(7, 0, -2.5)));
      ctx.wire(ina.pin('VCC'), bb.hole(28, 'top+'), 'red', { lift: 1.6 });
      ctx.wire(ina.pin('GND'), bb.hole(26, 'top-'), 'black', { lift: 1.4, dir: -1 });
      const wSda = ctx.wire(b.pin('GPIO21'), ina.pin('SDA'), 'blue', { signal: 'GPIO21', lift: 1.5 });
      ctx.wire(b.pin('GPIO22'), ina.pin('SCL'), 'yellow', { signal: 'GPIO22', lift: 1.8 });
      ctx.step('12 V battery and charge controller');
      const pwr = ctx.add(makePowerBox(v(12.5, 0, -13)));
      ctx.step('Power wiring: turbine + → relay COM → divider → INA219 VIN+; VIN- → controller IN+');
      const p1 = ctx.wire(tur.pin('OUT+'), relay.pin('COM'), 'red', { lift: 1.6 });
      const p2 = ctx.wire(relay.pin('COM'), div.pin('IN+'), 'red', { lift: 2.6 });
      const p3 = ctx.wire(div.pin('IN+'), ina.pin('VIN+'), 'red', { lift: 1.8 });
      const p4 = ctx.wire(ina.pin('VIN-'), pwr.pin('IN+'), 'red', { lift: 2.4 });
      ctx.step('Return path: turbine – → divider IN- → controller IN-; relay NO → dump load → turbine –');
      const p5 = ctx.wire(tur.pin('OUT-'), div.pin('IN-'), 'black', { lift: 2.0, dir: -1 });
      const p6 = ctx.wire(div.pin('IN-'), pwr.pin('IN-'), 'black', { lift: 2.2, dir: -1 });
      const p7 = ctx.wire(relay.pin('NO'), dump.pin('A'), 'red', { lift: 1.4 });
      const p8 = ctx.wire(dump.pin('B'), tur.pin('OUT-'), 'black', { lift: 2.6, dir: -1 });
      const charge = [p1, p2, p3, p4, p5, p6], brake = [p7, p8];

      const st = { wind: 7, gust: true, t: 0, simT: 0, w: 7, soc: 0.55, e: { i: 0, vt: 0, bus: 0 }, running: false };
      const elec = () => {
        const rpm = tur.rpm, voc = 0.0192 * rpm;
        const vch = 12.2 + st.soc * 0.9 + 0.4; // battery + controller drop
        if (tur.braked) return { i: 0, vt: voc * (4 / 7), bus: 0, brakeA: voc / 7 };
        const aero = 0.5 * 1.225 * 0.196 * st.w ** 3 * 0.3; // ½ρAv³·Cp
        const i = clamp(Math.min((voc - vch) / 3.0, aero / vch, 2.5), 0, 2.5);
        return { i, vt: i > 0 ? vch + i * 0.1 : voc, bus: i > 0 ? vch : voc, brakeA: 0 };
      };
      ctx.onTick((dt) => {
        st.t += dt;
        if (st.running) st.simT += dt;
        const g = st.gust ? 1 + 0.22 * Math.sin(st.t * 0.6) + 0.13 * Math.sin(st.t * 1.9 + 1) + 0.08 * Math.sin(st.t * 4.7) : 1;
        st.w = Math.max(0, st.wind * g);
        an.setWind(st.w);
        tur.setWind(st.w);
        st.e = elec();
        st.soc = clamp(st.soc + (st.e.i * st.e.bus * dt * 60) / (12 * 7 * 3600), 0, 1); // battery time ×60
        pwr.setSoc(st.soc);
        pwr.setCharging(st.e.i > 0.02);
        dump.setHeat(clamp(st.e.brakeA / 3, 0, 1));
        charge.forEach((w) => (w.live = st.running && st.e.i > 0.02));
        brake.forEach((w) => (w.live = st.running && st.e.brakeA > 0.05));
      });
      ctx.interact(an, {
        name: 'Wind', hint: 'Set the wind speed and gusts',
        controls: [
          { type: 'range', label: 'Mean wind', min: 0, max: 22, step: 0.5, get: () => st.wind, set: (x) => (st.wind = x), format: (x) => `${Number(x).toFixed(1)} m/s` },
          { type: 'toggle', label: 'Gusty', get: () => st.gust, set: (x) => (st.gust = x) },
        ],
        note: () => `Now ${st.w.toFixed(1)} m/s → ${an.hz.toFixed(1)} pulses/s`,
      });
      ctx.interact(tur, { name: 'Micro wind turbine', hint: '0.5 m rotor, 12 V generator, ≈ 30 W at 10 m/s', note: () => `${tur.rpm.toFixed(0)} rpm · ${st.e.vt.toFixed(1)} V · ${tur.braked ? 'BRAKED' : `${(st.e.i * st.e.bus).toFixed(1)} W`}` });
      ctx.interact(pwr, {
        name: 'Battery + charge controller', hint: 'Change the battery charge',
        controls: [{ type: 'range', label: 'State of charge', min: 0, max: 100, step: 1, get: () => Math.round(st.soc * 100), set: (x) => (st.soc = x / 100), format: (x) => `${x} %` }],
      });
      ctx.interact(relay, { name: 'Brake relay', hint: 'GPIO25 HIGH shorts the generator into the 4 Ω dump load' });
      ctx.interact(dump, { name: 'Dump load', hint: 'Electrical brake: the generator’s energy becomes heat here' });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'wind m/s', color: '#3a6fd0', min: 0, max: 22 }, { name: 'turbine V', color: '#ef8a2b', min: 0, max: 60 }, { name: 'watts', color: '#3aa65a', min: 0, max: 40 }] });
      ctx.anchor('tur', tur.anchor);
      ctx.anchor('an', an.anchor);
      ctx.anchor('ina', ina.anchor);
      ctx.anchor('relay', relay.anchor);
      ctx.anchor('pwr', pwr.anchor);
      ctx.anchor('div', wDiv.mid);
      ctx.anchor('an-w', wAn.mid);
      ctx.anchor('sda', wSda.mid);
      return { st, tur, an, relay, ina, div, pwr, plot };
    },
    callouts: [
      { anchor: 'an', x: 0.04, y: 0.17, icon: 'wave', title: 'Anemometer · GPIO27', text: 'One reed-switch pulse per turn: 0.667 m/s per pulse per second. Click it to change the wind.' },
      { anchor: 'ina', x: 0.7, y: 0.17, icon: 'bolt', title: 'INA219 · I²C', text: 'Measures the charging current through a 0.1 Ω shunt and the bus voltage.' },
      { anchor: 'relay', x: 0.04, y: 0.68, icon: 'transistor', title: 'Cut-out brake', text: 'Turbine power grows with v³. Above CUT_OUT for 3 s this relay shorts the generator into the dump load.' },
      { anchor: 'div', x: 0.36, y: 0.74, icon: 'resistor', title: '÷21 divider · GPIO34', text: 'Open-circuit voltage can pass 40 V: the divider keeps the ADC under 3.3 V.' },
    ],
    overview: {
      heading: 'Wind power monitor',
      text: 'Count anemometer pulses with an interrupt (<b>Interrupts</b>), read volts and amps over I²C (<b>Talk I²C</b>) and switch a relay (<b>Relays</b>) to brake the turbine in a storm. The ESP32 logs wind, power and energy every few seconds.',
      features: [['wave', 'Interrupt pulse counting with debounce and a critical section'], ['bolt', 'Adafruit_INA219: bus voltage, current, power'], ['timer', 'Cut-in / cut-out state machine with hysteresis']],
    },
    pinout: [
      ['GPIO27', 'Anemometer SIG', 'INPUT_PULLUP, reed switch to GND'],
      ['GPIO34', 'Divider S (200k/10k)', 'Turbine voltage ÷ 21, ADC1'],
      ['GPIO21 / GPIO22', 'INA219 SDA / SCL', 'I²C address 0x40'],
      ['GPIO25', 'Relay IN', 'HIGH = brake on'],
      ['VIN (5 V)', 'Relay VCC', 'Use a 3.3 V-compatible (high-level trigger) module'],
      ['3V3 / GND rails', 'INA219, anemometer, divider –', 'Divider – also joins turbine – to GND'],
      ['Turbine + → COM → divider IN+ → INA VIN+', 'INA VIN- → controller IN+', 'High-side current sense'],
      ['Turbine – → divider IN- → controller IN-', 'Relay NO → dump load → turbine –', 'Brake path'],
    ],
    example: {
      text: 'Small off-grid turbines on boats, farms and mountain huts use exactly this logic: a charge controller, an anemometer and an electrical brake that stops the rotor before a storm can over-speed it.',
      points: ['Push the mean wind to 16 m/s and watch the cut-out engage after 3 seconds', 'Note how little power there is below 4 m/s: P ∝ v³, so half the wind is one eighth of the power', 'Set the battery to 100 % and see the voltage rise as the turbine runs unloaded'],
    },
    specs: [
      ['Turbine', 'Micro HAWT, 0.5 m rotor, 12 V DC, ≈ 30 W at 10 m/s'],
      ['Anemometer', 'Reed switch, 2.4 km/h (0.667 m/s) per Hz'],
      ['Current sensor', 'INA219, 0.1 Ω shunt, ±3.2 A, 0–26 V bus'],
      ['Divider', '200 kΩ / 10 kΩ → 0–69 V on a 3.3 V ADC'],
      ['Brake', 'Relay + 4 Ω 100 W dump load'],
      ['Libraries', 'Wire, Adafruit_INA219'],
      ['Simulation', 'Battery charge runs 60× faster than real time'],
    ],
    quiz: [
      { q: 'The wind doubles from 4 m/s to 8 m/s. Roughly how much more power is in the wind?', options: ['2×', '4×', '8×', '16×'], answer: 2, explain: 'Wind power is ½ρAv³, so doubling v gives 2³ = 8 times the power.' },
      { q: 'Why count pulses in an interrupt and read the count inside a critical section?', options: ['To make the LED blink', 'So no pulse is missed and the count is not changed half-way through reading it', 'Interrupts are faster than Wi-Fi', 'The INA219 needs it'], answer: 1, explain: 'The ISR can fire at any moment; portENTER_CRITICAL stops it from updating pulses while loop() copies and clears it.' },
      { q: 'Why are there two thresholds, CUT_OUT and RESTART?', options: ['Hysteresis: the brake does not chatter on and off in gusty wind', 'One is for each blade', 'The relay needs two signals', 'To save energy'], answer: 0, explain: 'Brake above CUT_OUT for 3 s, release only after 10 s below CUT_OUT − 3.' },
      { q: 'Why does the turbine voltage go through a 200 k / 10 k divider?', options: ['To increase the current', 'Its open-circuit voltage can exceed 40 V; ÷21 keeps the ADC pin below 3.3 V', 'The INA219 needs it', 'To filter noise only'], answer: 1, explain: 'An unloaded generator spins up and its voltage rises with rpm; the divider scales it into the ADC range.' },
    ],
    challenges: ['Print the daily energy in Wh at midnight and reset the counter.', 'Average the wind over 10 minutes and log the maximum gust, like a weather station.', 'Serve the live values as JSON on <code>/api</code> and plot them in a browser.'],
    code: `// Wind turbine monitor: wind speed, power, cut-out brake and an energy log.
#include <Wire.h>
#include <Adafruit_INA219.h>

const int ANEMO_PIN = 27;           // reed switch to GND, one pulse per turn
const int DIVIDER_PIN = 34;         // 200k / 10k divider on the turbine +
const int BRAKE_PIN = 25;           // relay: shorts the turbine into the dump load
const float DIVIDER_RATIO = 21.0;   // (200k + 10k) / 10k
const float MS_PER_HZ = 0.667;      // 2.4 km/h per pulse per second
const float CUT_IN = {{cutin}};       // m/s: below this there is no useful power
const float CUT_OUT = {{cutout}};     // m/s: brake above this for 3 s...
const float RESTART = CUT_OUT - 3;  // ...and release after 10 s below this
const unsigned long LOG_MS = {{log}} * 1000UL;

Adafruit_INA219 ina219;             // 0x40, 0.1 ohm shunt
volatile unsigned long pulses = 0;
volatile unsigned long lastPulseUs = 0;
portMUX_TYPE mux = portMUX_INITIALIZER_UNLOCKED;

enum State { IDLE, GENERATING, BRAKED };
const char* NAMES[] = {"IDLE", "GENERATING", "BRAKED"};
State state = IDLE;
int overSec = 0, calmSec = 0;
float energyWh = 0;
unsigned long lastSample = 0, lastLog = 0;

void IRAM_ATTR onPulse() {
  unsigned long t = micros();
  if (t - lastPulseUs < 2000) return;    // debounce the reed switch
  lastPulseUs = t;
  portENTER_CRITICAL_ISR(&mux);
  pulses++;
  portEXIT_CRITICAL_ISR(&mux);
}

void setBrake(bool on) {
  digitalWrite(BRAKE_PIN, on ? HIGH : LOW);
  state = on ? BRAKED : IDLE;
  Serial.println(on ? "CUT-OUT: brake ON" : "Brake released");
}

void setup() {
  Serial.begin(115200);
  pinMode(ANEMO_PIN, INPUT_PULLUP);
  pinMode(BRAKE_PIN, OUTPUT);
  digitalWrite(BRAKE_PIN, LOW);
  attachInterrupt(digitalPinToInterrupt(ANEMO_PIN), onPulse, FALLING);
  analogSetPinAttenuation(DIVIDER_PIN, ADC_11db);   // 0 to ~3.1 V
  if (!ina219.begin()) Serial.println("INA219 not found");
  lastSample = millis();
}

void loop() {
  unsigned long now = millis();
  if (now - lastSample < 1000) return;   // one sample per second
  float dt = (now - lastSample) / 1000.0;
  lastSample = now;

  portENTER_CRITICAL(&mux);
  unsigned long n = pulses;
  pulses = 0;
  portEXIT_CRITICAL(&mux);
  float wind = n / dt * MS_PER_HZ;

  float turbineV = analogReadMilliVolts(DIVIDER_PIN) / 1000.0 * DIVIDER_RATIO;
  float amps = ina219.getCurrent_mA() / 1000.0;
  float watts = max(0.0f, ina219.getBusVoltage_V() * amps);

  if (state != BRAKED) {
    overSec = wind > CUT_OUT ? overSec + 1 : 0;
    if (overSec >= 3) setBrake(true);
    else state = wind >= CUT_IN ? GENERATING : IDLE;
  } else {
    calmSec = wind < RESTART ? calmSec + 1 : 0;
    if (calmSec >= 10) { calmSec = 0; overSec = 0; setBrake(false); }
  }
  if (state == GENERATING) energyWh += watts * dt / 3600.0;

  // Serial Plotter: label:value pairs
  Serial.printf("wind:%.1f turbineV:%.1f watts:%.1f\\n", wind, turbineV, watts);
  if (now - lastLog >= LOG_MS) {
    lastLog = now;
    Serial.printf("LOG %lus %s %.1f m/s %.2f A  energy %.3f Wh\\n",
                  now / 1000, NAMES[state], wind, amps, energyWh);
  }
}`,
    params: { cutin: { value: 3, min: 1, max: 6 }, cutout: { value: 14, min: 8, max: 25 }, log: { value: 10, min: 2, max: 60 } },
    async setup(io, b) {
      Object.assign(b, { state: 'IDLE', overSec: 0, calmSec: 0, wh: 0, lastLog: now(), t0: now(), lastSim: 0, lastCount: Math.floor(b.an.pulses) });
      b.st.simT = 0;
      b.st.running = true;
      b.plot.reset();
      io.line('pinMode(ANEMO_PIN'); await io.delay(60);
      io.line('digitalWrite(BRAKE_PIN, LOW)'); io.pin('GPIO25', 'LOW', false); await io.delay(60);
      io.line('attachInterrupt'); await io.delay(60);
      io.line('ina219.begin()'); io.pin('GPIO21', 'SDA', true); await io.delay(120);
    },
    async loop(io, b, p) {
      io.line('if (now - lastSample < 1000) return;');
      // sample once per second of simulated time (the scene's clock), so pulses and dt always match
      while (b.st.simT - b.lastSim < 1) await io.delay(40);
      const t = now(), dt = b.st.simT - b.lastSim;
      b.lastSim = b.st.simT;
      io.line('unsigned long n = pulses;');
      const tot = Math.floor(b.an.pulses), n = tot - b.lastCount;
      b.lastCount = tot;
      io.pin('GPIO27', `${n} pulses`, n > 0);
      io.line('float wind = n / dt');
      const wind = (n / dt) * 0.667;
      io.line('float turbineV = analogRead');
      const e = b.st.e;
      const turbineV = Math.max(0, e.vt + noise(0.08));
      io.pin('GPIO34', `${((turbineV / 21) * 1000).toFixed(0)} mV`, true);
      io.line('float amps = ina219');
      const amps = Math.max(0, e.i + noise(0.003));
      let watts = Math.max(0, (e.i > 0 ? e.bus : 0) * amps);
      io.pin('GPIO21', `${amps.toFixed(2)} A`, true);
      if (b.state !== 'BRAKED') {
        io.line('overSec = wind > CUT_OUT');
        b.overSec = wind > p.cutout ? b.overSec + 1 : 0;
        if (b.overSec >= 3) {
          io.line('if (overSec >= 3) setBrake(true)');
          b.relay.set(true); b.tur.setBrake(true); io.pin('GPIO25', 'HIGH', true);
          b.state = 'BRAKED'; io.print('CUT-OUT: brake ON');
        } else { io.line('else state = wind >= CUT_IN'); b.state = wind >= p.cutin ? 'GENERATING' : 'IDLE'; }
      } else {
        io.line('calmSec = wind < RESTART');
        b.calmSec = wind < p.cutout - 3 ? b.calmSec + 1 : 0;
        if (b.calmSec >= 10) {
          b.calmSec = 0; b.overSec = 0;
          io.line('setBrake(false); }');
          b.relay.set(false); b.tur.setBrake(false); io.pin('GPIO25', 'LOW', false);
          b.state = 'IDLE'; io.print('Brake released');
        }
      }
      if (b.state === 'GENERATING') { io.line('energyWh += watts'); b.wh += (watts * dt) / 3600; }
      if (b.state === 'BRAKED') watts = 0;
      io.line('Serial.printf("wind:');
      io.print(`wind:${wind.toFixed(1)} turbineV:${turbineV.toFixed(1)} watts:${watts.toFixed(1)}`);
      b.plot.push(wind, turbineV, watts);
      if (t - b.lastLog >= p.log * 1000) {
        b.lastLog = t;
        io.line('Serial.printf("LOG');
        io.print(`LOG ${Math.round((t - b.t0) / 1000)}s ${b.state} ${wind.toFixed(1)} m/s ${amps.toFixed(2)} A  energy ${b.wh.toFixed(3)} Wh`);
      }
    },
    reset(b) {
      b.st.running = false;
      b.relay.set(false); b.tur.setBrake(false); b.plot.reset();
    },
  },

  // ------------------------------------------------------------------ 2 solar
  {
    id: 'eco-solar-tracker', title: 'Solar sun tracker', icon: 'sun',
    thumb: () => makeSolarTracker(v(0, 0, 0)).group,
    view: { center: [-6, 5, -2], size: 33, az: -4 },
    build(ctx) {
      const b = ctx.board;
      const bb = benchRails(ctx);
      const TR = v(-10, 0, -6);
      ctx.step('Dual-axis tracker: pan servo in the base, tilt servo on the yoke, 4 LDRs in a cross');
      const tr = ctx.add(makeSolarTracker(TR, { rotY: 0 }));
      tr.snap(90, 30);
      ctx.step('A fixed panel for comparison, tilted 35° towards the south (+z)');
      const fixed = ctx.add(makeSolarPanel(v(-19, 0, 3), { tilt: 35 }));
      ctx.step('The sun: drag it across the sky');
      const sun = ctx.add(makeSun(tr.center, { radius: 12, az: -40, el: 35 }));
      ctx.step('LDR dividers to the ADC1 pins: TL 32, TR 33, BL 34, BR 35');
      const wTL = ctx.wire(tr.pin('TL'), b.pin('GPIO32'), 'green', { signal: 'GPIO32', lift: 2.0 });
      ctx.wire(tr.pin('TR'), b.pin('GPIO33'), 'green', { signal: 'GPIO33', lift: 2.2 });
      ctx.wire(tr.pin('BL'), b.pin('GPIO34'), 'blue', { signal: 'GPIO34', lift: 2.4 });
      ctx.wire(tr.pin('BR'), b.pin('GPIO35'), 'blue', { signal: 'GPIO35', lift: 2.6 });
      ctx.step('Tracker power: 3V3 for the LDRs, VIN (5 V) for the servos, common GND');
      ctx.wire(tr.pin('3V3'), bb.hole(2, 'top+'), 'red', { lift: 2.4 });
      ctx.wire(tr.pin('GND'), bb.hole(3, 'top-'), 'black', { lift: 2.2, dir: -1 });
      ctx.wire(tr.pin('5V'), b.pin('VIN'), 'red', { signal: '5V', lift: 2.8 });
      ctx.step('Servo signals: pan on GPIO18, tilt on GPIO19');
      const wPan = ctx.wire(b.pin('GPIO18'), tr.pin('PAN'), 'orange', { signal: 'GPIO18', lift: 3.2 });
      ctx.wire(b.pin('GPIO19'), tr.pin('TILT'), 'orange', { signal: 'GPIO19', lift: 3.4 });
      ctx.step('Load + divider for the tracked panel: 36 Ω load, 10k/10k divider into VP (GPIO36)');
      const R = (a, c, ohms, label) => ctx.add(K(makeResistor(bb.hole(a, 'g'), bb.hole(c, 'g'), ohms), 'resistor', label));
      R(10, 14, 36, '36 Ω 1 W load');
      R(14, 18, 10000, '10 kΩ resistor');
      R(18, 22, 10000, '10 kΩ resistor');
      ctx.wire(tr.pin('PV+'), bb.hole(10, 'j'), 'red', { lift: 2.8 });
      ctx.wire(tr.pin('PV-'), bb.hole(22, 'j'), 'black', { lift: 3.0, dir: -1 });
      ctx.wire(bb.hole(14, 'h'), bb.hole(14, 'j'), 'white', { lift: 0.3 });
      const wVp = ctx.wire(bb.hole(18, 'j'), b.pin('VP'), 'purple', { signal: 'GPIO36', lift: 2.0 });
      ctx.step('Same for the fixed panel on the other side of the channel, into VN (GPIO39)');
      const R2 = (a, c, ohms, label) => ctx.add(K(makeResistor(bb.hole(a, 'd'), bb.hole(c, 'd'), ohms), 'resistor', label));
      R2(10, 14, 36, '36 Ω 1 W load');
      R2(14, 18, 10000, '10 kΩ resistor');
      R2(18, 22, 10000, '10 kΩ resistor');
      ctx.wire(fixed.pin('+'), bb.hole(10, 'a'), 'red', { lift: 2.6 });
      ctx.wire(fixed.pin('-'), bb.hole(22, 'a'), 'black', { lift: 2.4, dir: -1 });
      ctx.wire(bb.hole(14, 'a'), bb.hole(14, 'c'), 'white', { lift: 0.3 });
      ctx.wire(bb.hole(18, 'a'), b.pin('VN'), 'purple', { signal: 'GPIO39', lift: 2.2 });
      ctx.step('Tie both panels’ minus rows to the – rail');
      ctx.wire(bb.hole(22, 'b'), bb.hole(23, 'top-'), 'black', { lift: 0.4, dir: -1 });
      ctx.wire(bb.hole(22, 'i'), bb.hole(24, 'top-'), 'black', { lift: 1.2, dir: -1 });

      const st = { auto: true, day: 0.15, az: -40, el: 35, sky: 1, ldr: [0, 0, 0, 0], pT: 0, pF: 0, sunA: sun.anchor.clone() };
      const setSun = () => { sun.setSky(st.az, st.el); st.sunA.copy(sun.anchor); };
      ctx.onTick((dt) => {
        if (st.auto) {
          st.day = (st.day + dt / 50) % 1.15; // 50 s day + a short night
          const f = Math.min(st.day, 1);
          st.az = -85 + 170 * f;
          st.el = st.day > 1 ? -10 : 4 + 58 * Math.sin(Math.PI * f);
        }
        setSun();
        const s = sun.dirFrom(tr.center);
        const up = st.el > 0 ? st.sky : 0;
        st.ldr = tr.ldrLight(s).map((x) => x * up);
        st.pT = up * Math.max(0, tr.normal().dot(s));
        st.pF = up * Math.max(0, fixed.normal().dot(s));
      });
      ctx.interact(sun, {
        name: 'Sun', hint: 'Move it, or let a day run by itself',
        controls: [
          { type: 'toggle', label: 'Run a day (50 s)', get: () => st.auto, set: (x) => (st.auto = x) },
          { type: 'range', label: 'Azimuth (east → west)', min: -90, max: 90, step: 1, get: () => Math.round(st.az), set: (x) => { st.auto = false; st.az = x; }, format: (x) => `${x}°` },
          { type: 'range', label: 'Elevation', min: 0, max: 85, step: 1, get: () => Math.round(st.el), set: (x) => { st.auto = false; st.el = x; }, format: (x) => `${x}°` },
          { type: 'choice', label: 'Sky', options: [[1, 'Clear'], [0.55, 'Hazy'], [0.2, 'Overcast']], get: () => st.sky, set: (x) => (st.sky = +x) },
        ],
      });
      ctx.interact(tr, { name: 'Sun tracker', hint: 'Pan GPIO18, tilt GPIO19; LDRs on GPIO32–35', note: () => `pan ${tr.pan.toFixed(0)}° tilt ${tr.tilt.toFixed(0)}° · ${(st.pT * 1000).toFixed(0)} mW` });
      ctx.interact(fixed, { name: 'Fixed panel', hint: 'Tilted 35°, facing south', note: () => `${(st.pF * 1000).toFixed(0)} mW` });
      const plot = ctx.plotter({ title: 'Panel power', series: [{ name: 'tracked W', color: '#ef8a2b', min: 0, max: 1.1 }, { name: 'fixed W', color: '#3a6fd0', min: 0, max: 1.1 }, { name: 'gain %', color: '#3aa65a', min: 0, max: 100 }] });
      ctx.anchor('tr', tr.anchor);
      ctx.anchor('cross', follow(tr.crossWorld));
      ctx.anchor('sun', follow(st.sunA));
      ctx.anchor('fixed', fixed.anchor);
      ctx.anchor('pan', wPan.mid);
      ctx.anchor('vp', wVp.mid);
      ctx.anchor('ldr', wTL.mid);
      return { st, tr, fixed, sun, plot };
    },
    callouts: [
      { anchor: 'sun', x: 0.04, y: 0.17, icon: 'sun', title: 'The sun', text: 'Click it: run a day, or drag azimuth and elevation yourself.' },
      { anchor: 'tr', x: 0.36, y: 0.12, icon: 'servo', title: 'Pan + tilt servos', text: 'One degree per loop towards the brighter side, until the four LDRs agree.' },
      { anchor: 'fixed', x: 0.04, y: 0.68, icon: 'info', title: 'Fixed panel', text: 'Same panel, same load, never moves: the baseline.' },
      { anchor: 'vp', x: 0.36, y: 0.74, icon: 'resistor', title: 'Load + divider', text: '36 Ω load on each panel; a 10k/10k divider halves its voltage for VP / VN.' },
      { anchor: 'ldr', x: 0.7, y: 0.17, icon: 'sun', title: 'LDR cross', text: 'The walls shade the quadrants away from the sun, so differences point at it.' },
    ],
    overview: {
      heading: 'Solar sun tracker',
      text: 'Four LDRs (<b>Sense light</b>) in a cross-shaped shade tell the ESP32 where the sun is; two servos (<b>Servo</b>) turn the panel to face it. A fixed panel next to it shows how much more energy tracking collects over a day.',
      features: [['sun', 'Quadrant LDRs: compare top vs bottom and left vs right'], ['servo', 'ESP32Servo on GPIO18 / 19 with a dead-band'], ['bolt', 'P = V² / R from each panel’s divider, integrated to mWh']],
    },
    pinout: [
      ['GPIO32 / 33 / 34 / 35', 'LDR TL / TR / BL / BR', '10 kΩ dividers on the tracker board'],
      ['GPIO18', 'Pan servo signal', '50 Hz, 500–2400 µs'],
      ['GPIO19', 'Tilt servo signal', ''],
      ['VIN (5 V)', 'Servo power', 'Use a 2 A supply for two servos'],
      ['VP (GPIO36)', 'Tracked panel ÷2', '36 Ω load, 10k/10k divider'],
      ['VN (GPIO39)', 'Fixed panel ÷2', 'Same load and divider'],
      ['3V3 / GND rails', 'LDR dividers, panel –', 'Common ground'],
    ],
    example: {
      text: 'Utility solar farms use single-axis trackers that gain 15–25 % over fixed panels; dual-axis trackers gain more but cost more to build and maintain. Many use the sun’s calculated position rather than light sensors, so clouds cannot fool them.',
      points: ['Run a day and compare the energy: the gain is largest early and late, when the fixed panel sees the sun at a steep angle', 'Choose Overcast: diffuse light makes the LDRs agree, so the tracker stops moving', 'Raise TOLERANCE: the panel stops sooner but hunts less'],
    },
    specs: [
      ['Panels', '6 V, 1 W (≈ 166 mA) each, 36 Ω load'],
      ['LDRs', 'GL5528-style, ≈ 10–20 kΩ at 10 lux, γ ≈ 0.7'],
      ['Servos', '2 × SG90-style, 0.1 s / 60° at 5 V'],
      ['ADC', '12-bit, 11 dB attenuation, ADC1 only (works with Wi-Fi)'],
      ['Libraries', 'ESP32Servo'],
      ['Model', 'A bright lamp as the sun (≈ 2000 lux); outdoors use 1 kΩ dividers or a shade filter'],
    ],
    quiz: [
      { q: 'The two top LDRs read brighter than the two bottom ones. What should the tilt do?', options: ['Nothing', 'Turn the panel up towards the top edge', 'Turn it down', 'Spin the pan servo'], answer: 1, explain: 'The sun is on the top side, so the panel tilts up until top and bottom match.' },
      { q: 'What is the cross-shaped shade for?', options: ['Decoration', 'It shadows the LDRs on the side away from the sun, making the difference bigger', 'It cools the LDRs', 'It holds the servo'], answer: 1, explain: 'Without walls all four LDRs see nearly the same light; the shadow turns a small angle into a large reading difference.' },
      { q: 'Why is there a TOLERANCE dead-band?', options: ['To stop the servos jittering back and forth over tiny, noisy differences', 'To save flash', 'Servos need it to start', 'The ADC is 8-bit'], answer: 0, explain: 'Readings always differ a little; ignoring small differences keeps the panel still once it is aimed.' },
      { q: 'The panel gives 4.2 V across 36 Ω. How much power is that?', options: ['0.12 W', '0.49 W', '1.2 W', '151 W'], answer: 1, explain: 'P = V² / R = 4.2² / 36 ≈ 0.49 W.' },
    ],
    challenges: ['Print the energy gain as a percentage once an hour.', 'Return the panel to the east at sunset so it is ready for the morning.', 'Replace the LDRs with a sun-position formula from the date, time and latitude, so clouds cannot fool it.'],
    code: `// Dual-axis sun tracker vs a fixed panel.
#include <ESP32Servo.h>

const int LDR_TL = 32, LDR_TR = 33, LDR_BL = 34, LDR_BR = 35;
const int PV_TRACK = 36, PV_FIXED = 39;   // panel voltage through 10k/10k dividers
const int PAN_PIN = 18, TILT_PIN = 19;
const float R_LOAD = 36.0;                // ohms across each panel
const int TOLERANCE = {{tol}};              // ADC counts of difference to ignore
const int DARK = 600;                     // all four below this: night
Servo pan, tilt;
int panDeg = 90, tiltDeg = 30;
float mWhTrack = 0, mWhFixed = 0;
unsigned long lastLog = 0;

int readAvg(int pin) {                    // average 8 samples
  long sum = 0;
  for (int i = 0; i < 8; i++) sum += analogRead(pin);
  return sum / 8;
}

float panelWatts(int pin) {
  float v = analogReadMilliVolts(pin) * 2 / 1000.0;   // undo the divider
  return v * v / R_LOAD;
}

void setup() {
  Serial.begin(115200);
  pan.setPeriodHertz(50);
  tilt.setPeriodHertz(50);
  pan.attach(PAN_PIN, 500, 2400);
  tilt.attach(TILT_PIN, 500, 2400);
  pan.write(panDeg);
  tilt.write(tiltDeg);
}

void loop() {
  int tl = readAvg(LDR_TL), tr = readAvg(LDR_TR);
  int bl = readAvg(LDR_BL), br = readAvg(LDR_BR);
  int top = (tl + tr) / 2, bottom = (bl + br) / 2;
  int left = (tl + bl) / 2, right = (tr + br) / 2;

  if (max(max(tl, tr), max(bl, br)) < DARK) {
    panDeg = 10;                          // night: park facing east
    tiltDeg = 30;
  } else {
    if (abs(top - bottom) > TOLERANCE) tiltDeg += (top > bottom) ? -1 : 1;
    if (abs(right - left) > TOLERANCE) panDeg += (right > left) ? 1 : -1;
  }
  panDeg = constrain(panDeg, 0, 180);
  tiltDeg = constrain(tiltDeg, 0, 85);
  pan.write(panDeg);
  tilt.write(tiltDeg);

  if (millis() - lastLog >= 1000) {
    lastLog = millis();
    float pT = panelWatts(PV_TRACK), pF = panelWatts(PV_FIXED);
    mWhTrack += pT * 1000 / 3600.0;       // one second of power, in mWh
    mWhFixed += pF * 1000 / 3600.0;
    float gain = mWhFixed > 0 ? (mWhTrack / mWhFixed - 1) * 100 : 0;
    Serial.printf("tracked:%.2f fixed:%.2f gain:%.0f\\n", pT, pF, gain);
  }
  delay({{period}});
}`,
    params: { tol: { value: 40, min: 5, max: 400 }, period: { value: 60, min: 15, max: 1000 } },
    async setup(io, b) {
      Object.assign(b, { pan: 90, tilt: 30, whT: 0, whF: 0, lastLog: now() });
      b.plot.reset();
      io.line('pan.attach(PAN_PIN'); io.pin('GPIO18', '50 Hz', true); await io.delay(60);
      io.line('tilt.attach(TILT_PIN'); io.pin('GPIO19', '50 Hz', true); await io.delay(60);
      io.line('pan.write(panDeg);'); b.tr.setPan(90); b.tr.setTilt(30); await io.delay(80);
    },
    async loop(io, b, p) {
      const st = b.st;
      // LDR → divider → 12-bit ADC (LDR from 3V3 to the pin, 10 k to GND)
      const raw = st.ldr.map((x) => {
        const lux = 2000 * x + 3;
        const r = 20000 * (lux / 10) ** -0.7;
        return Math.round(clamp((4095 * 10000) / (10000 + r) + noise(6), 0, 4095));
      });
      io.line('int tl = readAvg(LDR_TL)');
      const [tl, trr, bl, br] = raw;
      io.pin('GPIO32', String(tl), false); io.pin('GPIO33', String(trr), false); io.pin('GPIO34', String(bl), false); io.pin('GPIO35', String(br), false);
      const top = (tl + trr) / 2, bottom = (bl + br) / 2, left = (tl + bl) / 2, right = (trr + br) / 2;
      io.line('if (max(max(tl, tr)');
      if (Math.max(...raw) < 600) {
        io.line('panDeg = 10;'); b.pan = 10; b.tilt = 30;
      } else {
        if (Math.abs(top - bottom) > p.tol) { io.line('tiltDeg += (top > bottom)'); b.tilt += top > bottom ? -1 : 1; }
        if (Math.abs(right - left) > p.tol) { io.line('panDeg += (right > left)'); b.pan += right > left ? 1 : -1; }
      }
      b.pan = clamp(b.pan, 0, 180); b.tilt = clamp(b.tilt, 0, 85);
      io.line('pan.write(panDeg);'); b.tr.setPan(b.pan); b.tr.setTilt(b.tilt);
      if (now() - b.lastLog >= 1000) {
        b.lastLog = now();
        io.line('float pT = panelWatts');
        const pT = st.pT * (0.99 + noise(0.01)), pF = st.pF * (0.99 + noise(0.01));
        io.pin('GPIO36', `${(Math.sqrt(pT * 36) / 2).toFixed(2)} V`, pT > 0.01); io.pin('GPIO39', `${(Math.sqrt(pF * 36) / 2).toFixed(2)} V`, pF > 0.01);
        b.whT += (pT * 1000) / 3600; b.whF += (pF * 1000) / 3600;
        const gain = b.whF > 0 ? (b.whT / b.whF - 1) * 100 : 0;
        io.line('Serial.printf("tracked');
        io.print(`tracked:${pT.toFixed(2)} fixed:${pF.toFixed(2)} gain:${gain.toFixed(0)}`);
        b.plot.push(pT, pF, clamp(gain, 0, 100));
      }
      io.line(`delay(${p.period})`);
      await io.delay(p.period);
    },
    reset(b) { b.plot.reset(); },
  },

  // ------------------------------------------------------------------ 3 air
  {
    id: 'eco-air-station', title: 'Air-quality station', icon: 'wave',
    thumb: () => makePMS5003(v(0, 0, 0)).group,
    view: { center: [-1, 2, -1], size: 25 },
    build(ctx) {
      const b = ctx.board;
      const bb = benchRails(ctx);
      ctx.step('PMS5003 laser particle sensor; its adapter plugs into the 8-way cable');
      const pms = ctx.add(makePMS5003(v(-9, 0, -2.5), { rotY: 0 }));
      ctx.step('PMS5003: 5 V from VIN (its fan needs it), GND to the rail');
      ctx.wire(pms.pin('VCC'), b.pin('VIN'), 'red', { signal: '5V', lift: 2.2 });
      ctx.wire(pms.pin('GND'), bb.hole(2, 'top-'), 'black', { lift: 2.6, dir: -1 });
      ctx.step('UART2: sensor TX → GPIO16 (RX2), sensor RX ← GPIO17 (TX2), both 3.3 V logic');
      const wTx = ctx.wire(pms.pin('TX'), b.pin('GPIO16'), 'green', { signal: 'GPIO16', lift: 2.8, dir: -1 });
      ctx.wire(b.pin('GPIO17'), pms.pin('RX'), 'yellow', { signal: 'GPIO17', lift: 3.1 });
      ctx.step('SGP30 gas sensor on I²C (3.3 V)');
      const sgp = ctx.add(makeSGP30(v(7, 0, -3)));
      ctx.wire(sgp.pin('VIN'), bb.hole(28, 'top+'), 'red', { lift: 1.6 });
      ctx.wire(sgp.pin('GND'), bb.hole(27, 'top-'), 'black', { lift: 1.4, dir: -1 });
      const wSda = ctx.wire(b.pin('GPIO21'), sgp.pin('SDA'), 'blue', { signal: 'GPIO21', lift: 1.4 });
      ctx.wire(b.pin('GPIO22'), sgp.pin('SCL'), 'yellow', { signal: 'GPIO22', lift: 1.7 });
      const g = eLed(ctx, bb, { pin: 'GPIO25', col: 8, color: 'green' });
      const y = eLed(ctx, bb, { pin: 'GPIO26', col: 15, color: 'yellow' });
      const r = eLed(ctx, bb, { pin: 'GPIO27', col: 22, color: 'red' });
      const PRESETS = [[5, 'Clean country air'], [22, 'City street'], [48, 'Cooking, no hood'], [90, 'Traffic jam + inversion'], [180, 'Wildfire smoke']];
      const st = { pm: 22, tvocSet: 120, tvoc: 0, eco2: 400, up: false, api: null, hist: [], polls: 0, lastPoll: 0 };
      ctx.onTick(() => pms.setAir(st.pm));
      ctx.interact(pms, {
        name: 'Air around the PMS5003', hint: 'Choose a situation or set PM2.5',
        controls: [
          { type: 'choice', label: 'Situation', options: PRESETS, get: () => st.pm, set: (x) => (st.pm = +x) },
          { type: 'range', label: 'PM2.5', min: 0, max: 300, step: 1, get: () => st.pm, set: (x) => (st.pm = x), format: (x) => `${x} µg/m³` },
        ],
        note: () => 'PM10 ≈ 1.4 × PM2.5 for these sources',
      });
      ctx.interact(sgp, {
        name: 'SGP30', hint: 'Volatile organic compounds (paint, cooking, breath)',
        controls: [{ type: 'range', label: 'TVOC', min: 0, max: 3000, step: 10, get: () => st.tvocSet, set: (x) => (st.tvocSet = x), format: (x) => `${x} ppb` }],
        note: () => 'eCO₂ is estimated from H₂, not measured CO₂',
      });
      const leds = [g, y, r];
      const spark = (vals) => {
        if (vals.length < 2) return '';
        const mx = Math.max(60, ...vals);
        const pts = vals.map((x, i) => `${(i / (vals.length - 1)) * 240},${40 - (x / mx) * 36}`).join(' ');
        return `<svg viewBox="0 0 240 42" width="100%" height="42"><polyline fill="none" stroke="#ef8a2b" stroke-width="2" points="${pts}"/></svg>`;
      };
      const colorOf = (a) => (a <= 50 ? '#3aa65a' : a <= 100 ? '#c9a21a' : a <= 150 ? '#ef8a2b' : a <= 200 ? '#e5412e' : '#8a5cc6');
      const browser = ctx.browser({
        url: `http://${IP}/`, title: 'Air station',
        render: () => {
          if (!st.up) return '<h5>Air station</h5><p class="muted">Press Run: the ESP32 joins Wi-Fi and serves this page.</p>';
          const d = st.api;
          if (!d) return '<h5>Air station</h5><p class="muted">Waiting for the first PMS5003 frame…</p>';
          return `<h5>Air station</h5><div class="row"><span>AQI</span><span class="big" style="color:${colorOf(d.aqi)}">${d.aqi}</span></div><div class="row"><span>Category</span><b>${d.cat}</b></div><div class="row"><span>PM2.5 / PM10</span><b>${d.pm25.toFixed(1)} / ${d.pm10.toFixed(0)} µg/m³</b></div><div class="row"><span>TVOC / eCO₂</span><b>${d.tvoc} ppb / ${d.eco2} ppm</b></div>${spark(st.hist)}<p class="muted">PM2.5 history · fetch('/api') every ${st.poll} ms · ${st.polls} updates</p>`;
        },
      });
      ctx.anchor('pms', pms.anchor);
      ctx.anchor('sgp', sgp.anchor);
      ctx.anchor('tx', wTx.mid);
      ctx.anchor('leds', y.led.anchor);
      ctx.anchor('sda', wSda.mid);
      return { st, pms, sgp, leds, browser };
    },
    callouts: [
      { anchor: 'pms', x: 0.04, y: 0.17, icon: 'wave', title: 'PMS5003', text: 'A laser counts particles in the air its fan pulls in. Click it to change the air.' },
      { anchor: 'tx', x: 0.36, y: 0.12, icon: 'serial', title: 'UART2 · GPIO16 / 17', text: 'A 32-byte frame about once a second at 9600 baud.' },
      { anchor: 'leds', x: 0.04, y: 0.68, icon: 'led', title: 'AQI lights', text: 'Green ≤ 50, yellow 51–100, red above 100 (US EPA scale).' },
      { anchor: 'sgp', x: 0.36, y: 0.74, icon: 'thermo', title: 'SGP30 · I²C 0x58', text: 'TVOC and an eCO₂ estimate, measured once a second.' },
    ],
    overview: {
      heading: 'Air-quality station',
      text: 'Read a PMS5003 over a second UART (<b>Serial</b>), an SGP30 over I²C (<b>Talk I²C</b>), turn the particle readings into the US EPA Air Quality Index, light a traffic-light LED and serve a live dashboard (<b>Live sensor dashboard</b>).',
      features: [['serial', 'PMS library on <code>Serial2</code>: PM1.0, PM2.5, PM10'], ['code', 'AQI by linear interpolation in the EPA breakpoint tables'], ['globe', '<code>WebServer</code> page that polls <code>/api</code>']],
    },
    pinout: [
      ['GPIO16 (RX2)', 'PMS5003 TX', '3.3 V UART, 9600 baud'],
      ['GPIO17 (TX2)', 'PMS5003 RX', ''],
      ['VIN (5 V)', 'PMS5003 VCC', 'The fan needs 5 V; logic stays 3.3 V'],
      ['GPIO21 / GPIO22', 'SGP30 SDA / SCL', 'I²C 0x58, 3.3 V'],
      ['GPIO25 / 26 / 27', 'Green / yellow / red LED', 'Through 330 Ω'],
      ['3V3 / GND rails', 'SGP30, LED cathodes, PMS GND', ''],
    ],
    example: {
      text: 'Community air-quality networks put thousands of low-cost sensors like these on balconies and lamp posts. They are less accurate than reference monitors (humidity makes particles swell), so the data is corrected against official stations.',
      points: ['Pick Wildfire smoke and watch the AQI turn red', 'Note the AQI uses the worse of PM2.5 and PM10', 'Officially the AQI uses a 24-hour average; this station shows the instant value'],
    },
    specs: [
      ['PMS5003', '0.3–10 µm, 0–500 µg/m³ effective, 5 V ≈ 100 mA, 3.3 V UART'],
      ['SGP30', 'TVOC 0–60 000 ppb, eCO₂ 400–60 000 ppm (estimated), I²C 0x58'],
      ['AQI table', 'US EPA (2024): PM2.5 Good ≤ 9.0 µg/m³'],
      ['Libraries', 'WiFi, WebServer, Wire, PMS Library (fu-hsi), Adafruit_SGP30'],
      ['Update', 'PMS frame ≈ 1 s, SGP30 every 1 s (needed for its baseline)'],
    ],
    quiz: [
      { q: 'PM2.5 = 30 µg/m³ and PM10 = 40 µg/m³. Which pollutant sets the AQI?', options: ['PM10, because it is bigger', 'PM2.5: it gives the higher AQI (≈ 90 vs ≈ 37)', 'Neither', 'TVOC'], answer: 1, explain: 'Each pollutant gets its own AQI from its table; the overall AQI is the maximum.' },
      { q: 'Why does the PMS5003 need 5 V but can still talk to the ESP32?', options: ['It cannot', 'Its fan runs on 5 V while its UART pins use 3.3 V logic', 'The ESP32 is 5 V tolerant', 'It converts automatically'], answer: 1, explain: 'The datasheet specifies 5 V supply and 3.3 V TTL serial levels.' },
      { q: 'Why is the SGP30’s eCO₂ not a true CO₂ measurement?', options: ['It is estimated from hydrogen and VOC signals', 'It is in the wrong unit', 'It only works outdoors', 'It is measured by the PMS5003'], answer: 0, explain: 'For real CO₂ you need an NDIR sensor such as the SCD40 or MH-Z19.' },
      { q: 'Using the 2024 EPA table, what AQI does PM2.5 = 9.0 µg/m³ give?', options: ['9', '25', '50', '100'], answer: 2, explain: '9.0 µg/m³ is the top of the Good band, which maps to AQI 50.' },
    ],
    challenges: ['Blink the red LED when the AQI goes above 150.', 'Average PM2.5 over the last hour and show it next to the instant value.', 'Add a BME280 and correct the PM readings when humidity is above 80 %.'],
    code: `#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <PMS.h>
#include <Adafruit_SGP30.h>

const char* SSID = "your-wifi";
const char* PASS = "your-password";
const int LED_GOOD = 25, LED_MOD = 26, LED_BAD = 27;

PMS pms(Serial2);
PMS::DATA pm;
Adafruit_SGP30 sgp;
WebServer server(80);
float pm25 = 0, pm10 = 0;
int tvoc = 0, eco2 = 400, aqi = 0;
unsigned long lastGas = 0;

struct Bp { float cLo, cHi; int iLo, iHi; };
const Bp PM25[] = {{0, 9.0, 0, 50}, {9.1, 35.4, 51, 100}, {35.5, 55.4, 101, 150},
                   {55.5, 125.4, 151, 200}, {125.5, 225.4, 201, 300}, {225.5, 325.4, 301, 500}};
const Bp PM10[] = {{0, 54, 0, 50}, {55, 154, 51, 100}, {155, 254, 101, 150},
                   {255, 354, 151, 200}, {355, 424, 201, 300}, {425, 604, 301, 500}};

int aqiFrom(const Bp* t, float c) {      // linear interpolation in one band
  for (int i = 0; i < 6; i++)
    if (c <= t[i].cHi)
      return round((t[i].iHi - t[i].iLo) / (t[i].cHi - t[i].cLo) * (c - t[i].cLo) + t[i].iLo);
  return 500;
}

const char* category(int a) {
  if (a <= 50) return "Good";
  if (a <= 100) return "Moderate";
  if (a <= 150) return "Unhealthy for sensitive groups";
  if (a <= 200) return "Unhealthy";
  if (a <= 300) return "Very unhealthy";
  return "Hazardous";
}

const char PAGE[] = R"rawliteral(<!DOCTYPE html><meta name=viewport content="width=device-width">
<h2>Air station</h2><p>AQI <b id=a>--</b> <span id=c></span></p>
<p>PM2.5 <b id=p>--</b> / PM10 <b id=q>--</b> &micro;g/m&sup3;</p>
<p>TVOC <b id=t>--</b> ppb &middot; eCO2 <b id=e>--</b> ppm</p>
<script>setInterval(async () => {
  const d = await (await fetch('/api')).json();
  for (const [k, v] of [['a', d.aqi], ['c', d.cat], ['p', d.pm25], ['q', d.pm10], ['t', d.tvoc], ['e', d.eco2]])
    document.getElementById(k).textContent = v;
}, {{poll}});</script>)rawliteral";

void handleApi() {
  String j = "{\\"pm25\\":" + String(pm25, 1) + ",\\"pm10\\":" + String(pm10, 0) +
             ",\\"aqi\\":" + String(aqi) + ",\\"cat\\":\\"" + category(aqi) +
             "\\",\\"tvoc\\":" + String(tvoc) + ",\\"eco2\\":" + String(eco2) + "}";
  server.send(200, "application/json", j);
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);   // RX2, TX2
  for (int p : {LED_GOOD, LED_MOD, LED_BAD}) pinMode(p, OUTPUT);
  Wire.begin(21, 22);
  if (!sgp.begin()) Serial.println("SGP30 not found");
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) delay(250);
  Serial.println(WiFi.localIP());
  server.on("/", [] { server.send(200, "text/html", PAGE); });
  server.on("/api", handleApi);
  server.begin();
}

void loop() {
  server.handleClient();
  if (pms.read(pm)) {                     // non-blocking: true when a frame arrived
    pm25 = pm.PM_AE_UG_2_5;
    pm10 = pm.PM_AE_UG_10_0;
    aqi = max(aqiFrom(PM25, pm25), aqiFrom(PM10, pm10));
    digitalWrite(LED_GOOD, aqi <= 50);
    digitalWrite(LED_MOD, aqi > 50 && aqi <= 100);
    digitalWrite(LED_BAD, aqi > 100);
    Serial.printf("PM2.5 %.0f  PM10 %.0f  AQI %d %s\\n", pm25, pm10, aqi, category(aqi));
  }
  if (millis() - lastGas >= 1000) {       // the SGP30 wants one reading per second
    lastGas = millis();
    if (sgp.IAQmeasure()) { tvoc = sgp.TVOC; eco2 = sgp.eCO2; }
  }
}`,
    params: { poll: { value: 2000, min: 500, max: 10000 } },
    async setup(io, b, p) {
      const st = b.st;
      Object.assign(st, { up: false, api: null, hist: [], polls: 0, poll: p.poll, lastPoll: now(), lastGas: 0, lastFrame: now(), pm25: 0, pm10: 0, aqi: 0, tvoc: 0, eco2: 400 });
      b.browser.update();
      io.line('Serial2.begin(9600'); await io.delay(60);
      io.line('sgp.begin()'); io.pin('GPIO21', 'SDA', true); await io.delay(100);
      await joinWifi(io);
      io.line('server.begin()'); st.up = true; b.browser.update(); await io.delay(80);
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('server.handleClient()');
      if (now() - st.lastPoll >= p.poll && (st.aqi || st.pm25)) {
        st.lastPoll = now();
        {
          st.api = { pm25: st.pm25, pm10: st.pm10, aqi: st.aqi, cat: st.cat, tvoc: st.tvoc, eco2: st.eco2 };
          st.polls++;
          st.hist.push(st.pm25); if (st.hist.length > 40) st.hist.shift();
          io.line('void handleApi'); b.browser.update();
        }
      }
      if (now() - st.lastFrame >= 1000) {
        st.lastFrame = now();
        io.line('if (pms.read(pm))'); io.pin('GPIO16', 'frame', true);
        const trunc = Math.floor(Math.max(0, st.pm * (1 + noise(0.06))));
        st.pm25 = trunc; st.pm10 = Math.floor(trunc * 1.4 + noise(1.5));
        io.line('aqi = max(aqiFrom');
        st.aqi = Math.max(aqiOf(PM25T, st.pm25), aqiOf(PM10T, Math.max(0, st.pm10)));
        st.cat = category(st.aqi);
        io.line('digitalWrite(LED_GOOD');
        b.leds[0].on(st.aqi <= 50); b.leds[1].on(st.aqi > 50 && st.aqi <= 100); b.leds[2].on(st.aqi > 100);
        io.pin('GPIO25', st.aqi <= 50 ? 'HIGH' : 'LOW', st.aqi <= 50); io.pin('GPIO26', st.aqi > 50 && st.aqi <= 100 ? 'HIGH' : 'LOW', st.aqi > 50 && st.aqi <= 100); io.pin('GPIO27', st.aqi > 100 ? 'HIGH' : 'LOW', st.aqi > 100);
        io.line('Serial.printf("PM2.5'); io.print(`PM2.5 ${st.pm25}  PM10 ${st.pm10}  AQI ${st.aqi} ${st.cat}`);
      }
      if (now() - st.lastGas >= 1000) {
        st.lastGas = now();
        io.line('if (sgp.IAQmeasure())');
        st.tvoc = Math.max(0, Math.round(st.tvocSet * (1 + noise(0.04))));
        st.eco2 = Math.round(400 + st.tvocSet * 0.85 + noise(5));
        io.pin('GPIO21', `${st.tvoc} ppb`, true);
      }
      await io.delay(120);
    },
    reset(b) { Object.assign(b.st, { up: false, api: null }); b.leds.forEach((l) => l.on(0)); b.browser.update(); },
  },

  // ------------------------------------------------------------------ 4 water
  {
    id: 'eco-water-quality', title: 'Water-quality monitor', icon: 'thermo',
    thumb: () => makeWaterLab(v(0, 0, 0)).group,
    view: { center: [-4.5, 4.5, -1], size: 25, az: -6 },
    build(ctx) {
      const b = ctx.board;
      const bb = benchRails(ctx);
      ctx.step('Water lab: beaker in a stand with pH, TDS and DS18B20 probes and their boards');
      const lab = ctx.add(makeWaterLab(v(-9.5, 0, -4.5)));
      ctx.step('Power all three probe boards from the 3.3 V and GND rails');
      ctx.wire(lab.pin('PH_+'), bb.hole(1, 'top+'), 'red', { lift: 2.4 });
      ctx.wire(lab.pin('PH_-'), bb.hole(2, 'top-'), 'black', { lift: 2.2, dir: -1 });
      ctx.wire(lab.pin('TDS_+'), bb.hole(3, 'top+'), 'red', { lift: 1.8 });
      ctx.wire(lab.pin('TDS_-'), bb.hole(5, 'top-'), 'black', { lift: 1.6, dir: -1 });
      ctx.wire(lab.pin('T_VCC'), bb.hole(7, 'top+'), 'red', { lift: 1.3 });
      ctx.wire(lab.pin('T_GND'), bb.hole(8, 'top-'), 'black', { lift: 1.1, dir: -1 });
      ctx.step('Signals: pH → GPIO34, TDS → GPIO35, DS18B20 data → GPIO4');
      const wPh = ctx.wire(lab.pin('PH_A'), b.pin('GPIO34'), 'green', { signal: 'GPIO34', lift: 3.0, dir: -1 });
      const wTds = ctx.wire(lab.pin('TDS_A'), b.pin('GPIO35'), 'blue', { signal: 'GPIO35', lift: 2.6, dir: -1 });
      const wT = ctx.wire(lab.pin('T_DQ'), b.pin('GPIO4'), 'yellow', { signal: 'GPIO4', lift: 2.2, dir: -1 });
      const ok = eLed(ctx, bb, { pin: 'GPIO25', col: 12, color: 'green' });
      const bad = eLed(ctx, bb, { pin: 'GPIO26', col: 19, color: 'red' });
      ctx.step('Piezo buzzer between row 25 and row 28; GPIO27 drives it');
      const bz = ctx.add(K(makeBuzzer(bb.hole(25, 'e'), bb.hole(28, 'e')), 'part', 'Piezo buzzer'));
      ctx.wire(b.pin('GPIO27'), bb.hole(25, 'a'), 'orange', { signal: 'GPIO27', lift: 1.6 });
      ctx.wire(bb.hole(28, 'a'), bb.hole(28, 'top-'), 'black', { lift: 0.4, dir: -1 });
      const SAMPLES = {
        tap: { name: 'Tap water', ph: 7.4, tds: 220, color: 0x9fd3ef, turb: 0 },
        rain: { name: 'Rainwater', ph: 5.6, tds: 14, color: 0xbfe6f7, turb: 0 },
        river: { name: 'River after a storm', ph: 7.1, tds: 340, color: 0x9a8a5a, turb: 0.8 },
        mine: { name: 'Acid mine runoff', ph: 3.2, tds: 900, color: 0xd98a3a, turb: 0.35 },
        pond: { name: 'Over-limed pond', ph: 9.4, tds: 610, color: 0x7fbf6a, turb: 0.25 },
        salt: { name: 'Salted (road run-off)', ph: 7.8, tds: 780, color: 0xa9d9ef, turb: 0.05 },
      };
      const st = { key: 'tap', temp: 18, ph: 7.4, tds: 220 };
      const apply = () => { const s = SAMPLES[st.key]; st.ph = s.ph; st.tds = s.tds; lab.setWater({ color: s.color, turbidity: s.turb }); };
      apply();
      ctx.interact(lab, {
        name: 'Water sample', hint: 'Pour a different sample into the beaker',
        controls: [
          { type: 'choice', label: 'Sample', options: Object.entries(SAMPLES).map(([k, s]) => [k, s.name]), get: () => st.key, set: (k) => { st.key = k; apply(); } },
          { type: 'range', label: 'pH (fine tune)', min: 2, max: 12, step: 0.1, get: () => st.ph, set: (x) => (st.ph = x), format: (x) => Number(x).toFixed(1) },
          { type: 'range', label: 'TDS', min: 0, max: 1000, step: 10, get: () => st.tds, set: (x) => (st.tds = x), format: (x) => `${x} ppm` },
          { type: 'range', label: 'Temperature', min: 2, max: 35, step: 0.5, get: () => st.temp, set: (x) => (st.temp = x), format: (x) => `${Number(x).toFixed(1)} °C` },
        ],
        note: () => 'Colour and cloudiness are turbidity: neither probe measures it',
      });
      ctx.interact(bz, { name: 'Piezo buzzer', hint: 'tone() beeps it on every alert' });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'pH', color: '#3aa65a', min: 0, max: 14 }, { name: 'TDS ppm', color: '#3a6fd0', min: 0, max: 1000 }, { name: 'temp °C', color: '#e5412e', min: 0, max: 40 }] });
      ctx.anchor('ph', lab.phAnchor);
      ctx.anchor('tds', lab.tdsAnchor);
      ctx.anchor('beaker', lab.beakerAnchor);
      ctx.anchor('wph', wPh.mid);
      ctx.anchor('wt', wT.mid);
      ctx.anchor('leds', bad.led.anchor);
      ctx.anchor('wtds', wTds.mid);
      return { st, lab, ok, bad, bz, plot };
    },
    callouts: [
      { anchor: 'ph', x: 0.04, y: 0.17, icon: 'thermo', title: 'pH probe · GPIO34', text: 'A glass electrode: ≈ 1.5 V at pH 7, about 177 mV more for every pH unit more acidic.' },
      { anchor: 'tds', x: 0.36, y: 0.12, icon: 'wave', title: 'TDS probe · GPIO35', text: 'Conductivity of dissolved salts, converted to ppm and corrected to 25 °C.' },
      { anchor: 'beaker', x: 0.7, y: 0.17, icon: 'hand', title: 'The sample', text: 'Click the beaker: tap water, rain, river, mine run-off…' },
      { anchor: 'wt', x: 0.04, y: 0.68, icon: 'thermo', title: 'DS18B20 · GPIO4', text: 'One-wire digital thermometer; 4.7 kΩ pull-up on its adapter.' },
      { anchor: 'leds', x: 0.36, y: 0.74, icon: 'led', title: 'Safe-range alert', text: 'Green when pH and TDS are in range, red + beep otherwise.' },
    ],
    overview: {
      heading: 'Water-quality monitor',
      text: 'Read two analog probes with calibrated maths (<b>Read a sensor</b>), a DS18B20 over one wire (<b>Temperature</b>) and check the results against safe ranges, with LEDs and a buzzer (<b>Make some noise</b>) as alarms.',
      features: [['thermo', 'pH from two-point calibration in mV'], ['wave', 'TDS polynomial with temperature compensation'], ['code', 'Median-of-15 filter rejects ADC spikes']],
    },
    pinout: [
      ['GPIO34', 'pH board A', '0–3 V, ADC1'],
      ['GPIO35', 'TDS board A', '0–2.3 V'],
      ['GPIO4', 'DS18B20 DQ', '4.7 kΩ pull-up to 3V3 on the adapter'],
      ['GPIO25 / GPIO26', 'Green / red LED', 'Through 330 Ω'],
      ['GPIO27', 'Piezo buzzer', 'tone()'],
      ['3V3 / GND rails', 'All three probe boards', ''],
    ],
    example: {
      text: 'Aquaculture farms, hydroponic growers and river-monitoring buoys log pH, conductivity and temperature continuously. Real stations add turbidity and dissolved-oxygen probes and are recalibrated every few weeks.',
      points: ['Pour in acid mine run-off and watch both alarms fire', 'Muddy river water looks bad but may pass: pH and TDS say nothing about turbidity or bacteria', 'Warm the sample: TDS stays the same because the formula compensates for temperature'],
    },
    specs: [
      ['pH board', 'Gravity-style analog, 3.3–5 V, 0–3 V out, pH 0–14'],
      ['TDS board', 'Gravity-style analog, 0–1000 ppm, ±10 % FS'],
      ['Thermometer', 'DS18B20, −55…125 °C, ±0.5 °C, 750 ms at 12 bit'],
      ['Safe ranges', 'pH 6.5–8.5, TDS ≤ 500 ppm (EPA secondary standards)'],
      ['Libraries', 'OneWire, DallasTemperature'],
      ['Calibration', 'pH 7.00 and 4.00 buffers; TDS with a 707 ppm standard'],
    ],
    quiz: [
      { q: 'The pH board reads 1855 mV. With 1500 mV at pH 7 and 2032 mV at pH 4, what is the pH?', options: ['≈ 5.0', '≈ 6.0', '≈ 7.5', '≈ 9.0'], answer: 0, explain: 'Slope = 3 / (1500 − 2032) pH per mV; 7 + (1855 − 1500) × slope ≈ 7 − 2.0 = 5.0.' },
      { q: 'Why does the TDS reading need the water temperature?', options: ['Conductivity rises about 2 % per °C, so readings are corrected to 25 °C', 'The probe heats the water', 'The ADC drifts', 'It does not'], answer: 0, explain: 'Warm water conducts better; dividing by 1 + 0.02 × (T − 25) gives the 25 °C value.' },
      { q: 'A muddy brown river sample passes both checks. Why?', options: ['The probes are broken', 'Colour and cloudiness are turbidity, which neither pH nor TDS measures', 'Mud is pH 7', 'TDS only measures sugar'], answer: 1, explain: 'Suspended particles do not dissolve, so they barely change conductivity. Use a turbidity sensor.' },
      { q: 'Why take the median of 15 readings instead of one?', options: ['The ADC is slow', 'A single spike from noise cannot move the median', 'It calibrates the probe', 'To save power'], answer: 1, explain: 'The median ignores outliers that would pull an average off.' },
    ],
    challenges: ['Print a warning when the temperature is above 25 °C (less dissolved oxygen for fish).', 'Add a serial command <code>cal7</code> that stores the current pH voltage as the new neutral point.', 'Add an analog turbidity sensor on GPIO32 and include it in the safe-range check.'],
    code: `#include <OneWire.h>
#include <DallasTemperature.h>

const int PH_PIN = 34, TDS_PIN = 35, TEMP_PIN = 4;
const int LED_OK = 25, LED_ALERT = 26, BUZZER = 27;
const float PH_NEUTRAL_MV = 1500.0;   // calibrate: probe in pH 7.00 buffer
const float PH_ACID_MV = 2032.4;      // calibrate: probe in pH 4.00 buffer
const float PH_MIN = {{phmin}} / 10.0, PH_MAX = {{phmax}} / 10.0;
const float TDS_MAX = {{tdsmax}};       // ppm

OneWire oneWire(TEMP_PIN);
DallasTemperature probe(&oneWire);

float readMilliVolts(int pin) {     // median of 15 readings rejects spikes
  int v[15];
  for (int i = 0; i < 15; i++) { v[i] = analogReadMilliVolts(pin); delay(10); }
  for (int i = 1; i < 15; i++)       // insertion sort
    for (int j = i; j > 0 && v[j] < v[j - 1]; j--) { int t = v[j]; v[j] = v[j - 1]; v[j - 1] = t; }
  return v[7];
}

float toPH(float mv) {
  float slope = (7.0 - 4.0) / (PH_NEUTRAL_MV - PH_ACID_MV);   // pH per mV
  return 7.0 + slope * (mv - PH_NEUTRAL_MV);
}

float toTDS(float mv, float tempC) {
  float v = mv / 1000.0 / (1.0 + 0.02 * (tempC - 25.0));       // to 25 C
  return (133.42 * v * v * v - 255.86 * v * v + 857.39 * v) * 0.5;
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_OK, OUTPUT);
  pinMode(LED_ALERT, OUTPUT);
  probe.begin();
  analogSetAttenuation(ADC_11db);     // 0 to ~3.1 V
}

void loop() {
  probe.requestTemperatures();        // 750 ms conversion at 12 bit
  float tempC = probe.getTempCByIndex(0);
  if (tempC == DEVICE_DISCONNECTED_C) tempC = 25.0;
  float ph = toPH(readMilliVolts(PH_PIN));
  float tds = toTDS(readMilliVolts(TDS_PIN), tempC);
  bool phOk = ph >= PH_MIN && ph <= PH_MAX;
  bool tdsOk = tds <= TDS_MAX;

  digitalWrite(LED_OK, phOk && tdsOk);
  digitalWrite(LED_ALERT, !(phOk && tdsOk));
  Serial.printf("pH:%.2f TDS:%.0f temp:%.1f\\n", ph, tds, tempC);
  if (!phOk) Serial.println(ph < PH_MIN ? "ALERT pH too low (acidic)" : "ALERT pH too high (alkaline)");
  if (!tdsOk) Serial.println("ALERT dissolved solids above limit");
  if (!phOk || !tdsOk) tone(BUZZER, 2000, 150);
  delay(2000);
}`,
    params: { phmin: { value: 65, min: 40, max: 75 }, phmax: { value: 85, min: 75, max: 110 }, tdsmax: { value: 500, min: 50, max: 1000 } },
    async setup(io, b) {
      b.plot.reset();
      io.line('pinMode(LED_OK'); await io.delay(60);
      io.line('probe.begin()'); io.pin('GPIO4', '1-Wire', true); await io.delay(100);
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('probe.requestTemperatures()'); io.pin('GPIO4', 'convert', true);
      await io.delay(750);
      const tempC = Math.round((st.temp + noise(0.06)) * 16) / 16; // 12-bit = 1/16 °C
      io.line('float tempC = probe'); io.pin('GPIO4', `${tempC.toFixed(2)} °C`, false);
      io.line('float ph = toPH');
      const phMv = 1500 + 177.47 * (7 - st.ph) + noise(3);
      io.pin('GPIO34', `${phMv.toFixed(0)} mV`, true);
      await io.delay(150);
      const ph = 7 + ((7 - 4) / (1500 - 2032.4)) * (phMv - 1500);
      io.line('float tds = toTDS');
      const tdsMv = tdsMillivolts(st.tds, st.temp) + noise(2);
      io.pin('GPIO35', `${tdsMv.toFixed(0)} mV`, true);
      await io.delay(150);
      const vv = tdsMv / 1000 / (1 + 0.02 * (tempC - 25));
      const tds = Math.max(0, (133.42 * vv ** 3 - 255.86 * vv ** 2 + 857.39 * vv) * 0.5);
      const phOk = ph >= p.phmin / 10 && ph <= p.phmax / 10, tdsOk = tds <= p.tdsmax;
      io.line('digitalWrite(LED_OK');
      b.ok.on(phOk && tdsOk); b.bad.on(!(phOk && tdsOk));
      io.pin('GPIO25', phOk && tdsOk ? 'HIGH' : 'LOW', phOk && tdsOk); io.pin('GPIO26', phOk && tdsOk ? 'LOW' : 'HIGH', !(phOk && tdsOk));
      io.line('Serial.printf("pH:'); io.print(`pH:${ph.toFixed(2)} TDS:${tds.toFixed(0)} temp:${tempC.toFixed(1)}`);
      b.plot.push(ph, tds, tempC);
      if (!phOk) { io.line('if (!phOk) Serial.println'); io.print(ph < p.phmin / 10 ? 'ALERT pH too low (acidic)' : 'ALERT pH too high (alkaline)'); }
      if (!tdsOk) { io.line('if (!tdsOk) Serial.println'); io.print('ALERT dissolved solids above limit'); }
      if (!phOk || !tdsOk) {
        io.line('tone(BUZZER'); b.bz.set(true, 2000); io.tone(2000); io.pin('GPIO27', '2 kHz', true);
        await io.delay(150);
        b.bz.set(false); io.noTone(); io.pin('GPIO27', 'LOW', false);
      }
      io.line('delay(2000)'); await io.delay(1500);
    },
    reset(b, io) { b.ok.on(0); b.bad.on(0); b.bz.set(false); io?.noTone?.(); b.plot.reset(); },
  },

  // ------------------------------------------------------------------ 5 wildfire
  {
    id: 'eco-wildfire', title: 'Wildfire early warning', icon: 'sun',
    thumb: () => makeWildfirePost(v(0, 0, 0)).group,
    view: { center: [3, 3.5, -7], size: 42, az: -4 },
    build(ctx) {
      const b = ctx.board;
      const bb = benchRails(ctx);
      ctx.step('A patch of forest to protect');
      const forest = ctx.add(makeForestPatch(v(-7, 0, -16), { w: 26, d: 14 }));
      ctx.step('The sensor post at the forest edge, sensors facing the trees');
      const post = ctx.add(makeWildfirePost(v(6, 0, -9.5), { rotY: Math.PI }));
      ctx.step('Harness: 5V → VIN, 3V3 and GND to the rails');
      ctx.wire(post.pin('5V'), b.pin('VIN'), 'red', { signal: '5V', lift: 3.2 });
      ctx.wire(post.pin('3V3'), bb.hole(29, 'top+'), 'red', { lift: 3.4 });
      ctx.wire(post.pin('GND'), bb.hole(28, 'top-'), 'black', { lift: 3.0, dir: -1 });
      ctx.step('Sensor signals: smoke (MQ-2, halved) → GPIO34, flame DO → GPIO35, DHT22 → GPIO4');
      const wSm = ctx.wire(post.pin('SMOKE'), b.pin('GPIO34'), 'green', { signal: 'GPIO34', lift: 2.6, dir: -1 });
      const wFl = ctx.wire(post.pin('FLAME'), b.pin('GPIO35'), 'orange', { signal: 'GPIO35', lift: 2.8, dir: -1 });
      ctx.wire(post.pin('DHT'), b.pin('GPIO4'), 'yellow', { signal: 'GPIO4', lift: 3.6, dir: -1 });
      ctx.step('SX1276 LoRa module on SPI');
      const lora = ctx.add(makeLoRa(v(-7.5, 0, 3.2)));
      const spi = (mod, brd, bbRef, colV, colG) => {
        ctx.wire(mod.pin('VCC'), bbRef.hole(colV, 'top+'), 'red', { lift: 1.4 });
        ctx.wire(mod.pin('GND'), bbRef.hole(colG, 'top-'), 'black', { lift: 1.2, dir: -1 });
        const sck = ctx.wire(brd.pin('GPIO18'), mod.pin('SCK'), 'yellow', { signal: 'GPIO18', lift: 2.0 });
        ctx.wire(brd.pin('GPIO19'), mod.pin('MISO'), 'blue', { signal: 'GPIO19', lift: 2.2 });
        ctx.wire(brd.pin('GPIO23'), mod.pin('MOSI'), 'green', { signal: 'GPIO23', lift: 2.4 });
        ctx.wire(brd.pin('GPIO5'), mod.pin('NSS'), 'white', { signal: 'GPIO5', lift: 1.8 });
        ctx.wire(brd.pin('GPIO14'), mod.pin('RST'), 'brown', { signal: 'GPIO14', lift: 2.6 });
        ctx.wire(brd.pin('GPIO26'), mod.pin('DIO0'), 'purple', { signal: 'GPIO26', lift: 2.8 });
        return sck;
      };
      const wSck = spi(lora, b, bb, 1, 2);
      ctx.step('Base station: a second ESP32 with its own LoRa module, 2 km away (shortened here)');
      const base = makeESP32();
      base.group.position.set(17, 0, -11);
      base.group.updateMatrixWorld(true);
      ctx.add(K({ group: base.group, pick: base.group }, 'board', 'ESP32 DevKit (base station)'));
      const bb2 = ctx.breadboard(17, -5.4);
      ctx.wire(base.pin('3V3'), bb2.hole(4, 'top+'), 'red', { lift: 1.0 });
      ctx.wire(base.pin('GND_2'), bb2.hole(6, 'top-'), 'black', { lift: 0.8, dir: -1 });
      const lora2 = ctx.add(makeLoRa(v(24, 0, -11.5)));
      spi(lora2, base, bb2, 1, 2);

      const st = { fire: 0, t: 26, h: 35, auto: false, phase: 0, running: false, packets: [], fireA: forest.fireWorld.clone() };
      const flameSeen = () => {
        if (forest.fire < 0.12) return false;
        const to = forest.fireWorld.clone().sub(post.flameEye);
        const dist = to.length();
        // IR flame sensor: ≈ 60° cone; range grows with flame size (≈ 1 m for a lighter, metres for a fire)
        const ang = to.normalize().angleTo(v(0, -0.55, -1).normalize());
        return ang < THREE.MathUtils.degToRad(35) && dist < 10 + forest.fire * 25;
      };
      ctx.onTick((dt) => {
        if (st.auto) {
          st.phase += dt / 40;
          const f = st.phase % 1;
          st.t = 24 + 12 * Math.sin(Math.PI * f);
          st.h = 55 - 35 * Math.sin(Math.PI * f);
          st.fire = f > 0.55 && f < 0.85 ? Math.min(1, (f - 0.55) * 6) : 0;
        }
        forest.setFire(st.fire);
        st.flame = flameSeen();
      });
      ctx.interact(forest, {
        name: 'Forest', hint: 'Light a fire or run a hot, dry afternoon',
        controls: [
          { type: 'range', label: 'Fire', min: 0, max: 100, step: 1, get: () => Math.round(st.fire * 100), set: (x) => { st.auto = false; st.fire = x / 100; }, format: (x) => (x ? `${x} %` : 'none') },
          { type: 'toggle', label: 'Run a dry afternoon (40 s)', get: () => st.auto, set: (x) => (st.auto = x) },
        ],
      });
      ctx.interact(post, {
        name: 'Weather at the post', hint: 'The DHT22 sits in the white radiation shield',
        controls: [
          { type: 'range', label: 'Temperature', min: 0, max: 45, step: 0.5, get: () => st.t, set: (x) => { st.auto = false; st.t = x; }, format: (x) => `${Number(x).toFixed(1)} °C` },
          { type: 'range', label: 'Humidity', min: 5, max: 100, step: 1, get: () => Math.round(st.h), set: (x) => { st.auto = false; st.h = x; }, format: (x) => `${x} %` },
        ],
        note: () => `Ångström index ${(st.h / 20 + (27 - st.t) / 10).toFixed(2)} · flame ${st.flame ? 'seen' : 'not seen'}`,
      });
      ctx.interact(lora, { name: 'LoRa SX1276', hint: '868 MHz, SF10: ≈ 2–5 km in open country' });
      const browser = ctx.browser({
        url: 'usb-serial://base-station · 115200', title: 'Base station',
        render: () => (st.packets.length
          ? `<h5>Base station</h5>${st.packets.slice(-5).reverse().map((pk) => `<div class="row"><span style="font:500 11px var(--mono);color:${/FIRE|ALERT/.test(pk.msg) ? '#e5412e' : /HIGH|EXTREME/.test(pk.msg) ? '#ef8a2b' : 'inherit'}">${pk.msg}</span><small class="muted">${pk.rssi} dBm</small></div>`).join('')}<p class="muted">Same sketch with BASE_STATION 1</p>`
          : '<h5>Base station</h5><p class="muted">Listening on 868 MHz… press Run.</p>'),
      });
      ctx.anchor('post', post.boxAnchor);
      ctx.anchor('forest', forest.anchor);
      ctx.anchor('fire', follow(st.fireA));
      ctx.anchor('lora', lora.anchor);
      ctx.anchor('base', lora2.anchor);
      ctx.anchor('smoke', wSm.mid);
      ctx.anchor('shield', post.shieldAnchor);
      ctx.anchor('sck', wSck.mid);
      ctx.anchor('flame', wFl.mid);
      return { st, forest, post, lora, lora2, base, browser };
    },
    callouts: [
      { anchor: 'fire', x: 0.04, y: 0.17, icon: 'sun', title: 'The forest', text: 'Click the trees to light a fire or run a hot, dry afternoon.' },
      { anchor: 'post', x: 0.36, y: 0.12, icon: 'radar', title: 'Sensor post', text: 'MQ-2 smoke, IR flame eye, DHT22 in a radiation shield, solar panel and antenna.' },
      { anchor: 'lora', x: 0.04, y: 0.68, icon: 'globe', title: 'LoRa SX1276 on SPI', text: 'Long range, low power, tiny packets: kilometres on a few milliwatts.' },
      { anchor: 'base', x: 0.7, y: 0.17, icon: 'chip', title: 'Base station', text: 'Same sketch with BASE_STATION 1: it prints each packet with its RSSI.' },
      { anchor: 'smoke', x: 0.36, y: 0.74, icon: 'wave', title: 'Fire-risk index', text: 'Ångström index from temperature and humidity; smoke or flame raises an ALERT.' },
    ],
    overview: {
      heading: 'Wildfire early warning',
      text: 'Combine smoke and flame sensors (<b>Gas and flame</b>), a DHT22 (<b>Temperature & humidity</b>) and a LoRa radio into a solar post that rates fire risk and radios alerts to a base station kilometres away. One sketch runs on both ends.',
      features: [['sun', 'Ångström fire-danger index: RH / 20 + (27 − T) / 10'], ['globe', 'LoRa library: SF10, 14 dBm, packet RSSI and SNR'], ['timer', 'Routine reports plus instant alerts when the level rises']],
    },
    pinout: [
      ['GPIO34', 'Harness SMOKE', 'MQ-2 AO ÷ 2 (10k/10k) so 5 V becomes 2.5 V'],
      ['GPIO35', 'Harness FLAME', 'IR flame DO, LOW = flame'],
      ['GPIO4', 'Harness DHT', 'DHT22 data'],
      ['VIN / 3V3 / GND', 'Harness 5V / 3V3 / GND', 'MQ-2 heater needs 5 V (≈ 150 mA)'],
      ['GPIO18 / 19 / 23', 'LoRa SCK / MISO / MOSI', 'VSPI'],
      ['GPIO5 / 14 / 26', 'LoRa NSS / RST / DIO0', 'LoRa.setPins(5, 14, 26)'],
      ['Base station', 'Same LoRa wiring', 'Flash with BASE_STATION 1'],
    ],
    example: {
      text: 'Networks of solar LoRa sensor posts now guard forests in several countries. They catch fires in the first minutes, long before smoke is seen from a lookout, and work where there is no mobile signal.',
      points: ['Run a dry afternoon and watch the risk climb from LOW to HIGH before the fire starts', 'Light a fire: the flame eye only sees it inside its cone, smoke reaches the post either way', 'In the EU 868 MHz band you may transmit at most 1 % of the time: with SF10 that is about one packet every 40 s'],
    },
    specs: [
      ['Radio', 'SX1276 (RFM95W-style), 868 / 915 MHz, SF7–12, up to +20 dBm'],
      ['Smoke', 'MQ-2, 5 V heater, AO halved by 10k/10k'],
      ['Flame', 'IR photodiode 760–1100 nm, ≈ 60° cone'],
      ['Weather', 'DHT22: −40…80 °C ±0.5 °C, 0–100 % RH ±2 %'],
      ['Risk scale', 'Ångström index: > 4 LOW, 2.5–4 MODERATE, 2–2.5 HIGH, < 2 EXTREME'],
      ['Libraries', 'SPI, LoRa (Sandeep Mistry), DHT sensor library'],
    ],
    quiz: [
      { q: 'T = 33 °C and RH = 18 %. What is the Ångström index and level?', options: ['≈ 0.3, EXTREME', '≈ 3.0, MODERATE', '≈ 4.5, LOW', '≈ 2.2, HIGH'], answer: 0, explain: '18 / 20 + (27 − 33) / 10 = 0.9 − 0.6 = 0.3, well under 2.' },
      { q: 'Why is the MQ-2 output divided by two before GPIO34?', options: ['To save power', 'The module runs at 5 V and its AO can approach 5 V; the ESP32 ADC takes at most ~3.3 V', 'LoRa needs it', 'To make it more sensitive'], answer: 1, explain: 'Never feed more than 3.3 V into an ESP32 pin.' },
      { q: 'Why does the post send only every REPORT seconds unless the level rises?', options: ['Radio time costs battery and is legally limited (1 % duty cycle at 868 MHz in the EU)', 'LoRa can only send once a day', 'The DHT22 is slow', 'The base station is busy'], answer: 0, explain: 'Routine reports are rare; a rising level is sent at once.' },
      { q: 'What does a higher spreading factor (SF10 instead of SF7) give you?', options: ['Faster data', 'Longer range and better noise tolerance, at the cost of slower, longer packets', 'Lower frequency', 'More channels'], answer: 1, explain: 'Each step up roughly doubles the time on air and gains about 2.5 dB of sensitivity.' },
    ],
    challenges: ['Send the battery voltage of the post in every packet.', 'Make the base station sound a buzzer for FIRE and blink for HIGH.', 'Add a second post with id FW08 and show both on the base station.'],
    code: `// Wildfire early-warning node and base station in one sketch.
#define BASE_STATION 0          // 0: sensor post, 1: base station
#include <SPI.h>
#include <LoRa.h>
#include <DHT.h>

const long FREQ = 868E6;        // EU band; use 915E6 in the Americas
const int LORA_SS = 5, LORA_RST = 14, LORA_DIO0 = 26;

void startRadio() {
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(FREQ)) { Serial.println("LoRa init failed"); while (true) delay(1000); }
  LoRa.setSpreadingFactor(10);  // slower, longer range
}

#if BASE_STATION
void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT);           // on-board LED = alarm
  startRadio();
  Serial.println("Base station listening");
}

void loop() {
  if (LoRa.parsePacket() == 0) return;
  String msg = LoRa.readString();
  Serial.printf("%s  RSSI %d dBm  SNR %.1f dB\\n", msg.c_str(), LoRa.packetRssi(), LoRa.packetSnr());
  digitalWrite(2, msg.indexOf("FIRE") >= 0 || msg.indexOf("ALERT") >= 0);
}
#else
const int SMOKE_PIN = 34;       // MQ-2 AO through a 10k/10k divider
const int FLAME_PIN = 35;       // IR flame DO, LOW = flame seen
DHT dht(4, DHT22);
const int SMOKE_LIMIT = {{smoke}};  // mV at the pin (clean air ~ 300 mV)
const unsigned long REPORT_MS = {{report}} * 1000UL;
const char* LEVELS[] = {"LOW", "MODERATE", "HIGH", "EXTREME", "ALERT", "FIRE"};
int lastLevel = -1, seq = 0;
unsigned long lastSend = 0;

// Angstrom index: RH / 20 + (27 - T) / 10. Lower = hotter and drier.
int fireLevel(float t, float h, bool smoke, bool flame) {
  if (smoke && flame) return 5;
  if (smoke || flame) return 4;
  float a = h / 20.0 + (27.0 - t) / 10.0;
  if (a > 4.0) return 0;
  if (a > 2.5) return 1;
  if (a > 2.0) return 2;
  return 3;
}

void setup() {
  Serial.begin(115200);
  pinMode(FLAME_PIN, INPUT);
  dht.begin();
  startRadio();
  LoRa.setTxPower(14);          // dBm, EU 868 MHz limit
}

void loop() {
  float t = dht.readTemperature(), h = dht.readHumidity();
  if (isnan(t) || isnan(h)) { delay(2000); return; }
  int smokeMv = analogReadMilliVolts(SMOKE_PIN);
  bool smoke = smokeMv > SMOKE_LIMIT;
  bool flame = digitalRead(FLAME_PIN) == LOW;
  int level = fireLevel(t, h, smoke, flame);
  Serial.printf("T %.1f C  RH %.0f %%  smoke %d mV  flame %d -> %s\\n", t, h, smokeMv, flame, LEVELS[level]);

  bool rising = level > lastLevel && level >= 2;
  if (seq == 0 || rising || millis() - lastSend >= REPORT_MS) {
    LoRa.beginPacket();
    LoRa.printf("FW07 #%d %s T%.1f H%.0f S%d F%d", seq++, LEVELS[level], t, h, smokeMv, flame);
    LoRa.endPacket();
    lastSend = millis();
    Serial.println("  LoRa packet sent");
  }
  lastLevel = level;
  delay(2000);                  // DHT22: one reading every 2 s at most
}
#endif`,
    params: { smoke: { value: 900, min: 350, max: 2400 }, report: { value: 30, min: 5, max: 900 } },
    async setup(io, b) {
      Object.assign(b, { lastLevel: -1, seq: 0, lastSend: 0 });
      b.st.packets = []; b.st.running = true; b.browser.update();
      io.line('pinMode(FLAME_PIN'); await io.delay(60);
      io.line('dht.begin()'); await io.delay(60);
      io.line('LoRa.setPins'); io.pin('GPIO5', 'CS', true); await io.delay(80);
      io.line('LoRa.begin(FREQ)'); io.print('LoRa 868 MHz OK'); await io.delay(100);
      io.line('LoRa.setSpreadingFactor(10)'); io.line('LoRa.setTxPower(14)'); await io.delay(60);
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('float t = dht.readTemperature()');
      const t = Math.round((st.t + noise(0.15)) * 10) / 10, h = Math.round(st.h + noise(0.8));
      io.pin('GPIO4', `${t.toFixed(1)}°C ${h}%`, true);
      await io.delay(30);
      io.line('int smokeMv = analogReadMilliVolts');
      // smoke at the post: clean air ≈ 300 mV at the pin; drifts up with the fire's smoke reaching it
      const smokeMv = Math.round(300 + 2000 * st.fire ** 0.8 + noise(15));
      io.pin('GPIO34', `${smokeMv} mV`, true);
      const smoke = smokeMv > p.smoke;
      io.line('bool flame = digitalRead'); io.pin('GPIO35', st.flame ? 'LOW' : 'HIGH', st.flame);
      const flame = st.flame;
      io.line('int level = fireLevel');
      const a = h / 20 + (27 - t) / 10;
      const level = smoke && flame ? 5 : smoke || flame ? 4 : a > 4 ? 0 : a > 2.5 ? 1 : a > 2 ? 2 : 3;
      const LV = ['LOW', 'MODERATE', 'HIGH', 'EXTREME', 'ALERT', 'FIRE'];
      io.line('Serial.printf("T %.1f'); io.print(`T ${t.toFixed(1)} C  RH ${h} %  smoke ${smokeMv} mV  flame ${flame ? 1 : 0} -> ${LV[level]}`);
      const rising = level > b.lastLevel && level >= 2;
      if (b.seq === 0 || rising || now() - b.lastSend >= p.report * 1000) {
        io.line('LoRa.beginPacket()');
        const msg = `FW07 #${b.seq++} ${LV[level]} T${t.toFixed(1)} H${h} S${smokeMv} F${flame ? 1 : 0}`;
        io.line('LoRa.printf'); b.lora.transmit(); b.post.transmit?.(); io.pin('GPIO18', 'SPI', true);
        await io.delay(370); // ≈ time on air for ~40 bytes at SF10 / 125 kHz
        io.line('LoRa.endPacket()'); b.lastSend = now();
        io.line('Serial.println("  LoRa packet sent")'); io.print('  LoRa packet sent');
        b.lora2.transmit(0.4);
        const rssi = Math.round(-108 + noise(4));
        st.packets.push({ msg, rssi });
        b.base.setBuiltinLed(level >= 4 ? 1 : 0);
        b.browser.update();
      }
      b.lastLevel = level;
      io.line('delay(2000)'); await io.delay(1800);
    },
    reset(b) { b.st.running = false; b.base.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ 6 farm
  {
    id: 'eco-smart-farm', title: 'Smart irrigation', icon: 'plant',
    thumb: () => makeFieldBed(v(0, 0, 0), { zones: 2, zoneW: 5 }).group,
    view: { center: [1.5, 3, -6], size: 46, az: -4 },
    build(ctx) {
      const b = ctx.board;
      ctx.step('Breadboard behind the ESP32, nearer the field: its back rails carry 3.3 V and GND');
      const bb = ctx.breadboard(0, -5.8);
      ctx.wire(b.pin('3V3'), bb.hole(27, 'bot+'), 'red', { signal: '3V3', lift: 1.4 });
      ctx.wire(b.pin('GND'), bb.hole(15, 'bot-'), 'black', { signal: 'GND', dir: -1, lift: 1.0 });
      ctx.step('The raised bed: two zones, each with a soil probe and a 12 V drip valve');
      const bed = ctx.add(makeFieldBed(v(-4, 0, -16.5), { zones: 2, rotY: Math.PI }));
      ctx.step('Water tank with a submersible pump and a low-level float switch');
      const tank = ctx.add(makeWaterTank(v(12, 0, -14.5), { sonar: false, tubeEnd: bed.inlet }));
      tank.extras.forEach((o) => ctx.addObject(o));
      ctx.step('Rain sensor plate and its comparator board');
      const rain = ctx.add(makeRainSensor(v(-17, 0, -3), { cloud: true }));
      ctx.step('3-channel relay board (high-level trigger) and the 12 V battery box');
      const rel = ctx.add(makeRelayBoard(v(8.5, 0, 4.5), { channels: 3 }));
      const pwr = ctx.add(makePowerBox(v(19, 0, 4.5)));
      ctx.step('Soil probes: 3V3 / GND from the rails, AOUT1 → GPIO34, AOUT2 → GPIO35');
      ctx.wire(bed.pin('VCC1'), bb.hole(3, 'top+'), 'red', { lift: 1.8 });
      ctx.wire(bed.pin('GND1'), bb.hole(4, 'top-'), 'black', { lift: 1.6, dir: -1 });
      ctx.wire(bed.pin('VCC2'), bb.hole(1, 'top+'), 'red', { lift: 2.0 });
      ctx.wire(bed.pin('GND2'), bb.hole(2, 'top-'), 'black', { lift: 1.8, dir: -1 });
      const wS1 = ctx.wire(bed.pin('AOUT1'), b.pin('GPIO34'), 'green', { signal: 'GPIO34', lift: 3.0, dir: -1 });
      ctx.wire(bed.pin('AOUT2'), b.pin('GPIO35'), 'green', { signal: 'GPIO35', lift: 3.4, dir: -1 });
      ctx.step('Jumper the back rails to the front rails');
      ctx.wire(bb.hole(29, 'bot+'), bb.hole(29, 'top+'), 'red', { lift: 0.6 });
      ctx.wire(bb.hole(30, 'bot-'), bb.hole(30, 'top-'), 'black', { lift: 0.5, dir: -1 });
      ctx.step('Rain sensor: VCC / GND to the rails, AO → GPIO32');
      ctx.wire(rain.pin('VCC'), bb.hole(6, 'top+'), 'red', { lift: 2.0 });
      ctx.wire(rain.pin('GND'), bb.hole(7, 'top-'), 'black', { lift: 1.8, dir: -1 });
      const wRain = ctx.wire(rain.pin('AO'), b.pin('GPIO32'), 'blue', { signal: 'GPIO32', lift: 2.2, dir: -1 });
      ctx.step('Float switch: FLOAT → GPIO27 (INPUT_PULLUP), other lead to GND');
      const wFl = ctx.wire(tank.pin('FLOAT'), b.pin('GPIO27'), 'yellow', { signal: 'GPIO27', lift: 3.0, dir: -1 });
      ctx.wire(tank.pin('FLOAT_G'), bb.hole(26, 'top-'), 'black', { lift: 2.6, dir: -1 });
      ctx.step('Relay inputs: IN1 pump GPIO25, IN2 valve 1 GPIO26, IN3 valve 2 GPIO33; VCC from VIN');
      const wIn1 = ctx.wire(b.pin('GPIO25'), rel.pin('IN1'), 'orange', { signal: 'GPIO25', lift: 2.0 });
      ctx.wire(b.pin('GPIO26'), rel.pin('IN2'), 'orange', { signal: 'GPIO26', lift: 2.2 });
      ctx.wire(b.pin('GPIO33'), rel.pin('IN3'), 'orange', { signal: 'GPIO33', lift: 2.4 });
      ctx.wire(b.pin('VIN'), rel.pin('VCC'), 'red', { signal: '5V', lift: 2.6 });
      ctx.wire(b.pin('GND_2'), rel.pin('GND'), 'black', { lift: 1.8, dir: -1 });
      ctx.step('12 V side: LOAD+ to every COM, each NO to its load, loads back to LOAD-');
      const pw = [
        ctx.wire(pwr.pin('LOAD+'), rel.pin('COM3'), 'red', { lift: 2.0 }),
        ctx.wire(rel.pin('COM3'), rel.pin('COM2'), 'red', { lift: 0.8 }),
        ctx.wire(rel.pin('COM2'), rel.pin('COM1'), 'red', { lift: 0.8 }),
      ];
      const pPump = ctx.wire(rel.pin('NO1'), tank.pin('PUMP+'), 'red', { lift: 3.0 });
      const pV1 = ctx.wire(rel.pin('NO2'), bed.pin('V1+'), 'red', { lift: 3.2 });
      const pV2 = ctx.wire(rel.pin('NO3'), bed.pin('V2+'), 'red', { lift: 3.6 });
      const nPump = ctx.wire(pwr.pin('LOAD-'), tank.pin('PUMP-'), 'black', { lift: 3.4, dir: -1 });
      const nV1 = ctx.wire(tank.pin('PUMP-'), bed.pin('V1-'), 'black', { lift: 2.4, dir: -1 });
      const nV2 = ctx.wire(bed.pin('V1-'), bed.pin('V2-'), 'black', { lift: 1.6, dir: -1 });

      const st = { m: [0.42, 0.62], sun: 1.2, rainNow: false, forecast: 15, level: 0.7, saved: 0, used: 0, skipped: [false, false], running: false, pump: false, valve: [false, false] };
      bed.setMoisture(0, st.m[0]); bed.setMoisture(1, st.m[1]);
      ctx.onTick((dt) => {
        if (!st.running) return;
        // simulated clock: 1 s here = 1 minute in the field
        for (let z = 0; z < 2; z++) {
          let m = st.m[z] - (st.sun / 100) * dt * (z ? 0.8 : 1);
          if (st.rainNow) m += 0.012 * dt;
          if (st.pump && st.valve[z]) m += 0.045 * dt;
          st.m[z] = clamp(m, 0, 1);
          bed.setMoisture(z, st.m[z]);
        }
        if (st.pump) st.level = clamp(st.level - 0.004 * dt, 0, 1);
        tank.setLevel(st.level);
        rain.setRain(st.rainNow);
        rain.setWet(clamp((rain.wet ?? 0) + (st.rainNow ? 0.3 : -0.04) * dt, 0, 1));
      });
      ctx.interact(rain, {
        name: 'Weather', hint: 'Rain now, and the forecast the ESP32 downloads',
        controls: [
          { type: 'toggle', label: 'Raining now', get: () => st.rainNow, set: (x) => (st.rainNow = x) },
          { type: 'range', label: 'Forecast: chance of rain (next 6 h)', min: 0, max: 100, step: 5, get: () => st.forecast, set: (x) => (st.forecast = x), format: (x) => `${x} %` },
          { type: 'range', label: 'Sun (drying)', min: 0, max: 4, step: 0.2, get: () => st.sun, set: (x) => (st.sun = x), format: (x) => `${Number(x).toFixed(1)} % / min` },
        ],
      });
      ctx.interact(bed, {
        name: 'Field bed', hint: 'Set each zone’s soil moisture',
        controls: [0, 1].map((z) => ({ type: 'range', label: `Zone ${z + 1} moisture`, min: 0, max: 100, step: 1, get: () => Math.round(st.m[z] * 100), set: (x) => { st.m[z] = x / 100; bed.setMoisture(z, st.m[z]); }, format: (x) => `${x} %` })),
      });
      ctx.interact(tank, {
        name: 'Water tank', hint: 'Fill it or let it run low',
        controls: [{ type: 'range', label: 'Water level', min: 0, max: 100, step: 1, get: () => Math.round(st.level * 100), set: (x) => { st.level = x / 100; tank.setLevel(st.level); }, format: (x) => `${x} %` }],
        note: () => `Float switch ${tank.floatClosed ? 'closed (water OK)' : 'open (tank low)'}`,
      });
      ctx.interact(rel, { name: 'Relay board', hint: 'CH1 pump, CH2 valve 1, CH3 valve 2' });
      const plot = ctx.plotter({ title: 'Soil and water saved', series: [{ name: 'zone 1 %', color: '#3aa65a', min: 0, max: 100 }, { name: 'zone 2 %', color: '#7a4a26', min: 0, max: 100 }, { name: 'saved L', color: '#3a6fd0', min: 0, max: 60 }] });
      ctx.anchor('bed', bed.zoneAnchor(0));
      ctx.anchor('tank', tank.anchor);
      ctx.anchor('rain', rain.cloudAnchor);
      ctx.anchor('rel', rel.anchor);
      ctx.anchor('soil', wS1.mid);
      ctx.anchor('float', wFl.mid);
      ctx.anchor('wrain', wRain.mid);
      return { st, bed, tank, rain, rel, plot, pw, pPump, pV1, pV2, nPump, nV1, nV2 };
    },
    callouts: [
      { anchor: 'rain', x: 0.04, y: 0.17, icon: 'wave', title: 'Rain now + forecast', text: 'The plate senses rain; Open-Meteo gives the chance of rain for the next 6 h.' },
      { anchor: 'bed', x: 0.36, y: 0.12, icon: 'plant', title: 'Two zones', text: 'Each zone is watered only when its own probe says it is dry.' },
      { anchor: 'tank', x: 0.7, y: 0.17, icon: 'motor', title: 'Tank + pump', text: 'The float switch stops the pump before it can run dry.' },
      { anchor: 'rel', x: 0.36, y: 0.74, icon: 'bolt', title: 'Relays on 12 V', text: 'CH1 pump, CH2 / CH3 valves; open the valve first, then start the pump.' },
      { anchor: 'soil', x: 0.04, y: 0.68, icon: 'pins', title: 'Probes · GPIO34 / 35', text: 'Capacitive probes: the voltage falls as the soil gets wetter.' },
    ],
    overview: {
      heading: 'Smart irrigation',
      text: 'Grow the smart plant waterer (<b>Smart plant waterer</b>) into a farm controller: two zones, a pump with valves on relays (<b>Relays</b>), a rain sensor, and a weather forecast fetched over HTTPS (<b>Connect to Wi-Fi</b>). It skips watering when rain is coming, and the plotter counts the water saved.',
      features: [['plant', 'Per-zone hysteresis with a time limit and a dry-run guard'], ['globe', 'HTTPClient + ArduinoJson: Open-Meteo precipitation probability'], ['wave', 'Counts the litres not pumped because rain was on its way']],
    },
    pinout: [
      ['GPIO34 / GPIO35', 'Zone 1 / zone 2 AOUT', 'Capacitive probes, 3.3 V'],
      ['GPIO32', 'Rain board AO', 'Falls when the plate is wet'],
      ['GPIO27', 'Float switch', 'INPUT_PULLUP, LOW = water above the float'],
      ['GPIO25 / 26 / 33', 'Relay IN1 / IN2 / IN3', 'Pump, valve 1, valve 2 (HIGH = on)'],
      ['VIN / GND_2', 'Relay VCC / GND', '5 V coils'],
      ['LOAD+ → COM1–3', 'NO1 pump, NO2 valve 1, NO3 valve 2', '12 V side, separate from the ESP32'],
      ['Loads –', 'Daisy-chained to LOAD-', ''],
    ],
    example: {
      text: 'Farms and city parks save 20–50 % of their irrigation water with soil-moisture and weather-based controllers compared with plain timers. Less water also means less fertiliser washed into rivers.',
      points: ['Set the forecast to 80 % and watch the zones wait for the rain instead of watering', 'Empty the tank: the float switch blocks the pump', 'Turn the sun up: zone 1 dries faster and gets watered more often'],
    },
    specs: [
      ['Probes', 'Capacitive v1.2, ≈ 3200 raw dry → 1300 wet (12-bit, calibrate)'],
      ['Pump', '12 V submersible, ≈ 2 L/min'],
      ['Valves', '12 V normally-closed solenoid, ≈ 0.4 A each'],
      ['Forecast', 'api.open-meteo.com, no key, every 30 min'],
      ['Libraries', 'WiFi, HTTPClient, ArduinoJson 7'],
      ['Simulation', '1 s = 1 minute in the field; the forecast is set by you'],
    ],
    quiz: [
      { q: 'Why open the valve before starting the pump?', options: ['So the pump never pushes against a closed valve and builds pressure', 'To save power', 'The relay needs it', 'It does not matter'], answer: 0, explain: 'Dead-heading a pump stresses it and the pipes; open the path first, stop the pump first.' },
      { q: 'The soil in zone 2 is dry, but the forecast says 70 % chance of rain and SKIP_RAIN_PCT is 60. What happens?', options: ['Zone 2 is watered', 'Zone 2 is skipped: “skip: rain”', 'Both zones are watered', 'The pump runs dry'], answer: 1, explain: 'rainChance ≥ SKIP_RAIN_PCT skips watering, saving water the rain will provide.' },
      { q: 'What is the float switch for?', options: ['Measuring rain', 'Stopping the pump when the tank is nearly empty', 'Measuring soil moisture', 'Opening the valves'], answer: 1, explain: 'A pump running dry overheats; the float only closes while water lifts it.' },
      { q: 'Why does a capacitive probe’s reading fall as the soil gets wetter?', options: ['Water raises the probe’s capacitance, which lowers the output of its circuit', 'Water is a battery', 'The probe heats up', 'It rises'], answer: 0, explain: 'That is why DRY_RAW is larger than WET_RAW in the map() call.' },
    ],
    challenges: ['Water zones at night only (use the time from <code>configTime()</code>) to lose less to evaporation.', 'Log the litres used per zone per day to the serial monitor.', 'Add the tank’s ultrasonic sensor and refuse to water below 15 % instead of using the float.'],
    code: `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* SSID = "your-wifi";
const char* PASS = "your-password";
const char* FORECAST = "https://api.open-meteo.com/v1/forecast?latitude=52.52"
    "&longitude=13.41&hourly=precipitation_probability&forecast_hours=6";
const int SOIL_PIN[2] = {34, 35};
const int VALVE_PIN[2] = {26, 33};
const int PUMP_PIN = 25, RAIN_PIN = 32, FLOAT_PIN = 27;
const int DRY_RAW = 3200, WET_RAW = 1300;   // calibrate each probe
const int START_PCT = {{start}}, STOP_PCT = {{stop}};
const int SKIP_RAIN_PCT = {{skip}};           // skip if rain this likely in 6 h
const int RAIN_WET_RAW = 2500;              // rain plate AO falls when wet
const unsigned long MAX_WATER_MS = 20 * 60000UL;  // per zone, per check
const float PUMP_LPM = 2.0;                 // litres per minute (measured)
const float L_PER_PCT = 0.45;               // litres to raise one zone by 1 %

int rainChance = 0;
unsigned long lastForecast = 0;
float litres = 0, savedL = 0;
bool skipped[2] = {false, false};

int soilPct(int z) {
  return constrain(map(analogRead(SOIL_PIN[z]), DRY_RAW, WET_RAW, 0, 100), 0, 100);
}

void getForecast() {
  HTTPClient http;
  http.begin(FORECAST);
  if (http.GET() == 200) {
    JsonDocument doc;
    if (!deserializeJson(doc, http.getString())) {
      rainChance = 0;
      for (JsonVariant p : doc["hourly"]["precipitation_probability"].as<JsonArray>())
        rainChance = max(rainChance, p.as<int>());
    }
  }
  http.end();
}

void water(int z) {
  Serial.printf("Zone %d: watering\\n", z + 1);
  digitalWrite(VALVE_PIN[z], HIGH);         // open the valve first...
  delay(200);
  digitalWrite(PUMP_PIN, HIGH);             // ...then start the pump
  unsigned long t0 = millis();
  while (soilPct(z) < STOP_PCT && millis() - t0 < MAX_WATER_MS &&
         digitalRead(FLOAT_PIN) == LOW) delay(500);
  digitalWrite(PUMP_PIN, LOW);
  delay(200);
  digitalWrite(VALVE_PIN[z], LOW);
  float used = (millis() - t0) / 60000.0 * PUMP_LPM;
  litres += used;
  Serial.printf("Zone %d: %.1f L, now %d%%\\n", z + 1, used, soilPct(z));
}

void setup() {
  Serial.begin(115200);
  for (int p : {PUMP_PIN, VALVE_PIN[0], VALVE_PIN[1]}) { pinMode(p, OUTPUT); digitalWrite(p, LOW); }
  pinMode(FLOAT_PIN, INPUT_PULLUP);
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) delay(250);
}

void loop() {
  if (lastForecast == 0 || millis() - lastForecast > 30 * 60000UL) {
    getForecast();
    lastForecast = millis();
  }
  bool raining = analogRead(RAIN_PIN) < RAIN_WET_RAW;
  bool tankOk = digitalRead(FLOAT_PIN) == LOW;
  for (int z = 0; z < 2; z++) {
    int pct = soilPct(z);
    Serial.printf("Zone %d soil %d%%  rain %s  forecast %d%%  tank %s\\n", z + 1, pct,
                  raining ? "yes" : "no", rainChance, tankOk ? "ok" : "LOW");
    if (pct >= START_PCT) { skipped[z] = false; continue; }
    if (raining || rainChance >= SKIP_RAIN_PCT) {
      if (!skipped[z]) savedL += (STOP_PCT - pct) * L_PER_PCT;   // count each skip once
      skipped[z] = true;
      Serial.println("  skip: rain");
      continue;
    }
    if (!tankOk) { Serial.println("  skip: tank low"); continue; }
    water(z);
  }
  Serial.printf("Used %.1f L, saved %.1f L\\n", litres, savedL);
  delay(60000);                             // check once a minute
}`,
    params: { start: { value: 35, min: 5, max: 80 }, stop: { value: 60, min: 20, max: 95 }, skip: { value: 60, min: 10, max: 100 } },
    async setup(io, b) {
      const st = b.st;
      Object.assign(st, { running: true, used: 0, saved: 0, skipped: [false, false], rainChance: 0, lastForecast: -1e9 });
      b.plot.reset();
      io.line('pinMode(p, OUTPUT)'); await io.delay(60);
      io.line('pinMode(FLOAT_PIN, INPUT_PULLUP)'); await io.delay(60);
      await joinWifi(io);
    },
    async loop(io, b, p) {
      const st = b.st;
      const raw = (z) => Math.round(3200 - st.m[z] * 1900 + noise(10));
      const pct = (z) => clamp(Math.trunc(((raw(z) - 3200) * 100) / (1300 - 3200)), 0, 100);
      const setRelay = (i, on) => {
        b.rel.set(i, on);
        if (i === 0) { st.pump = on; b.tank.setPump(on); }
        else { st.valve[i - 1] = on; b.bed.setValve(i - 1, on); }
        const live = st.pump && (st.valve[0] || st.valve[1]);
        b.pw.forEach((w) => (w.live = st.pump || st.valve[0] || st.valve[1]));
        b.pPump.live = b.nPump.live = st.pump;
        b.pV1.live = b.nV1.live = st.valve[0];
        b.pV2.live = b.nV2.live = st.valve[1];
        return live;
      };
      if (now() - st.lastForecast > 30000) {
        st.lastForecast = now();
        io.line('getForecast();'); io.line('http.GET()');
        io.print('GET api.open-meteo.com … 200'); await io.delay(250);
        io.line('rainChance = max(rainChance'); st.rainChance = st.forecast;
      }
      st.rainChance = st.forecast; // the forecast you set is what the next download returns
      io.line('bool raining = analogRead(RAIN_PIN)');
      const rainRaw = Math.round(3900 - b.rain.wet * 2600 + noise(20));
      io.pin('GPIO32', String(rainRaw), false);
      const raining = rainRaw < 2500;
      io.line('bool tankOk = digitalRead');
      const tankOk = b.tank.floatClosed;
      io.pin('GPIO27', tankOk ? 'LOW' : 'HIGH', false);
      for (let z = 0; z < 2; z++) {
        const pc = pct(z);
        io.line('int pct = soilPct(z);'); io.pin(z ? 'GPIO35' : 'GPIO34', `${pc}%`, true);
        io.line('Serial.printf("Zone %d soil'); io.print(`Zone ${z + 1} soil ${pc}%  rain ${raining ? 'yes' : 'no'}  forecast ${st.rainChance}%  tank ${tankOk ? 'ok' : 'LOW'}`);
        await io.delay(120);
        if (pc >= p.start) { io.line('if (pct >= START_PCT) { skipped[z] = false;'); st.skipped[z] = false; continue; }
        if (raining || st.rainChance >= p.skip) {
          io.line('if (!skipped[z]) savedL');
          if (!st.skipped[z]) st.saved += Math.max(0, p.stop - pc) * 0.45;
          st.skipped[z] = true;
          io.line('Serial.println("  skip: rain")'); io.print('  skip: rain'); continue;
        }
        if (!tankOk) { io.line('Serial.println("  skip: tank low")'); io.print('  skip: tank low'); continue; }
        io.line('water(z);'); io.line('Serial.printf("Zone %d: watering'); io.print(`Zone ${z + 1}: watering`);
        io.line('digitalWrite(VALVE_PIN[z], HIGH)'); setRelay(z + 1, true); io.pin(z ? 'GPIO33' : 'GPIO26', 'HIGH', true);
        await io.delay(200);
        io.line('digitalWrite(PUMP_PIN, HIGH)'); setRelay(0, true); io.pin('GPIO25', 'HIGH', true);
        const t0 = now();
        // each simulated second is a field minute: MAX_WATER_MS (20 min) → 20 s
        while (pct(z) < p.stop && now() - t0 < 20000 && b.tank.floatClosed) {
          io.line('while (soilPct(z) < STOP_PCT'); io.pin(z ? 'GPIO35' : 'GPIO34', `${pct(z)}%`, true);
          await io.delay(250);
          if (!st.running) return;
        }
        io.line('digitalWrite(PUMP_PIN, LOW)'); setRelay(0, false); io.pin('GPIO25', 'LOW', false);
        await io.delay(200);
        io.line('digitalWrite(VALVE_PIN[z], LOW)'); setRelay(z + 1, false); io.pin(z ? 'GPIO33' : 'GPIO26', 'LOW', false);
        const used = ((now() - t0) / 1000) * 2; // field minutes × 2 L/min
        st.used += used;
        io.line('Serial.printf("Zone %d: %.1f L'); io.print(`Zone ${z + 1}: ${used.toFixed(1)} L, now ${pct(z)}%`);
      }
      io.line('Serial.printf("Used %.1f L'); io.print(`Used ${st.used.toFixed(1)} L, saved ${st.saved.toFixed(1)} L`);
      b.plot.push(st.m[0] * 100, st.m[1] * 100, st.saved);
      io.line('delay(60000)'); await io.delay(1000);
    },
    reset(b) {
      const st = b.st;
      st.running = false;
      [0, 1, 2].forEach((i) => b.rel.set(i, false));
      st.pump = false; st.valve = [false, false];
      b.tank.setPump(false); b.bed.setValve(0, false); b.bed.setValve(1, false);
      [b.pPump, b.nPump, b.pV1, b.nV1, b.pV2, b.nV2, ...b.pw].forEach((w) => (w.live = false));
      b.plot.reset();
    },
  },
];

// ---------------------------------------------------------------- AQI + TDS helpers (simulation side)
const PM25T = [[0, 9.0, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300], [225.5, 325.4, 301, 500]];
const PM10T = [[0, 54, 0, 50], [55, 154, 51, 100], [155, 254, 101, 150], [255, 354, 151, 200], [355, 424, 201, 300], [425, 604, 301, 500]];
function aqiOf(t, c) {
  for (const [cl, ch, il, ih] of t) if (c <= ch) return Math.round(((ih - il) / (ch - cl)) * (c - cl) + il);
  return 500;
}
function category(a) {
  if (a <= 50) return 'Good';
  if (a <= 100) return 'Moderate';
  if (a <= 150) return 'Unhealthy for sensitive groups';
  if (a <= 200) return 'Unhealthy';
  if (a <= 300) return 'Very unhealthy';
  return 'Hazardous';
}
/** Raw TDS-board voltage (mV) for a true TDS (ppm at 25 °C) at water temperature T: inverts the DFRobot polynomial. */
function tdsMillivolts(tds, T) {
  const f = (x) => (133.42 * x ** 3 - 255.86 * x ** 2 + 857.39 * x) * 0.5;
  let lo = 0, hi = 2.6;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (f(m) < tds) lo = m; else hi = m; }
  return ((lo + hi) / 2) * (1 + 0.02 * (T - 25)) * 1000;
}

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['gear', 'Micro wind turbine', '0.5 m rotor driving a 12 V DC generator; power rises with the cube of wind speed.', 'eco-wind-turbine'],
  ['wave', 'Cup anemometer', 'Three cups spin a magnet past a reed switch: 0.667 m/s per pulse per second.', 'eco-wind-turbine'],
  ['bolt', 'INA219', 'High-side current and voltage monitor on I²C with a 0.1 Ω shunt (±3.2 A).', 'eco-wind-turbine'],
  ['resistor', 'Voltage divider module', 'Two resistors that scale a high voltage into the ADC range.', 'eco-wind-turbine'],
  ['bolt', 'Charge controller + battery', 'Charges a 12 V battery from a turbine or panel and feeds the loads.', 'eco-wind-turbine'],
  ['resistor', 'Dump load', 'Power resistor that turns surplus or braking energy into heat.', 'eco-wind-turbine'],
  ['sun', 'Dual-axis solar tracker', 'Pan and tilt servos aim a panel using four LDRs in a cross-shaped shade.', 'eco-solar-tracker'],
  ['sun', 'Solar panel', 'Photovoltaic module: power ∝ light × cos(angle to the sun).', 'eco-solar-tracker'],
  ['wave', 'PMS5003', 'Laser particle counter: PM1.0, PM2.5 and PM10 over a 3.3 V UART.', 'eco-air-station'],
  ['thermo', 'SGP30', 'Metal-oxide gas sensor: TVOC and an eCO₂ estimate over I²C.', 'eco-air-station'],
  ['thermo', 'pH probe + board', 'Glass electrode whose voltage changes ≈ 59 mV per pH unit, amplified for an ADC.', 'eco-water-quality'],
  ['wave', 'TDS probe + board', 'Conductivity probe that estimates dissolved solids in ppm.', 'eco-water-quality'],
  ['thermo', 'DS18B20', 'Waterproof digital thermometer on a one-wire bus.', 'eco-water-quality'],
  ['radar', 'Wildfire sensor post', 'Smoke, flame and weather sensors on a solar pole with a LoRa antenna.', 'eco-wildfire'],
  ['globe', 'LoRa SX1276', 'Long-range, low-power radio for small packets over kilometres.', 'eco-wildfire'],
  ['plant', 'Raised field bed', 'Two irrigation zones with capacitive soil probes and drip valves.', 'eco-smart-farm'],
  ['motor', 'Water tank + pump', 'Tank with a submersible pump and a low-level float switch.', 'eco-smart-farm'],
  ['wave', 'Rain sensor', 'Interleaved traces that conduct when wet, with an LM393 comparator board.', 'eco-smart-farm'],
  ['bolt', 'Relay board (3-channel)', 'Three relays switch the 12 V pump and valves from 3.3 V logic.', 'eco-smart-farm'],
];
