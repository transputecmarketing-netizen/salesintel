// Display modules: SSD1306 OLED, 16×2 I2C LCD, WS2812 ring / strip and the
// breadboard-mounted 7-segment digit, DIP IC and LED bar graph.
import {
  THREE, V, mat, mesh, box, cyl, at, canvasTexture, glowSprite, metal, slab, roundedRectShape,
  makeBreakout, freeApi, silkPlane, textDecal, soic, smdField, smd, trimRound, emissiveMat, noRay,
  standLegs, midOf, yawOf, PITCH, PCB, MONO, SANS,
} from './common.js';
import { glyph } from './font5x7.js';

// ---------------------------------------------------------------- pixel font helper
function drawText5x7(ctx, str, x, y, scale = 1) {
  let cx = x;
  for (const ch of str) {
    const cols = glyph(ch);
    for (let c = 0; c < 5; c++)
      for (let r = 0; r < 8; r++) if (cols[c] & (1 << r)) ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
    cx += 6 * scale;
  }
  return cx;
}

// ================================================================= OLED
/**
 * 0.96" SSD1306 128×64 I2C OLED. Pins GND, VCC, SCL, SDA (back edge).
 * opts: rotY, color (pixel colour, default cyan-white), yellowTop (two-colour panel).
 */
export function makeOLED(pos, opts = {}) {
  const b = makeBreakout({
    w: 2.7, d: 2.8, color: 0x1a3a8a, pins: ['GND', 'VCC', 'SCL', 'SDA'], pinsEdge: 'back', inset: 0.2,
    holes: [[-1.12, -1.18], [1.12, -1.18], [-1.12, 1.2], [1.12, 1.2]], holeR: 0.1, radius: 0.1,
    silk: (P) => {
      P.text('128×64', 1.0, -0.83, 0.1, { align: 'right' });
      P.text('I2C', -1.0, -0.83, 0.1, { align: 'left' });
    },
  });
  const g = b.group;
  const top = b.top;
  // glass panel on a little tape layer
  const glassY = top + 0.05;
  g.add(at(box(2.62, 0.05, 1.62, mat(0xe9e4d4), { outline: false }), 0, top + 0.025, 0.18));
  const glass = box(2.66, 0.13, 1.66, mat(0x0b0c10, { rough: 0.18, metal: 0.25 }));
  g.add(at(glass, 0, glassY + 0.065, 0.17));
  // flex ribbon folding round the front edge
  g.add(at(box(1.1, 0.03, 0.18, mat(0xc98a3c, { rough: 0.5 }), { outline: false }), 0, top + 0.02, 1.08));
  // live screen
  const SW = 2.18, SH = 1.09;
  const tex = canvasTexture(512, 256, (ctx) => {
    ctx.fillStyle = '#040506';
    ctx.fillRect(0, 0, 512, 256);
  });
  tex.magFilter = THREE.LinearFilter;
  const big = tex.image;
  const bctx = big.getContext('2d');
  const screenMat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0, roughness: 0.22, metalness: 0.1 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), screenMat);
  screen.rotation.x = -Math.PI / 2;
  screen.position.set(0, glassY + 0.132, 0.05);
  g.add(screen);
  // faint bloom over the panel when lit
  const bloom = noRay(new THREE.Mesh(
    new THREE.PlaneGeometry(SW * 1.25, SH * 1.5),
    new THREE.MeshBasicMaterial({ map: glowSprite().material.map, color: 0x7fe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  ));
  bloom.rotation.x = -Math.PI / 2;
  bloom.position.set(0, glassY + 0.15, 0.05);
  g.add(bloom);

  // logical 128×64 buffer
  const lc = document.createElement('canvas');
  lc.width = 128;
  lc.height = 64;
  const lctx = lc.getContext('2d', { willReadFrequently: true });
  const col = new THREE.Color(opts.color ?? '#a6f1ff');
  const yel = new THREE.Color('#ffd84a');
  const img = bctx.createImageData(512, 256);
  const clearBuf = () => {
    lctx.fillStyle = '#000';
    lctx.fillRect(0, 0, 128, 64);
  };
  function flush() {
    const src = lctx.getImageData(0, 0, 128, 64).data;
    const d = img.data;
    let any = false;
    for (let Y = 0; Y < 256; Y++) {
      const ly = Y >> 2, sy = Y & 3;
      const c = opts.yellowTop && ly < 16 ? yel : col;
      const cr = c.r * 255, cg = c.g * 255, cb = c.b * 255;
      for (let X = 0; X < 512; X++) {
        const lx = X >> 2, sx = X & 3;
        const si = (ly * 128 + lx) * 4;
        const on = src[si] + src[si + 1] + src[si + 2] > 380;
        const o = (Y * 512 + X) * 4;
        if (on && sx < 3 && sy < 3) {
          d[o] = cr; d[o + 1] = cg; d[o + 2] = cb;
          any = true;
        } else {
          d[o] = 4; d[o + 1] = 5; d[o + 2] = 7;
        }
        d[o + 3] = 255;
      }
    }
    bctx.putImageData(img, 0, 0);
    tex.needsUpdate = true;
    screenMat.emissiveIntensity = any ? 0.95 : 0;
    bloom.material.opacity = any ? 0.18 : 0;
  }
  clearBuf();

  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0, 1.4, 0) });
  Object.assign(api, {
    width: 128,
    height: 64,
    /** The logical 128×64 canvas (white = lit). */
    canvas: lc,
    /** Draw with fn(ctx, 128, 64) in logical pixels; anything brighter than mid-grey lights up. */
    draw(fn, o = {}) {
      if (o.clear !== false) clearBuf();
      lctx.save();
      lctx.fillStyle = '#fff';
      lctx.strokeStyle = '#fff';
      lctx.lineWidth = 1;
      fn(lctx, 128, 64);
      lctx.restore();
      flush();
      return api;
    },
    clear() {
      clearBuf();
      flush();
      return api;
    },
    /** Pixel-font text. o: { x=0, y=0, size=1 (1 → 6×8 px cells, 21×8 chars), lineHeight, align: left|center|right, clear=true } */
    text(lines, o = {}) {
      const arr = Array.isArray(lines) ? lines : String(lines).split('\n');
      if (o.clear !== false) clearBuf();
      const s = o.size ?? 1;
      const lh = o.lineHeight ?? 8 * s + (s > 1 ? 2 : 1);
      lctx.fillStyle = '#fff';
      arr.forEach((line, i) => {
        const str = String(line);
        const w = str.length * 6 * s - s;
        let x = o.x ?? 0;
        if (o.align === 'center') x = (o.x ?? 64) - w / 2;
        else if (o.align === 'right') x = (o.x ?? 128) - w;
        drawText5x7(lctx, str, Math.round(x), (o.y ?? 0) + i * lh, s);
      });
      flush();
      return api;
    },
    /** Outlined progress bar, frac 0..1 filled. Draws over existing content. */
    bar(x, y, w, h, frac) {
      lctx.fillStyle = '#fff';
      lctx.fillRect(x, y, w, 1);
      lctx.fillRect(x, y + h - 1, w, 1);
      lctx.fillRect(x, y, 1, h);
      lctx.fillRect(x + w - 1, y, 1, h);
      lctx.fillStyle = '#000';
      lctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      lctx.fillStyle = '#fff';
      const f = Math.max(0, Math.min(1, frac));
      if (f > 0) lctx.fillRect(x + 2, y + 2, Math.round((w - 4) * f), h - 4);
      flush();
      return api;
    },
    pixel(x, y, on = true) {
      lctx.fillStyle = on ? '#fff' : '#000';
      lctx.fillRect(x | 0, y | 0, 1, 1);
      flush();
      return api;
    },
  });
  return api;
}

// ================================================================= LCD 16×2
/**
 * 16×2 character LCD with a PCF8574 I2C backpack. Pins GND, VCC, SDA, SCL on
 * the backpack header sticking out on the left. opts: rotY, variant 'green' | 'blue'.
 */
export function makeLCD1602(pos, opts = {}) {
  const g = new THREE.Group();
  const LIFT = 1.2; // LCD PCB raised on standoffs above the backpack
  // --- backpack (blue) on the ground, header protruding on the left
  const bp = makeBreakout({
    w: 5.9, d: 2.1, color: 0x2a5cb8, pins: ['GND', 'VCC', 'SDA', 'SCL'], pinsEdge: 'left', pinOffset: -0.3, inset: 0.62, labelSide: 'out',
    silk: (P) => {
      P.text('I2C', -2.6, 0.62, 0.13, { weight: 700 });
      P.text('LED', -1.95, 0.88, 0.09);
    },
  });
  bp.group.position.set(-2.75, 0, -0.85);
  g.add(bp.group);
  bp.on(soic(8, { label: 'PCF8574T', len: 1.05, wid: 0.5 }), 0.9, 0.35);
  const pot = new THREE.Group();
  pot.add(at(box(0.66, 0.42, 0.66, mat(0x2f62c9, { rough: 0.5 })), 0, 0.21, 0));
  pot.add(at(cyl(0.2, 0.2, 0.06, mat(0xe8e4da), { seg: 16 }), 0, 0.45, 0));
  pot.add(at(box(0.28, 0.02, 0.05, mat(0x55575c), { outline: false }), 0, 0.485, 0));
  bp.on(pot, -1.55, 0.5);
  // LED jumper
  const jp = new THREE.Group();
  jp.add(at(box(0.25, 0.25, 0.5, mat(0x23262e)), 0, 0.125, 0));
  jp.add(at(box(0.26, 0.5, 0.52, mat(0x2b2d33, { rough: 0.6 })), 0, 0.5, 0));
  bp.on(jp, -2.1, -0.15).rotation.y = Math.PI / 2;
  smdField(bp, [[0.5, -0.4], [0.9, -0.4], [1.3, -0.4], [1.8, 0.3, Math.PI / 2], [2.1, 0.3, Math.PI / 2, 'cap']]);
  const pinsLocal = new Map();
  for (const [k, p] of bp.pinsLocal) pinsLocal.set(k, p.clone().add(bp.group.position));

  // --- LCD PCB (green)
  const lcd = makeBreakout({
    w: 8.0, d: 3.6, color: opts.variant === 'blue' ? 0x2d6a3c : 0x2c7a46, pins: [],
    holes: [[-3.75, -1.55], [3.75, -1.55], [-3.75, 1.55], [3.75, 1.55]], holeR: 0.15, radius: 0.1,
    silk: (P) => {
      const names = ['VSS', 'VDD', 'V0', 'RS', 'RW', 'E', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'A', 'K'];
      names.forEach((n, i) => {
        const x = -3.6 + i * PITCH;
        P.circle(x, -1.55, 0.08, { fill: '#d8b866' });
        P.circle(x, -1.55, 0.035, { fill: '#2a2a2a' });
        P.text(n, x, -1.3, 0.07);
      });
      P.text('1', -3.6, -1.75, 0.09);
      P.text('16', 0.21, -1.75, 0.09);
      P.text('LCD1602', 2.6, -1.45, 0.16, { weight: 700 });
    },
  });
  lcd.group.position.y = LIFT;
  g.add(lcd.group);
  // 16-pin header joining LCD and backpack
  const strip = box(16 * PITCH, LIFT - 0.16, PITCH, mat(0x23262e));
  strip.position.set(-3.6 + 7.5 * PITCH, 0.16 + (LIFT - 0.16) / 2, -1.55);
  g.add(strip);
  // standoffs
  for (const [x, z] of [[3.75, -1.55], [-3.75, 1.55], [3.75, 1.55]]) g.add(at(cyl(0.16, 0.16, LIFT, mat(0xd8c9a0, { metal: 0.3, rough: 0.4 }), { seg: 6 }), x, LIFT / 2, z));
  // bezel + display window
  const bezelY = LIFT + lcd.top;
  const bezel = box(7.12, 0.62, 2.42, mat(0x1d1f25, { rough: 0.55 }));
  g.add(at(bezel, 0, bezelY + 0.31, 0.12));
  g.add(at(box(6.9, 0.03, 2.08, mat(0x3a3e1e, { rough: 0.3 }), { outline: false }), 0, bezelY + 0.625, 0.12));
  // character texture
  const blue = opts.variant === 'blue';
  const DW = 6.6, DH = 1.62;
  const CW = 1600, CH = Math.round((CW * DH) / DW);
  const tex = canvasTexture(CW, CH, () => {});
  const tctx = tex.image.getContext('2d');
  const dispMat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.5, roughness: 0.35 });
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(DW, DH), dispMat);
  disp.rotation.x = -Math.PI / 2;
  disp.position.set(0, bezelY + 0.645, 0.12);
  g.add(disp);

  const rows = [Array(16).fill(' '), Array(16).fill(' ')];
  let light = true;
  const cursor = { col: 0, row: 0 };
  function render() {
    const k = CW / 66; // px per mm (texture spans 66 × 16.2 mm)
    tctx.fillStyle = blue ? (light ? '#2a63e8' : '#17336f') : light ? '#b8d43c' : '#6f7c2c';
    tctx.fillRect(0, 0, CW, CH);
    // vignette edges of the backlight
    const grd = tctx.createLinearGradient(0, 0, 0, CH);
    grd.addColorStop(0, 'rgba(0,0,0,.18)');
    grd.addColorStop(0.15, 'rgba(0,0,0,0)');
    grd.addColorStop(0.85, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,.18)');
    tctx.fillStyle = grd;
    tctx.fillRect(0, 0, CW, CH);
    const cellW = 2.95, cellH = 5.55, gapX = 0.55, gapY = 0.6;
    const x0 = (66 - (16 * cellW + 15 * gapX)) / 2;
    const y0 = (16.2 - (2 * cellH + gapY)) / 2;
    const dw = cellW / 5, dh = cellH / 8;
    const off = blue ? 'rgba(255,255,255,.07)' : 'rgba(40,70,0,.13)';
    const on = blue ? '#eef4ff' : '#1c2a0e';
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 16; c++) {
        const cx = x0 + c * (cellW + gapX), cy = y0 + r * (cellH + gapY);
        const cols = glyph(rows[r][c]);
        for (let i = 0; i < 5; i++)
          for (let j = 0; j < 8; j++) {
            tctx.fillStyle = cols[i] & (1 << j) ? on : off;
            tctx.fillRect((cx + i * dw) * k, (cy + j * dh) * k, dw * 0.88 * k, dh * 0.88 * k);
          }
      }
    tex.needsUpdate = true;
    dispMat.emissiveIntensity = light ? 0.55 : 0.04;
  }
  render();

  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, LIFT + 1.6, 0) });
  Object.assign(api, {
    cols: 16,
    rows: 2,
    /** print(row, col, text) — or print(text) at the cursor. */
    print(a, b, c) {
      let r, col, text;
      if (b === undefined) {
        r = cursor.row;
        col = cursor.col;
        text = String(a);
      } else {
        r = a;
        col = b;
        text = String(c ?? '');
      }
      for (const ch of text) {
        if (r > 1) break;
        if (col < 16 && col >= 0) rows[r][col] = ch;
        col++;
      }
      cursor.row = r;
      cursor.col = col;
      render();
      return api;
    },
    /** Arduino order: setCursor(col, row). */
    setCursor(col, row) {
      cursor.col = col;
      cursor.row = row;
      return api;
    },
    clear() {
      rows.forEach((rw) => rw.fill(' '));
      cursor.col = cursor.row = 0;
      render();
      return api;
    },
    backlight(on = true) {
      light = !!on;
      render();
      return api;
    },
    get lines() { return rows.map((r) => r.join('')); },
  });
  return api;
}

// ================================================================= NeoPixels
function pixelLED() {
  const g = new THREE.Group();
  g.add(at(box(0.5, 0.15, 0.5, mat(0xf3f1ea, { rough: 0.5 })), 0, 0.075, 0));
  const lens = mat(0xf6f2df, { emissive: 0xffffff, emissiveIntensity: 0, unique: true, rough: 0.3 });
  g.add(at(cyl(0.19, 0.19, 0.03, lens, { outline: false, seg: 20 }), 0, 0.16, 0));
  g.add(at(box(0.06, 0.02, 0.06, mat(0x8a7a50), { outline: false }), 0.03, 0.18, 0.02));
  const glow = glowSprite(0xffffff, 1.05);
  glow.position.y = 0.35;
  g.add(glow);
  const c = new THREE.Color();
  return {
    group: g,
    apply(r, gg, b) {
      const m = Math.max(r, gg, b);
      if (m <= 0) {
        lens.emissiveIntensity = 0;
        lens.color.setHex(0xf6f2df);
        glow.material.opacity = 0;
        return;
      }
      c.setRGB(r / m, gg / m, b / m, THREE.SRGBColorSpace);
      lens.emissive.copy(c);
      lens.color.copy(c).multiplyScalar(0.3);
      lens.emissiveIntensity = 0.25 + (m / 255) * 0.5;
      glow.material.color.copy(c);
      glow.material.opacity = 0.2 + (m / 255) * 0.55;
    },
  };
}

function pixelApi(api, leds, light) {
  const n = leds.length;
  const buf = new Uint8Array(n * 3);
  const avg = new THREE.Color();
  return Object.assign(api, {
    count: n,
    setPixel(i, r, g, b) {
      if (i < 0 || i >= n) return api;
      buf[i * 3] = r;
      buf[i * 3 + 1] = g;
      buf[i * 3 + 2] = b;
      return api;
    },
    getPixel(i) { return [buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2]]; },
    fill(r, g, b) {
      for (let i = 0; i < n; i++) api.setPixel(i, r, g, b);
      return api;
    },
    clear() { return api.fill(0, 0, 0); },
    /** Push the buffer to the LEDs (like strip.show()). */
    show() {
      let sr = 0, sg = 0, sb = 0;
      for (let i = 0; i < n; i++) {
        leds[i].apply(buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2]);
        sr += buf[i * 3];
        sg += buf[i * 3 + 1];
        sb += buf[i * 3 + 2];
      }
      const m = Math.max(sr, sg, sb);
      if (light) {
        if (m > 0) avg.setRGB(sr / m, sg / m, sb / m);
        light.color.copy(avg);
        light.intensity = (m / (255 * n)) * 2.5;
      }
      return api;
    },
  });
}

/** 12-LED WS2812B ring. Pins DIN, 5V, GND on a tab at the back. opts: rotY. */
export function makeNeoPixelRing(pos, opts = {}) {
  const n = opts.count ?? 12;
  const R = 1.85, r = 1.15, LR = 1.5;
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, r, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const ringGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false, curveSegments: 40 });
  ringGeo.rotateX(-Math.PI / 2);
  g.add(mesh(ringGeo, mat(PCB.black, { rough: 0.55 }), { edgeAngle: 40 }));
  // pin tab
  const tab = makeBreakout({ w: 1.25, d: 0.95, color: PCB.black, pins: ['DIN', '5V', 'GND'], pinsEdge: 'back', inset: 0.18, radius: 0.1 });
  tab.group.position.set(0, -0.001, -R - 0.3);
  g.add(tab.group);
  const pinsLocal = new Map();
  for (const [k, p] of tab.pinsLocal) pinsLocal.set(k, p.clone().add(tab.group.position));
  // silkscreen: pixel indices + data arrows
  const silk = silkPlane(2 * R, 2 * R, (P) => {
    for (let i = 0; i < n; i++) {
      const a2 = ((i + 0.5) / n) * Math.PI * 2;
      P.text('›', Math.sin(a2) * 1.5, -Math.cos(a2) * 1.5, 0.22, { rot: a2, weight: 700 });
    }
    P.text('0', 0, -1.79, 0.11, { weight: 700 });
    P.circle(0, 0, R - 0.05, { stroke: 'rgba(255,255,255,.25)', lw: 0.02 });
  });
  silk.position.y = 0.162;
  g.add(silk);
  const leds = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const led = pixelLED();
    led.group.position.set(Math.sin(a) * LR, 0.16, -Math.cos(a) * LR);
    led.group.rotation.y = -a;
    g.add(led.group);
    leds.push(led);
  }
  const light = new THREE.PointLight(0xffffff, 0, 6, 1.6);
  light.position.y = 0.8;
  g.add(light);
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, 1.2, 0) });
  return pixelApi(api, leds, light);
}

/** WS2812B strip segment with `n` LEDs (60/m), header DIN/5V/GND at the left end. */
export function makeNeoPixelStrip(pos, n = 8, opts = {}) {
  const pitch = 1.667;
  const len = n * pitch + 0.9;
  const b = makeBreakout({
    w: len, d: 1.0, color: opts.color ?? PCB.black, pins: ['DIN', '5V', 'GND'], pinsEdge: 'left', inset: 0.18, radius: 0.05, thickness: 0.08,
    silk: (P) => {
      for (let i = 0; i < n; i++) {
        const x = -len / 2 + 0.9 + (i + 0.5) * pitch;
        P.text('→', x + 0.55, -0.32, 0.16);
        P.text(String(i), x - 0.5, -0.32, 0.13, { weight: 700 });
        if (i > 0) {
          const cx = x - pitch / 2;
          P.line([[cx, -0.45], [cx, 0.45]], { color: 'rgba(255,255,255,.35)', lw: 0.015 });
          for (const z of [-0.25, 0, 0.25]) P.rect(cx, z, 0.22, 0.14, { fill: '#c9a24a', r: 0.03 });
        }
      }
    },
  });
  const g = b.group;
  const leds = [];
  for (let i = 0; i < n; i++) {
    const led = pixelLED();
    b.on(led.group, -len / 2 + 0.9 + (i + 0.5) * pitch, 0.08);
    leds.push(led);
  }
  const light = new THREE.PointLight(0xffffff, 0, 8, 1.6);
  light.position.y = 1;
  g.add(light);
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0, 1.2, 0) });
  return pixelApi(api, leds, light);
}

// ================================================================= 7-segment (breadboard)
const SEG_DIGITS = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71];

/**
 * Single-digit common-cathode 7-segment display straddling the channel.
 * holes: 10 Vector3s — top row left→right (pins g, f, COM, a, b) then bottom
 * row left→right (pins e, d, COM, c, DP).
 */
export function makeSevenSegment(holes) {
  const g = new THREE.Group();
  const topRow = holes.slice(0, 5), botRow = holes.slice(5, 10);
  const tm = midOf(...topRow.map((p) => p.clone())), bm = midOf(...botRow.map((p) => p.clone()));
  const m = tm.clone().add(bm).multiplyScalar(0.5);
  const h = 0.22;
  const body = new THREE.Group();
  body.position.set(m.x, m.y + h, m.z);
  body.rotation.y = yawOf(topRow[0], topRow[4]);
  body.updateMatrix();
  const gap = tm.distanceTo(bm);
  const BW = 1.25, BD = Math.max(1.9, gap + 0.3), BH = 0.8;
  const side = mat(0xe9e6dc, { rough: 0.6 });
  const face = mat(0x1b1c20, { rough: 0.45 });
  body.add(at(mesh(new THREE.BoxGeometry(BW, BH, BD), [side, side, face, side, side, side]), 0, BH / 2, 0));
  // pin feet: straight down under the body
  standLegs(g, holes, holes, h + 0.05, 0.024);
  // segments
  const H = 0.68, W = 0.36, T = 0.15, slant = 0.12, gp = 0.025;
  const sk = (x, z) => [x - z * slant, z];
  const hex = (x1, z1, x2, z2, vertical) => {
    const s = new THREE.Shape();
    const pts = vertical
      ? [[x1, z1 + gp], [x1 + T / 2, z1 + T / 2 + gp], [x2 + T / 2, z2 - T / 2 - gp], [x2, z2 - gp], [x2 - T / 2, z2 - T / 2 - gp], [x1 - T / 2, z1 + T / 2 + gp]]
      : [[x1 + gp, z1], [x1 + T / 2 + gp, z1 - T / 2], [x2 - T / 2 - gp, z2 - T / 2], [x2 - gp, z2], [x2 - T / 2 - gp, z2 + T / 2], [x1 + T / 2 + gp, z1 + T / 2]];
    pts.map(([x, z]) => sk(x, z)).forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
    s.closePath();
    return s;
  };
  const shapes = [
    hex(-W, -H, W, -H, false), // a
    hex(W, -H, W, 0, true), // b
    hex(W, 0, W, H, true), // c
    hex(-W, H, W, H, false), // d
    hex(-W, 0, -W, H, true), // e
    hex(-W, -H, -W, 0, true), // f
    hex(-W, 0, W, 0, false), // g
  ];
  const dp = new THREE.Shape();
  const [dx, dz] = sk(W + 0.2, H);
  dp.absarc(dx, -dz, 0.07, 0, Math.PI * 2, false);
  shapes.push(dp);
  const red = 0xff2a1a;
  const segs = shapes.map((s) => {
    const sm = mat(0x3b3533, { emissive: 0xff1a0a, emissiveIntensity: 0, unique: true, rough: 0.4 });
    const geo = new THREE.ShapeGeometry(s);
    geo.rotateX(-Math.PI / 2);
    const segMesh = new THREE.Mesh(geo, sm);
    segMesh.position.y = BH + 0.004;
    body.add(segMesh);
    geo.computeBoundingBox();
    const c = geo.boundingBox.getCenter(V());
    const glow = glowSprite(red, 0.7);
    glow.position.set(c.x, BH + 0.2, c.z);
    body.add(glow);
    return { sm, glow };
  });
  g.add(body);
  let mask = 0;
  const api = {
    group: g,
    pick: body,
    anchor: new THREE.Vector3(m.x, m.y + h + 1.4, m.z),
    pinNames: ['g', 'f', 'COM', 'a', 'b', 'e', 'd', 'COM', 'c', 'DP'],
    get mask() { return mask; },
    /** bit0 = a … bit6 = g, bit7 = dp. */
    setSegments(bits) {
      mask = bits & 0xff;
      segs.forEach(({ sm, glow }, i) => {
        const on = (mask >> i) & 1;
        sm.color.setHex(on ? 0xe0220f : 0x3b3533);
        sm.emissiveIntensity = on ? 0.5 : 0;
        glow.material.opacity = on ? 0.5 : 0;
      });
      return api;
    },
    /** Show 0–9 (or 10–15 as A–F); dp optional. Pass null to blank. */
    showDigit(n, dp = false) {
      return api.setSegments((n == null ? 0 : SEG_DIGITS[n & 15]) | (dp ? 0x80 : 0));
    },
  };
  return api;
}

// ================================================================= DIP IC (breadboard)
/**
 * Generic DIP IC straddling the channel. holes: pins 1..n/2 along one side then
 * n/2+1..n back along the other (standard counter-clockwise numbering seen from above).
 */
export function makeDIP(holes, label = '', pinCount = holes.length) {
  const n = pinCount;
  const half = n / 2;
  const g = new THREE.Group();
  const A = holes.slice(0, half), B = holes.slice(half, n);
  const m = midOf(...holes.slice(0, n).map((p) => p.clone()));
  const body = new THREE.Group();
  body.position.set(m.x, m.y, m.z);
  body.rotation.y = yawOf(A[0], A[half - 1]);
  body.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(body.matrixWorld).invert();
  const local = holes.slice(0, n).map((p) => p.clone().applyMatrix4(inv));
  const len = half * PITCH + 0.06;
  const BW = 0.62, BH = 0.34, lift = 0.1;
  body.add(at(box(len, BH, BW, mat(0x222328, { rough: 0.5 })), 0, lift + BH / 2, 0));
  const leg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 1, 0.045), metal(), n * 2);
  const t = new THREE.Object3D();
  local.forEach((p, i) => {
    const s = Math.sign(p.z) || 1;
    // shoulder from body side to the hole column
    t.position.set(p.x, lift + 0.1, s * (BW / 2 + Math.abs(p.z)) / 2);
    t.scale.set(1, 0.05, (Math.abs(p.z) - BW / 2 + 0.03) / 0.045);
    t.updateMatrix();
    leg.setMatrixAt(i * 2, t.matrix);
    // vertical pin into the hole
    t.position.set(p.x, (lift + 0.1 - 0.06) / 2, p.z);
    t.scale.set(0.6, lift + 0.16, 1);
    t.updateMatrix();
    leg.setMatrixAt(i * 2 + 1, t.matrix);
  });
  leg.castShadow = true;
  body.add(leg);
  const p1x = local[0].x, ex = Math.sign(p1x) || -1;
  const notch = cyl(0.09, 0.09, 0.012, mat(0x0f1013), { outline: false, thetaLength: Math.PI });
  notch.rotation.y = ex < 0 ? Math.PI : 0;
  body.add(at(notch, ex * (len / 2 - 0.002), lift + BH + 0.002, 0));
  const zs = Math.sign(local[0].z) || 1;
  body.add(at(cyl(0.045, 0.045, 0.01, mat(0x0f1013), { outline: false, seg: 12 }), p1x - ex * 0.02, lift + BH + 0.002, zs * 0.17));
  if (label) {
    const lab = textDecal(label, len * 0.82, 0.34, { color: '#cfd2da', size: 0.55 });
    lab.position.y = lift + BH + 0.004;
    if (zs < 0) lab.rotation.z = Math.PI; // keep text upright relative to pin 1 at bottom-left
    body.add(lab);
  }
  g.add(body);
  return { group: g, pick: body, anchor: new THREE.Vector3(m.x, m.y + 1.0, m.z) };
}

// ================================================================= LED bar graph (breadboard)
/**
 * 10-segment LED bar graph straddling the channel. holes: 20 Vector3s — one
 * row left→right (anodes, segment 0..9) then the other row left→right (cathodes).
 * opts.colors: array of 10 hex colours (default green→yellow→red).
 */
export function makeLEDBar(holes, opts = {}) {
  const g = new THREE.Group();
  const A = holes.slice(0, 10);
  const m = midOf(...holes.map((p) => p.clone()));
  const h = 0.2;
  const body = new THREE.Group();
  body.position.set(m.x, m.y + h, m.z);
  body.rotation.y = yawOf(A[0], A[9]);
  const BW = 2.54, BD = 1.01, BH = 0.8;
  const side = mat(0xe8e5dc, { rough: 0.6 });
  const face = mat(0x1b1c20, { rough: 0.45 });
  body.add(at(mesh(new THREE.BoxGeometry(BW, BH, BD), [side, side, face, side, side, side]), 0, BH / 2, 0));
  standLegs(g, holes, holes, h + 0.05, 0.022);
  const colors = opts.colors ?? [0x35d46a, 0x35d46a, 0x35d46a, 0x35d46a, 0x35d46a, 0x35d46a, 0xffc929, 0xffc929, 0xff3b2f, 0xff3b2f];
  const segs = colors.map((c, i) => {
    const sm = mat(0x3a3533, { emissive: c, emissiveIntensity: 0, unique: true, rough: 0.4 });
    const s = box(0.17, 0.02, 0.62, sm, { outline: false });
    s.position.set((i - 4.5) * PITCH, BH + 0.008, 0);
    body.add(s);
    const glow = glowSprite(c, 0.8);
    glow.position.set((i - 4.5) * PITCH, BH + 0.2, 0);
    body.add(glow);
    return { sm, glow, c };
  });
  g.add(body);
  let level = 0, mask = 0;
  const api = {
    group: g,
    pick: body,
    anchor: new THREE.Vector3(m.x, m.y + h + 1.3, m.z),
    get level() { return level; },
    /** Light segment i (0..9). */
    set(i, on) {
      mask = on ? mask | (1 << i) : mask & ~(1 << i);
      return api.setMask(mask);
    },
    setMask(bits) {
      mask = bits & 0x3ff;
      segs.forEach(({ sm, glow, c }, i) => {
        const on = (mask >> i) & 1;
        sm.color.setHex(on ? c : 0x3a3533);
        sm.emissiveIntensity = on ? 0.7 : 0;
        glow.material.opacity = on ? 0.55 : 0;
      });
      return api;
    },
    /** Light the first n segments (0..10). */
    setLevel(n) {
      level = Math.max(0, Math.min(10, Math.round(n)));
      return api.setMask((1 << level) - 1);
    },
  };
  return api;
}
