/**
 * Push: a crate on a long floor plate. The pointer slides the crate along the
 * floor on a spring; a dashed guide on the floor runs from the start mark to
 * where the crate stands, so the drawing shows displacement. The slider is how
 * far down the floor the crate may travel.
 */
const { Cam, clamp, facing, fit, open, poly, proj, prism, rings, ringAt, rrect, run, hull, seg, spring, stepS, unproj, disposer, mk, pointer, register, solid, put, flatDot, place } = HL;

const L = 250, D = 70, T = 5, CW = 44, CH = 40, X0 = 14, REST = 96;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const C = Cam(45, 0.5, 1.5);
  fit(C, [[0, 0, -T], [L, D, -T], [0, D, -T], [L, 0, CH], [0, 0, CH]], 200, 170);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  // the floor: a thin plate, its top ring and one line for its thickness
  const [fo, fi] = rings(0, 0, L, D, 8, 1.6);
  const floor = solid(g); put(floor, prism(P, front, fo, fi, -T, 0));
  // start mark: three dots across the floor, and the dashed track to the crate
  const yc = D / 2;
  const startDots = [12, yc, D - 12].map((y) => { const d = flatDot(g, C, 1.6, "dot m"); place(d, P(X0, y, 0)); return d; });
  const track = mk("path", { class: "dash nf" }, g);

  const crate = solid(g);
  const lid = mk("path", { class: "nf lo" }, g);
  const slats = mk("path", { class: "nf lo" }, g);
  const x = spring(REST);
  let drawn = null;

  function draw(px) {
    if (drawn !== null && Math.abs(drawn - px) < 0.01) return;
    drawn = px;
    const [o, i] = rings(px, yc - CW / 2, px + CW, yc + CW / 2, 5, 1.8);
    put(crate, prism(P, front, o, i, 0, CH));
    // a lid seam a little below the top, and two slats on the near face
    lid.setAttribute("d", open(ringAt(P, run(rrect(px, yc - CW / 2, px + CW, yc + CW / 2, 5, 4), front), CH - 7)));
    const sx = (k) => seg(P(px + CW * k, yc + CW / 2, 5), P(px + CW * k, yc + CW / 2, CH - 9));
    slats.setAttribute("d", sx(1 / 3) + sx(2 / 3));
    track.setAttribute("d", px - X0 > 4 ? seg(P(X0, yc, 0), P(px, yc, 0)) : "");
  }
  draw(REST);
  crate.sil.classList.add("hi");

  const B = register(stage, (dt) => { const m = stepS(x, dt); draw(x.x); return m; });
  bag.add(B.unregister);

  function to(target, active) {
    x.t = target; B.wake();
    read.textContent = active ? "x " + ((target - X0) / 20).toFixed(1) + " m" : "rest";
  }
  bag.add(pointer(stage, {
    move: (p) => { const [wx] = unproj(C, p[0], p[1], 0); to(clamp(wx - CW / 2, X0, Math.min(L - CW - 6, X0 + reach)), true); },
    leave: () => to(REST, false),
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

hairline({
  name: "push",
  means: "A crate on a floor: push it along and the dashed track shows how far it has moved from the start.",
  rules: [1, 5, 8, 10],
  range: [90, 150, 190],
  tour: [[150, 170], [220, 200], [280, 230], null],
  mount,
});
