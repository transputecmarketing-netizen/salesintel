// Half-size solderless breadboard: 30 columns, rows a–j, two rails each side.
import * as THREE from 'three';
import { mat, mesh, canvasTexture } from './kit.js';
import { PITCH } from './board.js';

const W = 8.4, D = 5.6, H = 0.85;
const COLS = 30;
const ROW_Z = { a: -1.397, b: -1.143, c: -0.889, d: -0.635, e: -0.381, f: 0.381, g: 0.635, h: 0.889, i: 1.143, j: 1.397 };
const RAIL_Z = { 'top-': -2.0, 'top+': -2.254, 'bot-': 2.0, 'bot+': 2.254 };
const colX = (c) => -((COLS - 1) * PITCH) / 2 + (c - 1) * PITCH;

function topTexture() {
  const cw = 2048, ch = Math.round((2048 * D) / W);
  const px = (x) => ((x + W / 2) / W) * cw;
  const pz = (z) => ((z + D / 2) / D) * ch;
  const s = cw / W;
  return canvasTexture(cw, ch, (ctx) => {
    ctx.fillStyle = '#f3ecdc';
    ctx.fillRect(0, 0, cw, ch);
    // centre channel
    ctx.fillStyle = '#d9cfba';
    ctx.fillRect(0, pz(-0.16), cw, pz(0.16) - pz(-0.16));
    const hole = (x, z) => {
      const r = 0.055 * s;
      ctx.fillStyle = '#4b4a47';
      ctx.fillRect(px(x) - r, pz(z) - r, r * 2, r * 2);
      ctx.fillStyle = '#1f1e1c';
      ctx.fillRect(px(x) - r * 0.6, pz(z) - r * 0.6, r * 1.2, r * 1.2);
    };
    for (let c = 1; c <= COLS; c++) for (const z of Object.values(ROW_Z)) hole(colX(c), z);
    for (let c = 1; c <= COLS; c++) {
      if (c % 6 === 0) continue;
      for (const z of Object.values(RAIL_Z)) hole(colX(c), z);
    }
    // rail stripes
    ctx.lineWidth = 0.025 * s;
    const stripe = (z, color) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(px(colX(1) - 0.2), pz(z));
      ctx.lineTo(px(colX(COLS) + 0.2), pz(z));
      ctx.stroke();
    };
    stripe(-2.42, '#d9443a');
    stripe(-1.83, '#3b62c9');
    stripe(1.83, '#3b62c9');
    stripe(2.42, '#d9443a');
    // row letters & column numbers
    ctx.fillStyle = '#8f8673';
    ctx.font = `600 ${0.13 * s}px "Barlow Semi Condensed", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [r, z] of Object.entries(ROW_Z)) {
      ctx.fillText(r, px(colX(1) - 0.32), pz(z));
      ctx.fillText(r, px(colX(COLS) + 0.32), pz(z));
    }
    for (let c = 1; c <= COLS; c += c === 1 ? 4 : 5) {
      ctx.fillText(String(c), px(colX(c)), pz(-1.62));
      ctx.fillText(String(c), px(colX(c)), pz(1.62));
    }
    ctx.fillStyle = '#d9443a';
    ctx.font = `700 ${0.2 * s}px "Barlow Semi Condensed", sans-serif`;
    ctx.fillText('+', px(colX(1) - 0.35), pz(-2.25));
    ctx.fillText('+', px(colX(1) - 0.35), pz(2.25));
    ctx.fillStyle = '#3b62c9';
    ctx.fillText('–', px(colX(1) - 0.35), pz(-2.0));
    ctx.fillText('–', px(colX(1) - 0.35), pz(2.0));
  });
}

let texCache;
export function makeBreadboard() {
  const g = new THREE.Group();
  g.name = 'breadboard';
  texCache ??= topTexture();
  const side = mat(0xebe2cd, { rough: 0.85 });
  const top = mat(0xffffff, { map: texCache, rough: 0.85, unique: true });
  const body = mesh(new THREE.BoxGeometry(W, H, D), [side, side, top, side, side, side]);
  body.position.y = H / 2;
  g.add(body);
  // centre groove
  const groove = mesh(new THREE.BoxGeometry(W - 0.02, 0.02, 0.3), mat(0xcfc4ad), { outline: false });
  groove.position.y = H - 0.005;
  g.add(groove);

  return {
    group: g,
    kind: 'breadboard',
    label: 'Half-size breadboard',
    top: H,
    /** World position of a hole, e.g. hole(12, 'e') or hole(3, 'top-') */
    hole(col, row) {
      const z = ROW_Z[row] ?? RAIL_Z[row];
      return new THREE.Vector3(colX(col), H, z).applyMatrix4(g.matrixWorld);
    },
  };
}
