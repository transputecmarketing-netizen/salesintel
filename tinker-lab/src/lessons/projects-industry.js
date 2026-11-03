// Track — Robotics & Industry: capstone builds for factory automation. Each one
// combines earlier lessons (servos, motor drivers, sensors, displays, state
// machines) into a working machine with real Arduino C++.
import * as THREE from 'three';
import { mat, box, cyl, at } from '../scene/kit.js';
import { makePot, makeButton, makeResistor } from '../scene/components.js';
import { makeOLED, makeL298N, makeRelay, makeRobotCar } from '../scene/modules.js';
import {
  makeRobotArm, armIK, ARM, makeSupply, makeBatteryPack, makeColorBlock, makeParcel, makeConveyor, makeChute, makeBin,
  makeColorSensor, makeBreakBeam, makeTM1637, makeStackLight, makeLineSensorArray, makeLineTrack, LINE_SPACING,
  makePanScanner, makeRoom, drawRadar, BLOCK_RGB, SEG,
} from '../scene/modules/industry.js';
import { textDecal } from '../scene/modules/common.js';
import { v, clamp, BB } from './helpers.js';

// ---------------------------------------------------------------- shared helpers
/** Callout anchor that follows a moving Vector3 (ctx.anchor clones what it's given). */
const live = (vec) => ({ clone: () => vec });
const JOINTS = ['base', 'shoulder', 'elbow', 'wrist', 'grip'];
const toArr = (j) => JOINTS.map((k) => Math.round(j[k]));
const toObj = (a) => Object.fromEntries(JOINTS.map((k, i) => [k, a[i]]));
const mapInt = (x, a, b, c, d) => Math.trunc(((x - a) * (d - c)) / (b - a)) + c;
const fmt = (x, n = 1) => (Math.round(x * 10 ** n) / 10 ** n).toFixed(n);

/** Label a component for the parts list. */
const named = (part, label, kind = 'part') => Object.assign(part, { label, kind });

/** Printed mat (prop) lying on the table: w × d cm, draw(ctx, s px/cm, cw, ch). */
function printedMat(w, d, draw, res = 16) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * res);
  c.height = Math.round(d * res);
  draw(c.getContext('2d'), res, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), [mat(0xe6e2d6), mat(0xe6e2d6), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), mat(0xe6e2d6), mat(0xe6e2d6), mat(0xe6e2d6)]);
  m.position.y = 0.03;
  m.receiveShadow = true;
  m.userData.label = null;
  return m;
}

/**
 * The desk-arm bench shared by the two arm lessons: arm behind the Uno (gripper
 * pointing away from you), servo hub between them, a 5 V 3 A supply for the
 * servos and a common ground. Returns { arm, root, blocks, place, wires }.
 */
function armBench(ctx, { mat: matDraw } = {}) {
  const b = ctx.board;
  const ARM_POS = v(0, 0, -16);
  if (matDraw) {
    ctx.step('Lay the printed work mat in front of the arm');
    const m = printedMat(36, 22, matDraw);
    m.position.set(0, 0.03, -29.5);
    ctx.addObject(m);
  }
  ctx.step('Stand the 4-DOF arm behind the Uno, gripper facing away from you');
  const arm = ctx.add(makeRobotArm(ARM_POS, { rotY: Math.PI }));
  const root = arm.group.parent;
  ctx.step('Put the 5 V 3 A supply next to the servo hub');
  const psu = ctx.add(makeSupply(v(7.5, 0, -8.6), { rotY: -Math.PI / 2, label: '5 V 3 A' }));
  ctx.step('Servo signals: Uno D3, D5, D6, D9, D10 → hub S1–S5');
  const wires = [];
  [['D3', 'S1', 'orange'], ['D5', 'S2', 'yellow'], ['D6', 'S3', 'green'], ['D9', 'S4', 'blue'], ['D10', 'S5', 'purple']]
    .forEach(([p, s, c], i) => wires.push(ctx.wire(b.pin(p), arm.pin(s), c, { signal: p, lift: 1.4 + i * 0.25 })));
  ctx.step('Common ground: Uno GND → hub GND');
  ctx.wire(b.pin('GND'), arm.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.2 });
  ctx.step('Servo power: supply + → hub V+, supply − → hub VGND');
  const pw = [
    ctx.wire(psu.pin('+'), arm.pin('V+'), 'red', { signal: 'V+', lift: 1.6 }),
    ctx.wire(psu.pin('-'), arm.pin('VGND'), 'black', { signal: 'GND', dir: -1, lift: 1.3 }),
  ];
  // ---- blocks that can be picked up
  const blocks = [];
  const falling = new Set();
  const place = (blk, x, y, z = 0) => {
    const w = arm.fromArm(x, y, z);
    blk.position.copy(w);
    blk.rotation.set(0, 0, 0);
    blk.userData.home = [x, y];
  };
  const supportUnder = (blk) => {
    const p = blk.position;
    let top = 0;
    for (const o of blocks) {
      if (o === blk || o === arm.holding || falling.has(o)) continue;
      if (Math.abs(o.position.x - p.x) < 2.2 && Math.abs(o.position.z - p.z) < 2.2) top = Math.max(top, o.position.y + 2.5);
    }
    return top;
  };
  ctx.onTick((dt) => {
    // gripper closes on a block whose centre is between the pads
    const g = arm.joints.grip;
    if (!arm.holding && g < 50) {
      const tcp = arm.tcp();
      const blk = blocks.find((o) => o.position.clone().add(v(0, 1.25, 0)).distanceTo(tcp) < 1.35);
      if (blk && arm.target.grip < 50) { falling.delete(blk); arm.hold(blk, 2.5); }
    } else if (arm.holding && g > 62) {
      const blk = arm.release(root);
      blk.rotation.set(0, blk.rotation.y, 0);
      falling.add(blk);
    }
    for (const blk of falling) {
      const top = supportUnder(blk);
      blk.position.y = Math.max(top, blk.position.y - dt * 40);
      if (blk.position.y <= top + 1e-3) falling.delete(blk);
    }
  });
  const anchors = { arm: arm.anchor, hub: arm.hubAnchor.clone(), psu: psu.anchor.clone() };
  ctx.anchor('arm', live(arm.anchor));
  ctx.anchor('hub', anchors.hub);
  ctx.anchor('psu', anchors.psu);
  return { arm, root, blocks, falling, place, wires, power: pw, psu };
}

/** The sketch's moveTo(): linear joint-space move, STEP_MS per degree of the longest joint. */
async function moveTo(io, arm, target, stepMs, wires) {
  const steps = Math.max(1, arm.steps(target));
  const ms = steps * stepMs;
  arm.glide(target, ms);
  const a = toArr({ ...arm.joints, ...target });
  wires?.forEach((w, i) => (w.live = true));
  ['D3', 'D5', 'D6', 'D9', 'D10'].forEach((p, i) => io.pin(p, `${a[i]}°`, true));
  await io.delay(ms);
}

// ---------------------------------------------------------------- conveyor helpers
/** Animate an item falling off the belt end into the chute and on to the bin it points at. */
function chuteFlight(item, belt, chute, bins, onLand) {
  const start = item.position.clone();
  const top = chute.top.clone();
  let t = 0, phase = 0, from = start, to = top;
  return (dt) => {
    t += dt;
    if (phase === 0) {
      const k = Math.min(1, t / 0.22);
      item.position.lerpVectors(from, to, k);
      item.position.y = lerp(from.y, to.y, k) + Math.sin(k * Math.PI) * 0.4;
      if (k >= 1) { phase = 1; t = 0; from = item.position.clone(); to = chute.mouth(); }
    } else if (phase === 1) {
      const k = Math.min(1, t / 0.4);
      to = chute.mouth();
      item.position.lerpVectors(from, to, k * k);
      item.rotation.y = chute.angle * Math.PI / 180;
      if (k >= 1) {
        // nearest bin under the mouth
        let best = bins[0], bd = Infinity;
        for (const b of bins) { const d = b.group.position.distanceTo(to.clone().setY(0)); if (d < bd) { bd = d; best = b; } }
        phase = 2; t = 0; from = item.position.clone(); to = best.slot(); item.userData.bin = best;
      }
    } else if (phase === 2) {
      const k = Math.min(1, t / 0.25);
      item.position.lerpVectors(from, to, k);
      if (k >= 1) { item.userData.bin.drop(item); onLand?.(item.userData.bin); return true; }
    }
    return false;
  };
}
const lerp = (a, b, t) => a + (b - a) * t;

export const projectsIndustry = [
  // ------------------------------------------------------------------ 1 · teach & replay arm
  {
    id: 'ind-robot-arm', title: 'Teach a robot arm', icon: 'servo', board: 'uno',
    thumb: () => makeRobotArm(v(0, 0, 0)).group,
    view: { center: [3, 5, -12], size: 44 },
    build(ctx) {
      const b = ctx.board;
      const bench = armBench(ctx, {
        mat: (c, s, cw, ch) => {
          c.fillStyle = '#f6f4ee'; c.fillRect(0, 0, cw, ch);
          c.strokeStyle = 'rgba(29,36,64,.18)'; c.lineWidth = 2;
          c.strokeRect(s, s, cw - 2 * s, ch - 2 * s);
        },
      });
      const { arm, blocks, place } = bench;
      // pick spot A / place spot B (arm frame) drawn on two coasters
      for (const [x, y, t, col] of [[-6, 11, 'A', '#2f5fbf'], [6, 11, 'B', '#3aa65a']]) {
        const p = arm.fromArm(x, y, 0.07);
        const pad = textDecal(t, 3.6, 3.6, { color: '#ffffff', bg: col, size: 0.5, font: '"Barlow Semi Condensed", sans-serif' });
        pad.position.copy(p);
        pad.rotation.z = 0;
        ctx.addObject(pad);
      }
      ctx.step('Put the red block on spot A');
      const red = makeColorBlock('red');
      ctx.addObject(red);
      place(red, -6, 11);
      blocks.push(red);
      // ---- teach pots
      ctx.step('Breadboard for the five teach knobs');
      const bb = ctx.breadboard(...BB);
      ctx.wire(b.pin('5V'), bb.hole(1, 'bot+'), 'red', { signal: '5V' });
      ctx.wire(b.pin('GND_2'), bb.hole(1, 'bot-'), 'black', { signal: 'GND', dir: -1 });
      const pots = [], potVal = [0.5, 0.63, 0.27, 0.39, 1];
      const names = ['Base', 'Shoulder', 'Elbow', 'Wrist', 'Gripper'];
      [2, 8, 14, 20, 26].forEach((c, j) => {
        ctx.step(`${names[j]} knob: 10 kΩ pot in row h, wiper → A${j}`);
        const pot = named(ctx.add(makePot([bb.hole(c, 'h'), bb.hole(c + 2, 'h'), bb.hole(c + 4, 'h')])), '10 kΩ potentiometer');
        ctx.wire(bb.hole(c, 'j'), bb.hole(c, 'bot-'), 'black', { lift: 0.35 });
        ctx.wire(bb.hole(c + 4, 'j'), bb.hole(c + 4, 'bot+'), 'red', { lift: 0.35 });
        ctx.wire(b.pin(`A${j}`), bb.hole(c + 2, 'f'), ['orange', 'yellow', 'green', 'blue', 'purple'][j], { signal: `A${j}`, lift: 1.0 + j * 0.2 });
        pot.set(potVal[j]);
        pots.push(pot);
        ctx.interact(pot, {
          name: `${names[j]} knob (A${j})`, hint: 'Turn it to move the joint',
          controls: [{ type: 'range', label: names[j], min: 0, max: 1023, step: 1, get: () => Math.round(potVal[j] * 1023), set: (x) => { potVal[j] = x / 1023; pot.set(potVal[j]); }, format: (x) => `${x} → ${mapInt(x, 0, 1023, LO[j], HI[j])}°` }],
        });
      });
      ctx.anchor('pots', pots[2].anchor);
      const cmds = [];
      const teach = [];
      ctx.interact(arm, {
        name: '4-DOF arm', hint: 'Send Serial commands or teach a demo',
        controls: [
          { type: 'button', label: 'Record pose (r)', press: () => cmds.push('r') },
          { type: 'button', label: 'Play / stop (p)', press: () => cmds.push('p') },
          { type: 'button', label: 'Clear poses (c)', press: () => cmds.push('c') },
          { type: 'button', label: 'Teach the demo: A → B', press: () => { cmds.push('c'); teach.length = 0; teach.push(...DEMO, 'p'); } },
          { type: 'button', label: 'Put the block back on A', press: () => { if (arm.holding) arm.release(bench.root); bench.falling.delete(red); place(red, -6, 11); } },
        ],
        note: () => `base ${Math.round(arm.joints.base)}° · shoulder ${Math.round(arm.joints.shoulder)}° · elbow ${Math.round(arm.joints.elbow)}° · wrist ${Math.round(arm.joints.wrist)}° · grip ${Math.round(arm.joints.grip)}°`,
      });
      return { ...bench, pots, potVal, cmds, teach, red, wiresAll: bench.wires };
    },
    callouts: [
      { anchor: 'arm', x: 0.04, y: 0.17, icon: 'servo', title: '4-DOF arm + gripper', text: 'MG90S shoulder, SG90 elbow, wrist, base and gripper. Each joint is one Servo.write().' },
      { anchor: 'hub', x: 0.36, y: 0.12, icon: 'pins', title: 'Servo hub S1–S5', text: 'Signals from D3, D5, D6, D9, D10. V+ comes from the 5 V supply, never the Uno.' },
      { anchor: 'psu', x: 0.7, y: 0.17, icon: 'bolt', title: '5 V 3 A supply', text: 'Five servos can pull 2–3 A when they stall. Its − joins the Uno GND.' },
      { anchor: 'pots', x: 0.7, y: 0.68, icon: 'knob', title: 'Teach knobs A0–A4', text: 'map(analogRead, 0, 1023, LO, HI) turns each knob into a safe joint angle.' },
      { anchor: 'usb', x: 0.04, y: 0.68, icon: 'serial', title: 'Serial: r, p, c', text: 'Record a pose, play the list back, clear it. Click the arm for buttons.' },
    ],
    overview: {
      heading: 'Teach-and-replay robot arm',
      text: 'Five knobs (<b>Turn a knob</b>) steer five servos (<b>Sweep a servo</b>). Type <code>r</code> to remember a pose, <code>p</code> to play them all back smoothly. That is how industrial robots are taught: an operator jogs the arm to each point and the controller replays the list.',
      features: [['knob', 'Pots map to safe angle ranges: <code>LO[j]…HI[j]</code>'], ['servo', '<code>moveTo()</code>: every joint arrives at the same moment'], ['serial', 'Poses kept in <code>int poses[MAX_POSES][5]</code>']],
    },
    pinout: [
      ['D3, D5, D6, D9, D10', 'Servo hub S1–S5', 'Base, shoulder, elbow, wrist, gripper signal'],
      ['Hub V+ / VGND', '5 V 3 A supply + / −', 'Servo power only'],
      ['GND', 'Hub GND', 'Common ground with the servo supply'],
      ['A0–A4', 'Pot wipers', 'Base, shoulder, elbow, wrist, gripper knobs'],
      ['5V, GND_2', 'Breadboard + / − rails', 'Pot ends (10 kΩ each, 2.5 mA total)'],
    ],
    example: {
      text: 'Factory robots are taught exactly like this with a teach pendant: jog, save waypoint, jog, save. Cobots even let you push the arm by hand and press “record”.',
      points: ['Lower <code>STEP_MS</code> for faster playback, raise it to be gentle on the gears', 'Record a pose with the gripper open just above the block: approach from above to avoid knocking it', 'Servos jump to the knob position at power-up: start with the knobs near the middle'],
    },
    specs: [['Arm', '4 axes + gripper, 8 cm upper arm, 8 cm forearm'], ['Servos', '1 × MG90S (shoulder), 4 × SG90'], ['Servo supply', '5 V 3 A adapter, common GND'], ['Pose memory', '<code>MAX_POSES</code> × 5 ints = 10 bytes each'], ['Replay speed', '<code>STEP_MS</code> per degree of the longest move'], ['Libraries', 'Servo']],
    quiz: [
      { q: 'Why do the servos get their own 5 V 3 A supply?', options: ['The Uno’s 5 V pin cannot supply the 2–3 A that five servos draw when they stall, and the board would reset', 'Servos need 12 V', 'It makes them faster', 'The Servo library requires it'], answer: 0, explain: 'USB gives about 500 mA. Servos starting together can pull amps; the voltage dips and the Uno browns out. The grounds must still be joined.' },
      { q: 'What does moveTo() do that writing each target at once does not?', options: ['It moves all joints in small steps so they finish together', 'It makes the arm stronger', 'It saves power', 'Nothing'], answer: 0, explain: 'It splits the move into as many 1° steps as the biggest joint change and scales every joint along, so the path is smooth and predictable.' },
      { q: 'Why ignore pot changes of 1°?', options: ['Analog readings jitter by a count or two; without a dead band the servos buzz', 'To save memory', 'Servos only move in 2° steps', 'It makes it faster'], answer: 0, explain: 'A tiny noisy change would re-write the servo constantly. A 1° dead band keeps it still.' },
      { q: 'How much RAM do 20 poses take?', options: ['20 × 5 × 2 bytes = 200 bytes', '20 bytes', '2 KB', '20 KB'], answer: 0, explain: 'An int is 2 bytes on the Uno; the ATmega328P has 2048 bytes of RAM in total.' },
    ],
    challenges: [
      'Add a REC push button on D2 so you can record without the computer.',
      'Store the poses in EEPROM (<b>Remember settings</b>) so the routine survives a power cut.',
      'Add an “ease in, ease out” profile to <code>moveTo()</code> so the arm starts and stops gently.',
    ],
    code: `// Teach-and-replay robot arm: knobs move the joints, Serial records poses.
#include <Servo.h>

const byte SERVO_PIN[5] = {3, 5, 6, 9, 10};    // base, shoulder, elbow, wrist, grip
const byte POT_PIN[5] = {A0, A1, A2, A3, A4};
const int LO[5] = {0, 15, 30, 0, 0};            // safe range for each joint
const int HI[5] = {180, 165, 180, 180, 90};
const int MAX_POSES = {{poses}};
const int STEP_MS = {{stepms}};                   // ms per degree when replaying
const int HOLD_MS = 300;                        // pause at each pose

Servo joint[5];
int pos[5];                                     // last angle written to each servo
int poses[MAX_POSES][5];
int count = 0;
bool playing = false;

void readKnobs(int a[5]) {
  for (int j = 0; j < 5; j++)
    a[j] = map(analogRead(POT_PIN[j]), 0, 1023, LO[j], HI[j]);
}

// every joint moves in step and arrives at the same moment
void moveTo(const int target[5]) {
  int from[5], steps = 1;
  for (int j = 0; j < 5; j++) {
    from[j] = pos[j];
    steps = max(steps, abs(target[j] - from[j]));
  }
  for (int s = 1; s <= steps; s++) {
    for (int j = 0; j < 5; j++)
      joint[j].write(from[j] + (long)(target[j] - from[j]) * s / steps);
    delay(STEP_MS);
  }
  for (int j = 0; j < 5; j++) pos[j] = target[j];
}

void setup() {
  Serial.begin(9600);
  readKnobs(pos);                               // start where the knobs are
  for (int j = 0; j < 5; j++) {
    joint[j].attach(SERVO_PIN[j]);
    joint[j].write(pos[j]);
  }
  Serial.println("r = record, p = play/stop, c = clear");
}

void loop() {
  if (Serial.available()) {
    char c = Serial.read();
    if (c == 'r' && count < MAX_POSES) {
      for (int j = 0; j < 5; j++) poses[count][j] = pos[j];
      count++;
      Serial.print("Saved pose ");
      Serial.println(count);
    } else if (c == 'p' && count > 0) {
      playing = !playing;
      Serial.println(playing ? "Playing" : "Stopped");
    } else if (c == 'c') {
      count = 0;
      playing = false;
      Serial.println("Cleared");
    }
  }
  if (playing) {
    for (int i = 0; i < count && playing; i++) {
      moveTo(poses[i]);
      delay(HOLD_MS);
      if (Serial.peek() == 'p') {                // stop between poses
        Serial.read();
        playing = false;
        Serial.println("Stopped");
      }
    }
  } else {
    int a[5];
    readKnobs(a);
    for (int j = 0; j < 5; j++) {
      if (abs(a[j] - pos[j]) > 1) {              // ignore 1-degree jitter
        joint[j].write(a[j]);
        pos[j] = a[j];
      }
    }
    delay(20);
  }
}`,
    params: { poses: { value: 20, min: 2, max: 40 }, stepms: { value: 12, min: 4, max: 20 } },
    serialInput: { placeholder: 'r · p · c' },
    async setup(io, b, p) {
      b.arm.reset(b.root);
      b.poses = [];
      b.playing = false;
      io.line('Serial.begin(9600)');
      await io.delay(60);
      io.line('readKnobs(pos);');
      b.pos = b.potVal.map((x, j) => mapInt(Math.round(x * 1023), 0, 1023, LO[j], HI[j]));
      io.line('joint[j].attach');
      b.arm.setJoints(toObj(b.pos));
      ['D3', 'D5', 'D6', 'D9', 'D10'].forEach((pin, i) => io.pin(pin, `${b.pos[i]}°`, true));
      await io.delay(300);
      io.line('Serial.println("r = record');
      io.print('r = record, p = play/stop, c = clear');
    },
    async loop(io, b, p) {
      let c = b.cmds.shift() ?? null;
      // the teach demo turns the knobs to each pose, then records it (or starts playback)
      if (!c && b.teach.length && !b.playing) {
        const item = b.teach.shift();
        if (item === 'p') c = 'p';
        else {
          item.forEach((deg, j) => { b.potVal[j] = (deg - LO[j]) / (HI[j] - LO[j]); b.pots[j].set(b.potVal[j]); });
          await knobFollow(io, b);
          await io.delay(350);
          await knobFollow(io, b);
          c = 'r';
        }
      }
      if (!c) {
        const line = io.readLine();
        if (line != null) c = line.trim()[0] ?? null;
      }
      if (c) {
        io.line('if (Serial.available())');
        if (c === 'r' && b.poses.length < p.poses) {
          io.line("if (c == 'r'");
          b.poses.push([...b.pos]);
          io.line('Serial.println(count)');
          io.print(`Saved pose ${b.poses.length}`);
        } else if (c === 'p' && b.poses.length > 0) {
          b.playing = !b.playing;
          io.line('playing = !playing');
          io.print(b.playing ? 'Playing' : 'Stopped');
        } else if (c === 'c') {
          io.line("} else if (c == 'c')");
          b.poses = []; b.playing = false;
          io.print('Cleared');
        }
      }
      if (b.playing) {
        for (let i = 0; i < b.poses.length && b.playing; i++) {
          io.line('moveTo(poses[i]);');
          await moveTo(io, b.arm, toObj(b.poses[i]), p.stepms);
          b.pos = [...b.poses[i]];
          io.line('delay(HOLD_MS);');
          await io.delay(300);
          const nx = b.cmds[0] ?? null;
          const typed = nx ? null : io.readLine();
          if (nx === 'p' || (typed && typed.trim()[0] === 'p')) {
            if (nx) b.cmds.shift();
            io.line("if (Serial.peek() == 'p')");
            b.playing = false;
            io.print('Stopped');
          } else if (typed && typed.trim()) b.cmds.unshift(typed.trim()[0]);
        }
      } else {
        await knobFollow(io, b);
        io.line('delay(20);');
        await io.delay(20);
      }
    },
    reset(b) { b.arm.reset(b.root); b.playing = false; },
  },

  // ------------------------------------------------------------------ 2 · inverse kinematics
  {
    id: 'ind-ik-arm', title: 'Arm inverse kinematics', icon: 'gear', board: 'uno',
    thumb: () => { const a = makeRobotArm(v(0, 0, 0)); a.setJoints({ base: 90, shoulder: 60, elbow: 100, wrist: 30 }); for (let i = 0; i < 60; i++) a.tick(0.05); return a.group; },
    view: { center: [0, 5, -18], size: 46 },
    build(ctx) {
      const bench = armBench(ctx, { mat: drawGridMat });
      const { arm, blocks, place } = bench;
      const cols = ['red', 'blue', 'yellow', 'green'];
      ctx.step('Place three blocks on the grid at the coordinates in BLOCKS[]');
      const pool = cols.map((c) => { const blk = makeColorBlock(c); ctx.addObject(blk); blocks.push(blk); return blk; });
      const state = { layout: 'a', extra: null };
      const layout = (k) => {
        state.layout = k;
        if (arm.holding) arm.release(bench.root);
        bench.falling.clear();
        [...IK_LAYOUTS[k], IK_SPARE].forEach(([x, y], i) => place(pool[i], x, y));
        pool[3].visible = false;
        pool[3].position.set(0, -50, 0);
        state.extra = null;
      };
      layout('a');
      const stackPad = textDecal('STACK', 3.4, 3.4, { color: '#ffffff', bg: '#3aa65a', size: 0.32, font: '"Barlow Semi Condensed", sans-serif' });
      stackPad.position.copy(arm.fromArm(STACK.x, STACK.y, 0.07));
      ctx.addObject(stackPad);
      ctx.anchor('stack', arm.fromArm(STACK.x, STACK.y, 3));
      ctx.anchor('grid', arm.fromArm(-9, 15, 0.5));
      ctx.interact(arm, {
        name: '4-DOF arm', hint: 'Reset the blocks or drop a new one',
        controls: [
          { type: 'button', label: 'Put the blocks back', press: () => layout(state.layout) },
          {
            type: 'button', label: 'Drop a green block somewhere new', press: () => {
              const r = 9 + Math.random() * 5, a = (Math.random() - 0.5) * 1.4;
              const x = Math.round(Math.sin(a) * r), y = Math.round(Math.cos(a) * r);
              if (Math.hypot(x - STACK.x, y - STACK.y) < 4) return;
              pool[3].visible = true;
              bench.falling.delete(pool[3]);
              place(pool[3], x, y);
              state.extra = [x, y];
            },
          },
        ],
        note: () => {
          const t = arm.toArm(arm.tcp());
          return `Gripper at x ${fmt(t.x)} cm, y ${fmt(t.y)} cm, z ${fmt(t.z)} cm${state.extra ? ` · green block at ${state.extra[0]} ${state.extra[1]} (type that)` : ''}`;
        },
      });
      const plot = ctx.plotter({ title: 'Joint angles', series: [{ name: 'base', color: '#2f5fbf', min: 0, max: 180 }, { name: 'shoulder', color: '#ef8a2b', min: 0, max: 180 }, { name: 'elbow', color: '#3aa65a', min: 0, max: 180 }, { name: 'wrist', color: '#8a5cc6', min: 0, max: 180 }] });
      ctx.onTick(() => { if (bench.plotOn) plot.push(...toArr(arm.joints).slice(0, 4)); });
      return { ...bench, pool, state, layout, plot };
    },
    callouts: [
      { anchor: 'arm', x: 0.04, y: 0.17, icon: 'servo', title: 'Gripper straight down', text: 'solve() works backwards from x, y, z to four servo angles.' },
      { anchor: 'grid', x: 0.36, y: 0.12, icon: 'gear', title: 'Arm coordinates', text: 'x right, y forward, z up, in cm, from the centre of the base.' },
      { anchor: 'stack', x: 0.7, y: 0.17, icon: 'check', title: 'Stack at (6, 8)', text: 'Each block lands 2.5 cm higher than the last; three fit.' },
      { anchor: 'hub', x: 0.04, y: 0.68, icon: 'pins', title: 'Same wiring as Teach', text: 'D3–D10 to S1–S5, 5 V 3 A on V+, grounds joined.' },
    ],
    overview: {
      heading: 'Inverse kinematics: pick by coordinates',
      text: 'Builds on <b>Teach a robot arm</b>. Instead of teaching angles, tell the arm where a block is in centimetres. Trigonometry (the law of cosines) turns x, y, z into base, shoulder, elbow and wrist angles, so the gripper arrives pointing straight down.',
      features: [['gear', '<code>solve(x, y, z, out)</code>: law of cosines, elbow up'], ['servo', '<code>pickAndStack()</code>: hover, descend, grip, lift, stack'], ['serial', 'Type <code>x y</code> to pick a block anywhere in reach']],
    },
    pinout: [
      ['D3, D5, D6, D9, D10', 'Servo hub S1–S5', 'Base, shoulder, elbow, wrist, gripper'],
      ['Hub V+ / VGND', '5 V 3 A supply + / −', ''],
      ['GND', 'Hub GND', 'Common ground'],
    ],
    example: {
      text: 'Every industrial arm, 3D printer and camera crane solves inverse kinematics: you give it a point in space, it computes the joint angles many times a second.',
      points: ['Measure your own arm and put its lengths in <code>H, L1, L2, L3</code>', 'Out-of-reach points print a message instead of slamming the joints', 'Try <code>HOVER</code> lower: the arm moves faster but may brush other blocks'],
    },
    specs: [['Geometry', 'H 6, L1 8, L2 8, L3 6.5 cm'], ['Reach', '≈ 7–15 cm from the base centre at table height'], ['Accuracy', '≈ ±3 mm (servo resolution 1°)'], ['Maths', '<code>sqrt</code>, <code>atan2</code>, <code>acos</code> in float'], ['Libraries', 'Servo, math.h']],
    quiz: [
      { q: 'What does atan2(x, y) give the base servo?', options: ['The direction of the target seen from above', 'The distance to the target', 'The height of the target', 'The gripper angle'], answer: 0, explain: 'From above, the arm only needs to turn towards the point; the rest is a 2D problem in that vertical plane.' },
      { q: 'Why add L3 to the target height before solving?', options: ['The gripper points straight down, so the wrist must sit L3 above the block', 'To make it reach further', 'Because L3 is the shoulder height', 'It is a typo'], answer: 0, explain: 'The two-link solution places the wrist joint; the gripper hangs L3 below it.' },
      { q: 'solve() returns false when d > L1 + L2. What does that mean?', options: ['The point is further than the two links can stretch', 'The point is too close', 'The servo is broken', 'The block is too heavy'], answer: 0, explain: 'Even fully straight, the upper arm plus forearm cannot reach; the law of cosines would take acos of a number below −1.' },
      { q: 'Why hover above a block before going down?', options: ['To approach vertically and not knock the block or its neighbours', 'To save power', 'Servos need warming up', 'To measure the block'], answer: 0, explain: 'Joint-space moves sweep a curve; going straight down from a hover point makes the last bit predictable.' },
    ],
    challenges: [
      'Make <code>STACK_X</code> and <code>STACK_Y</code> settable over Serial with a command such as <code>s 6 9</code>.',
      'Move in straight lines: split each move into 1 cm steps and call <code>solve()</code> for every step.',
      'Add an ultrasonic sensor (<b>Read a sensor</b>) that finds the block’s y position on its own.',
    ],
    code: `// Inverse kinematics: give the arm x, y (cm), it works out the angles.
#include <Servo.h>
#include <math.h>

const byte PIN[5] = {3, 5, 6, 9, 10};           // base, shoulder, elbow, wrist, grip
const float H = 6.0, L1 = 8.0, L2 = 8.0, L3 = 6.5;  // shoulder height, links, gripper (cm)
const int GRIP_OPEN = 90, GRIP_CLOSED = {{grip}};
const int STEP_MS = {{stepms}};                   // ms per degree
const float BLOCK = 2.5;                        // cube size, cm
const float HOVER = {{hover}};                     // safe height above the table, cm
const float STACK_X = 6.0, STACK_Y = 8.0;
const int MAX_STACK = 3;
const float BLOCKS[][2] = {{-7, 11}, {-2, 12}};   // the third block waits for you

Servo joint[5];
int pos[5] = {90, 110, 70, 70, GRIP_OPEN};
int stacked = 0;

// x right, y forward, z up (cm) -> angles with the gripper pointing straight down
bool solve(float x, float y, float z, int out[4]) {
  float r = sqrt(x * x + y * y);
  float wz = z + L3 - H;                        // wrist height above the shoulder
  float d = sqrt(r * r + wz * wz);
  if (d > L1 + L2 - 0.1 || d < 2.0) return false;
  float a1 = atan2(wz, r) + acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  float a2 = acos((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2));
  float fore = a1 - (PI - a2);                  // forearm angle from horizontal
  out[0] = round(90 - degrees(atan2(x, y)));     // servo turns anticlockwise
  out[1] = round(degrees(a1));
  out[2] = round(degrees(a2));
  out[3] = round(120 + degrees(-HALF_PI - fore));  // horn: 120 = in line
  for (int j = 0; j < 4; j++)
    if (out[j] < 0 || out[j] > 180) return false;
  return true;
}

void moveTo(const int t[5]) {                   // joints arrive together
  int from[5], steps = 1;
  for (int j = 0; j < 5; j++) { from[j] = pos[j]; steps = max(steps, abs(t[j] - pos[j])); }
  for (int s = 1; s <= steps; s++) {
    for (int j = 0; j < 5; j++) joint[j].write(from[j] + (long)(t[j] - from[j]) * s / steps);
    delay(STEP_MS);
  }
  for (int j = 0; j < 5; j++) pos[j] = t[j];
}

bool goTo(float x, float y, float z, int grip) {
  int t[5];
  if (!solve(x, y, z, t)) {
    Serial.println("Out of reach");
    return false;
  }
  t[4] = grip;
  moveTo(t);
  return true;
}

void pickAndStack(float x, float y) {
  if (stacked >= MAX_STACK) {
    Serial.println("Stack full");
    return;
  }
  float top = max(HOVER, (stacked + 1) * BLOCK + 1.0);  // carry over the stack
  if (!goTo(x, y, HOVER, GRIP_OPEN)) return;
  goTo(x, y, BLOCK / 2, GRIP_OPEN);             // down around the block
  goTo(x, y, BLOCK / 2, GRIP_CLOSED);           // grip
  goTo(x, y, top, GRIP_CLOSED);
  goTo(STACK_X, STACK_Y, top, GRIP_CLOSED);
  goTo(STACK_X, STACK_Y, BLOCK / 2 + stacked * BLOCK, GRIP_CLOSED);
  goTo(STACK_X, STACK_Y, BLOCK / 2 + stacked * BLOCK, GRIP_OPEN);
  goTo(STACK_X, STACK_Y, top, GRIP_OPEN);
  stacked++;
}

void setup() {
  Serial.begin(9600);
  for (int j = 0; j < 5; j++) {
    joint[j].attach(PIN[j]);
    joint[j].write(pos[j]);
  }
  delay(500);
  for (auto &b : BLOCKS) pickAndStack(b[0], b[1]);
  Serial.println("Send x y (cm) to pick another block");
}

void loop() {
  if (Serial.available()) {
    float x = Serial.parseFloat();
    float y = Serial.parseFloat();
    Serial.print("Pick at ");
    Serial.print(x);
    Serial.print(", ");
    Serial.println(y);
    pickAndStack(x, y);
  }
}`,
    params: { grip: { value: 20, min: 0, max: 60 }, stepms: { value: 8, min: 3, max: 20 }, hover: { value: 5, min: 4, max: 9 } },
    serialInput: { placeholder: 'x y   e.g. 5 12' },
    async setup(io, b, p) {
      b.layout(b.state.layout);
      b.arm.reset(b.root);
      b.stacked = 0;
      b.plot.reset();
      b.plotOn = true;
      io.line('Serial.begin(9600)');
      io.line('joint[j].write(pos[j]);');
      await io.delay(500);
      for (const [i, [x, y]] of IK_BLOCKS.entries()) {
        io.line('for (auto &b : BLOCKS)');
        await pickAndStack(io, b, p, x, y, i);
      }
      io.line('Serial.println("Send x y');
      io.print('Send x y (cm) to pick another block');
      io.print(`(the yellow block is at ${IK_SPARE[0]} ${IK_SPARE[1]})`);
    },
    async loop(io, b, p) {
      const line = io.readLine();
      if (line == null) { await io.delay(50); return; }
      const nums = (line.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
      const x = nums[0] ?? 0, y = nums[1] ?? 0;
      io.line('if (Serial.available())');
      io.line('Serial.println(y);');
      io.print(`Pick at ${x.toFixed(2)}, ${y.toFixed(2)}`);
      await pickAndStack(io, b, p, x, y);
    },
    reset(b) { b.plotOn = false; },
  },
  // ------------------------------------------------------------------ 3 · colour sorting line
  {
    id: 'ind-conveyor-sort', title: 'Colour sorting line', icon: 'palette', board: 'uno',
    thumb: () => { const c = makeConveyor(v(0, 0, 0), { length: 16 }); for (const [k, x] of [['red', -4], ['blue', 2]]) { const o = makeColorBlock(k); o.position.set(x, 6, 0); c.group.add(o); } return c.group; },
    view: { center: [2, 4, -9], size: 52 },
    build(ctx) {
      const b = ctx.board;
      ctx.step('Set up the conveyor behind the Uno, belt running left to right');
      const belt = ctx.add(makeConveyor(v(-2, 0, -16), { length: 34, maxSpeed: 9 }));
      const SX = -6, BX = -4.4; // sensor and beam positions along the belt (s)
      ctx.step('Bridge the TCS34725 over the belt, sensor facing down');
      const tcs = ctx.add(makeColorSensor(v(-2 + SX, 0, -16), { bridge: 7.8, height: 9.7, spotY: 6 }));
      ctx.step('IR break-beam across the belt, just past the colour sensor');
      const beam = ctx.add(makeBreakBeam(v(-2 + BX, 7.3, -20.4), v(-2 + BX, 7.3, -11.6), { out: v(0, 0, 1.6), outA: v(0, 0, -1.6) }));
      ctx.step('Servo chute and five bins at the end of the belt');
      const chute = ctx.add(makeChute(v(18.6, 0, -16), { height: 5, length: 9.5 }));
      const BINS = [['red', 0xe0402e, 'RED'], ['green', 0x3aa65a, 'GREEN'], ['none', 0x8a8d94, '?'], ['blue', 0x3a6fd0, 'BLUE'], ['yellow', 0xe0b020, 'YELLOW']];
      const bins = BINS.map(([k, c, t], i) => {
        const deg = SORT_DEG[i];
        const m = chute.mouth(deg).setY(0);
        const bin = ctx.add(makeBin(m, { color: c, tag: t, width: 4.4, depth: 4.4, height: 2.0, rotY: (deg - 90) * Math.PI / 180 + Math.PI / 2, label: 'Sorting bin' }));
        bin.key = k;
        return bin;
      });
      ctx.step('Breadboard power rails');
      const bb = ctx.breadboard(...BB);
      ctx.wire(b.pin('5V'), bb.hole(2, 'top+'), 'red', { signal: '5V' });
      ctx.wire(b.pin('GND'), bb.hole(3, 'top-'), 'black', { signal: 'GND', dir: -1 });
      ctx.step('TCS34725: VIN → 5 V, GND, SDA → SDA (A4), SCL → SCL (A5)');
      ctx.wire(bb.hole(6, 'top+'), tcs.pin('VIN'), 'red', { lift: 3 });
      ctx.wire(bb.hole(7, 'top-'), tcs.pin('GND'), 'black', { lift: 3.2 });
      ctx.wire(b.pin('SDA'), tcs.pin('SDA'), 'blue', { signal: 'SDA', lift: 3.4 });
      ctx.wire(b.pin('SCL'), tcs.pin('SCL'), 'yellow', { signal: 'SCL', lift: 3.6 });
      ctx.step('Break-beam: both halves on 5 V / GND, receiver OUT → D2');
      ctx.wire(bb.hole(9, 'top+'), beam.pin('RX+'), 'red', { lift: 1.5 });
      ctx.wire(bb.hole(10, 'top-'), beam.pin('RX-'), 'black', { lift: 1.6 });
      const beamW = ctx.wire(b.pin('D2'), beam.pin('OUT'), 'white', { signal: 'D2', lift: 1.8 });
      ctx.wire(bb.hole(12, 'top+'), beam.pin('TX+'), 'red', { lift: 2, bend: v(0, 7, 0) });
      ctx.wire(bb.hole(13, 'top-'), beam.pin('TX-'), 'black', { lift: 2, bend: v(0, 7.4, 0) });
      ctx.step('TM1637 counter display behind the Uno: CLK → D3, DIO → D4');
      const disp = ctx.add(makeTM1637(v(2, 0, -7.6)));
      ctx.wire(b.pin('D3'), disp.pin('CLK'), 'green', { signal: 'D3', lift: 1.2 });
      ctx.wire(b.pin('D4'), disp.pin('DIO'), 'blue', { signal: 'D4', lift: 1.3 });
      ctx.wire(bb.hole(15, 'top+'), disp.pin('VCC'), 'red', { lift: 1.6 });
      ctx.wire(bb.hole(16, 'top-'), disp.pin('GND'), 'black', { lift: 1.7 });
      ctx.step('L298N for the belt motor, with a 6 V battery pack');
      const drv = ctx.add(makeL298N(v(-11, 0, -5), { rotY: Math.PI, jumpers: false }));
      const bat = ctx.add(makeBatteryPack(v(-20, 0, -3)));
      [['D5', 'ENA', 'orange'], ['D7', 'IN1', 'yellow'], ['D8', 'IN2', 'green']].forEach(([p, q, c], i) => ctx.wire(b.pin(p), drv.pin(q), c, { signal: p, lift: 1.2 + i * 0.2 }));
      const motorW = [
        ctx.wire(bat.pin('+'), drv.pin('12V'), 'red', { signal: '6V', lift: 1.4 }),
        ctx.wire(bat.pin('-'), drv.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.2 }),
        ctx.wire(drv.pin('OUT1'), belt.pin('M+'), 'red', { lift: 1.4 }),
        ctx.wire(drv.pin('OUT2'), belt.pin('M-'), 'black', { lift: 1.6 }),
      ];
      ctx.wire(drv.pin('GND'), b.pin('GND_2'), 'black', { signal: 'GND', dir: -1, lift: 2.2 });
      ctx.step('Chute servo: SIG → D9, power from its own 5 V supply, grounds joined');
      const psu = ctx.add(makeSupply(v(24, 0, 2), { rotY: Math.PI, label: '5 V 2 A' }));
      ctx.wire(b.pin('D9'), chute.pin('SIG'), 'orange', { signal: 'D9', lift: 2.6 });
      ctx.wire(psu.pin('+'), chute.pin('V+'), 'red', { lift: 2.0 });
      ctx.wire(psu.pin('-'), chute.pin('GND'), 'black', { lift: 2.2 });
      ctx.wire(psu.pin('-'), bb.hole(29, 'top-'), 'black', { dir: -1, lift: 1.5 });

      // ---- simulation state
      const root = belt.group.parent;
      const fly = [];
      const st = { auto: true, next: 'red', feedT: 1.5 };
      const pool = [];
      const spawn = (key) => {
        if (belt.items.some((t) => t.s < -15 + 4.5)) return false;
        const blk = pool.pop() ?? (() => { const o = key === 'purple' ? makeColorBlock(0x8a5cc6) : makeColorBlock(key); root.add(o); return o; })();
        blk.userData.key = key;
        blk.visible = true;
        belt.place(blk, -15, 0);
        return true;
      };
      const rnd = () => ['red', 'green', 'blue', 'yellow'][(Math.random() * 4) | 0];
      belt.onEnd((it) => { fly.push(chuteFlight(it.obj, belt, chute, bins)); });
      const box3 = new THREE.Box3();
      ctx.onTick((dt) => {
        if (st.running && st.auto) {
          st.feedT -= dt;
          if (st.feedT <= 0 && spawn(Math.random() < 0.08 ? 'purple' : rnd())) st.feedT = 3.5 + Math.random() * 2;
        }
        for (let i = fly.length - 1; i >= 0; i--) if (fly[i](dt)) fly.splice(i, 1);
        let blocked = false;
        for (const t of belt.items) { box3.setFromCenterAndSize(t.obj.position.clone().add(v(0, 1.25, 0)), v(2.5, 2.5, 2.5)); if (beam.cuts(box3)) blocked = true; }
        beam.setBlocked(blocked);
        st.blocked = blocked;
        const under = belt.items.find((t) => Math.abs(t.s - SX) < 1.4);
        tcs.sample(under ? (BLOCK_RGB[under.obj.userData.key]?.hex ?? 0x8a5cc6) : null);
        motorW.forEach((w) => (w.live = Math.abs(belt.power) > 0));
      });
      ctx.interact(belt, {
        name: 'Conveyor', hint: 'Feed blocks onto the belt',
        controls: [
          { type: 'toggle', label: 'Auto feed', get: () => st.auto, set: (x) => (st.auto = x) },
          { type: 'choice', label: 'Next block', options: [['red', 'Red'], ['green', 'Green'], ['blue', 'Blue'], ['yellow', 'Yellow'], ['purple', 'Purple (unknown)']], get: () => st.next, set: (k) => (st.next = k) },
          { type: 'button', label: 'Drop it on the belt', press: () => spawn(st.next) },
          { type: 'button', label: 'Empty the bins', press: () => bins.forEach((bn) => bn.clear().forEach((o) => { o.visible = false; pool.push(o); })) },
        ],
        note: () => `Belt ${fmt(belt.speed)} cm/s · ${belt.items.length} on the belt · beam ${st.blocked ? 'BLOCKED' : 'clear'}`,
      });
      ctx.anchor('tcs', tcs.anchor);
      ctx.anchor('beam', beam.pin('OUT').clone().add(v(0, 1.5, 0)));
      ctx.anchor('chute', chute.anchor);
      ctx.anchor('disp', disp.anchor);
      ctx.anchor('drv', drv.anchor);
      return { belt, tcs, beam, chute, bins, disp, drv, st, spawn, fly, pool, beamW };
    },
    callouts: [
      { anchor: 'tcs', x: 0.04, y: 0.17, icon: 'palette', title: 'TCS34725 on I²C', text: 'Red, green, blue and clear counts; its white LED lights the block evenly.' },
      { anchor: 'beam', x: 0.36, y: 0.12, icon: 'radar', title: 'Break-beam → D2', text: 'LOW the moment a block cuts the beam: stop the belt and read.' },
      { anchor: 'chute', x: 0.7, y: 0.17, icon: 'servo', title: 'Chute servo D9', text: 'Turns to 30°, 60°, 120° or 150° for each colour; 90° is the reject bin.' },
      { anchor: 'drv', x: 0.04, y: 0.68, icon: 'motor', title: 'L298N + 6 V pack', text: 'ENA PWM sets belt speed; the motor never runs from the Uno.' },
      { anchor: 'disp', x: 0.36, y: 0.74, icon: 'timer', title: 'TM1637 count', text: 'Shows the last colour’s letter and how many of it so far.' },
    ],
    overview: {
      heading: 'Colour sorting conveyor',
      text: 'A belt (<b>Drive motors both ways</b>) brings each block to a light barrier; the Uno stops it, reads its colour over I²C (<b>The I²C bus</b>), turns a servo chute (<b>Sweep a servo</b>) to the right bin and counts it on a 4-digit display.',
      features: [['palette', 'Nearest-colour match on chromaticity r/(r+g+b)'], ['radar', 'Break-beam stop: no guessing where the block is'], ['timer', '<code>TM1637Display</code>: letter + count per colour']],
    },
    pinout: [
      ['SDA (A4), SCL (A5)', 'TCS34725 SDA, SCL', 'I²C address 0x29; VIN on 5 V'],
      ['D2', 'Break-beam OUT', 'Open collector: INPUT_PULLUP, LOW = blocked'],
      ['D5 ~, D7, D8', 'L298N ENA, IN1, IN2', 'Belt speed and direction (ENA jumper off)'],
      ['D9', 'Chute servo SIG', 'Servo V+ from the 5 V 2 A supply'],
      ['D3, D4', 'TM1637 CLK, DIO', 'VCC 5 V'],
      ['6 V pack → L298N 12V / GND', 'L298N GND → Uno GND', 'Motor supply, common ground'],
      ['5 V supply − → breadboard −', 'Servo GND', 'Common ground'],
    ],
    example: {
      text: 'Recycling plants, sweet factories and seed sorters use the same idea with faster cameras and air jets instead of a servo chute: detect, classify, divert.',
      points: ['Calibrate <code>REF[]</code>: print the r/g/b fractions for each of your blocks under your lighting', 'Drop a purple block: it is too far from every reference and goes to the reject bin', 'Raise <code>BELT_PWM</code> until blocks start overshooting the sensor, then back off'],
    },
    specs: [['Conveyor', '34 cm belt, TT gear motor, ≈ 9 cm/s at full PWM'], ['Colour sensor', 'TCS34725, 50 ms integration, gain 4×'], ['Classifier', 'Euclidean distance in r, g, b chromaticity'], ['Diverter', 'SG90 chute, 5 positions'], ['Display', 'TM1637 4-digit, 0.36"'], ['Libraries', 'Wire, Servo, Adafruit_TCS34725, TM1637Display']],
    quiz: [
      { q: 'Why divide each channel by r + g + b before comparing?', options: ['So the result depends on the colour, not on how bright the light is', 'To make the numbers bigger', 'The sensor needs it', 'To save memory'], answer: 0, explain: 'A block closer to the LED reads brighter on every channel; the fractions stay almost the same.' },
      { q: 'Why stop the belt before reading?', options: ['The sensor integrates for 50 ms: a moving block would smear between colours and the belt', 'To save battery', 'The servo needs it', 'I²C does not work while the motor runs'], answer: 0, explain: 'A stationary block under the sensor gives a clean, repeatable reading.' },
      { q: 'The receiver output is “open collector”. What does the sketch need?', options: ['INPUT_PULLUP so the pin reads HIGH until the receiver pulls it LOW', 'A 12 V supply', 'An analog pin', 'Nothing at all'], answer: 0, explain: 'Open collector can only pull down; the pull-up supplies the HIGH level.' },
      { q: 'What happens to a colour that is far from all four references?', options: ['classify() returns NONE and the chute sends it to the 90° reject bin', 'It goes in the red bin', 'The belt stops forever', 'The Uno resets'], answer: 0, explain: 'bestD starts at MAX_DIST, so nothing is matched unless it is close enough.' },
    ],
    challenges: [
      'Add a “calibrate” mode: press a button with a block under the sensor and store its r, g, b fractions as the reference.',
      'Show the total of all colours when no block has passed for 10 s.',
      'Replace the chute with two servo flaps along the belt so blocks are pushed off sideways.',
    ],
    code: `// Colour sorting line: stop at the sensor, read the colour, turn the chute.
#include <Wire.h>
#include <Servo.h>
#include <Adafruit_TCS34725.h>
#include <TM1637Display.h>

const int ENA = 5, IN1 = 7, IN2 = 8;           // belt motor on L298N channel A
const int BEAM = 2;                            // break-beam receiver: LOW = blocked
const int CHUTE_PIN = 9;
const int CLK = 3, DIO = 4;                    // TM1637
const int BELT_PWM = {{belt}};
const float MAX_DIST = {{tol}} / 100.0;           // how close a colour must be to match

enum { RED, GREEN, NONE, BLUE, YELLOW };
const char *NAME[] = {"red", "green", "unknown", "blue", "yellow"};
const int CHUTE_DEG[] = {30, 60, 90, 120, 150};  // one bin per class, 90 = reject
const uint8_t LETTER[] = {0x50, 0x3D, 0x40, 0x7C, 0x6E};  // r G - b y
// r, g, b fractions of each block measured under the sensor's LED
const int CLASSES[] = {RED, GREEN, BLUE, YELLOW};
const float REF[4][3] = {{0.58, 0.22, 0.20}, {0.27, 0.45, 0.28}, {0.20, 0.31, 0.49}, {0.44, 0.40, 0.16}};

Adafruit_TCS34725 tcs(TCS34725_INTEGRATIONTIME_50MS, TCS34725_GAIN_4X);
Servo chute;
TM1637Display display(CLK, DIO);
int counts[5] = {0};

void belt(int pwm) {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, pwm);
}

int classify(uint16_t r, uint16_t g, uint16_t b) {
  float sum = (float)r + g + b;
  if (sum < 30) return NONE;                   // too dark: nothing there
  float f[3] = {r / sum, g / sum, b / sum};
  int best = NONE;
  float bestD = MAX_DIST;
  for (int i = 0; i < 4; i++) {
    float d = sqrt(sq(f[0] - REF[i][0]) + sq(f[1] - REF[i][1]) + sq(f[2] - REF[i][2]));
    if (d < bestD) {
      bestD = d;
      best = CLASSES[i];
    }
  }
  return best;
}

void setup() {
  Serial.begin(9600);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(ENA, OUTPUT);
  pinMode(BEAM, INPUT_PULLUP);
  chute.attach(CHUTE_PIN);
  chute.write(90);
  display.setBrightness(5);
  display.showNumberDec(0);
  if (!tcs.begin()) {
    Serial.println("No TCS34725 found");
    while (true) {}
  }
  belt(BELT_PWM);
}

void loop() {
  if (digitalRead(BEAM) == HIGH) return;       // nothing at the sensor yet
  belt(0);                                     // stop with the block under the sensor
  delay(250);                                  // settle; one reading takes 50 ms
  uint16_t r, g, b, c;
  tcs.getRawData(&r, &g, &b, &c);
  int k = classify(r, g, b);
  counts[k]++;
  Serial.print(NAME[k]);
  Serial.print("  r=");
  Serial.print(r);
  Serial.print(" g=");
  Serial.print(g);
  Serial.print(" b=");
  Serial.println(b);
  chute.write(CHUTE_DEG[k]);
  display.setSegments(&LETTER[k], 1, 0);       // letter, then that colour's count
  display.showNumberDec(counts[k], false, 3, 1);
  delay(300);                                  // chute in place before the block arrives
  belt(BELT_PWM);
  while (digitalRead(BEAM) == LOW) delay(5);   // wait until the block moves on
}`,
    params: { belt: { value: 170, min: 90, max: 255 }, tol: { value: 12, min: 3, max: 40 } },
    async setup(io, b, p) {
      b.belt.clear();
      b.fly.length = 0;
      b.bins.forEach((bn) => bn.clear().forEach((o) => { o.visible = false; b.pool.push(o); }));
      b.counts = [0, 0, 0, 0, 0];
      io.line('pinMode(BEAM, INPUT_PULLUP)');
      io.line('chute.write(90);');
      b.chute.setAngle(90);
      io.pin('D9', '90°', true);
      io.line('display.showNumberDec(0);');
      b.disp.showNumber(0);
      await io.delay(120);
      io.line('if (!tcs.begin())');
      await io.delay(80);
      io.line('belt(BELT_PWM);');
      b.belt.set(p.belt / 255);
      io.pin('D5', `PWM ${p.belt}`, true);
      b.st.running = true;
      b.st.feedT = 0.5;
    },
    async loop(io, b, p) {
      if (!b.st.blocked) {
        io.line('if (digitalRead(BEAM) == HIGH) return;');
        io.pin('D2', 'HIGH', false);
        await io.delay(20);
        return;
      }
      io.pin('D2', 'LOW · blocked', true);
      io.line('belt(0);');
      b.belt.set(0);
      io.pin('D5', 'PWM 0', false);
      io.line('delay(250);');
      await io.delay(250);
      io.line('tcs.getRawData');
      const it = b.belt.items.find((t) => Math.abs(t.s - -6) < 1.6);
      const ref = it ? (BLOCK_RGB[it.obj.userData.key] ?? { r: 0.36, g: 0.2, b: 0.44 }) : { r: 0.33, g: 0.34, b: 0.33 };
      const bright = it ? 2400 : 12;
      const raw = ['r', 'g', 'b'].map((ch) => Math.max(0, Math.round(ref[ch] * bright * (1 + (Math.random() - 0.5) * 0.06))));
      io.pin('SDA', 'I²C 0x29', true);
      await io.delay(50);
      io.line('int k = classify(r, g, b);');
      const k = classify(raw, p.tol / 100);
      b.counts[k]++;
      io.line('Serial.println(b);');
      io.print(`${SORT_NAMES[k]}  r=${raw[0]} g=${raw[1]} b=${raw[2]}`);
      io.line('chute.write(CHUTE_DEG[k]);');
      b.chute.setAngle(SORT_DEG[k]);
      io.pin('D9', `${SORT_DEG[k]}°`, true);
      io.line('display.showNumberDec(counts[k], false, 3, 1);');
      const n = String(b.counts[k] % 1000).padStart(3, ' ');
      b.disp.setSegments([SORT_LETTER[k], ...[...n].map((ch) => SEG[ch] ?? 0)]);
      io.line('delay(300);');
      await io.delay(300);
      io.line('belt(BELT_PWM);', 2);
      b.belt.set(p.belt / 255);
      io.pin('D5', `PWM ${p.belt}`, true);
      io.line('while (digitalRead(BEAM) == LOW)');
      for (let i = 0; i < 300 && b.st.blocked; i++) await io.delay(20);
    },
    reset(b) { b.belt.set(0); b.st.running = false; b.tcs.sample(null); },
  },

  // ------------------------------------------------------------------ 4 · PID line follower
  {
    id: 'ind-line-follower', title: 'PID line follower', icon: 'car', board: 'uno',
    thumb: () => makeLineSensorArray(v(0, 0, 0)).group,
    view: { center: [0, 4, 2], size: 120 },
    build(ctx) {
      ctx.step('Lay the track mat: white board, 19 mm black tape');
      const track = ctx.add(makeLineTrack(v(0, 0, 0)));
      ctx.step('2WD chassis on the start line');
      const car = makeRobotCar(track.start.pos, { rotY: track.start.rotY, speed: 30 });
      ctx.addObject(car.group);
      // integrate in ≤ 5 ms substeps so a slow frame does not jump the car off the line
      ctx.onTick((dt) => { const n = Math.ceil(Math.min(dt, 0.1) / 0.005); for (let i = 0; i < n; i++) car.tick(Math.min(dt, 0.1) / n); });
      const cg = car.group;
      const D = car.deckY;
      const holder = new THREE.Group();
      holder.position.set(0, D + 2.5, -0.3);
      holder.rotation.y = -Math.PI / 2;
      cg.add(holder);
      holder.add(ctx.board.group);
      const brass = mat(0xd6b46a, { metal: 0.6, rough: 0.35 });
      for (const [x, z] of [[-2.2, -3.0], [2.2, -3.0], [-2.2, 2.4], [2.2, 2.4]]) cg.add(at(cyl(0.18, 0.18, 0.95, brass, { seg: 8 }), x, D + 2.02, z));
      const drv = makeL298N(v(0, 0, 0), { rotY: Math.PI });
      drv.group.position.set(0, D, 9.2);
      cg.add(drv.group);
      // line sensor under the nose on an acrylic bracket, OUT1 on the car's left
      const arr = makeLineSensorArray(v(0, 0, 0), { rotY: Math.PI });
      arr.group.position.set(0, 1.0, 13.4);
      cg.add(arr.group);
      cg.add(at(box(6.6, 0.25, 1.4, mat(0xbfe6ff, { rough: 0.15, opacity: 0.6 })), 0, car.wheelRadius + 0.92, 12.6));
      for (const x of [-3.0, 3.0]) cg.add(at(cyl(0.16, 0.16, car.wheelRadius - 0.2, brass, { seg: 8 }), x, 1.15 + (car.wheelRadius - 0.2) / 2, 13.0));
      cg.updateMatrixWorld(true);
      const b = ctx.board;
      const W = (x, y, z) => cg.localToWorld(v(x, y, z));
      const wires = [];
      const wire = (a, c, color, opts = {}) => { const w = ctx.wire(a, c, color, opts); wires.push(w); return w; };
      ctx.step('Uno → L298N: D5 ENA, D7/D8 IN1/IN2, D9/D11 IN3/IN4, D6 ENB');
      [['D5', 'ENA', 'orange'], ['D7', 'IN1', 'yellow'], ['D8', 'IN2', 'green'], ['D9', 'IN3', 'blue'], ['D11', 'IN4', 'purple'], ['D6', 'ENB', 'white']]
        .forEach(([p, q, c], i) => wire(b.pin(p), drv.pin(q), c, { lift: 1.0 + i * 0.15 }));
      ctx.step('Line sensor: OUT1–OUT5 → A0–A4, 5V and GND');
      ['A0', 'A1', 'A2', 'A3', 'A4'].forEach((p, i) => wire(b.pin(p), arr.pin(`OUT${i + 1}`), ['orange', 'yellow', 'green', 'blue', 'purple'][i], { signal: p, lift: 1.6 + i * 0.12 }));
      wire(b.pin('5V'), arr.pin('5V'), 'red', { lift: 2.4 });
      wire(b.pin('GND_3'), arr.pin('GND'), 'black', { lift: 2.6 });
      ctx.step('Power: battery → L298N 12V → Uno VIN, common ground; motors to OUT1–OUT4');
      const batR = W(2.5, D + 0.15, 3.8), batB = W(2.5, D + 0.15, 4.4);
      const motorWires = [wire(batR, drv.pin('12V'), 'red', { lift: 1.0 }), wire(batB, drv.pin('GND'), 'black', { lift: 1.2 })];
      wire(drv.pin('12V'), b.pin('VIN'), 'red', { lift: 2.0 });
      wire(drv.pin('GND'), b.pin('GND_2'), 'black', { lift: 1.8 });
      const PY = car.wheelRadius + 0.95;
      motorWires.push(
        wire(W(1.29 - 0.3, PY, 6.6), drv.pin('OUT1'), 'red', { lift: 1.0 }),
        wire(W(1.29 + 0.3, PY, 6.6), drv.pin('OUT2'), 'black', { lift: 1.2 }),
        wire(W(-1.29 + 0.3, PY, 6.6), drv.pin('OUT3'), 'red', { lift: 1.0 }),
        wire(W(-1.29 - 0.3, PY, 6.6), drv.pin('OUT4'), 'black', { lift: 1.2 }),
      );
      wires.forEach((w) => cg.attach(w.group));
      // ---- live anchors
      const L = { uno: v(0, D + 3.6, -0.3), drv: v(0, D + 3.2, 9.2), arr: v(0, 2.4, 14.2), bat: v(3.4, D + 1.6, 0) };
      const anchors = Object.fromEntries(Object.keys(L).map((k) => [k, v()]));
      const sync = () => { for (const k in L) anchors[k].copy(cg.localToWorld(L[k].clone())); };
      sync();
      for (const k in anchors) ctx.anchor(k, live(anchors[k]));
      ctx.anchor('track', track.anchor);
      // ---- sensors read the mat
      const read = () => [0, 1, 2, 3, 4].map((i) => {
        const p = arr.group.localToWorld(arr.sensorLocal(i));
        return track.onLine(p.setY(0));
      });
      ctx.onTick(() => {
        const s = read();
        s.forEach((black, i) => arr.set(i, !black));
        sync();
      });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'error', color: '#2aa7a1', min: -320, max: 320 }, { name: 'correction', color: '#ef8a2b', min: -320, max: 320 }] });
      ctx.interact(car, {
        name: 'Robot car', hint: 'Put it back or nudge it off the line',
        controls: [
          { type: 'button', label: 'Back to the start line', press: () => { car.reset(); sync(); } },
          { type: 'button', label: 'Nudge it 3 cm sideways', press: () => { const r = new THREE.Vector3(Math.cos(cg.rotation.y), 0, -Math.sin(cg.rotation.y)); cg.position.addScaledVector(r, 3); cg.updateMatrixWorld(true); sync(); } },
        ],
        note: () => `Sensors ${read().map((x) => (x ? '█' : '·')).join(' ')} (█ = over the line)`,
      });
      return { car, track, arr, read, plot, motorWires, reset() { car.reset(); car.stop(); motorWires.forEach((w) => (w.live = false)); plot.reset(); sync(); } };
    },
    callouts: [
      { anchor: 'arr', x: 0.04, y: 0.17, icon: 'radar', title: '5 × TCRT5000 → A0–A4', text: 'Each reads HIGH over black tape. 1.4 cm apart, 4 mm above the mat.' },
      { anchor: 'uno', x: 0.36, y: 0.12, icon: 'chip', title: 'PID at 100 Hz', text: 'error → KP·e + KD·Δe → left and right PWM.' },
      { anchor: 'drv', x: 0.7, y: 0.17, icon: 'motor', title: 'L298N', text: 'BASE + correction on the left, BASE − correction on the right.' },
      { anchor: 'track', x: 0.04, y: 0.68, icon: 'hand', title: 'Track with a chicane', text: 'Click the car to put it back or nudge it off the line.' },
    ],
    overview: {
      heading: 'PID line follower',
      text: 'Builds on <b>Obstacle-avoiding robot</b>. Five reflective IR sensors turn “where is the line?” into one number, the error. A PD controller turns that error into a steering correction 100 times a second; the plotter shows how gains change the wobble.',
      features: [['radar', 'Weighted error −200…+200 from five digital sensors'], ['gear', '<code>KP * error + KD * (error - lastError)</code>'], ['pwm', 'Fixed 10 ms control period with <code>millis()</code>']],
    },
    pinout: [
      ['A0–A4', 'Line sensor OUT1–OUT5', 'Digital reads: HIGH = black line (left → right)'],
      ['5V, GND_3', 'Line sensor 5V, GND', '≈ 100 mA for five IR LEDs'],
      ['D5 ~ / D6 ~', 'L298N ENA / ENB', 'PWM speed, jumpers removed'],
      ['D7, D8 / D9, D11', 'IN1, IN2 / IN3, IN4', 'Left / right motor direction'],
      ['Battery + → L298N 12V → VIN', 'Battery − → L298N GND → Uno GND', 'Common ground'],
    ],
    example: {
      text: 'Warehouse tuggers and hospital delivery robots still follow lines or magnetic tape. PID is everywhere: cruise control, drone attitude, 3D-printer heaters.',
      points: ['Set <code>KD</code> to 0 and raise <code>KP</code>: the car snakes, then oscillates off the line', 'Add <code>KD</code> back and watch the plotter: the wobble damps out', 'Too much <code>KD</code> makes the motors buzz between full left and full right'],
    },
    specs: [['Sensor', '5-channel TCRT5000 board, digital outputs'], ['Error range', '−200 … +200, ±300 when lost'], ['Loop rate', '100 Hz'], ['Top speed', '≈ 30 cm/s at PWM 255'], ['Track', '1.2 × 0.7 m mat, 19 mm tape, 22 cm curves'], ['Libraries', 'None, plain Arduino']],
    quiz: [
      { q: 'Sensors 4 and 5 (right side) see the line. What is the error and the reaction?', options: ['+150: speed up the left wheel, slow the right, turning right', '−150: turn left', '0: go straight', '+300: stop'], answer: 0, explain: '(100 + 200) / 2 = 150; correction is positive, so left = BASE + u and right = BASE − u.' },
      { q: 'What does the D term do?', options: ['Reacts to how fast the error is changing, braking the turn before it overshoots', 'Adds up past errors', 'Sets the base speed', 'Reads the sensors faster'], answer: 0, explain: 'If the error is shrinking quickly, (error − lastError) is negative and eases the correction off early.' },
      { q: 'Why run the loop on a fixed 10 ms period?', options: ['The D term compares readings one loop apart, so the time between them must be constant', 'Serial needs it', 'To save power', 'The sensors only update every 10 ms'], answer: 0, explain: 'With a varying period the same KD would mean a different damping every loop.' },
      { q: 'All five sensors read white. What does readError() do?', options: ['Returns ±300 in the direction the line was last seen so the car turns back', 'Returns 0 and drives straight', 'Stops the motors', 'Resets the Uno'], answer: 0, explain: 'Remembering the last side is the simplest way to recover from overshooting a bend.' },
    ],
    challenges: [
      'Add an I term with an anti-windup limit and see if it helps on long curves.',
      'Slow <code>BASE</code> down automatically when the error is large (corners) and speed up on straights.',
      'Add the HC-SR04 from <b>Obstacle-avoiding robot</b> and stop when something is on the track.',
    ],
    code: `// PID line follower: five IR sensors find the line, PD steers the motors.
const int ENA = 5, IN1 = 7, IN2 = 8;           // left motor
const int ENB = 6, IN3 = 9, IN4 = 11;          // right motor
const int SENSOR[5] = {A0, A1, A2, A3, A4};    // OUT1 (left) ... OUT5 (right), HIGH = black
const int BASE = {{base}};                        // cruising PWM
const float KP = {{kp}} / 10.0;                   // proportional gain
const float KD = {{kd}} / 10.0;                   // derivative gain
const unsigned long PERIOD_MS = 10;            // control loop at 100 Hz

int lastError = 0;
unsigned long lastRun = 0;

void motors(int left, int right) {             // -255..255 each
  left = constrain(left, -255, 255);
  right = constrain(right, -255, 255);
  digitalWrite(IN1, left > 0);
  digitalWrite(IN2, left < 0);
  digitalWrite(IN3, right > 0);
  digitalWrite(IN4, right < 0);
  analogWrite(ENA, abs(left));
  analogWrite(ENB, abs(right));
}

// -200 (line far left) ... 0 (centred) ... +200 (far right)
int readError() {
  long sum = 0;
  int seen = 0;
  for (int i = 0; i < 5; i++) {
    if (digitalRead(SENSOR[i]) == HIGH) {
      sum += (i - 2) * 100;
      seen++;
    }
  }
  if (seen == 0) return lastError > 0 ? 300 : -300;  // lost: turn back towards it
  return sum / seen;
}

void setup() {
  int pins[] = {ENA, IN1, IN2, ENB, IN3, IN4};
  for (int p : pins) pinMode(p, OUTPUT);
  for (int i = 0; i < 5; i++) pinMode(SENSOR[i], INPUT);
  Serial.begin(115200);
}

void loop() {
  if (millis() - lastRun < PERIOD_MS) return;
  lastRun = millis();
  int error = readError();
  float correction = KP * error + KD * (error - lastError);
  lastError = error;
  motors(BASE + correction, BASE - correction);
  Serial.print(error);                         // open the Serial Plotter
  Serial.print(',');
  Serial.println(correction);
}`,
    params: { base: { value: 160, min: 60, max: 255 }, kp: { value: 5, min: 0, max: 30 }, kd: { value: 15, min: 0, max: 120 } },
    async setup(io, b) {
      b.reset();
      b.lastError = 0;
      b.n = 0;
      b.lastT = 0;
      io.line('for (int p : pins)');
      await io.delay(80);
      io.line('Serial.begin(115200);');
      await io.delay(80);
    },
    async loop(io, b, p) {
      io.line('int error = readError();');
      const s = b.read();
      let sum = 0, seen = 0;
      s.forEach((black, i) => { if (black) { sum += (i - 2) * 100; seen++; } });
      const error = seen ? Math.trunc(sum / seen) : b.lastError > 0 ? 300 : -300;
      // the sketch runs every 10 ms; if the browser runs this loop slower, scale the
      // derivative so it still means "change per 10 ms" like on the real board
      const t = performance.now(), ms = b.lastT ? t - b.lastT : 10;
      b.lastT = t;
      const u = (p.kp / 10) * error + (p.kd / 10) * (error - b.lastError) * Math.min(1, 10 / ms);
      b.lastError = error;
      const l = clamp(Math.trunc(p.base + u), -255, 255), r = clamp(Math.trunc(p.base - u), -255, 255);
      b.car.setWheels(l / 255, r / 255);
      b.motorWires.forEach((w) => (w.live = true));
      b.plot.push(error, Math.round(u));
      if (++b.n % 10 === 0) {
        io.line('motors(BASE + correction, BASE - correction);');
        io.pin('D5', `PWM ${Math.abs(l)}`, true);
        io.pin('D6', `PWM ${Math.abs(r)}`, true);
        io.print(`${error},${fmt(u, 2)}`);
      }
      await io.delay(10);
    },
    reset(b) { b.reset(); },
  },

  // ------------------------------------------------------------------ 5 · production counter
  {
    id: 'ind-counter', title: 'Production counter', icon: 'timer', board: 'uno',
    thumb: () => makeTM1637(v(0, 0, 0)).showNumber(1234).group,
    view: { center: [0, 4, -9], size: 48 },
    build(ctx) {
      const b = ctx.board;
      ctx.step('Conveyor behind the Uno, a tote box at the end');
      const belt = ctx.add(makeConveyor(v(-3, 0, -16), { length: 28, maxSpeed: 8, label: 'Belt conveyor (6 V gear motor)' }));
      const BX = 10.6; // beam near the end of the belt
      const tote = ctx.add(makeBin(v(14.2, 0, -16), { color: 0x2f5fbf, width: 6, depth: 7.4, height: 3.2, tag: 'BATCH', label: 'Tote box' }));
      ctx.step('IR break-beam across the belt just before the end');
      const beam = ctx.add(makeBreakBeam(v(-3 + BX, 7.0, -20.4), v(-3 + BX, 7.0, -11.6), { out: v(0, 0, 1.6), outA: v(0, 0, -1.6) }));
      ctx.step('Breadboard: power rails and the NEXT BATCH button on D4');
      const bb = ctx.breadboard(...BB);
      ctx.wire(b.pin('5V'), bb.hole(2, 'top+'), 'red', { signal: '5V' });
      ctx.wire(b.pin('GND'), bb.hole(3, 'top-'), 'black', { signal: 'GND', dir: -1 });
      const btn = named(ctx.add(makeButton([bb.hole(20, 'e'), bb.hole(22, 'e'), bb.hole(20, 'f'), bb.hole(22, 'f')], 0x3aa65a)), 'Push button');
      ctx.wire(b.pin('D4'), bb.hole(20, 'a'), 'green', { signal: 'D4', lift: 1.4 });
      ctx.wire(bb.hole(22, 'j'), bb.hole(23, 'bot-'), 'black', { lift: 0.4 });
      ctx.wire(bb.hole(28, 'top-'), bb.hole(28, 'bot-'), 'black', { lift: 0.8 });
      ctx.step('Beam: 5 V and GND to both halves, receiver OUT → D2');
      ctx.wire(bb.hole(6, 'top+'), beam.pin('RX+'), 'red', { lift: 1.5 });
      ctx.wire(bb.hole(7, 'top-'), beam.pin('RX-'), 'black', { lift: 1.6 });
      ctx.wire(b.pin('D2'), beam.pin('OUT'), 'white', { signal: 'D2', lift: 1.8 });
      ctx.wire(bb.hole(9, 'top+'), beam.pin('TX+'), 'red', { lift: 2, bend: v(0, 7, 0) });
      ctx.wire(bb.hole(10, 'top-'), beam.pin('TX-'), 'black', { lift: 2, bend: v(0, 7.4, 0) });
      ctx.step('TM1637 count display: CLK → D3, DIO → D5');
      const disp = ctx.add(makeTM1637(v(1.5, 0, -7.6)));
      ctx.wire(b.pin('D3'), disp.pin('CLK'), 'green', { signal: 'D3', lift: 1.2 });
      ctx.wire(b.pin('D5'), disp.pin('DIO'), 'blue', { signal: 'D5', lift: 1.3 });
      ctx.wire(bb.hole(12, 'top+'), disp.pin('VCC'), 'red', { lift: 1.6 });
      ctx.wire(bb.hole(13, 'top-'), disp.pin('GND'), 'black', { lift: 1.7 });
      ctx.step('Stack light: green D8, amber D10, red D11');
      const lamp = ctx.add(makeStackLight(v(19, 0, -6)));
      ctx.wire(b.pin('D8'), lamp.pin('G'), 'green', { signal: 'D8', lift: 2.0 });
      ctx.wire(b.pin('D10'), lamp.pin('Y'), 'yellow', { signal: 'D10', lift: 2.2 });
      ctx.wire(b.pin('D11'), lamp.pin('R'), 'red', { signal: 'D11', lift: 2.4 });
      ctx.wire(bb.hole(27, 'top-'), lamp.pin('GND'), 'black', { lift: 1.4 });
      ctx.step('Relay on D7 switches the belt motor from the 6 V pack');
      const relay = ctx.add(makeRelay(v(-13, 0, -5.5)));
      const bat = ctx.add(makeBatteryPack(v(-21, 0, -4)));
      ctx.wire(b.pin('D7'), relay.pin('IN'), 'orange', { signal: 'D7', lift: 1.6 });
      ctx.wire(b.pin('GND_2'), relay.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.6 });
      ctx.wire(bb.hole(1, 'top+'), relay.pin('VCC'), 'red', { lift: 2.4 });
      const motorW = [
        ctx.wire(bat.pin('+'), relay.pin('COM'), 'red', { lift: 1.6 }),
        ctx.wire(relay.pin('NO'), belt.pin('M+'), 'red', { lift: 1.8 }),
        ctx.wire(belt.pin('M-'), bat.pin('-'), 'black', { lift: 1.6 }),
      ];
      // ---- simulation
      const root = belt.group.parent;
      const st = { feedT: 1, jamNext: false, stuck: null, done: false, relay: false };
      const pool = [];
      const spawn = () => {
        if (belt.items.some((t) => t.s < -12 + 5)) return;
        const par = pool.pop() ?? (() => { const o = makeParcel(3.0, 2.4, 2.8); root.add(o); return o; })();
        par.visible = true;
        par.rotation.set(0, 0, 0);
        belt.place(par, -12, (Math.random() - 0.5) * 1.0);
      };
      belt.onEnd((it) => {
        const o = it.obj;
        const from = o.position.clone(), to = tote.slot();
        let t = 0;
        const f = (dt) => { t = Math.min(1, t + dt / 0.35); o.position.lerpVectors(from, to, t); o.position.y = lerp(from.y, to.y, t * t); if (t >= 1) { tote.drop(o); return true; } return false; };
        st.fly.push(f);
      });
      st.fly = [];
      const box3 = new THREE.Box3();
      ctx.onTick((dt) => {
        belt.set(st.relay ? 1 : 0);
        motorW.forEach((w) => (w.live = st.relay));
        if (st.running && st.relay) {
          st.feedT -= dt;
          if (st.feedT <= 0) { spawn(); st.feedT = 1.6 + Math.random() * 2.2; }
        }
        if (st.stuck) st.stuck.s = BX - 0.4;
        for (let i = st.fly.length - 1; i >= 0; i--) if (st.fly[i](dt)) st.fly.splice(i, 1);
        let blocked = false;
        for (const it of belt.items) {
          box3.setFromCenterAndSize(it.obj.position.clone().add(v(0, 1.2, 0)), v(3.0, 2.4, 2.8));
          if (beam.cuts(box3)) { blocked = true; if (st.jamNext && !st.stuck) { st.stuck = it; st.jamNext = false; } }
        }
        beam.setBlocked(blocked);
        st.blocked = blocked;
      });
      const press = (on) => { btn.press(on); st.button = on; };
      ctx.interact(btn, { name: 'NEXT BATCH button (D4)', hint: 'Hold to press: swap the box and restart', hold: { down: () => press(true), up: () => press(false) } });
      ctx.interact(belt, {
        name: 'Conveyor', hint: 'Make trouble on the line',
        controls: [
          { type: 'button', label: 'Jam the next parcel under the beam', press: () => (st.jamNext = true) },
          { type: 'button', label: 'Clear the jam', press: () => { if (st.stuck) { st.stuck.obj.visible = false; pool.push(st.stuck.obj); belt.remove(st.stuck.obj); st.stuck = null; } } },
          { type: 'button', label: 'Press NEXT BATCH', press: () => { press(true); setTimeout(() => press(false), 400); } },
        ],
        note: () => `${belt.items.length} parcels on the belt · ${tote.count} in the tote · beam ${st.blocked ? 'BLOCKED' : 'clear'}`,
      });
      ctx.anchor('beam', beam.pin('OUT').clone().add(v(0, 1.5, 0)));
      ctx.anchor('disp', disp.anchor);
      ctx.anchor('relay', relay.anchor);
      ctx.anchor('lamp', lamp.anchor);
      ctx.anchor('btn', btn.anchor);
      return { belt, beam, disp, lamp, relay, tote, btn, st, pool };
    },
    callouts: [
      { anchor: 'beam', x: 0.36, y: 0.12, icon: 'radar', title: 'Count on the trailing edge', text: 'A parcel counts when the beam clears again: it has left the belt.' },
      { anchor: 'lamp', x: 0.7, y: 0.17, icon: 'led', title: 'Stack light', text: 'Green running, amber batch complete, red jam.' },
      { anchor: 'relay', x: 0.04, y: 0.17, icon: 'plug', title: 'Relay on D7', text: 'Switches the 6 V motor circuit. HIGH = belt runs.' },
      { anchor: 'disp', x: 0.04, y: 0.68, icon: 'timer', title: 'TM1637: count', text: 'Shows the count, “donE” at the end of a batch, “Err” on a jam.' },
      { anchor: 'btn', x: 0.7, y: 0.68, icon: 'button', title: 'NEXT BATCH (D4)', text: 'Swap the full tote, press, and the line restarts.' },
    ],
    overview: {
      heading: 'Production counter with batches',
      text: 'Builds on <b>Build a state machine</b> and <b>Switch a lamp</b>. A light barrier counts parcels leaving the belt; every <code>BATCH</code> the relay stops the line so the operator can swap the box. A beam blocked for too long is a jam: stop and show red.',
      features: [['radar', 'Edge detection with a minimum block time against blips'], ['code', '<code>enum State { RUN, BATCH_DONE, JAMMED }</code>'], ['plug', 'Relay = machine contactor, stack light = status']],
    },
    pinout: [
      ['D2', 'Break-beam OUT', 'INPUT_PULLUP, LOW = blocked'],
      ['D4', 'NEXT BATCH button → GND', 'INPUT_PULLUP'],
      ['D7', 'Relay IN', 'Relay VCC 5 V, GND'],
      ['6 V + → relay COM, NO → motor +', 'Motor − → 6 V −', 'Fit a 1N4007 across the motor (stripe to +)'],
      ['D8, D10, D11', 'Stack light G, Y, R', '220 Ω per LED on its base board'],
      ['D3, D5', 'TM1637 CLK, DIO', 'VCC 5 V'],
    ],
    example: {
      text: 'Packing lines count every carton through a photo-eye, close a box after N items, and stop with a red beacon when something jams. PLCs do it with the same logic you write here.',
      points: ['Set <code>BATCH</code> to 5 and run a few batches', 'Jam a parcel: after <code>JAM_MS</code> the line stops and the red lamp lights', 'Raise <code>MIN_BLOCK_MS</code> above a parcel’s time in the beam and nothing counts: that is the trade-off of filtering'],
    },
    specs: [['Sensor', 'IR break-beam, 5 mm, up to 25 cm'], ['Counting', 'Trailing edge, min. block time filter'], ['Output', '1-channel 5 V relay, 10 A contacts'], ['Status', 'Stack light (3 LEDs), TM1637'], ['Jam detection', 'Beam blocked > <code>JAM_MS</code>'], ['Libraries', 'TM1637Display']],
    quiz: [
      { q: 'Why count when the beam clears rather than when it is broken?', options: ['Then the parcel has already left the belt, so the batch stops with it in the box', 'It is more accurate in the dark', 'The relay needs it', 'It saves power'], answer: 0, explain: 'With the beam at the end of the belt, a cleared beam means the parcel has dropped. Stopping on the leading edge would leave the last one on the belt.' },
      { q: 'What does MIN_BLOCK_MS protect against?', options: ['Brief blips (a fly, a flapping label, electrical noise) counting as parcels', 'Jams', 'Long parcels', 'The relay clicking'], answer: 0, explain: 'A real parcel blocks the beam for hundreds of ms; anything shorter is ignored.' },
      { q: 'Why does a relay switch the motor and not the Uno pin directly?', options: ['The pin can give 20 mA; the motor needs hundreds of mA from its own battery', 'Relays are faster', 'To make it reversible', 'The Uno has no 6 V'], answer: 0, explain: 'The relay coil is driven by the module’s transistor; its contacts switch the separate motor circuit.' },
      { q: 'What is the diode across the motor for?', options: ['It absorbs the voltage spike when the relay opens the inductive motor circuit', 'It makes the motor faster', 'It powers the LED', 'It is a fuse'], answer: 0, explain: 'A motor is an inductor; interrupting its current makes a spike that pits relay contacts and causes resets.' },
    ],
    challenges: [
      'Show parcels per minute on the display while the line runs.',
      'Keep a total in EEPROM (<b>Remember settings</b>) so the shift count survives a power cut.',
      'Add a second beam 5 cm before the first and measure each parcel’s length; reject short ones.',
    ],
    code: `// Production counter: count parcels through a light barrier, stop every batch.
#include <TM1637Display.h>

const int BEAM = 2;                            // break-beam receiver: LOW = blocked
const int CLK = 3, DIO = 5;                    // TM1637
const int BUTTON = 4;                          // NEXT BATCH, to GND
const int RELAY = 7;                           // HIGH = belt runs
const int LAMP_G = 8, LAMP_Y = 10, LAMP_R = 11;  // stack light
const int BATCH = {{batch}};
const unsigned long MIN_BLOCK_MS = {{minms}};     // shorter blips are not parcels
const unsigned long JAM_MS = {{jam}};            // blocked this long = jam

const uint8_t DONE[] = {0x5E, 0x5C, 0x54, 0x79};  // d o n E
const uint8_t ERR[] = {0x79, 0x50, 0x50, 0x00};   // E r r

enum State { RUN, BATCH_DONE, JAMMED };
State state = RUN;
TM1637Display display(CLK, DIO);
int count = 0;
bool wasBlocked = false;
unsigned long blockedSince = 0;

void lamps(bool g, bool y, bool r) {
  digitalWrite(LAMP_G, g);
  digitalWrite(LAMP_Y, y);
  digitalWrite(LAMP_R, r);
}

void setup() {
  Serial.begin(9600);
  pinMode(BEAM, INPUT_PULLUP);
  pinMode(BUTTON, INPUT_PULLUP);
  int outs[] = {RELAY, LAMP_G, LAMP_Y, LAMP_R};
  for (int p : outs) pinMode(p, OUTPUT);
  display.setBrightness(5);
  display.showNumberDec(0);
  digitalWrite(RELAY, HIGH);                   // start the line
  lamps(true, false, false);
}

void loop() {
  bool blocked = digitalRead(BEAM) == LOW;
  unsigned long now = millis();
  if (blocked && !wasBlocked) blockedSince = now;              // parcel arrives
  if (!blocked && wasBlocked && now - blockedSince >= MIN_BLOCK_MS && state == RUN) {
    count++;                                                    // parcel has left
    display.showNumberDec(count);
    Serial.print("Parcel ");
    Serial.println(count);
    if (count >= BATCH) {
      state = BATCH_DONE;
      digitalWrite(RELAY, LOW);
      lamps(false, true, false);
      display.setSegments(DONE);
      Serial.println("Batch complete: swap the box");
    }
  }
  wasBlocked = blocked;

  if (state == RUN && blocked && now - blockedSince > JAM_MS) {
    state = JAMMED;
    digitalWrite(RELAY, LOW);
    lamps(false, false, true);
    display.setSegments(ERR);
    Serial.println("Jam!");
  }

  if (state != RUN && digitalRead(BUTTON) == LOW) {
    delay(30);                                 // debounce
    if (state == BATCH_DONE) count = 0;
    state = RUN;
    display.showNumberDec(count);
    lamps(true, false, false);
    digitalWrite(RELAY, HIGH);
    Serial.println("Running");
    while (digitalRead(BUTTON) == LOW) delay(5);
  }
  delay(2);
}`,
    params: { batch: { value: 6, min: 1, max: 50 }, minms: { value: 60, min: 0, max: 2000 }, jam: { value: 3000, min: 1000, max: 8000 } },
    async setup(io, b, p) {
      b.belt.clear();
      b.tote.clear().forEach((o) => { o.visible = false; b.pool.push(o); });
      b.st.fly.length = 0;
      b.st.stuck = null;
      Object.assign(b.st, { state: 'RUN', count: 0, was: false, since: 0 });
      io.line('pinMode(BEAM, INPUT_PULLUP);');
      io.line('display.showNumberDec(0);');
      b.disp.showNumber(0);
      await io.delay(100);
      io.line('digitalWrite(RELAY, HIGH);', 1);
      b.st.relay = true;
      b.relay.set(true);
      io.pin('D7', 'HIGH', true);
      io.line('lamps(true, false, false);', 1);
      lampsSim(b, 'green');
      b.st.running = true;
      b.st.feedT = 0.4;
    },
    async loop(io, b, p) {
      const s = b.st;
      const blocked = s.blocked;
      const now = performance.now();
      io.line('bool blocked = digitalRead(BEAM) == LOW;');
      io.pin('D2', blocked ? 'LOW' : 'HIGH', blocked);
      if (blocked && !s.was) { io.line('if (blocked && !wasBlocked) blockedSince = now;'); s.since = now; }
      if (!blocked && s.was && now - s.since >= p.minms && s.state === 'RUN') {
        s.count++;
        io.line('count++;');
        b.disp.showNumber(s.count);
        io.print(`Parcel ${s.count}`);
        if (s.count >= p.batch) {
          s.state = 'BATCH_DONE';
          io.line('state = BATCH_DONE;');
          s.relay = false; b.relay.set(false); io.pin('D7', 'LOW', false);
          lampsSim(b, 'amber');
          b.disp.setSegments([0x5e, 0x5c, 0x54, 0x79]);
          io.print('Batch complete: swap the box');
        }
      }
      s.was = blocked;
      if (s.state === 'RUN' && blocked && now - s.since > p.jam) {
        s.state = 'JAMMED';
        io.line('state = JAMMED;');
        s.relay = false; b.relay.set(false); io.pin('D7', 'LOW', false);
        lampsSim(b, 'red');
        b.disp.setSegments([0x79, 0x50, 0x50, 0]);
        io.print('Jam!');
      }
      if (s.state !== 'RUN' && s.button) {
        io.line('if (state != RUN && digitalRead(BUTTON) == LOW)');
        io.pin('D4', 'LOW', true);
        await io.delay(30);
        if (s.state === 'BATCH_DONE') { s.count = 0; b.tote.clear().forEach((o) => { o.visible = false; b.pool.push(o); }); }
        if (s.state === 'JAMMED' && s.stuck) { s.stuck = null; }
        s.state = 'RUN';
        b.disp.showNumber(s.count);
        lampsSim(b, 'green');
        s.relay = true; b.relay.set(true); io.pin('D7', 'HIGH', true);
        io.line('Serial.println("Running");');
        io.print('Running');
        while (s.button) await io.delay(20);
        io.pin('D4', 'HIGH', false);
      }
      io.line('delay(2);');
      await io.delay(20);
    },
    reset(b) { b.st.relay = false; b.st.running = false; b.relay.set(false); lampsSim(b, null); },
  },

  // ------------------------------------------------------------------ 6 · room scanner
  {
    id: 'ind-lidar-scan', title: 'Room scanner radar', icon: 'radar', board: 'uno',
    thumb: () => makePanScanner(v(0, 0, 0)).group,
    view: { center: [0, 4, -12], size: 60 },
    build(ctx) {
      const b = ctx.board;
      ctx.step('Build the cardboard room with a few boxes inside');
      const room = ctx.add(makeRoom(v(0, 0, -10), { w: 56, d: 36, layouts: ROOMS }));
      ctx.step('Pan scanner: SG90 with the VL53L0X, looking into the room');
      const scan = ctx.add(makePanScanner(v(0, 0, -14), { rotY: Math.PI }));
      ctx.step('Breadboard to share the I²C bus and power');
      const bb = ctx.breadboard(...BB);
      ctx.wire(b.pin('5V'), bb.hole(2, 'top+'), 'red', { signal: '5V' });
      ctx.wire(b.pin('GND'), bb.hole(3, 'top-'), 'black', { signal: 'GND', dir: -1 });
      ctx.wire(b.pin('SDA'), bb.hole(8, 'a'), 'blue', { signal: 'SDA', lift: 1.4 });
      ctx.wire(b.pin('SCL'), bb.hole(10, 'a'), 'yellow', { signal: 'SCL', lift: 1.6 });
      ctx.step('VL53L0X: VIN, GND, SDA, SCL from the breadboard');
      ctx.wire(bb.hole(5, 'top+'), scan.pin('VIN'), 'red', { lift: 2.0 });
      ctx.wire(bb.hole(6, 'top-'), scan.pin('GND'), 'black', { lift: 2.1 });
      ctx.wire(bb.hole(8, 'b'), scan.pin('SDA'), 'blue', { lift: 2.3 });
      ctx.wire(bb.hole(10, 'b'), scan.pin('SCL'), 'yellow', { lift: 2.5 });
      ctx.step('SSD1306 OLED on the same bus (address 0x3C)');
      const oled = ctx.add(named(makeOLED(v(10.6, 0, 7.0)), 'SSD1306 OLED 128×64'));
      ctx.wire(bb.hole(12, 'j'), oled.pin('GND'), 'black', { lift: 1.0 });
      ctx.wire(bb.hole(13, 'j'), oled.pin('VCC'), 'red', { lift: 1.1 });
      ctx.wire(bb.hole(10, 'e'), oled.pin('SCL'), 'yellow', { lift: 1.3 });
      ctx.wire(bb.hole(8, 'e'), oled.pin('SDA'), 'blue', { lift: 1.5 });
      ctx.wire(bb.hole(12, 'bot-'), bb.hole(12, 'i'), 'black', { lift: 0.3 });
      ctx.wire(bb.hole(13, 'bot+'), bb.hole(13, 'i'), 'red', { lift: 0.3 });
      ctx.wire(bb.hole(29, 'top+'), bb.hole(29, 'bot+'), 'red', { lift: 0.8 });
      ctx.wire(bb.hole(28, 'top-'), bb.hole(28, 'bot-'), 'black', { lift: 0.7 });
      ctx.step('Servo: SIG → D9, V+ / V− from a 5 V supply, grounds joined');
      const psu = ctx.add(makeSupply(v(-10, 0, 2), { rotY: Math.PI / 2, label: '5 V 2 A' }));
      ctx.wire(b.pin('D9'), scan.pin('SIG'), 'orange', { signal: 'D9', lift: 1.6 });
      ctx.wire(psu.pin('+'), scan.pin('V+'), 'red', { lift: 1.8 });
      ctx.wire(psu.pin('-'), scan.pin('V-'), 'black', { lift: 1.6 });
      ctx.wire(psu.pin('-'), b.pin('GND_2'), 'black', { dir: -1, lift: 1.4 });
      // close-up of the OLED in a camera panel so the radar is readable
      ctx.camera({ position: v(10.6, 7, 7.2), target: v(10.6, 0.3, 7.05), fov: 17, title: 'OLED close-up', sub: 'SSD1306 · 128 × 64' });
      const plot = { push() {}, reset() {} };
      const st = { layout: 'a' };
      ctx.interact(room, {
        name: 'Model room', hint: 'Rearrange the furniture',
        controls: [{ type: 'choice', label: 'Layout', options: [['a', 'Four boxes'], ['b', 'Long wall'], ['c', 'Empty room']], get: () => st.layout, set: (k) => { st.layout = k; room.setLayout(k); } }],
      });
      /** What the VL53L0X reports: nearest surface in its ≈ 25° cone, mm with ±3 % noise. */
      const measure = () => {
        const { origin, dir } = scan.ray();
        let best = Infinity;
        for (const da of [-6, -3, 0, 3, 6]) {
          const d = dir.clone().applyAxisAngle(v(0, 1, 0), (da * Math.PI) / 180);
          best = Math.min(best, room.castRay(origin, d));
        }
        if (best > 120) return 8190;
        return Math.round(best * 10 * (1 + (Math.random() - 0.5) * 0.06));
      };
      ctx.anchor('scan', scan.anchor);
      ctx.anchor('oled', oled.anchor);
      ctx.anchor('room', room.anchor);
      ctx.anchor('psu', psu.anchor);
      return { room, scan, oled, plot, measure, range: new Array(181).fill(0) };
    },
    callouts: [
      { anchor: 'scan', x: 0.36, y: 0.12, icon: 'radar', title: 'VL53L0X on an SG90', text: 'Time of flight: a 940 nm laser pulse and a timer, ≈ 25° cone, up to 1.2 m.' },
      { anchor: 'room', x: 0.7, y: 0.17, icon: 'hand', title: 'Model room', text: 'Click it to move the furniture, then watch the map change.' },
      { anchor: 'oled', x: 0.04, y: 0.68, icon: 'chip', title: 'Radar on the OLED', text: 'Half circle = 180°. Rings every MAX_CM / 3; each dot is one reading.' },
      { anchor: 'psu', x: 0.04, y: 0.17, icon: 'bolt', title: 'Servo on its own 5 V', text: 'Keeps servo current spikes away from the sensor and the Uno.' },
    ],
    overview: {
      heading: 'Room scanner: a home-made lidar',
      text: 'Builds on <b>Sweep a servo</b>, <b>The I²C bus</b> and <b>OLED graphics</b>. A time-of-flight sensor on a servo measures the distance at every angle, like the spinning lidar on a robot vacuum, and turns the readings into a radar picture of the room.',
      features: [['radar', 'VL53L0X: millimetres from the travel time of light'], ['servo', 'Sweep 0° → 180° → 0° in <code>STEP</code> degrees'], ['chip', 'Polar to screen: x = r·cos θ, y = r·sin θ']],
    },
    pinout: [
      ['SDA (A4), SCL (A5)', 'VL53L0X + OLED SDA, SCL', 'Shared I²C bus: 0x29 and 0x3C'],
      ['5V, GND', 'VL53L0X VIN, OLED VCC', 'Both have on-board 3.3 V regulators'],
      ['D9', 'Servo SIG', 'Servo V+ / V− from the 5 V supply'],
      ['Supply −', 'Uno GND', 'Common ground'],
    ],
    example: {
      text: 'Robot vacuums, warehouse robots and self-driving cars map their surroundings with spinning lidar: thousands of distance readings per second, turned into points around the robot.',
      points: ['Lower <code>STEP</code> for a finer map; the sweep gets slower', 'Send the Serial lines to a PC and draw a bigger radar there', 'Switch to an HC-SR04: its 15° beam smears corners much more'],
    },
    specs: [['Sensor', 'VL53L0X time-of-flight, 30–1200 mm, ±3 %'], ['Field of view', '≈ 25°'], ['Sweep', '181° in STEP steps, ~40 ms per step'], ['Display', 'SSD1306 128 × 64 over I²C at 400 kHz'], ['RAM', '181-byte range table + 1 KB OLED buffer'], ['Libraries', 'Wire, Servo, VL53L0X (Pololu), Adafruit_GFX, Adafruit_SSD1306']],
    quiz: [
      { q: 'How does a VL53L0X measure distance?', options: ['It times how long an infrared laser pulse takes to bounce back', 'It measures how bright the reflection is', 'It uses sound', 'It counts servo steps'], answer: 0, explain: 'Light travels 30 cm per nanosecond; the chip’s photon counters time the round trip.' },
      { q: 'Why wait SETTLE_MS after pan.write()?', options: ['The servo takes time to reach the angle; reading too early measures in the wrong direction', 'The sensor needs to cool', 'I²C is busy', 'To save power'], answer: 0, explain: 'An SG90 turns about 60° in 0.1 s; a few degrees still take tens of ms to settle.' },
      { q: 'Why is range[] uint8_t and not int?', options: ['181 ints would take 362 bytes; with the 1 KB OLED buffer the Uno’s 2 KB RAM gets tight', 'Distances are always below 100', 'The servo needs it', 'It is faster to print'], answer: 0, explain: 'A byte holds 0–255 cm, plenty here, and halves the memory.' },
      { q: 'A reading at 150° of 40 cm appears where on the radar (centre 64, 63; R = 60; MAX_CM = 80)?', options: ['Up and to the left: x ≈ 38, y ≈ 48', 'Right: x ≈ 90', 'At the centre', 'Off screen'], answer: 0, explain: 'r = 30 px; x = 64 + 30·cos150° ≈ 38, y = 63 − 30·sin150° = 48.' },
    ],
    challenges: [
      'Only redraw the OLED every 10° to sweep faster, and see how much time the display took.',
      'Mark the nearest object of each sweep with a small circle and print its angle.',
      'Mount the scanner on the robot car (<b>Obstacle-avoiding robot</b>) and turn towards the most open direction.',
    ],
    code: `// Room scanner: a VL53L0X on a servo sweeps 180° and draws a radar.
#include <Wire.h>
#include <Servo.h>
#include <VL53L0X.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

const int SERVO_PIN = 9;
const int STEP = {{step}};                        // degrees between readings
const int MAX_CM = {{maxcm}};                     // outer ring of the radar
const int SETTLE_MS = 40;                      // let the servo stop first

Adafruit_SSD1306 oled(128, 64, &Wire, -1);
VL53L0X tof;
Servo pan;
uint8_t range[181];                            // cm at every degree, 0 = nothing
int angle = 0, dir = 1;

int measureCm() {
  uint16_t mm = tof.readRangeSingleMillimeters();
  if (tof.timeoutOccurred() || mm >= 8190) return 0;   // 8190 = out of range
  return min(mm / 10, 255);
}

void drawRadar() {
  const int cx = 64, cy = 63, R = 60;
  oled.clearDisplay();
  for (int k = 1; k <= 3; k++)
    oled.drawCircleHelper(cx, cy, R * k / 3, 0x3, SSD1306_WHITE);   // upper half
  for (int a = 0; a <= 180; a += 45)
    oled.drawLine(cx, cy, cx + R * cos(radians(a)), cy - R * sin(radians(a)), SSD1306_WHITE);
  oled.drawLine(cx, cy, cx + R * cos(radians(angle)), cy - R * sin(radians(angle)), SSD1306_WHITE);
  for (int a = 0; a <= 180; a++) {
    if (range[a] == 0 || range[a] > MAX_CM) continue;
    float r = (float)range[a] * R / MAX_CM;
    oled.fillRect(cx + r * cos(radians(a)) - 1, cy - r * sin(radians(a)) - 1, 2, 2, SSD1306_WHITE);
  }
  oled.display();
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  Wire.setClock(400000);                       // fast I2C: a full redraw takes ~25 ms
  if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("No OLED");
    while (true) {}
  }
  tof.setTimeout(500);
  if (!tof.init()) {
    Serial.println("No VL53L0X");
    while (true) {}
  }
  pan.attach(SERVO_PIN);
  pan.write(0);
  delay(500);
}

void loop() {
  pan.write(angle);
  delay(SETTLE_MS);
  int cm = measureCm();
  range[angle] = cm;
  Serial.print(angle);                         // "angle,cm" for a PC radar
  Serial.print(',');
  Serial.println(cm);
  drawRadar();
  angle += dir * STEP;
  if (angle > 180 || angle < 0) {              // bounce at the ends
    dir = -dir;
    angle += 2 * dir * STEP;
  }
}`,
    params: { step: { value: 3, min: 1, max: 15 }, maxcm: { value: 70, min: 20, max: 120 } },
    async setup(io, b) {
      b.range.fill(0);
      b.angle = 0; b.dir = 1;
      b.plot.reset();
      io.line('Wire.setClock(400000);');
      io.line('if (!oled.begin');
      b.oled.clear();
      await io.delay(100);
      io.line('if (!tof.init())');
      await io.delay(100);
      io.line('pan.write(0);');
      b.scan.setAngle(0);
      io.pin('D9', '0°', true);
      await io.delay(500);
    },
    async loop(io, b, p) {
      io.line('pan.write(angle);');
      b.scan.setAngle(b.angle);
      io.pin('D9', `${b.angle}°`, true);
      io.line('delay(SETTLE_MS);');
      await io.delay(40);
      io.line('int cm = measureCm();');
      const mm = b.measure();
      const cm = mm >= 8190 ? 0 : Math.min(Math.trunc(mm / 10), 255);
      b.range[b.angle] = cm;
      b.scan.beam(cm);
      io.pin('SDA', `${mm} mm`, true);
      await io.delay(33);
      io.line('Serial.println(cm);');
      io.print(`${b.angle},${cm}`);
      b.plot.push(Math.min(cm, 100), b.angle / 2);
      io.line('drawRadar();');
      const pts = [];
      b.range.forEach((r, a) => { if (r) pts.push([a, r]); });
      drawRadar(b.oled, b.angle, pts, p.maxcm);
      await io.delay(25);
      b.angle += b.dir * p.step;
      if (b.angle > 180 || b.angle < 0) {
        io.line('dir = -dir;');
        b.dir = -b.dir;
        b.angle += 2 * b.dir * p.step;
      }
    },
    reset(b) { b.scan.beam(0); },
  },

];

// ---------------------------------------------------------------- arm lesson data + sim helpers
const LO = [0, 15, 30, 0, 0], HI = [180, 165, 180, 180, 90];
// colour sorter: class order RED, GREEN, NONE, BLUE, YELLOW (as the sketch's enum)
const SORT_DEG = [30, 60, 90, 120, 150];
const SORT_NAMES = ['red', 'green', 'unknown', 'blue', 'yellow'];
const SORT_LETTER = [0x50, 0x3d, 0x40, 0x7c, 0x6e];
const SORT_REF = [[0.58, 0.22, 0.2, 0], [0.27, 0.45, 0.28, 1], [0.2, 0.31, 0.49, 3], [0.44, 0.4, 0.16, 4]];
/** The sketch's classify(): nearest reference chromaticity within maxD, else NONE (2). */
function classify([r, g, b], maxD) {
  const sum = r + g + b;
  if (sum < 30) return 2;
  const f = [r / sum, g / sum, b / sum];
  let best = 2, bd = maxD;
  for (const [R, G, B, k] of SORT_REF) {
    const d = Math.hypot(f[0] - R, f[1] - G, f[2] - B);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}
/** Stack light: one lamp on (or none). */
function lampsSim(b, on) { for (const n of ['green', 'amber', 'red']) b.lamp.set(n, n === on); }
/** Scanner room layouts: [x, z, w, d, h] in room coordinates (open front at z = 0). */
const ROOMS = {
  a: [[-16, -24, 8, 7, 6], [11, -15, 7, 10, 7], [19, -30, 8, 8, 5], [-5, -11, 3.5, 3.5, 6]],
  b: [[2, -21, 20, 3, 6], [-19, -10, 5, 5, 6], [17, -29, 8, 8, 6]],
  c: [],
};
const STACK = { x: 6, y: 8 };
const IK_BLOCKS = [[-7, 11], [-2, 12]];
const IK_SPARE = [3, 11];
const IK_LAYOUTS = { a: IK_BLOCKS };

/** Demo routine for the teach lesson: A (−6, 11) → B (6, 11), as recorded poses. */
const DEMO = (() => {
  const P = (x, y, z, grip) => { const j = armIK(x, y, z); return [j.base, j.shoulder, j.elbow, j.wrist, grip]; };
  return [P(-6, 11, 5, 90), P(-6, 11, 1.25, 90), P(-6, 11, 1.25, 20), P(-6, 11, 5.5, 20), P(6, 11, 5.5, 20), P(6, 11, 1.4, 20), P(6, 11, 1.4, 90), P(6, 11, 5.5, 90)]
    .map((a) => a.map((d, j) => clamp(d, LO[j], HI[j])));
})();

/** One pass of the knob-follow branch of the teach sketch. */
async function knobFollow(io, b) {
  io.line('readKnobs(a);');
  const a = b.potVal.map((x, j) => mapInt(Math.round(x * 1023), 0, 1023, LO[j], HI[j]));
  let moved = false;
  a.forEach((deg, j) => {
    if (Math.abs(deg - b.pos[j]) > 1) { b.pos[j] = deg; moved = true; }
  });
  if (moved) {
    io.line('joint[j].write(a[j]);');
    b.arm.setJoints(toObj(b.pos));
    ['D3', 'D5', 'D6', 'D9', 'D10'].forEach((pin, i) => io.pin(pin, `${b.pos[i]}°`, true));
  }
  await io.delay(moved ? 30 : 10);
}

/** The IK sketch's goTo(): solve, then a joint-space move. Returns false when out of reach. */
async function goTo(io, b, p, x, y, z, grip, label) {
  io.line(label);
  const j = armIK(x, y, z);
  if (!j) {
    io.line('Serial.println("Out of reach");');
    io.print('Out of reach');
    return false;
  }
  io.line('moveTo(t);');
  await moveTo(io, b.arm, { ...j, grip }, p.stepms);
  return true;
}

async function pickAndStack(io, b, p, x, y) {
  io.line('if (stacked >= MAX_STACK)');
  if (b.stacked >= 3) { io.line('Serial.println("Stack full");'); io.print('Stack full'); return; }
  const top = Math.max(p.hover, (b.stacked + 1) * 2.5 + 1);
  const zs = 1.25 + b.stacked * 2.5;
  if (!(await goTo(io, b, p, x, y, p.hover, 90, 'if (!goTo(x, y, HOVER, GRIP_OPEN)) return;'))) return;
  await goTo(io, b, p, x, y, 1.25, 90, 'goTo(x, y, BLOCK / 2, GRIP_OPEN);');
  await goTo(io, b, p, x, y, 1.25, p.grip, 'goTo(x, y, BLOCK / 2, GRIP_CLOSED);');
  await goTo(io, b, p, x, y, top, p.grip, 'goTo(x, y, top, GRIP_CLOSED);');
  await goTo(io, b, p, STACK.x, STACK.y, top, p.grip, 'goTo(STACK_X, STACK_Y, top, GRIP_CLOSED);');
  await goTo(io, b, p, STACK.x, STACK.y, zs, p.grip, 'goTo(STACK_X, STACK_Y, BLOCK / 2 + stacked * BLOCK, GRIP_CLOSED);');
  await goTo(io, b, p, STACK.x, STACK.y, zs, 90, 'goTo(STACK_X, STACK_Y, BLOCK / 2 + stacked * BLOCK, GRIP_OPEN);');
  await goTo(io, b, p, STACK.x, STACK.y, top, 90, 'goTo(STACK_X, STACK_Y, top, GRIP_OPEN);');
  io.line('stacked++;');
  b.stacked++;
}

/** Grid mat in arm coordinates (the arm sits at the top-centre edge of the mat, looking down the page). */
function drawGridMat(c, s, cw, ch) {
  // mat is 36 × 22 cm centred 13.5 cm in front of the arm base (world z −29.5, arm at −16, facing −z)
  c.fillStyle = '#f6f4ee'; c.fillRect(0, 0, cw, ch);
  // world x = arm x, world z = −16 − arm y (texture top row = far edge, z = −40.5)
  const X = (ax) => (18 + ax) * s;
  const Y = (ay) => (11 + (-16 - ay) + 29.5) * s;
  c.strokeStyle = 'rgba(29,36,64,.12)'; c.lineWidth = 1;
  for (let ax = -16; ax <= 16; ax += 1) { c.beginPath(); c.moveTo(X(ax), 0); c.lineTo(X(ax), ch); c.stroke(); }
  for (let ay = 3; ay <= 24; ay += 1) { c.beginPath(); c.moveTo(0, Y(ay)); c.lineTo(cw, Y(ay)); c.stroke(); }
  c.strokeStyle = 'rgba(29,36,64,.35)'; c.lineWidth = 2;
  for (let ax = -16; ax <= 16; ax += 4) { c.beginPath(); c.moveTo(X(ax), 0); c.lineTo(X(ax), ch); c.stroke(); }
  for (let ay = 4; ay <= 24; ay += 4) { c.beginPath(); c.moveTo(0, Y(ay)); c.lineTo(cw, Y(ay)); c.stroke(); }
  // reach band
  c.strokeStyle = 'rgba(239,138,43,.6)'; c.lineWidth = 3; c.setLineDash([8, 6]);
  for (const r of [7, 15]) { c.beginPath(); c.arc(X(0), Y(0), r * s, Math.PI, 2 * Math.PI); c.stroke(); }
  c.setLineDash([]);
  c.fillStyle = '#1d2440';
  c.font = `600 ${0.7 * s}px "IBM Plex Mono", monospace`;
  c.textAlign = 'center';
  for (let ax = -12; ax <= 12; ax += 4) c.fillText(`x ${ax}`, X(ax), ch - 0.4 * s);
  c.textAlign = 'left';
  for (let ay = 8; ay <= 20; ay += 4) c.fillText(`y ${ay}`, 0.3 * s, Y(ay) - 0.2 * s);
}

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['servo', '4-DOF robot arm', 'Base, shoulder, elbow and wrist servos plus a gripper; taught by knobs or driven by inverse kinematics.', 'ind-robot-arm'],
  ['pins', 'Servo hub', 'Small board that fans five servo plugs out to signal pins and a separate 5 V supply.', 'ind-robot-arm'],
  ['bolt', '5 V 3 A supply', 'Wall adapter with a screw-terminal jack: servo power that never runs through the Uno.', 'ind-robot-arm'],
];
