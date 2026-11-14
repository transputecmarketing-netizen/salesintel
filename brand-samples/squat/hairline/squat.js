/**
 * Squat: a figure of rounded solids squats on a lifting platform. The pointer
 * scrubs the depth, standing to the left, the bottom to the right; leaving
 * returns it to a correct parallel squat. The torso lean is solved every frame
 * so the centre of mass stays over the mid-foot: the dashed plumb from the
 * mid-foot dot never leaves the feet. The near thigh takes the bright stroke
 * when the hip joint drops below the knee: depth. The slider is the depth of
 * the bottom, as knee flexion in degrees.
 *
 * The pattern: scrub. One spring on the depth, read from the pointer's x on the
 * fixed frame, which never moves, and limbs as hulls of two spheres, so every part stays a
 * rounded solid with one silhouette.
 */
const { Cam, clamp, facing, fit, hull, lerp, mk, open, place, poly, prism, proj, put, rad, rings, solid, spring, stepS, disposer, pointer, register } = HL;

// body, in centimetres (Winter's proportions for a 170 cm adult); x forward, z up, y across
const LEN = { foot: 26, ankle: 6.6, shank: 41.8, thigh: 41.6, torso: 49, neck: 8, head: 10.5, upper: 31.6, fore: 25 };
const MASS = { foot: .029, shank: .093, thigh: .2, trunk: .497, head: .081, upper: .056, fore: .032, hand: .012 };
const HEEL = -7, MID = HEEL + LEN.foot / 2, HALF = 9, GY = 23;   // guides stand on the platform beside the near foot            // the mid-foot sits 6 cm ahead of the ankle
const X0 = -38, X1 = 56, Y0 = -26, Y1 = 30, PH = 5;               // the platform

/** The pose at depth s (0 standing, 1 bottom), with the lean that puts the centre of mass over the mid-foot. */
function pose(s, flex) {
  const shinA = Math.min(38, flex * .263) * s, thighA = (flex - Math.min(38, flex * .263)) * s;
  const A = [0, LEN.ankle], K = [A[0] + LEN.shank * Math.sin(rad(shinA)), A[1] + LEN.shank * Math.cos(rad(shinA))];
  const Hp = [K[0] - LEN.thigh * Math.sin(rad(thighA)), K[1] + LEN.thigh * Math.cos(rad(thighA))];
  const at = (lean) => {
    const S = [Hp[0] + LEN.torso * Math.sin(rad(lean)), Hp[1] + LEN.torso * Math.cos(rad(lean))];
    const N = [S[0] + LEN.neck * Math.sin(rad(lean * .5)), S[1] + LEN.neck * Math.cos(rad(lean * .5))];
    const Hd = [N[0] + 3, N[1] + LEN.head * .9];
    const arm = rad(84 + 6 * s);                                    // the arms reach forward, a counterweight to the hips
    const E = [S[0] + LEN.upper * Math.sin(arm), S[1] + LEN.upper * Math.cos(arm)];
    const W = [E[0] + LEN.fore * Math.sin(arm), E[1] + LEN.fore * Math.cos(arm)];
    const m = [[MASS.foot, MID], [MASS.shank, lerp(K[0], A[0], .433)], [MASS.thigh, lerp(Hp[0], K[0], .433)], [MASS.trunk, lerp(Hp[0], S[0], .5)],
      [MASS.head, Hd[0]], [MASS.upper, lerp(S[0], E[0], .436)], [MASS.fore, lerp(E[0], W[0], .43)], [MASS.hand, W[0]]];
    const com = m.reduce((a, q) => a + q[0] * q[1], 0) / m.reduce((a, q) => a + q[0], 0);
    return { A, K, H: Hp, S, N, Hd, E, W, com, lean };
  };
  let lo = -15, hi = 75;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (at(mid).com < MID) lo = mid; else hi = mid; }
  const p = at((lo + hi) / 2);
  p.flex = Math.round((shinA + thighA)); return p;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let flex = value;

  const C = Cam(45, 0.5, 1.62);
  fit(C, [[X0, Y0, -PH], [X1, Y1, -PH], [X1, Y0, 0], [X0, Y1, 0], [0, 0, 178], [60, 0, 150]], 200, 158);
  const P = proj(C), front = facing(C), S = C.S;
  const W3 = (q, y) => P(q[0], y, q[1]);

  /** A limb: the hull of two spheres. On screen a sphere is a circle of radius r × S. */
  const capsule = (a, ra, b, rb) => {
    const pts = [];
    for (const [c, r] of [[a, ra], [b, rb]]) for (let i = 0; i < 20; i++) { const t = (i / 20) * 2 * Math.PI; pts.push([c[0] + Math.cos(t) * r * S, c[1] + Math.sin(t) * r * S]); }
    return poly(hull(pts));
  };
  const blob = (list) => { const pts = []; for (const [c, r] of list) for (let i = 0; i < 24; i++) { const t = (i / 24) * 2 * Math.PI; pts.push([c[0] + Math.cos(t) * r * S, c[1] + Math.sin(t) * r * S]); } return poly(hull(pts)); };

  const g = mk("g", {}, svg);
  // the platform: a thin plate, with a second line for its thickness
  const [ring, inner] = rings(X0, Y0, X1, Y1, 8, 2.2);
  put(solid(g), prism(P, front, ring, inner, -PH, 0));
  // guides, painted before the figure so the body covers them: the plumb from the mid-foot, and the level of the knee
  const plumb = mk("path", { class: "dash nf" }, g), level = mk("path", { class: "dash nf lo" }, g);
  const mid = mk("circle", { r: 2.6, class: "dot" }, g);
  place(mid, P(MID, GY, 0));

  // the body, back to front: far foot and leg, far arm, torso and head, near leg and foot, near arm
  const part = (cls = "sil") => mk("path", { class: cls }, g);
  const feet = [-HALF, HALF].map((y) => { const [r, i] = rings(HEEL, y - 4.6, HEEL + LEN.foot, y + 4.6, 4.2, 1.4); return { y, s: solid(g), r, i }; });
  const far = { shank: part(), thigh: part() }, farArm = part();
  const torso = part(), neck = part(), head = part();
  const near = { thigh: part(), shank: part() };
  // the near foot is repainted over the near shank: move its group after it
  near.shank.after(feet[1].s.g);
  const nearArm = part();
  const joints = ["A", "K", "H", "S"].map(() => mk("circle", { r: 2.1, class: "dot off" }, g));

  const depth = spring(1);
  let drawn = NaN;
  function draw(s) {
    if (Math.abs(s - drawn) < 1e-4) return;
    drawn = s;
    const p = pose(s, flex);
    for (const f of feet) put(f.s, prism(P, front, f.r, f.i, 0, 7.5));
    for (const [leg, y] of [[far, -HALF], [near, HALF]]) {
      leg.shank.setAttribute("d", capsule(W3(p.A, y), 4.6, W3(p.K, y), 6.2));
      leg.thigh.setAttribute("d", capsule(W3(p.K, y), 6.4, W3(p.H, y), 9.2));
    }
    farArm.setAttribute("d", capsule(W3(p.S, -11), 4.6, W3(p.W, -6), 3.6));
    nearArm.setAttribute("d", capsule(W3(p.S, 11), 4.8, W3(p.W, 6), 3.8));
    const along = (f, o) => [lerp(p.H[0], p.S[0], f) + o * Math.cos(rad(p.lean)), lerp(p.H[1], p.S[1], f) - o * Math.sin(rad(p.lean))];
    torso.setAttribute("d", blob([[W3(along(0, -3), 0), 14], [W3(along(.45, -1), 0), 11.5], [W3(along(.74, 2.5), 0), 13.5], [W3(along(.96, 0), 0), 11]]));
    neck.setAttribute("d", capsule(W3(p.S, 0), 5, W3(p.N, 0), 4.4));
    head.setAttribute("d", blob([[W3(p.Hd, 0), LEN.head], [W3([p.Hd[0] + 3.5, p.Hd[1] - 4], 0), 7.5]]));
    plumb.setAttribute("d", open([P(MID, GY, 0), P(MID, GY, p.Hd[1] + LEN.head + 8)]));
    level.setAttribute("d", s > .55 ? open([P(p.H[0] - 16, HALF, p.K[1]), P(p.K[0] + 12, HALF, p.K[1])]) : "");
    ["A", "K", "H", "S"].forEach((k, i) => place(joints[i], W3(p[k], k === "S" ? 11 : HALF)));
    const deep = p.H[1] < p.K[1] - .5;                                // the hip joint below the knee
    near.thigh.classList.toggle("hi", deep);
    mid.setAttribute("class", deep ? "dot m" : "dot");                // one bright place: the thigh at depth, else the balance point
    read.textContent = over ? `knee ${p.flex}°${deep ? " · parallel" : ""}` : "rest";
  }

  let over = false;
  const B = register(stage, (dt) => { const m = stepS(depth, dt); draw(depth.x); return m; });
  bag.add(B.unregister);
  // the scrub reads the pointer's x across the fixed frame, never the moving body: left of the figure stands, right of it is the bottom
  bag.add(pointer(stage, {
    move: (q) => { over = true; depth.t = clamp((q[0] - 130) / 150, 0, 1); drawn = NaN; B.wake(); },
    leave: () => { over = false; depth.t = 1; drawn = NaN; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  draw(1);

  return { set: (v) => { flex = v; drawn = NaN; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "squat",
  means: "A squat held over the mid-foot: the pointer scrubs the depth, and the thigh lights when the hip drops below the knee.",
  rules: [1, 3, 5, 8],
  range: [110, 133, 150],
  tour: [[150, 210], [205, 200], [285, 210], null],
  mount,
});
