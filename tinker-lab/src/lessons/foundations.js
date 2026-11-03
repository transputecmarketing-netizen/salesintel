// Track 1 — Foundations: the first steps on an Uno-style board.
import * as THREE from 'three';
import { makeBoard } from '../scene/board.js';
import {
  makeLED, makeRGBLED, makeResistor, makeButton, makePot, makeLDR, makeBuzzer, makeTO92, makeDiode,
  makeMotor, makeServo, makeUltrasonic, makeTrafficLight, makeCar, makeBlock, makePing,
} from '../scene/components.js';
import { v, BB, ledOnPin } from './helpers.js';

export const foundations = [
  // ------------------------------------------------------------------ 1
  {
    id: 'board', title: 'Meet the board', icon: 'chip',
    thumb: () => makeBoard().group,
    view: { center: [0, 0.6, 0.2], size: 8.4 },
    build(ctx) {
      return {};
    },
    callouts: [
      { anchor: 'usb', x: 0.04, y: 0.17, icon: 'usb', title: 'USB port', text: 'Uploads your sketch and powers the board from a computer.' },
      { anchor: 'chip', x: 0.37, y: 0.13, icon: 'chip', title: 'Microcontroller', text: 'The ATmega328P — the tiny computer that runs your code.' },
      { anchor: 'digital', x: 0.7, y: 0.2, icon: 'pins', title: 'Digital pins', text: 'D0–D13 switch on/off. Pins marked ~ can fake analog (PWM).' },
      { anchor: 'jack', x: 0.04, y: 0.66, icon: 'bolt', title: 'Power jack', text: 'Run without a computer from a 7–12 V supply.' },
      { anchor: 'power', x: 0.33, y: 0.74, icon: 'plug', title: 'Power pins', text: '5V, 3.3V and GND to power your circuits.' },
      { anchor: 'analog', x: 0.68, y: 0.68, icon: 'wave', title: 'Analog pins', text: 'A0–A5 measure voltages from 0 to 5 V.' },
    ],
    overview: {
      heading: 'An Uno-style board',
      text: 'This is the most popular board for learning electronics. A small microcontroller reads inputs (buttons, sensors) and controls outputs (lights, motors, sound) by running a program called a <em>sketch</em>.',
      features: [['chip', '8-bit ATmega328P at 16 MHz'], ['pins', '14 digital and 6 analog pins'], ['heart', 'Open-source and supported by a huge community']],
    },
    pinout: [
      ['D0–D13', 'Digital in/out', '5 V logic, max 20 mA per pin'],
      ['~3 ~5 ~6 ~9 ~10 ~11', 'PWM output', 'analogWrite() 0–255'],
      ['A0–A5', 'Analog in', '10-bit, 0–1023'],
      ['5V / 3.3V', 'Power out', 'Feed sensors and breadboards'],
      ['GND', 'Ground', 'The 0 V return path'],
      ['VIN', 'Power in', 'Raw input from the jack'],
    ],
    example: {
      text: 'Every board has a small LED marked <b>L</b> connected to pin 13. The sketch on the right blinks it — no wiring needed. It’s the “Hello, world” of electronics.',
      points: ['<code>setup()</code> runs once when the board powers up', '<code>loop()</code> runs again and again, forever', '<code>delay()</code> pauses in milliseconds'],
    },
    specs: [['Microcontroller', 'ATmega328P'], ['Clock speed', '16 MHz'], ['Operating voltage', '5 V'], ['Input voltage', '7–12 V'], ['Flash memory', '32 KB'], ['SRAM', '2 KB'], ['EEPROM', '1 KB'], ['Size', '68.6 × 53.4 mm']],
    quiz: [
      { q: "Which part of the board actually runs your sketch?", options: ["The USB port", "The ATmega328P microcontroller", "The power jack", "The reset button"], answer: 1, explain: "The microcontroller is a tiny computer: it stores your program in flash memory and executes it." },
      { q: "How many times does loop() run?", options: ["Once", "Ten times", "Over and over, forever", "Only when you press reset"], answer: 2, explain: "setup() runs once at power-up; loop() repeats for as long as the board has power." },
      { q: "What does delay(1000) do?", options: ["Waits 1 second", "Waits 1000 seconds", "Blinks 1000 times", "Sets pin 1000 HIGH"], answer: 0, explain: "delay() takes milliseconds — 1000 ms is one second." },
    ],
    challenges: ["Make the L LED blink twice as fast.", "Make a ‘heartbeat’: 100 ms on, 100 ms off, 100 ms on, 700 ms off.", "Blink SOS in Morse code (··· ––– ···)."],
    code: `// The "L" LED on the board is wired to pin 13.
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);  // on
  delay({{on}});
  digitalWrite(LED_BUILTIN, LOW);   // off
  delay({{off}});
}`,
    params: { on: { value: 1000, min: 50, max: 5000 }, off: { value: 1000, min: 50, max: 5000 } },
    async setup(io) { io.line('pinMode'); await io.delay(150); },
    async loop(io, b, p) {
      io.line('HIGH'); io.board.setBuiltinLed(1); io.print('D13 → HIGH');
      io.line('delay', 1); await io.delay(p.on);
      io.line('LOW'); io.board.setBuiltinLed(0); io.print('D13 → LOW');
      io.line('delay', 2); await io.delay(p.off);
    },
    reset(b, io) { io.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'blink', title: 'Blink an LED', icon: 'led',
    thumb: () => makeLED('red', v(0.13, 0, 0), v(-0.13, 0, 0)).group,
    view: { center: [5.2, 0.6, -0.8], size: 15 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D13', col: 10 });
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('res', c.res.anchor);
      ctx.anchor('gndw', c.gw.mid);
      ctx.anchor('sigw', c.sig.mid);
      return c;
    },
    callouts: [
      { anchor: 'gndw', x: 0.04, y: 0.17, icon: 'gnd', title: 'GND', text: 'The short leg (–) returns current to ground.' },
      { anchor: 'sigw', x: 0.36, y: 0.13, icon: 'pins', title: 'Pin 13', text: 'Your sketch switches it HIGH (5 V) and LOW (0 V).' },
      { anchor: 'led', x: 0.7, y: 0.15, icon: 'led', title: 'LED', text: 'Lights up whenever pin 13 is HIGH.' },
      { anchor: 'lLed', x: 0.04, y: 0.68, icon: 'info', title: 'Built-in LED', text: 'The “L” LED mirrors pin 13 on the board.' },
      { anchor: 'res', x: 0.7, y: 0.7, icon: 'resistor', title: 'Resistor', text: 'Stops the LED drawing too much current.' },
    ],
    overview: {
      heading: 'Blink an LED',
      text: 'Your first real circuit: an LED and a resistor on a breadboard, driven by pin 13. Switching the pin on and off with a pause in between makes it blink.',
      features: [['pins', 'Digital output with <code>digitalWrite()</code>'], ['resistor', 'Click the resistor to try other values'], ['led', 'Click the LED to change its colour']],
    },
    pinout: [['D13', 'Resistor → LED (+)', 'Long leg is the anode'], ['GND', 'LED (–)', 'Short leg, flat side of the rim'], ['Resistor', '220 Ω', 'Red · red · brown · gold']],
    example: {
      text: 'Status lights are everywhere: the charging light on your phone, the standby LED on a TV, the blinking light on a smoke alarm. Each one is an LED driven by a pin, just like this.',
      points: ['Change the two <code>delay()</code> numbers to make it blink faster', 'Try 100 ms on and 900 ms off for a “heartbeat”'],
    },
    specs: [['LED forward voltage', '≈ 2.0 V (red)'], ['LED current', '≈ 13 mA with 220 Ω'], ['Pin output', '5 V, max 20 mA'], ['Formula', 'R = (5 V − 2 V) / I']],
    quiz: [
      { q: "Why does the LED need a resistor?", options: ["To make it brighter", "To limit the current so the LED and pin aren’t damaged", "To change its colour", "It doesn’t need one"], answer: 1, explain: "Without a resistor the LED would try to draw far more current than a pin (or the LED) can handle." },
      { q: "Which leg of an LED goes towards ground?", options: ["The long leg (anode)", "The short leg (cathode)", "Either leg", "The middle leg"], answer: 1, explain: "Current flows from the anode (+, long leg) to the cathode (–, short leg)." },
      { q: "What voltage does a pin output when set HIGH on this board?", options: ["0 V", "3.3 V", "5 V", "12 V"], answer: 2, explain: "Uno-style boards use 5 V logic." },
    ],
    challenges: ["Change the resistor to 1 kΩ in the 3D view — what happens to the brightness?", "Wire a second LED on pin 12 and blink them alternately.", "Use a variable for the delay and make every blink a little faster than the last."],
    code: `const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("D13 -> HIGH");
  delay({{on}});
  digitalWrite(LED_PIN, LOW);
  Serial.println("D13 -> LOW");
  delay({{off}});
}`,
    params: { on: { value: 500, min: 20, max: 5000 }, off: { value: 500, min: 20, max: 5000 } },
    async setup(io) { io.line('pinMode'); await io.delay(100); io.line('Serial.begin'); await io.delay(100); },
    async loop(io, b, p) {
      io.line('HIGH);'); b.on(); io.board.setBuiltinLed(1); io.pin('D13', 'HIGH', true); io.print('D13 → HIGH');
      io.line('delay', 1); await io.delay(p.on);
      io.line('LOW);'); b.led.set(0); io.board.setBuiltinLed(0); io.pin('D13', 'LOW', false); io.print('D13 → LOW');
      io.line('delay', 2); await io.delay(p.off);
    },
    reset(b, io) { b.led.set(0); io.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'button', title: 'Push a button', icon: 'button',
    thumb: () => makeButton([v(-0.25, 0, -0.38), v(0.25, 0, -0.38), v(-0.25, 0, 0.38), v(0.25, 0, 0.38)]).group,
    view: { center: [5.4, 0.6, -0.6], size: 15 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D13', col: 4, gnd: 'GND' });
      const btn = ctx.add(makeButton([bb.hole(18, 'e'), bb.hole(20, 'e'), bb.hole(18, 'f'), bb.hole(20, 'f')]));
      const w2 = ctx.wire(ctx.board.pin('D2'), bb.hole(18, 'a'), 'yellow', { signal: 'D2' });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(20, 'j'), 'black', { signal: 'GND', dir: -1 });
      ctx.interact(btn, { name: 'Push button', hint: 'Press and hold to push it', hold: { down: () => btn.press(true), up: () => btn.press(false) } });
      ctx.anchor('btn', btn.anchor);
      ctx.anchor('d2', w2.mid);
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('res', c.res.anchor);
      return { ...c, btn, last: 1 };
    },
    callouts: [
      { anchor: 'd2', x: 0.36, y: 0.13, icon: 'pins', title: 'Pin 2 · input', text: 'Reads HIGH normally and LOW while the button is pressed.' },
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'LED on pin 13', text: 'Turns on while you hold the button.' },
      { anchor: 'btn', x: 0.7, y: 0.66, icon: 'hand', title: 'Push button', text: 'Click and hold it to close the switch.' },
      { anchor: 'res', x: 0.04, y: 0.68, icon: 'resistor', title: 'Pull-up inside', text: 'INPUT_PULLUP uses a resistor built into the chip.' },
    ],
    overview: {
      heading: 'Push a button',
      text: 'Inputs let the board sense the world. A push button connects pin 2 to ground when pressed. With the built-in pull-up resistor, the pin reads <code>HIGH</code> when released and <code>LOW</code> when pressed.',
      features: [['hand', 'Press and hold the 3D button'], ['pins', '<code>digitalRead()</code> returns HIGH or LOW'], ['timer', 'A short delay “debounces” the contacts']],
    },
    pinout: [['D2', 'Button leg', 'INPUT_PULLUP'], ['GND', 'Other button leg', 'Pressed = connected to 0 V'], ['D13', 'Resistor → LED', 'Shows the button state']],
    example: {
      text: 'Keyboards, doorbells, game controllers and lift call buttons all work this way: a switch pulls an input low and the program reacts.',
      points: ['Change the logic so the LED is on until you press', 'Count presses with a variable and print the total'],
    },
    specs: [['Switch type', '6 mm tactile, momentary'], ['Internal pull-up', '20–50 kΩ'], ['Bounce time', '1–10 ms'], ['Logic', 'Pressed = LOW']],
    quiz: [
      { q: "With INPUT_PULLUP, what does digitalRead() return while the button is pressed?", options: ["HIGH", "LOW", "1023", "It depends on the LED"], answer: 1, explain: "The pull-up holds the pin HIGH; pressing the button connects it to GND, so it reads LOW." },
      { q: "Why add a short delay after reading a button?", options: ["To save power", "To debounce — ignore the contacts bouncing", "To make the LED brighter", "Serial needs it"], answer: 1, explain: "Mechanical contacts bounce for a few milliseconds, which can look like several presses." },
      { q: "What does the == operator do?", options: ["Assigns a value", "Compares two values", "Adds two values", "Prints a value"], answer: 1, explain: "= assigns, == compares." },
    ],
    challenges: ["Make the LED toggle on/off with each press instead of only while held.", "Count the presses and print the total to the serial monitor.", "Light the LED only after the button has been held for 2 seconds."],
    code: `const int BUTTON_PIN = 2;
const int LED_PIN = 13;
int lastState = HIGH;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);  // HIGH until pressed
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int state = digitalRead(BUTTON_PIN);
  if (state == LOW) {
    digitalWrite(LED_PIN, HIGH);      // pressed
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  if (state != lastState) {
    Serial.println(state == LOW ? "Pressed" : "Released");
    lastState = state;
  }
  delay({{debounce}});                  // debounce
}`,
    params: { debounce: { value: 20, min: 0, max: 500 } },
    async setup(io) { io.line('INPUT_PULLUP'); await io.delay(100); io.print('Press the button on the breadboard…'); },
    async loop(io, b, p) {
      io.line('digitalRead');
      const s = b.btn.pressed ? 0 : 1;
      io.pin('D2', s ? 'HIGH' : 'LOW', !s);
      if (!s) { io.line('HIGH);      //'); b.on(); io.board.setBuiltinLed(1); io.pin('D13', 'HIGH', true); }
      else { io.line('LOW);'); b.led.set(0); io.board.setBuiltinLed(0); io.pin('D13', 'LOW', false); }
      if (s !== b.last) { io.line('Serial.println'); io.print(s ? 'Released' : 'Pressed'); b.last = s; }
      io.line('delay('); await io.delay(Math.max(16, p.debounce));
    },
    reset(b, io) { b.led.set(0); io.board.setBuiltinLed(0); b.last = 1; },
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'knob', title: 'Turn a knob', icon: 'knob',
    thumb: () => makePot([v(-0.5, 0, 0), v(0, 0, 0), v(0.5, 0, 0)]).group,
    view: { center: [5.4, 0.6, -0.4], size: 15 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D9', col: 4 });
      const pot = ctx.add(makePot([bb.hole(17, 'h'), bb.hole(19, 'h'), bb.hole(21, 'h')]));
      ctx.wire(ctx.board.pin('5V'), bb.hole(17, 'j'), 'red', { signal: '5V' });
      const a0 = ctx.wire(ctx.board.pin('A0'), bb.hole(19, 'j'), 'green', { signal: 'A0' });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(21, 'j'), 'black', { signal: 'GND', dir: -1 });
      const state = { knob: 0.6 };
      pot.set(state.knob);
      ctx.interact(pot, {
        name: 'Potentiometer', hint: 'Click to turn the knob',
        controls: [{ type: 'range', label: 'Position', min: 0, max: 1023, step: 1, get: () => Math.round(state.knob * 1023), set: (x) => { state.knob = x / 1023; pot.set(state.knob); } }],
      });
      ctx.anchor('pot', pot.anchor);
      ctx.anchor('a0', a0.mid);
      ctx.anchor('led', c.led.anchor);
      return { ...c, pot, state };
    },
    callouts: [
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'LED on pin ~9', text: 'Brightness follows the knob using PWM.' },
      { anchor: 'a0', x: 0.4, y: 0.72, icon: 'wave', title: 'Analog pin A0', text: 'Reads the wiper voltage as 0–1023.' },
      { anchor: 'pot', x: 0.7, y: 0.17, icon: 'knob', title: 'Potentiometer', text: 'Click it, then drag the slider to turn.' },
    ],
    overview: {
      heading: 'Turn a knob',
      text: 'A potentiometer is a resistor with a sliding contact. Its middle pin outputs a voltage between 0 and 5 V depending on where the knob is, and <code>analogRead()</code> turns that into a number.',
      features: [['knob', 'Click the knob to turn it'], ['wave', '<code>analogRead()</code> gives 0–1023'], ['pwm', '<code>analogWrite()</code> dims the LED (0–255)']],
    },
    pinout: [['5V', 'Pot outer leg', ''], ['A0', 'Pot middle leg (wiper)', '0–5 V'], ['GND', 'Pot other outer leg', ''], ['D9 ~', 'Resistor → LED', 'PWM output']],
    example: {
      text: 'Volume knobs, light dimmers and joysticks are potentiometers. A joystick is just two of them at right angles.',
      points: ['Use <code>map(value, 0, 1023, 0, 255)</code> instead of dividing by 4', 'Print the voltage: <code>value * 5.0 / 1023</code>'],
    },
    specs: [['Resistance', '10 kΩ linear'], ['Rotation', '≈ 270°'], ['ADC resolution', '10-bit (≈ 4.9 mV per step)'], ['PWM frequency on D9', '≈ 490 Hz']],
    quiz: [
      { q: "What range of numbers does analogRead() return?", options: ["0–255", "0–1023", "0–5", "−512–512"], answer: 1, explain: "The 10-bit ADC gives 1024 steps, from 0 to 1023." },
      { q: "Which pins can use analogWrite() on this board?", options: ["Any pin", "Only A0–A5", "Only pins marked ~ (PWM)", "Only pin 13"], answer: 2, explain: "analogWrite() needs a PWM pin: 3, 5, 6, 9, 10 and 11." },
      { q: "Why divide the reading by 4?", options: ["To convert 0–1023 into 0–255", "To make it faster", "To convert to volts", "To remove noise"], answer: 0, explain: "analogWrite() takes 0–255, roughly a quarter of 0–1023." },
    ],
    challenges: ["Use map() to make the LED fully off for the first quarter of the knob’s travel.", "Print the knob position as a percentage.", "Make the LED blink, with the knob setting the speed."],
    code: `const int KNOB_PIN = A0;
const int LED_PIN = 9;     // a PWM pin (~)

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int value = analogRead(KNOB_PIN);   // 0 – 1023
  int brightness = value / 4;         // 0 – 255
  analogWrite(LED_PIN, brightness);
  Serial.print("A0 = ");
  Serial.println(value);
  delay({{rate}});
}`,
    params: { rate: { value: 200, min: 20, max: 2000 } },
    async setup(io) { io.line('pinMode'); await io.delay(100); },
    async loop(io, b, p) {
      io.line('analogRead');
      const val = Math.round(b.state.knob * 1023);
      io.pin('A0', String(val), true);
      io.line('brightness ='); const br = Math.floor(val / 4);
      io.line('analogWrite'); b.on(br / 255); io.pin('D9', `PWM ${br}`, br > 0);
      io.line('Serial.println'); io.print(`A0 = ${val}`);
      io.line('delay('); await io.delay(p.rate);
    },
    reset(b) { b.led.set(0); },
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'rgb', title: 'Mix colours', icon: 'palette',
    thumb: () => { const l = makeRGBLED([v(-0.38, 0, 0), v(-0.13, 0, 0), v(0.13, 0, 0), v(0.38, 0, 0)]); l.set(170, 40, 255); return l.group; },
    view: { center: [5.6, 0.6, -0.6], size: 15 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const rgb = ctx.add(makeRGBLED([bb.hole(13, 'c'), bb.hole(14, 'c'), bb.hole(15, 'c'), bb.hole(16, 'c')]));
      const rR = ctx.add(makeResistor(bb.hole(9, 'd'), bb.hole(13, 'd'), 220));
      const rG = ctx.add(makeResistor(bb.hole(15, 'e'), bb.hole(15, 'g'), 220, { height: 0.5 }));
      const rB = ctx.add(makeResistor(bb.hole(16, 'd'), bb.hole(20, 'd'), 220));
      const wr = ctx.wire(ctx.board.pin('D9'), bb.hole(9, 'b'), 'red', { signal: 'D9' });
      const wg = ctx.wire(ctx.board.pin('D10'), bb.hole(15, 'i'), 'green', { signal: 'D10', bend: v(0, 0.6, 0) });
      const wb = ctx.wire(ctx.board.pin('D11'), bb.hole(20, 'b'), 'blue', { signal: 'D11' });
      ctx.wire(ctx.board.pin('GND'), bb.hole(14, 'a'), 'black', { signal: 'GND', dir: -1 });
      ctx.anchor('rgb', rgb.anchor);
      ctx.anchor('r', wr.mid);
      ctx.anchor('g', wg.mid);
      ctx.anchor('b', wb.mid);
      ctx.anchor('res', rR.anchor);
      return { rgb, rR, rG, rB, color: [0, 0, 0] };
    },
    callouts: [
      { anchor: 'r', x: 0.04, y: 0.17, icon: 'pins', title: 'Red · pin ~9', text: 'Each colour has its own PWM pin.' },
      { anchor: 'g', x: 0.36, y: 0.12, icon: 'pins', title: 'Green · pin ~10', text: 'Mixing light adds colours together.' },
      { anchor: 'b', x: 0.7, y: 0.17, icon: 'pins', title: 'Blue · pin ~11', text: 'Red + blue makes magenta.' },
      { anchor: 'rgb', x: 0.7, y: 0.68, icon: 'palette', title: 'RGB LED', text: 'Three LEDs under one milky lens.' },
      { anchor: 'res', x: 0.04, y: 0.68, icon: 'resistor', title: 'Three resistors', text: 'One per colour, so each gets its own current.' },
    ],
    overview: {
      heading: 'Mix colours',
      text: 'An RGB LED hides a red, a green and a blue LED inside one lens, sharing a common ground. Set each one’s brightness with PWM and the light blends into any colour you like.',
      features: [['palette', '16 million mixes from three numbers'], ['pwm', '<code>analogWrite()</code> on three PWM pins'], ['code', 'A helper function keeps <code>loop()</code> tidy']],
    },
    pinout: [['D9 ~', '220 Ω → Red leg', ''], ['D10 ~', '220 Ω → Green leg', ''], ['D11 ~', '220 Ω → Blue leg', ''], ['GND', 'Longest leg', 'Common cathode']],
    example: {
      text: 'Mood lamps, gaming keyboards and smart bulbs all mix colours with RGB LEDs, often hundreds at a time.',
      points: ['Try <code>setColor(255, 120, 0)</code> for orange', 'Make the step delay smaller to cycle faster'],
    },
    specs: [['Type', 'Common cathode'], ['Red forward voltage', '≈ 2.0 V'], ['Green / blue', '≈ 3.0 V'], ['Current per colour', '≈ 10–15 mA']],
    quiz: [
      { q: "What colour do red and green light make together?", options: ["Brown", "Yellow", "Purple", "White"], answer: 1, explain: "Light mixes additively: red + green = yellow." },
      { q: "Why does each colour need its own resistor?", options: ["Each LED inside has a different forward voltage and needs its own current limit", "To make it dimmer", "Only the red one needs it", "Resistors change colours"], answer: 0, explain: "Sharing one resistor would let the lowest-voltage LED hog the current." },
      { q: "What does setColor(0, 0, 255) show?", options: ["Red", "Green", "Blue", "Off"], answer: 2, explain: "Only the blue channel is on." },
    ],
    challenges: ["Show the colours of a rainbow, one per second.", "Make the LED ‘breathe’ white by fading all three channels together.", "Use the potentiometer from lesson 4 to pick the hue."],
    code: `const int RED = 9, GREEN = 10, BLUE = 11;

void setup() {
  pinMode(RED, OUTPUT);
  pinMode(GREEN, OUTPUT);
  pinMode(BLUE, OUTPUT);
}

void setColor(int r, int g, int b) {
  analogWrite(RED, r);
  analogWrite(GREEN, g);
  analogWrite(BLUE, b);
}

void loop() {
  for (int i = 0; i < 255; i++) {    // red -> green
    setColor(255 - i, i, 0);
    delay({{step}});
  }
  for (int i = 0; i < 255; i++) {    // green -> blue
    setColor(0, 255 - i, i);
    delay({{step}});
  }
  for (int i = 0; i < 255; i++) {    // blue -> red
    setColor(i, 0, 255 - i);
    delay({{step}});
  }
}`,
    params: { step: { value: 8, min: 1, max: 100 } },
    async setup(io) { io.line('pinMode(RED'); await io.delay(150); },
    async loop(io, b, p) {
      const phases = [[(i) => [255 - i, i, 0], 'red -> green', 'Red → green'], [(i) => [0, 255 - i, i], 'green -> blue', 'Green → blue'], [(i) => [i, 0, 255 - i], 'blue -> red', 'Blue → red']];
      for (let k = 0; k < 3; k++) {
        const [f, , label] = phases[k];
        io.print(label);
        for (let i = 0; i < 255; i += 3) {
          const c = f(i);
          io.line('setColor(', k + 2);
          b.rgb.set(...c);
          io.pin('D9', String(c[0]), c[0] > 10);
          io.pin('D10', String(c[1]), c[1] > 10);
          io.pin('D11', String(c[2]), c[2] > 10);
          await io.delay(p.step * 3);
        }
      }
    },
    reset(b) { b.rgb.set(0, 0, 0); },
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'light', title: 'Sense light', icon: 'sun',
    thumb: () => makeLDR(v(-0.13, 0, 0), v(0.13, 0, 0)).group,
    view: { center: [5.4, 0.6, -0.6], size: 15 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D13', col: 4 });
      const ldr = ctx.add(makeLDR(bb.hole(19, 'c'), bb.hole(20, 'c')));
      const r10 = ctx.add(makeResistor(bb.hole(20, 'e'), bb.hole(20, 'g'), 10000, { height: 0.45 }));
      ctx.wire(ctx.board.pin('5V'), bb.hole(19, 'a'), 'red', { signal: '5V' });
      const a0 = ctx.wire(ctx.board.pin('A0'), bb.hole(20, 'a'), 'green', { signal: 'A0' });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(20, 'j'), 'black', { signal: 'GND', dir: -1 });
      const state = { light: 0.7 };
      ctx.interact(ldr, {
        name: 'Light sensor (LDR)', hint: 'Click to change the room light',
        controls: [{ type: 'range', label: 'Room light', min: 0, max: 100, step: 1, get: () => Math.round(state.light * 100), set: (x) => { state.light = x / 100; ctx.setDarkness(1 - state.light); }, format: (x) => `${x}%` }],
      });
      ctx.setDarkness(1 - state.light);
      ctx.anchor('ldr', ldr.anchor);
      ctx.anchor('r10', r10.anchor);
      ctx.anchor('a0', a0.mid);
      ctx.anchor('led', c.led.anchor);
      return { ...c, ldr, state };
    },
    callouts: [
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'Night light', text: 'Turns on when the reading drops below the threshold.' },
      { anchor: 'a0', x: 0.36, y: 0.12, icon: 'wave', title: 'A0', text: 'Brighter light = higher reading.' },
      { anchor: 'ldr', x: 0.7, y: 0.17, icon: 'sun', title: 'LDR', text: 'Click it to dim or brighten the room.' },
      { anchor: 'r10', x: 0.7, y: 0.68, icon: 'resistor', title: '10 kΩ resistor', text: 'Forms a voltage divider with the LDR.' },
    ],
    overview: {
      heading: 'Sense light',
      text: 'A light-dependent resistor (LDR) conducts better the more light falls on it. Paired with a fixed resistor it makes a <em>voltage divider</em>, so the voltage on A0 rises in bright light and falls in the dark.',
      features: [['sun', 'Click the sensor to change the light'], ['wave', 'Voltage divider into <code>analogRead()</code>'], ['code', 'Compare against a threshold with <code>if</code>']],
    },
    pinout: [['5V', 'LDR leg 1', ''], ['A0', 'LDR leg 2 + 10 kΩ', 'Divider midpoint'], ['GND', '10 kΩ other end', ''], ['D13', 'Resistor → LED', 'Night light']],
    example: {
      text: 'Street lights that switch on at dusk, phones that dim their screens and solar garden lamps all use light sensors in exactly this way.',
      points: ['Change <code>THRESHOLD</code> to make it more or less sensitive', 'Use <code>analogWrite()</code> to fade the LED as it gets darker'],
    },
    specs: [['LDR in bright light', '≈ 1 kΩ'], ['LDR in darkness', '≈ 200 kΩ+'], ['Fixed resistor', '10 kΩ'], ['A0 voltage', '5 V × 10k / (10k + R<sub>LDR</sub>)']],
    quiz: [
      { q: "In this circuit, what happens to the A0 reading when the room gets darker?", options: ["It rises", "It falls", "It stays the same", "It becomes negative"], answer: 1, explain: "The LDR’s resistance rises in the dark, so less voltage reaches A0." },
      { q: "What is a voltage divider?", options: ["Two resistors in series, with the output taken from the middle", "A resistor that divides by two", "A type of battery", "A transistor"], answer: 0, explain: "The ratio of the two resistances sets the output voltage." },
      { q: "What would a higher THRESHOLD do?", options: ["Turn the light on in brighter conditions", "Turn it on only when very dark", "Nothing", "Make the LED brighter"], answer: 0, explain: "The LED switches on whenever the reading is below THRESHOLD, so a higher value triggers sooner." },
    ],
    challenges: ["Fade the LED in gradually as it gets darker instead of switching it on.", "Add hysteresis: different on and off thresholds so it doesn’t flicker at dusk.", "Print ‘Day’ or ‘Night’ only when the state changes."],
    code: `const int LDR_PIN = A0;
const int LED_PIN = 13;
const int THRESHOLD = {{threshold}};

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(LDR_PIN);   // darker = lower
  Serial.print("Light: ");
  Serial.println(light);
  if (light < THRESHOLD) {
    digitalWrite(LED_PIN, HIGH);     // night light on
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  delay(300);
}`,
    params: { threshold: { value: 400, min: 0, max: 1023 } },
    async setup(io) { io.line('pinMode'); await io.delay(100); },
    async loop(io, b, p) {
      io.line('analogRead');
      const rLdr = 200000 * 10 ** (-2.3 * b.state.light);
      const val = Math.round((1023 * 10000) / (10000 + rLdr));
      io.pin('A0', String(val), true);
      io.line('Serial.println'); io.print(`Light: ${val}`);
      io.line('if (light');
      if (val < p.threshold) { io.line('HIGH'); b.on(); io.board.setBuiltinLed(1); io.pin('D13', 'HIGH', true); }
      else { io.line('LOW);'); b.led.set(0); io.board.setBuiltinLed(0); io.pin('D13', 'LOW', false); }
      io.line('delay('); await io.delay(300);
    },
    reset(b, io) { b.led.set(0); io.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ 7
  {
    id: 'sound', title: 'Make a sound', icon: 'sound',
    thumb: () => makeBuzzer(v(-0.38, 0, 0), v(0.38, 0, 0)).group,
    view: { center: [5.2, 0.6, -0.6], size: 14 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const bz = ctx.add(makeBuzzer(bb.hole(15, 'd'), bb.hole(18, 'd')));
      const w = ctx.wire(ctx.board.pin('D8'), bb.hole(15, 'b'), 'orange', { signal: 'D8' });
      const g = ctx.wire(ctx.board.pin('GND'), bb.hole(18, 'b'), 'black', { signal: 'GND', dir: -1 });
      ctx.interact(bz, { name: 'Piezo buzzer', hint: 'Turn on sound in Settings to hear it' });
      ctx.anchor('bz', bz.anchor);
      ctx.anchor('d8', w.mid);
      ctx.anchor('gnd', g.mid);
      return { bz };
    },
    callouts: [
      { anchor: 'd8', x: 0.36, y: 0.12, icon: 'pins', title: 'Pin 8', text: '<code>tone()</code> flips it hundreds of times a second.' },
      { anchor: 'gnd', x: 0.04, y: 0.17, icon: 'gnd', title: 'GND', text: 'Completes the circuit.' },
      { anchor: 'bz', x: 0.7, y: 0.68, icon: 'sound', title: 'Piezo buzzer', text: 'Clicks each time the pin flips — fast clicks make a note.' },
    ],
    overview: {
      heading: 'Make a sound',
      text: 'A piezo buzzer clicks every time its pin changes. Flip the pin 440 times a second and you hear the note A. The <code>tone()</code> function does the flipping for you in the background.',
      features: [['sound', 'Play a scale with <code>tone()</code>'], ['code', 'Store notes in an array'], ['gear', 'Turn on sound in Settings to listen']],
    },
    pinout: [['D8', 'Buzzer +', 'Any digital pin works'], ['GND', 'Buzzer –', '']],
    example: {
      text: 'Microwave beeps, alarm clocks, toy pianos and the “ding” of a lift all come from small buzzers driven like this.',
      points: ['Make the note length smaller for a faster tune', 'Write your own melody — 262 is middle C'],
    },
    specs: [['Type', 'Passive piezo'], ['Useful range', '≈ 100 Hz – 10 kHz'], ['Loudest around', '2–4 kHz'], ['tone() timer', 'Timer2 (affects PWM on 3 and 11)']],
    quiz: [
      { q: "What does tone(8, 440) do?", options: ["Sets pin 8 to 440 V", "Plays a 440 Hz square wave on pin 8", "Waits 440 ms", "Reads a frequency"], answer: 1, explain: "tone() toggles the pin 440 times a second — the note A4." },
      { q: "Doubling a note’s frequency raises it by…", options: ["A semitone", "An octave", "Nothing", "A fifth"], answer: 1, explain: "Each octave doubles the frequency: 262 Hz → 523 Hz is C4 → C5." },
      { q: "How do you stop a tone?", options: ["delay(0)", "noTone(pin)", "digitalWrite(pin, HIGH)", "Serial.end()"], answer: 1, explain: "noTone() stops the square wave." },
    ],
    challenges: ["Play a tune you know (look up the note frequencies).", "Use the button from lesson 3 to play a note while it’s held.", "Make a siren that sweeps from 400 Hz to 1200 Hz and back."],
    code: `const int BUZZER = 8;
int melody[] = {262, 294, 330, 349, 392, 440, 494, 523};

void setup() {
  pinMode(BUZZER, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  for (int i = 0; i < 8; i++) {
    tone(BUZZER, melody[i]);   // play a note
    Serial.println(melody[i]);
    delay({{note}});
    noTone(BUZZER);
    delay(50);
  }
  delay(1000);
}`,
    params: { note: { value: 250, min: 40, max: 2000 } },
    async setup(io) { io.line('pinMode'); await io.delay(100); },
    async loop(io, b, p) {
      const melody = [262, 294, 330, 349, 392, 440, 494, 523];
      for (const f of melody) {
        io.line('tone('); io.tone(f); b.bz.set(true, f); io.pin('D8', `${f} Hz`, true);
        io.line('Serial.println'); io.print(`${f} Hz`);
        io.line('delay', 1); await io.delay(p.note);
        io.line('noTone'); io.noTone(); b.bz.set(false); io.pin('D8', 'LOW', false);
        io.line('delay(50)'); await io.delay(50);
      }
      io.line('delay(1000)'); await io.delay(1000);
    },
    reset(b, io) { b.bz.set(false); io.noTone(); },
  },

  // ------------------------------------------------------------------ 8
  {
    id: 'motor', title: 'Control a motor', icon: 'motor',
    thumb: () => makeMotor(v(0, 0, 0)).group,
    view: { center: [6.6, 0.8, 1.2], size: 17 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const q = ctx.add(makeTO92([bb.hole(14, 'h'), bb.hole(15, 'h'), bb.hole(16, 'h')], 'NPN'));
      const rb = ctx.add(makeResistor(bb.hole(11, 'g'), bb.hole(15, 'g'), 1000));
      const d = ctx.add(makeDiode(bb.hole(16, 'i'), bb.hole(20, 'i')));
      const motor = ctx.add(makeMotor(v(11.2, 0, 5.8)));
      const sig = ctx.wire(ctx.board.pin('D9'), bb.hole(11, 'f'), 'orange', { signal: 'D9' });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(14, 'j'), 'black', { signal: 'GND', dir: -1 });
      ctx.wire(ctx.board.pin('5V'), bb.hole(20, 'j'), 'red', { signal: '5V' });
      const m1 = ctx.wire(motor.terminals[0], bb.hole(16, 'j'), 'black', { lift: 1.2 });
      const m2 = ctx.wire(motor.terminals[1], bb.hole(20, 'g'), 'red', { lift: 1.4, dir: -1 });
      ctx.interact(motor, { name: 'DC motor', hint: 'Its speed follows the PWM value on pin 9' });
      ctx.anchor('q', q.anchor);
      ctx.anchor('d', d.anchor);
      ctx.anchor('motor', motor.anchor);
      ctx.anchor('sig', sig.mid);
      ctx.anchor('rb', rb.anchor);
      return { motor, motorWires: [m1, m2] };
    },
    callouts: [
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pwm', title: 'Pin ~9', text: 'PWM sets how fast the motor spins.' },
      { anchor: 'rb', x: 0.04, y: 0.17, icon: 'resistor', title: '1 kΩ base resistor', text: 'Limits the current into the transistor.' },
      { anchor: 'q', x: 0.7, y: 0.17, icon: 'transistor', title: 'Transistor', text: 'A small current switches a much bigger one.' },
      { anchor: 'd', x: 0.04, y: 0.66, icon: 'diode', title: 'Flyback diode', text: 'Soaks up the voltage spike when the motor stops.' },
      { anchor: 'motor', x: 0.7, y: 0.7, icon: 'motor', title: 'DC motor', text: 'Powered from 5 V, switched by the transistor.' },
    ],
    overview: {
      heading: 'Control a motor',
      text: 'A pin can only supply about 20 mA — far too little for a motor. Instead, the pin drives an NPN transistor, which switches the motor’s much larger current from the 5 V supply.',
      features: [['transistor', 'A transistor as a switch'], ['pwm', 'PWM ramps the speed up and down'], ['diode', 'A diode protects against back-voltage']],
    },
    pinout: [['D9 ~', '1 kΩ → transistor base', ''], ['GND', 'Transistor emitter', ''], ['5V', 'Motor + and diode cathode', ''], ['Collector', 'Motor – and diode anode', '']],
    example: {
      text: 'Desk fans, toy cars, drones and robot wheels all use motors switched by transistors — larger ones use MOSFETs or dedicated motor-driver chips.',
      points: ['Change the ramp delay to speed up or slow down the fan', 'Add a button to start and stop the fan'],
    },
    specs: [['Transistor', 'NPN, e.g. 2N2222 / PN2222'], ['Max collector current', '≈ 600 mA'], ['Motor', '3–6 V hobby motor'], ['Diode', '1N4001']],
    quiz: [
      { q: "Why not connect the motor straight to a pin?", options: ["Pins can only supply about 20 mA — a motor needs much more", "Motors only run on AC", "It would spin backwards", "Pins are 12 V"], answer: 0, explain: "The transistor lets a tiny base current control a much bigger motor current." },
      { q: "What is the diode across the motor for?", options: ["To make it spin faster", "To absorb the voltage spike when the motor switches off", "To light up", "To reverse the motor"], answer: 1, explain: "A spinning motor acts as a generator; the flyback diode protects the transistor." },
      { q: "What does analogWrite(9, 128) do to the motor?", options: ["Stops it", "Runs it at roughly half speed", "Full speed", "Reverses it"], answer: 1, explain: "PWM at ~50% duty cycle delivers about half the average power." },
    ],
    challenges: ["Control the fan speed with the potentiometer.", "Start and stop the fan with a button.", "Make the fan pulse: speed up and slow down like a breeze."],
    code: `const int MOTOR = 9;   // drives the transistor base

void setup() {
  pinMode(MOTOR, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  for (int speed = 0; speed <= 255; speed += 5) {   // speed up
    analogWrite(MOTOR, speed);
    delay({{ramp}});
  }
  Serial.println("Full speed");
  delay(1500);
  for (int speed = 255; speed >= 0; speed -= 5) {   // slow down
    analogWrite(MOTOR, speed);
    delay({{ramp}});
  }
  Serial.println("Stopped");
  delay(1500);
}`,
    params: { ramp: { value: 40, min: 5, max: 500 } },
    async setup(io) { io.line('pinMode'); await io.delay(100); },
    async loop(io, b, p) {
      const set = (s) => {
        b.motor.set(s / 255);
        io.pin('D9', `PWM ${s}`, s > 0);
        b.motorWires.forEach((w) => { w.live = s > 0; w.speed = 0.3 + s / 255; });
      };
      for (let s = 0; s <= 255; s += 5) { io.line('analogWrite', 1); set(s); io.line('delay', 1); await io.delay(p.ramp); }
      io.line('Full speed'); io.print('Full speed');
      io.line('delay(1500)', 1); await io.delay(1500);
      for (let s = 255; s >= 0; s -= 5) { io.line('analogWrite', 2); set(s); io.line('delay', 3); await io.delay(p.ramp); }
      io.line('Stopped'); io.print('Stopped');
      io.line('delay(1500)', 2); await io.delay(1500);
    },
    reset(b) { b.motor.set(0); b.motorWires.forEach((w) => (w.live = false)); },
  },

  // ------------------------------------------------------------------ 9
  {
    id: 'heat', title: 'Sense heat', icon: 'thermo',
    thumb: () => makeTO92([v(-0.25, 0, 0), v(0, 0, 0), v(0.25, 0, 0)], 'TMP36').group,
    view: { center: [5.4, 0.6, -0.6], size: 15 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const c = ledOnPin(ctx, bb, { pin: 'D13', col: 4 });
      const t = ctx.add(makeTO92([bb.hole(17, 'c'), bb.hole(18, 'c'), bb.hole(19, 'c')], 'TMP36'));
      ctx.wire(ctx.board.pin('5V'), bb.hole(17, 'a'), 'red', { signal: '5V' });
      const a0 = ctx.wire(ctx.board.pin('A0'), bb.hole(18, 'a'), 'green', { signal: 'A0' });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(19, 'a'), 'black', { signal: 'GND', dir: -1 });
      const state = { temp: 22 };
      ctx.interact(t, {
        name: 'TMP36 sensor', hint: 'Click to warm it up or cool it down',
        controls: [{ type: 'range', label: 'Temperature', min: -10, max: 60, step: 0.5, get: () => state.temp, set: (x) => (state.temp = x), format: (x) => `${Number(x).toFixed(1)} °C` }],
      });
      ctx.anchor('t', t.anchor);
      ctx.anchor('a0', a0.mid);
      ctx.anchor('led', c.led.anchor);
      return { ...c, state };
    },
    callouts: [
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'Alarm LED', text: 'Lights when it gets hotter than ALARM_C.' },
      { anchor: 'a0', x: 0.36, y: 0.12, icon: 'wave', title: 'A0', text: 'Reads the sensor voltage.' },
      { anchor: 't', x: 0.7, y: 0.17, icon: 'thermo', title: 'TMP36', text: 'Click it to change the temperature.' },
    ],
    overview: {
      heading: 'Sense heat',
      text: 'The TMP36 turns temperature into a voltage: 0.5 V at 0 °C, plus 10 mV for every degree. A little maths converts the <code>analogRead()</code> value back into degrees.',
      features: [['thermo', 'Click the sensor to change the temperature'], ['code', 'Floating-point maths with <code>float</code>'], ['led', 'An alarm LED above a set temperature']],
    },
    pinout: [['5V', 'TMP36 left pin', 'Flat side facing you'], ['A0', 'Middle pin', 'Vout'], ['GND', 'Right pin', ''], ['D13', 'Resistor → LED', 'Alarm']],
    example: {
      text: 'Thermostats, 3D-printer beds, fridges and weather stations read temperature sensors and switch heaters or fans in response.',
      points: ['Convert to Fahrenheit: <code>celsius * 9 / 5 + 32</code>', 'Average 10 readings to smooth the noise'],
    },
    specs: [['Range', '−40 to +125 °C'], ['Accuracy', '± 2 °C'], ['Scale', '10 mV / °C'], ['Offset', '500 mV at 0 °C']],
    quiz: [
      { q: "What voltage does the TMP36 output at 25 °C?", options: ["0.25 V", "0.75 V", "2.5 V", "25 V"], answer: 1, explain: "0.5 V offset + 25 × 10 mV = 0.75 V." },
      { q: "Why use float instead of int for celsius?", options: ["Floats are faster", "To keep the decimal places", "int can’t be negative", "Serial needs floats"], answer: 1, explain: "int would throw away the fractional part of the result." },
      { q: "Which converts °C to °F?", options: ["c * 9 / 5 + 32", "c + 32", "c * 2", "(c − 32) * 5 / 9"], answer: 0, explain: "°F = °C × 9/5 + 32." },
    ],
    challenges: ["Print the temperature in both °C and °F.", "Track and print the highest and lowest temperature seen.", "Turn on the motor fan from lesson 8 when it gets hot."],
    code: `const int SENSOR = A0;
const int LED_PIN = 13;
const float ALARM_C = {{alarm}};

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int reading = analogRead(SENSOR);
  float volts = reading * 5.0 / 1023.0;
  float celsius = (volts - 0.5) * 100.0;
  Serial.print(celsius, 1);
  Serial.println(" C");
  digitalWrite(LED_PIN, celsius > ALARM_C ? HIGH : LOW);
  delay(500);
}`,
    params: { alarm: { value: 30, min: -10, max: 60 } },
    async setup(io) { io.line('pinMode'); await io.delay(100); },
    async loop(io, b, p) {
      io.line('analogRead');
      const noise = (Math.random() - 0.5) * 0.4;
      const reading = Math.round(((b.state.temp + noise) / 100 + 0.5) * 1023 / 5);
      io.pin('A0', String(reading), true);
      io.line('float volts'); const volts = (reading * 5) / 1023;
      io.line('float celsius'); const c = (volts - 0.5) * 100;
      io.line('Serial.println'); io.print(`${c.toFixed(1)} °C`);
      io.line('digitalWrite');
      const hot = c > p.alarm;
      if (hot) b.on(); else b.led.set(0);
      io.board.setBuiltinLed(hot ? 1 : 0);
      io.pin('D13', hot ? 'HIGH' : 'LOW', hot);
      io.line('delay('); await io.delay(500);
    },
    reset(b, io) { b.led.set(0); io.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ 10
  {
    id: 'servo', title: 'Sweep a servo', icon: 'servo',
    thumb: () => { const s = makeServo(v(0, 0, 0)); s.set(60); return s.group; },
    view: { center: [3.6, 0.6, 0.6], size: 12 },
    build(ctx) {
      const servo = ctx.add(makeServo(v(7.8, 0, 1.6)));
      servo.group.rotation.y = 0;
      const [gnd, pwr, sig] = servo.leads;
      ctx.wire(gnd, ctx.board.pin('GND_2'), 'brown', { signal: 'GND', lift: 1.2 });
      ctx.wire(pwr, ctx.board.pin('5V'), 'red', { signal: '5V', lift: 1.4, dir: -1 });
      const s = ctx.wire(sig, ctx.board.pin('D9'), 'orange', { signal: 'D9', lift: 2.2, dir: -1 });
      servo.set(0);
      ctx.interact(servo, { name: 'Micro servo', hint: 'It turns to the angle sent on pin 9' });
      ctx.anchor('servo', servo.anchor);
      ctx.anchor('sig', s.mid);
      return { servo };
    },
    callouts: [
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pwm', title: 'Signal · pin 9', text: 'A pulse every 20 ms; its width sets the angle.' },
      { anchor: 'power', x: 0.04, y: 0.68, icon: 'plug', title: '5V and GND', text: 'Red and brown wires power the servo.' },
      { anchor: 'servo', x: 0.7, y: 0.17, icon: 'servo', title: 'Micro servo', text: 'A motor, gears and a sensor that knows its position.' },
    ],
    overview: {
      heading: 'Sweep a servo',
      text: 'A servo is a motor that knows where it is. Send it a pulse between 1 and 2 ms long and it turns to a matching angle between 0° and 180° — and holds it there. The <code>Servo</code> library handles the pulses.',
      features: [['servo', 'Move to exact angles with <code>write()</code>'], ['code', 'Use a library with <code>#include</code>'], ['timer', 'The step delay sets the sweep speed']],
    },
    pinout: [['D9', 'Orange (signal)', ''], ['5V', 'Red (power)', ''], ['GND', 'Brown (ground)', '']],
    example: {
      text: 'Robot arms, RC car steering, camera gimbals and automatic pet feeders all use servos to move to precise positions.',
      points: ['Point it at an angle with a potentiometer (lesson 4)', 'Make the step delay bigger for a slow, smooth sweep'],
    },
    specs: [['Model', 'SG90-style micro servo'], ['Range', '0–180°'], ['Torque', '≈ 1.8 kg·cm'], ['Pulse', '1–2 ms every 20 ms']],
    quiz: [
      { q: "What range of angles can a standard hobby servo reach?", options: ["0–90°", "0–180°", "0–360° continuously", "Any angle"], answer: 1, explain: "Standard servos turn between 0° and 180°." },
      { q: "What sets the servo’s angle?", options: ["The voltage on the red wire", "The width of a pulse sent every 20 ms", "The current", "The number of pulses"], answer: 1, explain: "About 1 ms = 0°, 1.5 ms = 90°, 2 ms = 180°." },
      { q: "What does #include <Servo.h> do?", options: ["Plays a sound", "Adds the Servo library’s code to your sketch", "Resets the board", "Includes a picture"], answer: 1, explain: "Libraries give you ready-made code such as Servo.write()." },
    ],
    challenges: ["Point the servo using the potentiometer.", "Build a ‘gauge’ that shows the temperature from lesson 9.", "Make it wave: quick moves between 60° and 120°."],
    code: `#include <Servo.h>

Servo arm;

void setup() {
  arm.attach(9);
  Serial.begin(9600);
}

void loop() {
  for (int angle = 0; angle <= 180; angle += 2) {
    arm.write(angle);
    delay({{step}});
  }
  Serial.println("180 degrees");
  for (int angle = 180; angle >= 0; angle -= 2) {
    arm.write(angle);
    delay({{step}});
  }
  Serial.println("0 degrees");
}`,
    params: { step: { value: 15, min: 2, max: 200 } },
    async setup(io) { io.line('attach'); await io.delay(150); },
    async loop(io, b, p) {
      for (let a = 0; a <= 180; a += 2) { io.line('arm.write', 1); b.servo.set(a); io.pin('D9', `${a}°`, true); io.line('delay', 1); await io.delay(p.step); }
      io.line('180 degrees'); io.print('180°');
      for (let a = 180; a >= 0; a -= 2) { io.line('arm.write', 2); b.servo.set(a); io.pin('D9', `${a}°`, true); io.line('delay', 2); await io.delay(p.step); }
      io.line('0 degrees'); io.print('0°');
    },
    reset(b) { b.servo.set(0); },
  },

  // ------------------------------------------------------------------ 11
  {
    id: 'distance', title: 'Read a sensor', icon: 'radar',
    thumb: () => makeUltrasonic([v(-0.38, 0, 0), v(-0.13, 0, 0), v(0.13, 0, 0), v(0.38, 0, 0)]).group,
    view: { center: [6.8, 1.0, 1.8], size: 17 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const us = ctx.add(makeUltrasonic([bb.hole(14, 'e'), bb.hole(15, 'e'), bb.hole(16, 'e'), bb.hole(17, 'e')]));
      ctx.wire(ctx.board.pin('5V'), bb.hole(14, 'a'), 'red', { signal: '5V', bend: v(0, 0, -1.5) });
      const trig = ctx.wire(ctx.board.pin('D9'), bb.hole(15, 'a'), 'yellow', { signal: 'D9' });
      const echo = ctx.wire(ctx.board.pin('D10'), bb.hole(16, 'a'), 'green', { signal: 'D10' });
      ctx.wire(ctx.board.pin('GND'), bb.hole(17, 'a'), 'black', { signal: 'GND', dir: -1 });
      const state = { cm: 25 };
      const zFor = (cm) => us.front.z + 1.6 + cm * 0.09;
      const block = ctx.add(makeBlock(v(us.front.x, 0, zFor(state.cm))));
      const ping = ctx.add(makePing(us.front));
      const setCm = (cm) => { state.cm = cm; block.group.position.z = zFor(cm); };
      const ctl = [{ type: 'range', label: 'Distance', min: 3, max: 100, step: 1, get: () => state.cm, set: setCm, format: (x) => `${x} cm` }];
      ctx.interact(block, { name: 'Obstacle', hint: 'Click to move it closer or further', controls: ctl });
      ctx.interact(us, { name: 'HC-SR04 sensor', hint: 'Click to move the obstacle', controls: ctl });
      ctx.anchor('us', us.anchor);
      ctx.anchor('block', block.anchor);
      ctx.anchor('trig', trig.mid);
      ctx.anchor('echo', echo.mid);
      return { us, block, ping, state, zFor };
    },
    callouts: [
      { anchor: 'trig', x: 0.04, y: 0.17, icon: 'pins', title: 'Trig · pin 9', text: 'A 10 µs pulse sends out the ultrasound.' },
      { anchor: 'echo', x: 0.36, y: 0.12, icon: 'pins', title: 'Echo · pin 10', text: 'Stays HIGH for as long as the echo takes.' },
      { anchor: 'us', x: 0.7, y: 0.17, icon: 'radar', title: 'Ultrasonic sensor', text: 'A speaker and a microphone for sound you can’t hear.' },
      { anchor: 'block', x: 0.7, y: 0.7, icon: 'hand', title: 'Obstacle', text: 'Click it to move it closer or further away.' },
    ],
    overview: {
      heading: 'Read a sensor',
      text: 'The HC-SR04 sends out a burst of ultrasound and listens for the echo, like a bat. Sound travels about 0.0343 cm per microsecond, so timing the round trip tells you the distance.',
      features: [['radar', 'Measure 2–400 cm without touching'], ['timer', '<code>pulseIn()</code> times a pulse in µs'], ['hand', 'Click the obstacle to move it']],
    },
    pinout: [['5V', 'VCC', ''], ['D9', 'TRIG', 'Output'], ['D10', 'ECHO', 'Input'], ['GND', 'GND', '']],
    example: {
      text: 'Parking sensors, robot vacuums, automatic taps and tank level gauges all measure distance with ultrasound.',
      points: ['Beep faster as things get closer (combine with lesson 7)', 'Average three readings to ignore stray echoes'],
    },
    specs: [['Range', '2–400 cm'], ['Resolution', '≈ 0.3 cm'], ['Beam angle', '≈ 15°'], ['Frequency', '40 kHz']],
    quiz: [
      { q: "How does the HC-SR04 measure distance?", options: ["With a laser", "By timing an ultrasonic echo", "By measuring light", "With a magnet"], answer: 1, explain: "It times how long a 40 kHz sound pulse takes to bounce back." },
      { q: "Why divide by 2 in the distance formula?", options: ["The sound travels there and back", "To convert to inches", "The sensor has two eyes", "To average readings"], answer: 0, explain: "pulseIn() measures the round trip, so halve it for the one-way distance." },
      { q: "Roughly how fast does sound travel in air?", options: ["343 m/s", "3 m/s", "300,000 km/s", "34 km/s"], answer: 0, explain: "≈ 343 m/s, or 0.0343 cm per microsecond." },
    ],
    challenges: ["Beep the buzzer faster as objects get closer.", "Average five readings to smooth the result.", "Light the LED only when something is within 20 cm."],
    code: `const int TRIG = 9;
const int ECHO = 10;

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);          // 10 µs ping
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long echo = pulseIn(ECHO, HIGH);   // round trip in µs
  float cm = echo * 0.0343 / 2;
  Serial.print(cm);
  Serial.println(" cm");
  delay({{rate}});
}`,
    params: { rate: { value: 300, min: 60, max: 3000 } },
    async setup(io) { io.line('pinMode(TRIG'); await io.delay(100); },
    async loop(io, b, p) {
      io.line('HIGH);'); io.pin('D9', 'PING', true);
      b.ping.fire(b.zFor(b.state.cm) - b.us.front.z - 0.3);
      await io.delay(60);
      io.line('pulseIn'); io.pin('D9', 'LOW', false);
      const us = Math.round((b.state.cm * 2) / 0.0343 + (Math.random() - 0.5) * 8);
      io.pin('D10', `${us} µs`, true);
      await io.delay(180);
      io.line('float cm'); const cm = (us * 0.0343) / 2;
      io.line('Serial.println'); io.print(`${cm.toFixed(2)} cm`);
      io.line('delay('); await io.delay(Math.max(0, p.rate - 240));
    },
    reset() {},
  },

  // ------------------------------------------------------------------ 12
  {
    id: 'project', title: 'Build a project', icon: 'traffic',
    thumb: () => {
      const g = new THREE.Group();
      const t = makeTrafficLight([v(-0.38, 0, 0), v(-0.13, 0, 0), v(0.13, 0, 0), v(0.38, 0, 0)]);
      t.set('green', 1);
      g.add(t.group);
      return g;
    },
    view: { center: [6.6, 1.2, 2.0], size: 18 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const us = ctx.add(makeUltrasonic([bb.hole(6, 'e'), bb.hole(7, 'e'), bb.hole(8, 'e'), bb.hole(9, 'e')]));
      const tl = ctx.add(makeTrafficLight([bb.hole(21, 'e'), bb.hole(22, 'e'), bb.hole(23, 'e'), bb.hole(24, 'e')]));
      ctx.wire(ctx.board.pin('5V'), bb.hole(6, 'a'), 'red', { signal: '5V', bend: v(0, 0, -1.5) });
      ctx.wire(ctx.board.pin('D9'), bb.hole(7, 'a'), 'yellow', { signal: 'D9' });
      ctx.wire(ctx.board.pin('D10'), bb.hole(8, 'a'), 'green', { signal: 'D10' });
      ctx.wire(ctx.board.pin('GND'), bb.hole(9, 'a'), 'black', { signal: 'GND', dir: -1 });
      ctx.wire(ctx.board.pin('D4'), bb.hole(21, 'a'), 'red', { signal: 'D4' });
      ctx.wire(ctx.board.pin('D3'), bb.hole(22, 'a'), 'orange', { signal: 'D3' });
      ctx.wire(ctx.board.pin('D2'), bb.hole(23, 'a'), 'green', { signal: 'D2' });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(24, 'j'), 'black', { signal: 'GND', dir: -1, lift: 1.4 });
      const state = { cm: 60, auto: true, t: 0 };
      const zFor = (cm) => us.front.z + 1.4 + cm * 0.09;
      const car = ctx.add(makeCar(v(us.front.x, 0, zFor(state.cm) + 1.6)));
      const ping = ctx.add(makePing(us.front));
      const place = () => (car.group.position.z = zFor(state.cm) + 1.6);
      ctx.onTick((dt) => {
        if (!state.auto || !state.running) return;
        state.t += dt;
        state.cm = Math.round(55 + 48 * Math.cos(state.t * 0.45));
        place();
      });
      const ctl = [
        { type: 'range', label: 'Distance', min: 3, max: 110, step: 1, get: () => state.cm, set: (x) => { state.auto = false; state.cm = x; place(); }, format: (x) => `${x} cm` },
        { type: 'toggle', label: 'Drive automatically', get: () => state.auto, set: (x) => (state.auto = x) },
      ];
      ctx.interact(car, { name: 'Toy car', hint: 'Click to drive it yourself', controls: ctl });
      ctx.interact(us, { name: 'Distance sensor', hint: 'Click to move the car', controls: ctl });
      ctx.anchor('us', us.anchor);
      ctx.anchor('tl', tl.anchor);
      ctx.anchor('car', car.anchor);
      return { us, tl, car, ping, state, zFor };
    },
    callouts: [
      { anchor: 'us', x: 0.04, y: 0.17, icon: 'radar', title: 'Distance sensor', text: 'Watches how far away the car is.' },
      { anchor: 'tl', x: 0.7, y: 0.15, icon: 'traffic', title: 'Traffic light', text: 'Green, amber or red depending on the distance.' },
      { anchor: 'car', x: 0.7, y: 0.7, icon: 'car', title: 'Toy car', text: 'Drives back and forth — click it to take the wheel.' },
    ],
    overview: {
      heading: 'Build a project',
      text: 'Put it all together: the distance sensor watches the car and a traffic light tells the driver when to stop. This is a real parking assistant built from parts you already know.',
      features: [['radar', 'Input: ultrasonic distance (lesson 11)'], ['traffic', 'Output: three LEDs (lesson 2)'], ['code', 'Decisions with <code>if / else if / else</code>']],
    },
    pinout: [['D9 / D10', 'Sensor TRIG / ECHO', ''], ['D4', 'Red light', ''], ['D3', 'Amber light', ''], ['D2', 'Green light', ''], ['5V / GND', 'Power for both modules', '']],
    example: {
      text: 'Garages use exactly this to help drivers park. Swap the traffic light for a buzzer and you have a reversing sensor.',
      points: ['Tune <code>STOP_CM</code> and <code>SLOW_CM</code> in the code', 'Add a buzzer that beeps on red', 'Flash amber with <code>millis()</code> instead of <code>delay()</code>'],
    },
    specs: [['Parts', 'Board, breadboard, HC-SR04, traffic light module'], ['Wires', '8 jumpers'], ['Update rate', '10 per second'], ['Difficulty', 'Putting it all together']],
    quiz: [
      { q: "Which branch runs if cm is 30, STOP_CM is 15 and SLOW_CM is 45?", options: ["Stop (red)", "Slow down (amber)", "All clear (green)", "None"], answer: 1, explain: "30 is not below 15, but it is below 45, so the else-if branch runs." },
      { q: "Why put the sensor reading in a function like readCm()?", options: ["It’s required", "It keeps loop() short and lets you reuse the code", "It makes it faster", "Functions use less power"], answer: 1, explain: "Small named functions make programs easier to read and reuse." },
      { q: "Which inputs and outputs does this project use?", options: ["Ultrasonic input, three LED outputs", "Button input, motor output", "Light input, buzzer output", "No inputs"], answer: 0, explain: "The distance sensor is the input; the traffic light LEDs are outputs." },
    ],
    challenges: ["Add a buzzer that beeps faster as the car gets closer and stays on at red.", "Flash the amber light using millis() instead of delay().", "Show the distance on the serial plotter and tune the thresholds."],
    code: `const int TRIG = 9, ECHO = 10;
const int RED = 4, YELLOW = 3, GREEN = 2;
const int STOP_CM = {{stop}};
const int SLOW_CM = {{slow}};

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(RED, OUTPUT);
  pinMode(YELLOW, OUTPUT);
  pinMode(GREEN, OUTPUT);
  Serial.begin(9600);
}

long readCm() {
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  return pulseIn(ECHO, HIGH) * 0.0343 / 2;
}

void light(int r, int y, int g) {
  digitalWrite(RED, r);
  digitalWrite(YELLOW, y);
  digitalWrite(GREEN, g);
}

void loop() {
  long cm = readCm();
  Serial.println(cm);
  if (cm < STOP_CM) {
    light(HIGH, LOW, LOW);     // stop!
  } else if (cm < SLOW_CM) {
    light(LOW, HIGH, LOW);     // slow down
  } else {
    light(LOW, LOW, HIGH);     // all clear
  }
  delay(150);
}`,
    params: { stop: { value: 15, min: 3, max: 100 }, slow: { value: 45, min: 5, max: 110 } },
    async setup(io, b) { io.line('pinMode(TRIG'); b.state.running = true; await io.delay(150); },
    async loop(io, b, p) {
      io.line('long cm = readCm'); b.ping.fire(b.zFor(b.state.cm) - b.us.front.z - 0.3);
      io.pin('D9', 'PING', true);
      await io.delay(50);
      io.pin('D9', 'LOW', false);
      const cm = b.state.cm;
      io.line('Serial.println(cm)'); io.print(`${cm} cm`);
      const set = (r, y, g) => {
        b.tl.set('red', r); b.tl.set('yellow', y); b.tl.set('green', g);
        io.pin('D4', r ? 'HIGH' : 'LOW', r); io.pin('D3', y ? 'HIGH' : 'LOW', y); io.pin('D2', g ? 'HIGH' : 'LOW', g);
      };
      if (cm < p.stop) { io.line('light(HIGH'); set(1, 0, 0); }
      else if (cm < p.slow) { io.line('light(LOW, HIGH'); set(0, 1, 0); }
      else { io.line('light(LOW, LOW'); set(0, 0, 1); }
      io.line('delay(150)'); await io.delay(150);
    },
    reset(b) { b.state.running = false; ['red', 'yellow', 'green'].forEach((c) => b.tl.set(c, 0)); },
  },
];

