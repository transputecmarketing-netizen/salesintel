// The three.js stage: renderer, orthographic "illustration" camera with
// pan / rotate / zoom, lights, ground grid, picking and screen projection.
import * as THREE from 'three';
import { canvasTexture } from './kit.js';

const FRUSTUM = 10; // world units visible vertically at zoom 1
const ELEVATION = THREE.MathUtils.degToRad(36);
const BASE_AZ = THREE.MathUtils.degToRad(28);

export class Stage {
  constructor(canvas, host) {
    this.canvas = canvas;
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);

    this.scene.add(new THREE.HemisphereLight(0xfff8ea, 0xb9a988, 1.7));
    const sun = new THREE.DirectionalLight(0xffffff, 2.1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -22;
    sun.shadow.camera.right = sun.shadow.camera.top = 22;
    sun.shadow.camera.far = 120;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    this.scene.add(sun, sun.target);
    this.sun = sun;

    // ground: a soft grid that fades out, plus a shadow catcher
    const grid = canvasTexture(2048, 2048, (ctx, w) => {
      const cells = 64;
      const step = w / cells;
      for (let i = 0; i <= cells; i++) {
        ctx.strokeStyle = i % 4 === 0 ? 'rgba(20,20,30,.13)' : 'rgba(20,20,30,.06)';
        ctx.lineWidth = i % 4 === 0 ? 2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(i * step, 0);
        ctx.lineTo(i * step, w);
        ctx.moveTo(0, i * step);
        ctx.lineTo(w, i * step);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'destination-in';
      const g = ctx.createRadialGradient(w / 2, w / 2, w * 0.12, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
    });
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ map: grid, transparent: true, depthWrite: false }));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.01;
    this.ground.renderOrder = -1;
    this.scene.add(this.ground);
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.16 }));
    catcher.rotation.x = -Math.PI / 2;
    catcher.receiveShadow = true;
    this.scene.add(catcher);

    this.content = new THREE.Group();
    this.scene.add(this.content);

    this.cam = { target: new THREE.Vector3(), az: BASE_AZ, zoom: 1 };
    this.goal = { target: new THREE.Vector3(), az: BASE_AZ, zoom: 1 };
    this.view = { center: [0, 0, 0], size: 10 };
    this.tickers = new Set();
    this.raycaster = new THREE.Raycaster();
    this.timer = new THREE.Timer();
    this.insets = new Set();
    this.compact = false;

    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    this.#bindPointer();
    this._loop = () => this.#frame();
    this.renderer.setAnimationLoop(this._loop);
  }

  resize() {
    const r = this.host.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.renderer.setSize(this.w, this.h, false);
    const aspect = this.w / this.h;
    Object.assign(this.camera, { left: (-FRUSTUM * aspect) / 2, right: (FRUSTUM * aspect) / 2, top: FRUSTUM / 2, bottom: -FRUSTUM / 2 });
    this.camera.updateProjectionMatrix();
    this.compact = this.w < 720;
    this.fitZoom = this.#fitZoomFor(this.view);
  }

  #fitZoomFor(view) {
    const fill = this.compact ? 0.92 : 0.6;
    const pxPerUnit = this.h / FRUSTUM;
    const zw = (this.w * fill) / (view.size * pxPerUnit);
    const zh = FRUSTUM / (view.size * (this.compact ? 0.62 : 0.72));
    return Math.min(zw, zh);
  }

  /** Swap the lesson content. */
  setContent(group) {
    this.content.clear();
    this.content.add(group);
    group.updateMatrixWorld(true);
  }

  /** Move the camera to a lesson's framing. */
  frame(view, instant = false) {
    this.view = view;
    this.fitZoom = this.#fitZoomFor(view);
    this.goal.target.set(...view.center);
    this.goal.az = BASE_AZ + THREE.MathUtils.degToRad(view.az ?? 0);
    this.goal.zoom = this.fitZoom;
    this.ground.position.set(view.center[0], -0.01, view.center[2]);
    if (instant) {
      this.cam.target.copy(this.goal.target);
      this.cam.az = this.goal.az;
      this.cam.zoom = this.goal.zoom;
    }
  }

  reset() { this.frame(this.view); }
  setPaused(p) { this.renderer.setAnimationLoop(p ? null : this._loop); }
  rotate(steps) { this.goal.az += steps * (Math.PI / 4); }
  zoomBy(f) { this.goal.zoom = THREE.MathUtils.clamp(this.goal.zoom * f, this.fitZoom * 0.4, this.fitZoom * 4); }

  /** Pan by a screen-space delta in pixels. */
  panPixels(dx, dy) {
    const unitsPerPx = FRUSTUM / this.cam.zoom / this.h;
    const right = new THREE.Vector3(Math.cos(this.cam.az), 0, -Math.sin(this.cam.az));
    const fwd = new THREE.Vector3(-Math.sin(this.cam.az), 0, -Math.cos(this.cam.az));
    const d = right.multiplyScalar(-dx * unitsPerPx).add(fwd.multiplyScalar((dy * unitsPerPx) / Math.sin(ELEVATION)));
    this.goal.target.add(d);
    this.cam.target.add(d);
  }

  get azimuthDeg() { return THREE.MathUtils.radToDeg(this.cam.az - BASE_AZ); }

  onTick(fn) {
    this.tickers.add(fn);
    return () => this.tickers.delete(fn);
  }

  #applyCamera() {
    const { target, az, zoom } = this.cam;
    const d = 60;
    this.camera.position.set(
      target.x + Math.sin(az) * Math.cos(ELEVATION) * d,
      target.y + Math.sin(ELEVATION) * d,
      target.z + Math.cos(az) * Math.cos(ELEVATION) * d,
    );
    this.camera.lookAt(target);
    this.camera.zoom = zoom;
    this.camera.updateProjectionMatrix();
    this.sun.position.set(target.x - 8, 24, target.z + 14);
    this.sun.target.position.copy(target);
  }

  #frame() {
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.1);
    const k = 1 - Math.exp(-dt * (this.reducedMotion ? 30 : 7));
    this.cam.target.lerp(this.goal.target, k);
    this.cam.az += (this.goal.az - this.cam.az) * k;
    this.cam.zoom += (this.goal.zoom - this.cam.zoom) * k;
    this.#applyCamera();
    for (const fn of this.tickers) fn(dt);
    this.renderer.render(this.scene, this.camera);
    if (this.insets.size) this.#renderInsets();
  }

  /**
   * Render an extra camera into the rectangle of an HTML element that sits
   * over the canvas (used for the "camera feed" monitor in AI lessons).
   */
  addInset(camera, el) {
    const inset = { camera, el };
    this.insets.add(inset);
    return () => this.insets.delete(inset);
  }

  #renderInsets() {
    const cr = this.canvas.getBoundingClientRect();
    const r = this.renderer;
    this.ground.visible = false;
    for (const { camera, el } of this.insets) {
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height || el.offsetParent === null) continue;
      const x = b.left - cr.left, y = cr.bottom - b.bottom;
      camera.aspect = b.width / b.height;
      camera.updateProjectionMatrix();
      r.setScissorTest(true);
      r.setViewport(x, y, b.width, b.height);
      r.setScissor(x, y, b.width, b.height);
      r.setClearColor(0x2a2f45, 1);
      r.clear();
      r.render(this.scene, camera);
    }
    this.ground.visible = true;
    r.setScissorTest(false);
    r.setClearColor(0x000000, 0);
    r.setViewport(0, 0, this.w, this.h);
  }

  /** World point → stage pixel coordinates. */
  project(v) {
    const p = v.clone().project(this.camera);
    return { x: ((p.x + 1) / 2) * this.w, y: ((1 - p.y) / 2) * this.h };
  }

  /** Find which of the `targets` ({object, data}) is under a client point. */
  pick(clientX, clientY, targets) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(targets.map((t) => t.object), true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        const t = targets.find((x) => x.object === o);
        if (t) return t;
        o = o.parent;
      }
    }
    return null;
  }

  #bindPointer() {
    const el = this.canvas;
    let drag = null;
    el.addEventListener('pointerdown', (e) => {
      if (this.onPointerDown?.(e)) return; // an interactive part took it
      drag = { x: e.clientX, y: e.clientY, moved: false };
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return this.onHover?.(e);
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
      this.panPixels(dx, dy);
      drag.x = e.clientX;
      drag.y = e.clientY;
    });
    const end = (e) => {
      if (drag && !drag.moved) this.onBackgroundClick?.(e);
      drag = null;
      el.classList.remove('is-dragging');
      this.onPointerUp?.(e);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', () => this.onHover?.(null));
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoomBy(Math.exp(-e.deltaY * 0.0012));
    }, { passive: false });
  }
}

/** Renders small transparent thumbnails of objects (for the lesson cards). */
export class Thumbnailer {
  constructor(w = 260, h = 180) {
    this.w = w;
    this.h = h;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(2);
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xfff8ea, 0xb9a988, 1.9));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-4, 10, 7);
    this.scene.add(sun);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  }

  render(obj, az = BASE_AZ) {
    obj.traverse((o) => {
      if (o.isMesh && !o.isSprite && o.material?.blending === THREE.AdditiveBlending) o.visible = false;
      if (o.isSprite) o.scale.multiplyScalar(0.55);
    });
    this.scene.add(obj);
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3();
    obj.traverse((o) => {
      if (!o.isMesh || o.isSprite || o.userData.noBounds || o.material?.blending === THREE.AdditiveBlending) return;
      o.geometry.computeBoundingBox();
      box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
    });
    if (box.isEmpty()) box.setFromObject(obj);
    const c = box.getCenter(new THREE.Vector3());
    const d = 40;
    this.camera.position.set(c.x + Math.sin(az) * Math.cos(ELEVATION) * d, c.y + Math.sin(ELEVATION) * d, c.z + Math.cos(az) * Math.cos(ELEVATION) * d);
    this.camera.lookAt(c);
    this.camera.updateMatrixWorld();
    // fit: project box corners into camera space
    const inv = this.camera.matrixWorldInverse;
    let maxX = 0, maxY = 0;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const p = new THREE.Vector3(x, y, z).applyMatrix4(inv);
      maxX = Math.max(maxX, Math.abs(p.x));
      maxY = Math.max(maxY, Math.abs(p.y));
    }
    const aspect = this.w / this.h;
    const half = Math.max(maxY, maxX / aspect) * 1.08;
    Object.assign(this.camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL('image/png');
    this.scene.remove(obj);
    return url;
  }

  dispose() {
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
