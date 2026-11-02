// Shared building blocks for breakout modules: PCB + silkscreen + male header
// (makeBreakout), small SMD parts, trimmers, screw terminals, status LEDs and
// the free-standing module API (pin(name) with rotY support).
import * as THREE from 'three';
import { mat, mesh, box, cyl, at, canvasTexture, roundedRectShape, slab, metal, glowSprite } from '../kit.js';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const PITCH = 0.254;
export const PCB_T = 0.16;
/** Height of a male pin tip above the PCB top surface. */
export const PIN_TIP = 0.8;
export const SANS = '"Barlow Semi Condensed", "Barlow", sans-serif';
export const MONO = '"IBM Plex Mono", monospace';
export const PCB = {
  blue: 0x2a5cb8,
  navy: 0x1d3a86,
  green: 0x2c7a46,
  red: 0xb7322b,
  black: 0x25262b,
  purple: 0x5a3a8c,
};

export const noRay = (o) => {
  o.raycast = () => {};
  return o;
};

export function emissiveMat(color, opts = {}) {
  return mat(color, { emissive: color, emissiveIntensity: 0, unique: true, rough: 0.35, ...opts });
}

// ---------------------------------------------------------------- 2D painter in cm
/** Wraps a 2D context so drawing calls take centimetre coordinates (x, z), origin at the centre. */
export function painter(ctx, s, w, d, ink = '#f1efe6') {
  const px = (x) => (x + w / 2) * s;
  const pz = (z) => (z + d / 2) * s;
  const P = {
    ctx, s, px, pz, ink,
    text(str, x, z, size = 0.12, o = {}) {
      ctx.save();
      ctx.translate(px(x), pz(z));
      if (o.rot) ctx.rotate(o.rot);
      ctx.font = `${o.weight ?? 600} ${size * s}px ${o.font ?? SANS}`;
      ctx.fillStyle = o.color ?? ink;
      ctx.textAlign = o.align ?? 'center';
      ctx.textBaseline = o.baseline ?? 'middle';
      if (o.maxW) ctx.fillText(str, 0, 0, o.maxW * s);
      else ctx.fillText(str, 0, 0);
      ctx.restore();
    },
    rect(x, z, rw, rd, o = {}) {
      ctx.beginPath();
      ctx.roundRect(px(x - rw / 2), pz(z - rd / 2), rw * s, rd * s, (o.r ?? 0) * s);
      if (o.fill) {
        ctx.fillStyle = o.fill;
        ctx.fill();
      }
      if (o.stroke !== undefined ? o.stroke : !o.fill) {
        ctx.strokeStyle = typeof o.stroke === 'string' ? o.stroke : ink;
        ctx.lineWidth = (o.lw ?? 0.022) * s;
        ctx.stroke();
      }
    },
    circle(x, z, r, o = {}) {
      ctx.beginPath();
      ctx.arc(px(x), pz(z), r * s, 0, Math.PI * 2);
      if (o.fill) {
        ctx.fillStyle = o.fill;
        ctx.fill();
      }
      if (o.stroke !== undefined ? o.stroke : !o.fill) {
        ctx.strokeStyle = typeof o.stroke === 'string' ? o.stroke : ink;
        ctx.lineWidth = (o.lw ?? 0.022) * s;
        ctx.stroke();
      }
    },
    line(pts, o = {}) {
      ctx.beginPath();
      pts.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), pz(z)) : ctx.moveTo(px(x), pz(z))));
      if (o.close) ctx.closePath();
      ctx.strokeStyle = o.color ?? ink;
      ctx.lineWidth = (o.lw ?? 0.022) * s;
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.stroke();
    },
    /** Faint copper traces. */
    traces(list, color = 'rgba(255,255,255,.13)', lw = 0.045) {
      for (const t of list) P.line(t, { color, lw });
    },
  };
  return P;
}

/** Transparent silkscreen plane (w × d cm) lying on a surface; draw(P) uses cm coordinates. */
export function silkPlane(w, d, draw, opts = {}) {
  const s = Math.min(opts.res ?? 230, 2048 / Math.max(w, d));
  const cw = Math.ceil(w * s), ch = Math.ceil(d * s);
  const tex = canvasTexture(cw, ch, (ctx) => draw(painter(ctx, s, w, d, opts.ink)));
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

/** Flat (or vertical) plane carrying text / drawing. draw(ctx, cw, ch) in pixels. */
export function decal(w, h, draw, o = {}) {
  const res = o.res ?? 260;
  const cw = Math.min(2048, Math.ceil(w * res)), ch = Math.min(2048, Math.ceil(h * res));
  const tex = canvasTexture(cw, ch, draw);
  const material = o.basic
    ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    : new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: o.rough ?? 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  if (!o.vertical) m.rotation.x = -Math.PI / 2;
  m.raycast = () => {};
  return m;
}

/** Centred text decal: lines of text in a w × h cm plane. */
export function textDecal(lines, w, h, o = {}) {
  const arr = Array.isArray(lines) ? lines : [lines];
  return decal(w, h, (ctx, cw, ch) => {
    if (o.bg) {
      ctx.fillStyle = o.bg;
      ctx.fillRect(0, 0, cw, ch);
    }
    ctx.fillStyle = o.color ?? '#d9dce4';
    ctx.textAlign = o.align ?? 'center';
    ctx.textBaseline = 'middle';
    const sizes = o.sizes ?? arr.map(() => o.size ?? 0.42);
    const total = sizes.reduce((a, b) => a + b * 1.15, 0);
    let y = ch / 2 - (total * ch) / 2;
    arr.forEach((line, i) => {
      const fs = sizes[i] * ch;
      ctx.font = `${o.weight ?? 600} ${fs}px ${o.font ?? MONO}`;
      y += sizes[i] * 1.15 * ch * 0.5;
      const x = ctx.textAlign === 'left' ? cw * 0.04 : ctx.textAlign === 'right' ? cw * 0.96 : cw / 2;
      ctx.fillText(line, x, y, cw * 0.96);
      y += sizes[i] * 1.15 * ch * 0.5;
    });
  }, o);
}

// ---------------------------------------------------------------- breakout PCB
const pinGeom = new THREE.BoxGeometry(0.064, 1, 0.064);

/**
 * Generic breakout board: PCB with silkscreen pin labels and a male header
 * whose pins point UP. Pins are listed left→right (back/front edges, as seen
 * from the front) or back→front (left/right edges); `null` leaves a gap.
 *
 * Extra options: pinOffset (shift along edge), inset (header distance from the
 * edge), holes ([[x,z],...] mounting holes), radius, silk(P) extra drawing,
 * pinText {name: label}, headers: [{pins, edge, offset, inset}] for more
 * headers, labelPos [x,z], labelSize, thickness.
 *
 * Returns { group, top, w, d, pinsLocal: Map(name → local Vector3 of pin tip),
 *           pinNames, on(obj, x, z, y) }.
 */
export function makeBreakout({
  w, d, color = PCB.blue, pins = [], label = '', sublabel = '', pinsEdge = 'back', pinOffset = 0, inset = 0.2,
  holes = [], holeR = 0.14, radius = 0.12, silk: extra, pinText = {}, headers = [], labelPos, labelSize, thickness = PCB_T,
  ink = '#f1efe6', pinLabels = true,
}) {
  const g = new THREE.Group();
  const top = thickness;
  const shape = roundedRectShape(w, d, radius);
  for (const [hx, hz] of holes) {
    const h = new THREE.Path();
    h.absarc(hx, -hz, holeR, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const board = slab(shape, thickness, mat(color, { rough: 0.55 }));
  g.add(board);

  const allHeaders = [{ pins, edge: pinsEdge, offset: pinOffset, inset }, ...headers].filter((h) => h.pins?.length);
  const pinsLocal = new Map();
  const tips = [];
  const layouts = allHeaders.map((h) => {
    const n = h.pins.length;
    const ins = h.inset ?? inset;
    const along = (i) => (i - (n - 1) / 2) * PITCH + (h.offset ?? 0);
    const xz = (i) => {
      switch (h.edge) {
        case 'front': return [along(i), d / 2 - ins];
        case 'left': return [-w / 2 + ins, along(i)];
        case 'right': return [w / 2 - ins, along(i)];
        default: return [along(i), -d / 2 + ins];
      }
    };
    h.pins.forEach((name, i) => {
      if (!name) return;
      const [x, z] = xz(i);
      pinsLocal.set(name, V(x, top + PIN_TIP, z));
      tips.push([x, z]);
    });
    // contiguous runs → plastic spacer blocks
    const runs = [];
    let start = -1;
    for (let i = 0; i <= n; i++) {
      if (i < n && h.pins[i]) {
        if (start < 0) start = i;
      } else if (start >= 0) {
        runs.push([start, i - 1]);
        start = -1;
      }
    }
    for (const [a, b] of runs) {
      const len = (b - a + 1) * PITCH;
      const [x0, z0] = xz(a), [x1, z1] = xz(b);
      const horiz = h.edge === 'back' || h.edge === 'front';
      const spacer = box(horiz ? len : PITCH, 0.25, horiz ? PITCH : len, mat(0x23262e, { rough: 0.8 }));
      spacer.position.set((x0 + x1) / 2, top + 0.125, (z0 + z1) / 2);
      g.add(spacer);
    }
    return { h, xz };
  });
  if (tips.length) {
    const pinMesh = new THREE.InstancedMesh(pinGeom, metal(), tips.length);
    const o = new THREE.Object3D();
    tips.forEach(([x, z], i) => {
      o.position.set(x, top + PIN_TIP / 2 - 0.05, z);
      o.scale.set(1, PIN_TIP + 0.1, 1);
      o.updateMatrix();
      pinMesh.setMatrixAt(i, o.matrix);
    });
    pinMesh.castShadow = true;
    g.add(pinMesh);
  }

  const silk = silkPlane(w, d, (P) => {
    // pads
    for (const [x, z] of tips) P.circle(x, z, 0.075, { fill: '#d8b866' });
    if (pinLabels)
      for (const { h, xz } of layouts) {
        h.pins.forEach((name, i) => {
          if (!name) return;
          const [x, z] = xz(i);
          const t = pinText[name] ?? name;
          const fs = t.length > 4 ? 0.105 : 0.12;
          switch (h.edge) {
            case 'front': P.text(t, x, z - 0.2, fs, { rot: -Math.PI / 2, align: 'left' }); break;
            case 'left': P.text(t, x + 0.2, z, fs, { align: 'left' }); break;
            case 'right': P.text(t, x - 0.2, z, fs, { align: 'right' }); break;
            default: P.text(t, x, z + 0.2, fs, { rot: -Math.PI / 2, align: 'right' });
          }
        });
      }
    for (const [hx, hz] of holes) P.circle(hx, hz, holeR + 0.07, { fill: '#cfc9b6' });
    if (label) {
      const [lx, lz] = labelPos ?? [0, 0];
      P.text(label, lx, lz, labelSize ?? Math.min(0.26, w / Math.max(6, label.length) * 1.1), { weight: 700 });
      if (sublabel) P.text(sublabel, lx, lz + (labelSize ?? 0.22) * 0.95, (labelSize ?? 0.22) * 0.62);
    }
    extra?.(P);
  }, { ink });
  silk.position.y = top + 0.002;
  g.add(silk);
  // hole rings drawn on silk are hidden by the hole cut-outs; add a metallic ring for depth
  for (const [hx, hz] of holes) {
    const ring = mesh(new THREE.RingGeometry(holeR, holeR + 0.07, 20), mat(0xd9d5c8, { metal: 0.4, rough: 0.4 }), { outline: false });
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(hx, top + 0.004, hz);
    g.add(ring);
  }

  return {
    group: g,
    board,
    top,
    w,
    d,
    pinsLocal,
    pinNames: [...pinsLocal.keys()],
    /** Place obj on the PCB top at (x, z), lifted by y. */
    on(obj, x, z, y = 0) {
      obj.position.x = x;
      obj.position.z = z;
      obj.position.y += top + y;
      g.add(obj);
      return obj;
    },
  };
}

/**
 * Standard API for a free-standing module: positions/rotates the group and
 * returns { group, pick, anchor, pins, pin(name) }. `frame` is the object whose
 * local space the pin positions are in (defaults to group).
 */
export function freeApi(g, pinsLocal, pos, opts = {}, { pick, anchor, frame } = {}) {
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  const f = frame ?? g;
  return {
    group: g,
    pick: pick ?? g,
    anchor: g.localToWorld((anchor ?? V(0, 1.5, 0)).clone()),
    /** Pin names in header order. */
    pins: [...pinsLocal.keys()],
    /** World position of a pin tip (where a jumper plugs on). */
    pin(name) {
      const p = pinsLocal.get(name);
      if (!p) throw new Error(`Unknown pin "${name}". Pins: ${[...pinsLocal.keys()].join(', ')}`);
      f.updateWorldMatrix(true, false);
      return f.localToWorld(p.clone());
    },
  };
}

// ---------------------------------------------------------------- small parts
/** Tiny SMD block (resistor / cap). */
export function smd(w = 0.2, d = 0.12, h = 0.07, color = 0x1e2026) {
  const g = new THREE.Group();
  g.add(at(box(w, h, d, mat(color), { outline: false }), 0, h / 2, 0));
  if (color !== 0x1e2026) return g;
  for (const s of [-1, 1]) g.add(at(box(w * 0.18, h * 1.02, d * 1.02, metal(), { outline: false }), s * w * 0.42, h / 2, 0));
  return g;
}

/** SMD resistor/capacitor field: [[x,z,rot,color?],...] placed with b.on */
export function smdField(b, list) {
  for (const [x, z, r = 0, c] of list) {
    const part = c === 'cap' ? smd(0.2, 0.12, 0.09, 0xb79a6c) : smd(0.2, 0.12, 0.07);
    part.rotation.y = r;
    b.on(part, x, z);
  }
}

/** Gull-wing IC (SOIC / TSSOP). Long axis on X. */
export function soic(pinsPerSide = 8, o = {}) {
  const g = new THREE.Group();
  const pitch = o.pitch ?? 0.127;
  const len = o.len ?? pinsPerSide * pitch + 0.1;
  const wid = o.wid ?? 0.4;
  const h = o.h ?? 0.16;
  g.add(at(box(len, h, wid, mat(o.color ?? 0x1d1e23, { rough: 0.5 })), 0, h / 2 + 0.02, 0));
  const leg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 0.04, 0.14), metal(), pinsPerSide * 2);
  const t = new THREE.Object3D();
  let k = 0;
  for (let i = 0; i < pinsPerSide; i++)
    for (const s of [-1, 1]) {
      t.position.set((i - (pinsPerSide - 1) / 2) * pitch, 0.03, s * (wid / 2 + 0.05));
      t.updateMatrix();
      leg.setMatrixAt(k++, t.matrix);
    }
  g.add(leg);
  g.add(at(cyl(0.035, 0.035, 0.01, mat(0x0e0f12), { outline: false, seg: 10 }), -len / 2 + 0.09, h + 0.025, wid / 2 - 0.09));
  if (o.label) {
    const lab = textDecal(o.label, len * 0.9, wid * 0.7, { color: '#c9ccd4', size: 0.42, sizes: o.sizes });
    lab.position.y = h + 0.026;
    g.add(lab);
  }
  return g;
}

/** QFN / square chip. */
export function qfn(size = 0.4, o = {}) {
  const g = new THREE.Group();
  const h = o.h ?? 0.09;
  g.add(at(box(size, h, size, mat(o.color ?? 0x1d1e23, { rough: 0.5 })), 0, h / 2, 0));
  g.add(at(cyl(0.025, 0.025, 0.01, mat(0x55575e), { outline: false, seg: 10 }), -size / 2 + 0.07, h + 0.004, -size / 2 + 0.07));
  if (o.label) {
    const lab = textDecal(o.label, size * 0.9, size * 0.5, { color: '#b7bac2', size: 0.4 });
    lab.position.y = h + 0.005;
    g.add(lab);
  }
  return g;
}

/** Through-hole DIP chip sitting on a PCB (non-breadboard). Long axis X. */
export function dipOnPcb(n = 16, label = '') {
  const g = new THREE.Group();
  const len = (n / 2) * PITCH + 0.05;
  g.add(at(box(len, 0.34, 0.64, mat(0x222328, { rough: 0.5 })), 0, 0.17 + 0.08, 0));
  const leg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.26, 0.05), metal(), n);
  const t = new THREE.Object3D();
  for (let i = 0; i < n / 2; i++)
    for (const s of [0, 1]) {
      t.position.set((i - (n / 2 - 1) / 2) * PITCH, 0.12, (s ? 1 : -1) * 0.355);
      t.updateMatrix();
      leg.setMatrixAt(i * 2 + s, t.matrix);
    }
  g.add(leg);
  const notch = cyl(0.08, 0.08, 0.012, mat(0x101114), { outline: false, thetaStart: 0, thetaLength: Math.PI });
  notch.rotation.y = Math.PI / 2;
  g.add(at(notch, -len / 2 + 0.002, 0.424, 0));
  g.add(at(cyl(0.04, 0.04, 0.01, mat(0x101114), { outline: false, seg: 10 }), -len / 2 + 0.16, 0.424, 0.2));
  if (label) {
    const lab = textDecal(label, len * 0.85, 0.36, { color: '#c9ccd4', size: 0.5 });
    lab.position.y = 0.426;
    g.add(lab);
  }
  return g;
}

/** Small SMD status LED with glow. Returns { group, set(level) }. */
export function smdLed(color = 0xff3b2f, o = {}) {
  const g = new THREE.Group();
  const lens = emissiveMat(color, { opacity: 0.95 });
  lens.color.lerp(new THREE.Color(0xffffff), 0.35);
  g.add(at(box(0.2, 0.06, 0.13, mat(0xe9e5d8), { outline: false }), 0, 0.03, 0));
  g.add(at(box(0.14, 0.05, 0.11, lens, { outline: false }), 0, 0.08, 0));
  const glow = glowSprite(color, o.glow ?? 0.9);
  glow.position.y = 0.14;
  g.add(glow);
  let level = 0;
  return {
    group: g,
    get level() { return level; },
    set(v) {
      level = Math.max(0, Math.min(1, +v));
      lens.emissiveIntensity = level * 2.2;
      glow.material.opacity = level * 0.9;
    },
  };
}

/** Through-hole 3mm/5mm LED standing on a PCB. Returns { group, set(level) }. */
export function thtLed(color = 0xff3b2f, r = 0.15) {
  const g = new THREE.Group();
  const lens = emissiveMat(color, { opacity: 0.9 });
  g.add(at(cyl(r * 1.15, r * 1.15, 0.05, lens, { outline: false }), 0, 0.1, 0));
  g.add(at(cyl(r, r, r * 1.6, lens, { outline: false }), 0, 0.12 + r * 0.8, 0));
  g.add(at(mesh(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lens, { outline: false }), 0, 0.12 + r * 1.6, 0));
  const glow = glowSprite(color, 1.2);
  glow.position.y = 0.3 + r * 1.6;
  g.add(glow);
  return {
    group: g,
    set(v) {
      lens.emissiveIntensity = v * 2;
      glow.material.opacity = v * 0.9;
    },
  };
}

/** Blue 3296-style multi-turn trimmer (brass screw on top). */
export function trimpot3296(o = {}) {
  const g = new THREE.Group();
  const w = o.w ?? 0.95, d = o.d ?? 0.48, h = o.h ?? 0.95;
  g.add(at(box(w, h, d, mat(0x2f62c9, { rough: 0.5 })), 0, h / 2, 0));
  const screw = cyl(0.1, 0.1, 0.08, mat(0xd2b25b, { metal: 0.6, rough: 0.35 }), { seg: 14 });
  g.add(at(screw, w / 2 - 0.16, h + 0.04, 0));
  g.add(at(box(0.18, 0.02, 0.03, mat(0x6d5a2a), { outline: false }), w / 2 - 0.16, h + 0.085, 0));
  return g;
}

/** Small round single-turn trimmer (e.g. orange on PIR, blue on others). */
export function trimRound(color = 0xf08a2c, r = 0.32) {
  const g = new THREE.Group();
  g.add(at(box(r * 2.1, 0.12, r * 2.1, mat(0xe8e2d2)), 0, 0.06, 0));
  const knob = new THREE.Group();
  knob.add(at(cyl(r, r, 0.2, mat(color, { rough: 0.5 }), { seg: 20 }), 0, 0.1, 0));
  knob.add(at(box(r * 1.5, 0.03, 0.06, mat(0x2b2b2b), { outline: false }), 0, 0.205, 0));
  knob.add(at(box(0.06, 0.03, r * 1.5, mat(0x2b2b2b), { outline: false }), 0, 0.205, 0));
  knob.position.y = 0.12;
  g.add(knob);
  g.userData.knob = knob;
  return g;
}

/**
 * Screw terminal block with n positions at 0.5 cm pitch along X, wire
 * entries facing +Z. Returns group with userData.screws = local top points.
 */
export function screwTerminal(n = 2, color = 0x2f6fd8, o = {}) {
  const g = new THREE.Group();
  const p = o.pitch ?? 0.5;
  const w = n * p, d = 0.75, h = 0.95;
  const body = mat(color, { rough: 0.5 });
  g.add(at(box(w, h * 0.62, d, body), 0, h * 0.31, 0));
  g.add(at(box(w, h * 0.38, d * 0.62, body), 0, h * 0.62 + h * 0.19, -d * 0.19));
  const screws = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * p;
    g.add(at(cyl(0.16, 0.16, 0.06, mat(0x23262e), { seg: 16, outline: false }), x, h + 0.005, -d * 0.19));
    const s = cyl(0.13, 0.13, 0.06, metal(), { seg: 16 });
    g.add(at(s, x, h + 0.02, -d * 0.19));
    const slot = box(0.2, 0.02, 0.035, mat(0x55575c), { outline: false });
    slot.rotation.y = 0.5;
    g.add(at(slot, x, h + 0.05, -d * 0.19));
    // wire entry (face +Z)
    g.add(at(box(0.3, 0.26, 0.02, mat(0x101114), { outline: false }), x, 0.3, d / 2 + 0.001));
    g.add(at(box(0.18, 0.14, 0.02, metal(), { outline: false }), x, 0.3, d / 2 + 0.006));
    screws.push(V(x, h + 0.06, -d * 0.19));
  }
  g.userData.screws = screws;
  return g;
}

/** Radial electrolytic capacitor. */
export function electrolytic(r = 0.3, h = 0.7, color = 0x2d3c8e) {
  const g = new THREE.Group();
  g.add(at(cyl(r, r, h, mat(color, { rough: 0.45 }), { seg: 24 }), 0, h / 2, 0));
  g.add(at(cyl(r * 0.98, r * 0.98, 0.02, mat(0xc6c8cb, { metal: 0.5, rough: 0.35 }), { outline: false, seg: 24 }), 0, h + 0.005, 0));
  g.add(at(cyl(r * 1.005, r * 1.005, h * 0.9, mat(0xd8dade), { thetaStart: -0.35, thetaLength: 0.7, outline: false, seg: 24 }), 0, h / 2, 0));
  return g;
}

/** 6×6 mm tactile button. */
export function tactile(capColor = 0x1d1e23, size = 0.6) {
  const g = new THREE.Group();
  g.add(at(box(size, 0.3, size, metal()), 0, 0.15, 0));
  g.add(at(box(size * 0.98, 0.08, size * 0.98, mat(0x2b2d33)), 0, 0.12, 0));
  const cap = cyl(size * 0.29, size * 0.29, 0.18, mat(capColor), { seg: 16 });
  g.add(at(cap, 0, 0.39, 0));
  g.userData.cap = cap;
  return g;
}

/** JST-XH style white connector housing; pins along X. */
export function jst(n = 5, pitch = 0.25) {
  const g = new THREE.Group();
  const w = n * pitch + 0.25;
  g.add(at(box(w, 0.6, 0.6, mat(0xf0ece0, { rough: 0.6 })), 0, 0.3, 0));
  g.add(at(box(w - 0.12, 0.5, 0.42, mat(0xd8d2c0), { outline: false }), 0, 0.36, 0.02));
  for (let i = 0; i < n; i++) g.add(at(box(0.06, 0.4, 0.06, metal(), { outline: false }), (i - (n - 1) / 2) * pitch, 0.32, 0.02));
  return g;
}

/** Female header block standing on its end, holes facing up. Returns group, userData.holes local tops. */
export function femaleBlock(n, o = {}) {
  const g = new THREE.Group();
  const h = o.h ?? 0.85;
  const w = n * PITCH;
  const tex = canvasTexture(64 * n, 64, (ctx) => {
    ctx.fillStyle = '#2a2d36';
    ctx.fillRect(0, 0, 64 * n, 64);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = '#0d0e12';
      ctx.fillRect(i * 64 + 18, 18, 28, 28);
      ctx.strokeStyle = '#3c404b';
      ctx.lineWidth = 3;
      ctx.strokeRect(i * 64 + 1.5, 1.5, 61, 61);
    }
  });
  const side = mat(0x23262e, { rough: 0.8 });
  const topM = mat(0xffffff, { map: tex, rough: 0.8, unique: true });
  g.add(at(mesh(new THREE.BoxGeometry(w, h, PITCH), [side, side, topM, side, side, side]), 0, h / 2, 0));
  g.userData.holes = [...Array(n)].map((_, i) => V((i - (n - 1) / 2) * PITCH, h, 0));
  return g;
}

/** Wire bundle along a polyline: returns a tube mesh. */
export function cable(points, color, r = 0.045, o = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, o.seg ?? 48, r, 8, false), mat(color, { rough: 0.5 }));
  m.castShadow = true;
  return m;
}

/** Expanding pulse ring (detection / signal); call tick(dt). */
export function pulseRings(color = 0x2aa7a1, radius = 1, count = 2) {
  const g = new THREE.Group();
  const rings = [...Array(count)].map(() => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.03, 6, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
    r.rotation.x = Math.PI / 2;
    noRay(r);
    g.add(r);
    return r;
  });
  let t = 0, on = false;
  return {
    group: g,
    set(v) { on = !!v; },
    get on() { return on; },
    tick(dt, speed = 0.8) {
      if (on) t += dt * speed;
      rings.forEach((r, i) => {
        const p = (t + i / count) % 1;
        r.scale.setScalar(1 + p * 1.6);
        r.position.y = p * 0.3;
        r.material.opacity = on ? (1 - p) * 0.75 : Math.max(0, r.material.opacity - dt * 3);
      });
    },
  };
}

export { THREE, mat, mesh, box, cyl, at, canvasTexture, roundedRectShape, slab, metal, glowSprite };

// ---------------------------------------------------------------- breadboard helpers
const UP = new THREE.Vector3(0, 1, 0);
export const midOf = (...ps) => ps.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / ps.length);

/** Legs from breadboard holes up to a body whose base sits `h` above the holes (same as components.js). */
export function standLegs(group, holes, feet, h, r = 0.022, material = metal()) {
  holes.forEach((p, i) => {
    const f = feet[i];
    const topP = new THREE.Vector3(f.x, p.y + h, f.z);
    const pts = [p.clone().addScaledVector(UP, -0.05), p.clone().addScaledVector(UP, Math.min(0.25, h * 0.4))];
    if (p.distanceTo(new THREE.Vector3(f.x, p.y, f.z)) > 0.02) pts.push(topP.clone().addScaledVector(UP, -Math.min(0.2, h * 0.3)));
    pts.push(topP);
    if (pts.length > 2) {
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05);
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, r, 6, false), material);
      m.castShadow = true;
      group.add(m);
    } else {
      const dir = new THREE.Vector3().subVectors(pts[1], pts[0]);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 8), material);
      m.position.copy(pts[0]).addScaledVector(dir, 0.5);
      m.quaternion.setFromUnitVectors(UP, dir.normalize());
      m.castShadow = true;
      group.add(m);
    }
  });
}

/** Yaw (rotation.y) that maps local +X onto the horizontal direction a→b. */
export function yawOf(a, b) {
  const d = new THREE.Vector3().subVectors(b, a);
  return Math.atan2(-d.z, d.x);
}
