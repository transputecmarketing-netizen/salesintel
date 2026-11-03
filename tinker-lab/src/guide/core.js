// A lesson's build guide as a drawable thing: the planned steps, the scene in
// line art, and for every step the state of each part, the camera framing,
// the animated pose (parts dropping in, wires drawing themselves) and the
// SVG arrows and pin tags drawn over it.
import * as THREE from 'three';
import { planGuide } from './plan.js';
import { toLineArt, visibleBox, fitBox, applyView, toScreen, BASE_AZ } from './lineart.js';

const ease = (t) => 1 - Math.pow(1 - THREE.MathUtils.clamp(t, 0, 1), 3);
const easeInOut = (t) => {
  t = THREE.MathUtils.clamp(t, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export { ease, easeInOut };

export function createGuide(lesson) {
  const plan = planGuide(lesson);
  const { units } = plan;
  const art = toLineArt(plan.root, {
    units: units.map((u) => ({ objects: u.objects, family: u.kind === 'wire' ? 'wire' : null, perMesh: u.kind === 'wire' })),
  });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.add(plan.root);
  const az = BASE_AZ + THREE.MathUtils.degToRad(lesson.view?.az ?? 0);

  // wires: find the tube and the plug at each end so the wire can draw itself
  for (const u of units) {
    u.base = u.objects.map((o) => o.position.clone());
    if (u.kind !== 'wire' || !u.wire) continue;
    const g = u.wire.group;
    u.ends = { a: [], b: [] };
    for (const c of g.children) {
      if (!c.isMesh) continue;
      if (c.geometry.type === 'TubeGeometry') { u.tube = c; continue; }
      const p = c.position;
      (p.distanceTo(u.from) <= p.distanceTo(u.to) ? u.ends.a : u.ends.b).push(c);
    }
    if (u.tube) {
      const geo = u.tube.geometry;
      u.tubeCount = geo.index ? geo.index.count : geo.attributes.position.count;
      u.tubeSegs = geo.parameters?.tubularSegments ?? 64;
    }
  }

  // steps that actually show something
  const steps = plan.steps.filter((s) => s.units.some((j) => !units[j].silent));
  steps.forEach((s, i) => (s.n = i + 1));
  const stepOf = new Map();
  steps.forEach((s, i) => s.units.forEach((j) => stepOf.set(j, i)));
  // silent units outside visible steps follow the previous visible one
  plan.steps.forEach((s) => s.units.forEach((j) => { if (!stepOf.has(j)) stepOf.set(j, 0); }));

  const boxes = steps.map((s) => s.units.reduce((b, j) => (units[j].empty ? b : b.union(units[j].box)), new THREE.Box3()));
  const fullBox = boxes.reduce((b, x) => b.union(x), new THREE.Box3());

  /** k = step index, or -1 for "everything, drawn normally". */
  function setStep(k) {
    units.forEach((u, j) => {
      const s = stepOf.get(j) ?? 0;
      if (u.scenery) art.setState(j, k < 0 ? 'normal' : 'old');
      else art.setState(j, k < 0 ? 'normal' : s < k ? 'old' : s === k ? 'new' : 'hidden');
    });
    pose(k, 1);
  }

  /** Animated pose of step k's new parts at progress p (0 → 1). Everything else at rest. */
  function pose(k, p) {
    units.forEach((u, j) => {
      const active = k >= 0 && stepOf.get(j) === k && p < 1;
      u.objects.forEach((o, i) => o.position.copy(u.base[i]));
      if (u.kind === 'wire' && u.tube) {
        const f = active ? ease(p * 1.05) : 1;
        const n = Math.round(f * u.tubeSegs);
        u.tube.geometry.setDrawRange(0, f >= 1 ? Infinity : Math.max(0, (u.tubeCount / u.tubeSegs) * n));
        for (const e of u.ends.a) e.visible = true;
        for (const e of u.ends.b) e.visible = !active || f >= 0.98;
      } else if (active) {
        const d = dropOf(u);
        const off = d * (1 - ease(p));
        u.objects.forEach((o, i) => (o.position.y = u.base[i].y + off));
      }
    });
    plan.root.updateMatrixWorld(true);
  }

  function dropOf(u) {
    if (u.kind === 'board') return 1.6;
    return THREE.MathUtils.clamp(u.size * 0.45, 1.4, 3.2);
  }

  /** Camera framing for step k (or -1: the whole build) in a viewport of the given aspect. */
  function viewFor(k, aspect) {
    if (k < 0 || !boxes[k] || boxes[k].isEmpty()) return fitBox(fullBox, aspect, az, 1.1);
    const sofar = new THREE.Box3();
    for (let i = 0; i <= k; i++) sofar.union(boxes[i]);
    const focus = boxes[k].clone();
    const fc = focus.getCenter(new THREE.Vector3());
    // keep some context around small parts
    const wiresOnly = steps[k].units.every((j) => units[j].kind === 'wire' || units[j].silent);
    const min = wiresOnly ? 3.4 : 5.5;
    const fs = focus.getSize(new THREE.Vector3());
    focus.expandByVector(new THREE.Vector3(Math.max(0, min - fs.x) / 2, 0, Math.max(0, min - fs.z) / 2));
    focus.max.y = Math.max(focus.max.y, fc.y + 1.5); // room for the arrow
    const vFull = fitBox(sofar, aspect, az, 1.14);
    const vFocus = fitBox(focus, aspect, az, 1.25);
    if (vFull.half <= vFocus.half * 1.9) return vFull;
    const half = Math.max(vFocus.half * 1.5, Math.min(vFull.half, 3.2));
    const t = THREE.MathUtils.clamp((half - vFocus.half) / Math.max(0.01, vFull.half - vFocus.half), 0, 0.6);
    return { target: vFocus.target.clone().lerp(vFull.target, t), half };
  }

  /** SVG markup (viewBox 0 0 w h) with the step's arrows and pin tags. */
  function overlay(k, camera, w, h, p = 1, { tags = true } = {}) {
    if (k < 0 || !steps[k]) return '';
    let out = '';
    const placed = [];
    for (const j of steps[k].units) {
      const u = units[j];
      if (u.silent) continue;
      if (u.kind === 'wire') {
        if (!tags) continue;
        const a = toScreen(u.from, camera, w, h), b = toScreen(u.to, camera, w, h);
        const f = THREE.MathUtils.clamp((p - 0.55) / 0.35, 0, 1);
        const ends = [[a, steps[k].wires.find((x) => x.u === u)?.a], [b, steps[k].wires.find((x) => x.u === u)?.b]];
        ends.forEach(([pt, end], ei) => {
          if (!end) return;
          if (ei === 1 && p < 0.95) return;
          out += pinTag(pt, end.type === 'other' ? (u.signal ? u.signal.replace(/_\d+$/, '') : '') : end.short ?? end.text, placed, w, h, ei === 0 ? 1 : f, u.color);
        });
      } else {
        // a drop arrow above the part
        const top = new THREE.Vector3((u.box.min.x + u.box.max.x) / 2, u.box.max.y, (u.box.min.z + u.box.max.z) / 2);
        const s = toScreen(top, camera, w, h);
        const len = u.kind === 'board' || u.kind === 'breadboard' ? 58 : 66;
        const off = p < 1 ? (1 - ease(p)) * 30 : 0;
        const y1 = s.y - 12 - off;
        const y0 = y1 - len;
        if (y0 < 4) continue;
        out += arrow(s.x, y0, s.x, y1);
      }
    }
    return out;
  }

  return { plan, art, scene, az, steps, units, fullBox, setStep, pose, viewFor, overlay, applyView: (cam, v, aspect) => applyView(cam, v, aspect, az) };
}

/** A manual-style arrow: thick ink shaft, solid head, white halo. */
export function arrow(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  const hx = x1 - ux * 13, hy = y1 - uy * 13;
  const nx = -uy * 7.5, ny = ux * 7.5;
  const shaft = `M${x0.toFixed(1)} ${y0.toFixed(1)}L${hx.toFixed(1)} ${hy.toFixed(1)}`;
  const head = `M${x1.toFixed(1)} ${y1.toFixed(1)}L${(hx + nx).toFixed(1)} ${(hy + ny).toFixed(1)}L${(hx - nx).toFixed(1)} ${(hy - ny).toFixed(1)}Z`;
  return `<g class="g-arrow"><path class="halo" d="${shaft}"/><path class="halo" d="${head}"/><path class="shaft" d="${shaft}"/><path class="head" d="${head}"/></g>`;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function pinTag(pt, text, placed, w, h, opacity, color) {
  if (!text) return opacity > 0 ? `<g class="g-tag" style="opacity:${opacity.toFixed(2)}"><circle class="dot" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="4.2"/></g>` : '';
  if (opacity <= 0 || pt.x < -20 || pt.x > w + 20 || pt.y < -20 || pt.y > h + 20) return '';
  const tw = Math.max(30, text.length * 7.6 + 18), th = 24;
  let up = pt.y > 70;
  let x = THREE.MathUtils.clamp(pt.x - tw / 2, 4, w - tw - 4);
  let y = up ? pt.y - 44 - th / 2 : pt.y + 30;
  for (let i = 0; i < 6; i++) {
    const hit = placed.find((r) => x < r.x + r.w + 4 && x + tw + 4 > r.x && y < r.y + r.h + 4 && y + th + 4 > r.y);
    if (!hit) break;
    y += up ? -(th + 6) : th + 6;
  }
  placed.push({ x, y, w: tw, h: th });
  const cx = x + tw / 2, cy = up ? y + th : y;
  return `<g class="g-tag" style="opacity:${opacity.toFixed(2)}" data-wire="${esc(color ?? '')}">
<path class="leader" d="M${pt.x.toFixed(1)} ${pt.y.toFixed(1)}L${cx.toFixed(1)} ${cy.toFixed(1)}"/>
<circle class="dot" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3.6"/>
<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${tw.toFixed(1)}" height="${th}" rx="${th / 2}"/>
<text x="${cx.toFixed(1)}" y="${(y + th / 2 + 0.5).toFixed(1)}">${esc(text)}</text></g>`;
}
