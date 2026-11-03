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
      const pots = [], potVal = [0.5, 0.63, 0.29, 0.22, 1];
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
        IK_LAYOUTS[k].forEach(([x, y], i) => place(pool[i], x, y));
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
      { anchor: 'stack', x: 0.7, y: 0.17, icon: 'check', title: 'Stack at (6, 8)', text: 'Each block lands 2.5 cm higher than the last; four fit.' },
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
const int MAX_STACK = 4;
const float BLOCKS[][2] = {{-7, 11}, {-2, 13}, {2, 13}};

Servo joint[5];
int pos[5] = {90, 110, 70, 40, GRIP_OPEN};
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
  out[3] = round(90 + degrees(-HALF_PI - fore));
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
];

// ---------------------------------------------------------------- arm lesson data + sim helpers
const LO = [0, 15, 30, 0, 0], HI = [180, 165, 180, 180, 90];
const STACK = { x: 6, y: 8 };
const IK_BLOCKS = [[-7, 11], [-2, 13], [2, 13]];
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
  if (b.stacked >= 4) { io.line('Serial.println("Stack full");'); io.print('Stack full'); return; }
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
