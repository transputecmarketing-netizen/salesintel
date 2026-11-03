// Track — Smart Cities & Mobility: H0-scale (1:87) table-top city models run by an
// Uno. Each street device's own wires run in a loom under the model to a header
// next to the controller, so the jumpers you place are the Uno-to-header ones.
import * as THREE from 'three';
import { makeBuzzer, makeLDR, makeResistor } from '../scene/components.js';
import {
  makeIntersection, makeHarness, makeTM1637, makeLedMatrix, makeStreet, makeBreakBeam, makeSpeedCamera, makeCarPark,
  makeSupply, makeRailway, makeBarrier, makeIRObstacle, makeStreetLamp, makePIRPost, makeToyCar, ROAD_Y, SEG,
} from '../scene/modules/industry.js';
import { makePerson } from '../scene/modules.js';
import { v, clamp, BB } from './helpers.js';

const live = (vec) => ({ clone: () => vec });
const SCALE = 87; // H0
/** Model speed (cm/s) → full-size km/h at 1:87. */
const kmh = (cms) => (cms / 100) * 3.6 * SCALE;
const cms = (k) => (k / 3.6 / SCALE) * 100;
const named = (part, label, kind = 'part') => Object.assign(part, { label, kind });
const GREY = 0x6d7079;

/** Wire a list of [boardPin, headerPin, colour] from the Uno to a harness header. */
function toHeader(ctx, hdr, list, lift = 1.2) {
  return list.map(([p, h, c], i) => ctx.wire(ctx.board.pin(p), hdr.pin(h), c, { signal: p, lift: lift + i * 0.12, ...(c === 'black' ? { dir: -1 } : {}) }));
}

// 8×8 bitmaps for the MAX7219 (bit 7 = left column)
const FACE_OK = [0x3c, 0x42, 0xa5, 0x81, 0xa5, 0x99, 0x42, 0x3c];
const FACE_SLOW = [0x3c, 0x42, 0xa5, 0x81, 0x99, 0xa5, 0x42, 0x3c];
const DIGIT = [
  [0x3c, 0x66, 0x6e, 0x76, 0x66, 0x66, 0x3c, 0x00],
  [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7e, 0x00],
  [0x3c, 0x66, 0x06, 0x0c, 0x30, 0x60, 0x7e, 0x00],
  [0x3c, 0x66, 0x06, 0x1c, 0x06, 0x66, 0x3c, 0x00],
  [0x0c, 0x1c, 0x2c, 0x4c, 0x7e, 0x0c, 0x0c, 0x00],
];
const FULL = [0x81, 0x42, 0x24, 0x18, 0x18, 0x24, 0x42, 0x81];
const hexRows = (rows) => rows.map((r) => `0x${r.toString(16).toUpperCase().padStart(2, '0')}`).join(', ');

export const projectsCity = [
  // ------------------------------------------------------------------ 1 · adaptive traffic lights
  {
    id: 'city-adaptive-traffic', title: 'Adaptive traffic lights', icon: 'traffic', board: 'uno',
    thumb: () => { const g = new THREE.Group(); const c = makeToyCar(v(0, 0, 0)); g.add(c.group); return g; },
    view: { center: [-12, 3, -12], size: 72 },
    build(ctx) {
      const C = v(-14, 0, -16);
      ctx.step('Lay the H0 intersection model; poles and car sensors are fitted');
      const X = ctx.add(makeIntersection(C, { rate: { N: 9, S: 9, E: 6, W: 6 } }));
      ctx.step('The model’s loom ends in one header next to the Uno');
      const runs = ['N', 'E', 'S', 'W'].flatMap((k) => [[X.feet.pole[k], GREY], [X.feet.sensor[k], 0x3a6fd0]]);
      const hdr = ctx.add(makeHarness(v(-1, 0, -7.4), ['NS_R', 'NS_Y', 'NS_G', 'EW_R', 'EW_Y', 'EW_G', 'N', 'E', 'S', 'W', '5V', 'GND'], runs, {
        title: 'JUNCTION LOOM', pinText: { NS_R: 'R', NS_Y: 'Y', NS_G: 'G', EW_R: 'R', EW_Y: 'Y', EW_G: 'G' },
      }));
      ctx.step('Lights: D2–D4 north–south R Y G, D5–D7 east–west R Y G');
      const lw = toHeader(ctx, hdr, [['D2', 'NS_R', 'red'], ['D3', 'NS_Y', 'yellow'], ['D4', 'NS_G', 'green'], ['D5', 'EW_R', 'red'], ['D6', 'EW_Y', 'yellow'], ['D7', 'EW_G', 'green']]);
      ctx.step('Car sensors: D8 north, D9 east, D10 south, D11 west; 5 V and GND');
      toHeader(ctx, hdr, [['D8', 'N', 'blue'], ['D9', 'E', 'purple'], ['D10', 'S', 'blue'], ['D11', 'W', 'purple'], ['5V', '5V', 'red'], ['GND', 'GND', 'black']], 1.9);
      ctx.step('TM1637 shows the green phase and its seconds: CLK A0, DIO A1');
      const disp = ctx.add(makeTM1637(v(-5.6, 0, 6.4)));
      ctx.wire(ctx.board.pin('A0'), disp.pin('CLK'), 'green', { signal: 'A0' });
      ctx.wire(ctx.board.pin('A1'), disp.pin('DIO'), 'blue', { signal: 'A1' });
      ctx.wire(ctx.board.pin('3V3'), disp.pin('VCC'), 'red', { lift: 1.0 });
      ctx.wire(ctx.board.pin('GND_3'), disp.pin('GND'), 'black', { dir: -1, lift: 1.1 });
      const plot = ctx.plotter({ title: 'Cars waiting', series: [{ name: 'north–south', color: '#2f5fbf', min: 0, max: 8 }, { name: 'east–west', color: '#ef8a2b', min: 0, max: 8 }] });
      const st = { ns: 9, ew: 6 };
      ctx.interact(X, {
        name: 'Intersection', hint: 'Change the traffic on each road',
        controls: [
          { type: 'range', label: 'North–south cars / min', min: 0, max: 20, step: 1, get: () => st.ns, set: (r) => { st.ns = r; X.setRate('N', r); X.setRate('S', r); } },
          { type: 'range', label: 'East–west cars / min', min: 0, max: 20, step: 1, get: () => st.ew, set: (r) => { st.ew = r; X.setRate('E', r); X.setRate('W', r); } },
          { type: 'button', label: 'Clear the roads', press: () => X.reset() },
        ],
        note: () => `Waiting: N ${X.waiting('N')} · S ${X.waiting('S')} · E ${X.waiting('E')} · W ${X.waiting('W')} · through: ${['N', 'S', 'E', 'W'].reduce((a, k) => a + X.passed(k), 0)}`,
      });
      ctx.onTick(() => { if (st.plotOn) plot.push(X.waiting('N') + X.waiting('S'), X.waiting('E') + X.waiting('W')); });
      for (let i = 0; i < 160; i++) X.tick(0.05); // traffic already on the roads
      ctx.anchor('poleN', X.poleTop('N'));
      ctx.anchor('sensE', X.sensors.E.anchor);
      ctx.anchor('hdr', hdr.anchor);
      ctx.anchor('disp', disp.anchor);
      return { X, hdr, disp, plot, st, lw };
    },
    callouts: [
      { anchor: 'poleN', x: 0.04, y: 0.17, icon: 'traffic', title: 'Paired poles', text: 'North and south show the same aspect, so one set of pins drives both.' },
      { anchor: 'sensE', x: 0.7, y: 0.17, icon: 'radar', title: 'Car-presence sensor', text: 'FC-51 on the kerb 3 cm before the stop line: LOW while a car is there.' },
      { anchor: 'hdr', x: 0.36, y: 0.12, icon: 'pins', title: 'Junction loom', text: 'Every pole and sensor wire meets here. 12 jumpers to the Uno.' },
      { anchor: 'disp', x: 0.04, y: 0.68, icon: 'timer', title: 'Phase + seconds', text: '“n 12” = north–south green for 12 s; “E” = east–west.' },
    ],
    overview: {
      heading: 'Adaptive traffic lights',
      text: 'Builds on <b>Traffic lights</b>, <b>Multitask with millis()</b> and <b>Build a state machine</b>. Instead of fixed timings, sensors at each stop line tell the controller who is waiting: green stays while cars keep coming and switches as soon as the gap opens up and the other road has a queue.',
      features: [['traffic', 'Six phases: green, amber, all-red, for each road'], ['radar', 'Gap-out: switch when no car for <code>GAP_MS</code>'], ['timer', 'Never shorter than <code>MIN_GREEN</code>, never longer than <code>MAX_GREEN</code>']],
    },
    pinout: [
      ['D2, D3, D4', 'Loom NS_R, NS_Y, NS_G', 'North and south poles in parallel; 220 Ω per LED on each pole'],
      ['D5, D6, D7', 'Loom EW_R, EW_Y, EW_G', 'East and west poles'],
      ['D8, D9, D10, D11', 'Loom N, E, S, W', 'FC-51 OUT, LOW = car'],
      ['5V, GND', 'Loom 5V, GND', 'Sensor power and LED returns'],
      ['A0, A1', 'TM1637 CLK, DIO', 'A0–A5 work as digital pins'],
      ['3V3, GND_3', 'TM1637 VCC, GND', 'The module runs from 3.3–5 V'],
    ],
    example: {
      text: 'Real junctions use inductive loops cut into the road or cameras above it. “Actuated” signals like this cut waiting times by a third compared with fixed plans, and they let empty side roads stay red.',
      points: ['Make east–west traffic 0: north–south rests on green forever, because nobody asks for a change', 'Raise both to 15 cars/min and watch <code>MAX_GREEN</code> take over', 'A smaller <code>GAP_MS</code> switches sooner but can split a platoon of cars'],
    },
    specs: [['Model', 'H0 (1:87), 2-lane roads, 64 × 64 cm'], ['Sensors', '4 × FC-51 IR obstacle, ≈ 1 cm from the car'], ['Timing', 'Amber 3 s, all-red 1.5 s'], ['LED current', '≈ 10 mA per lamp, 2 lamps per pin'], ['Display', 'TM1637 4-digit'], ['Libraries', 'TM1637Display']],
    quiz: [
      { q: 'Why is there an all-red phase between the roads?', options: ['So a car that entered on amber can clear the junction before the cross traffic gets green', 'To save power', 'The sensors need it', 'Law of the TM1637'], answer: 0, explain: 'All-red is the safety buffer, typically 1–3 s in real junctions.' },
      { q: 'North–south is green with cars still flowing, but east–west has a queue. What decides the switch?', options: ['MIN_GREEN has passed and either the gap (no car for GAP_MS) or MAX_GREEN is reached', 'It switches straight away', 'It never switches', 'A random timer'], answer: 0, explain: 'The green is extended by each passing car, but MAX_GREEN caps it so the queue is never starved.' },
      { q: 'Why can one pin drive the north and the south red lamp?', options: ['Both always show the same aspect; each LED has its own resistor, about 20 mA total', 'Pins have unlimited current', 'The LEDs are in series', 'It cannot'], answer: 0, explain: 'Two LEDs in parallel with their own 220 Ω resistors draw ≈ 10 mA each, inside the Uno’s 20 mA per-pin comfort zone.' },
      { q: 'Why use millis() instead of delay() here?', options: ['The sensors must be read all the time, even during a green', 'delay() is inaccurate', 'millis() uses less power', 'The TM1637 needs it'], answer: 0, explain: 'A delay(10000) would leave the controller blind to arriving cars for 10 s.' },
    ],
    challenges: [
      'Add a pedestrian button that requests an all-red “walk” phase at the next change.',
      'Count cars per phase (sensor LOW → HIGH edges) and print vehicles per minute.',
      'Give a bus priority: a key on Serial extends the current green by 5 s once.',
    ],
    code: `// Adaptive traffic lights: green holds while cars keep coming,
// switches when the gap opens and the other road is waiting.
#include <TM1637Display.h>

const int NS_R = 2, NS_Y = 3, NS_G = 4;        // north + south poles in parallel
const int EW_R = 5, EW_Y = 6, EW_G = 7;        // east + west poles
const int SENSOR[4] = {8, 9, 10, 11};          // N, E, S, W: LOW = car at the line
const unsigned long MIN_GREEN = {{mingreen}} * 1000UL;
const unsigned long MAX_GREEN = {{maxgreen}} * 1000UL;
const unsigned long GAP_MS = {{gap}};             // no car for this long = road is clear
const unsigned long AMBER_MS = 3000, ALL_RED_MS = 1500;

enum Phase { NS_GREEN, NS_AMBER, RED_1, EW_GREEN, EW_AMBER, RED_2 };
Phase phase;
unsigned long since = 0, lastNS = 0, lastEW = 0;
TM1637Display display(A0, A1);
const uint8_t LETTER_NS = 0x54, LETTER_EW = 0x79;  // n, E

bool car(int i) { return digitalRead(SENSOR[i]) == LOW; }

void lights(bool nr, bool ny, bool ng, bool er, bool ey, bool eg) {
  digitalWrite(NS_R, nr); digitalWrite(NS_Y, ny); digitalWrite(NS_G, ng);
  digitalWrite(EW_R, er); digitalWrite(EW_Y, ey); digitalWrite(EW_G, eg);
}

void enter(Phase p) {
  phase = p;
  since = millis();
  switch (p) {
    case NS_GREEN: lights(0, 0, 1, 1, 0, 0); break;
    case NS_AMBER: lights(0, 1, 0, 1, 0, 0); break;
    case EW_GREEN: lights(1, 0, 0, 0, 0, 1); break;
    case EW_AMBER: lights(1, 0, 0, 0, 1, 0); break;
    default:       lights(1, 0, 0, 1, 0, 0); break;   // all red
  }
  Serial.print("Phase ");
  Serial.println(p);
}

void setup() {
  Serial.begin(9600);
  for (int pin = 2; pin <= 7; pin++) pinMode(pin, OUTPUT);
  for (int i = 0; i < 4; i++) pinMode(SENSOR[i], INPUT);
  display.setBrightness(4);
  enter(NS_GREEN);
}

void loop() {
  unsigned long now = millis(), t = now - since;
  bool nsCar = car(0) || car(2), ewCar = car(1) || car(3);
  if (nsCar) lastNS = now;
  if (ewCar) lastEW = now;

  if (phase == NS_GREEN || phase == EW_GREEN) {
    bool ns = phase == NS_GREEN;
    bool flowing = now - (ns ? lastNS : lastEW) < GAP_MS;  // cars still coming
    bool waiting = ns ? ewCar : nsCar;                     // other road has a queue
    if (t >= MIN_GREEN && waiting && (!flowing || t >= MAX_GREEN))
      enter(ns ? NS_AMBER : EW_AMBER);
    uint8_t letter[] = {ns ? LETTER_NS : LETTER_EW};
    display.setSegments(letter, 1, 0);
    display.showNumberDec(t / 1000, false, 2, 2);
  } else if (phase == NS_AMBER || phase == EW_AMBER) {
    if (t >= AMBER_MS) enter(phase == NS_AMBER ? RED_1 : RED_2);
  } else if (t >= ALL_RED_MS) {
    enter(phase == RED_1 ? EW_GREEN : NS_GREEN);
  }
  delay(20);
}`,
    params: { mingreen: { value: 6, min: 2, max: 20 }, maxgreen: { value: 25, min: 6, max: 60 }, gap: { value: 2500, min: 500, max: 8000 } },
    async setup(io, b) {
      b.st.plotOn = true;
      b.plot.reset();
      Object.assign(b, { lastNS: 0, lastEW: 0 });
      io.line('for (int pin = 2; pin <= 7; pin++)');
      await io.delay(60);
      enterSim(io, b, 0);
    },
    async loop(io, b, p) {
      const now = performance.now(), t = now - b.since;
      io.line('bool nsCar = car(0) || car(2)');
      const nsCar = b.X.presence('N') || b.X.presence('S'), ewCar = b.X.presence('E') || b.X.presence('W');
      ['N', 'E', 'S', 'W'].forEach((k, i) => io.pin(`D${8 + i}`, b.X.presence(k) ? 'LOW · car' : 'HIGH', b.X.presence(k)));
      if (nsCar) b.lastNS = now;
      if (ewCar) b.lastEW = now;
      if (b.phase === 0 || b.phase === 3) {
        const ns = b.phase === 0;
        const flowing = now - (ns ? b.lastNS : b.lastEW) < p.gap;
        const waiting = ns ? ewCar : nsCar;
        io.line('if (t >= MIN_GREEN && waiting');
        b.disp.setSegments([ns ? 0x54 : 0x79, 0, ...String(Math.min(99, Math.trunc(t / 1000))).padStart(2, ' ').split('').map((c) => SEG[c] ?? 0)]);
        if (t >= p.mingreen * 1000 && waiting && (!flowing || t >= p.maxgreen * 1000)) {
          io.print(!flowing ? 'Gap: no more cars, switching' : 'MAX_GREEN reached, switching');
          enterSim(io, b, ns ? 1 : 4);
        }
      } else if (b.phase === 1 || b.phase === 4) {
        io.line('if (t >= AMBER_MS)');
        if (t >= 3000) enterSim(io, b, b.phase === 1 ? 2 : 5);
      } else {
        io.line('} else if (t >= ALL_RED_MS) {');
        if (t >= 1500) enterSim(io, b, b.phase === 2 ? 3 : 0);
      }
      io.line('delay(20);');
      await io.delay(50);
    },
    reset(b) { b.st.plotOn = false; for (const k of ['N', 'S', 'E', 'W']) b.X.show(k, 'red'); b.disp.clear(); },
  },

  // ------------------------------------------------------------------ 2 · speed trap
  {
    id: 'city-speed-trap', title: 'Speed trap', icon: 'car', board: 'uno',
    thumb: () => makeSpeedCamera(v(0, 0, 0)).group,
    view: { center: [-4, 3, -10], size: 66 },
    build(ctx) {
      const SC = v(-6, 0, -14);
      ctx.step('Lay the one-way street model');
      const street = ctx.add(makeStreet(SC, { length: 80, oneWay: true }));
      const RW = street.roadWidth;
      const A_X = -14, B_X = 6; // beams 20 cm apart (= 17.4 m at 1:87)
      ctx.step('Two IR break-beams across the road, exactly 20 cm apart');
      const W = (x, y, z) => street.at(x, z, y);
      const beamA = ctx.add(makeBreakBeam(W(A_X, 1.0, -RW / 2 - 0.7), W(A_X, 1.0, RW / 2 + 0.7), { outA: v(0, 0, -1.4), outB: v(0, 0, 1.4), label: 'IR break-beam A' }));
      const beamB = ctx.add(makeBreakBeam(W(B_X, 1.0, -RW / 2 - 0.7), W(B_X, 1.0, RW / 2 + 0.7), { outA: v(0, 0, -1.4), outB: v(0, 0, 1.4), label: 'IR break-beam B' }));
      ctx.step('Speed sign: TM1637 and an 8×8 matrix on posts facing the traffic');
      const sign = ctx.add(makeTM1637(W(15, 0, 4.8), { post: 5.5, rotY: -Math.PI / 4 }));
      const face = ctx.add(makeLedMatrix(W(21, 0, 4.8), { post: 5.5, rotY: -Math.PI / 4 }));
      ctx.step('Speed camera with a white LED flash');
      const cam = ctx.add(makeSpeedCamera(W(28, 0, 4.6), { rotY: -Math.PI / 3 }));
      ctx.step('The loom brings every device to one header');
      const rxFoot = (bm) => bm.pin('OUT').clone();
      const hdr = ctx.add(makeHarness(v(-3.5, 0, -3.6), ['BEAM_A', 'BEAM_B', 'FLASH', 'CLK', 'DIO', 'DIN', 'CS', 'MCLK', '5V', 'GND'],
        [[rxFoot(beamA), GREY], [rxFoot(beamB), GREY], [beamA.pin('TX+'), GREY, [v(beamA.pin('TX+').x, 0.12, -3.4 - 6)]], [beamB.pin('TX+'), GREY, [v(beamB.pin('TX+').x, 0.12, -9.6)]], [sign.pin('CLK'), 0x3a6fd0], [face.pin('DIN'), 0x8a5cc6], [cam.foot, 0xd8443a]],
        { title: 'SPEED TRAP LOOM', pinText: { BEAM_A: 'A', BEAM_B: 'B', FLASH: 'F', MCLK: 'CK' } }));
      ctx.step('Beams on the interrupt pins: A → D2, B → D3');
      toHeader(ctx, hdr, [['D2', 'BEAM_A', 'white'], ['D3', 'BEAM_B', 'white'], ['D7', 'FLASH', 'orange']]);
      ctx.step('Display: D4 CLK, D5 DIO; matrix: D11 DIN, D10 CS, D13 CLK');
      toHeader(ctx, hdr, [['D4', 'CLK', 'green'], ['D5', 'DIO', 'blue'], ['D11', 'DIN', 'purple'], ['D10', 'CS', 'yellow'], ['D13', 'MCLK', 'green'], ['5V', '5V', 'red'], ['GND', 'GND', 'black']], 1.7);
      // ---- traffic: one lane, each car with its own speed
      const T = street.traffic;
      const lane = T.lane({ from: v(-40, ROAD_Y, 0), to: v(40, ROAD_Y, 0), stop: null });
      const st = { rate: 8, mode: 'mix', acc: 1, edges: [] };
      const sA = A_X + 40, sB = B_X + 40;
      const front = new Map();
      ctx.onTick((dt) => {
        st.acc += (st.rate / 60) * dt;
        if (st.acc >= 1) {
          const k = st.mode === 'mix' ? 30 + Math.random() * 45 : +st.mode;
          if (T.spawn(lane, cms(k))) st.acc -= 1;
        }
        st.acc = Math.min(st.acc, 1.2);
        const now = performance.now();
        let a = false, bb = false;
        for (const c of T.cars) {
          const f = c.s + T.CL / 2, f0 = front.get(c) ?? f - c.v * dt;
          // exact moment the bonnet reached each beam (interpolated inside the frame)
          for (const [s, name] of [[sA, 'A'], [sB, 'B']]) if (f0 < s && f >= s) st.edges.push({ name, t: now - ((f - s) / Math.max(c.v, 1e-3)) * 1000 });
          front.set(c, f);
          if (Math.abs(c.s - sA) < T.CL / 2) a = true;
          if (Math.abs(c.s - sB) < T.CL / 2) bb = true;
        }
        for (const c of [...front.keys()]) if (!T.cars.includes(c)) front.delete(c);
        beamA.setBlocked(a);
        beamB.setBlocked(bb);
      });
      ctx.interact(street, {
        name: 'Traffic', hint: 'Choose how fast the cars drive',
        controls: [
          { type: 'choice', label: 'Car speed (full-size)', options: [['mix', 'Mixed 30–75 km/h'], ['30', '30 km/h'], ['50', '50 km/h'], ['70', '70 km/h'], ['90', '90 km/h']], get: () => st.mode, set: (m) => (st.mode = m) },
          { type: 'range', label: 'Cars per minute', min: 1, max: 12, step: 1, get: () => st.rate, set: (r) => (st.rate = r) },
        ],
        note: () => `20 cm on the model = ${(0.2 * SCALE).toFixed(1)} m full size. A car at 50 km/h drives ${cms(50).toFixed(1)} cm/s here.`,
      });
      ctx.anchor('beamA', beamA.anchor);
      ctx.anchor('sign', sign.anchor);
      ctx.anchor('cam', cam.anchor);
      ctx.anchor('hdr', hdr.anchor);
      return { street, beamA, beamB, sign, face, cam, hdr, st, T };
    },
    callouts: [
      { anchor: 'beamA', x: 0.04, y: 0.17, icon: 'radar', title: 'Beams A and B, 20 cm apart', text: 'Each break fires an interrupt that stores micros().' },
      { anchor: 'sign', x: 0.36, y: 0.12, icon: 'timer', title: 'Speed sign', text: 'km/h on the TM1637, a smile or a frown on the 8×8 matrix.' },
      { anchor: 'cam', x: 0.7, y: 0.17, icon: 'sun', title: 'Camera flash on D7', text: 'Fires for 60 ms when a car is over LIMIT.' },
      { anchor: 'hdr', x: 0.04, y: 0.68, icon: 'pins', title: 'Loom header', text: 'Beams, sign and camera all meet here.' },
    ],
    overview: {
      heading: 'Speed trap with two light beams',
      text: 'Builds on <b>Hardware interrupts</b> and <b>Count on a 7-segment</b>. A car breaks beam A, then beam B 20 cm further on. The time between the two interrupts gives the speed: v = distance ÷ time, scaled up 87× for an H0 model. Fast cars get a frown and a flash.',
      features: [['bolt', '<code>attachInterrupt()</code> on D2 and D3, timed with <code>micros()</code>'], ['code', 'km/h = 0.20 m ÷ t × 3.6 × 87'], ['led', 'LedControl faces + TM1637 number']],
    },
    pinout: [
      ['D2, D3', 'Loom BEAM_A, BEAM_B', 'Receiver OUT, INPUT_PULLUP, FALLING = beam broken'],
      ['D4, D5', 'TM1637 CLK, DIO', ''],
      ['D11, D10, D13', 'MAX7219 DIN, CS, CLK', ''],
      ['D7', 'Camera FLASH', 'Drives a transistor on the camera board (3 white LEDs)'],
      ['5V, GND', 'Loom 5V, GND', 'Beams, sign and camera'],
    ],
    example: {
      text: 'Average-speed cameras and many speed-feedback signs work like this: two detection points a known distance apart and an accurate clock. Real systems use radar or loops, and a calibrated distance.',
      points: ['A 1 ms timing error at 50 km/h is about 4 % here; that is why the sketch uses <code>micros()</code>', 'Lower <code>LIMIT</code> and watch the frowns', 'A second car entering before the first leaves beam B is ignored until the measurement completes'],
    },
    specs: [['Beam gap', '20.0 cm (17.4 m at 1:87)'], ['Timing', '<code>micros()</code>, 4 µs resolution'], ['Range', '5–250 km/h scale'], ['Display', 'TM1637 + MAX7219 8×8'], ['Flash', '60 ms, 3 white LEDs via transistor'], ['Libraries', 'TM1637Display, LedControl']],
    quiz: [
      { q: 'A car takes 0.40 s between the beams. Full-size speed at 1:87?', options: ['≈ 157 km/h', '≈ 50 km/h', '≈ 1.8 km/h', '≈ 18 km/h'], answer: 0, explain: '0.20 m ÷ 0.40 s = 0.5 m/s = 1.8 km/h on the model, × 87 ≈ 157 km/h.' },
      { q: 'Why record the times in interrupts instead of polling in loop()?', options: ['The moment is captured within microseconds, even while loop() is busy updating displays', 'Interrupts use less power', 'Polling cannot read D2', 'It needs fewer wires'], answer: 0, explain: 'A display update can take milliseconds; polling would add that much error to the time.' },
      { q: 'Why are tA and tB declared volatile?', options: ['They change inside an ISR, so the compiler must re-read them from memory every time', 'To make them faster', 'They are constants', 'micros() needs it'], answer: 0, explain: 'Without volatile, loop() could keep a stale copy in a register.' },
      { q: 'Why turn interrupts off while copying tA and tB?', options: ['An unsigned long is 4 bytes; an ISR could change it halfway through the copy', 'To stop the car', 'To save power', 'The TM1637 requires it'], answer: 0, explain: 'The 8-bit AVR copies 4 bytes in several instructions; noInterrupts() makes the copy atomic.' },
    ],
    challenges: [
      'Log every speed with a timestamp to the serial monitor and print the average of the last 10 cars.',
      'Show the speed on the matrix as scrolling digits instead of a face.',
      'Detect cars going the wrong way (beam B before beam A) and flash a warning.',
    ],
    code: `// Speed trap: two light beams 20 cm apart, interrupts time the car.
#include <TM1637Display.h>
#include <LedControl.h>

const int BEAM_A = 2, BEAM_B = 3;              // interrupt pins, LOW = beam broken
const int FLASH = 7;
const float GAP_M = 0.20;                      // distance between the beams
const int SCALE = 87;                          // H0 model: 1:87
const int LIMIT = {{limit}};                      // km/h, full size
const unsigned long TIMEOUT_US = 3000000;      // forget a half measurement after 3 s

TM1637Display display(4, 5);                   // CLK, DIO
LedControl matrix(11, 13, 10, 1);              // DIN, CLK, CS, 1 module
const byte SMILE[8] = {${hexRows(FACE_OK)}};
const byte FROWN[8] = {${hexRows(FACE_SLOW)}};

volatile unsigned long tA = 0, tB = 0;

void beamA() { if (tA == 0) tA = micros(); }   // first car only
void beamB() { if (tA != 0 && tB == 0) tB = micros(); }

void face(const byte *rows) {
  for (int r = 0; r < 8; r++) matrix.setRow(0, r, rows[r]);
}

void setup() {
  Serial.begin(9600);
  pinMode(BEAM_A, INPUT_PULLUP);
  pinMode(BEAM_B, INPUT_PULLUP);
  pinMode(FLASH, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(BEAM_A), beamA, FALLING);
  attachInterrupt(digitalPinToInterrupt(BEAM_B), beamB, FALLING);
  matrix.shutdown(0, false);
  matrix.setIntensity(0, 6);
  matrix.clearDisplay(0);
  display.setBrightness(6);
  display.showNumberDec(0);
}

void loop() {
  noInterrupts();                              // copy both times in one go
  unsigned long a = tA, b = tB;
  interrupts();

  if (a != 0 && b != 0) {
    float seconds = (b - a) / 1e6;
    int kmh = round(GAP_M / seconds * 3.6 * SCALE);
    display.showNumberDec(kmh);
    Serial.print(kmh);
    Serial.println(" km/h");
    if (kmh > LIMIT) {
      face(FROWN);
      digitalWrite(FLASH, HIGH);               // say cheese
      delay(60);
      digitalWrite(FLASH, LOW);
      Serial.println("  over the limit: photo");
    } else {
      face(SMILE);
    }
    noInterrupts();
    tA = tB = 0;                               // ready for the next car
    interrupts();
  } else if (a != 0 && micros() - a > TIMEOUT_US) {
    noInterrupts();
    tA = 0;                                    // car never reached B
    interrupts();
  }
}`,
    params: { limit: { value: 50, min: 20, max: 130 } },
    async setup(io, b) {
      b.st.edges.length = 0;
      b.tA = 0;
      io.line('attachInterrupt(digitalPinToInterrupt(BEAM_A)');
      io.line('matrix.shutdown(0, false);');
      b.face.clear();
      io.line('display.showNumberDec(0);');
      b.sign.showNumber(0);
      await io.delay(100);
    },
    async loop(io, b, p) {
      for (const e of b.st.edges.splice(0)) {
        if (e.name === 'A' && !b.tA) { b.tA = e.t; io.line('void beamA()'); io.pin('D2', 'FALLING', true); }
        if (e.name === 'B' && b.tA && !b.tB) { b.tB = e.t; io.line('void beamB()'); io.pin('D3', 'FALLING', true); }
      }
      io.line('unsigned long a = tA, b = tB;');
      if (b.tA && b.tB) {
        const seconds = (b.tB - b.tA) / 1000;
        const k = Math.round((0.2 / seconds) * 3.6 * SCALE);
        io.line('int kmh = round(GAP_M / seconds * 3.6 * SCALE);');
        b.sign.showNumber(k);
        io.print(`${k} km/h`);
        if (k > p.limit) {
          io.line('face(FROWN);');
          b.face.show(FACE_SLOW);
          io.line('digitalWrite(FLASH, HIGH);');
          b.cam.flash(60);
          io.pin('D7', 'HIGH', true);
          await io.delay(60);
          io.pin('D7', 'LOW', false);
          io.print('  over the limit: photo');
        } else {
          io.line('face(SMILE);');
          b.face.show(FACE_OK);
        }
        io.line('tA = tB = 0;');
        b.tA = b.tB = 0;
        io.pin('D2', 'HIGH', false); io.pin('D3', 'HIGH', false);
      } else if (b.tA && performance.now() - b.tA > 3000) {
        io.line('tA = 0;');
        b.tA = 0;
      }
      await io.delay(20);
    },
    reset(b) { b.face.clear(); b.sign.clear(); },
  },

  // ------------------------------------------------------------------ 3 · smart parking
  {
    id: 'city-smart-parking', title: 'Smart car park', icon: 'car', board: 'uno',
    thumb: () => makeBarrier(v(0, 0, 0), { length: 5 }).group,
    view: { center: [-8, 3, -14], size: 62 },
    build(ctx) {
      const PC = v(-6, 0, -19);
      ctx.step('Lay the car park: four bays, a barrier at the entrance');
      const park = ctx.add(makeCarPark(PC, { rate: 4, stay: 18 }));
      ctx.step('Free-spaces sign: an 8×8 matrix on a post at the entrance');
      const sign = ctx.add(makeLedMatrix(v(PC.x - 21, 0, PC.z + 8.2), { post: 5, rotY: -Math.PI / 4 }));
      ctx.step('The loom header and a 5 V supply for the servo and sensors');
      const f = park.feet;
      const hdr = ctx.add(makeHarness(v(-6.5, 0, -0.4), ['OUT', 'IN', 'B1', 'B2', 'B3', 'B4', 'SERVO', 'DIN', 'CS', 'CLK', 'V+', 'GND'],
        [[f.outside, GREY], [f.inside, GREY], ...f.bay.map((p) => [p, 0x3a6fd0, [v(p.x, 0.12, p.z - 0.8), v(PC.x + 12, 0.12, p.z - 0.8), v(PC.x + 12, 0.12, -1.6)]]), [f.barrier, 0xd8443a], [sign.pin('DIN'), 0x8a5cc6]],
        { title: 'CAR PARK LOOM' }));
      const psu = ctx.add(makeSupply(v(-17, 0, 2.5), { rotY: Math.PI / 2, label: '5 V 2 A' }));
      ctx.wire(psu.pin('+'), hdr.pin('V+'), 'red', { lift: 1.2 });
      ctx.wire(psu.pin('-'), hdr.pin('GND'), 'black', { lift: 1.0, dir: -1 });
      ctx.step('Sensors: D2 outside, D3 inside, D4–D7 bays 1–4');
      toHeader(ctx, hdr, [['D2', 'OUT', 'white'], ['D3', 'IN', 'white'], ['D4', 'B1', 'blue'], ['D5', 'B2', 'blue'], ['D6', 'B3', 'blue'], ['D7', 'B4', 'blue']]);
      ctx.step('Barrier servo on D9; matrix on D11 / D10 / D13; common GND');
      toHeader(ctx, hdr, [['D9', 'SERVO', 'orange'], ['D11', 'DIN', 'purple'], ['D10', 'CS', 'yellow'], ['D13', 'CLK', 'green'], ['GND', 'GND', 'black']], 1.8);
      const st = { rate: 4, stay: 18 };
      park.preload([1, 3]);
      ctx.interact(park, {
        name: 'Car park', hint: 'Change how busy it is',
        controls: [
          { type: 'range', label: 'Arrivals per minute', min: 0, max: 10, step: 1, get: () => st.rate, set: (r) => { st.rate = r; park.setRate(r); } },
          { type: 'range', label: 'Average stay (s)', min: 5, max: 60, step: 1, get: () => st.stay, set: (r) => { st.stay = r; park.setStay(r); } },
          { type: 'button', label: 'Send a car now', press: () => park.arrive() },
        ],
        note: () => `Bays: ${park.bays.map((bb) => (bb.seen ? '■' : '□')).join(' ')} · queue ${park.cars.filter((c) => c.state === 'queue').length}`,
      });
      ctx.anchor('gate', park.barrier.anchor);
      ctx.anchor('sign', sign.anchor);
      ctx.anchor('bay', park.bays[2].sensor.anchor);
      ctx.anchor('hdr', hdr.anchor);
      ctx.anchor('psu', psu.anchor);
      return { park, sign, hdr };
    },
    callouts: [
      { anchor: 'sign', x: 0.04, y: 0.17, icon: 'led', title: 'Free spaces', text: 'A digit while there is room, a cross when full.' },
      { anchor: 'gate', x: 0.36, y: 0.12, icon: 'servo', title: 'Barrier on D9', text: 'Opens for a waiting car only if a bay is free; closes when it is through.' },
      { anchor: 'bay', x: 0.7, y: 0.17, icon: 'radar', title: 'One sensor per bay', text: 'FC-51 on the back wall sees a parked car’s nose: LOW = taken.' },
      { anchor: 'psu', x: 0.04, y: 0.68, icon: 'bolt', title: '5 V 2 A for the model', text: 'Servo and six sensors; its − is tied to the Uno GND.' },
      { anchor: 'hdr', x: 0.36, y: 0.74, icon: 'pins', title: 'Loom header', text: '12 pins: sensors, servo, matrix and power.' },
    ],
    overview: {
      heading: 'Smart car park',
      text: 'Builds on <b>Sweep a servo</b>, <b>Flame detector</b>-style IR modules and <b>Build a state machine</b>. Each bay reports whether it is taken, the sign shows how many are free, and the barrier only lets a car in when there is room, then closes once it has passed.',
      features: [['radar', 'Free bays counted from the sensors, not by guessing'], ['servo', 'Barrier state machine: CLOSED → OPEN → CLOSED'], ['led', 'LedControl: digits 0–4, a cross when full']],
    },
    pinout: [
      ['D2, D3', 'Loom OUT, IN', 'IR sensors before / after the barrier, LOW = car'],
      ['D4–D7', 'Loom B1–B4', 'Bay sensors'],
      ['D9', 'Loom SERVO', 'Barrier SG90 signal'],
      ['D11, D10, D13', 'MAX7219 DIN, CS, CLK', ''],
      ['5 V supply + / −', 'Loom V+ / GND', 'Servo, sensors and matrix'],
      ['GND', 'Loom GND', 'Common ground'],
    ],
    example: {
      text: 'Shopping centres guide drivers with a sensor over every bay and a green or red lamp above it; the totals feed the “213 free” signs on the road outside.',
      points: ['Set arrivals high and stays long: the sign shows a cross and cars queue', 'The barrier waits for the INSIDE sensor to go clear, so it never comes down on a car', 'If a driver gives up and reverses away, <code>GIVE_UP_MS</code> closes the barrier anyway'],
    },
    specs: [['Bays', '4, nose-in, FC-51 on the back wall'], ['Barrier', 'SG90, 0° down, 90° up, 1° per <code>GATE_STEP_MS</code>'], ['Sign', 'MAX7219 8×8 matrix'], ['Supply', '5 V 2 A, ≈ 0.5 A peak'], ['Libraries', 'Servo, LedControl']],
    quiz: [
      { q: 'Why count free bays from the bay sensors and not by counting cars in and out?', options: ['Counting drifts with every missed or double count; the bay sensors always tell the truth', 'It uses fewer pins', 'Counting is not possible on an Uno', 'It is faster'], answer: 0, explain: 'An entry/exit counter must be reset by hand when it goes wrong; reading each bay cannot drift.' },
      { q: 'When does the barrier close?', options: ['After the inside sensor has seen the car and then been clear for CLEAR_MS', 'After a fixed 3 s', 'When the outside sensor sees a car', 'Never'], answer: 0, explain: 'That guarantees the car has driven past the boom.' },
      { q: 'Why does the servo move 1° at a time?', options: ['A barrier slamming at full servo speed would look and sound wrong and could damage the boom', 'Servos only move 1°', 'To save memory', 'The library requires it'], answer: 0, explain: 'Stepping slowly gives a smooth, realistic motion.' },
    ],
    challenges: [
      'Add a red and a green LED above each bay.',
      'Show an arrow on the matrix pointing towards the side with the most free bays.',
      'Add a second barrier on the exit lane and open it with the inside sensor.',
    ],
    code: `// Smart car park: bay sensors, a free-spaces sign and a barrier that only opens when there is room.
#include <Servo.h>
#include <LedControl.h>

const int OUTSIDE = 2, INSIDE = 3;             // IR sensors at the barrier, LOW = car
const int BAY[4] = {4, 5, 6, 7};               // one per bay, LOW = car parked
const int GATE_PIN = 9;
const int UP = 90, DOWN = 0;
const int GATE_STEP_MS = {{gatems}};              // ms per degree
const unsigned long CLEAR_MS = {{clearms}};       // inside clear this long = car is through
const unsigned long GIVE_UP_MS = 15000;

LedControl matrix(11, 13, 10, 1);              // DIN, CLK, CS
Servo gate;
const byte DIGIT[5][8] = {
  {${hexRows(DIGIT[0])}}, {${hexRows(DIGIT[1])}},
  {${hexRows(DIGIT[2])}}, {${hexRows(DIGIT[3])}},
  {${hexRows(DIGIT[4])}}};
const byte FULL[8] = {${hexRows(FULL)}};

enum State { CLOSED, OPEN };
State state = CLOSED;
int angle = DOWN, shown = -1;
bool seenInside = false;
unsigned long openedAt = 0, lastInside = 0;

void moveGate(int target) {                    // slow and smooth
  int step = target > angle ? 1 : -1;
  while (angle != target) {
    angle += step;
    gate.write(angle);
    delay(GATE_STEP_MS);
  }
}

int freeBays() {
  int n = 0;
  for (int i = 0; i < 4; i++) if (digitalRead(BAY[i]) == HIGH) n++;
  return n;
}

void setup() {
  Serial.begin(9600);
  pinMode(OUTSIDE, INPUT);
  pinMode(INSIDE, INPUT);
  for (int i = 0; i < 4; i++) pinMode(BAY[i], INPUT);
  gate.attach(GATE_PIN);
  gate.write(DOWN);
  matrix.shutdown(0, false);
  matrix.setIntensity(0, 5);
}

void loop() {
  int n = freeBays();
  if (n != shown) {                            // update the sign on change
    for (int r = 0; r < 8; r++) matrix.setRow(0, r, n > 0 ? DIGIT[n][r] : FULL[r]);
    shown = n;
    Serial.print("Free: ");
    Serial.println(n);
  }
  if (state == CLOSED && digitalRead(OUTSIDE) == LOW && n > 0) {
    Serial.println("Opening");
    moveGate(UP);
    state = OPEN;
    seenInside = false;
    openedAt = millis();
  }
  if (state == OPEN) {
    bool in = digitalRead(INSIDE) == LOW;
    if (in) {
      seenInside = true;
      lastInside = millis();
    }
    bool through = seenInside && !in && millis() - lastInside > CLEAR_MS;
    bool gaveUp = !seenInside && millis() - openedAt > GIVE_UP_MS;
    if (through || gaveUp) {
      Serial.println("Closing");
      moveGate(DOWN);
      state = CLOSED;
    }
  }
  delay(20);
}`,
    params: { gatems: { value: 12, min: 3, max: 40 }, clearms: { value: 800, min: 100, max: 3000 } },
    async setup(io, b) {
      b.park.reset();
      Object.assign(b, { state: 'CLOSED', angle: 0, shown: -1, seen: false });
      io.line('gate.write(DOWN);');
      b.park.barrier.setAngle(0);
      io.line('matrix.shutdown(0, false);');
      await io.delay(100);
    },
    async loop(io, b, p) {
      const P = b.park;
      io.line('int n = freeBays();');
      const n = P.bays.filter((x) => !x.seen).length;
      P.bays.forEach((x, i) => io.pin(`D${4 + i}`, x.seen ? 'LOW' : 'HIGH', x.seen));
      if (n !== b.shown) {
        io.line('matrix.setRow(0, r, n > 0');
        b.sign.show(n > 0 ? DIGIT[n] : FULL);
        b.shown = n;
        io.print(`Free: ${n}`);
      }
      const moveGate = async (target) => {
        io.line('void moveGate(int target)');
        io.pin('D9', `${target}°`, true);
        const steps = Math.abs(target - b.angle);
        // the sketch steps 1° per GATE_STEP_MS; the servo follows
        const t0 = performance.now();
        while (b.angle !== target) {
          const k = Math.min(1, (performance.now() - t0) / (steps * p.gatems));
          b.angle = Math.round(b.angle0 + (target - b.angle0) * k);
          P.barrier.setAngle(b.angle);
          await io.delay(20);
        }
      };
      if (b.state === 'CLOSED' && P.state.outside && n > 0) {
        io.line('Serial.println("Opening");');
        io.print('Opening');
        b.angle0 = b.angle;
        await moveGate(90);
        b.state = 'OPEN'; b.seen = false; b.openedAt = performance.now();
      }
      if (b.state === 'OPEN') {
        io.line('bool in = digitalRead(INSIDE) == LOW;');
        const inside = P.state.inside;
        io.pin('D3', inside ? 'LOW' : 'HIGH', inside);
        if (inside) { b.seen = true; b.lastInside = performance.now(); }
        const through = b.seen && !inside && performance.now() - b.lastInside > p.clearms;
        const gaveUp = !b.seen && performance.now() - b.openedAt > 15000;
        if (through || gaveUp) {
          io.line('Serial.println("Closing");');
          io.print('Closing');
          b.angle0 = b.angle;
          await moveGate(0);
          b.state = 'CLOSED';
        }
      }
      io.line('delay(20);');
      await io.delay(40);
    },
    reset(b) { b.sign.clear(); },
  },

  // ------------------------------------------------------------------ 4 · level crossing
  {
    id: 'city-level-crossing', title: 'Level crossing', icon: 'traffic', board: 'uno',
    thumb: () => { const bar = makeBarrier(v(0, 0, 0), { length: 5, lamps: true }); bar.setLamps(true, false); return bar.group; },
    view: { center: [-10, 3, -16], size: 66 },
    build(ctx) {
      const XR = -10, ZT = -22;
      ctx.step('Lay the road and the railway line with its two tunnels');
      const road = ctx.add(makeStreet(v(XR, 0, ZT), { length: 44, rotY: Math.PI / 2 }));
      const rail = ctx.add(makeRailway(v(XR, 0, ZT), { length: 70 }));
      const RW = road.roadWidth;
      ctx.step('Two half barriers with flashing lamps, one each side of the track');
      const north = ctx.add(makeBarrier(v(XR + RW / 2 + 1.2, ROAD_Y, ZT + 4.6), { length: 4.3, lamps: true, mirror: true, fork: false }));
      const south = ctx.add(makeBarrier(v(XR - RW / 2 - 1.2, ROAD_Y, ZT - 4.6), { length: 4.3, lamps: true, mirror: true, fork: false, rotY: Math.PI }));
      ctx.step('Train sensors beside the track, 26 cm each side of the crossing');
      const sw = ctx.add(makeIRObstacle(v(XR - 26, 0.3, ZT + 4.2), { rotY: Math.PI, label: 'IR train sensor (west)' }));
      const se = ctx.add(makeIRObstacle(v(XR + 26, 0.3, ZT + 4.2), { rotY: Math.PI, label: 'IR train sensor (east)' }));
      ctx.step('Loom header; the servos get their own 5 V supply');
      const hdr = ctx.add(makeHarness(v(5, 0, -6.2), ['SERVO', 'LA', 'LB', 'S_W', 'S_E', 'V+', '5V', 'GND'],
        [[north.pin('SIG'), 0xd8443a], [south.pin('SIG'), 0xd8443a, [v(south.pin('SIG').x, 0.12, ZT - 6), v(XR + 14, 0.12, ZT - 6), v(XR + 14, 0.12, -8)]], [sw.pin('OUT'), GREY, [v(sw.pin('OUT').x, 0.12, -9)]], [se.pin('OUT'), GREY]],
        { title: 'CROSSING LOOM', pinText: { S_W: 'W', S_E: 'E' } }));
      const psu = ctx.add(makeSupply(v(14, 0, -2), { rotY: Math.PI, label: '5 V 2 A' }));
      ctx.wire(psu.pin('+'), hdr.pin('V+'), 'red', { lift: 1.2 });
      ctx.wire(psu.pin('-'), hdr.pin('GND'), 'black', { lift: 1.1, dir: -1 });
      ctx.step('Servos (both) on D9, lamps D5 / D6, sensors D2 west, D3 east');
      toHeader(ctx, hdr, [['D9', 'SERVO', 'orange'], ['D5', 'LA', 'red'], ['D6', 'LB', 'red'], ['D2', 'S_W', 'white'], ['D3', 'S_E', 'white'], ['5V', '5V', 'red'], ['GND', 'GND', 'black']]);
      ctx.step('Bell: piezo buzzer on the breadboard, D8 → buzzer → GND');
      const bb = ctx.breadboard(...BB);
      const bz = named(ctx.add(makeBuzzer(bb.hole(14, 'e'), bb.hole(17, 'e'))), 'Piezo buzzer');
      ctx.wire(ctx.board.pin('D8'), bb.hole(14, 'a'), 'yellow', { signal: 'D8' });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(17, 'a'), 'black', { signal: 'GND', dir: -1 });
      // ---- road traffic stops when the crossing is closing
      const T = road.traffic;
      const st = { hold: false, auto: true, nextTrain: 6 };
      for (const z of [RW / 4, -RW / 4]) {
        const from = z > 0 ? v(-22, ROAD_Y, z) : v(22, ROAD_Y, z);
        const to = z > 0 ? v(22, ROAD_Y, z) : v(-22, ROAD_Y, z);
        const L = T.lane({ from, to, stop: 22 - 4.6 - 1.4, light: () => (st.hold ? 'red' : 'green') });
        st[z > 0 ? 'nb' : 'sb'] = L;
      }
      const acc = { nb: 0.95, sb: 0.7 };
      ctx.onTick((dt) => {
        for (const k of ['nb', 'sb']) { acc[k] += (4 / 60) * dt; if (acc[k] >= 1 && T.spawn(st[k], 11)) acc[k] -= 1; acc[k] = Math.min(acc[k], 1.2); }
        if (st.running && st.auto && !rail.train.running) { st.nextTrain -= dt; if (st.nextTrain <= 0) { rail.send(Math.random() < 0.5 ? 1 : -1, 9); st.nextTrain = 14 + Math.random() * 8; } }
        st.w = rail.occupies(-26.8, -25.2);
        st.e = rail.occupies(25.2, 26.8);
        sw.setDetect(st.w);
        se.setDetect(st.e);
      });
      ctx.interact(rail, {
        name: 'Railway', hint: 'Send a train',
        controls: [
          { type: 'button', label: 'Train from the west', press: () => { if (!rail.train.running) rail.send(1, 9); } },
          { type: 'button', label: 'Train from the east', press: () => { if (!rail.train.running) rail.send(-1, 9); } },
          { type: 'toggle', label: 'Timetable (a train every 15–20 s)', get: () => st.auto, set: (x) => (st.auto = x) },
        ],
        note: () => (rail.train.running ? `Train at x = ${rail.train.x.toFixed(0)} cm, ${rail.train.dir > 0 ? 'eastbound' : 'westbound'}` : 'No train on the line'),
      });
      ctx.anchor('north', north.lampTop);
      ctx.anchor('sw', sw.anchor);
      ctx.anchor('rail', rail.at(18, 6, 0));
      ctx.anchor('bz', bz.anchor);
      ctx.anchor('hdr', hdr.anchor);
      return { rail, north, south, sw, se, bz, st, T };
    },
    callouts: [
      { anchor: 'north', x: 0.36, y: 0.12, icon: 'traffic', title: 'Wig-wag lamps', text: 'LA and LB alternate twice a second while the crossing is active.' },
      { anchor: 'sw', x: 0.04, y: 0.17, icon: 'radar', title: 'Train sensors', text: 'The first one to see the train starts the warning; the other must see it leave.' },
      { anchor: 'rail', x: 0.7, y: 0.17, icon: 'hand', title: 'Send a train', text: 'Click the railway: from the west, the east, or on a timetable.' },
      { anchor: 'bz', x: 0.04, y: 0.68, icon: 'sound', title: 'Bell on D8', text: 'tone() rings while the barriers move and the lamps flash.' },
      { anchor: 'hdr', x: 0.36, y: 0.74, icon: 'pins', title: 'Loom + servo supply', text: 'Both barrier servos share D9 and a 5 V 2 A supply.' },
    ],
    overview: {
      heading: 'Railway level crossing',
      text: 'Builds on <b>Build a state machine</b>, <b>Sweep a servo</b> and <b>Make a sound</b>. Sensors on both sides spot a train in either direction. The crossing warns, lowers the barriers, waits until the train has passed the far sensor and the line is clear, then lifts them again.',
      features: [['code', '<code>IDLE → WARNING → LOWERING → CLOSED → RAISING</code>'], ['traffic', 'Alternating lamps with <code>millis()</code>, never <code>delay()</code>'], ['radar', 'Direction-aware: entry sensor starts it, exit sensor ends it']],
    },
    pinout: [
      ['D2, D3', 'Loom S_W, S_E', 'FC-51 OUT, LOW = train'],
      ['D9', 'Loom SERVO', 'Both barrier servos (same angle)'],
      ['D5, D6', 'Loom LA, LB', 'Lamp pairs, 220 Ω per LED on each post'],
      ['D8', 'Piezo + (row 14)', 'Bell; other leg to GND'],
      ['5 V supply + / −', 'Loom V+ / GND', 'Servo power; GND shared with the Uno'],
      ['5V, GND', 'Loom 5V, GND', 'Sensors'],
    ],
    example: {
      text: 'Real crossings start warning 20–30 s before the train arrives, using track circuits or axle counters kilometres away. The logic is the same: detect, warn, close, prove the train has gone, open.',
      points: ['On a real line the warning time is fixed by law; here <code>WARN_MS</code> is short so the model keeps up', 'Send a train while one is still passing: the exit sensor must see the last wagon leave', 'Cars that have already crossed the stop line keep going; the rest wait'],
    },
    specs: [['Model', 'H0 railway, 16.5 mm gauge, tunnels at both ends'], ['Detection', '2 × FC-51 beside the track'], ['Barriers', '2 × SG90 half barriers, 1° per <code>GATE_STEP_MS</code>'], ['Warning', '<code>WARN_MS</code> lamps + bell before lowering'], ['Libraries', 'Servo']],
    quiz: [
      { q: 'Why remember which sensor saw the train first?', options: ['The other sensor is the exit: the crossing may only open after the train has passed it', 'To count trains', 'To pick the lamp colour', 'It is not needed'], answer: 0, explain: 'A train can come from either side; the first sensor is the approach, the second proves it has left.' },
      { q: 'Why wait CLEAR_MS after the exit sensor goes clear?', options: ['Gaps between wagons would briefly clear the sensor; the wait bridges them', 'The servo needs to warm up', 'To save power', 'Because of the bell'], answer: 0, explain: 'Only a clear period longer than any coupling gap means the whole train has gone.' },
      { q: 'Why flash the lamps with millis() instead of delay()?', options: ['The sketch must keep checking the sensors and moving the barriers while it flashes', 'delay() cannot do 500 ms', 'millis() is brighter', 'LEDs need it'], answer: 0, explain: 'Every state keeps running the flasher and the sensor checks in the same loop.' },
      { q: 'Can two servos share one signal pin?', options: ['Yes: the input draws almost no current; both just need power and a common ground', 'No, never', 'Only with a resistor', 'Only on D13'], answer: 0, explain: 'The pulse goes to two high-impedance inputs; the power comes from the 5 V supply.' },
    ],
    challenges: [
      'Add a “second train coming” lamp that lights if a sensor triggers while the crossing is already closed.',
      'Use the TM1637 from <b>Production counter</b> to show seconds until the barriers open.',
      'Add a car sensor on the crossing itself: if a car is stuck, do not lower the barriers on top of it.',
    ],
    code: `// Railway level crossing: detect a train from either side, warn, close, reopen.
#include <Servo.h>

const int SENS_W = 2, SENS_E = 3;              // LOW = train beside the sensor
const int LAMP_A = 5, LAMP_B = 6;              // wig-wag pairs
const int BELL = 8, GATES = 9;
const int UP = 90, DOWN = 0;
const unsigned long WARN_MS = {{warn}};           // lamps + bell before lowering
const unsigned long CLEAR_MS = {{clearms}};       // exit sensor clear this long = gone
const int GATE_STEP_MS = 8;

enum State { IDLE, WARNING, LOWERING, CLOSED, RAISING };
State state = IDLE;
Servo gates;
int angle = UP, exitPin = -1;
bool exitSeen = false;
unsigned long since = 0, exitClear = 0, lastStep = 0;

bool train(int pin) { return digitalRead(pin) == LOW; }

void warn(bool on) {                           // alternate the lamps every 500 ms
  bool phase = (millis() / 500) % 2;
  digitalWrite(LAMP_A, on && phase);
  digitalWrite(LAMP_B, on && !phase);
  if (on && millis() % 1000 < 120) tone(BELL, 1800); else noTone(BELL);
}

bool stepGates(int target) {                   // one degree per GATE_STEP_MS
  if (angle == target) return true;
  if (millis() - lastStep >= GATE_STEP_MS) {
    lastStep = millis();
    angle += target > angle ? 1 : -1;
    gates.write(angle);
  }
  return false;
}

void setup() {
  Serial.begin(9600);
  pinMode(SENS_W, INPUT);
  pinMode(SENS_E, INPUT);
  pinMode(LAMP_A, OUTPUT);
  pinMode(LAMP_B, OUTPUT);
  gates.attach(GATES);
  gates.write(UP);
}

void loop() {
  switch (state) {
    case IDLE:
      if (train(SENS_W) || train(SENS_E)) {
        exitPin = train(SENS_W) ? SENS_E : SENS_W;   // it leaves on the other side
        exitSeen = false;
        state = WARNING;
        since = millis();
        Serial.println(exitPin == SENS_E ? "Train from the west" : "Train from the east");
      }
      break;
    case WARNING:
      if (millis() - since >= WARN_MS) state = LOWERING;
      break;
    case LOWERING:
      if (stepGates(DOWN)) { state = CLOSED; Serial.println("Closed"); }
      break;
    case CLOSED:
      if (train(exitPin)) { exitSeen = true; exitClear = millis(); }
      if (exitSeen && millis() - exitClear > CLEAR_MS) state = RAISING;
      break;
    case RAISING:
      if (stepGates(UP)) { state = IDLE; Serial.println("Open"); }
      break;
  }
  warn(state != IDLE);
}`,
    params: { warn: { value: 1500, min: 500, max: 5000 }, clearms: { value: 1500, min: 300, max: 5000 } },
    async setup(io, b) {
      b.rail.reset();
      Object.assign(b, { state: 'IDLE', angle: 90, exitW: false, exitSeen: false });
      b.north.jump(90); b.south.jump(90);
      b.st.running = true; b.st.nextTrain = 1;
      io.line('gates.write(UP);');
      await io.delay(100);
    },
    async loop(io, b, p) {
      const now = performance.now();
      const W = b.st.w, E = b.st.e;
      io.pin('D2', W ? 'LOW · train' : 'HIGH', W);
      io.pin('D3', E ? 'LOW · train' : 'HIGH', E);
      const step = (target) => {
        if (b.angle === target) return true;
        const n = Math.max(1, Math.floor((now - (b.lastStep ?? now)) / 8));
        if (now - (b.lastStep ?? 0) >= 8) {
          b.lastStep = now;
          b.angle += Math.sign(target - b.angle) * Math.min(n, Math.abs(target - b.angle));
          b.north.setAngle(b.angle); b.south.setAngle(b.angle);
          io.pin('D9', `${b.angle}°`, true);
        }
        return false;
      };
      if (b.state === 'IDLE') {
        io.line('case IDLE:');
        if (W || E) {
          b.exitE = W; b.exitSeen = false; b.state = 'WARNING'; b.since = now;
          io.line('exitPin = train(SENS_W)');
          io.print(W ? 'Train from the west' : 'Train from the east');
        }
      } else if (b.state === 'WARNING') {
        io.line('case WARNING:');
        if (now - b.since >= p.warn) b.state = 'LOWERING';
      } else if (b.state === 'LOWERING') {
        io.line('if (stepGates(DOWN))');
        if (step(0)) { b.state = 'CLOSED'; io.print('Closed'); }
      } else if (b.state === 'CLOSED') {
        io.line('case CLOSED:');
        const ex = b.exitE ? E : W;
        if (ex) { b.exitSeen = true; b.exitClear = now; }
        if (b.exitSeen && now - b.exitClear > p.clearms) b.state = 'RAISING';
      } else {
        io.line('if (stepGates(UP))');
        if (step(90)) { b.state = 'IDLE'; io.print('Open'); }
      }
      // lamps + bell (warn())
      const on = b.state !== 'IDLE';
      const ph = Math.floor(now / 500) % 2 === 1;
      b.north.setLamps(on && ph, on && !ph);
      b.south.setLamps(on && ph, on && !ph);
      io.pin('D5', on && ph ? 'HIGH' : 'LOW', on && ph);
      io.pin('D6', on && !ph ? 'HIGH' : 'LOW', on && !ph);
      const ring = on && now % 1000 < 120;
      b.bz.set(ring, 1800);
      if (ring) io.tone(1800); else io.noTone();
      b.st.hold = on;
      await io.delay(20);
    },
    reset(b, io) { b.north.setLamps(false, false); b.south.setLamps(false, false); b.bz.set(false); b.st.hold = false; b.st.running = false; b.north.jump(90); b.south.jump(90); },
  },

  // ------------------------------------------------------------------ 5 · adaptive street lights
  {
    id: 'city-street-lights', title: 'Smart street lights', icon: 'sun', board: 'uno',
    thumb: () => { const l = makeStreetLamp(v(0, 0, 0)); l.set(1); return l.group; },
    view: { center: [-6, 4, -11], size: 58 },
    build(ctx) {
      const SS = v(-4, 0, -14);
      ctx.step('Lay the street model');
      const street = ctx.add(makeStreet(SS, { length: 70 }));
      const RW = street.roadWidth;
      const LX = [-28, -12, 4, 20];
      ctx.step('Four LED street lamps along the south pavement');
      const lamps = LX.map((x) => ctx.add(makeStreetLamp(street.at(x, RW / 2 + 0.6, ROAD_Y), { rotY: Math.PI, reach: 2.8 })));
      ctx.step('Two PIR sensors on posts across the street, one per pair of lamps');
      const pirs = [-20, 12].map((x) => ctx.add(makePIRPost(street.at(x, -RW / 2 - 1.4, ROAD_Y), { height: 4.5 })));
      ctx.step('The loom header next to the Uno');
      const hdr = ctx.add(makeHarness(v(-6, 0, -1.2), ['L1', 'L2', 'L3', 'L4', 'PIR1', 'PIR2', '5V', 'GND'],
        [...lamps.map((l) => [l.foot, 0xf2c230]), ...pirs.map((p) => [p.foot, GREY, [v(p.foot.x, 0.12, -21.6), v(-34, 0.12, -21.6), v(-34, 0.12, -3)]])],
        { title: 'STREET LOOM' }));
      ctx.step('Lamps on the PWM pins D3, D5, D6, D9; PIRs on D7, D8');
      toHeader(ctx, hdr, [['D3', 'L1', 'orange'], ['D5', 'L2', 'orange'], ['D6', 'L3', 'orange'], ['D9', 'L4', 'orange'], ['D7', 'PIR1', 'white'], ['D8', 'PIR2', 'white'], ['5V', '5V', 'red'], ['GND', 'GND', 'black']]);
      ctx.step('Light sensor: LDR from 5 V to A0, 10 kΩ from A0 to GND');
      const bb = ctx.breadboard(...BB);
      const ldr = named(ctx.add(makeLDR(bb.hole(12, 'e'), bb.hole(14, 'e'))), 'Light sensor (LDR)');
      const res = named(ctx.add(makeResistor(bb.hole(14, 'g'), bb.hole(18, 'g'), 10000)), '10 kΩ resistor');
      ctx.wire(ctx.board.pin('5V'), bb.hole(12, 'a'), 'red', { signal: '5V', lift: 1.0 });
      ctx.wire(ctx.board.pin('A0'), bb.hole(14, 'a'), 'yellow', { signal: 'A0', lift: 1.2 });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(18, 'j'), 'black', { signal: 'GND', dir: -1, lift: 1.1 });
      // ---- people walking along the far pavement
      const people = [];
      const st = { day: 0.15, rate: 3, acc: 0.3 };
      const walkZ = RW / 2 + 2.9;
      const spawn = (dir) => {
        const p = makePerson(v(0, 0, 0), { shirt: [0x3b78e7, 0xe5412e, 0x3aa65a, 0xf2c230][(Math.random() * 4) | 0] });
        p.group.scale.setScalar(0.42);
        street.group.add(p.group);
        people.push({ p, x: dir > 0 ? -36 : 34, dir, v: 3.2 + Math.random() * 1.4, t: Math.random() * 6 });
      };
      spawn(1); people[0].x = -34;
      ctx.onTick((dt) => {
        ctx.setDarkness(1 - st.day);
        st.acc += (st.rate / 60) * dt;
        if (st.acc >= 1) { spawn(Math.random() < 0.5 ? 1 : -1); st.acc -= 1; }
        for (let i = people.length - 1; i >= 0; i--) {
          const q = people[i];
          q.x += q.dir * q.v * dt;
          q.t += dt * 9;
          q.p.group.position.set(q.x, ROAD_Y + Math.abs(Math.sin(q.t)) * 0.12, walkZ);
          q.p.group.rotation.y = q.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          if (Math.abs(q.x) > 36) { street.group.remove(q.p.group); people.splice(i, 1); }
        }
        // each PIR sees about 12 cm either side along the street (≈ 10 m full size)
        [-20, 12].forEach((px, i) => pirs[i].trigger(people.some((q) => Math.abs(q.x - px) < 12)));
      });
      const plot = ctx.plotter({ title: 'Lamp power', series: [{ name: 'adaptive W', color: '#2aa7a1', min: 0, max: 250 }, { name: 'always-on W', color: '#ef8a2b', min: 0, max: 250 }] });
      ctx.interact(ldr, {
        name: 'Light sensor', hint: 'Change the time of day',
        controls: [
          { type: 'range', label: 'Daylight', min: 0, max: 100, step: 1, get: () => Math.round(st.day * 100), set: (x) => (st.day = x / 100), format: (x) => `${x} %` },
          { type: 'range', label: 'People per minute', min: 0, max: 20, step: 1, get: () => st.rate, set: (x) => (st.rate = x) },
          { type: 'button', label: 'Send someone walking', press: () => spawn(Math.random() < 0.5 ? 1 : -1) },
        ],
        note: () => `A0 ≈ ${ldrRaw(st.day)} · ${people.length} people on the street`,
      });
      ctx.anchor('lamp', lamps[1].anchor);
      ctx.anchor('pir', pirs[1].anchor);
      ctx.anchor('ldr', ldr.anchor);
      ctx.anchor('hdr', hdr.anchor);
      return { street, lamps, pirs, ldr, plot, st, people, res };
    },
    callouts: [
      { anchor: 'lamp', x: 0.04, y: 0.17, icon: 'led', title: 'Dimmable LED lamps', text: 'analogWrite() 0–255 on D3, D5, D6, D9: 20 % when the street is empty.' },
      { anchor: 'pir', x: 0.36, y: 0.12, icon: 'radar', title: 'PIR per lamp pair', text: 'Someone walking by brings their two lamps to 100 % for HOLD seconds.' },
      { anchor: 'ldr', x: 0.04, y: 0.68, icon: 'sun', title: 'LDR on A0', text: 'Click it to change the time of day. Hysteresis stops flicker at dusk.' },
      { anchor: 'hdr', x: 0.36, y: 0.74, icon: 'pins', title: 'Street loom', text: 'Each lamp head has its own white LED and 100 Ω resistor.' },
    ],
    overview: {
      heading: 'Smart street lights',
      text: 'Builds on <b>Sense light</b>, <b>Motion alarm</b> and <b>Fade an LED</b>. The lamps switch on at dusk, idle at a dim glow, and brighten only where somebody is walking, then fade back. The sketch adds up the energy and the plotter compares it with lamps that burn at full power all night.',
      features: [['sun', 'Dusk detection with hysteresis: <code>DARK_ON</code> / <code>DARK_OFF</code>'], ['radar', 'Two motion zones, <code>HOLD_MS</code> after the last movement'], ['pwm', 'Smooth fades and an energy meter in watt-hours']],
    },
    pinout: [
      ['D3, D5, D6, D9 (PWM)', 'Loom L1–L4', 'White LED + 100 Ω per lamp head, ≈ 18 mA'],
      ['D7, D8', 'Loom PIR1, PIR2', 'HC-SR501 OUT, HIGH = motion'],
      ['5V, GND', 'Loom 5V, GND', 'PIR power and lamp returns'],
      ['A0', 'LDR / 10 kΩ junction', 'Brighter = higher reading'],
      ['5V, GND_2', 'LDR top, 10 kΩ bottom', 'Voltage divider'],
    ],
    example: {
      text: 'Cities replacing sodium lamps with dimmable LEDs and motion sensors cut street-lighting energy by 50–80 %. The lamps still never go fully dark at night, for safety.',
      points: ['Set <code>DIM</code> to 0 and see the saving rise, but would you walk there?', 'Bring the daylight slider up and down slowly around dusk: the hysteresis gap stops the lamps flickering', 'Raise the people per minute: the saving falls as the street gets busier'],
    },
    specs: [['Lamps', '4 × white LED, PWM 490 / 980 Hz'], ['Sensors', '2 × HC-SR501 PIR, LDR + 10 kΩ'], ['Model power', '≈ 80 mA for all four lamps at 100 %'], ['Energy model', 'Each lamp counts as a 60 W LED street light'], ['Libraries', 'None, plain Arduino']],
    quiz: [
      { q: 'Why use two thresholds (DARK_ON and DARK_OFF)?', options: ['Hysteresis: near dusk the reading wobbles, and one threshold would switch the lamps on and off repeatedly', 'Two sensors need two numbers', 'To save memory', 'PWM needs it'], answer: 0, explain: 'The lamps go on below DARK_ON and only off again above DARK_OFF, a gap noise cannot cross.' },
      { q: 'Why must the lamps be on D3, D5, D6 and D9?', options: ['They are PWM pins, so analogWrite() can dim them', 'They are the only outputs', 'They are interrupt pins', 'They give more current'], answer: 0, explain: 'On the Uno only 3, 5, 6, 9, 10 and 11 have hardware PWM.' },
      { q: 'A lamp at PWM 51 uses about how much of its full power?', options: ['20 %', '51 %', '5 %', '100 %'], answer: 0, explain: '51 / 255 = 0.2: the LED is on 20 % of each PWM cycle.' },
    ],
    challenges: [
      'Wake the next lamp pair too, in the direction the person is walking, so the light runs ahead of them.',
      'Add a fault check: a lamp that should be on but whose LDR-like sensor stays dark prints a warning.',
      'Log the night’s energy to EEPROM (<b>Remember settings</b>) at dawn.',
    ],
    code: `// Smart street lights: on at dusk, dim when empty, bright where people walk.
const int LAMP[4] = {3, 5, 6, 9};              // PWM pins
const int PIR[2] = {7, 8};                     // PIR 1: lamps 1-2, PIR 2: lamps 3-4
const int LDR = A0;                            // higher = brighter
const int DARK_ON = {{dark}};                     // switch on below this
const int DARK_OFF = DARK_ON + 60;             // and off above this (hysteresis)
const int DIM = {{dim}};                          // PWM when nobody is about
const unsigned long HOLD_MS = {{hold}} * 1000UL;  // full brightness after motion
const float FADE = 4;                          // PWM change per loop (fade speed)
const float LAMP_W = 60;                       // each lamp stands for a 60 W LED street light

bool night = false;
unsigned long lastMotion[2] = {0, 0};
float level[4] = {0, 0, 0, 0};
float usedWh = 0, fullWh = 0;
unsigned long lastRun = 0, lastPrint = 0;

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 4; i++) pinMode(LAMP[i], OUTPUT);
  for (int i = 0; i < 2; i++) pinMode(PIR[i], INPUT);
}

void loop() {
  unsigned long now = millis();
  int light = analogRead(LDR);
  if (!night && light < DARK_ON) night = true;
  if (night && light > DARK_OFF) night = false;

  for (int z = 0; z < 2; z++)
    if (digitalRead(PIR[z]) == HIGH) lastMotion[z] = now;

  float watts = 0;
  for (int i = 0; i < 4; i++) {
    unsigned long seen = lastMotion[i / 2];
    bool busy = seen != 0 && now - seen < HOLD_MS;
    int target = night ? (busy ? 255 : DIM) : 0;
    level[i] += constrain(target - level[i], -FADE, FADE);
    analogWrite(LAMP[i], (int)level[i]);
    watts += LAMP_W * level[i] / 255;
  }

  float hours = (now - lastRun) / 3600000.0;   // energy = power x time
  lastRun = now;
  usedWh += watts * hours;
  if (night) fullWh += 4 * LAMP_W * hours;

  if (now - lastPrint >= 1000) {
    lastPrint = now;
    Serial.print(watts, 0);
    Serial.print(" W  saving ");
    Serial.print(fullWh > 0 ? 100 * (1 - usedWh / fullWh) : 0, 0);
    Serial.println(" %");
  }
  delay(20);
}`,
    params: { dark: { value: 300, min: 50, max: 800 }, dim: { value: 51, min: 0, max: 255 }, hold: { value: 6, min: 1, max: 60 } },
    async setup(io, b) {
      Object.assign(b, { night: false, last: [0, 0], level: [0, 0, 0, 0], used: 0, full: 0, lastRun: performance.now(), lastPrint: 0 });
      b.plot.reset();
      io.line('for (int i = 0; i < 4; i++) pinMode');
      await io.delay(80);
    },
    async loop(io, b, p) {
      const now = performance.now();
      io.line('int light = analogRead(LDR);');
      const light = ldrRaw(b.st.day);
      io.pin('A0', `${light}`, true);
      if (!b.night && light < p.dark) { b.night = true; io.line('night = true;'); io.print('Dusk: lamps on'); }
      if (b.night && light > p.dark + 60) { b.night = false; io.line('night = false;'); io.print('Daylight: lamps off'); }
      b.pirs.forEach((q, z) => { if (q.on) b.last[z] = now; io.pin(`D${7 + z}`, q.on ? 'HIGH' : 'LOW', q.on); });
      io.line('level[i] += constrain(target - level[i], -FADE, FADE);');
      let watts = 0;
      const dtLoops = Math.max(1, Math.round((now - b.lastRun) / 20));
      b.lamps.forEach((l, i) => {
        const seen = b.last[i >> 1];
        const busy = seen !== 0 && now - seen < p.hold * 1000;
        const target = b.night ? (busy ? 255 : p.dim) : 0;
        b.level[i] += clamp(target - b.level[i], -4 * dtLoops, 4 * dtLoops);
        l.set(b.level[i] / 255);
        io.pin(['D3', 'D5', 'D6', 'D9'][i], `PWM ${Math.round(b.level[i])}`, b.level[i] > 0);
        watts += (60 * b.level[i]) / 255;
      });
      const hours = (now - b.lastRun) / 3600000;
      b.lastRun = now;
      b.used += watts * hours;
      if (b.night) b.full += 240 * hours;
      b.plot.push(Math.round(watts), b.night ? 240 : 0);
      if (now - b.lastPrint >= 1000) {
        b.lastPrint = now;
        io.line('Serial.println(" %");');
        io.print(`${Math.round(watts)} W  saving ${b.full > 0 ? Math.round(100 * (1 - b.used / b.full)) : 0} %`);
      }
      await io.delay(40);
    },
    reset(b) { b.lamps.forEach((l) => l.set(0)); },
  },
];

/** Traffic-light phase entry, mirroring enter() in the sketch. */
function enterSim(io, b, ph) {
  const L = [
    ['green', 'red'], ['amber', 'red'], ['red', 'red'], ['red', 'green'], ['red', 'amber'], ['red', 'red'],
  ][ph];
  b.phase = ph;
  b.since = performance.now();
  io.line('void enter(Phase p)');
  b.X.show('N', L[0]); b.X.show('S', L[0]);
  b.X.show('E', L[1]); b.X.show('W', L[1]);
  const pins = { red: 0, amber: 1, green: 2 };
  ['D2', 'D3', 'D4'].forEach((pin, i) => io.pin(pin, pins[L[0]] === i ? 'HIGH' : 'LOW', pins[L[0]] === i));
  ['D5', 'D6', 'D7'].forEach((pin, i) => io.pin(pin, pins[L[1]] === i ? 'HIGH' : 'LOW', pins[L[1]] === i));
  io.print(`Phase ${ph}`);
}

/** LDR + 10 kΩ divider reading for a daylight fraction (0 = night). */
function ldrRaw(day) {
  const lux = 0.5 + day * day * 2000;
  const rLdr = 1e6 * Math.pow(lux, -0.75) + 400; // ≈ 1 MΩ dark … ≈ 3 kΩ in daylight
  return Math.round((1023 * 10000) / (10000 + rLdr));
}

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['traffic', 'H0 intersection model', '1:87 table-top junction with four light poles and kerb car sensors.', 'city-adaptive-traffic'],
  ['pins', 'Model wiring loom', 'All the street devices’ wires gathered under the model to one labelled header.', 'city-adaptive-traffic'],
  ['radar', 'IR break-beam pair', 'An IR LED and a receiver facing each other; the output goes LOW when something cuts the beam.', 'city-speed-trap'],
  ['led', 'MAX7219 8×8 LED matrix', '64 red LEDs driven over three wires; LedControl’s setRow() draws a row at a time.', 'city-speed-trap'],
  ['timer', 'TM1637 4-digit display', 'Two-wire 7-segment display with a colon; TM1637Display prints numbers and raw segments.', 'city-adaptive-traffic'],
  ['servo', 'Barrier gate', 'SG90 servo with a striped boom: 0° closed, 90° open.', 'city-smart-parking'],
  ['traffic', 'Level-crossing barrier', 'Half barrier with alternating red lamps and a bell.', 'city-level-crossing'],
  ['sun', 'Dimmable street lamp', 'White LED head on a pole, dimmed with PWM.', 'city-street-lights'],
];
