// Dev harness: renders one board on the real Stage for visual QA.
// Query params: b=<type> led=1 fan=1 markers=1 wires=1 clean=1
//               cx,cy,cz (frame centre) size az zoom
import '@fontsource/barlow-semi-condensed/500.css';
import '@fontsource/barlow-semi-condensed/600.css';
import '@fontsource/barlow-semi-condensed/700.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import * as THREE from 'three';
import { Stage } from '../src/scene/stage.js';
import { makeWire } from '../src/scene/wire.js';
import { makeBoardOfType, BOARD_INFO } from '../src/scene/boards/index.js';
import { makeCSICamera, makeRibbon } from '../src/scene/boards/jetson.js';

const q = new URLSearchParams(location.search);
const type = q.get('b') ?? 'esp32';
const num = (k, d) => (q.has(k) ? Number(q.get(k)) : d);
const FIT = { uno: 8.5, mega: 12, nano: 5.5, esp32: 6.5, pico: 6.5, jetson: 16 };
const WIRE_PINS = {
  uno: ['D13', 'GND', '5V', 'A0'],
  mega: ['D13', 'D53', 'A15', 'D21', '5V_2', 'GND_5'],
  nano: ['D13', 'D2', 'GND', 'A7'],
  esp32: ['GPIO2', 'GND', '3V3', 'EN', 'D23'],
  pico: ['GP25', 'GP0', 'GND', 'VBUS', 'GP16'],
  jetson: ['PIN1', 'PIN2', 'PIN39', 'PIN40', 'PWM0'],
};

if (q.get('clean') === '1') document.body.classList.add('clean');
const bar = document.getElementById('bar');
for (const t of Object.keys(FIT)) {
  const a = document.createElement('a');
  a.href = `?b=${t}`;
  a.textContent = t;
  if (t === type) a.setAttribute('aria-current', 'page');
  bar.append(a);
}

async function main() {
  await Promise.all([
    document.fonts.load('600 20px "Barlow Semi Condensed"'),
    document.fonts.load('700 20px "Barlow Semi Condensed"'),
    document.fonts.load('500 20px "Barlow Semi Condensed"'),
    document.fonts.load('600 20px "IBM Plex Mono"'),
    document.fonts.load('500 20px "IBM Plex Mono"'),
  ]);
  const host = document.getElementById('stage');
  const stage = new Stage(document.getElementById('board-canvas'), host);
  const root = new THREE.Group();
  const board = makeBoardOfType(type);
  root.add(board.group);
  let fitCenter = [0, 0.5, 0];
  let size = FIT[type] ?? 10;

  if (type === 'jetson') {
    const cam = makeCSICamera(new THREE.Vector3(-8.3, 0, -0.2));
    root.add(cam.group);
    root.updateMatrixWorld(true);
    const ribbon = makeRibbon(board.csi, cam.ribbonEnd, 1.6, { dirB: cam.ribbonDir, axisA: board.csiAxis, axisB: cam.ribbonAxis, bendB: cam.ribbonBend });
    root.add(ribbon.group);
    fitCenter = [-1.8, 0.8, 0];
    window.__cam = cam;
  }
  stage.setContent(root);
  root.updateMatrixWorld(true);

  if (q.get('led') === '1') board.setBuiltinLed(1);
  if (q.get('led') === '0') board.setBuiltinLed(0);
  if (q.get('fan') && board.setFan) board.setFan(Number(q.get('fan')));
  if (board.tick) stage.onTick((dt) => board.tick(dt));

  if (q.get('markers') === '1') {
    const geo = new THREE.SphereGeometry(0.05, 8, 6);
    const m = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    for (const p of board.pins) {
      const s = new THREE.Mesh(geo, m);
      s.position.copy(board.pin(p));
      root.add(s);
    }
    const am = new THREE.MeshBasicMaterial({ color: 0x00c0ff });
    for (const v of Object.values(board.anchors)) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), am);
      s.position.copy(v);
      root.add(s);
    }
  }
  if (q.get('wires') === '1') {
    const colors = ['red', 'black', 'orange', 'yellow', 'green', 'blue'];
    (WIRE_PINS[type] ?? []).forEach((p, i) => {
      const a = board.pin(p);
      const b = a.clone().add(new THREE.Vector3(-1.5 + i * 0.7, 0, 4.5 + (i % 2) * 0.6)).setY(0.6);
      root.add(makeWire(a, b, colors[i % colors.length]).group);
    });
  }

  const center = [num('cx', fitCenter[0]), num('cy', fitCenter[1]), num('cz', fitCenter[2])];
  stage.frame({ center, size: num('size', size), az: num('az', 0) }, true);
  const z = num('zoom', 1);
  stage.goal.zoom *= z;
  stage.cam.zoom = stage.goal.zoom;

  const info = BOARD_INFO[type];
  document.getElementById('info').textContent = `${board.name} · ${info?.chip ?? ''} · ${board.pins.length} pins: ${board.pins.join(' ')}`;
  window.__board = board;
  window.__stage = stage;
  setTimeout(() => (window.__ready = true), 1200);
}

main().catch((e) => {
  document.getElementById('info').textContent = `ERROR: ${e.stack ?? e}`;
  window.__error = String(e.stack ?? e);
  window.__ready = true;
});
