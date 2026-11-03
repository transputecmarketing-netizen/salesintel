// Track 2 (second half) — Sensors & Inputs: joysticks, force, encoders, tilt,
// IR remotes and keypads on an Uno-style board.
import * as THREE from 'three';
import { makeResistor, makeLED, makeServo } from '../scene/components.js';
import {
  makeJoystick, makeFSR, makeRotaryEncoder, makeMPU6050, makeIRReceiver, makeRemote, makeKeypad,
} from '../scene/modules.js';
import { makeWire } from '../scene/wire.js';
import { glowSprite } from '../scene/kit.js';
import { v, BB, clamp, ledOnPin, ledGain } from './helpers.js';
import { serialPlotter, mpu6050Device } from '../runtime/devices.js';

/** Arduino map() with integer maths. */
const amap = (x, a, b, c, d) => Math.trunc(((x - a) * (d - c)) / (b - a) + c);
const noise = (n) => Math.round((Math.random() - 0.5) * 2 * n);

/** LED + resistor on the a–e side whose cathode drops straight into the top − rail. */
function railLed(ctx, bb, { pin, col, color, ohms = 220 }) {
  const res = ctx.add(makeResistor(bb.hole(col, 'c'), bb.hole(col + 4, 'c'), ohms));
  const led = ctx.add(makeLED(color, bb.hole(col + 4, 'a'), bb.hole(col + 4, 'top-')));
  const sig = ctx.wire(ctx.board.pin(pin), bb.hole(col, 'a'), 'orange', { signal: pin });
  const gain = ledGain(ohms);
  return { res, led, sig, on: (x = 1) => led.set(x * gain) };
}

/**
 * A jumper whose far end follows a moving pin (e.g. a tilting module).
 * Registers a normal ctx.wire (so signals/chips work) and rebuilds its
 * geometry on update().
 */
function followWire(ctx, from, toFn, color, opts = {}) {
  const w = ctx.wire(from, toFn(), color, opts);
  const update = () => {
    const nw = makeWire(from, toFn(), color, opts);
    for (const c of [...w.group.children]) {
      w.group.remove(c);
      c.traverse((o) => { if (o.geometry && !o.isInstancedMesh) o.geometry.dispose(); });
    }
    for (const c of [...nw.group.children]) w.group.add(c);
    w.curve = nw.curve;
    w.mid = nw.mid;
    w.chipAt = nw.chipAt;
    w.tick = (dt, flow) => {
      nw.live = w.live;
      nw.speed = w.speed;
      nw.dir = w.dir;
      nw.tick(dt, flow);
    };
  };
  return { w, update };
}

// NEC command codes of the common 17-key remote (IRremote v3+/v4 `command` byte).
const IR_CODES = {
  '1': 0x45, '2': 0x46, '3': 0x47, '4': 0x44, '5': 0x40, '6': 0x43, '7': 0x07, '8': 0x15, '9': 0x09,
  '*': 0x16, '0': 0x19, '#': 0x0d, '▲': 0x18, '◄': 0x08, 'OK': 0x1c, '►': 0x5a, '▼': 0x52,
};
const hex = (n) => n.toString(16).toUpperCase();

export const sensorsB = [
  // ------------------------------------------------------------------ joystick
  {
    id: 'joystick', level: 'Intermediate', title: 'Read a joystick', icon: 'knob',
    thumb: () => { const j = makeJoystick(v(0, 0, 0)); j.set(0.5, 0.4); return j.group; },
    view: { center: [5.4, 0.8, 1.4], size: 17 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      // power rails
      ctx.wire(ctx.board.pin('5V'), bb.hole(2, 'bot+'), 'red', { signal: '5V' });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(3, 'bot-'), 'black', { signal: 'GND', dir: -1 });
      const joy = ctx.add(makeJoystick(v(7.6, 0, 5.0)));
      ctx.wire(joy.pin('GND'), bb.hole(6, 'bot-'), 'black', { signal: 'GND', dir: -1, lift: 0.9 });
      ctx.wire(joy.pin('+5V'), bb.hole(7, 'bot+'), 'red', { signal: '5V', lift: 0.8 });
      const wx = ctx.wire(joy.pin('VRX'), ctx.board.pin('A0'), 'green', { signal: 'A0', dir: -1 });
      ctx.wire(joy.pin('VRY'), ctx.board.pin('A1'), 'blue', { signal: 'A1', dir: -1 });
      const wsw = ctx.wire(joy.pin('SW'), ctx.board.pin('D2'), 'yellow', { signal: 'D2', dir: -1, lift: 2.6 });
      const servo = ctx.add(makeServo(v(11.4, 0, 4.4)));
      const [sg, sp, ss] = servo.leads;
      ctx.wire(sg, bb.hole(27, 'bot-'), 'brown', { signal: 'GND', dir: -1, lift: 0.8 });
      ctx.wire(sp, bb.hole(28, 'bot+'), 'red', { signal: '5V', lift: 0.9 });
      const wsig = ctx.wire(ss, ctx.board.pin('D9'), 'orange', { signal: 'D9', dir: -1, lift: 2.8 });
      servo.set(90);
      const state = { x: 0, y: 0, auto: false, t: 0, running: false };
      const setXY = (x, y) => { state.x = clamp(x, -1, 1); state.y = clamp(y, -1, 1); joy.set(state.x, state.y); };
      ctx.onTick((dt) => {
        if (!state.auto) return;
        state.t += dt * 1.3;
        setXY(Math.cos(state.t) * 0.9, Math.sin(state.t) * 0.9);
      });
      ctx.interact(joy, {
        name: 'Thumb joystick', hint: 'Move the stick and press it down',
        controls: [
          { type: 'range', label: 'X (left ↔ right)', min: -100, max: 100, step: 1, get: () => Math.round(state.x * 100), set: (x) => { state.auto = false; setXY(x / 100, state.y); }, format: (x) => `${x}%` },
          { type: 'range', label: 'Y (back ↔ forward)', min: -100, max: 100, step: 1, get: () => Math.round(state.y * 100), set: (y) => { state.auto = false; setXY(state.x, y / 100); }, format: (y) => `${y}%` },
          { type: 'button', label: 'Press SW (hold)', hold: true, down: () => joy.press(true), up: () => joy.press(false) },
          { type: 'button', label: 'Let go (spring back)', press: () => { state.auto = false; setXY(0, 0); } },
          { type: 'toggle', label: 'Circle automatically', get: () => state.auto, set: (on) => (state.auto = on) },
        ],
        note: () => `VRX ≈ ${Math.round(512 + state.x * 511)}, VRY ≈ ${Math.round(512 + state.y * 511)}${joy.pressed ? ' · SW pressed' : ''}`,
      });
      ctx.interact(servo, { name: 'Micro servo', hint: 'Its angle follows the joystick’s X axis' });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'X', color: '#2aa7a1', min: 0, max: 1023 }, { name: 'Y', color: '#3b78e7', min: 0, max: 1023 }, { name: 'SW', color: '#e5412e', min: -0.1, max: 1.2 }] });
      ctx.anchor('joy', joy.anchor);
      ctx.anchor('servo', servo.anchor);
      ctx.anchor('a0', wx.mid);
      ctx.anchor('sw', wsw.mid);
      ctx.anchor('sig', wsig.mid);
      return { joy, servo, plot, state };
    },
    hw: (b) => {
      b.state.running = true;
      return {
        analogRead: (ch) => (ch === 0 ? clamp(Math.round(512 + b.state.x * 511) + noise(3), 0, 1023) : ch === 1 ? clamp(Math.round(512 + b.state.y * 511) + noise(3), 0, 1023) : 0),
        digitalRead: (pin) => (pin === 2 && b.joy.pressed ? 0 : null),
        devices: { servo: (pin) => (pin === 9 ? { write: (deg) => b.servo.set(deg) } : null) },
        serialWrite: serialPlotter((x, y, sw) => b.plot.push(x, y, sw)),
      };
    },
    callouts: [
      { anchor: 'a0', x: 0.04, y: 0.17, icon: 'wave', title: 'VRX → A0, VRY → A1', text: 'Two pots inside: each axis gives 0–1023, about 512 at rest.' },
      { anchor: 'sw', x: 0.36, y: 0.12, icon: 'button', title: 'SW → pin 2', text: 'Pushing the stick down closes a switch to GND.' },
      { anchor: 'servo', x: 0.7, y: 0.17, icon: 'servo', title: 'Servo on pin 9', text: 'Points wherever the X axis tells it to.' },
      { anchor: 'joy', x: 0.04, y: 0.68, icon: 'hand', title: 'Joystick', text: 'Click it to move the stick, press it, or let it circle.' },
    ],
    overview: {
      heading: 'Read a joystick',
      text: 'A thumb joystick is two potentiometers at right angles plus a push switch. Read X and Y with <code>analogRead()</code>, the switch with <code>digitalRead()</code>, then steer a servo with the X axis.',
      features: [['hand', 'Click the stick to move it in X and Y'], ['wave', 'Watch both axes on the serial plotter'], ['servo', '<code>map()</code> turns 0–1023 into 0–180°']],
    },
    pinout: [['A0', 'VRX', 'Horizontal pot'], ['A1', 'VRY', 'Vertical pot'], ['D2', 'SW', 'INPUT_PULLUP, LOW when pressed'], ['D9', 'Servo signal', 'Orange'], ['5V / GND', 'Bottom rails → joystick + servo', 'Shared power']],
    example: {
      text: 'Game controllers, drone remotes, wheelchair controls and camera pan-tilt heads all read a joystick exactly like this.',
      points: ['Raise <code>DEADZONE</code> if the servo twitches at rest', 'Add a second servo on Y for a pan-tilt head', 'Open the serial plotter to see X, Y and SW as lines'],
    },
    specs: [['Module', 'KY-023-style dual-axis'], ['Pots', '2 × 10 kΩ'], ['Output', '0–5 V per axis (0–1023)'], ['Rest position', '≈ 512 (varies ± 20)'], ['Switch', 'Push to GND, needs a pull-up'], ['Library', '<code>Servo</code> (built in)']],
    quiz: [
      { q: 'What does analogRead() return for the X axis when the stick is centred?', options: ['0', 'About 512', '1023', '180'], answer: 1, explain: 'The pot’s wiper sits in the middle, giving about half of 5 V — roughly 512.' },
      { q: 'Why is SW read with INPUT_PULLUP?', options: ['The switch only connects SW to GND, so the pin needs a pull-up to read HIGH when released', 'To make it analog', 'To power the joystick', 'To make the servo faster'], answer: 0, explain: 'Without a pull-up the pin would float when the switch is open.' },
      { q: 'What is the dead zone for?', options: ['To ignore small wobbles around the centre', 'To limit the servo to 90°', 'To debounce the switch', 'To save power'], answer: 0, explain: 'Real sticks rarely rest at exactly 512, so tiny readings near the centre are treated as “centred”.' },
      { q: 'map(x, 0, 1023, 0, 180) with x = 1023 gives…', options: ['0', '90', '180', '1023'], answer: 2, explain: 'map() rescales one range onto another: the top of the input range becomes 180.' },
    ],
    challenges: ['Light the built-in LED only when the stick is pushed fully to one side.', 'Add a second servo on pin 10 driven by the Y axis to make a pan-tilt head.', 'Make the servo move gradually: nudge its angle a little each loop in the direction the stick points, and press SW to centre it.'],
    code: `#include <Servo.h>

const int X_PIN = A0;
const int Y_PIN = A1;
const int SW_PIN = 2;
const int DEADZONE = {{dead}};      // ignore wobble round the centre
Servo pan;

void setup() {
  pinMode(SW_PIN, INPUT_PULLUP);   // the switch pulls SW to GND
  pinMode(LED_BUILTIN, OUTPUT);
  pan.attach(9);
  Serial.begin(9600);
}

void loop() {
  int x = analogRead(X_PIN);        // 0 … ~512 … 1023
  int y = analogRead(Y_PIN);
  bool pressed = digitalRead(SW_PIN) == LOW;
  if (abs(x - 512) < DEADZONE) x = 512;
  pan.write(map(x, 0, 1023, 0, 180));
  digitalWrite(LED_BUILTIN, pressed ? HIGH : LOW);
  Serial.print("X:");
  Serial.print(x);
  Serial.print(" Y:");
  Serial.print(y);
  Serial.print(" SW:");
  Serial.println(pressed);
  delay({{rate}});
}`,
    params: { dead: { value: 20, min: 0, max: 200 }, rate: { value: 100, min: 20, max: 1000 } },
    async setup(io, b) {
      b.state.running = true;
      io.line('INPUT_PULLUP'); await io.delay(80);
      io.line('pan.attach'); await io.delay(80);
      io.line('Serial.begin'); await io.delay(60);
    },
    async loop(io, b, p) {
      io.line('analogRead(X_PIN)');
      let x = clamp(Math.round(512 + b.state.x * 511) + noise(3), 0, 1023);
      io.pin('A0', String(x), true);
      io.line('analogRead(Y_PIN)');
      const y = clamp(Math.round(512 + b.state.y * 511) + noise(3), 0, 1023);
      io.pin('A1', String(y), true);
      io.line('digitalRead(SW_PIN)');
      const pressed = b.joy.pressed;
      io.pin('D2', pressed ? 'LOW' : 'HIGH', pressed);
      io.line('abs(x - 512)');
      if (Math.abs(x - 512) < p.dead) x = 512;
      io.line('pan.write');
      const angle = amap(x, 0, 1023, 0, 180);
      b.servo.set(angle);
      io.pin('D9', `${angle}°`, true);
      io.line('digitalWrite(LED_BUILTIN');
      io.board.setBuiltinLed(pressed ? 1 : 0);
      io.line('Serial.println(pressed)');
      io.print(`X:${x} Y:${y} SW:${pressed ? 1 : 0}`);
      b.plot.push(x, y, pressed ? 1 : 0);
      io.line('delay('); await io.delay(p.rate);
    },
    reset(b, io) { b.state.running = false; b.servo.set(90); io?.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ force-sensor
  {
    id: 'force-sensor', level: 'Intermediate', title: 'Feel the force', icon: 'hand',
    thumb: () => { const f = makeFSR(v(0, 0, -2)); f.press(0.6); return f.group; },
    view: { center: [5.6, 0.6, 1.6], size: 17 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D9', col: 4, color: 'yellow' });
      // voltage divider: 5V → FSR → A0 node → 10 kΩ → GND
      const r10 = ctx.add(makeResistor(bb.hole(12, 'h'), bb.hole(16, 'h'), 10000));
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(12, 'f'), 'black', { signal: 'GND', dir: -1 });
      const a0 = ctx.wire(ctx.board.pin('A0'), bb.hole(16, 'f'), 'green', { signal: 'A0', dir: -1 });
      ctx.wire(ctx.board.pin('5V'), bb.hole(20, 'f'), 'red', { signal: '5V' });
      const fsr = ctx.add(makeFSR(v(2.3, 0, 5.8), { rotY: Math.PI / 2 }));
      ctx.wire(fsr.pin('P1'), bb.hole(16, 'j'), 'white', { lift: 1.2 });
      ctx.wire(fsr.pin('P2'), bb.hole(20, 'j'), 'red', { signal: '5V', lift: 1.5 });
      const state = { grams: 0, held: false, rFixed: 10000 };
      const apply = () => fsr.press(clamp(state.grams / 1000, 0, 1));
      ctx.interact(fsr, {
        name: 'Force-sensing resistor', hint: 'Press on the round pad',
        controls: [
          { type: 'range', label: 'Force', min: 0, max: 1000, step: 5, get: () => state.grams, set: (g) => { state.grams = g; apply(); }, format: (g) => `${g} g ≈ ${(g * 0.00981).toFixed(1)} N` },
          { type: 'button', label: 'Squeeze hard (hold)', hold: true, down: () => { state.held = state.grams; state.grams = 900; apply(); }, up: () => { state.grams = state.held || 0; apply(); } },
          { type: 'button', label: 'Let go', press: () => { state.grams = 0; apply(); } },
        ],
        note: () => {
          const r = state.grams < 2 ? Infinity : 700000 / state.grams;
          return `FSR ≈ ${r === Infinity ? 'over 1 MΩ (open)' : r >= 1000 ? `${(r / 1000).toFixed(1)} kΩ` : `${Math.round(r)} Ω`}`;
        },
      });
      ctx.interact(r10, {
        name: 'Fixed resistor', hint: 'Its value sets how sensitive the divider is',
        controls: [{ type: 'choice', label: 'Resistance', options: [[1000, '1 kΩ'], [3300, '3.3 kΩ'], [10000, '10 kΩ'], [47000, '47 kΩ']], get: () => state.rFixed, set: (o) => { state.rFixed = o; r10.setValue(o); } }],
        note: () => (state.rFixed > 10000 ? 'Bigger resistor: very sensitive to light touches, saturates early.' : state.rFixed < 10000 ? 'Smaller resistor: needs a firm press, better for heavy loads.' : '10 kΩ: a good all-round choice.'),
      });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'reading', color: '#e5412e', min: 0, max: 1023 }] });
      ctx.anchor('fsr', fsr.anchor);
      ctx.anchor('r10', r10.anchor);
      ctx.anchor('a0', a0.mid);
      ctx.anchor('led', c.led.anchor);
      return { ...c, fsr, plot, state };
    },
    hw: (b) => {
      let buf = '';
      return {
        // voltage divider: 5 V → FSR → A0 → fixed resistor → GND
        analogRead: (ch) => {
          if (ch !== 0) return 0;
          const g = b.state.grams;
          return g < 2 ? 0 : clamp(Math.round((1023 * b.state.rFixed) / (b.state.rFixed + 700000 / g)) + noise(2), 0, 1023);
        },
        analogWrite: (pin, v) => { if (pin === 9) b.on(v / 255); },
        digitalWrite: (pin, v) => { if (pin === 9) b.on(v ? 1 : 0); },
        serialWrite: (t) => {
          buf += t;
          const lines = buf.split('\n');
          buf = lines.pop();
          for (const l of lines) { const m = /^(\d+)/.exec(l.trim()); if (m) b.plot.push(Number(m[1])); }
        },
      };
    },
    callouts: [
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'LED on pin ~9', text: 'Glows brighter the harder you press.' },
      { anchor: 'a0', x: 0.36, y: 0.12, icon: 'wave', title: 'A0 · divider midpoint', text: 'More force → lower FSR resistance → higher voltage.' },
      { anchor: 'r10', x: 0.7, y: 0.17, icon: 'resistor', title: '10 kΩ to GND', text: 'Click to try other values and change the sensitivity.' },
      { anchor: 'fsr', x: 0.04, y: 0.68, icon: 'hand', title: 'FSR pad', text: 'Click it and drag the force slider.' },
    ],
    overview: {
      heading: 'Feel the force',
      text: 'A force-sensing resistor (FSR) drops from over 1 MΩ to a few hundred ohms as you press it. Paired with a 10 kΩ resistor it forms a voltage divider, so A0 rises with force — enough to dim an LED and sort presses into categories.',
      features: [['hand', 'Press the pad with the force slider'], ['resistor', 'Swap the fixed resistor to tune sensitivity'], ['code', '<code>if / else if</code> ladders sort readings']],
    },
    pinout: [['5V', 'FSR leg 1', 'Either leg — FSRs have no polarity'], ['A0', 'FSR leg 2 + 10 kΩ', 'Divider midpoint'], ['GND', '10 kΩ other end', ''], ['D9 ~', '220 Ω → LED', 'PWM brightness']],
    example: {
      text: 'FSRs sit inside drum pads, smart insoles, robot grippers and “is someone sitting here?” car seat sensors. They are great at detecting a squeeze, not at weighing things precisely.',
      points: ['Change the <code>reading &lt; …</code> thresholds to suit your press', 'Try a 47 kΩ resistor for feather-light touches'],
    },
    specs: [['Sensor', 'FSR 402-style, 12.7 mm pad'], ['No touch', '> 1 MΩ'], ['≈ 100 g', '≈ 7 kΩ'], ['≈ 1 kg', '≈ 700 Ω'], ['Accuracy', '± 10 % at best — a “feel”, not a scale'], ['A0 voltage', '5 V × 10k / (10k + R<sub>FSR</sub>)']],
    quiz: [
      { q: 'What happens to an FSR’s resistance when you press harder?', options: ['It rises', 'It falls', 'It stays the same', 'It becomes negative'], answer: 1, explain: 'Pressing pushes conductive particles together, so resistance falls.' },
      { q: 'Why is a 10 kΩ resistor needed?', options: ['To protect the LED', 'To form a voltage divider so the changing resistance becomes a changing voltage', 'To slow the ADC down', 'It isn’t needed'], answer: 1, explain: 'analogRead() measures voltage, so the resistance change has to be turned into a voltage first.' },
      { q: 'With nothing touching the pad, A0 reads…', options: ['About 0', 'About 512', 'About 1023', 'A random value'], answer: 0, explain: 'The FSR is almost open, so the 10 kΩ pulls A0 down to 0 V.' },
      { q: 'Is an FSR a good kitchen scale?', options: ['Yes, it’s very precise', 'No — it’s good for detecting and roughly grading a press, not exact weight', 'Only above 10 kg', 'Only with a 1 kΩ resistor'], answer: 1, explain: 'FSRs drift and vary ±10 % or more; use a load cell for weighing.' },
    ],
    challenges: ['Print the FSR resistance: R = 10000 × (1023 − reading) / reading.', 'Beep a buzzer when the reading crosses “big squeeze”, but only once per press.', 'Make a “knock” detector: count quick presses and print how many happened in two seconds.'],
    code: `const int FSR_PIN = A0;
const int LED_PIN = 9;          // PWM pin (~)

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int reading = analogRead(FSR_PIN);   // 0 = no touch
  analogWrite(LED_PIN, map(reading, 0, 1023, 0, 255));
  Serial.print(reading);
  if (reading < {{touch}}) {
    Serial.println(" - no pressure");
  } else if (reading < 200) {
    Serial.println(" - light touch");
  } else if (reading < 500) {
    Serial.println(" - light squeeze");
  } else if (reading < 800) {
    Serial.println(" - medium squeeze");
  } else {
    Serial.println(" - big squeeze");
  }
  delay({{rate}});
}`,
    params: { touch: { value: 10, min: 1, max: 200 }, rate: { value: 250, min: 20, max: 2000 } },
    async setup(io) { io.line('pinMode'); await io.delay(100); io.line('Serial.begin'); await io.delay(60); },
    async loop(io, b, p) {
      io.line('analogRead');
      const g = b.state.grams;
      const rFsr = g < 2 ? Infinity : 700000 / g;
      const reading = rFsr === Infinity ? 0 : clamp(Math.round((1023 * b.state.rFixed) / (b.state.rFixed + rFsr)) + noise(2), 0, 1023);
      io.pin('A0', String(reading), reading > 0);
      io.line('analogWrite');
      const pwm = amap(reading, 0, 1023, 0, 255);
      b.on(pwm / 255);
      io.pin('D9', `PWM ${pwm}`, pwm > 0);
      io.line('Serial.print(reading)');
      let label, line;
      if (reading < p.touch) { label = 'no pressure'; line = 'no pressure'; }
      else if (reading < 200) { label = 'light touch'; line = 'light touch'; }
      else if (reading < 500) { label = 'light squeeze'; line = 'light squeeze'; }
      else if (reading < 800) { label = 'medium squeeze'; line = 'medium squeeze'; }
      else { label = 'big squeeze'; line = 'big squeeze'; }
      io.line(line);
      io.print(`${reading} - ${label}`);
      b.plot.push(reading);
      io.line('delay('); await io.delay(p.rate);
    },
    reset(b) { b.led.set(0); },
  },

  // ------------------------------------------------------------------ rotary-encoder
  {
    id: 'rotary-encoder', level: 'Intermediate', title: 'Click wheel', icon: 'knob',
    thumb: () => { const e = makeRotaryEncoder(v(0, 0, 0)); e.setAngle(30); return e.group; },
    view: { center: [3.0, 0.8, 0.4], size: 13 },
    build(ctx) {
      const enc = ctx.add(makeRotaryEncoder(v(6.4, 0, 0.6)));
      const wclk = ctx.wire(enc.pin('CLK'), ctx.board.pin('D2'), 'yellow', { signal: 'D2', dir: -1, lift: 1.6 });
      const wdt = ctx.wire(enc.pin('DT'), ctx.board.pin('D3'), 'green', { signal: 'D3', dir: -1, lift: 1.9 });
      const wsw = ctx.wire(enc.pin('SW'), ctx.board.pin('D4'), 'blue', { signal: 'D4', dir: -1, lift: 2.2 });
      ctx.wire(enc.pin('+'), ctx.board.pin('5V'), 'red', { signal: '5V', dir: -1, lift: 1.4 });
      ctx.wire(enc.pin('GND'), ctx.board.pin('GND_2'), 'black', { signal: 'GND', lift: 1.1 });
      const state = { queue: [], angle: 0 };
      const turn = (dir) => {
        state.angle += dir * 18;
        enc.setAngle(state.angle);
        if (state.queue.length < 12) state.queue.push(dir);
      };
      ctx.interact(enc, {
        name: 'KY-040 rotary encoder', hint: 'Turn the knob one click at a time, or press it',
        controls: [
          { type: 'button', label: 'Turn right ↻ (clockwise)', press: () => turn(1) },
          { type: 'button', label: 'Turn left ↺ (anticlockwise)', press: () => turn(-1) },
          { type: 'keys', label: 'Or tap repeatedly', keys: ['◄', '►'], down: (k) => turn(k === '►' ? 1 : -1), up() {} },
          { type: 'button', label: 'Press the shaft (hold)', hold: true, down: () => enc.press(true), up: () => enc.press(false) },
        ],
        note: () => `${state.queue.length ? `${state.queue.length} click(s) waiting for the sketch` : 'Run the sketch, then turn the knob'}`,
      });
      const plot = ctx.plotter({ title: 'Logic analyser', series: [{ name: 'CLK', color: '#f2a516', min: -1.6, max: 1.25 }, { name: 'DT', color: '#3aa65a', min: -0.25, max: 2.6 }] });
      ctx.anchor('enc', enc.anchor);
      ctx.anchor('clk', wclk.mid);
      ctx.anchor('dt', wdt.mid);
      ctx.anchor('sw', wsw.mid);
      return { enc, plot, state, counter: 0, lastClk: 1 };
    },
    hw: (b) => {
      // each queued click plays the quadrature sequence on CLK / DT over ~24 ms
      const CW = [[1, 0], [0, 0], [0, 1], [1, 1]], CCW = [[0, 1], [0, 0], [1, 0], [1, 1]];
      let cur = null, last = '';
      const level = () => {
        const now = performance.now();
        if (!cur && b.state.queue.length) cur = { seq: b.state.queue.shift() > 0 ? CW : CCW, t: now };
        if (!cur) return [1, 1];
        const i = Math.floor((now - cur.t) / 6);
        if (i >= 4) { cur = null; return [1, 1]; }
        return cur.seq[i];
      };
      b.state.queue.length = 0;
      return {
        digitalRead: (pin) => {
          if (pin === 4) return b.enc.pressed ? 0 : null;
          if (pin !== 2 && pin !== 3) return null;
          const [clk, dt] = level();
          const k = `${clk}${dt}`;
          if (k !== last) { last = k; b.plot.push(clk, dt); }
          return pin === 2 ? clk : dt;
        },
      };
    },
    callouts: [
      { anchor: 'clk', x: 0.04, y: 0.17, icon: 'pins', title: 'CLK → pin 2', text: 'Pulses once for every click of the knob.' },
      { anchor: 'dt', x: 0.36, y: 0.12, icon: 'pins', title: 'DT → pin 3', text: 'Same pulses, a quarter-step early or late — that gives the direction.' },
      { anchor: 'enc', x: 0.7, y: 0.17, icon: 'knob', title: 'Rotary encoder', text: 'Click it to turn the knob left or right, or press it.' },
      { anchor: 'sw', x: 0.04, y: 0.68, icon: 'button', title: 'SW → pin 4', text: 'Push the shaft to reset the count to 0.' },
    ],
    overview: {
      heading: 'Click wheel',
      text: 'A rotary encoder turns forever in clicks. Inside, two switches (CLK and DT) open and close slightly out of step — <em>quadrature</em>. Whichever changes first tells you the direction, so you can count up and down.',
      features: [['knob', 'Turn it left or right one click at a time'], ['wave', 'A logic analyser shows CLK and DT'], ['code', 'Edge detection with <code>lastClk</code>']],
    },
    pinout: [['D2', 'CLK (A)', 'Pulled up on the module'], ['D3', 'DT (B)', 'Pulled up on the module'], ['D4', 'SW', 'INPUT_PULLUP, LOW when pressed'], ['5V', '+', ''], ['GND', 'GND', '']],
    example: {
      text: 'Volume knobs on car stereos, 3D-printer menus, oven dials and mouse scroll wheels are all rotary encoders: they report movement, not an absolute position.',
      points: ['Watch the logic analyser: in one direction DT changes first, in the other CLK does', 'Turn quickly to see why fast code matters — no long <code>delay()</code> in <code>loop()</code>'],
    },
    specs: [['Module', 'KY-040-style incremental encoder'], ['Detents', '20 clicks per turn (18° each)'], ['Output', '2-bit quadrature (Gray code)'], ['Pull-ups', '10 kΩ on CLK and DT'], ['Switch', 'Push to GND'], ['Rotation', 'Endless (no stops)']],
    quiz: [
      { q: 'How does the sketch know which way the knob turned?', options: ['From the voltage on CLK', 'By checking DT at the moment CLK changes — they are out of step', 'From the switch', 'It can’t tell'], answer: 1, explain: 'In quadrature, one channel leads the other by a quarter cycle; which one leads gives the direction.' },
      { q: 'Why compare clk with lastClk?', options: ['To react only when CLK changes (an edge), not while it stays the same', 'To make it faster', 'To debounce SW', 'To measure voltage'], answer: 0, explain: 'Counting on edges means each click is counted once.' },
      { q: 'How is an encoder different from a potentiometer?', options: ['It turns endlessly and reports steps, not an absolute position', 'It only works on 3.3 V', 'It’s analog', 'It needs a resistor'], answer: 0, explain: 'A pot reports where it is between two stops; an encoder reports how far it moved.' },
      { q: 'What could go wrong with a long delay() in loop()?', options: ['Nothing', 'Fast turns are missed because CLK edges happen while the sketch is waiting', 'The LED gets dim', 'The count doubles'], answer: 1, explain: 'Polling only works if loop() checks the pins often — or use interrupts.' },
    ],
    challenges: ['Limit the counter to 0–100 using constrain().', 'Use the count to set the brightness of an LED on pin 9 (5 % per click).', 'Rewrite it with attachInterrupt() on CLK so no click is ever missed.'],
    code: `const int CLK = 2;
const int DT = 3;
const int SW = 4;

int counter = 0;
int lastClk;

void setup() {
  pinMode(CLK, INPUT);             // the module has pull-ups
  pinMode(DT, INPUT);
  pinMode(SW, INPUT_PULLUP);
  Serial.begin(9600);
  lastClk = digitalRead(CLK);
}

void loop() {
  int clk = digitalRead(CLK);
  if (clk != lastClk && clk == HIGH) {    // CLK rose: one click
    if (digitalRead(DT) != clk) {
      counter--;                          // CLK moved first: anticlockwise
      Serial.print("CCW  ");
    } else {
      counter++;                          // DT moved first: clockwise
      Serial.print("CW   ");
    }
    Serial.print("Position: ");
    Serial.println(counter);
  }
  lastClk = clk;

  if (digitalRead(SW) == LOW) {           // shaft pressed
    counter = 0;
    Serial.println("Reset to 0");
    delay({{debounce}});
  }
}`,
    params: { debounce: { value: 250, min: 20, max: 1000 } },
    async setup(io, b) {
      b.counter = 0;
      b.lastClk = 1;
      b.state.queue.length = 0;
      io.line('pinMode(CLK'); await io.delay(80);
      io.line('INPUT_PULLUP'); await io.delay(60);
      io.line('lastClk = digitalRead'); await io.delay(60);
      io.print('Turn the knob…');
    },
    async loop(io, b, p) {
      const pins = (clk, dt) => {
        io.pin('D2', clk ? 'HIGH' : 'LOW', !clk);
        io.pin('D3', dt ? 'HIGH' : 'LOW', !dt);
        b.plot.push(clk, dt);
      };
      const dir = b.state.queue.shift();
      if (dir) {
        // CW: DT leads (DT falls, CLK falls, DT rises, CLK rises); CCW: CLK leads
        const seq = dir > 0 ? [[1, 0], [0, 0], [0, 1], [1, 1]] : [[0, 1], [0, 0], [1, 0], [1, 1]];
        for (const [clk, dt] of seq) {
          io.line('int clk = digitalRead(CLK)');
          pins(clk, dt);
          if (clk !== b.lastClk && clk === 1) {
            io.line('if (clk != lastClk');
            await io.delay(40);
            if (dt !== clk) { io.line('counter--'); b.counter--; io.print(`CCW  Position: ${b.counter}`); }
            else { io.line('counter++'); b.counter++; io.print(`CW   Position: ${b.counter}`); }
          }
          b.lastClk = clk;
          await io.delay(55);
        }
      } else {
        io.line('int clk = digitalRead(CLK)');
        pins(1, 1);
        b.lastClk = 1;
        await io.delay(60);
      }
      io.line('if (digitalRead(SW) == LOW)');
      const pressed = b.enc.pressed;
      io.pin('D4', pressed ? 'LOW' : 'HIGH', pressed);
      if (pressed) {
        io.line('counter = 0;', 2);
        b.counter = 0;
        io.print('Reset to 0');
        io.line('delay(');
        await io.delay(p.debounce);
      }
    },
    reset(b) { b.state.queue.length = 0; },
  },

  // ------------------------------------------------------------------ tilt-mpu6050
  {
    id: 'tilt-mpu6050', level: 'Intermediate', title: 'Sense tilt', icon: 'radar',
    thumb: () => { const m = makeMPU6050(v(0, 0, 0)); m.setTilt(12, -18); return m.group; },
    view: { center: [1.6, 1.0, 1.8], size: 12 },
    build(ctx) {
      const mpu = ctx.add(makeMPU6050(v(2.0, 0, 5.4)));
      const live = [
        followWire(ctx, ctx.board.pin('5V'), () => mpu.pin('VCC'), 'red', { signal: '5V', lift: 1.2 }),
        followWire(ctx, ctx.board.pin('GND_2'), () => mpu.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.1 }),
        followWire(ctx, ctx.board.pin('A5'), () => mpu.pin('SCL'), 'yellow', { signal: 'A5', lift: 1.3 }),
        followWire(ctx, ctx.board.pin('A4'), () => mpu.pin('SDA'), 'blue', { signal: 'A4', lift: 1.6 }),
      ];
      const state = { pitch: 0, roll: 0, auto: false, t: 0 };
      // Orient the tilting PCB as Rz(pitch)·Rx(roll) — the rotation order the pitch/roll formulas assume —
      // so the printed angles match the sliders. Pitch turns about the sensor's Y axis, roll about its X axis.
      const tiltGroup = mpu.group.children.find((c) => c.isGroup) ?? null;
      const rad = THREE.MathUtils.degToRad;
      const apply = () => {
        mpu.setTilt(state.roll, state.pitch);
        tiltGroup?.rotation.set(rad(state.roll), 0, -rad(state.pitch), 'ZXY');
        live.forEach((l) => l.update());
      };
      /** Gravity as the accelerometer feels it (in g), from the PCB's actual orientation. */
      const gravity = () => {
        if (!tiltGroup) { const P = rad(state.pitch), R = rad(state.roll); return { ax: -Math.sin(P), ay: Math.cos(P) * Math.sin(R), az: Math.cos(P) * Math.cos(R) }; }
        const q = new THREE.Quaternion();
        tiltGroup.getWorldQuaternion(q);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q.invert()); // world up in PCB coordinates
        return { ax: up.x, ay: -up.z, az: up.y }; // silkscreen: X → +x, Y → −z, Z → up
      };
      ctx.onTick((dt) => {
        if (!state.auto) return;
        state.t += dt;
        state.pitch = Math.round(35 * Math.sin(state.t * 0.9));
        state.roll = Math.round(25 * Math.sin(state.t * 0.6 + 1));
        apply();
      });
      ctx.interact(mpu, {
        name: 'MPU-6050 (GY-521)', hint: 'Tilt the board on its stand',
        controls: [
          { type: 'range', label: 'Pitch (X arrow up ↔ down)', min: -80, max: 80, step: 1, get: () => state.pitch, set: (x) => { state.auto = false; state.pitch = x; apply(); }, format: (x) => `${x}°` },
          { type: 'range', label: 'Roll (Y arrow down ↔ up)', min: -80, max: 80, step: 1, get: () => state.roll, set: (x) => { state.auto = false; state.roll = x; apply(); }, format: (x) => `${x}°` },
          { type: 'toggle', label: 'Rock gently', get: () => state.auto, set: (on) => (state.auto = on) },
          { type: 'button', label: 'Level it', press: () => { state.auto = false; state.pitch = state.roll = 0; apply(); } },
        ],
        note: () => { const g = gravity(); return `Accelerometer: X ${g.ax.toFixed(2)} g, Y ${g.ay.toFixed(2)} g, Z ${g.az.toFixed(2)} g`; },
      });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'Pitch', color: '#e5412e', min: -90, max: 90 }, { name: 'Roll', color: '#3b78e7', min: -90, max: 90 }] });
      ctx.anchor('mpu', mpu.anchor);
      ctx.anchor('scl', live[2].w.mid);
      ctx.anchor('sda', live[3].w.mid);
      ctx.anchor('vcc', live[0].w.mid);
      return { mpu, plot, state, gravity };
    },
    hw: (b) => ({
      devices: { i2c: (addr) => (addr === 0x68 ? mpu6050Device(() => ({ ...b.gravity(), noise: 70 / 16384 })) : null) },
      serialWrite: serialPlotter((p, r) => b.plot.push(p, r)),
    }),
    callouts: [
      { anchor: 'vcc', x: 0.04, y: 0.17, icon: 'plug', title: '5V and GND', text: 'The GY-521 has its own 3.3 V regulator.' },
      { anchor: 'sda', x: 0.36, y: 0.12, icon: 'pins', title: 'SDA → A4, SCL → A5', text: 'I²C: two shared wires for data and clock.' },
      { anchor: 'mpu', x: 0.7, y: 0.17, icon: 'radar', title: 'MPU-6050', text: 'Click it to tilt it — watch the X and Y arrows.' },
    ],
    overview: {
      heading: 'Sense tilt',
      text: 'The MPU-6050 has a 3-axis accelerometer and gyro. At rest, the accelerometer only feels gravity, so the way that 1 g is shared between X, Y and Z tells you how the board is tilted. <code>atan2()</code> turns it into pitch and roll.',
      features: [['radar', 'Tilt the sensor with pitch and roll sliders'], ['pins', 'Talk I²C with <code>Wire</code> and raw registers'], ['wave', 'Plot pitch and roll live']],
    },
    pinout: [['5V', 'VCC', 'On-board 3.3 V regulator'], ['GND', 'GND', ''], ['A5 (SCL)', 'SCL', 'I²C clock'], ['A4 (SDA)', 'SDA', 'I²C data'], ['AD0', 'Not connected', 'Low → address 0x68']],
    example: {
      text: 'Phones rotating the screen, self-balancing robots, drone flight controllers and camera gimbals all start from accelerometer tilt like this — then blend in the gyro for fast, smooth motion.',
      points: ['Shake it while tilted: the accelerometer also feels movement, so readings jump', 'Past ±90° pitch the formulas wrap round — tilt-only sensing has limits', 'Average a few readings or add the gyro for steadier angles'],
    },
    specs: [['Chip', 'InvenSense MPU-6050 (GY-521 board)'], ['I²C address', '0x68 (0x69 with AD0 high)'], ['Accel range', '± 2 g → 16384 LSB/g'], ['Gyro range', '± 250 °/s'], ['Supply', '3.3–5 V on VCC'], ['Library', '<code>Wire</code> (built in)']],
    quiz: [
      { q: 'With the board lying flat and still, the accelerometer reads about…', options: ['0 g on every axis', '+1 g on Z and 0 on X and Y', '9.8 g on X', 'It depends on the temperature'], answer: 1, explain: 'It measures the push that stops it falling — 1 g straight up on Z.' },
      { q: 'Why write 0 to register 0x6B in setup()?', options: ['To reset the address', 'To wake the chip — it starts in sleep mode', 'To set the range to ±16 g', 'To start the gyro calibration'], answer: 1, explain: 'PWR_MGMT_1 = 0 clears the SLEEP bit.' },
      { q: 'Which pins are I²C on an Uno-style board?', options: ['D0 and D1', 'A4 (SDA) and A5 (SCL)', 'D9 and D10', 'Any analog pins'], answer: 1, explain: 'A4/A5 double as SDA/SCL (also brought out next to AREF).' },
      { q: 'Why can’t the accelerometer alone measure yaw (turning flat on a table)?', options: ['Turning flat doesn’t change the direction of gravity relative to the sensor', 'The chip is too slow', 'Yaw needs analog pins', 'It can'], answer: 0, explain: 'Gravity stays on Z when you spin it flat, so you need the gyro or a compass for yaw.' },
    ],
    challenges: ['Light an LED when the board is tilted more than 30° in any direction.', 'Smooth the angles with a running average of the last 8 readings.', 'Read the gyro (registers 0x43–0x48) and combine it with the accelerometer in a complementary filter.'],
    code: `#include <Wire.h>

const int MPU = 0x68;               // AD0 low

int16_t read16() {                  // high byte first
  uint16_t hi = Wire.read();
  uint16_t lo = Wire.read();
  return (int16_t)((hi << 8) | lo);
}

void setup() {
  Wire.begin();
  Wire.beginTransmission(MPU);
  Wire.write(0x6B);                 // PWR_MGMT_1
  Wire.write(0);                    // wake up
  Wire.endTransmission(true);
  Serial.begin(9600);
}

void loop() {
  Wire.beginTransmission(MPU);
  Wire.write(0x3B);                 // ACCEL_XOUT_H
  Wire.endTransmission(false);
  Wire.requestFrom(MPU, 6, true);   // X, Y, Z: 2 bytes each
  int16_t ax = read16();
  int16_t ay = read16();
  int16_t az = read16();

  float pitch = atan2(-ax, sqrt((float)ay * ay + (float)az * az)) * 180.0 / PI;
  float roll  = atan2(ay, az) * 180.0 / PI;

  Serial.print("Pitch:");
  Serial.print(pitch, 1);
  Serial.print(" Roll:");
  Serial.println(roll, 1);
  delay({{rate}});
}`,
    params: { rate: { value: 100, min: 20, max: 1000 } },
    async setup(io) {
      io.line('Wire.begin'); await io.delay(80);
      io.line('Wire.write(0x6B)'); io.pin('A4', '0x68 W', true); io.pin('A5', 'CLK', true); await io.delay(80);
      io.line('Wire.write(0);'); await io.delay(60);
      io.line('Wire.endTransmission(true)'); io.pin('A4', 'idle', false); io.pin('A5', 'idle', false); await io.delay(60);
    },
    async loop(io, b, p) {
      io.line('Wire.write(0x3B)'); io.pin('A4', '0x3B', true); io.pin('A5', 'CLK', true);
      await io.delay(30);
      io.line('Wire.requestFrom'); io.pin('A4', '6 bytes', true);
      // ±2 g range: 16384 counts per g, plus a little sensor noise
      const g = b.gravity();
      const raw = (x) => clamp(Math.round(x * 16384 + noise(70)), -32768, 32767);
      const ax = raw(g.ax), ay = raw(g.ay), az = raw(g.az);
      io.line('int16_t az');
      io.pin('A4', 'idle', false); io.pin('A5', 'idle', false);
      io.line('float pitch');
      const pitch = (Math.atan2(-ax, Math.sqrt(ay * ay + az * az)) * 180) / Math.PI;
      io.line('float roll');
      const roll = (Math.atan2(ay, az) * 180) / Math.PI;
      io.line('Serial.println(roll');
      io.print(`Pitch:${pitch.toFixed(1)} Roll:${roll.toFixed(1)}`);
      b.plot.push(pitch, roll);
      io.line('delay('); await io.delay(Math.max(0, p.rate - 30));
    },
    reset() {},
  },

  // ------------------------------------------------------------------ ir-remote
  {
    id: 'ir-remote', level: 'Intermediate', title: 'Remote control', icon: 'radar',
    thumb: () => makeRemote(v(0, 0, 0)).group,
    view: { center: [6.4, 0.6, 2.5], size: 17 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      ctx.wire(ctx.board.pin('GND'), bb.hole(1, 'top-'), 'black', { signal: 'GND', dir: -1 });
      const leds = [
        railLed(ctx, bb, { pin: 'D5', col: 4, color: 'red' }),
        railLed(ctx, bb, { pin: 'D6', col: 11, color: 'yellow' }),
        railLed(ctx, bb, { pin: 'D7', col: 18, color: 'green' }),
      ];
      // receiver in front of the board facing +x; remote lying further along, pointing back at it
      const rx = ctx.add(makeIRReceiver(v(2.0, 0, 5.4), { rotY: Math.PI / 2 }));
      const out = ctx.wire(rx.pin('OUT'), ctx.board.pin('D2'), 'yellow', { signal: 'D2', dir: -1, lift: 3.0 });
      ctx.wire(rx.pin('GND'), ctx.board.pin('GND_2'), 'black', { signal: 'GND', lift: 0.9 });
      ctx.wire(rx.pin('VCC'), ctx.board.pin('5V'), 'red', { signal: '5V', dir: -1, lift: 0.8 });
      const remote = ctx.add(makeRemote(v(9.6, 0, 5.4), { rotY: Math.PI / 2 }));
      // IR beam: a few glowing dots flying from the remote to the receiver
      const beam = new THREE.Group();
      const dots = [0, 1, 2, 3].map(() => { const s = glowSprite(0xff5a7a, 0.7); beam.add(s); return s; });
      ctx.addObject(beam);
      const from = remote.tip.clone(), to = rx.front.clone();
      const state = { events: [], held: null, rep: 0, beamT: 1 };
      const fire = (key, repeat) => {
        remote.flash(0.18);
        state.beamT = 0;
        if (state.events.length < 10) state.events.push({ key, repeat });
      };
      ctx.onTick((dt) => {
        state.beamT = Math.min(1, state.beamT + dt * 3.2);
        dots.forEach((d, i) => {
          const t = state.beamT - i * 0.07;
          const on = state.beamT < 1 && t > 0 && t < 1;
          d.material.opacity = on ? 0.9 * (1 - t * 0.4) : 0;
          if (on) d.position.copy(from).lerp(to, t);
        });
        if (state.beamT >= 1 && state.arrived === false) { state.arrived = true; rx.flash(); }
        if (state.beamT < 1) state.arrived = false;
        if (state.held) {
          state.rep += dt;
          if (state.rep > 0.11) { state.rep = 0; fire(state.held, true); }
        }
      });
      const keysCtl = {
        type: 'keys', label: 'Press (hold for repeats)', keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#', '▲', '◄', 'OK', '►', '▼'],
        down: (k) => { state.held = k; state.rep = -0.3; fire(k, false); },
        up: () => { state.held = null; },
      };
      ctx.interact(remote, { name: 'IR remote', hint: 'Press keys 1, 2, 3 to toggle the LEDs, 0 for all off', controls: [keysCtl] });
      ctx.interact(rx, { name: 'IR receiver (VS1838B)', hint: 'Decodes 38 kHz IR flashes into codes', controls: [keysCtl] });
      ctx.anchor('rx', rx.anchor);
      ctx.anchor('remote', remote.anchor);
      ctx.anchor('out', out.mid);
      ctx.anchor('leds', leds[1].led.anchor);
      ctx.anchor('res', leds[0].res.anchor);
      return { leds, rx, remote, state, on: [false, false, false] };
    },
    hw: (b) => {
      b.state.events.length = 0;
      return {
        digitalWrite: (pin, v) => { if (pin >= 5 && pin <= 7) b.leds[pin - 5].on(v ? 1 : 0); },
        devices: {
          ir: (pin) => (pin === 2 ? {
            next: () => {
              const ev = b.state.events.shift();
              return ev ? { address: 0x00, command: IR_CODES[ev.key] ?? 0, repeat: !!ev.repeat } : null;
            },
          } : null),
        },
      };
    },
    callouts: [
      { anchor: 'res', x: 0.04, y: 0.17, icon: 'resistor', title: 'Pins 5, 6, 7', text: 'Each through 220 Ω to an LED, cathodes in the − rail.' },
      { anchor: 'out', x: 0.36, y: 0.12, icon: 'pins', title: 'OUT → pin 2', text: 'The receiver turns 38 kHz flashes into clean pulses.' },
      { anchor: 'leds', x: 0.7, y: 0.17, icon: 'led', title: 'Three LEDs', text: 'Keys 1, 2 and 3 toggle them; 0 turns all off.' },
      { anchor: 'rx', x: 0.04, y: 0.68, icon: 'radar', title: 'IR receiver', text: 'Its dark dome lets infrared in and blocks visible light.' },
      { anchor: 'remote', x: 0.7, y: 0.68, icon: 'hand', title: 'Remote', text: 'Click it and press keys — hold one to send repeats.' },
    ],
    overview: {
      heading: 'Remote control',
      text: 'A TV-style remote flashes an infrared LED 38,000 times a second in coded bursts. The receiver strips the 38 kHz carrier, and the <code>IRremote</code> library decodes the bursts into an address and a command byte you can switch on.',
      features: [['hand', 'Press remote keys in the 3D view'], ['code', '<code>switch</code> on <code>decodedIRData.command</code>'], ['info', 'Spot repeat codes when a key is held']],
    },
    pinout: [['D2', 'Receiver OUT', 'Active LOW pulses'], ['5V / GND', 'Receiver VCC / GND', ''], ['D5 / D6 / D7', '220 Ω → red / yellow / green LED', 'Cathodes → − rail'], ['GND', '− rail', ''], ['D13', 'Built-in LED', 'Blinks on every IR frame (feedback)']],
    example: {
      text: 'TVs, air conditioners, ceiling fans and LED strips all use IR remotes. The same receiver lets you control a robot or a lamp with any old remote from a drawer.',
      points: ['Codes differ between remotes — run the sketch and note what your keys print', 'Use ▲ / ▼ to fade an LED up and down with <code>analogWrite()</code>'],
    },
    specs: [['Receiver', 'VS1838B / TSOP-style, 38 kHz'], ['Range', '≈ 8–10 m, needs line of sight'], ['Protocol', 'NEC: 8-bit address + 8-bit command'], ['Repeat', 'Short repeat frame every ≈ 110 ms while held'], ['Library', '<code>IRremote</code> v4 (v3+ API)'], ['Wavelength', '940 nm infrared']],
    quiz: [
      { q: 'Why does the remote flash its LED at 38 kHz?', options: ['So the receiver can ignore sunlight and lamps and only react to the modulated signal', 'To save battery', 'Because humans can see 38 kHz', 'It doesn’t'], answer: 0, explain: 'The receiver has a band-pass filter tuned to 38 kHz, so steady light is rejected.' },
      { q: 'What does IrReceiver.resume() do?', options: ['Turns the LED on', 'Gets the receiver ready to decode the next code', 'Resets the board', 'Sends an IR code'], answer: 1, explain: 'After reading a result you must resume() or no more codes are decoded.' },
      { q: 'Why check IRDATA_FLAGS_IS_REPEAT?', options: ['To ignore the repeat frames a held key sends, so one press toggles once', 'To decode faster', 'To change the address', 'To make the LED blink'], answer: 0, explain: 'NEC remotes send a short “repeat” frame while a key is held.' },
    ],
    challenges: ['Make ▲ and ▼ change the brightness of one LED in steps of 25.', 'Let key 5 blink all LEDs three times, and ignore unknown keys quietly.', 'Use repeat codes on purpose: holding ▲ should keep increasing a value printed to the serial monitor.'],
    code: `#include <IRremote.hpp>

const int IR_PIN = 2;
const int LEDS[] = {5, 6, 7};        // red, yellow, green
bool on[3] = {false, false, false};

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 3; i++) pinMode(LEDS[i], OUTPUT);
  IrReceiver.begin(IR_PIN, ENABLE_LED_FEEDBACK);
  Serial.println("Ready - press a key");
}

void toggle(int i) {
  on[i] = !on[i];
  digitalWrite(LEDS[i], on[i] ? HIGH : LOW);
}

void loop() {
  if (IrReceiver.decode()) {
    uint8_t cmd = IrReceiver.decodedIRData.command;
    bool repeat = IrReceiver.decodedIRData.flags & IRDATA_FLAGS_IS_REPEAT;
    Serial.print("Command 0x");
    Serial.print(cmd, HEX);
    if (repeat) Serial.print(" (repeat)");
    Serial.println();
    if (!repeat) {
      switch (cmd) {
        case 0x45: toggle(0); break;   // key 1
        case 0x46: toggle(1); break;   // key 2
        case 0x47: toggle(2); break;   // key 3
        case 0x19:                     // key 0: all off
          for (int i = 0; i < 3; i++) {
            on[i] = false;
            digitalWrite(LEDS[i], LOW);
          }
          break;
      }
    }
    IrReceiver.resume();               // ready for the next code
  }
}`,
    params: {},
    async setup(io, b) {
      b.state.events.length = 0;
      io.line('Serial.begin'); await io.delay(60);
      io.line('pinMode(LEDS'); await io.delay(60);
      io.line('IrReceiver.begin'); await io.delay(100);
      io.line('Serial.println("Ready'); io.print('Ready - press a key');
    },
    async loop(io, b) {
      io.line('IrReceiver.decode()');
      const ev = b.state.events.shift();
      if (!ev) { io.pin('D2', 'HIGH', false); await io.delay(40); return; }
      // the frame takes ≈ 67 ms to arrive
      io.pin('D2', 'NEC frame', true);
      io.board.setBuiltinLed(1);
      await io.delay(70);
      io.board.setBuiltinLed(0);
      const cmd = IR_CODES[ev.key];
      io.line('uint8_t cmd');
      io.line('Serial.print(cmd, HEX)');
      io.print(`Command 0x${hex(cmd)}${ev.repeat ? ' (repeat)' : ''}`);
      if (!ev.repeat) {
        io.line('switch (cmd)');
        await io.delay(30);
        const set = (i, val) => {
          b.on[i] = val;
          b.leds[i].on(val ? 1 : 0);
          io.pin(`D${5 + i}`, val ? 'HIGH' : 'LOW', val);
        };
        const idx = { 0x45: 0, 0x46: 1, 0x47: 2 }[cmd];
        if (idx !== undefined) { io.line(`case 0x${hex(cmd)}`); set(idx, !b.on[idx]); }
        else if (cmd === 0x19) { io.line('case 0x19'); [0, 1, 2].forEach((i) => set(i, false)); }
      }
      io.line('IrReceiver.resume()');
      io.pin('D2', 'HIGH', false);
      await io.delay(20);
    },
    reset(b, io) {
      b.on = [false, false, false];
      b.leds.forEach((l) => l.on(0));
      b.state.events.length = 0;
      io?.board.setBuiltinLed(0);
    },
  },

  // ------------------------------------------------------------------ keypad-lock
  {
    id: 'keypad-lock', level: 'Intermediate', title: 'Keypad door lock', icon: 'button',
    thumb: () => makeKeypad(v(0, 0, -4)).group,
    view: { center: [5.2, 0.8, -5.6], size: 19 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      // keypad behind the board, ribbon pointing at the digital header
      const kp = ctx.add(makeKeypad(v(2.25, 0, -12.8)));
      const KP = [['R1', 'D9'], ['R2', 'D8'], ['R3', 'D7'], ['R4', 'D6'], ['C1', 'D5'], ['C2', 'D4'], ['C3', 'D3'], ['C4', 'D2']];
      const colors = ['yellow', 'yellow', 'yellow', 'yellow', 'blue', 'blue', 'blue', 'blue'];
      const kw = KP.map(([k, d], i) => ctx.wire(kp.pin(k), ctx.board.pin(d), colors[i], { signal: d, dir: -1, lift: 0.9, chipT: i % 2 ? 0.3 : 0.62 }));
      ctx.wire(ctx.board.pin('GND'), bb.hole(1, 'top-'), 'black', { signal: 'GND', dir: -1 });
      ctx.wire(ctx.board.pin('5V'), bb.hole(2, 'top+'), 'red', { signal: '5V' });
      const green = railLed(ctx, bb, { pin: 'D11', col: 4, color: 'green' });
      const red = railLed(ctx, bb, { pin: 'D12', col: 11, color: 'red' });
      // servo bolt behind the breadboard, powered from the top rails
      const servo = ctx.add(makeServo(v(10.6, 0, -5.6)));
      const [sg, sp, ss] = servo.leads;
      ctx.wire(sg, bb.hole(27, 'top-'), 'brown', { signal: 'GND', dir: -1, lift: 0.8 });
      ctx.wire(sp, bb.hole(28, 'top+'), 'red', { signal: '5V', lift: 0.9 });
      const ws = ctx.wire(ss, ctx.board.pin('D10'), 'orange', { signal: 'D10', dir: -1, lift: 2.2 });
      servo.set(0);
      const state = { queue: [] };
      const keysCtl = {
        type: 'keys', label: 'Type the PIN, then #  (* clears)', keys: kp.keys,
        down: (k) => { kp.press(k); if (state.queue.length < 16) state.queue.push(k); },
        up: () => kp.release(),
      };
      ctx.interact(kp, { name: '4×4 keypad', hint: 'Default PIN is 1234', controls: [keysCtl] });
      ctx.interact(servo, { name: 'Servo bolt', hint: '0° = locked, 90° = open' });
      ctx.anchor('kp', kp.anchor);
      ctx.anchor('ribbon', kw[3].mid);
      ctx.anchor('green', green.led.anchor);
      ctx.anchor('red', red.led.anchor);
      ctx.anchor('servo', servo.anchor);
      ctx.anchor('sig', ws.mid);
      return { kp, servo, green, red, state, entered: '' };
    },
    hw: (b) => {
      b.state.queue.length = 0;
      return {
        digitalWrite: (pin, v) => { if (pin === 11) b.green.on(v ? 1 : 0); if (pin === 12) b.red.on(v ? 1 : 0); },
        devices: {
          keypad: () => ({ getKey: () => b.state.queue.shift() ?? null }),
          servo: (pin) => (pin === 10 ? { write: (deg) => b.servo.set(deg) } : null),
        },
      };
    },
    callouts: [
      { anchor: 'kp', x: 0.04, y: 0.17, icon: 'hand', title: 'Keypad', text: 'Click it and type 1 2 3 4 #.' },
      { anchor: 'servo', x: 0.7, y: 0.17, icon: 'servo', title: 'Servo bolt · pin 10', text: 'Swings to 90° to unlock, back to 0° to lock.' },
      { anchor: 'ribbon', x: 0.04, y: 0.68, icon: 'pins', title: 'Rows → 9–6, columns → 5–2', text: 'The library scans the 4 × 4 grid to find the pressed key.' },
      { anchor: 'green', x: 0.7, y: 0.68, icon: 'led', title: 'Green 11 · red 12', text: 'Green while open, red for a wrong PIN.' },
    ],
    overview: {
      heading: 'Keypad door lock',
      text: 'A membrane keypad is a grid of switches: 4 row wires and 4 column wires make 16 keys from 8 pins. The <code>Keypad</code> library scans them for you. Collect four digits, check them on <kbd>#</kbd>, and swing a servo bolt open.',
      features: [['hand', 'Type on the 3D keypad'], ['code', 'Build a <code>String</code> and compare it'], ['servo', 'A servo acts as the lock bolt']],
    },
    pinout: [['D9–D6', 'Keypad R1–R4', 'Rows'], ['D5–D2', 'Keypad C1–C4', 'Columns'], ['D10', 'Servo signal', 'Orange'], ['D11', '220 Ω → green LED', 'Unlocked'], ['D12', '220 Ω → red LED', 'Wrong PIN'], ['5V / GND', 'Top rails → servo and LED cathodes', '']],
    example: {
      text: 'Door entry pads, safes, alarm panels and vending machines all scan a key matrix like this one and compare what you type against a stored code.',
      points: ['Change <code>PIN_CODE</code> (it’s the number in the code)', 'Try a wrong PIN and watch the red LED', 'Press <kbd>*</kbd> to clear a typo'],
    },
    specs: [['Keypad', '4 × 4 membrane matrix, 8 pins'], ['Scan', 'Columns driven LOW one at a time, rows read with pull-ups'], ['Servo', 'SG90-style, 0° locked / 90° open'], ['LEDs', '220 Ω each, ≈ 13 mA'], ['Libraries', '<code>Keypad</code>, <code>Servo</code>'], ['PIN length', '4 digits']],
    quiz: [
      { q: 'How can 8 wires read 16 keys?', options: ['Each key connects one row wire to one column wire, so the sketch scans rows × columns', 'Each wire carries two keys', 'The keypad has a chip inside', 'It can’t — it reads 8'], answer: 0, explain: 'A matrix needs rows + columns wires instead of one per key: 4 + 4 = 8 for 16 keys.' },
      { q: 'What does keypad.getKey() return when nothing is pressed?', options: ['\'0\'', 'NO_KEY (0), so if (!key) is true', '-1', 'It waits forever'], answer: 1, explain: 'getKey() never blocks; it returns NO_KEY, which is 0.' },
      { q: 'Why add * as a “clear” key?', options: ['To let the user fix a typo before submitting', 'The library requires it', 'To lock the servo', 'To reset the board'], answer: 0, explain: 'Good interfaces let people recover from mistakes.' },
      { q: 'A real lock should also…', options: ['Lock out after several wrong tries', 'Print the PIN on the serial monitor', 'Use delay(60000) after every key', 'Power the servo from a pin'], answer: 0, explain: 'Limiting attempts stops someone trying every code.' },
    ],
    challenges: ['Make the PIN six digits long.', 'Lock the keypad for 30 seconds after three wrong tries in a row.', 'Add a “change PIN” mode: type the old PIN, press A, then type a new one (store it in EEPROM).'],
    code: `#include <Keypad.h>
#include <Servo.h>

const byte ROWS = 4, COLS = 4;
char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};
byte rowPins[ROWS] = {9, 8, 7, 6};   // R1–R4
byte colPins[COLS] = {5, 4, 3, 2};   // C1–C4
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

Servo bolt;
const int GREEN = 11, RED = 12;
const String PIN_CODE = "{{pin}}";
String entered = "";

void setup() {
  bolt.attach(10);
  bolt.write(0);                     // locked
  pinMode(GREEN, OUTPUT);
  pinMode(RED, OUTPUT);
  Serial.begin(9600);
  Serial.println("Enter PIN, then #");
}

void unlock() {
  Serial.println("Unlocked!");
  digitalWrite(GREEN, HIGH);
  bolt.write(90);                    // slide the bolt open
  delay({{open}});
  bolt.write(0);                     // and lock again
  digitalWrite(GREEN, LOW);
  Serial.println("Locked");
}

void loop() {
  char key = keypad.getKey();        // NO_KEY (0) if nothing new
  if (!key) return;

  if (key == '*') {                  // clear
    entered = "";
    Serial.println("Cleared");
  } else if (key == '#') {           // check the code
    if (entered == PIN_CODE) {
      unlock();
    } else {
      Serial.println("Wrong PIN");
      digitalWrite(RED, HIGH);
      delay(1000);
      digitalWrite(RED, LOW);
    }
    entered = "";
  } else if (entered.length() < 4) {
    entered += key;
    Serial.print("Code: ");
    for (unsigned int i = 0; i < entered.length(); i++) Serial.print('*');
    Serial.println();
  }
}`,
    params: { pin: { value: 1234, min: 1000, max: 9999 }, open: { value: 3000, min: 500, max: 10000 } },
    async setup(io, b) {
      b.entered = '';
      b.state.queue.length = 0;
      io.line('bolt.attach'); await io.delay(60);
      io.line('// locked'); b.servo.set(0); io.pin('D10', '0°', true); await io.delay(60);
      io.line('Serial.begin'); await io.delay(60);
      io.line('Enter PIN, then #'); io.print('Enter PIN, then #');
    },
    async loop(io, b, p) {
      io.line('keypad.getKey()');
      const key = b.state.queue.shift();
      if (!key) { await io.delay(30); return; }
      const KP_PIN = { '1': 'D9', '2': 'D9', '3': 'D9', A: 'D9', '4': 'D8', '5': 'D8', '6': 'D8', B: 'D8', '7': 'D7', '8': 'D7', '9': 'D7', C: 'D7', '*': 'D6', '0': 'D6', '#': 'D6', D: 'D6' };
      io.pin(KP_PIN[key], `key ${key}`, true);
      await io.delay(40);
      io.pin(KP_PIN[key], 'HIGH', false);
      if (key === '*') {
        io.line("key == '*'"); io.line('entered = "";', 2); b.entered = '';
        io.line('Cleared'); io.print('Cleared');
      } else if (key === '#') {
        io.line("key == '#'");
        await io.delay(60);
        if (b.entered === String(p.pin)) {
          io.line('unlock();');
          io.line('Unlocked!'); io.print('Unlocked!');
          io.line('digitalWrite(GREEN, HIGH)'); b.green.on(); io.pin('D11', 'HIGH', true);
          io.line('bolt.write(90)');
          for (let a = 0; a <= 90; a += 10) { b.servo.set(a); io.pin('D10', `${a}°`, true); await io.delay(25); }
          io.line('delay(', 1); await io.delay(p.open);
          io.line('// and lock');
          for (let a = 90; a >= 0; a -= 10) { b.servo.set(a); io.pin('D10', `${a}°`, true); await io.delay(25); }
          io.line('digitalWrite(GREEN, LOW)'); b.green.on(0); io.pin('D11', 'LOW', false);
          io.line('Serial.println("Locked")'); io.print('Locked');
        } else {
          io.line('Wrong PIN'); io.print('Wrong PIN');
          io.line('digitalWrite(RED, HIGH)'); b.red.on(); io.pin('D12', 'HIGH', true);
          io.line('delay(1000)'); await io.delay(1000);
          io.line('digitalWrite(RED, LOW)'); b.red.on(0); io.pin('D12', 'LOW', false);
        }
        io.line('entered = "";', 3); b.entered = '';
        // keys pressed while the sketch was busy in delay() are still caught by the scan afterwards
      } else if (b.entered.length < 4) {
        io.line('entered += key');
        b.entered += key;
        io.line("Serial.print('*')");
        io.print(`Code: ${'*'.repeat(b.entered.length)}`);
      }
      await io.delay(20);
    },
    reset(b) { b.servo.set(0); b.green.on(0); b.red.on(0); b.kp.release(); b.state.queue.length = 0; },
  },
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['knob', 'Thumb joystick', 'Two pots at right angles plus a push switch.', 'joystick'],
  ['hand', 'Force-sensing resistor', 'Resistance falls as you press it harder.', 'force-sensor'],
  ['knob', 'Rotary encoder', 'Endless knob that reports clicks and direction.', 'rotary-encoder'],
  ['radar', 'MPU-6050', 'I²C accelerometer + gyro for tilt and motion.', 'tilt-mpu6050'],
  ['radar', 'IR receiver', 'Decodes 38 kHz infrared remote signals.', 'ir-remote'],
  ['button', '4×4 keypad', '16 keys read from 8 pins as a row/column matrix.', 'keypad-lock'],
];
