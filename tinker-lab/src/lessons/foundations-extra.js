// Track 1 (continued) — more Foundations: sequencing, PWM, arrays, serial
// commands, edge detection and non-blocking timing on an Uno-style board.
import * as THREE from 'three';
import { makeLED, makeResistor, makeButton } from '../scene/components.js';
import { v, BB, ledOnPin, LED_COLORS, OHMS, ledGain } from './helpers.js';
import { serialPlotter } from '../runtime/devices.js';

/**
 * Compact LED: pin → wire into row a, resistor bridging the centre channel
 * (row d → row g), LED from row j straight into the front ground rail (bot−).
 * Uses three columns per LED, so six fit on a half-size breadboard.
 */
function railLed(ctx, bb, { pin, col, color = 'red', ohms = 220, wireColor = 'orange' }) {
  const res = ctx.add(makeResistor(bb.hole(col, 'd'), bb.hole(col, 'g'), ohms, { height: 0.5 }));
  const led = ctx.add(makeLED(color, bb.hole(col, 'j'), bb.hole(col, 'bot-')));
  const sig = ctx.wire(ctx.board.pin(pin), bb.hole(col, 'a'), wireColor, { signal: pin });
  const state = { gain: ledGain(ohms) };
  ctx.interact(led, {
    name: `LED on ${pin}`, hint: 'Click to change its colour',
    controls: [{ type: 'choice', label: 'Colour', options: LED_COLORS, get: () => led.color, set: (c) => led.setColor(c) }],
  });
  ctx.interact(res, {
    name: 'Resistor', hint: 'Click to try other values',
    controls: [{
      type: 'choice', label: 'Resistance', options: OHMS, get: () => res.ohms,
      set: (o) => { res.setValue(o); state.gain = ledGain(o); led.set(led.level > 0 ? state.gain : 0); },
    }],
    note: () => `Current ≈ ${((3 / res.ohms) * 1000).toFixed(1)} mA${res.ohms < 150 ? ' — too much for a small LED!' : ''}`,
  });
  return { res, led, sig, state, on: (x = 1) => led.set(x * state.gain) };
}

/** One black jumper from a board GND pin to the front ground rail. */
function groundRail(ctx, bb, col = 2, pin = 'GND_2') {
  return ctx.wire(ctx.board.pin(pin), bb.hole(col, 'bot-'), 'black', { signal: 'GND', dir: -1 });
}

const hl = (on) => (on ? 'HIGH' : 'LOW');

export const foundationsExtra = [
  // ------------------------------------------------------------------ traffic lights
  {
    id: 'traffic-lights', title: 'Traffic lights', icon: 'traffic',
    thumb: () => {
      const g = new THREE.Group();
      [['red', -0.75], ['yellow', 0], ['green', 0.75]].forEach(([c, x]) => {
        const l = makeLED(c, v(x + 0.13, 0, 0), v(x - 0.13, 0, 0));
        l.set(c === 'green' ? 1 : 0.15);
        g.add(l.group);
      });
      return g;
    },
    view: { center: [5.4, 0.6, -0.3], size: 15 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const red = railLed(ctx, bb, { pin: 'D12', col: 9, color: 'red', wireColor: 'red' });
      const amber = railLed(ctx, bb, { pin: 'D11', col: 13, color: 'yellow', wireColor: 'yellow' });
      const green = railLed(ctx, bb, { pin: 'D10', col: 17, color: 'green', wireColor: 'green' });
      const gw = groundRail(ctx, bb, 3);
      ctx.anchor('red', red.led.anchor);
      ctx.anchor('amber', amber.led.anchor);
      ctx.anchor('green', green.led.anchor);
      ctx.anchor('res', amber.res.anchor);
      ctx.anchor('rail', bb.hole(22, 'bot-'));
      ctx.anchor('gndw', gw.mid);
      return { red, amber, green };
    },
    hw: (b) => {
      const lamps = { 12: b.red, 11: b.amber, 10: b.green };
      return { digitalWrite: (pin, v) => lamps[pin]?.on(v ? 1 : 0) };
    },
    callouts: [
      { anchor: 'red', x: 0.04, y: 0.17, icon: 'led', title: 'Red · pin 12', text: 'Stop. Stays on longest in the sequence.' },
      { anchor: 'amber', x: 0.36, y: 0.12, icon: 'led', title: 'Amber · pin 11', text: 'Warns that the lights are about to change.' },
      { anchor: 'green', x: 0.7, y: 0.17, icon: 'led', title: 'Green · pin 10', text: 'Go. Each LED has its own pin and resistor.' },
      { anchor: 'gndw', x: 0.04, y: 0.68, icon: 'gnd', title: 'One ground wire', text: 'The blue “–” rail runs the whole length — every LED shares it.' },
      { anchor: 'res', x: 0.7, y: 0.68, icon: 'resistor', title: '220 Ω resistors', text: 'Bridge the centre gap, one per LED.' },
    ],
    overview: {
      heading: 'Traffic lights',
      text: 'Three LEDs, three pins and a fixed sequence: red, red + amber, green, amber, back to red. A small helper function sets all three lights at once, so <code>loop()</code> reads like the timetable of a real junction.',
      features: [['traffic', 'A real four-step light sequence'], ['code', 'A helper function with three parameters'], ['timer', 'Edit the timings in the code']],
    },
    pinout: [
      ['D12', '220 Ω → red LED (+)', ''],
      ['D11', '220 Ω → amber LED (+)', 'Yellow LED'],
      ['D10', '220 Ω → green LED (+)', ''],
      ['GND', 'Front “–” rail', 'All three LED cathodes plug into it'],
    ],
    example: {
      text: 'Real traffic controllers are microcontrollers too, just with sensors in the road, pedestrian buttons and fail-safe checks. Level crossings, car-park barriers and factory andon lights all run sequences like this.',
      points: ['Make green last twice as long as red', 'Skip the red + amber step for a US-style sequence'],
    },
    specs: [['LEDs', 'Red, amber (yellow), green 5 mm'], ['Resistors', '3 × 220 Ω'], ['Current per LED', '≈ 13 mA'], ['Pins used', 'D10, D11, D12 + GND'], ['One cycle', 'RED + 2 × AMBER + GREEN ms']],
    quiz: [
      { q: 'In this sketch, which lights are on during the “get ready” step?', options: ['Green only', 'Red and amber', 'Amber only', 'All three'], answer: 1, explain: 'lights(HIGH, HIGH, LOW) turns on red and amber — the UK-style “get ready” signal.' },
      { q: 'Why does each LED need its own resistor?', options: ['They don’t — one is enough', 'Each LED needs its own current limit, or they share current unevenly', 'To make them different colours', 'To slow the sequence down'], answer: 1, explain: 'Different colours have different forward voltages; with one shared resistor the brightest one hogs the current.' },
      { q: 'What does the helper lights(LOW, LOW, HIGH) do?', options: ['Turns on red only', 'Turns on green only', 'Turns everything off', 'Blinks amber'], answer: 1, explain: 'The three arguments go to RED, AMBER and GREEN in that order.' },
      { q: 'How long is one full cycle with RED_MS = 3000, AMBER_MS = 1000 and GREEN_MS = 3000?', options: ['7 s', '8 s', '4 s', '10 s'], answer: 1, explain: 'Red 3 s + red/amber 1 s + green 3 s + amber 1 s = 8 s.' },
    ],
    challenges: [
      'Make the amber light flash three times before it turns red.',
      'Add a pedestrian button (lesson 3) that shortens the green phase when pressed.',
      'Build a second set of lights for the crossing road, always showing the opposite colour.',
    ],
    code: `const int RED = 12;
const int AMBER = 11;
const int GREEN = 10;

const int RED_MS = {{red}};
const int AMBER_MS = {{amber}};
const int GREEN_MS = {{green}};

void setup() {
  pinMode(RED, OUTPUT);
  pinMode(AMBER, OUTPUT);
  pinMode(GREEN, OUTPUT);
  Serial.begin(9600);
}

void lights(int r, int a, int g) {
  digitalWrite(RED, r);
  digitalWrite(AMBER, a);
  digitalWrite(GREEN, g);
}

void loop() {
  lights(HIGH, LOW, LOW);      // stop
  Serial.println("RED: stop");
  delay(RED_MS);

  lights(HIGH, HIGH, LOW);     // get ready (UK style)
  Serial.println("RED + AMBER: get ready");
  delay(AMBER_MS);

  lights(LOW, LOW, HIGH);      // go
  Serial.println("GREEN: go");
  delay(GREEN_MS);

  lights(LOW, HIGH, LOW);      // stop if it is safe to
  Serial.println("AMBER: stop if safe");
  delay(AMBER_MS);
}`,
    params: { red: { value: 3000, min: 200, max: 10000 }, amber: { value: 1000, min: 100, max: 5000 }, green: { value: 3000, min: 200, max: 10000 } },
    async setup(io) { io.line('pinMode(RED'); await io.delay(100); io.line('Serial.begin'); await io.delay(100); },
    async loop(io, b, p) {
      const set = (r, a, g) => {
        b.red.led.set(r ? b.red.state.gain : 0);
        b.amber.led.set(a ? b.amber.state.gain : 0);
        b.green.led.set(g ? b.green.state.gain : 0);
        io.pin('D12', hl(r), r); io.pin('D11', hl(a), a); io.pin('D10', hl(g), g);
      };
      const steps = [
        ['lights(HIGH, LOW, LOW)', [1, 0, 0], 'RED: stop', 'delay(RED_MS)', p.red],
        ['lights(HIGH, HIGH, LOW)', [1, 1, 0], 'RED + AMBER: get ready', ['delay(AMBER_MS)', 1], p.amber],
        ['lights(LOW, LOW, HIGH)', [0, 0, 1], 'GREEN: go', 'delay(GREEN_MS)', p.green],
        ['lights(LOW, HIGH, LOW)', [0, 1, 0], 'AMBER: stop if safe', ['delay(AMBER_MS)', 2], p.amber],
      ];
      for (const [call, lv, msg, dl, ms] of steps) {
        io.line(call); set(...lv);
        io.line(`"${msg}"`); io.print(msg);
        if (Array.isArray(dl)) io.line(...dl); else io.line(dl);
        await io.delay(ms);
      }
    },
    reset(b) { [b.red, b.amber, b.green].forEach((l) => l.led.set(0)); },
  },

  // ------------------------------------------------------------------ fade
  {
    id: 'fade', title: 'Fade an LED', icon: 'pwm',
    thumb: () => { const l = makeLED('blue', v(0.13, 0, 0), v(-0.13, 0, 0)); l.set(0.5); return l.group; },
    view: { center: [5.0, 0.6, -0.8], size: 14.5 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D9', col: 10, color: 'blue' });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'brightness', color: '#3b78e7', min: 0, max: 255 }] });
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('res', c.res.anchor);
      ctx.anchor('sig', c.sig.mid);
      return { ...c, plot };
    },
    hw: (b) => ({
      analogWrite: (pin, v) => { if (pin === 9) b.on(v / 255); },
      digitalWrite: (pin, v) => { if (pin === 9) b.on(v ? 1 : 0); },
      serialWrite: serialPlotter((v) => b.plot.push(v)),
    }),
    callouts: [
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pwm', title: 'Pin ~9 · PWM', text: 'Switches on and off ≈ 490 times a second.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'Breathing LED', text: 'The longer it’s on in each pulse, the brighter it looks.' },
      { anchor: 'res', x: 0.04, y: 0.68, icon: 'resistor', title: '220 Ω resistor', text: 'Still needed — PWM pulses are full 5 V.' },
    ],
    overview: {
      heading: 'Fade an LED',
      text: 'A digital pin can only be fully on or off — but switch it fast enough and your eye averages the pulses. <code>analogWrite()</code> sets the share of time the pin is on (the <em>duty cycle</em>), and two <code>for</code> loops sweep it up and down so the LED breathes.',
      features: [['pwm', '<code>analogWrite()</code> 0–255 on a ~ pin'], ['code', 'Counting up and down with <code>for</code> loops'], ['wave', 'Watch the brightness on the serial plotter']],
    },
    pinout: [['D9 ~', '220 Ω → LED (+)', 'Must be a PWM pin: 3, 5, 6, 9, 10, 11'], ['GND', 'LED (–)', 'Short leg']],
    example: {
      text: 'The “sleep” light on a laptop, a phone’s notification LED and dimmable LED bulbs all use PWM. So do motor speed controllers and the backlight of most screens.',
      points: ['Make <code>STEP</code> bigger for a faster, choppier fade', 'Open the serial plotter to see the triangle wave'],
    },
    specs: [['PWM pins (Uno)', '3, 5, 6, 9, 10, 11'], ['PWM frequency on D9', '≈ 490 Hz'], ['Resolution', '8-bit, 0–255'], ['Duty cycle', 'value ÷ 255 × 100 %'], ['Average voltage', '≈ 5 V × duty cycle']],
    quiz: [
      { q: 'What does analogWrite(9, 64) do?', options: ['Outputs exactly 1.25 V', 'Turns pin 9 on about 25 % of the time', 'Reads pin 9', 'Waits 64 ms'], answer: 1, explain: '64 ÷ 255 ≈ 25 % duty cycle: the pin is HIGH a quarter of each cycle, so the LED looks dim.' },
      { q: 'Why does the LED look steady instead of flickering?', options: ['The resistor smooths it', 'The pulses are too fast for your eye to follow', 'analogWrite outputs real analog voltage', 'The LED stores charge'], answer: 1, explain: 'At ≈ 490 Hz your eye averages the on and off periods into a brightness.' },
      { q: 'Which of these pins can fade an LED with analogWrite() on an Uno?', options: ['2', '7', '9', '13'], answer: 2, explain: 'Only the pins marked ~ (3, 5, 6, 9, 10, 11) have PWM hardware.' },
      { q: 'With STEP = 5 and a 15 ms delay, roughly how long does one fade-in take?', options: ['0.08 s', '0.8 s', '8 s', '15 s'], answer: 1, explain: '52 steps (0, 5 … 255) × 15 ms ≈ 0.78 s.' },
    ],
    challenges: [
      'Hold the LED fully on for half a second at the top of each breath.',
      'Your eye isn’t linear: use <code>b * b / 255</code> as the PWM value and compare how smooth it looks.',
      'Fade two LEDs in opposite directions on pins 9 and 10.',
    ],
    code: `const int LED_PIN = 9;     // a PWM pin (~)
const int STEP = {{step}};

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  for (int b = 0; b <= 255; b += STEP) {     // fade in
    analogWrite(LED_PIN, b);
    Serial.println(b);
    delay({{wait}});
  }
  for (int b = 255; b >= 0; b -= STEP) {     // fade out
    analogWrite(LED_PIN, b);
    Serial.println(b);
    delay({{wait}});
  }
}`,
    params: { step: { value: 5, min: 1, max: 51 }, wait: { value: 15, min: 2, max: 200 } },
    async setup(io, b) { b.plot.reset(); io.line('pinMode'); await io.delay(100); io.line('Serial.begin'); await io.delay(100); },
    async loop(io, b, p) {
      const step = Math.max(1, p.step);
      const out = async (val, n) => {
        io.line('analogWrite', n); b.on(val / 255); io.pin('D9', `PWM ${val}`, val > 0);
        io.line('Serial.println(b)', n); io.print(String(val)); b.plot.push(val);
        io.line('delay(', n); await io.delay(p.wait);
      };
      for (let val = 0; val <= 255; val += step) await out(val, 1);
      for (let val = 255; val >= 0; val -= step) await out(val, 2);
    },
    reset(b) { b.led.set(0); },
  },

  // ------------------------------------------------------------------ chaser
  {
    id: 'chaser', title: 'LED chaser', icon: 'led',
    thumb: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const x = (i - 2.5) * 0.75;
        const l = makeLED('red', v(x + 0.13, 0, 0), v(x - 0.13, 0, 0));
        l.set(i === 3 ? 1 : i === 2 || i === 4 ? 0.12 : 0);
        g.add(l.group);
      }
      return g;
    },
    view: { center: [5.6, 0.6, -0.2], size: 15 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const pins = [7, 6, 5, 4, 3, 2];
      const leds = pins.map((pin, i) => railLed(ctx, bb, { pin: `D${pin}`, col: 5 + i * 3, color: 'red', wireColor: ['orange', 'yellow', 'green', 'blue', 'purple', 'white'][i] }));
      const gw = groundRail(ctx, bb, 2);
      ctx.anchor('first', leds[0].led.anchor);
      ctx.anchor('last', leds[5].led.anchor);
      ctx.anchor('wires', leds[2].sig.mid);
      ctx.anchor('res', leds[3].res.anchor);
      ctx.anchor('gndw', gw.mid);
      return { leds, pins };
    },
    hw: (b) => ({
      digitalWrite: (pin, v) => { const i = b.pins.indexOf(pin); if (i >= 0) b.leds[i].on(v ? 1 : 0); },
    }),
    callouts: [
      { anchor: 'wires', x: 0.36, y: 0.12, icon: 'pins', title: 'Pins 7 → 2', text: 'Listed left to right in the LEDS[] array.' },
      { anchor: 'first', x: 0.04, y: 0.17, icon: 'led', title: 'LEDS[0]', text: 'Arrays count from 0, so the first LED is index 0.' },
      { anchor: 'last', x: 0.7, y: 0.17, icon: 'led', title: 'LEDS[5]', text: 'The sixth and last LED — index COUNT − 1.' },
      { anchor: 'gndw', x: 0.04, y: 0.68, icon: 'gnd', title: 'Shared ground rail', text: 'Six cathodes, one black wire.' },
      { anchor: 'res', x: 0.7, y: 0.68, icon: 'resistor', title: 'Six resistors', text: 'One 220 Ω per LED, bridging the gap.' },
    ],
    overview: {
      heading: 'LED chaser',
      text: 'Six LEDs light one after another and bounce back, like the scanner on a sci-fi car. Instead of six copies of the same code, the pin numbers live in an <em>array</em> and a <code>for</code> loop walks through it.',
      features: [['code', 'Arrays: <code>LEDS[i]</code> picks one pin'], ['led', 'Six LEDs share one ground rail'], ['timer', 'Change <code>SPEED</code> to race or crawl']],
    },
    pinout: [
      ['D7 … D2', '220 Ω → LED (+), left to right', 'LEDS[0] … LEDS[5]'],
      ['GND', 'Front “–” rail', 'All six cathodes'],
      ['D0 / D1', 'Not used', 'Reserved for USB serial'],
    ],
    example: {
      text: 'Chasers are everywhere once you look: progress bars on chargers, “walking” arrows on shop signs, the turn signals on some cars and the volume meters on a mixing desk.',
      points: ['Reorder the numbers in <code>LEDS[]</code> to change the pattern without touching the loop', 'Light two LEDs at once for a wider “eye”'],
    },
    specs: [['LEDs', '6 × red 5 mm'], ['Resistors', '6 × 220 Ω'], ['Total current', '≈ 13 mA (one LED on at a time)'], ['One sweep', '10 steps × SPEED ms'], ['Pins used', 'D2–D7']],
    quiz: [
      { q: 'With const int LEDS[] = {7, 6, 5, 4, 3, 2}; what is LEDS[2]?', options: ['2', '5', '6', '3'], answer: 1, explain: 'Arrays start at index 0: LEDS[0] = 7, LEDS[1] = 6, LEDS[2] = 5.' },
      { q: 'Why does the return loop run from COUNT − 2 down to 1?', options: ['To skip the end LEDs so they don’t light twice in a row', 'Because arrays end at 2', 'To go faster', 'It’s a mistake'], answer: 0, explain: 'The forward loop already lit the last LED and the next forward loop lights the first one, so the way back skips both.' },
      { q: 'What happens if you read LEDS[6]?', options: ['You get pin 2', 'It wraps round to LEDS[0]', 'You read memory past the end of the array — a bug', 'The compiler adds an LED'], answer: 2, explain: 'C++ doesn’t check array bounds; index 6 is outside the six-element array.' },
    ],
    challenges: [
      'Make a “fill up” bar: light the LEDs one by one and keep them on, then clear them all.',
      'Read a potentiometer on A0 and use it as the speed.',
      'Light the LEDs from both ends towards the middle and back out again.',
    ],
    code: `const int LEDS[] = {7, 6, 5, 4, 3, 2};   // left to right
const int COUNT = 6;
const int SPEED = {{speed}};                 // ms per step

void setup() {
  for (int i = 0; i < COUNT; i++) {
    pinMode(LEDS[i], OUTPUT);
  }
  Serial.begin(9600);
}

void flash(int i) {
  digitalWrite(LEDS[i], HIGH);
  delay(SPEED);
  digitalWrite(LEDS[i], LOW);
}

void loop() {
  for (int i = 0; i < COUNT; i++) {          // left -> right
    flash(i);
  }
  Serial.println("Bounce!");
  for (int i = COUNT - 2; i > 0; i--) {      // right -> left
    flash(i);
  }
}`,
    params: { speed: { value: 80, min: 10, max: 1000 } },
    async setup(io) { io.line('pinMode(LEDS[i]'); await io.delay(150); io.line('Serial.begin'); await io.delay(80); },
    async loop(io, b, p) {
      const flash = async (i, n) => {
        const pin = `D${b.pins[i]}`, l = b.leds[i];
        io.line('flash(i)', n); io.line('HIGH);'); l.on(); io.pin(pin, 'HIGH', true);
        io.line('delay(SPEED)'); await io.delay(p.speed);
        io.line('LOW);'); l.led.set(0); io.pin(pin, 'LOW', false);
      };
      for (let i = 0; i < 6; i++) await flash(i, 1);
      io.line('"Bounce!"'); io.print('Bounce!');
      for (let i = 4; i > 0; i--) await flash(i, 2);
    },
    reset(b) { b.leds.forEach((l) => l.led.set(0)); },
  },

  // ------------------------------------------------------------------ serial commands
  {
    id: 'serial-commands', title: 'Talk to your board', icon: 'serial',
    thumb: () => { const l = makeLED('green', v(0.13, 0, 0), v(-0.13, 0, 0)); l.set(1); return l.group; },
    view: { center: [5.2, 0.6, -0.8], size: 15 },
    serialInput: { placeholder: 'Try: help · on · off · blink 3' },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D13', col: 10, color: 'green' });
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('sig', c.sig.mid);
      return c;
    },
    hw: (b) => ({ digitalWrite: (pin, v) => { if (pin === 13) b.on(v ? 1 : 0); } }),
    callouts: [
      { anchor: 'usb', x: 0.04, y: 0.17, icon: 'usb', title: 'USB serial', text: 'Your typed text travels down the USB cable at 9600 baud.' },
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pins', title: 'Pin 13', text: 'Driven by whatever command arrives.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'LED', text: 'Type on, off or blink 3 in the serial monitor.' },
      { anchor: 'chip', x: 0.04, y: 0.68, icon: 'code', title: 'Command parser', text: 'Reads a line, tidies it, compares it.' },
    ],
    overview: {
      heading: 'Talk to your board',
      text: 'Serial works both ways. Type a command in the serial monitor and the board reads it as a <code>String</code>, cleans it up with <code>trim()</code> and decides what to do. It’s the simplest user interface there is — and a superb debugging tool.',
      features: [['serial', 'Type commands below the serial monitor'], ['code', '<code>readStringUntil()</code>, <code>trim()</code>, <code>toInt()</code>'], ['led', 'on · off · blink N · help']],
    },
    pinout: [['D13', '220 Ω → LED (+)', 'Also lights the on-board L LED'], ['GND', 'LED (–)', ''], ['USB', 'Serial to your computer', 'D0 (RX) and D1 (TX) are used for this']],
    example: {
      text: '3D printers, CNC machines and many lab instruments are controlled by text commands sent over serial (G-code is exactly this). Engineers add commands like these to test hardware long before the real interface exists.',
      points: ['Set the monitor’s line ending to “Newline” so each command ends with \\n', 'Add a <code>status</code> command that prints whether the LED is on'],
    },
    specs: [['Baud rate', '9600'], ['Line ending', 'Newline (\\n)'], ['readStringUntil timeout', '1000 ms (Serial.setTimeout)'], ['Serial pins', 'D0 RX, D1 TX'], ['Commands', 'on, off, blink N (1–20), help']],
    quiz: [
      { q: 'Why call cmd.trim() after reading the line?', options: ['To make it lower case', 'To remove spaces and stray \\r characters so “on” matches', 'To convert it to a number', 'To clear the serial buffer'], answer: 1, explain: 'Many terminals send “\\r\\n”; trim() strips that and any spaces so the comparison works.' },
      { q: 'What does Serial.available() return?', options: ['true if the USB cable is plugged in', 'The number of bytes waiting to be read', 'The baud rate', 'The last character typed'], answer: 1, explain: 'It counts the received bytes still sitting in the input buffer.' },
      { q: 'For the command "blink 4", what does cmd.substring(5).toInt() give?', options: ['5', '4', '0', '"blink"'], answer: 1, explain: 'substring(5) is " 4" (everything after “blink”); toInt() skips the space and returns 4.' },
      { q: 'What happens if you type "BLINK 2"?', options: ['Unknown command', 'It blinks twice, thanks to toLowerCase()', 'The board resets', 'Nothing at all'], answer: 1, explain: 'toLowerCase() turns it into "blink 2" before any comparison.' },
    ],
    challenges: [
      'Add a <code>status</code> command that replies “LED is on” or “LED is off”.',
      'Add <code>speed N</code> to change the blink delay while the sketch runs.',
      'Drive an RGB LED (lesson 5) with a command like <code>rgb 255 0 120</code>.',
    ],
    code: `const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Ready. Type help");
}

void blink(int times) {
  Serial.print("Blinking ");
  Serial.print(times);
  Serial.println(times == 1 ? " time" : " times");
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay({{blink}});
    digitalWrite(LED_PIN, LOW);
    delay({{blink}});
  }
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();                    // drop spaces and '\\r'
    cmd.toLowerCase();
    if (cmd == "on") {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("LED on");
    } else if (cmd == "off") {
      digitalWrite(LED_PIN, LOW);
      Serial.println("LED off");
    } else if (cmd.startsWith("blink")) {
      int n = cmd.substring(5).toInt();   // "blink 3" -> 3
      blink(constrain(n, 1, 20));
    } else if (cmd == "help") {
      Serial.println("Commands: on, off, blink N, help");
    } else {
      Serial.print("Unknown command: ");
      Serial.println(cmd);
    }
  }
}`,
    params: { blink: { value: 250, min: 30, max: 2000 } },
    async setup(io) {
      io.line('pinMode'); await io.delay(100);
      io.line('Serial.begin'); await io.delay(100);
      io.line('"Ready. Type help"'); io.print('Ready. Type help');
    },
    async loop(io, b, p) {
      const led = (on) => { if (on) b.on(); else b.led.set(0); io.board.setBuiltinLed(on ? 1 : 0); io.pin('D13', hl(on), on); };
      io.line('Serial.available');
      const raw = io.readLine();
      if (raw == null) { await io.delay(60); return; }
      io.line('readStringUntil'); await io.delay(30);
      io.line('cmd.trim'); let cmd = raw.trim();
      io.line('toLowerCase'); cmd = cmd.toLowerCase();
      await io.delay(30);
      if (cmd === 'on') {
        io.line('digitalWrite(LED_PIN, HIGH);', 2); led(true);
        io.line('"LED on"'); io.print('LED on');
      } else if (cmd === 'off') {
        io.line('digitalWrite(LED_PIN, LOW);', 2); led(false);
        io.line('"LED off"'); io.print('LED off');
      } else if (cmd.startsWith('blink')) {
        io.line('toInt');
        const n = Math.max(1, Math.min(20, parseInt(cmd.substring(5), 10) || 0));
        io.line('blink(constrain');
        io.line('"Blinking "'); io.print(`Blinking ${n} ${n === 1 ? 'time' : 'times'}`);
        for (let i = 0; i < n; i++) {
          io.line('digitalWrite(LED_PIN, HIGH);', 1); led(true);
          io.line('delay(', 1); await io.delay(p.blink);
          io.line('digitalWrite(LED_PIN, LOW);', 1); led(false);
          io.line('delay(', 2); await io.delay(p.blink);
        }
      } else if (cmd === 'help') {
        io.line('"Commands:'); io.print('Commands: on, off, blink N, help');
      } else {
        io.line('Serial.println(cmd)'); io.print(`Unknown command: ${cmd}`);
      }
      await io.delay(30);
    },
    reset(b, io) { b.led.set(0); io.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ toggle
  {
    id: 'toggle', title: 'Toggle with a button', icon: 'button',
    thumb: () => makeButton([v(-0.25, 0, -0.38), v(0.25, 0, -0.38), v(-0.25, 0, 0.38), v(0.25, 0, 0.38)], 0x3b78e7).group,
    view: { center: [5.4, 0.6, -0.6], size: 15 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D13', col: 4, color: 'yellow' });
      const btn = ctx.add(makeButton([bb.hole(18, 'e'), bb.hole(20, 'e'), bb.hole(18, 'f'), bb.hole(20, 'f')], 0x3b78e7));
      const w2 = ctx.wire(ctx.board.pin('D2'), bb.hole(18, 'a'), 'yellow', { signal: 'D2' });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(20, 'j'), 'black', { signal: 'GND', dir: -1 });
      const state = { down: false, edgeAt: -1e9, bounceMs: 30 };
      const press = (d) => { if (d === state.down) return; state.down = d; state.edgeAt = performance.now(); btn.press(d); };
      ctx.interact(btn, { name: 'Push button', hint: 'Press and hold, then let go — each press toggles the LED', hold: { down: () => press(true), up: () => press(false) } });
      ctx.anchor('btn', btn.anchor);
      ctx.anchor('d2', w2.mid);
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('chip', ctx.board.anchors.chip);
      return { ...c, btn, state };
    },
    hw: (b) => ({
      digitalWrite: (pin, v) => { if (pin === 13) b.on(v ? 1 : 0); },
      // real contacts chatter for a few ms after each press or release
      digitalRead: (pin) => {
        if (pin !== 2) return null;
        if (performance.now() - b.state.edgeAt < b.state.bounceMs) return Math.random() < 0.5 ? 0 : null;
        return b.state.down ? 0 : null;
      },
    }),
    callouts: [
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'LED remembers', text: 'Stays on after you let go — the state lives in a variable.' },
      { anchor: 'd2', x: 0.36, y: 0.12, icon: 'pins', title: 'Pin 2 · input', text: 'INPUT_PULLUP: HIGH when released, LOW while pressed.' },
      { anchor: 'chip', x: 0.04, y: 0.68, icon: 'timer', title: 'Debounce timer', text: 'millis() waits for the contacts to settle.' },
      { anchor: 'btn', x: 0.7, y: 0.66, icon: 'hand', title: 'Push button', text: 'Click and hold. Each new press flips the LED.' },
    ],
    overview: {
      heading: 'Toggle with a button',
      text: 'A light switch, not a doorbell: press once for on, again for off. The trick is to react to the <em>moment</em> the button goes down (an edge), remember the LED’s state in a variable, and ignore the few milliseconds of contact bounce with <code>millis()</code>.',
      features: [['hand', 'Press and hold the 3D button'], ['code', 'A <code>bool</code> remembers on/off'], ['timer', 'Non-blocking debounce with <code>millis()</code>']],
    },
    pinout: [['D2', 'Button leg', 'INPUT_PULLUP — no resistor needed'], ['GND', 'Opposite button leg', 'Pressed = LOW'], ['D13', '220 Ω → LED (+)', 'Toggled output']],
    example: {
      text: 'Power buttons on TVs, the mode button on a torch and the “caps lock” key all toggle. Every one of them has to debounce, or a single press could switch on and straight off again.',
      points: ['Set <code>DEBOUNCE_MS</code> to 0 and press a few times — you may see double toggles', 'Count presses and print the total'],
    },
    specs: [['Switch', '6 mm tactile, momentary'], ['Contact bounce', 'Typically 1–10 ms; this worn one up to 30 ms'], ['Debounce window', 'DEBOUNCE_MS (50 ms default)'], ['millis()', 'ms since power-up, rolls over after ≈ 49.7 days'], ['Edge detected', 'HIGH → LOW (press)']],
    quiz: [
      { q: 'Why does the LED stay on after you let go of the button?', options: ['The button is latching', 'The ledOn variable remembers the state and only flips on a new press', 'The resistor holds it on', 'digitalWrite stays HIGH for ever'], answer: 1, explain: 'The sketch only changes ledOn on a falling edge, so releasing the button changes nothing.' },
      { q: 'What is a falling edge on this circuit?', options: ['The pin going from LOW to HIGH', 'The pin going from HIGH to LOW — the moment of the press', 'The pin staying LOW', 'The LED switching off'], answer: 1, explain: 'With INPUT_PULLUP the pin falls from HIGH to LOW as the button is pressed.' },
      { q: 'Why use millis() for debouncing instead of delay(50)?', options: ['It is more accurate', 'The sketch keeps running and can do other jobs while it waits', 'delay() doesn’t work with buttons', 'millis() uses less power'], answer: 1, explain: 'delay() freezes everything; comparing millis() timestamps lets loop() keep spinning.' },
      { q: 'What can happen with DEBOUNCE_MS = 0?', options: ['Nothing changes', 'One press can toggle the LED two or more times', 'The button stops working', 'The LED gets brighter'], answer: 1, explain: 'Each bounce of the contacts looks like a new press, so the LED may flip several times.' },
    ],
    challenges: [
      'Print how many times the button has been pressed.',
      'Use a long press (over 1 s) to switch the LED off, and short presses to toggle.',
      'Cycle through three modes: off → on → blinking → off.',
    ],
    code: `const int BUTTON_PIN = 2;
const int LED_PIN = 13;
const unsigned long DEBOUNCE_MS = {{debounce}};

bool ledOn = false;
int lastReading = HIGH;           // raw reading last time
int stableState = HIGH;           // debounced button state
unsigned long lastChange = 0;     // when the raw reading last changed

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int reading = digitalRead(BUTTON_PIN);
  if (reading != lastReading) {          // contacts moved (or bounced)
    lastChange = millis();
    lastReading = reading;
  }
  if (millis() - lastChange >= DEBOUNCE_MS && reading != stableState) {
    stableState = reading;               // settled on a new state
    if (stableState == LOW) {            // falling edge = a new press
      ledOn = !ledOn;
      digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
      Serial.println(ledOn ? "Toggled ON" : "Toggled OFF");
    }
  }
}`,
    params: { debounce: { value: 50, min: 0, max: 500 } },
    async setup(io, b) {
      Object.assign(b.state, { t0: performance.now(), ledOn: false, lastReading: 1, stable: 1, lastChange: 0 });
      io.line('INPUT_PULLUP'); await io.delay(100);
      io.line('pinMode(LED_PIN'); await io.delay(60);
    },
    async loop(io, b, p) {
      const s = b.state;
      const now = performance.now();
      const millis = Math.floor(now - s.t0);
      // physical button: the contacts chatter for a while after each edge
      const bouncing = now - s.edgeAt < s.bounceMs;
      const reading = bouncing ? (Math.random() < 0.5 ? 1 : 0) : s.down ? 0 : 1;
      io.line('digitalRead');
      io.pin('D2', hl(reading), !reading);
      if (reading !== s.lastReading) {
        io.line('lastChange = millis()');
        s.lastChange = millis;
        s.lastReading = reading;
      }
      if (millis - s.lastChange >= p.debounce && reading !== s.stable) {
        io.line('stableState = reading');
        s.stable = reading;
        if (s.stable === 0) {
          io.line('ledOn = !ledOn');
          s.ledOn = !s.ledOn;
          io.line('ledOn ? HIGH : LOW');
          if (s.ledOn) b.on(); else b.led.set(0);
          io.board.setBuiltinLed(s.ledOn ? 1 : 0);
          io.pin('D13', hl(s.ledOn), s.ledOn);
          io.line('Serial.println'); io.print(s.ledOn ? 'Toggled ON' : 'Toggled OFF');
        }
      }
      await io.delay(4);
    },
    reset(b, io) { b.led.set(0); io.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ millis multitasking
  {
    id: 'millis', title: 'Multitask with millis()', icon: 'timer',
    thumb: () => {
      const g = new THREE.Group();
      const a = makeLED('green', v(-0.37, 0, 0), v(-0.63, 0, 0)); a.set(1); g.add(a.group);
      const b = makeLED('blue', v(0.63, 0, 0), v(0.37, 0, 0)); b.set(0.2); g.add(b.group);
      return g;
    },
    view: { center: [5.4, 0.6, -0.4], size: 15 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const a = railLed(ctx, bb, { pin: 'D12', col: 5, color: 'green', wireColor: 'green' });
      const bl = railLed(ctx, bb, { pin: 'D11', col: 10, color: 'blue', wireColor: 'blue' });
      const gw = groundRail(ctx, bb, 2);
      const btn = ctx.add(makeButton([bb.hole(19, 'e'), bb.hole(21, 'e'), bb.hole(19, 'f'), bb.hole(21, 'f')]));
      const w2 = ctx.wire(ctx.board.pin('D2'), bb.hole(19, 'a'), 'yellow', { signal: 'D2' });
      ctx.wire(bb.hole(21, 'j'), bb.hole(23, 'bot-'), 'black', { signal: 'GND', lift: 0.5 });
      const state = { down: false };
      ctx.interact(btn, { name: 'Push button', hint: 'Press and hold — it answers instantly, even mid-blink', hold: { down: () => { state.down = true; btn.press(true); }, up: () => { state.down = false; btn.press(false); } } });
      ctx.anchor('a', a.led.anchor);
      ctx.anchor('b', bl.led.anchor);
      ctx.anchor('btn', btn.anchor);
      ctx.anchor('d2', w2.mid);
      ctx.anchor('gndw', gw.mid);
      return { a, bl, btn, state };
    },
    hw: (b) => ({
      digitalWrite: (pin, v) => { if (pin === 12) b.a.on(v ? 1 : 0); if (pin === 11) b.bl.on(v ? 1 : 0); },
      digitalRead: (pin) => (pin === 2 && b.state.down ? 0 : null),
    }),
    callouts: [
      { anchor: 'a', x: 0.04, y: 0.17, icon: 'led', title: 'Task 1 · pin 12', text: 'Toggles every RATE_A ms.' },
      { anchor: 'b', x: 0.36, y: 0.12, icon: 'led', title: 'Task 2 · pin 11', text: 'Toggles every RATE_B ms, on its own clock.' },
      { anchor: 'btn', x: 0.7, y: 0.17, icon: 'hand', title: 'Task 3 · button', text: 'Hold it: the L LED reacts instantly.' },
      { anchor: 'lLed', x: 0.04, y: 0.68, icon: 'info', title: 'L LED', text: 'Mirrors the button with no lag at all.' },
      { anchor: 'gndw', x: 0.7, y: 0.68, icon: 'gnd', title: 'Ground rail', text: 'Both LEDs and the button share it.' },
    ],
    overview: {
      heading: 'Multitask with millis()',
      text: '<code>delay()</code> stops everything. Instead, check the clock: <code>millis()</code> counts milliseconds since power-up, and each task asks “has enough time passed since I last ran?”. Loop spins thousands of times a second, so two blinkers and a button all run at once.',
      features: [['timer', 'Two independent timers, no <code>delay()</code>'], ['hand', 'A button that never waits'], ['code', '<code>unsigned long</code> timestamps']],
    },
    pinout: [
      ['D12', '220 Ω → green LED', 'Task 1'],
      ['D11', '220 Ω → blue LED', 'Task 2'],
      ['D2', 'Button leg', 'INPUT_PULLUP'],
      ['GND', 'Front “–” rail', 'LEDs and button'],
      ['D13', 'On-board L LED', 'Shows the button state'],
    ],
    example: {
      text: 'Almost all real firmware works like this: a washing machine watches the door, the water level, the motor and the display at once, and none of them is allowed to block the others.',
      points: ['Change <code>RATE_A</code> and <code>RATE_B</code> — they never disturb each other', 'Add a third LED with its own timer'],
    },
    specs: [['millis() resolution', '≈ 1 ms'], ['Rolls over', 'After ≈ 49.7 days (safe with subtraction)'], ['Timestamp type', 'unsigned long, 32-bit'], ['loop() speed', 'Many thousands of passes per second'], ['Pins used', 'D2, D11, D12, D13 (L)']],
    quiz: [
      { q: 'Why is now - lastA >= RATE_A better than a delay()?', options: ['It’s shorter to type', 'loop() keeps running, so other tasks get their turn', 'It makes the LED brighter', 'delay() is not allowed with LEDs'], answer: 1, explain: 'Nothing waits: each task just checks the clock and returns straight away.' },
      { q: 'Which type should hold a millis() timestamp?', options: ['int', 'byte', 'unsigned long', 'float'], answer: 2, explain: 'millis() returns an unsigned long; an int would overflow after about 32 seconds.' },
      { q: 'With RATE_A = 250, how often does the green LED blink fully (on and off)?', options: ['Every 250 ms', 'Every 500 ms', 'Every 125 ms', 'Every second'], answer: 1, explain: 'Each 250 ms toggle is half a blink, so a full on-off cycle takes 500 ms (2 Hz).' },
    ],
    challenges: [
      'Make the button pause and resume the blue LED.',
      'Debounce the button with the millis() technique from the toggle lesson.',
      'Fade a third LED on a PWM pin, one step every 10 ms, without delay().',
    ],
    code: `const int LED_A = 12, LED_B = 11, BUTTON_PIN = 2;
const unsigned long RATE_A = {{rateA}};   // ms between toggles
const unsigned long RATE_B = {{rateB}};

unsigned long lastA = 0, lastB = 0;
bool stateA = false, stateB = false;
int lastButton = HIGH;

void setup() {
  pinMode(LED_A, OUTPUT);
  pinMode(LED_B, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  unsigned long now = millis();

  if (now - lastA >= RATE_A) {          // task 1: green LED
    lastA = now;
    stateA = !stateA;
    digitalWrite(LED_A, stateA);
  }

  if (now - lastB >= RATE_B) {          // task 2: blue LED
    lastB = now;
    stateB = !stateB;
    digitalWrite(LED_B, stateB);
  }

  int button = digitalRead(BUTTON_PIN); // task 3: the button
  digitalWrite(LED_BUILTIN, button == LOW);
  if (button != lastButton) {
    if (button == LOW) {
      Serial.print("Pressed at ");
      Serial.print(now);
      Serial.println(" ms");
    }
    lastButton = button;
  }
}`,
    params: { rateA: { value: 250, min: 20, max: 5000 }, rateB: { value: 900, min: 20, max: 5000 } },
    async setup(io, b) {
      Object.assign(b.state, { t0: performance.now(), lastA: 0, lastB: 0, a: false, b: false, lastButton: 1 });
      io.line('pinMode(LED_A'); await io.delay(80);
      io.line('INPUT_PULLUP'); await io.delay(80);
      io.line('Serial.begin'); await io.delay(60);
    },
    async loop(io, b, p) {
      const s = b.state;
      const now = Math.floor(performance.now() - s.t0);
      let busy = false;
      if (now - s.lastA >= p.rateA) {
        io.line('digitalWrite(LED_A'); busy = true;
        s.lastA = now; s.a = !s.a;
        if (s.a) b.a.on(); else b.a.led.set(0);
        io.pin('D12', hl(s.a), s.a);
      }
      if (now - s.lastB >= p.rateB) {
        io.line('digitalWrite(LED_B'); busy = true;
        s.lastB = now; s.b = !s.b;
        if (s.b) b.bl.on(); else b.bl.led.set(0);
        io.pin('D11', hl(s.b), s.b);
      }
      const button = s.down ? 0 : 1;
      if (!busy) io.line('digitalRead(BUTTON_PIN)');
      io.board.setBuiltinLed(button ? 0 : 1);
      io.pin('D2', hl(button), !button);
      if (button !== s.lastButton) {
        if (button === 0) { io.line('"Pressed at "'); io.print(`Pressed at ${now} ms`); }
        s.lastButton = button;
      }
      await io.delay(4);
    },
    reset(b, io) { b.a.led.set(0); b.bl.led.set(0); io.board.setBuiltinLed(0); },
  },
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['gnd', 'Power rails', 'The long + and – strips along a breadboard’s edges, shared by every column.', 'traffic-lights'],
  ['pwm', 'PWM', 'Fast on/off pulses that dim LEDs and slow motors; analogWrite() 0–255.', 'fade'],
  ['serial', 'Serial monitor', 'Text to and from the board over USB — for debugging and commands.', 'serial-commands'],
];
