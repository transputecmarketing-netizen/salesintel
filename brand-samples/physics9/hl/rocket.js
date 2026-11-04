/**
 * Rocket: a rocket on a launch pad. The pointer's height lifts it on a spring;
 * dashed exhaust lines run from its base down to the pad, pushed down as the
 * rocket is pushed up. The slider is how high it may climb.
 */
const { Cam, clamp, facing, fit, open, poly, proj, prism, rings, ringAt, run, hull, circ, seg, spring, stepS, disposer, mk, pointer, register, solid, put } = HL;

const R = 15, BODY = 62, NOSE = 26, PAD = 46, PT = 6, REST = 16;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let top = value;
  const C = Cam(45, 0.5, 1.45);
  fit(C, [[-PAD, -PAD, -PT], [PAD, PAD, -PT], [0, 0, 90 + BODY + NOSE], [-PAD, PAD, -PT], [PAD, -PAD, -PT]], 200, 162);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  const [po, pi] = rings(-PAD, -PAD, PAD, PAD, 12, 2);
  put(solid(g), prism(P, front, po, pi, -PT, 0));
  // the flame trench: a ring set into the pad
  mk("path", { d: poly(ringAt(P, circ(R + 4, 40), 0)), class: "nf lo" }, g);

  const plume = mk("path", { class: "dash nf" }, g);
  const body = solid(g), nose = solid(g);
  const band = mk("path", { class: "nf lo" }, g);
  const outer = circ(R, 40), inner = circ(R - 1.6, 40), tip = circ(2.2, 16);
  const z = spring(REST);
  let drawn = null;

  function draw(h) {
    if (drawn !== null && Math.abs(drawn - h) < 0.01) return;
    drawn = h;
    put(body, prism(P, front, outer, inner, h, h + BODY));
    // the nose is smaller at its top: hull of the two rings, and one crease where it meets the body
    put(nose, { sil: poly(hull(ringAt(P, outer, h + BODY).concat(ringAt(P, tip, h + BODY + NOSE)))), crease: open(ringAt(P, run(inner, front), h + BODY)) });
    band.setAttribute("d", open(ringAt(P, run(outer, front), h + BODY * 0.72)));
    // exhaust: four dashed lines from the base down to the pad, only once the rocket has left it
    plume.setAttribute("d", h > 3 ? [[-8, 0], [8, 0], [0, -8], [0, 8]].map(([x, y]) => seg(P(x, y, h), P(x * 1.6, y * 1.6, 0))).join("") : "");
  }
  draw(REST);
  nose.sil.classList.add("hi");

  const B = register(stage, (dt) => { const m = stepS(z, dt); draw(z.x); return m; });
  bag.add(B.unregister);
  bag.add(pointer(stage, {
    move: (p) => { z.t = clamp((300 - p[1]) / 260, 0, 1) * top; B.wake(); read.textContent = "lift " + Math.round(z.t); },
    leave: () => { z.t = REST; B.wake(); read.textContent = "rest"; },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { top = v; }, destroy: bag.dispose };
}

hairline({
  name: "rocket",
  means: "A rocket on its pad: raise the pointer and it climbs, its exhaust pushed down as it is pushed up.",
  rules: [3, 5, 8, 9],
  range: [40, 70, 90],
  tour: [[200, 220], [200, 120], [200, 60], null],
  mount,
});
