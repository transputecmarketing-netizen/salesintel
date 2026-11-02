// Track 3 (second half) — Displays, Light & Motion: NeoPixels, steppers,
// relays, H-bridge motor drivers and a push-button piano. Uno-style board.
import * as THREE from 'three';
import { makeResistor, makeButton, makeBuzzer, makeMotor } from '../scene/components.js';
import { makeNeoPixelRing, makeStepper, makeRelay, makeLamp, makeL298N } from '../scene/modules.js';
import { mat, box, cyl, at, textDecal, SANS } from '../scene/modules/common.js';
import { v, BB } from './helpers.js';

// ---------------------------------------------------------------- local helpers
/** A battery pack / DC supply block with + and − posts at its back (−z) end. */
function makeSupply(pos, { lines = ['6 × AA', '9 V'], rotY = 0, color = 0x2a2c33 } = {}) {
  const g = new THREE.Group();
  const W = 3.0, H = 1.5, D = 4.6;
  g.add(at(box(W, H, D, mat(color, { rough: 0.6 })), 0, H / 2, 0));
  g.add(at(box(W + 0.02, 0.5, D * 0.62, mat(0xf2c230, { rough: 0.5 })), 0, H * 0.5, 0.35));
  const lab = textDecal(lines, W * 0.92, D * 0.5, { color: '#ece8dc', sizes: [0.2, 0.3], font: SANS, weight: 700 });
  lab.position.set(0, H + 0.003, 0.55);
  g.add(lab);
  const posts = [[-0.7, 0xd8443a], [0.7, 0x1d1e23]].map(([x, c]) => {
    g.add(at(cyl(0.26, 0.26, 0.12, mat(c, { rough: 0.5 }), { seg: 20 }), x, H + 0.06, -D / 2 + 0.6));
    g.add(at(cyl(0.12, 0.12, 0.4, mat(0xc9c6bd, { metal: 0.6, rough: 0.3 }), { seg: 16 }), x, H + 0.2, -D / 2 + 0.6));
    return new THREE.Vector3(x, H + 0.4, -D / 2 + 0.6);
  });
  g.position.copy(pos);
  g.rotation.y = rotY;
  g.updateMatrixWorld(true);
  return {
    group: g,
    pick: g,
    anchor: g.localToWorld(new THREE.Vector3(0, H + 0.8, 0.4)),
    plus: () => g.localToWorld(posts[0].clone()),
    minus: () => g.localToWorld(posts[1].clone()),
  };
}

/** Adafruit_NeoPixel::ColorHSV(hue) with full saturation and value → [r, g, b]. */
function colorHSV(hue16) {
  const h = Math.floor(((hue16 & 0xffff) * 1530 + 32768) / 65536);
  if (h < 510) return h < 255 ? [255, h, 0] : [510 - h, 255, 0];
  if (h < 1020) return h < 765 ? [0, 255, h - 510] : [0, 1020 - h, 255];
  if (h < 1530) return h < 1275 ? [h - 1020, 0, 255] : [255, 0, 1530 - h];
  return [255, 0, 0];
}
const gamma8 = (x) => Math.round(255 * (x / 255) ** 2.6);

// 28BYJ-48 half-step coil pattern [A, B, C, D] (same table as the stepper module)
const HALF_STEPS = [[1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 1]];

const NOTE_NAMES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const NOTE_HZ = [262, 294, 330, 349, 392, 440, 494, 523];
const KEY_WIRES = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'white', 'brown'];

export const displaysB = [
  // ------------------------------------------------------------------ NeoPixel ring
  {
    id: 'neopixel-ring', title: 'NeoPixel rainbow', icon: 'palette',
    thumb: () => {
      const r = makeNeoPixelRing(v(0, 0, 0));
      for (let i = 0; i < r.count; i++) r.setPixel(i, ...colorHSV((i * 65536) / r.count));
      r.show();
      return r.group;
    },
    view: { center: [5.6, 0.6, 1.4], size: 14.5 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const ring = ctx.add(makeNeoPixelRing(v(9.4, 0, 5.5)));
      const res = ctx.add(makeResistor(bb.hole(8, 'h'), bb.hole(12, 'h'), 330));
      const din = ctx.wire(ctx.board.pin('D6'), bb.hole(8, 'f'), 'green', { signal: 'D6' });
      const dinRing = ctx.wire(bb.hole(12, 'j'), ring.pin('DIN'), 'green', { lift: 0.9 });
      const pwr = ctx.wire(ctx.board.pin('5V'), ring.pin('5V'), 'red', { signal: '5V', lift: 1.6 });
      ctx.wire(ctx.board.pin('GND_2'), ring.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.3 });
      const state = { supply: 'usb' };
      const current = () => {
        let s = 0;
        for (let i = 0; i < ring.count; i++) s += ring.getPixel(i).reduce((a, c) => a + c, 0);
        return Math.round((s / 255) * 20 + ring.count * 1);
      };
      ctx.interact(ring, {
        name: '12-LED NeoPixel ring', hint: 'WS2812B pixels — each one has its own tiny controller',
        controls: [{ type: 'choice', label: 'Powered from', options: [['usb', 'USB (500 mA)'], ['psu', '5 V 2 A supply']], get: () => state.supply, set: (x) => (state.supply = x) }],
        note: () => {
          const mA = current();
          const max = state.supply === 'usb' ? 500 : 2000;
          return `Drawing ≈ ${mA} mA now · all white at full brightness would be ≈ ${ring.count * 60 + ring.count} mA${mA > max ? ' — too much for this supply!' : ''}`;
        },
      });
      ctx.interact(res, { name: '330 Ω resistor', hint: 'Protects the first pixel’s data input from ringing and spikes' });
      ctx.anchor('ring', ring.anchor);
      ctx.anchor('res', res.anchor);
      ctx.anchor('din', din.mid);
      ctx.anchor('dinRing', dinRing.mid);
      ctx.anchor('pwr', pwr.mid);
      return { ring, current };
    },
    callouts: [
      { anchor: 'din', x: 0.36, y: 0.12, icon: 'pins', title: 'Data · pin 6', text: 'One wire carries 24 bits of colour per pixel at 800 kHz.' },
      { anchor: 'res', x: 0.7, y: 0.17, icon: 'resistor', title: '330 Ω in series', text: 'Damps spikes on the data line into pixel 0.' },
      { anchor: 'pwr', x: 0.04, y: 0.68, icon: 'plug', title: '5V and GND', text: 'Each pixel can draw up to 60 mA — watch the total!' },
      { anchor: 'ring', x: 0.7, y: 0.68, icon: 'palette', title: 'WS2812B ring', text: 'Click it to see the estimated current draw.' },
    ],
    overview: {
      heading: 'NeoPixel rainbow',
      text: 'Each WS2812B “NeoPixel” holds a red, green and blue LED plus a tiny controller. They’re chained: the first pixel keeps its 24 colour bits and passes the rest on, so one pin controls all twelve.',
      features: [['palette', '<code>Adafruit_NeoPixel</code> library: <code>setPixelColor()</code> + <code>show()</code>'], ['code', 'Colour wipe and an HSV rainbow with gamma correction'], ['bolt', 'Click the ring to check the current budget']],
    },
    pinout: [['D6', '330 Ω → ring DIN', 'Data in'], ['5V', 'Ring 5V', '1000 µF capacitor across 5V/GND recommended'], ['GND', 'Ring GND', 'Must share ground with the board']],
    example: {
      text: 'Gaming keyboards, smart lamps, festival costumes and the status rings on smart speakers are strings of addressable LEDs like these.',
      points: ['Lower <code>setBrightness()</code> to save power — 12 pixels at full white need ≈ 720 mA', 'Change the wipe colours with <code>ring.Color(r, g, b)</code>', 'Make the rainbow spin faster with a smaller wait'],
    },
    specs: [['LEDs', '12 × WS2812B (5050 RGB)'], ['Supply', '5 V (4–7 V)'], ['Current', '≈ 20 mA per colour, 60 mA per pixel at full white'], ['Data', 'Single wire, 800 kHz, GRB order'], ['Protection', '300–500 Ω on DIN + 1000 µF across 5V/GND'], ['Library', 'Adafruit_NeoPixel']],
    quiz: [
      { q: "How can a single data pin control twelve separate RGB pixels?", options: ["Each pixel has its own wire", "The pixels are chained: each keeps its 24 bits and passes the rest along", "The pin outputs 12 different voltages", "PWM sets all pixels to the same colour"], answer: 1, explain: "WS2812B pixels shift data down the chain, so pixel 0 takes the first 24 bits, pixel 1 the next, and so on." },
      { q: "Why does nothing change on the ring until you call show()?", options: ["show() turns the power on", "setPixelColor() only edits a buffer in RAM; show() sends it out", "show() clears the ring", "It resets the library"], answer: 1, explain: "The library keeps a colour buffer; show() streams the whole buffer to the pixels in one go." },
      { q: "Roughly how much current can 12 pixels draw at full white and full brightness?", options: ["12 mA", "about 100 mA", "about 720 mA", "5 A"], answer: 2, explain: "Up to 60 mA each (20 mA per colour) × 12 ≈ 720 mA — more than USB comfortably gives, hence setBrightness()." },
      { q: "What does the 1000 µF capacitor across 5V and GND do?", options: ["Stores the colours", "Smooths the sudden current surge when the pixels switch on", "Raises the voltage to 12 V", "Filters the data signal"], answer: 1, explain: "It’s a local reservoir that stops the supply dipping when lots of pixels light at once." },
    ],
    challenges: ["Make a single red pixel chase round the ring.", "Add a ‘theatre chase’ effect: every third pixel lit, shifting each frame.", "Read a potentiometer on A0 and use it to set the brightness live."],
    code: `#include <Adafruit_NeoPixel.h>

const int PIN = 6;
const int NUM_LEDS = 12;
Adafruit_NeoPixel ring(NUM_LEDS, PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  ring.begin();
  ring.setBrightness({{bright}});   // 0-255: keep it low on USB power
  ring.show();                    // all pixels off
  Serial.begin(9600);
}

void colorWipe(uint32_t color, int wait) {
  for (int i = 0; i < NUM_LEDS; i++) {
    ring.setPixelColor(i, color);
    ring.show();
    delay(wait);
  }
}

void rainbow(int wait) {
  for (long first = 0; first < 65536; first += 1024) {
    for (int i = 0; i < NUM_LEDS; i++) {
      long hue = first + i * 65536L / NUM_LEDS;
      ring.setPixelColor(i, ring.gamma32(ring.ColorHSV(hue)));
    }
    ring.show();
    delay(wait);
  }
}

void loop() {
  Serial.println("Colour wipe: red, green, blue");
  colorWipe(ring.Color(255, 0, 0), {{wipe}});
  colorWipe(ring.Color(0, 255, 0), {{wipe}});
  colorWipe(ring.Color(0, 0, 255), {{wipe}});
  Serial.println("Rainbow");
  rainbow({{wait}});
}`,
    params: { bright: { value: 50, min: 1, max: 255 }, wipe: { value: 60, min: 5, max: 500 }, wait: { value: 20, min: 5, max: 200 } },
    async setup(io, b, p) {
      io.line('ring.begin'); b.ring.clear().show(); await io.delay(80);
      io.line('setBrightness'); await io.delay(80);
      io.line('all pixels off'); io.print(`Brightness ${p.bright}/255`);
      io.line('Serial.begin'); await io.delay(80);
    },
    async loop(io, b, p) {
      const scale = (c) => (c * (p.bright + 1)) >> 8; // what setBrightness() really does
      io.line('Colour wipe'); io.print('Colour wipe: red, green, blue');
      const cols = [[255, 0, 0], [0, 255, 0], [0, 0, 255]];
      for (let k = 0; k < 3; k++) {
        io.line('colorWipe(ring.Color', k + 1);
        for (let i = 0; i < 12; i++) {
          io.line('setPixelColor(i, color)');
          b.ring.setPixel(i, ...cols[k].map(scale));
          io.line('ring.show();', 2); b.ring.show();
          io.pin('D6', `pixel ${i}`, true);
          io.line('delay(wait)', 1); await io.delay(p.wipe);
        }
      }
      io.line('"Rainbow"'); io.print('Rainbow');
      for (let first = 0; first < 65536; first += 1024) {
        io.line('long hue');
        for (let i = 0; i < 12; i++) {
          const rgb = colorHSV(first + Math.floor((i * 65536) / 12)).map(gamma8).map(scale);
          b.ring.setPixel(i, ...rgb);
        }
        io.line('ring.show();', 3); b.ring.show();
        io.pin('D6', `hue ${first}`, true);
        io.line('delay(wait)', 2); await io.delay(p.wait);
      }
    },
    reset(b) { b.ring.clear().show(); },
  },

  // ------------------------------------------------------------------ stepper
  {
    id: 'stepper', title: 'Precise steps', icon: 'gear',
    thumb: () => { const s = makeStepper(v(-2.2, 0, 0)); s.setAngle(60); return s.group; },
    view: { center: [6.4, 0.9, 0.2], size: 15.5 },
    build(ctx) {
      const st = ctx.add(makeStepper(v(11.7, 0, 0.5), { rotY: Math.PI })); // driver faces the board
      const ins = ['IN1', 'IN2', 'IN3', 'IN4'];
      const cols = ['blue', 'purple', 'yellow', 'orange'];
      const wires = ins.map((n, i) => ctx.wire(ctx.board.pin(`D${8 + i}`), st.pin(n), cols[i], { signal: `D${8 + i}`, lift: 1.4 + i * 0.12, chipT: 0.55 + i * 0.1 }));
      ctx.wire(ctx.board.pin('5V'), st.pin('VCC'), 'red', { signal: '5V', lift: 1.6 });
      ctx.wire(ctx.board.pin('GND_2'), st.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.3 });
      // the module's angle/coils getters are snapshots, so track the half-step count here
      const state = { queue: [], position: 0, half: 1 };
      st.setAngle(0).step(1); // park on a two-coil (full-step) position
      st.release();
      const send = (deg) => () => state.queue.push(String(deg));
      ctx.interact(st, {
        name: '28BYJ-48 + ULN2003', hint: 'Send an angle over serial (or type one in the serial monitor)',
        controls: [
          { type: 'button', label: 'Send 45', press: send(45) },
          { type: 'button', label: 'Send 90', press: send(90) },
          { type: 'button', label: 'Send −180', press: send(-180) },
          { type: 'button', label: 'Send 360', press: send(360) },
        ],
        note: () => `Shaft at ${((((((state.half - 1) * 360) / 4096) % 360) + 360) % 360).toFixed(1)}° · sketch thinks ${((state.position * 360) / 2048).toFixed(1)}°${state.queue.length ? ` · ${state.queue.length} queued` : ''}`,
      });
      ctx.anchor('motor', st.group.localToWorld(v(0, 3.2, -0.8)));
      ctx.anchor('drv', st.group.localToWorld(v(4.5, 0.9, -0.2)));
      ctx.anchor('in1', wires[0].mid);
      ctx.anchor('in4', wires[3].mid);
      return { st, wires, state };
    },
    callouts: [
      { anchor: 'in4', x: 0.04, y: 0.17, icon: 'pins', title: 'Pins 8–11', text: 'Four outputs energise the coils in turn.' },
      { anchor: 'drv', x: 0.7, y: 0.17, icon: 'chip', title: 'ULN2003 driver', text: 'Darlington switches carry the coil current; LEDs A–D show which coils are on.' },
      { anchor: 'motor', x: 0.36, y: 0.72, icon: 'gear', title: '28BYJ-48 stepper', text: '2048 full steps per turn through a 64:1 gearbox.' },
      { anchor: 'power', x: 0.04, y: 0.68, icon: 'plug', title: '5V for the coils', text: 'The motor draws ≈ 240 mA — never from an I/O pin.' },
    ],
    overview: {
      heading: 'Precise steps',
      text: 'A stepper motor moves in exact, repeatable steps instead of spinning freely. Energise its coils in the right order and the 28BYJ-48 turns 360° in 2048 steps — so any angle is just a number of steps.',
      features: [['gear', '<code>Stepper</code> library: <code>setSpeed()</code> and <code>step()</code>'], ['serial', 'Type an angle (e.g. <code>45</code> or <code>-90</code>) in the serial monitor'], ['hand', 'Click the motor to send angles from the 3D view']],
    },
    pinout: [['D8', 'IN1 (coil A)', ''], ['D9', 'IN2 (coil B)', ''], ['D10', 'IN3 (coil C)', ''], ['D11', 'IN4 (coil D)', ''], ['5V', 'Driver +', 'Use a separate 5 V supply for bigger loads'], ['GND', 'Driver −', 'Common ground']],
    example: {
      text: 'Steppers position 3D-printer heads, camera sliders, telescope mounts, automatic blinds and the needles in some car dashboards — anywhere you need “exactly this far”.',
      points: ['Note the pin order <code>8, 10, 9, 11</code> in the constructor — it matches the coil sequence the library expects', 'Above about 15 rpm this motor starts to skip steps', 'There is no position sensor: after a reset the sketch counts from zero again'],
    },
    specs: [['Motor', '28BYJ-48, 5 V unipolar'], ['Steps per turn', '2048 full steps (4096 half-steps)'], ['Step angle', '≈ 0.176° (full step)'], ['Max speed', '≈ 15 rpm'], ['Coil current', '≈ 240 mA'], ['Driver', 'ULN2003A Darlington array'], ['Library', 'Stepper (built-in)']],
    quiz: [
      { q: "How many steps turn the 28BYJ-48 shaft by 90° in full-step mode?", options: ["90", "512", "1024", "2048"], answer: 1, explain: "2048 steps per revolution ÷ 4 = 512 steps for a quarter turn." },
      { q: "Why does the sketch use the pin order 8, 10, 9, 11?", options: ["It’s a typo", "So the library’s 4-step sequence energises coils A-B, B-C, C-D, D-A in order", "Pins 9 and 10 are PWM", "To make it turn backwards"], answer: 1, explain: "The Stepper library pairs its wires differently from the ULN2003 board’s IN1–IN4 order; swapping the middle two makes the coils fire in sequence." },
      { q: "What happens to the angle the sketch prints after you press reset?", options: ["It remembers the real angle", "It restarts from 0 — the motor has no position sensor", "The motor homes itself", "It goes negative"], answer: 1, explain: "Steppers are open-loop: the program only counts the steps it sent. Real machines use a limit switch to ‘home’ at start-up." },
      { q: "Why is the motor powered through the ULN2003 rather than from the pins directly?", options: ["The coils need ≈ 240 mA — far more than a pin can supply", "The pins are too fast", "Steppers need 12 V", "To make it quieter"], answer: 0, explain: "A pin manages about 20 mA; the driver’s transistors switch the coil current from the 5 V supply." },
    ],
    challenges: ["Make the shaft tick round like a clock’s second hand: 6° every second.", "Add a button that ‘homes’ the motor: turn until a limit switch closes, then set position to 0.", "Write turnTo(angle) that moves to an absolute angle by the shortest direction."],
    code: `#include <Stepper.h>

const int STEPS_PER_REV = 2048;   // 28BYJ-48 in full-step mode
// Coil order for the ULN2003 board: IN1, IN3, IN2, IN4
Stepper motor(STEPS_PER_REV, 8, 10, 9, 11);
long position = 0;                // steps since power-up

void setup() {
  motor.setSpeed({{rpm}});            // rpm (this motor tops out ≈ 15)
  Serial.begin(9600);
  Serial.println("Type an angle in degrees, e.g. 45 or -90");
}

void rotate(float degrees) {
  long steps = lround(degrees * STEPS_PER_REV / 360.0);
  motor.step(steps);              // blocks until the move is done
  position += steps;
  Serial.print("Angle: ");
  Serial.println(position * 360.0 / STEPS_PER_REV, 1);
}

void loop() {
  if (Serial.available()) {
    float deg = Serial.readStringUntil('\\n').toFloat();
    rotate(deg);
  } else {
    rotate({{angle}});                // otherwise tick round
    delay({{pause}});
  }
}`,
    params: { rpm: { value: 10, min: 1, max: 15 }, angle: { value: 90, min: -360, max: 360 }, pause: { value: 1000, min: 0, max: 5000 } },
    async setup(io, b) {
      b.state.position = 0;
      io.line('setSpeed'); await io.delay(100);
      io.line('Serial.println("Type'); io.print('Type an angle in degrees, e.g. 45 or -90');
      await io.delay(100);
    },
    async loop(io, b, p) {
      const rotate = async (deg) => {
        io.line('long steps');
        const steps = Math.round((deg * 2048) / 360);
        io.line('motor.step(steps)');
        const msPerStep = 60000 / (2048 * Math.max(1, p.rpm));
        const dir = Math.sign(steps);
        let done = 0;
        const n = Math.abs(steps);
        while (done < n) {
          const k = Math.min(n - done, Math.max(1, Math.round(32 / msPerStep)));
          for (let i = 0; i < k; i++) { b.st.step(dir); b.st.step(dir); }
          b.state.half += 2 * k * dir;
          done += k;
          HALF_STEPS[((b.state.half % 8) + 8) % 8].forEach((c, i) => io.pin(`D${8 + i}`, c ? 'HIGH' : 'LOW', !!c));
          await io.delay(k * msPerStep);
        }
        b.state.position += steps;
        io.line('Serial.println(position');
        io.print(`Angle: ${((b.state.position * 360) / 2048).toFixed(1)}`);
      };
      const fromMonitor = io.readLine();
      const typed = fromMonitor ?? b.state.queue.shift() ?? null;
      io.line('Serial.available');
      if (typed !== null) {
        if (fromMonitor === null) io.print(`> ${typed}`); // sent from the 3D view
        io.line('toFloat');
        const deg = parseFloat(typed);
        await rotate(Number.isFinite(deg) ? deg : 0);
      } else {
        io.line('rotate(', 3);
        await rotate(p.angle);
        io.line('delay('); await io.delay(p.pause);
      }
    },
    reset(b) { b.st.release(); b.state.queue.length = 0; },
    serialInput: { placeholder: 'Angle in degrees, e.g. 45' },
  },

  // ------------------------------------------------------------------ relay
  {
    id: 'relay-lamp', title: 'Switch a lamp', icon: 'bolt',
    thumb: () => { const r = makeRelay(v(0, 0, 0)); r.set(true); return r.group; },
    view: { center: [6.2, 1.4, -3.2], size: 18 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const relay = ctx.add(makeRelay(v(2.6, 0, -6.6)));
      const lamp = ctx.add(makeLamp(v(13.6, 0, -7.4), { rotY: -0.5 }));
      const psu = ctx.add(makeSupply(v(8.0, 0, -7.6), { lines: ['8 × AA', '12 V DC'], rotY: Math.PI / 2 }));
      const btn = ctx.add(makeButton([bb.hole(5, 'e'), bb.hole(7, 'e'), bb.hole(5, 'f'), bb.hole(7, 'f')]));
      const inW = ctx.wire(ctx.board.pin('D7'), relay.pin('IN'), 'orange', { signal: 'D7', lift: 1.2 });
      ctx.wire(ctx.board.pin('5V'), relay.pin('VCC'), 'red', { signal: '5V', lift: 2.6 });
      ctx.wire(ctx.board.pin('GND'), relay.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.0 });
      const bw = ctx.wire(ctx.board.pin('D2'), bb.hole(5, 'a'), 'yellow', { signal: 'D2' });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(7, 'j'), 'black', { signal: 'GND', dir: -1 });
      const load = [
        ctx.wire(psu.plus(), relay.terminal('COM'), 'red', { lift: 1.4 }),
        ctx.wire(relay.terminal('NO'), lamp.terminal(0), 'red', { lift: 1.8 }),
        ctx.wire(lamp.terminal(1), psu.minus(), 'black', { lift: 1.2 }),
      ];
      const state = { requests: [], on: false };
      ctx.interact(btn, { name: 'Push button', hint: 'Press to toggle the lamp', hold: { down: () => btn.press(true), up: () => btn.press(false) } });
      ctx.interact(relay, {
        name: 'Relay module', hint: 'An electromagnet flips a switch that is isolated from the board',
        controls: [{ type: 'button', label: 'Send “toggle” over serial', press: () => state.requests.push('toggle') }],
        note: () => `Coil ${state.on ? 'energised — COM connected to NO' : 'off — COM connected to NC'}`,
      });
      ctx.interact(lamp, { name: '12 V lamp', hint: 'Runs from its own supply — the board only drives the relay coil', note: () => (lamp.on ? 'On' : 'Off') });
      ctx.interact(psu, { name: '12 V supply', hint: 'A separate supply for the load; it never touches the board’s pins' });
      ctx.anchor('relay', relay.anchor);
      ctx.anchor('lamp', lamp.anchor);
      ctx.anchor('btn', btn.anchor);
      ctx.anchor('in', inW.mid);
      ctx.anchor('d2', bw.mid);
      ctx.anchor('load', load[1].mid);
      return { relay, lamp, btn, load, state, lampOn: false, last: 1 };
    },
    callouts: [
      { anchor: 'in', x: 0.04, y: 0.17, icon: 'pins', title: 'IN · pin 7', text: 'A logic HIGH turns on the module’s transistor and coil.' },
      { anchor: 'load', x: 0.36, y: 0.12, icon: 'bolt', title: 'Separate circuit', text: '12 V flows COM → NO → lamp only while the relay is on.' },
      { anchor: 'lamp', x: 0.7, y: 0.17, icon: 'sun', title: '12 V lamp', text: 'Its current never passes through the board.' },
      { anchor: 'btn', x: 0.7, y: 0.68, icon: 'hand', title: 'Toggle button', text: 'Press it, or type on / off / toggle in the serial monitor.' },
      { anchor: 'relay', x: 0.04, y: 0.68, icon: 'transistor', title: 'Relay module', text: 'Transistor, flyback diode and LEDs are already on the board.' },
    ],
    overview: {
      heading: 'Switch a lamp',
      text: 'A relay is a switch flipped by an electromagnet. The board only powers the small coil (through the module’s transistor); the contacts switch a completely separate 12 V lamp circuit.',
      features: [['transistor', 'Module includes transistor + flyback diode'], ['serial', 'Control from a button or by typing <code>on</code> / <code>off</code>'], ['info', 'Mains wiring is dangerous: see the safety notes']],
    },
    pinout: [['D7', 'Relay IN', 'HIGH = on (some modules are active-LOW)'], ['5V / GND', 'Relay VCC / GND', 'Coil ≈ 70 mA'], ['D2', 'Button', 'INPUT_PULLUP, other leg to GND'], ['COM / NO', '12 V supply + / lamp', 'Separate circuit'], ['Lamp –', '12 V supply –', '']],
    example: {
      text: 'Relays switch heaters, pumps, garage doors and lights in smart-home gear. <b>Safety:</b> mains (110–240 V) can kill. Practise with low-voltage DC loads like this one; anything on mains needs an enclosed, certified module, proper insulation and fusing, and a qualified person.',
      points: ['NO = normally open (connected only while energised); NC = normally closed', 'Check the contact ratings — 10 A at 250 V AC / 30 V DC here', 'For silent, fast switching of DC loads, a MOSFET is often better'],
    },
    specs: [['Relay', 'SRD-05VDC-SL-C, 5 V coil'], ['Coil current', '≈ 70 mA (via the module’s transistor)'], ['Contacts', 'COM / NO / NC, 10 A 250 V AC, 10 A 30 V DC'], ['Load here', '12 V DC lamp, ≈ 0.5 A'], ['Switching time', '≈ 10 ms, audible click'], ['Logic', 'Active-HIGH (check yours)']],
    quiz: [
      { q: "Which terminals are connected when the relay coil is NOT energised?", options: ["COM and NO", "COM and NC", "NO and NC", "None"], answer: 1, explain: "NC means normally closed: COM touches NC until the coil pulls the arm over to NO." },
      { q: "Why does the lamp have its own supply?", options: ["The board can’t power 12 V loads — the relay just switches the separate circuit", "To make it brighter", "Relays only work on batteries", "It doesn’t need one"], answer: 0, explain: "The relay contacts are isolated from the coil, so the board controls the lamp without its current ever passing through the pins." },
      { q: "Why does setup() write the relay pin LOW before calling pinMode(OUTPUT)?", options: ["It’s required by the compiler", "So the relay doesn’t click on for a moment at start-up", "To save power", "To debounce the button"], answer: 1, explain: "Setting the output level first means the pin starts in the ‘off’ state the instant it becomes an output." },
      { q: "What is the safest way to start learning relay control?", options: ["Switch a mains lamp on the bench", "Use a low-voltage DC load like a 12 V lamp or LED strip", "Touch the terminals to test them", "Remove the module’s diode"], answer: 1, explain: "Low-voltage DC teaches exactly the same logic without the risk of a lethal shock." },
    ],
    challenges: ["Make the lamp switch itself off automatically 10 seconds after it was turned on.", "Add a light sensor so the lamp only turns on when it’s dark.", "Add a second relay and a ‘both’ command; print the state of each."],
    code: `const int BUTTON = 2;
const int RELAY = 7;
const int RELAY_ON = HIGH;        // most transistor modules;
const int RELAY_OFF = LOW;        // swap for an active-LOW module
bool lampOn = false;
int lastButton = HIGH;

void setRelay(bool on) {
  lampOn = on;
  digitalWrite(RELAY, on ? RELAY_ON : RELAY_OFF);
  Serial.println(on ? "Lamp ON" : "Lamp OFF");
}

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  digitalWrite(RELAY, RELAY_OFF); // start off...
  pinMode(RELAY, OUTPUT);         // ...before the pin becomes an output
  Serial.begin(9600);
  Serial.println("Type on, off or toggle");
}

void loop() {
  int b = digitalRead(BUTTON);
  if (b == LOW && lastButton == HIGH) {   // just pressed
    setRelay(!lampOn);
    delay(50);                            // debounce
  }
  lastButton = b;

  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    if (cmd == "on") setRelay(true);
    else if (cmd == "off") setRelay(false);
    else if (cmd == "toggle") setRelay(!lampOn);
  }
}`,
    params: {},
    async setup(io, b) {
      b.lampOn = false; b.last = 1;
      io.line('INPUT_PULLUP'); await io.delay(80);
      io.line('digitalWrite(RELAY, RELAY_OFF)'); io.pin('D7', 'LOW', false); await io.delay(80);
      io.line('pinMode(RELAY'); await io.delay(80);
      io.line('"Type on'); io.print('Type on, off or toggle');
    },
    async loop(io, b) {
      const setRelay = (on) => {
        b.lampOn = on;
        b.state.on = on;
        io.line('digitalWrite(RELAY, on');
        b.relay.set(on);
        b.lamp.set(on);
        b.load.forEach((w) => { w.live = on; });
        io.pin('D7', on ? 'HIGH' : 'LOW', on);
        io.line('"Lamp ON"'); io.print(on ? 'Lamp ON' : 'Lamp OFF');
      };
      io.line('int b = digitalRead');
      const s = b.btn.pressed ? 0 : 1;
      io.pin('D2', s ? 'HIGH' : 'LOW', !s);
      if (s === 0 && b.last === 1) {
        io.line('setRelay(!lampOn);', 1);
        setRelay(!b.lampOn);
        io.line('delay(50)'); await io.delay(50);
      }
      b.last = s;
      const fromMonitor = io.readLine();
      const typed = fromMonitor ?? b.state.requests.shift() ?? null;
      if (typed !== null) {
        if (fromMonitor === null) io.print(`> ${typed}`); // sent from the 3D view
        io.line('readStringUntil');
        const cmd = typed.trim();
        if (cmd === 'on') { io.line('cmd == "on"'); setRelay(true); }
        else if (cmd === 'off') { io.line('cmd == "off"'); setRelay(false); }
        else if (cmd === 'toggle') { io.line('cmd == "toggle"'); setRelay(!b.lampOn); }
      }
      await io.delay(20);
    },
    reset(b) { b.relay.set(false); b.lamp.set(false); b.load.forEach((w) => { w.live = false; }); b.lampOn = false; b.state.on = false; b.state.requests.length = 0; },
    serialInput: { placeholder: 'on / off / toggle' },
  },

  // ------------------------------------------------------------------ L298N
  {
    id: 'dc-motor-driver', title: 'Drive motors both ways', icon: 'motor',
    thumb: () => makeL298N(v(0, 0, 0)).group,
    view: { center: [6.6, 0.9, -1.4], size: 17.5 },
    build(ctx) {
      const drv = ctx.add(makeL298N(v(8.4, 0, -0.2), { rotY: -Math.PI / 2 }));
      const mA = ctx.add(makeMotor(v(13.6, 0, -2.4)));
      const mB = ctx.add(makeMotor(v(13.6, 0, 2.7)));
      const bat = ctx.add(makeSupply(v(5.6, 0, -7.0), { lines: ['6 × AA', '9 V'] }));
      const ctl = [['ENA', 'D9', 'yellow'], ['IN1', 'D8', 'orange'], ['IN2', 'D7', 'brown'], ['IN3', 'D5', 'green'], ['IN4', 'D4', 'blue'], ['ENB', 'D3', 'purple']];
      const w = {};
      ctl.forEach(([pin, d, col], i) => { w[pin] = ctx.wire(ctx.board.pin(d), drv.pin(pin), col, { signal: d, lift: 1.8 + i * 0.12 }); });
      ctx.wire(bat.plus(), drv.pin('12V'), 'red', { lift: 1.6 });
      ctx.wire(bat.minus(), drv.pin('GND'), 'black', { lift: 1.4 });
      const gw = ctx.wire(ctx.board.pin('GND'), drv.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 2.2 });
      const out = [
        ctx.wire(drv.pin('OUT1'), mA.terminals[0], 'red', { lift: 1.4 }),
        ctx.wire(drv.pin('OUT2'), mA.terminals[1], 'black', { lift: 1.6 }),
        ctx.wire(drv.pin('OUT3'), mB.terminals[0], 'red', { lift: 1.4 }),
        ctx.wire(drv.pin('OUT4'), mB.terminals[1], 'black', { lift: 1.6 }),
      ];
      const state = { volts: 9, m: [{ target: 0, speed: 0, tau: 0.3 }, { target: 0, speed: 0, tau: 0.3 }] };
      ctx.onTick((dt) => {
        state.m.forEach((m, i) => {
          m.speed += (m.target - m.speed) * Math.min(1, dt / m.tau);
          (i ? mB : mA).set(m.speed);
          const live = Math.abs(m.target) > 0.01;
          out[i * 2].live = live; out[i * 2 + 1].live = live;
          out[i * 2].speed = out[i * 2 + 1].speed = 0.3 + Math.abs(m.speed);
        });
      });
      ctx.interact(bat, {
        name: 'Motor battery', hint: 'Motors get their own supply; the L298N drops ≈ 2 V',
        controls: [{ type: 'choice', label: 'Battery', options: [[6, '4 × AA · 6 V'], [9, '6 × AA · 9 V'], [12, '8 × AA · 12 V']], get: () => state.volts, set: (x) => (state.volts = x) }],
        note: () => `≈ ${(state.volts - 2).toFixed(0)} V reaches the motors at full PWM`,
      });
      ctx.interact(drv, { name: 'L298N H-bridge', hint: 'Two H-bridges: IN pins pick the direction, EN pins (PWM) the speed' });
      ctx.interact(mA, { name: 'Motor A', hint: 'Driven by OUT1 / OUT2' });
      ctx.interact(mB, { name: 'Motor B', hint: 'Driven by OUT3 / OUT4' });
      ctx.anchor('drv', drv.anchor);
      ctx.anchor('ena', w.ENA.mid);
      ctx.anchor('in1', w.IN2.mid);
      ctx.anchor('mA', mA.anchor);
      ctx.anchor('mB', mB.anchor);
      ctx.anchor('bat', bat.anchor);
      ctx.anchor('gnd', gw.mid);
      return { drv, mA, mB, state };
    },
    callouts: [
      { anchor: 'bat', x: 0.04, y: 0.17, icon: 'bolt', title: 'Motor supply', text: 'Batteries feed the motors; GND is shared with the board.' },
      { anchor: 'in1', x: 0.36, y: 0.12, icon: 'pins', title: 'IN1 / IN2', text: 'HIGH-LOW = forward, LOW-HIGH = reverse, equal = brake.' },
      { anchor: 'mA', x: 0.7, y: 0.17, icon: 'motor', title: 'Motor A', text: 'OUT1 and OUT2 swap polarity to reverse it.' },
      { anchor: 'drv', x: 0.36, y: 0.72, icon: 'chip', title: 'L298N', text: 'Two H-bridges, each four transistors around a motor.' },
      { anchor: 'ena', x: 0.04, y: 0.68, icon: 'pwm', title: 'ENA · pin ~9', text: 'PWM on the enable pin sets the speed.' },
      { anchor: 'mB', x: 0.7, y: 0.68, icon: 'motor', title: 'Motor B', text: 'Its own bridge: IN3, IN4 and ENB.' },
    ],
    overview: {
      heading: 'Drive motors both ways',
      text: 'An H-bridge is four switches around a motor. Close one diagonal pair and current flows one way; close the other and the motor reverses. The L298N has two bridges, so it drives two motors with direction and PWM speed.',
      features: [['motor', 'Forward, brake, reverse, spin and coast'], ['pwm', '<code>analogWrite()</code> on ENA / ENB sets the speed'], ['bolt', 'Click the battery to change the motor voltage']],
    },
    pinout: [['D9 ~', 'ENA', 'Remove the ENA jumper'], ['D8 / D7', 'IN1 / IN2', 'Motor A direction'], ['D3 ~', 'ENB', 'Remove the ENB jumper'], ['D5 / D4', 'IN3 / IN4', 'Motor B direction'], ['Battery +', '12V terminal', '6–12 V'], ['GND', 'GND terminal', 'Battery – and board GND together']],
    example: {
      text: 'Robot cars, tracked rovers, conveyor belts and motorised blinds all need motors that reverse. Two-wheeled robots steer by running their wheels at different speeds — or in opposite directions to spin on the spot.',
      points: ['<b>Brake</b> (IN1 = IN2, EN on) shorts the motor and stops it fast; <b>coast</b> (EN off) lets it free-wheel', 'Never set both switches on one side on at once — the L298N’s logic prevents this shoot-through for you', 'Swap the motor’s two wires if “forward” turns the wrong way'],
    },
    specs: [['Driver', 'L298N dual full H-bridge'], ['Motor supply', '5–35 V (here 9 V)'], ['Current', '2 A per channel (peak 3 A)'], ['Voltage drop', '≈ 2 V (bipolar transistors)'], ['Logic', '5 V; on-board 5 V regulator'], ['PWM', '≈ 490 Hz on D9 and D3']],
    quiz: [
      { q: "With ENA on, what does IN1 = LOW and IN2 = HIGH do?", options: ["Forward", "Reverse", "Brake", "Coast"], answer: 1, explain: "Swapping which input is HIGH reverses the current through the motor, so it turns the other way." },
      { q: "What is the difference between brake and coast?", options: ["None", "Brake shorts the motor so it stops quickly; coast disconnects it so it free-wheels", "Coast is faster", "Brake reverses the motor"], answer: 1, explain: "IN1 = IN2 with EN on shorts the motor terminals (fast stop); EN off leaves them floating (slow stop)." },
      { q: "Why must the board’s GND connect to the L298N’s GND?", options: ["To power the board", "The IN and EN signals need a shared 0 V reference", "To make the motors faster", "It doesn’t need to"], answer: 1, explain: "Logic levels are voltages relative to ground; without a common ground the driver can’t tell HIGH from LOW." },
      { q: "How do you make a two-wheeled robot spin on the spot?", options: ["Both motors forward", "One motor forward, the other reverse", "Brake both", "Coast one motor"], answer: 1, explain: "Wheels turning in opposite directions rotate the robot about its centre." },
    ],
    challenges: ["Ramp motor A smoothly from 0 to full speed and back with a for loop.", "Steer a robot: write turnLeft() and turnRight() with one wheel slower than the other.", "Control both motors from the serial monitor: f, b, l, r and s for stop."],
    code: `// Motor A
const int ENA = 9, IN1 = 8, IN2 = 7;
// Motor B
const int ENB = 3, IN3 = 5, IN4 = 4;

void setup() {
  int pins[] = {ENA, IN1, IN2, ENB, IN3, IN4};
  for (int p : pins) pinMode(p, OUTPUT);
  Serial.begin(9600);
}

// speed: -255 (full reverse) ... 255 (full forward)
void drive(int en, int inA, int inB, int speed) {
  digitalWrite(inA, speed > 0 ? HIGH : LOW);
  digitalWrite(inB, speed < 0 ? HIGH : LOW);
  analogWrite(en, abs(speed));
}

void brake(int en, int inA, int inB) {
  digitalWrite(inA, LOW);         // both inputs equal...
  digitalWrite(inB, LOW);
  digitalWrite(en, HIGH);         // ...with EN on: fast stop
}

void loop() {
  Serial.println("Forward");
  drive(ENA, IN1, IN2, {{speed}});
  drive(ENB, IN3, IN4, {{speed}});
  delay(2000);

  Serial.println("Brake");
  brake(ENA, IN1, IN2);
  brake(ENB, IN3, IN4);
  delay(1000);

  Serial.println("Reverse");
  drive(ENA, IN1, IN2, -{{speed}});
  drive(ENB, IN3, IN4, -{{speed}});
  delay(2000);

  Serial.println("Spin");
  drive(ENA, IN1, IN2, {{speed}});
  drive(ENB, IN3, IN4, -{{speed}});
  delay(1500);

  Serial.println("Coast");
  analogWrite(ENA, 0);            // EN off: motors free-wheel
  analogWrite(ENB, 0);
  delay(1500);
}`,
    params: { speed: { value: 200, min: 0, max: 255 } },
    async setup(io) { io.line('for (int p'); await io.delay(120); io.line('Serial.begin'); await io.delay(80); },
    async loop(io, b, p) {
      const vf = Math.max(0, b.state.volts - 2) / 7;
      const pins = [['D9', 'D8', 'D7'], ['D3', 'D5', 'D4']];
      const drive = (m, sp) => {
        const [en, a, c] = pins[m];
        io.pin(a, sp > 0 ? 'HIGH' : 'LOW', sp > 0);
        io.pin(c, sp < 0 ? 'HIGH' : 'LOW', sp < 0);
        io.pin(en, `PWM ${Math.abs(sp)}`, sp !== 0);
        Object.assign(b.state.m[m], { target: (sp / 255) * vf, tau: 0.35 });
      };
      const brake = (m) => {
        const [en, a, c] = pins[m];
        io.pin(a, 'LOW', false); io.pin(c, 'LOW', false); io.pin(en, 'HIGH', true);
        Object.assign(b.state.m[m], { target: 0, tau: 0.08 });
      };
      const sp = p.speed;
      io.line('"Forward"'); io.print('Forward');
      io.line(`drive(ENA, IN1, IN2, ${sp})`); drive(0, sp);
      io.line(`drive(ENB, IN3, IN4, ${sp})`); drive(1, sp);
      io.line('delay(2000)', 1); await io.delay(2000);
      io.line('"Brake"'); io.print('Brake');
      io.line('brake(ENA'); brake(0);
      io.line('brake(ENB'); brake(1);
      io.line('delay(1000)'); await io.delay(1000);
      io.line('"Reverse"'); io.print('Reverse');
      io.line(`drive(ENA, IN1, IN2, -${sp})`); drive(0, -sp);
      io.line(`drive(ENB, IN3, IN4, -${sp})`); drive(1, -sp);
      io.line('delay(2000)', 2); await io.delay(2000);
      io.line('"Spin"'); io.print('Spin');
      io.line(`drive(ENA, IN1, IN2, ${sp})`, 2); drive(0, sp);
      io.line(`drive(ENB, IN3, IN4, -${sp})`, 2); drive(1, -sp);
      io.line('delay(1500)', 1); await io.delay(1500);
      io.line('"Coast"'); io.print('Coast');
      io.line('analogWrite(ENA, 0)'); io.pin('D9', 'PWM 0', false); b.state.m[0].target = 0; b.state.m[0].tau = 0.9;
      io.line('analogWrite(ENB, 0)'); io.pin('D3', 'PWM 0', false); b.state.m[1].target = 0; b.state.m[1].tau = 0.9;
      io.line('delay(1500)', 2); await io.delay(1500);
    },
    reset(b) { b.state.m.forEach((m) => { m.target = 0; m.tau = 0.6; }); },
  },

  // ------------------------------------------------------------------ mini piano
  {
    id: 'mini-piano', title: 'Mini piano', icon: 'sound',
    thumb: () => {
      const g = new THREE.Group();
      [-0.8, 0, 0.8].forEach((x, i) => g.add(makeButton([v(x - 0.25, 0, -0.38), v(x + 0.25, 0, -0.38), v(x - 0.25, 0, 0.38), v(x + 0.25, 0, 0.38)], [0xd8443a, 0xf2c230, 0x3a6fd0][i]).group));
      return g;
    },
    view: { center: [6.8, 0.6, -0.6], size: 14.5 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const caps = [0xd8443a, 0xef8a2b, 0xf2c230, 0x3aa65a, 0x3a6fd0, 0x8a5cc6, 0xece8dc, 0x7a4a26];
      const keys = NOTE_NAMES.map((name, i) => {
        const c = 2 + i * 3;
        const k = ctx.add(makeButton([bb.hole(c, 'e'), bb.hole(c + 2, 'e'), bb.hole(c, 'f'), bb.hole(c + 2, 'f')], caps[i]));
        const w = ctx.wire(ctx.board.pin(`D${2 + i}`), bb.hole(c, 'a'), KEY_WIRES[i], { signal: `D${2 + i}`, chipT: 0.9 - i * 0.075 });
        ctx.wire(bb.hole(c + 2, 'j'), bb.hole(c + 2, 'bot-'), 'black', { lift: 0.5 });
        ctx.interact(k, { name: `${name} key`, hint: 'Press and hold to play the note', hold: { down: () => k.press(true), up: () => k.press(false) } });
        return { k, w };
      });
      const bz = ctx.add(makeBuzzer(bb.hole(27, 'h'), bb.hole(30, 'h')));
      const bw = ctx.wire(ctx.board.pin('D10'), bb.hole(27, 'j'), 'orange', { signal: 'D10', lift: 2.4 });
      ctx.wire(bb.hole(30, 'j'), bb.hole(29, 'bot-'), 'black', { lift: 0.5 });
      const gw = ctx.wire(ctx.board.pin('GND_2'), bb.hole(1, 'bot-'), 'black', { signal: 'GND', dir: -1 });
      let held = null;
      ctx.interact(bz, {
        name: 'Keyboard', hint: 'Hold a note button below (or press the 3D keys)',
        controls: [{ type: 'keys', label: 'Play', keys: NOTE_NAMES, down: (n) => { held = keys[NOTE_NAMES.indexOf(n)]?.k; held?.press(true); }, up: () => { held?.press(false); held = null; } }],
      });
      ctx.anchor('k0', keys[0].k.anchor);
      ctx.anchor('k7', keys[7].k.anchor);
      ctx.anchor('bz', bz.anchor);
      ctx.anchor('bw', bw.mid);
      ctx.anchor('gnd', gw.mid);
      ctx.anchor('w4', keys[4].w.mid);
      return { keys: keys.map((x) => x.k), bz, playing: -1 };
    },
    callouts: [
      { anchor: 'w4', x: 0.36, y: 0.12, icon: 'pins', title: 'Pins 2–9', text: 'One input per key, all with INPUT_PULLUP.' },
      { anchor: 'k0', x: 0.04, y: 0.68, icon: 'hand', title: 'Keys C4 … C5', text: 'Press and hold a key to play its note.' },
      { anchor: 'gnd', x: 0.36, y: 0.74, icon: 'gnd', title: 'Shared GND rail', text: 'Every key’s other leg goes to the – rail.' },
      { anchor: 'bz', x: 0.7, y: 0.68, icon: 'sound', title: 'Piezo · pin 10', text: 'tone() plays the note while a key is held.' },
    ],
    overview: {
      heading: 'Mini piano',
      text: 'Eight push buttons make a one-octave keyboard. The sketch scans the keys, and while one is held it plays that note on the piezo with <code>tone()</code>. Change <code>TRANSPOSE</code> to shift every note by semitones.',
      features: [['button', 'Eight inputs with <code>INPUT_PULLUP</code> — no resistors'], ['sound', '<code>tone()</code> / <code>noTone()</code> on the piezo'], ['hand', 'Hold the 3D keys, or click the buzzer for a keyboard']],
    },
    pinout: [['D2–D9', 'Key buttons C4 … C5', 'Other leg → GND rail'], ['D10', 'Piezo +', ''], ['GND', 'Breadboard – rail', 'Piezo – and all keys']],
    example: {
      text: 'Toy keyboards, doorbells with tunes and game controllers all scan buttons like this. Real music keyboards scan a grid (matrix) of keys so 61 keys need only a handful of pins.',
      points: ['Try <code>TRANSPOSE = 12</code> to jump up an octave', 'Each semitone multiplies the frequency by 2<sup>1/12</sup> ≈ 1.0595', 'A passive piezo can only play one note at a time with <code>tone()</code>'],
    },
    specs: [['Keys', '8 × 6 mm tactile buttons'], ['Range', 'C4 (262 Hz) – C5 (523 Hz)'], ['Sound', 'Passive piezo on D10'], ['Polyphony', '1 note (lowest held key wins)'], ['Scan rate', '≈ 100 times per second']],
    quiz: [
      { q: "With INPUT_PULLUP, what does a key’s pin read while it’s held?", options: ["HIGH", "LOW", "1023", "It floats"], answer: 1, explain: "The pull-up holds the pin HIGH; pressing the button connects it to the GND rail." },
      { q: "Why does the sketch only call tone() when the pressed key changes?", options: ["tone() is slow", "Calling it every loop would restart the note and make it buzz", "To save memory", "It can only be called once"], answer: 1, explain: "Re-triggering tone() 100 times a second causes glitches; tracking ‘playing’ means each note starts once." },
      { q: "What frequency does TRANSPOSE = 12 give the A4 key (440 Hz)?", options: ["452 Hz", "660 Hz", "880 Hz", "220 Hz"], answer: 2, explain: "12 semitones is one octave: 440 × 2^(12/12) = 880 Hz." },
    ],
    challenges: ["Light an LED while any key is held.", "Record the last 16 notes you play and replay them when you press two keys together.", "Add a ‘sharp’ button that raises any note by one semitone while held."],
    code: `const int BUZZER = 10;
const int KEYS[] = {2, 3, 4, 5, 6, 7, 8, 9};
const int NOTES[] = {262, 294, 330, 349, 392, 440, 494, 523};
const char* const NAMES[] = {"C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"};
const int TRANSPOSE = {{shift}};      // semitones up (+) or down (-)
int playing = -1;                 // key being played, -1 = none

void setup() {
  for (int i = 0; i < 8; i++) pinMode(KEYS[i], INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int pressed = -1;
  for (int i = 0; i < 8; i++) {
    if (digitalRead(KEYS[i]) == LOW) { pressed = i; break; }
  }
  if (pressed != playing) {
    if (pressed >= 0) {
      unsigned int freq = NOTES[pressed] * pow(2.0, TRANSPOSE / 12.0);
      tone(BUZZER, freq);
      Serial.print(NAMES[pressed]);
      Serial.print(" ");
      Serial.println(freq);
    } else {
      noTone(BUZZER);
    }
    playing = pressed;
  }
  delay(10);
}`,
    params: { shift: { value: 0, min: -12, max: 12 } },
    async setup(io, b) {
      b.playing = -1;
      io.line('INPUT_PULLUP'); await io.delay(120);
      io.print('Hold a key to play — click the buzzer for a keyboard');
    },
    async loop(io, b, p) {
      io.line('digitalRead(KEYS[i])');
      const pressed = b.keys.findIndex((k) => k.pressed);
      b.keys.forEach((k, i) => io.pin(`D${2 + i}`, k.pressed ? 'LOW' : 'HIGH', k.pressed));
      if (pressed !== b.playing) {
        if (pressed >= 0) {
          io.line('unsigned int freq');
          const f = Math.trunc(NOTE_HZ[pressed] * 2 ** (p.shift / 12));
          io.line('tone(BUZZER'); io.tone(f); b.bz.set(true, f); io.pin('D10', `${f} Hz`, true);
          io.line('Serial.println(freq)'); io.print(`${NOTE_NAMES[pressed]} ${f}`);
        } else {
          io.line('noTone'); io.noTone(); b.bz.set(false); io.pin('D10', 'LOW', false);
        }
        b.playing = pressed;
      }
      io.line('delay(10)'); await io.delay(16);
    },
    reset(b, io) { b.bz.set(false); io?.noTone(); b.playing = -1; },
  },
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['palette', 'NeoPixel ring (WS2812B)', 'Chain of addressable RGB LEDs driven from one data pin.', 'neopixel-ring'],
  ['gear', 'Stepper motor + ULN2003', '28BYJ-48 geared stepper: 2048 exact steps per turn.', 'stepper'],
  ['bolt', 'Relay module', 'Electromagnetic switch for a separate, higher-power circuit.', 'relay-lamp'],
  ['motor', 'L298N H-bridge', 'Dual motor driver: direction and PWM speed for two DC motors.', 'dc-motor-driver'],
  ['bolt', 'Battery pack', 'Separate supply for motors and lamps; share its ground with the board.', 'dc-motor-driver'],
];
