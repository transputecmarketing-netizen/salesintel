// Track 4 — Advanced Arduino: interrupts, state machines, I²C, SPI, EEPROM,
// multiple UARTs and low power. Mega 2560-style by default, two Nano lessons.
import * as THREE from 'three';
import { makeButton, makeBuzzer, makeTrafficLight, makeLED, makeResistor } from '../scene/components.js';
import { makeOLED, makeRTC, makeSDCard, makeHC05, makeDHT11 } from '../scene/modules.js';
import { makeNano } from '../scene/boards/nano.js';
import { v, ledOnPin } from './helpers.js';

/** Breadboard spot to the right of the (wider) Mega. */
const BBM = [10.6, -0.6];
/** Breadboard spot to the right of a Nano. */
const BBN = [7.6, 0];

const pad = (n, w = 2) => String(n).padStart(w, '0');
const hex2 = (n) => n.toString(16).toUpperCase().padStart(2, '0');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Push button straddling the channel at cols c / c+2 (signal → c top, GND → c+2 bottom). */
function buttonAt(ctx, bb, c, sigPin, gndPin, color = 'yellow', cap) {
  const btn = ctx.add(makeButton([bb.hole(c, 'e'), bb.hole(c + 2, 'e'), bb.hole(c, 'f'), bb.hole(c + 2, 'f')], cap));
  const sig = ctx.wire(ctx.board.pin(sigPin), bb.hole(c, 'a'), color, { signal: sigPin });
  const gnd = ctx.wire(ctx.board.pin(gndPin), bb.hole(c + 2, 'j'), 'black', { signal: 'GND', dir: -1 });
  return { btn, sig, gnd };
}

/** I²C bus on a breadboard: SDA in column `sda`, SCL in column `scl` (top half). */
function i2cBus(ctx, bb, { sdaPin, sclPin, vccPin, gndPin, sda = 10, scl = 12, vccCol = 3, gndCol = 4 }) {
  const wSda = ctx.wire(ctx.board.pin(sdaPin), bb.hole(sda, 'a'), 'blue', { signal: 'SDA' });
  const wScl = ctx.wire(ctx.board.pin(sclPin), bb.hole(scl, 'a'), 'yellow', { signal: 'SCL' });
  ctx.wire(ctx.board.pin(vccPin), bb.hole(vccCol, 'top+'), 'red', { signal: '5V' });
  ctx.wire(ctx.board.pin(gndPin), bb.hole(gndCol, 'top-'), 'black', { signal: 'GND', dir: -1 });
  // tie the top rails to the bottom rails
  ctx.wire(bb.hole(28, 'top+'), bb.hole(28, 'bot+'), 'red', { lift: 0.8 });
  ctx.wire(bb.hole(27, 'top-'), bb.hole(27, 'bot-'), 'black', { lift: 0.7 });
  return { wSda, wScl };
}

export const advanced = [
  // ------------------------------------------------------------------ interrupts
  {
    id: 'interrupts', title: 'Hardware interrupts', icon: 'bolt',
    thumb: () => makeButton([v(-0.25, 0, -0.38), v(0.25, 0, -0.38), v(-0.25, 0, 0.38), v(0.25, 0, 0.38)], 0xf2c230).group,
    view: { center: [4.4, 0.6, -0.4], size: 17 },
    build(ctx) {
      const bb = ctx.breadboard(...BBM);
      const c = ledOnPin(ctx, bb, { pin: 'D13', col: 4 });
      const { btn, sig } = buttonAt(ctx, bb, 16, 'D2', 'GND_2', 'yellow', 0xf2c230);
      const state = { running: false, isr: 0, lastIsr: -1e9, polled: 0, wasDown: false, timers: [] };
      const fallingEdge = () => {
        if (!state.running) return;
        // a real contact bounces: a few extra falling edges within ~2 ms
        const t0 = performance.now();
        const edges = [0, ...Array.from({ length: Math.floor(Math.random() * 4) }, (_, i) => 0.4 + i * 0.5)];
        for (const dt of edges) {
          const now = t0 + dt;
          if (now - state.lastIsr > state.debounce) { state.isr++; state.lastIsr = now; }
        }
        try { state.io?.line('presses++'); state.io?.pin('D2', 'FALLING → ISR', true); } catch { /* stopped */ }
      };
      const press = (on) => { if (on && !btn.pressed) fallingEdge(); btn.press(on); };
      const burst = () => {
        for (let i = 0; i < 5; i++) {
          state.timers.push(setTimeout(() => press(true), i * 110));
          state.timers.push(setTimeout(() => press(false), i * 110 + 45));
        }
      };
      ctx.interact(btn, {
        name: 'Push button on pin 2', hint: 'Hold it, or fire a burst of quick taps while loop() is busy',
        controls: [
          { type: 'button', label: 'Hold to press', hold: true, down: () => press(true), up: () => press(false) },
          { type: 'button', label: 'Tap 5× in half a second', press: burst },
        ],
        note: () => (state.running ? `ISR counted ${state.isr} · polling counted ${state.polled}` : 'Run the sketch, then try a burst of taps'),
      });
      ctx.anchor('btn', btn.anchor);
      ctx.anchor('d2', sig.mid);
      ctx.anchor('led', c.led.anchor);
      return { ...c, btn, state };
    },
    callouts: [
      { anchor: 'd2', x: 0.36, y: 0.12, icon: 'bolt', title: 'Pin 2 · interrupt', text: 'A falling edge jumps straight into onPress().' },
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'LED on pin 13', text: 'Toggles with every counted press.' },
      { anchor: 'btn', x: 0.7, y: 0.68, icon: 'hand', title: 'Push button', text: 'Click it, then try a burst of quick taps.' },
      { anchor: 'chip', x: 0.04, y: 0.68, icon: 'chip', title: 'Busy loop()', text: 'Polling only looks once a second — the ISR never misses.' },
    ],
    overview: {
      heading: 'Hardware interrupts',
      text: 'Polling checks a pin only when <code>loop()</code> gets round to it. An interrupt makes the hardware stop whatever the CPU is doing and run a short function the instant the pin changes — so no press is missed, even while the sketch is busy.',
      features: [['bolt', '<code>attachInterrupt()</code> on a FALLING edge'], ['code', '<code>volatile</code> variables and safe copies'], ['hand', 'Tap quickly and compare ISR vs polling counts']],
    },
    pinout: [['D2', 'Button → GND', 'INPUT_PULLUP; interrupt pin'], ['D13', '220 Ω → LED', 'Mirrors the count'], ['Mega interrupt pins', '2, 3, 18, 19, 20, 21', 'Uno / Nano: 2 and 3 only']],
    example: {
      text: 'Interrupts catch fast or rare events: wheel encoders on robots, rain-gauge tipping buckets, coin acceptors, emergency-stop buttons and data arriving on a serial port.',
      points: ['ISR rules: keep it short, no <code>delay()</code> or <code>Serial</code>, mark shared variables <code>volatile</code>', 'Copy multi-byte variables with interrupts briefly off', 'Set the debounce to 0 to watch contact bounce inflate the count'],
    },
    specs: [['Mega interrupt pins', '2, 3, 18, 19, 20, 21'], ['Trigger modes', 'LOW, CHANGE, RISING, FALLING'], ['Latency', 'a few µs at 16 MHz'], ['millis() in an ISR', 'Readable, but doesn’t advance'], ['Debounce here', 'Ignore edges closer than DEBOUNCE ms']],
    quiz: [
      { q: "Why is presses declared volatile?", options: ["To make it faster", "It changes inside an ISR, so the compiler must re-read it from memory every time", "volatile variables survive a reset", "It’s required for unsigned long"], answer: 1, explain: "Without volatile the compiler may keep a stale copy in a register and never see the ISR’s update." },
      { q: "Why does loop() turn interrupts off while copying presses?", options: ["To save power", "An unsigned long is 4 bytes; the ISR could change it half-way through the copy", "Serial needs interrupts off", "To debounce the button"], answer: 1, explain: "An 8-bit CPU copies 4 bytes one at a time — an interrupt in the middle would give a corrupted value." },
      { q: "Which of these is fine inside an ISR?", options: ["delay(500)", "Serial.println()", "presses++", "A loop that waits for the button to be released"], answer: 2, explain: "ISRs must be quick; delay() and Serial rely on interrupts that are paused while an ISR runs." },
      { q: "Why does polling miss presses here?", options: ["digitalRead() is broken", "loop() spends most of its time in delay(), so it only looks at the button once a second", "Pin 2 can’t be polled", "Polling needs a resistor"], answer: 1, explain: "Anything that starts and ends between two reads is invisible to polling." },
    ],
    challenges: ["Use CHANGE instead of FALLING and count both press and release.", "Measure the time between presses in the ISR with micros() and print the fastest double-tap.", "Add a second button on pin 3 with its own ISR that resets the counter."],
    code: `const int BUTTON = 2;             // an interrupt-capable pin
const int LED = 13;
volatile unsigned long presses = 0;  // changed inside the ISR
volatile unsigned long lastIsr = 0;
unsigned long polled = 0;         // counted the slow way, to compare
bool wasDown = false;

void onPress() {                  // ISR: keep it short!
  unsigned long now = millis();
  if (now - lastIsr > {{debounce}}) {   // ignore contact bounce
    presses++;
    lastIsr = now;
  }
}

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(BUTTON), onPress, FALLING);
  Serial.begin(9600);
}

void loop() {
  bool down = digitalRead(BUTTON) == LOW;  // polling: sees only "now"
  if (down && !wasDown) polled++;
  wasDown = down;

  noInterrupts();                 // copy the 4-byte counter safely
  unsigned long count = presses;
  interrupts();

  Serial.print("ISR: ");
  Serial.print(count);
  Serial.print("   polled: ");
  Serial.println(polled);
  digitalWrite(LED, count % 2);   // LED toggles with each press
  delay({{work}});                    // pretend to be busy
}`,
    params: { debounce: { value: 50, min: 0, max: 500 }, work: { value: 1000, min: 50, max: 3000 } },
    async setup(io, b, p) {
      Object.assign(b.state, { running: true, io, isr: 0, polled: 0, wasDown: false, lastIsr: -1e9, debounce: p.debounce });
      io.line('INPUT_PULLUP'); await io.delay(80);
      io.line('pinMode(LED'); await io.delay(80);
      io.line('attachInterrupt'); io.print('Interrupt attached to pin 2 (FALLING)'); await io.delay(120);
    },
    async loop(io, b, p) {
      const s = b.state;
      s.debounce = p.debounce;
      io.line('bool down');
      const down = b.btn.pressed;
      io.pin('D2', down ? 'LOW' : 'HIGH', down);
      if (down && !s.wasDown) { io.line('polled++'); s.polled++; }
      s.wasDown = down;
      io.line('noInterrupts'); await io.delay(16);
      io.line('unsigned long count'); const count = s.isr;
      io.line('Serial.println(polled)'); io.print(`ISR: ${count}   polled: ${s.polled}`);
      io.line('count % 2');
      const on = count % 2 === 1;
      if (on) b.on(); else b.led.set(0);
      io.board.setBuiltinLed(on ? 1 : 0);
      io.pin('D13', on ? 'HIGH' : 'LOW', on);
      io.line('delay('); await io.delay(p.work);
    },
    reset(b, io) {
      b.state.running = false;
      b.state.timers.forEach(clearTimeout); b.state.timers.length = 0;
      b.led.set(0); io?.board.setBuiltinLed(0);
    },
  },

  // ------------------------------------------------------------------ state machine
  {
    id: 'state-machine', title: 'Build a state machine', icon: 'traffic',
    thumb: () => { const t = makeTrafficLight([v(-0.38, 0, 0), v(-0.13, 0, 0), v(0.13, 0, 0), v(0.38, 0, 0)]); t.set('red', 1); return t.group; },
    view: { center: [5.4, 1.0, -0.2], size: 18 },
    build(ctx) {
      const bb = ctx.breadboard(...BBM);
      const tl = ctx.add(makeTrafficLight([bb.hole(2, 'e'), bb.hole(3, 'e'), bb.hole(4, 'e'), bb.hole(5, 'e')]));
      const tw = [['D22', 'red'], ['D24', 'orange'], ['D26', 'green']].map(([pin, col], i) => ctx.wire(ctx.board.pin(pin), bb.hole(2 + i, 'a'), col, { signal: pin }));
      ctx.wire(ctx.board.pin('GND'), bb.hole(5, 'a'), 'black', { signal: 'GND', dir: -1 });
      const pr = ledOnPin(ctx, bb, { pin: 'D28', col: 8, color: 'red', gnd: 'GND_4' });
      const pg = ledOnPin(ctx, bb, { pin: 'D30', col: 15, color: 'green', gnd: 'GND_5' });
      const { btn } = buttonAt(ctx, bb, 22, 'D32', 'GND_2', 'yellow', 0x3a6fd0);
      const bz = ctx.add(makeBuzzer(bb.hole(27, 'h'), bb.hole(30, 'h')));
      ctx.wire(ctx.board.pin('D34'), bb.hole(27, 'j'), 'purple', { signal: 'D34', lift: 2.6 });
      ctx.wire(ctx.board.pin('GND_3'), bb.hole(30, 'j'), 'black', { signal: 'GND', dir: -1 });
      ctx.interact(btn, { name: 'Crossing button', hint: 'Press to ask for the green man', hold: { down: () => btn.press(true), up: () => btn.press(false) } });
      ctx.interact(tl, { name: 'Car lights', hint: 'Pins 22 (red), 24 (amber) and 26 (green)' });
      ctx.interact(bz, { name: 'Crossing beeper', hint: 'Beeps while it’s safe to cross (turn on sound in Settings)' });
      ctx.anchor('tl', tl.anchor);
      ctx.anchor('ped', pg.led.anchor);
      ctx.anchor('btn', btn.anchor);
      ctx.anchor('bz', bz.anchor);
      ctx.anchor('dbl', tw[1].mid);
      return { tl, pr, pg, btn, bz, sm: {} };
    },
    callouts: [
      { anchor: 'tl', x: 0.04, y: 0.17, icon: 'traffic', title: 'Car lights · 22/24/26', text: 'Driven from the Mega’s double header.' },
      { anchor: 'ped', x: 0.36, y: 0.12, icon: 'led', title: 'Red / green man', text: 'Pins 28 and 30.' },
      { anchor: 'btn', x: 0.7, y: 0.17, icon: 'hand', title: 'Button · pin 32', text: 'Press it any time — loop() never blocks, so it’s always heard.' },
      { anchor: 'dbl', x: 0.04, y: 0.68, icon: 'code', title: 'switch (state)', text: 'Each state sets the lights and decides when to move on.' },
      { anchor: 'bz', x: 0.7, y: 0.68, icon: 'sound', title: 'Beeper · pin 34', text: 'Beeps without delay(): timing comes from millis().' },
    ],
    overview: {
      heading: 'Non-blocking state machine',
      text: 'A pedestrian crossing is a set of <em>states</em> (cars go, amber, all red, walk, flashing) and rules for moving between them. Timing each state with <code>millis()</code> instead of <code>delay()</code> keeps <code>loop()</code> spinning thousands of times a second, so the button is never ignored.',
      features: [['code', '<code>enum</code> + <code>switch</code> state machine'], ['timer', '<code>millis()</code> timing — no <code>delay()</code> at all'], ['hand', 'Press the button at any moment']],
    },
    pinout: [['D22 / D24 / D26', 'Car red / amber / green', 'Traffic light module'], ['D28 / D30', '220 Ω → red / green man LEDs', ''], ['D32', 'Button → GND', 'INPUT_PULLUP'], ['D34', 'Piezo +', 'tone()'], ['GND', 'Module, LEDs, button, piezo', '']],
    example: {
      text: 'Washing machines, vending machines, lifts, game characters and network protocols are all state machines. Writing them this way keeps each behaviour in one place and lets the board do several things at once.',
      points: ['Draw the states as bubbles and the transitions as arrows before coding', 'Try changing <code>MIN_GREEN</code> — the cars keep green at least that long', 'Add a state without touching any of the others'],
    },
    specs: [['States', '5 (CARS_GO … WALK_ENDING)'], ['Loop rate', '> 10,000 per second (no delays)'], ['Amber', '2 s'], ['All red', '1 s'], ['Walk', 'WALK_TIME, then 3 s flashing'], ['millis() rollover', '≈ 49.7 days (subtraction handles it)']],
    quiz: [
      { q: "Why is delay() avoided in this sketch?", options: ["It’s deprecated", "While delay() runs, loop() can’t read the button or update the beeper", "It uses too much memory", "millis() is more accurate"], answer: 1, explain: "delay() blocks everything; checking millis() lets loop() keep running and handle every input." },
      { q: "What does t = millis() - stateStart measure?", options: ["The time since power-up", "How long we’ve been in the current state", "The loop speed", "The button press length"], answer: 1, explain: "enter() records stateStart, so the difference is the time spent in this state." },
      { q: "In CARS_GO, when does the machine move to CARS_SLOW?", options: ["Immediately when the button is pressed", "After MIN_GREEN, even with no request", "Only when a crossing was requested and the cars have had at least MIN_GREEN", "Never"], answer: 2, explain: "Both conditions must hold: requested && t >= MIN_GREEN." },
      { q: "Why does beep() remember whether it is already beeping?", options: ["tone() is slow", "Calling tone() thousands of times a second would keep restarting it", "To save the battery", "noTone() needs it"], answer: 1, explain: "Acting only on changes is a common trick when loop() runs very fast." },
    ],
    challenges: ["Add a WAIT lamp that lights as soon as the button is pressed and goes out when the green man appears.", "Remember a press made during the walk phase and serve it on the next cycle.", "Add a night mode: flashing amber for cars while a switch is on."],
    code: `enum State { CARS_GO, CARS_SLOW, ALL_RED, WALK, WALK_ENDING };
const char* const NAMES[] = {"CARS_GO", "CARS_SLOW", "ALL_RED", "WALK", "WALK_ENDING"};

const int CAR_R = 22, CAR_Y = 24, CAR_G = 26;
const int PED_R = 28, PED_G = 30;
const int BUTTON = 32, BUZZER = 34;
const unsigned long MIN_GREEN = {{green}};   // ms of green for cars, at least
const unsigned long WALK_TIME = {{walk}};

State state = CARS_GO;
unsigned long stateStart = 0;
bool requested = false;
bool beeping = false;

void enter(State s) {
  state = s;
  stateStart = millis();
  Serial.print("-> ");
  Serial.println(NAMES[s]);
}

void lights(int r, int y, int g, int pr, int pg) {
  digitalWrite(CAR_R, r);
  digitalWrite(CAR_Y, y);
  digitalWrite(CAR_G, g);
  digitalWrite(PED_R, pr);
  digitalWrite(PED_G, pg);
}

void beep(bool on) {
  if (on == beeping) return;      // act only on changes
  beeping = on;
  if (on) tone(BUZZER, 2500); else noTone(BUZZER);
}

void setup() {
  int outs[] = {CAR_R, CAR_Y, CAR_G, PED_R, PED_G, BUZZER};
  for (int p : outs) pinMode(p, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);
  Serial.begin(9600);
  enter(CARS_GO);
}

void loop() {
  unsigned long t = millis() - stateStart;   // time in this state
  if (digitalRead(BUTTON) == LOW && !requested) {
    requested = true;
    Serial.println("Button: wait for the green man");
  }

  switch (state) {
    case CARS_GO:
      lights(LOW, LOW, HIGH, HIGH, LOW);
      if (requested && t >= MIN_GREEN) enter(CARS_SLOW);
      break;
    case CARS_SLOW:
      lights(LOW, HIGH, LOW, HIGH, LOW);
      if (t >= 2000) enter(ALL_RED);
      break;
    case ALL_RED:                        // let the crossing clear
      lights(HIGH, LOW, LOW, HIGH, LOW);
      if (t >= 1000) enter(WALK);
      break;
    case WALK:
      lights(HIGH, LOW, LOW, LOW, HIGH);
      beep(t % 500 < 100);               // beep ... beep ...
      if (t >= WALK_TIME) { beep(false); enter(WALK_ENDING); }
      break;
    case WALK_ENDING:                    // flashing green man
      lights(HIGH, LOW, LOW, LOW, (t / 300) % 2 == 0);
      if (t >= 3000) { requested = false; enter(CARS_GO); }
      break;
  }
}`,
    params: { green: { value: 3000, min: 500, max: 20000 }, walk: { value: 4000, min: 1000, max: 15000 } },
    async setup(io, b) {
      const NAMES = ['CARS_GO', 'CARS_SLOW', 'ALL_RED', 'WALK', 'WALK_ENDING'];
      Object.assign(b.sm, { NAMES, state: 0, start: performance.now(), requested: false, beeping: false });
      io.line('for (int p'); await io.delay(80);
      io.line('pinMode(BUTTON'); await io.delay(80);
      io.line('enter(CARS_GO);'); io.print('-> CARS_GO');
    },
    async loop(io, b, p) {
      const m = b.sm;
      const enter = (s) => { m.state = s; m.start = performance.now(); io.line('Serial.println(NAMES[s])'); io.print(`-> ${m.NAMES[s]}`); };
      const lights = (r, y, g, pr, pg) => {
        b.tl.set('red', r); b.tl.set('yellow', y); b.tl.set('green', g);
        if (pr) b.pr.on(); else b.pr.led.set(0);
        if (pg) b.pg.on(); else b.pg.led.set(0);
        [['D22', r], ['D24', y], ['D26', g], ['D28', pr], ['D30', pg]].forEach(([k, on]) => io.pin(k, on ? 'HIGH' : 'LOW', !!on));
      };
      const beep = (on) => {
        if (on === m.beeping) return;
        m.beeping = on;
        if (on) { io.tone(2500); b.bz.set(true, 2500); io.pin('D34', '2500 Hz', true); } else { io.noTone(); b.bz.set(false); io.pin('D34', 'LOW', false); }
      };
      const t = performance.now() - m.start;
      io.line('unsigned long t =');
      io.pin('D32', b.btn.pressed ? 'LOW' : 'HIGH', b.btn.pressed);
      if (b.btn.pressed && !m.requested) {
        m.requested = true;
        io.line('requested = true'); io.print('Button: wait for the green man');
      }
      switch (m.state) {
        case 0:
          io.line('case CARS_GO'); lights(0, 0, 1, 1, 0);
          if (m.requested && t >= p.green) enter(1);
          break;
        case 1:
          io.line('case CARS_SLOW'); lights(0, 1, 0, 1, 0);
          if (t >= 2000) enter(2);
          break;
        case 2:
          io.line('case ALL_RED'); lights(1, 0, 0, 1, 0);
          if (t >= 1000) enter(3);
          break;
        case 3:
          io.line('case WALK:'); lights(1, 0, 0, 0, 1);
          beep(t % 500 < 100);
          if (t >= p.walk) { beep(false); enter(4); }
          break;
        default:
          io.line('case WALK_ENDING'); lights(1, 0, 0, 0, Math.floor(t / 300) % 2 === 0);
          if (t >= 3000) { m.requested = false; enter(0); }
      }
      await io.delay(25);
    },
    reset(b, io) {
      ['red', 'yellow', 'green'].forEach((c) => b.tl.set(c, 0));
      b.pr.led.set(0); b.pg.led.set(0); b.bz.set(false); io?.noTone();
    },
  },

  // ------------------------------------------------------------------ I2C bus
  {
    id: 'i2c-bus', title: 'The I²C bus', icon: 'serial',
    thumb: () => { const o = makeOLED(v(0, 0, 0)); o.text(['I2C', '0x3C 0x68'], { y: 18, size: 2, align: 'center' }); return o.group; },
    view: { center: [5.8, 0.8, -0.2], size: 16.5 },
    build(ctx) {
      const bb = ctx.breadboard(...BBM);
      const { wSda, wScl } = i2cBus(ctx, bb, { sdaPin: 'D20', sclPin: 'D21', vccPin: '5V_2', gndPin: 'GND_4', sda: 14, scl: 16, vccCol: 2, gndCol: 3 });
      const rtc = ctx.add(makeRTC(v(12.6, 0, -6.1), { rotY: Math.PI / 2 }));
      const oled = ctx.add(makeOLED(v(10.6, 0, 4.6)));
      const rtcW = [
        ctx.wire(rtc.pin('SDA'), bb.hole(14, 'b'), 'blue', { lift: 1.2 }),
        ctx.wire(rtc.pin('SCL'), bb.hole(16, 'b'), 'yellow', { lift: 1.3 }),
        ctx.wire(rtc.pin('VCC'), bb.hole(20, 'top+'), 'red', { lift: 1.0 }),
        ctx.wire(rtc.pin('GND'), bb.hole(19, 'top-'), 'black', { lift: 0.9 }),
      ];
      const oledBus = [
        ctx.wire(oled.pin('SDA'), bb.hole(14, 'e'), 'blue', { lift: 1.3 }),
        ctx.wire(oled.pin('SCL'), bb.hole(16, 'e'), 'yellow', { lift: 1.1 }),
      ];
      ctx.wire(oled.pin('VCC'), bb.hole(9, 'bot+'), 'red', { lift: 1.0 });
      ctx.wire(oled.pin('GND'), bb.hole(8, 'bot-'), 'black', { lift: 0.9 });
      const state = { oledOn: true };
      ctx.interact(oled, {
        name: 'SSD1306 OLED · 0x3C', hint: 'Unplug it from the bus, then run the scanner again',
        controls: [{ type: 'toggle', label: 'Data wires connected', get: () => state.oledOn, set: (x) => { state.oledOn = x; oledBus.forEach((w) => { w.group.visible = x; }); if (!x) oled.clear(); } }],
        note: () => (state.oledOn ? 'On the bus at address 0x3C' : 'Disconnected — re-run the sketch to rescan'),
      });
      ctx.interact(rtc, { name: 'DS3231 RTC module', hint: 'Clock at 0x68 plus a 24C32 EEPROM at 0x57 on the same board' });
      ctx.anchor('rtc', rtc.anchor);
      ctx.anchor('oled', oled.anchor);
      ctx.anchor('sda', wSda.mid);
      ctx.anchor('scl', wScl.mid);
      ctx.anchor('bus', rtcW[0].mid);
      return { rtc, oled, state };
    },
    callouts: [
      { anchor: 'sda', x: 0.04, y: 0.17, icon: 'serial', title: 'SDA · pin 20', text: 'Data — shared by every device on the bus.' },
      { anchor: 'scl', x: 0.36, y: 0.12, icon: 'timer', title: 'SCL · pin 21', text: 'Clock, driven by the Mega (the controller).' },
      { anchor: 'rtc', x: 0.7, y: 0.17, icon: 'timer', title: 'DS3231 · 0x68', text: 'Its EEPROM chip answers at 0x57 too.' },
      { anchor: 'oled', x: 0.7, y: 0.68, icon: 'play', title: 'OLED · 0x3C', text: 'Click it to unplug it from the bus.' },
      { anchor: 'power', x: 0.04, y: 0.68, icon: 'plug', title: 'Two wires, many devices', text: 'Each device listens for its own 7-bit address.' },
    ],
    overview: {
      heading: 'The I²C bus',
      text: 'I²C needs just two wires — SDA (data) and SCL (clock) — for up to 127 devices. Each has a 7-bit address. A scanner tries every address and lists the ones that answer; then the sketch reads the clock and draws on the display over the same pair of wires.',
      features: [['serial', 'I²C scanner with <code>Wire.beginTransmission()</code>'], ['timer', '<code>RTClib</code> reads the DS3231 clock'], ['play', '<code>Adafruit_SSD1306</code> draws the time']],
    },
    pinout: [['D20 (SDA)', 'Breadboard SDA column', 'OLED SDA, RTC SDA'], ['D21 (SCL)', 'Breadboard SCL column', 'OLED SCL, RTC SCL'], ['5V', '+ rails', 'Both modules'], ['GND', '– rails', 'Both modules'], ['Pull-ups', 'On the modules', '4.7–10 kΩ to VCC']],
    example: {
      text: 'Phones and laptops use I²C inside for sensors, battery gauges and touch controllers. On the Mega, SDA/SCL also appear next to AREF — they’re the same two signals as pins 20 and 21.',
      points: ['Two devices with the same address can’t share a bus — many modules have a jumper to change it', 'Keep I²C wires short: it was designed for a single circuit board', 'The scanner is the first thing to run when a module “doesn’t work”'],
    },
    specs: [['Wires', 'SDA + SCL (+ power)'], ['Speed', '100 kHz standard, 400 kHz fast'], ['Addresses', '7-bit: 0x08–0x77 usable'], ['Found here', '0x3C OLED, 0x57 EEPROM, 0x68 RTC'], ['Libraries', 'Wire, RTClib, Adafruit_SSD1306 + GFX'], ['Mega pins', 'SDA = 20, SCL = 21']],
    quiz: [
      { q: "How does the scanner know a device is at an address?", options: ["It reads a voltage", "endTransmission() returns 0 when a device acknowledges (ACK)", "The device lights an LED", "It measures current"], answer: 1, explain: "A device pulls SDA low to acknowledge its address; endTransmission() reports that as 0." },
      { q: "Why does the scan find three addresses with only two modules plugged in?", options: ["A bug", "The RTC module also carries a 24C32 EEPROM chip at 0x57", "The Mega answers itself", "The OLED has two addresses"], answer: 1, explain: "Each chip on the bus has its own address — the clock board has two chips." },
      { q: "What do SDA and SCL stand for?", options: ["Serial Data and Serial Clock", "Signal Down and Signal Clear", "Send Data and Stop Clock", "Synchronous Data and Asynchronous Clock"], answer: 0, explain: "SDA carries the bits; SCL is the clock that says when each bit is valid." },
      { q: "Why does oled.display() exist — why not draw directly?", options: ["The library draws into a RAM buffer, then sends all 1024 bytes at once", "It turns the screen on", "It sets the address", "It clears the screen"], answer: 0, explain: "Drawing in RAM is fast; display() streams the whole frame over I²C." },
    ],
    challenges: ["Print the scanner results as a 16 × 8 grid like Linux’s i2cdetect.", "Show the RTC’s built-in temperature sensor on the second line.", "Add a third I²C device (e.g. an MPU6050 at 0x68) — what goes wrong, and how does its AD0 pin fix it?"],
    code: `#include <Wire.h>
#include <RTClib.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 oled(128, 64, &Wire, -1);  // 128x64, no reset pin
RTC_DS3231 rtc;

void scanBus() {
  Serial.println("Scanning I2C bus...");
  int found = 0;
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {  // 0 = a device answered (ACK)
      Serial.print("  device at 0x");
      if (addr < 16) Serial.print('0');
      Serial.println(addr, HEX);
      found++;
    }
  }
  Serial.print(found);
  Serial.println(" device(s) found");
}

void setup() {
  Serial.begin(9600);
  Wire.begin();                     // Mega: SDA = 20, SCL = 21
  scanBus();
  rtc.begin();
  if (rtc.lostPower()) rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) Serial.println("No OLED at 0x3C");
  oled.setTextColor(SSD1306_WHITE);
}

void loop() {
  DateTime now = rtc.now();         // reads 7 registers from 0x68
  char dateStr[11], timeStr[9];
  snprintf(dateStr, sizeof(dateStr), "%04d-%02d-%02d", now.year(), now.month(), now.day());
  snprintf(timeStr, sizeof(timeStr), "%02d:%02d:%02d", now.hour(), now.minute(), now.second());

  oled.clearDisplay();              // draw into RAM...
  oled.setTextSize(1);
  oled.setCursor(34, 8);
  oled.print(dateStr);
  oled.setTextSize(2);
  oled.setCursor(16, 30);
  oled.print(timeStr);
  oled.display();                   // ...then send it all to 0x3C
  Serial.println(timeStr);
  delay({{rate}});
}`,
    params: { rate: { value: 1000, min: 100, max: 5000 } },
    async setup(io, b) {
      b.oled.clear();
      io.line('Wire.begin'); await io.delay(100);
      io.line('scanBus();'); io.line('"Scanning I2C'); io.print('Scanning I2C bus...');
      const found = [...(b.state.oledOn ? [0x3c] : []), 0x57, 0x68];
      for (let addr = 1; addr < 127; addr += 8) {
        io.line('Wire.beginTransmission(addr)');
        io.pin('SDA', `0x${hex2(addr)}?`, true);
        io.pin('SCL', 'clock', true);
        await io.delay(30);
        for (const f of found) {
          if (f >= addr && f < addr + 8) {
            io.line('Serial.println(addr, HEX)'); io.print(`  device at 0x${hex2(f)}`);
            await io.delay(90);
          }
        }
      }
      io.line('Serial.print(found)'); io.print(`${found.length} device(s) found`);
      await io.delay(200);
      io.line('rtc.begin'); await io.delay(80);
      io.line('oled.begin');
      if (!b.state.oledOn) io.print('No OLED at 0x3C');
      await io.delay(80);
    },
    async loop(io, b, p) {
      io.line('rtc.now()'); io.pin('SDA', 'read 0x68', true);
      const d = new Date();
      const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      await io.delay(30);
      io.line('oled.clearDisplay');
      io.line('oled.display()'); io.pin('SDA', 'write 0x3C', true);
      if (b.state.oledOn) {
        b.oled.text([date], { x: 34, y: 8 });
        b.oled.text([time], { x: 16, y: 30, size: 2, clear: false });
      }
      io.line('Serial.println(timeStr)'); io.print(time);
      io.pin('SDA', 'idle', false);
      io.line('delay('); await io.delay(p.rate);
    },
    reset(b) { b.oled.clear(); },
  },

  // ------------------------------------------------------------------ SD logger
  {
    id: 'sd-logger', title: 'Data logger', icon: 'book',
    thumb: () => makeSDCard(v(0, 0, 0)).group,
    view: { center: [3.6, 0.7, -0.4], size: 15 },
    build(ctx) {
      const sd = ctx.add(makeSDCard(v(8.7, 0, 1.3)));
      const dht = ctx.add(makeDHT11(v(8.3, 0, -2.0)));
      const spi = [['MISO', 'D50', 'green'], ['MOSI', 'D51', 'blue'], ['SCK', 'D52', 'yellow'], ['CS', 'D53', 'orange']]
        .map(([pin, d, col]) => ctx.wire(ctx.board.pin(d), sd.pin(pin), col, { signal: d, lift: 1.0 }));
      ctx.wire(ctx.board.pin('5V_3'), sd.pin('VCC'), 'red', { signal: '5V', lift: 1.6 });
      ctx.wire(ctx.board.pin('GND_4'), sd.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.3 });
      const dw = ctx.wire(ctx.board.pin('D22'), dht.pin('DATA'), 'white', { signal: 'D22', lift: 1.0 });
      ctx.wire(ctx.board.pin('5V_2'), dht.pin('VCC'), 'red', { signal: '5V', lift: 0.9 });
      ctx.wire(ctx.board.pin('GND_5'), dht.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 2.0 });
      const state = { temp: 22, hum: 48, card: true, file: [] };
      ctx.interact(dht, {
        name: 'DHT11 sensor', hint: 'Warm it up or breathe on it',
        controls: [
          { type: 'range', label: 'Temperature', min: 0, max: 50, step: 1, get: () => state.temp, set: (x) => (state.temp = x), format: (x) => `${x} °C` },
          { type: 'range', label: 'Humidity', min: 20, max: 90, step: 1, get: () => state.hum, set: (x) => (state.hum = x), format: (x) => `${x} %` },
        ],
      });
      ctx.interact(sd, {
        name: 'Micro-SD module', hint: 'SPI: MISO, MOSI, SCK and chip-select (CS)',
        controls: [
          { type: 'toggle', label: 'Card inserted', get: () => state.card, set: (x) => (state.card = x) },
          { type: 'button', label: 'Format card (delete log.csv)', press: () => { state.file.length = 0; } },
        ],
        note: () => `log.csv: ${state.file.length} line${state.file.length === 1 ? '' : 's'}${state.card ? '' : ' · card removed!'}`,
      });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'temp °C', color: '#e5412e', min: 0, max: 50 }, { name: 'humidity %', color: '#3b78e7', min: 0, max: 100 }] });
      ctx.anchor('sd', sd.anchor);
      ctx.anchor('dht', dht.anchor);
      ctx.anchor('cs', spi[3].mid);
      ctx.anchor('spi', spi[1].mid);
      ctx.anchor('d22', dw.mid);
      return { sd, dht, state, plot };
    },
    callouts: [
      { anchor: 'd22', x: 0.04, y: 0.17, icon: 'thermo', title: 'DHT11 · pin 22', text: 'Temperature and humidity over one data wire.' },
      { anchor: 'spi', x: 0.36, y: 0.12, icon: 'serial', title: 'SPI · pins 50–52', text: 'MISO, MOSI and SCK: the Mega’s hardware SPI.' },
      { anchor: 'sd', x: 0.7, y: 0.17, icon: 'book', title: 'Micro-SD module', text: 'Click it to pull the card or wipe the log.' },
      { anchor: 'cs', x: 0.04, y: 0.68, icon: 'pins', title: 'CS · pin 53', text: 'Chip-select picks which SPI device is listening.' },
    ],
    overview: {
      heading: 'Data logger',
      text: 'Log readings to a micro-SD card as CSV — one line per reading — and open the file later in a spreadsheet. The card talks SPI: three shared wires plus a chip-select. Send <code>d</code> to dump the file to the serial monitor.',
      features: [['book', '<code>SD</code> library: open, append, close'], ['thermo', '<code>DHT</code> library reads temperature and humidity'], ['wave', 'The serial plotter graphs each CSV line']],
    },
    pinout: [['D50 (MISO)', 'SD MISO', 'Card → board'], ['D51 (MOSI)', 'SD MOSI', 'Board → card'], ['D52 (SCK)', 'SD SCK', 'Clock'], ['D53 (SS)', 'SD CS', 'Chip select'], ['5V / GND', 'SD VCC / GND', 'Module has a 3.3 V regulator + level shifter'], ['D22', 'DHT11 DATA', 'VCC 5 V, GND']],
    example: {
      text: 'Weather stations, beehive monitors, rocket flight recorders and fridge temperature loggers all write CSV to SD cards — simple, cheap and readable anywhere.',
      points: ['<code>FILE_WRITE</code> appends, so the log survives resets', '<code>close()</code> (or <code>flush()</code>) after each line — pulling the card loses anything unflushed', 'Format the card as FAT16/FAT32 and keep names to 8.3 characters'],
    },
    specs: [['Card', 'micro-SD(HC), FAT16/FAT32'], ['Bus', 'SPI, up to 8 MHz on a 16 MHz AVR'], ['Mega SPI pins', 'MISO 50, MOSI 51, SCK 52, SS 53'], ['Sensor', 'DHT11: 0–50 °C ±2 °C, 20–90 % RH ±5 %'], ['Log format', 'seconds,temp_c,humidity'], ['Libraries', 'SPI, SD, DHT sensor library']],
    quiz: [
      { q: "Which pin is unique to each SPI device?", options: ["MISO", "MOSI", "SCK", "CS (chip select)"], answer: 3, explain: "MISO, MOSI and SCK are shared; each device gets its own CS line, pulled LOW to select it." },
      { q: "Why close the file after every line?", options: ["To save RAM", "Data is only written to the card when the buffer is flushed — close() does that", "The SD library requires it", "To reset the card"], answer: 1, explain: "Unflushed data sits in a 512-byte RAM buffer and is lost on power cut or card removal." },
      { q: "What does FILE_WRITE do if log.csv already exists?", options: ["Deletes it", "Appends to the end", "Fails", "Renames it"], answer: 1, explain: "In the Arduino SD library, FILE_WRITE opens for writing and positions at the end of the file." },
      { q: "Why does the sketch write a header line only when the file size is 0?", options: ["To save space", "So the column names appear once at the top, not after every reset", "Headers are required by SD", "To test the card"], answer: 1, explain: "Spreadsheets expect one header row at the top." },
    ],
    challenges: ["Add a DS3231 RTC (lesson 8) and log real dates and times instead of seconds.", "Start a new file each day, named like 20261102.csv.", "Light an LED while writing and blink it fast if the card is missing."],
    code: `#include <SPI.h>
#include <SD.h>
#include <DHT.h>

const int SD_CS = 53;             // the Mega's hardware SS pin
DHT dht(22, DHT11);
const unsigned long INTERVAL = {{interval}};  // ms between readings
unsigned long lastLog = 0;

void dumpFile() {
  File f = SD.open("log.csv");
  while (f && f.available()) Serial.write(f.read());
  f.close();
}

void setup() {
  Serial.begin(9600);
  dht.begin();
  if (!SD.begin(SD_CS)) {
    Serial.println("SD card failed or missing!");
    while (true) {}               // stop here
  }
  File f = SD.open("log.csv", FILE_WRITE);
  if (f && f.size() == 0) f.println("seconds,temp_c,humidity");
  f.close();
  Serial.println("Logging to log.csv (send d to dump it)");
}

void loop() {
  if (Serial.available() && Serial.read() == 'd') dumpFile();

  if (millis() - lastLog >= INTERVAL) {
    lastLog = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (isnan(t) || isnan(h)) return;          // bad read: try again later
    String line = String(lastLog / 1000) + "," + String(t, 1) + "," + String(h, 0);
    File f = SD.open("log.csv", FILE_WRITE);   // FILE_WRITE appends
    if (f) {
      f.println(line);
      f.close();                               // flush to the card
      Serial.println(line);
    } else {
      Serial.println("Write failed");
    }
  }
}`,
    params: { interval: { value: 2000, min: 1000, max: 10000 } },
    async setup(io, b) {
      const s = b.state;
      s.t0 = performance.now(); s.last = 0; s.dead = false; s.ok = s.card;
      b.plot.reset();
      io.line('dht.begin'); await io.delay(80);
      io.line('SD.begin'); io.pin('D53', 'LOW (select)', true); await io.delay(250); io.pin('D53', 'HIGH', false);
      if (!s.card) {
        io.line('"SD card failed'); io.print('SD card failed or missing!');
        io.line('while (true)'); s.dead = true; return;
      }
      io.line('FILE_WRITE);'); await io.delay(60);
      if (s.file.length === 0) { io.line('f.size() == 0'); s.file.push('seconds,temp_c,humidity'); }
      io.line('f.close();', 2); await io.delay(60);
      io.line('"Logging to'); io.print('Logging to log.csv (send d to dump it)');
    },
    async loop(io, b, p) {
      const s = b.state;
      if (s.dead) { await io.delay(500); return; }
      const cmd = io.readLine();
      if (cmd !== null && cmd.trim().startsWith('d')) {
        io.line('dumpFile();');
        io.line('Serial.write(f.read())');
        if (s.ok && s.card) for (const l of s.file) { io.print(l); await io.delay(20); }
      }
      const now = performance.now() - s.t0;
      if (now - s.last >= p.interval) {
        s.last = now;
        io.line('lastLog = millis()');
        io.line('readTemperature'); io.pin('D22', 'DHT read', true); await io.delay(40);
        const t = Math.round(s.temp + (Math.random() - 0.5) * 0.8);
        const h = Math.round(s.hum + (Math.random() - 0.5) * 2);
        io.pin('D22', `${t} °C`, false);
        io.line('String line');
        const line = `${Math.floor(s.last / 1000)},${t.toFixed(1)},${h}`;
        io.line('FILE_WRITE);   //');
        if (!s.card) s.ok = false; // the library doesn't recover until SD.begin() runs again
        if (s.ok) {
          io.line('f.println(line)'); io.pin('D51', 'MOSI data', true); io.pin('D52', 'SCK', true); io.pin('D53', 'LOW (select)', true);
          s.file.push(line);
          await io.delay(80);
          io.line('f.close();   '); io.pin('D51', 'idle', false); io.pin('D52', 'idle', false); io.pin('D53', 'HIGH', false);
          io.line('Serial.println(line)'); io.print(line);
          b.plot.push(t, h);
        } else {
          io.line('"Write failed"'); io.print('Write failed');
        }
      }
      await io.delay(50);
    },
    reset() {},
    serialInput: { placeholder: 'd = dump log.csv' },
  },

  // ------------------------------------------------------------------ EEPROM
  {
    id: 'eeprom', title: 'Remember settings', icon: 'heart',
    thumb: () => { const l = makeLED('yellow', v(0.13, 0, 0), v(-0.13, 0, 0)); l.set(1); return l.group; },
    view: { center: [4.4, 0.6, -0.6], size: 17 },
    build(ctx) {
      const bb = ctx.breadboard(...BBM);
      const c = ledOnPin(ctx, bb, { pin: 'D9', col: 4, color: 'yellow' });
      const m = buttonAt(ctx, bb, 15, 'D2', 'GND_2', 'green', 0x3aa65a);
      const br = buttonAt(ctx, bb, 22, 'D3', 'GND_3', 'orange', 0xf2c230);
      ctx.interact(m.btn, { name: 'MODE button (pin 2)', hint: 'Steady → blink → breathe', hold: { down: () => m.btn.press(true), up: () => m.btn.press(false) } });
      ctx.interact(br.btn, { name: 'BRIGHT button (pin 3)', hint: 'Steps the brightness up', hold: { down: () => br.btn.press(true), up: () => br.btn.press(false) } });
      const state = { ee: [0xff, 0xff, 0xff], writes: 0, req: null };
      // invisible hit target over the board's reset button
      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      hit.position.copy(ctx.board.anchors.reset);
      ctx.addObject(hit);
      ctx.interact({ pick: hit, group: hit }, {
        name: 'RESET button', hint: 'Restart the board — RAM is wiped, EEPROM is not',
        controls: [
          { type: 'button', label: 'Press RESET', press: () => (state.req = 'reset') },
          { type: 'button', label: 'Unplug and replug USB', press: () => (state.req = 'power') },
          { type: 'button', label: 'Erase EEPROM (fresh chip)', press: () => { state.ee = [0xff, 0xff, 0xff]; state.writes += 3; } },
        ],
        note: () => `EEPROM[0..2] = ${state.ee.map(hex2).join(' ')} · ${state.writes} byte write${state.writes === 1 ? '' : 's'} so far`,
      });
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('mode', m.btn.anchor);
      ctx.anchor('bright', br.btn.anchor);
      return { ...c, mode: m.btn, bright: br.btn, state, cfg: {} };
    },
    callouts: [
      { anchor: 'reset', x: 0.04, y: 0.17, icon: 'info', title: 'RESET', text: 'Click it: RAM is wiped, EEPROM keeps your settings.' },
      { anchor: 'chip', x: 0.36, y: 0.12, icon: 'chip', title: '4 KB EEPROM', text: 'Inside the ATmega2560, next to flash and RAM.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'LED · pin ~9', text: 'Shows the saved brightness and mode.' },
      { anchor: 'mode', x: 0.04, y: 0.68, icon: 'hand', title: 'MODE · pin 2', text: 'Steady, blink or breathe.' },
      { anchor: 'bright', x: 0.7, y: 0.68, icon: 'hand', title: 'BRIGHT · pin 3', text: 'Each press is saved straight away.' },
    ],
    overview: {
      heading: 'Remember settings',
      text: 'Variables live in RAM and vanish at every reset. The chip’s EEPROM keeps data with the power off. <code>EEPROM.put()</code> and <code>get()</code> save and load a whole <code>struct</code>, and a “magic” byte tells a blank chip from saved settings.',
      features: [['heart', '<code>EEPROM.put()</code> / <code>get()</code> a struct'], ['info', 'Click the board’s RESET button to test it'], ['code', 'A magic byte detects the very first run']],
    },
    pinout: [['D9 ~', '220 Ω → LED', 'PWM brightness'], ['D2', 'MODE button → GND', 'INPUT_PULLUP'], ['D3', 'BRIGHT button → GND', 'INPUT_PULLUP'], ['EEPROM', 'Addresses 0–2', 'magic, brightness, mode']],
    example: {
      text: 'Thermostats remember their set-point, 3D printers their calibration, and remote-control receivers their paired codes — all in EEPROM or flash that survives a power cut.',
      points: ['Uploading a new sketch does not erase the EEPROM on these boards', 'EEPROM cells last ≈ 100,000 writes: <code>put()</code> skips bytes that haven’t changed', 'Bump <code>MAGIC</code> when you change the struct so old data is ignored'],
    },
    specs: [['Mega EEPROM', '4096 bytes'], ['Uno / Nano EEPROM', '1024 bytes'], ['Endurance', '≈ 100,000 writes per cell'], ['Write time', '≈ 3.3 ms per byte'], ['Retention', '20+ years'], ['Blank value', '0xFF']],
    quiz: [
      { q: "What happens to normal variables when you press reset?", options: ["They keep their values", "They go back to their starting values — RAM is cleared", "They move to EEPROM", "They become 0xFF"], answer: 1, explain: "RAM is volatile and the sketch restarts from scratch; only EEPROM (and flash) keep data." },
      { q: "What does a blank EEPROM byte read as?", options: ["0x00", "0xFF", "Random", "0x42"], answer: 1, explain: "Erased EEPROM cells read 0xFF — which is why the magic byte check works." },
      { q: "Why use EEPROM.put() rather than writing every byte each time?", options: ["It’s shorter to type", "put() only writes bytes that changed, saving wear on the ≈100k-cycle cells", "put() is the only way to write", "It erases the chip first"], answer: 1, explain: "put() uses update() internally, comparing before writing." },
      { q: "Why would saving inside loop() on every pass be a bad idea?", options: ["It’s too slow to notice", "It would wear the EEPROM out in minutes", "EEPROM is read-only", "It resets the board"], answer: 1, explain: "Thousands of writes per second would hit the ~100,000 limit very quickly. Save only when something changes." },
    ],
    challenges: ["Add a fourth mode (e.g. SOS) and keep it saved.", "Count how many times the board has been switched on and print it at start-up.", "Add a ‘factory reset’: hold both buttons at power-up to restore the defaults."],
    code: `#include <EEPROM.h>

struct Settings {
  byte magic;          // marks the EEPROM as holding our data
  byte brightness;     // 0-255
  byte mode;           // 0 steady, 1 blink, 2 breathe
};

const byte MAGIC = 0x42;
const int LED = 9, MODE_BTN = 2, BRIGHT_BTN = 3;
const char* const MODES[] = {"steady", "blink", "breathe"};
Settings cfg;                     // lives in RAM

void save() {
  EEPROM.put(0, cfg);             // writes only the bytes that changed
  Serial.print("Saved: brightness ");
  Serial.print(cfg.brightness);
  Serial.print(", mode ");
  Serial.println(MODES[cfg.mode]);
}

void setup() {
  pinMode(LED, OUTPUT);
  pinMode(MODE_BTN, INPUT_PULLUP);
  pinMode(BRIGHT_BTN, INPUT_PULLUP);
  Serial.begin(9600);
  EEPROM.get(0, cfg);             // load whatever is stored
  if (cfg.magic != MAGIC) {       // blank chip: bytes read 0xFF
    Serial.println("First run: saving defaults");
    cfg = {MAGIC, {{bright}}, 0};
    save();
  }
  Serial.print("Loaded: brightness ");
  Serial.print(cfg.brightness);
  Serial.print(", mode ");
  Serial.println(MODES[cfg.mode]);
}

void loop() {
  if (digitalRead(MODE_BTN) == LOW) {
    cfg.mode = (cfg.mode + 1) % 3;
    save();
    while (digitalRead(MODE_BTN) == LOW) {}   // wait for release
    delay(30);
  }
  if (digitalRead(BRIGHT_BTN) == LOW) {
    cfg.brightness = cfg.brightness >= 255 ? 15 : min(255, cfg.brightness + 60);
    save();
    while (digitalRead(BRIGHT_BTN) == LOW) {}
    delay(30);
  }
  unsigned long t = millis();
  int level = cfg.brightness;
  if (cfg.mode == 1 && (t / 500) % 2) level = 0;              // blink
  if (cfg.mode == 2) level = level * (1 + sin(t / 400.0)) / 2;  // breathe
  analogWrite(LED, level);
}`,
    params: { bright: { value: 135, min: 0, max: 255 } },
    async setup(io, b, p) {
      b.state.req = null;
      await this.boot(io, b, p);
    },
    async boot(io, b, p) {
      const s = b.state;
      const MODES = ['steady', 'blink', 'breathe'];
      b.led.set(0); io.pin('D9', 'LOW', false);
      io.line('pinMode(LED'); await io.delay(60);
      io.line('pinMode(BRIGHT_BTN'); await io.delay(60);
      io.line('EEPROM.get'); await io.delay(80);
      b.cfg = { magic: s.ee[0], brightness: s.ee[1], mode: s.ee[2] };
      if (b.cfg.magic !== 0x42) {
        io.line('cfg.magic != MAGIC');
        io.print(`EEPROM reads ${s.ee.map(hex2).join(' ')} → no saved settings`);
        io.line('"First run'); io.print('First run: saving defaults');
        b.cfg = { magic: 0x42, brightness: p.bright, mode: 0 };
        this.save(io, b);
        await io.delay(60);
      }
      if (b.cfg.mode > 2) b.cfg.mode = 0;
      io.line('"Loaded: brightness'); io.print(`Loaded: brightness ${b.cfg.brightness}, mode ${MODES[b.cfg.mode]}`);
    },
    save(io, b) {
      const s = b.state;
      const next = [b.cfg.magic, b.cfg.brightness, b.cfg.mode];
      io.line('EEPROM.put');
      next.forEach((x, i) => { if (s.ee[i] !== x) { s.ee[i] = x; s.writes++; } });
      io.line('Serial.println(MODES[cfg.mode])', 1);
      io.print(`Saved: brightness ${b.cfg.brightness}, mode ${['steady', 'blink', 'breathe'][b.cfg.mode]}`);
    },
    async loop(io, b, p) {
      const s = b.state;
      if (s.req) {
        const kind = s.req;
        s.req = null;
        io.print(kind === 'power' ? '— USB unplugged … and plugged back in —' : '— RESET pressed: the sketch restarts —');
        b.led.set(0); io.pin('D9', 'LOW', false);
        await io.delay(kind === 'power' ? 900 : 500);
        await this.boot(io, b, p);
        return;
      }
      const waitRelease = async (btn) => { io.line('while (digitalRead'); while (btn.pressed && !s.req) await io.delay(20); };
      if (b.mode.pressed) {
        io.pin('D2', 'LOW', true);
        io.line('cfg.mode = (cfg.mode + 1) % 3'); b.cfg.mode = (b.cfg.mode + 1) % 3;
        this.save(io, b);
        await waitRelease(b.mode); io.pin('D2', 'HIGH', false);
        await io.delay(30);
      }
      if (b.bright.pressed) {
        io.pin('D3', 'LOW', true);
        io.line('cfg.brightness = cfg.brightness');
        b.cfg.brightness = b.cfg.brightness >= 255 ? 15 : Math.min(255, b.cfg.brightness + 60);
        this.save(io, b);
        await waitRelease(b.bright); io.pin('D3', 'HIGH', false);
        await io.delay(30);
      }
      const t = performance.now();
      let level = b.cfg.brightness;
      if (b.cfg.mode === 1 && Math.floor(t / 500) % 2) level = 0;
      if (b.cfg.mode === 2) level = Math.trunc((level * (1 + Math.sin(t / 400))) / 2);
      io.line('analogWrite(LED, level)');
      b.on(level / 255);
      io.pin('D9', `PWM ${level}`, level > 0);
      await io.delay(30);
    },
    reset(b) { b.led.set(0); b.state.req = null; },
  },

  // ------------------------------------------------------------------ multi serial
  {
    id: 'mega-multi-serial', title: 'Many serial ports', icon: 'serial',
    thumb: () => makeHC05(v(0, 0, 0)).group,
    view: { center: [4.6, 0.7, -2.0], size: 16 },
    build(ctx) {
      const bb = ctx.breadboard(...BBM);
      const hc = ctx.add(makeHC05(v(9.4, 0, -5.4)));
      const r1 = ctx.add(makeResistor(bb.hole(4, 'c'), bb.hole(8, 'c'), 1000));
      const r2 = ctx.add(makeResistor(bb.hole(8, 'd'), bb.hole(12, 'd'), 2000));
      const tx = ctx.wire(ctx.board.pin('D18'), bb.hole(4, 'a'), 'orange', { signal: 'D18', lift: 1.4 });
      ctx.wire(bb.hole(8, 'a'), hc.pin('RXD'), 'orange', { lift: 1.2 });
      const rx = ctx.wire(hc.pin('TXD'), ctx.board.pin('D19'), 'green', { signal: 'D19', dir: 1, lift: 1.8 });
      const st = ctx.wire(hc.pin('STATE'), ctx.board.pin('D22'), 'purple', { signal: 'D22', lift: 1.4 });
      ctx.wire(ctx.board.pin('5V_3'), hc.pin('VCC'), 'red', { signal: '5V', lift: 1.0 });
      ctx.wire(ctx.board.pin('GND'), bb.hole(2, 'top-'), 'black', { signal: 'GND', dir: -1 });
      ctx.wire(bb.hole(12, 'b'), bb.hole(11, 'top-'), 'black', { lift: 0.5 });
      ctx.wire(hc.pin('GND'), bb.hole(16, 'top-'), 'black', { lift: 1.0 });
      // makeHC05's `linked` getter is a snapshot, so keep the pairing state here
      const state = { rx: [], phone: [], linked: true };
      hc.setLinked(true);
      const say = (who, text) => { state.phone.push([who, text]); if (state.phone.length > 7) state.phone.shift(); };
      const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      const phone = ctx.browser({
        url: 'Bluetooth terminal · HC-05',
        title: 'Phone',
        render: () => `<h5>${state.linked ? 'Connected to HC-05' : 'Not connected'}</h5>
          <div class="muted" style="min-height:7.5em;font-family:var(--mono,monospace);font-size:12px;line-height:1.5">${state.phone.map(([w, t]) => `<div>${w === 'me' ? '&gt; ' : w === 'pc' ? 'PC: ' : '&lt; '}${esc(t)}</div>`).join('') || 'No messages yet'}</div>
          <div class="row"><button class="on" data-action="send" data-value="on">on</button><button class="off" data-action="send" data-value="off">off</button><button data-action="send" data-value="uptime">uptime</button></div>`,
        onAction: (a, val) => {
          if (a !== 'send') return;
          if (!state.linked) { say('sys', 'Pair with the HC-05 first'); return; }
          say('me', val);
          state.rx.push(val);
        },
      });
      ctx.interact(hc, {
        name: 'HC-05 Bluetooth', hint: 'A serial port without wires: whatever the phone sends comes out of TXD',
        controls: [{ type: 'toggle', label: 'Phone paired', get: () => state.linked, set: (x) => { state.linked = x; hc.setLinked(x); phone.update(); } }],
        note: () => (state.linked ? 'Linked: LED steady, STATE pin HIGH' : 'Waiting: LED blinks fast, STATE pin LOW'),
      });
      ctx.interact(r2, { name: '2 kΩ resistor', hint: 'With the 1 kΩ it divides 5 V down to ≈ 3.3 V for the HC-05’s RXD' });
      ctx.anchor('hc', hc.anchor);
      ctx.anchor('tx', tx.mid);
      ctx.anchor('rx', rx.mid);
      ctx.anchor('div', r1.anchor);
      ctx.anchor('state', st.mid);
      return { hc, state, say, phone };
    },
    callouts: [
      { anchor: 'usb', x: 0.04, y: 0.17, icon: 'usb', title: 'Serial (USB)', text: 'Pins 0/1 go to the computer: your log and serial monitor.' },
      { anchor: 'tx', x: 0.36, y: 0.12, icon: 'serial', title: 'Serial1 · pins 18/19', text: 'TX1 → divider → RXD; TXD → RX1.' },
      { anchor: 'hc', x: 0.7, y: 0.17, icon: 'globe', title: 'HC-05 Bluetooth', text: 'Click it to pair or unpair the phone.' },
      { anchor: 'div', x: 0.04, y: 0.68, icon: 'resistor', title: '1 kΩ / 2 kΩ divider', text: 'The HC-05 RX pin is 3.3 V only.' },
    ],
    overview: {
      heading: 'Many serial ports',
      text: 'The Mega has four hardware UARTs. <code>Serial</code> stays on USB for your log, while <code>Serial1</code> (pins 18/19) talks to an HC-05 Bluetooth module — so a phone can send commands as the computer watches. Type in the serial monitor to reply to the phone.',
      features: [['serial', '<code>Serial</code>, <code>Serial1</code>, <code>Serial2</code>, <code>Serial3</code> all at once'], ['globe', 'Use the phone panel to send <code>on</code> / <code>off</code>'], ['resistor', 'A divider protects the 3.3 V input']],
    },
    pinout: [['D18 (TX1)', '1 kΩ → HC-05 RXD', '2 kΩ from RXD to GND'], ['D19 (RX1)', 'HC-05 TXD', '3.3 V is a valid HIGH'], ['D22', 'HC-05 STATE', 'HIGH while connected'], ['5V', 'HC-05 VCC', 'On-board 3.3 V regulator'], ['GND', 'HC-05 GND, divider', '']],
    example: {
      text: 'Robots stream telemetry over Bluetooth while logging over USB; GPS receivers, fingerprint sensors and other microcontrollers all speak serial too — the Mega can listen to four of them at once without SoftwareSerial.',
      points: ['Pair from the phone with PIN 1234 (or 0000), then use any Bluetooth serial terminal app', 'The HC-05 talks at 9600 baud by default in data mode', 'On an Uno you’d need SoftwareSerial, which is slower and blocks interrupts'],
    },
    specs: [['Mega UARTs', 'Serial (0/1, USB), Serial1 (19/18), Serial2 (17/16), Serial3 (15/14)'], ['HC-05', 'Bluetooth 2.0 SPP, classic (not BLE)'], ['Default baud', '9600 (data mode)'], ['Range', '≈ 10 m'], ['Logic', '3.3 V (RXD needs a divider)'], ['Divider output', '5 V × 2k / (1k + 2k) ≈ 3.3 V']],
    quiz: [
      { q: "Which pins does Serial1 use on the Mega?", options: ["0 and 1", "18 (TX1) and 19 (RX1)", "20 and 21", "50 and 51"], answer: 1, explain: "Serial1 is on 18/19; 0/1 belong to Serial, which shares the USB link." },
      { q: "Why the 1 kΩ / 2 kΩ divider on the HC-05’s RXD?", options: ["To slow the data", "To drop the Mega’s 5 V TX signal to about 3.3 V", "To power the module", "It’s a pull-up"], answer: 1, explain: "The HC-05’s RX pin is not 5 V tolerant: 5 × 2/3 ≈ 3.3 V." },
      { q: "TX of one device connects to…", options: ["TX of the other", "RX of the other", "GND", "VCC"], answer: 1, explain: "What one side transmits, the other receives — the lines cross over." },
      { q: "Why is the phone’s command echoed to Serial as well as answered on Serial1?", options: ["It has to be", "So you can log and debug on the computer while the phone gets its reply", "Bluetooth needs it", "To slow it down"], answer: 1, explain: "Separate ports let one carry debugging output without disturbing the other link." },
    ],
    challenges: ["Add a ‘temp’ command that replies with an analog reading from a TMP36.", "Put a GPS module on Serial2 and forward its sentences to the phone.", "Send a message to the phone whenever a button is pressed."],
    code: `const int STATE_PIN = 22;          // HC-05 STATE: HIGH while paired
const int LED = 13;
bool linked = false;
String fromPhone = "";

void setup() {
  Serial.begin(9600);             // USB: the computer
  Serial1.begin(9600);            // pins 18/19: the HC-05
  pinMode(STATE_PIN, INPUT);
  pinMode(LED, OUTPUT);
  Serial.println("Bridge ready");
}

void handle(String cmd) {
  cmd.trim();
  Serial.print("[BT] ");
  Serial.println(cmd);            // log every command on USB
  if (cmd == "on") {
    digitalWrite(LED, HIGH);
    Serial1.println("LED is on");
  } else if (cmd == "off") {
    digitalWrite(LED, LOW);
    Serial1.println("LED is off");
  } else if (cmd == "uptime") {
    Serial1.print("Up ");
    Serial1.print(millis() / 1000);
    Serial1.println(" s");
  } else {
    Serial1.println("Try: on, off, uptime");
  }
}

void loop() {
  bool now = digitalRead(STATE_PIN);
  if (now != linked) {
    linked = now;
    Serial.println(linked ? "Phone connected" : "Phone disconnected");
  }
  while (Serial1.available()) {   // bytes from the phone
    char c = Serial1.read();
    if (c == '\\n') { handle(fromPhone); fromPhone = ""; }
    else fromPhone += c;
  }
  while (Serial.available()) {    // typed in the serial monitor...
    Serial1.write(Serial.read()); // ...goes straight to the phone
  }
}`,
    params: {},
    async setup(io, b) {
      b.t0 = performance.now(); b.linked = false;
      io.line('Serial.begin'); await io.delay(80);
      io.line('Serial1.begin'); await io.delay(80);
      io.line('"Bridge ready"'); io.print('Bridge ready');
      b.say('sys', 'Bridge ready'); b.phone.update();
    },
    async loop(io, b) {
      io.line('bool now = digitalRead');
      const linked = b.state.linked;
      io.pin('D22', linked ? 'HIGH' : 'LOW', linked);
      if (linked !== b.linked) {
        b.linked = linked;
        io.line('"Phone connected"'); io.print(linked ? 'Phone connected' : 'Phone disconnected');
      }
      const cmd = b.state.rx.shift();
      if (cmd !== undefined) {
        io.line('Serial1.available'); io.pin('D19', `"${cmd}"`, true);
        await io.delay(40);
        io.line('handle(fromPhone)');
        io.line('Serial.println(cmd)'); io.print(`[BT] ${cmd}`);
        let reply;
        if (cmd === 'on') { io.line('Serial1.println("LED is on")'); io.board.setBuiltinLed(1); reply = 'LED is on'; }
        else if (cmd === 'off') { io.line('Serial1.println("LED is off")'); io.board.setBuiltinLed(0); reply = 'LED is off'; }
        else if (cmd === 'uptime') { io.line('Serial1.print(millis()'); reply = `Up ${Math.floor((performance.now() - b.t0) / 1000)} s`; }
        else { io.line('"Try: on'); reply = 'Try: on, off, uptime'; }
        io.pin('D18', `"${reply}"`, true);
        b.say('board', reply); b.phone.update();
        await io.delay(40);
        io.pin('D19', 'idle', false); io.pin('D18', 'idle', false);
      }
      const typed = io.readLine();
      if (typed !== null) {
        io.line('Serial1.write(Serial.read())'); io.pin('D18', `"${typed}"`, true);
        if (b.state.linked) b.say('pc', typed); else io.print('(nobody is paired, so the bytes go nowhere)');
        b.phone.update();
        await io.delay(40);
        io.pin('D18', 'idle', false);
      }
      await io.delay(30);
    },
    reset(b, io) { io?.board.setBuiltinLed(0); b.state.rx.length = 0; },
    serialInput: { placeholder: 'Message for the phone' },
  },

  // ------------------------------------------------------------------ Nano clock
  {
    id: 'nano-clock', title: 'Nano desk clock', icon: 'timer', board: 'nano',
    thumb: () => { const r = makeRTC(v(0, 0, 0)); return r.group; },
    view: { center: [4.6, 0.6, -0.2], size: 15.5 },
    build(ctx) {
      const bb = ctx.breadboard(...BBN);
      const { wSda, wScl } = i2cBus(ctx, bb, { sdaPin: 'A4', sclPin: 'A5', vccPin: '5V', gndPin: 'GND_2' });
      const rtc = ctx.add(makeRTC(v(9.8, 0, -5.5), { rotY: Math.PI / 2 }));
      const oled = ctx.add(makeOLED(v(7.4, 0, 5.0), { yellowTop: true }));
      const rw = ctx.wire(rtc.pin('SDA'), bb.hole(10, 'b'), 'blue', { lift: 1.2 });
      ctx.wire(rtc.pin('SCL'), bb.hole(12, 'b'), 'yellow', { lift: 1.3 });
      ctx.wire(rtc.pin('VCC'), bb.hole(17, 'top+'), 'red', { lift: 1.0 });
      ctx.wire(rtc.pin('GND'), bb.hole(16, 'top-'), 'black', { lift: 0.9 });
      ctx.wire(oled.pin('SDA'), bb.hole(10, 'e'), 'blue', { lift: 1.3 });
      ctx.wire(oled.pin('SCL'), bb.hole(12, 'e'), 'yellow', { lift: 1.1 });
      ctx.wire(oled.pin('VCC'), bb.hole(15, 'bot+'), 'red', { lift: 1.0 });
      ctx.wire(oled.pin('GND'), bb.hole(14, 'bot-'), 'black', { lift: 0.9 });
      const state = { temp: 21.5 };
      ctx.interact(rtc, {
        name: 'DS3231 RTC', hint: 'A temperature-compensated clock with a coin-cell backup',
        controls: [{ type: 'range', label: 'Room temperature', min: 0, max: 40, step: 0.25, get: () => state.temp, set: (x) => (state.temp = x), format: (x) => `${Number(x).toFixed(2)} °C` }],
        note: () => 'The DS3231 measures its own temperature to correct its crystal (±2 ppm ≈ 1 minute a year).',
      });
      ctx.interact(oled, { name: '0.96″ OLED', hint: 'Two-colour SSD1306: the top 16 rows are yellow' });
      ctx.anchor('rtc', rtc.anchor);
      ctx.anchor('oled', oled.anchor);
      ctx.anchor('sda', wSda.mid);
      ctx.anchor('scl', wScl.mid);
      ctx.anchor('rw', rw.mid);
      return { rtc, oled, state };
    },
    callouts: [
      { anchor: 'chip', x: 0.04, y: 0.17, icon: 'chip', title: 'Nano-style board', text: 'Same ATmega328P as the Uno, on a breadboard-friendly stick.' },
      { anchor: 'sda', x: 0.36, y: 0.12, icon: 'serial', title: 'A4 = SDA, A5 = SCL', text: 'The Nano’s I²C pins, shared by both modules.' },
      { anchor: 'rtc', x: 0.7, y: 0.17, icon: 'timer', title: 'DS3231 RTC', text: 'Keeps time on its coin cell. Click it to change the room temperature.' },
      { anchor: 'oled', x: 0.7, y: 0.68, icon: 'play', title: 'OLED', text: 'Date in the yellow band, big time, temperature.' },
    ],
    overview: {
      heading: 'Nano desk clock',
      text: 'A Nano, a DS3231 real-time clock and an OLED make a complete desk clock. The RTC keeps counting on its coin cell when the power is off, and even reports the temperature. Both modules share the Nano’s I²C pins A4 and A5.',
      features: [['timer', '<code>RTClib</code>: date, time and temperature'], ['play', '<code>Adafruit_SSD1306</code> text in three sizes'], ['chip', 'Nano: an Uno in a tiny package']],
    },
    pinout: [['A4 (SDA)', 'SDA column → RTC + OLED', ''], ['A5 (SCL)', 'SCL column → RTC + OLED', ''], ['5V', '+ rails', ''], ['GND', '– rails', '']],
    example: {
      text: 'Alarm clocks, data loggers, timed plant waterers and bedside lamps that dim at night all use an RTC — the microcontroller’s own millis() drifts and resets every time the power goes.',
      points: ['<code>rtc.adjust()</code> sets the clock from your computer’s time when the sketch is compiled', 'It runs only when the RTC has lost power, so the time isn’t reset at every boot', 'Try 12-hour time: <code>now.twelveHour()</code> and <code>now.isPM()</code>'],
    },
    specs: [['RTC', 'DS3231, ±2 ppm (≈ ±1 min/year)'], ['Backup', 'CR2032 coin cell, years of timekeeping'], ['Temperature', '±3 °C, 0.25 °C steps'], ['Display', '128 × 64 SSD1306, two-colour'], ['Board', 'Nano-style, ATmega328P, 5 V'], ['Libraries', 'Wire, RTClib, Adafruit_SSD1306 + GFX']],
    quiz: [
      { q: "Which Nano pins carry I²C?", options: ["D2 and D3", "A4 (SDA) and A5 (SCL)", "D11 and D13", "A6 and A7"], answer: 1, explain: "Like the Uno, the Nano’s hardware I²C is on A4/A5." },
      { q: "Why use an RTC instead of millis()?", options: ["millis() can’t count seconds", "millis() restarts at every reset and drifts; the RTC keeps accurate time on battery", "RTCs are faster", "OLEDs need an RTC"], answer: 1, explain: "The DS3231 keeps calendar time through power cuts and is far more accurate than the board’s resonator." },
      { q: "When does this sketch set the RTC’s time?", options: ["Every time it starts", "Only if rtc.lostPower() says the clock stopped", "Never", "Every hour"], answer: 1, explain: "Otherwise every reset would wind the clock back to the compile time." },
    ],
    challenges: ["Show 12-hour time with AM/PM.", "Add a buzzer alarm at a set time, with a button to snooze.", "Dim the display between 22:00 and 07:00 using oled.dim(true)."],
    code: `#include <Wire.h>
#include <RTClib.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 oled(128, 64, &Wire, -1);
RTC_DS3231 rtc;
const char* const DAYS[] = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};

void setup() {
  Serial.begin(9600);
  if (!rtc.begin()) {
    Serial.println("RTC not found");
    while (true) {}
  }
  if (rtc.lostPower()) {          // first use or flat coin cell
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    Serial.println("RTC set to the compile time");
  }
  oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  oled.setTextColor(SSD1306_WHITE);
}

void loop() {
  DateTime now = rtc.now();
  float temp = rtc.getTemperature();
  char timeStr[9], dateStr[16];
  snprintf(timeStr, sizeof(timeStr), "%02d:%02d:%02d", now.hour(), now.minute(), now.second());
  snprintf(dateStr, sizeof(dateStr), "%s %02d/%02d/%04d", DAYS[now.dayOfTheWeek()], now.day(), now.month(), now.year());

  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setCursor(22, 4);          // yellow band
  oled.print(dateStr);
  oled.setTextSize(2);
  oled.setCursor(16, 26);
  oled.print(timeStr);
  oled.setTextSize(1);
  oled.setCursor(46, 52);
  oled.print(temp, 1);
  oled.print(" C");
  oled.display();

  Serial.print(dateStr);
  Serial.print("  ");
  Serial.print(timeStr);
  Serial.print("  ");
  Serial.print(temp, 1);
  Serial.println(" C");
  delay({{refresh}});
}`,
    params: { refresh: { value: 1000, min: 200, max: 10000 } },
    async setup(io, b) {
      b.oled.clear();
      io.line('rtc.begin()'); await io.delay(100);
      io.line('rtc.lostPower'); await io.delay(80);
      io.line('oled.begin'); await io.delay(80);
    },
    async loop(io, b, p) {
      io.line('rtc.now()'); io.pin('SDA', 'read 0x68', true); io.pin('SCL', '100 kHz', true);
      const d = new Date();
      io.line('getTemperature');
      const temp = Math.round((b.state.temp + (Math.random() - 0.5) * 0.3) * 4) / 4;
      const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      const date = `${DAYS[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
      await io.delay(30);
      io.line('oled.display()'); io.pin('SDA', 'write 0x3C', true);
      b.oled.text([date], { x: 22, y: 4 });
      b.oled.text([time], { x: 16, y: 26, size: 2, clear: false });
      b.oled.text([`${temp.toFixed(1)} C`], { x: 46, y: 52, clear: false });
      io.line('Serial.println(" C")'); io.print(`${date}  ${time}  ${temp.toFixed(1)} C`);
      io.pin('SDA', 'idle', false); io.pin('SCL', 'idle', false);
      io.line('delay('); await io.delay(p.refresh);
    },
    reset(b) { b.oled.clear(); },
  },

  // ------------------------------------------------------------------ low power
  {
    id: 'low-power', title: 'Sleep to save power', icon: 'sun', board: 'nano',
    thumb: () => makeNano().group,
    view: { center: [5.2, 0.6, 1.4], size: 13 },
    build(ctx) {
      const bb = ctx.breadboard(...BBN);
      const { btn, sig } = buttonAt(ctx, bb, 8, 'D2', 'GND', 'yellow', 0x3aa65a);
      const state = { running: false, mode: 'off', ledOn: false, pwrLed: true, hist: [], acc: 0 };
      const plot = ctx.plotter({ title: 'Current meter (estimate)', series: [{ name: 'board mA', color: '#ef8a2b', min: 0, max: 25 }, { name: 'chip mA', color: '#3b78e7', min: 0, max: 25 }] });
      const draw = () => {
        const chip = state.mode === 'awake' ? 9.5 : 0.0003;          // ATmega328P @ 16 MHz / power-down, BOD off
        const board = chip + (state.ledOn ? 2.5 : 0) + (state.pwrLed ? 3 : 0) + 5; // + L LED, power LED, USB-serial chip & regulator
        return { chip, board };
      };
      ctx.onTick((dt) => {
        if (!state.running) return;
        state.acc += dt;
        if (state.acc < 0.1) return;
        state.acc = 0;
        const { chip, board } = draw();
        plot.push(board, chip);
        state.hist.push(board);
        if (state.hist.length > 600) state.hist.shift();
      });
      ctx.interact(btn, { name: 'Wake button (pin 2 · INT0)', hint: 'Press while the board sleeps to wake it', hold: { down: () => btn.press(true), up: () => btn.press(false) } });
      ctx.interact({ pick: ctx.board.group, group: ctx.board.group }, {
        name: 'Nano-style board', hint: 'Its own LEDs and chips use power even when the ATmega328P sleeps',
        controls: [{ type: 'toggle', label: 'Keep the power LED', get: () => state.pwrLed, set: (x) => (state.pwrLed = x) }],
        note: () => {
          if (!state.hist.length) return 'Run the sketch to measure the average current';
          const avg = state.hist.reduce((a, x) => a + x, 0) / state.hist.length;
          return `Average ≈ ${avg.toFixed(1)} mA → a 2000 mAh battery lasts ≈ ${Math.round(2000 / avg / 24)} days`;
        },
      });
      ctx.anchor('btn', btn.anchor);
      ctx.anchor('d2', sig.mid);
      return { btn, state, plot };
    },
    callouts: [
      { anchor: 'chip', x: 0.04, y: 0.17, icon: 'chip', title: 'ATmega328P', text: '≈ 10 mA awake, under 1 µA in power-down sleep.' },
      { anchor: 'd2', x: 0.36, y: 0.12, icon: 'bolt', title: 'Pin 2 = INT0', text: 'A LOW level here wakes the sleeping chip.' },
      { anchor: 'btn', x: 0.7, y: 0.17, icon: 'hand', title: 'Wake button', text: 'Press it while the board is asleep.' },
      { anchor: 'leds', x: 0.04, y: 0.68, icon: 'led', title: 'Board extras', text: 'Power LED, USB chip and regulator still draw ≈ 8 mA. Click the board.' },
    ],
    overview: {
      heading: 'Sleep to save power',
      text: 'A battery project spends most of its life waiting. In power-down sleep the ATmega328P stops its clock and draws under a microamp; an interrupt on pin 2 wakes it. The meter shows the catch: the board’s own LED and chips keep drawing milliamps.',
      features: [['sun', '<code>LowPower.powerDown()</code> with ADC and BOD off'], ['bolt', 'Wake on a LOW level on INT0 (pin 2)'], ['wave', 'Estimated current in the plotter']],
    },
    pinout: [['D2 (INT0)', 'Button → GND', 'INPUT_PULLUP, wakes the chip'], ['D13', 'On-board L LED', 'On while awake'], ['USB', 'Power + serial', 'The USB-serial chip draws power too']],
    example: {
      text: 'Wireless doorbells, remote weather sensors, TV remotes and wildlife cameras sleep almost all the time and wake on a button, a timer or a sensor — that’s how they run for months or years on batteries.',
      points: ['For µA-level boards remove the power LED and regulator (or use a bare ATmega / Pro Mini at 3.3 V)', 'The watchdog timer can wake the chip every 8 s instead of a button', '<code>Serial.flush()</code> before sleeping, or the last message is cut off'],
    },
    specs: [['Awake (chip)', '≈ 9–10 mA at 16 MHz, 5 V'], ['Power-down (chip)', '< 1 µA with BOD and ADC off'], ['Nano board asleep', '≈ 8 mA (power LED + USB-serial + regulator)'], ['Wake sources', 'INT0/INT1 LOW level, pin change, watchdog, TWI address'], ['Library', 'Low-Power by Rocket Scream']],
    quiz: [
      { q: "Why use LOW rather than FALLING to wake from power-down?", options: ["LOW is faster", "In power-down the I/O clock is stopped, so INT0 can only detect a level, not an edge", "FALLING needs a resistor", "It doesn’t matter"], answer: 1, explain: "Edge detection on INT0/INT1 needs the I/O clock; the low-level interrupt works asynchronously and can wake the chip." },
      { q: "Why does the whole Nano board still draw several mA while the chip sleeps?", options: ["Sleep doesn’t work on a Nano", "The power LED, USB-serial chip and regulator are always on", "The button uses power", "The sketch is still running"], answer: 1, explain: "Sleep only stops the ATmega328P. For real battery projects you remove or avoid those extras." },
      { q: "Why call detachInterrupt() right after waking?", options: ["To reset the board", "While the pin stays LOW, a level interrupt would fire over and over", "To save memory", "It re-enables Serial"], answer: 1, explain: "A level interrupt keeps triggering as long as the condition holds; detaching stops it until the next sleep." },
      { q: "Roughly how long would a 2000 mAh battery last at a steady 20 mA?", options: ["About 4 days", "About a month", "About a year", "About 2 hours"], answer: 0, explain: "2000 mAh ÷ 20 mA = 100 hours ≈ 4 days — which is why sleeping matters." },
    ],
    challenges: ["Wake every 8 seconds with LowPower.powerDown(SLEEP_8S, …) and count the wake-ups.", "Wake on either of two buttons using pins 2 and 3 (INT0 and INT1).", "Take a reading every minute (8 × 8 s sleeps) and print it, then work out the average current."],
    code: `#include <LowPower.h>

const int WAKE_PIN = 2;           // INT0 on the ATmega328P
volatile bool woke = false;

void wake() {                     // ISR: just note it
  woke = true;
}

void setup() {
  pinMode(WAKE_PIN, INPUT_PULLUP);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  // ---- awake: do the work
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.println("Awake: taking a reading...");
  delay({{awake}});
  digitalWrite(LED_BUILTIN, LOW);

  // ---- sleep until the button pulls pin 2 LOW
  Serial.println("Going to sleep");
  Serial.flush();                 // let the last bytes go out
  attachInterrupt(digitalPinToInterrupt(WAKE_PIN), wake, LOW);
  LowPower.powerDown(SLEEP_FOREVER, ADC_OFF, BOD_OFF);
  detachInterrupt(digitalPinToInterrupt(WAKE_PIN));  // runs after waking
  Serial.println("Woken by the button!");
}`,
    params: { awake: { value: 2000, min: 100, max: 10000 } },
    async setup(io, b) {
      Object.assign(b.state, { running: true, mode: 'awake', ledOn: false, hist: [] });
      b.plot.reset();
      io.line('INPUT_PULLUP'); await io.delay(80);
      io.line('Serial.begin'); await io.delay(80);
    },
    async loop(io, b, p) {
      const s = b.state;
      s.mode = 'awake';
      io.line('digitalWrite(LED_BUILTIN, HIGH)'); io.board.setBuiltinLed(1); s.ledOn = true;
      io.line('"Awake'); io.print('Awake: taking a reading...');
      io.line('delay('); await io.delay(p.awake);
      io.line('digitalWrite(LED_BUILTIN, LOW)'); io.board.setBuiltinLed(0); s.ledOn = false;
      io.line('"Going to sleep"'); io.print('Going to sleep');
      io.line('Serial.flush'); await io.delay(30);
      io.line('attachInterrupt'); await io.delay(20);
      io.line('LowPower.powerDown');
      s.mode = 'asleep';
      io.pin('D2', 'HIGH · waiting', false);
      while (!b.btn.pressed) await io.delay(20);
      io.pin('D2', 'LOW → wake!', true);
      s.mode = 'awake';
      io.line('woke = true'); await io.delay(30);
      io.line('detachInterrupt'); await io.delay(20);
      io.line('"Woken by'); io.print('Woken by the button!');
      io.pin('D2', 'HIGH', false);
    },
    reset(b, io) { Object.assign(b.state, { running: false, mode: 'off', ledOn: false }); io?.board.setBuiltinLed(0); },
  },
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['timer', 'DS3231 real-time clock', 'I²C clock with a coin-cell backup and a temperature sensor.', 'i2c-bus'],
  ['book', 'Micro-SD card module', 'SPI adapter for logging data to a FAT-formatted micro-SD card.', 'sd-logger'],
  ['globe', 'HC-05 Bluetooth module', 'Classic Bluetooth serial link; 3.3 V logic on RXD.', 'mega-multi-serial'],
  ['chip', 'Nano-style board', 'ATmega328P on a small breadboard-friendly stick.', 'nano-clock'],
];
