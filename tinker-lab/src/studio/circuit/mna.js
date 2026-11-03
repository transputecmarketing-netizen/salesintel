// Modified nodal analysis for DC operating points, with Newton–Raphson for the
// non-linear parts (diodes, LEDs, transistors).
//
// Every source is modelled as a Thevenin equivalent (EMF + series resistance),
// stamped as its Norton equivalent, so the system is purely nodal: G · v = i.
// Node 0 is the reference (the board's GND). A tiny conductance (GMIN) from
// every node to ground keeps floating islands solvable.

export const GMIN = 1e-9;          // 1 GΩ leak to ground on every node
export const VT = 0.025852;        // thermal voltage at 27 °C

/** SPICE-style junction voltage limiting (pnjlim): keeps exp() from exploding between iterations. */
export function pnjlim(vnew, vold, vt, vcrit) {
  if (vnew > vcrit && Math.abs(vnew - vold) > 2 * vt) {
    if (vold > 0) {
      const arg = 1 + (vnew - vold) / vt;
      return arg > 0 ? vold + vt * Math.log(arg) : vcrit;
    }
    return vt * Math.log(vnew / vt);
  }
  return vnew;
}

/** exp() that continues linearly above x = 80 (protects against overflow). */
export function safeExp(x) {
  if (x < 80) return Math.exp(x);
  const e = Math.exp(80);
  return e * (1 + x - 80);
}

/**
 * A circuit: nodes 0…n-1 (0 = ground) and elements. Element shapes:
 *  { kind: 'R', a, b, r }                        resistor
 *  { kind: 'V', a, b, e, r }                     EMF e (V(a)−V(b) = e + i·r), i flows a→b inside the source's load path
 *  { kind: 'I', a, b, i }                        current source pushing i from a to b through itself (injects into b)
 *  { kind: 'D', a, k, is, n, rs? }               diode / LED (Shockley), optional series resistance via internal node
 *  { kind: 'Q', c, b, e, is, bf, br }            NPN transistor, Ebers–Moll transport model
 */
export class Circuit {
  constructor(n = 1) {
    this.n = n;
    this.elements = [];
  }
  node() { return this.n++; }
  add(el) { this.elements.push(el); return el; }
  R(a, b, r, tag) { return this.add({ kind: 'R', a, b, r: Math.max(r, 1e-6), tag }); }
  V(a, b, e, r, tag) { return this.add({ kind: 'V', a, b, e, r: Math.max(r, 1e-6), tag }); }
  I(a, b, i, tag) { return this.add({ kind: 'I', a, b, i, tag }); }
  D(a, k, is, n, rs = 0, tag) {
    let x = k;
    if (rs > 0) {
      x = this.node();
      this.R(x, k, rs);
    }
    return this.add({ kind: 'D', a, k: x, kOuter: k, is, n, vd: 0, tag });
  }
  Q(c, b, e, { is = 1e-14, bf = 150, br = 2 } = {}, tag) {
    return this.add({ kind: 'Q', c, b, e, is, bf, br, vbe: 0, vbc: 0, tag });
  }
}

/** Solve A·x = b in place (dense, partial pivoting). Returns x or null when singular. */
function solveDense(A, b, n) {
  for (let col = 0; col < n; col++) {
    let piv = col, best = Math.abs(A[col * n + col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(A[r * n + col]);
      if (v > best) { best = v; piv = r; }
    }
    if (best < 1e-30) return null;
    if (piv !== col) {
      for (let k = 0; k < n; k++) {
        const t = A[col * n + k]; A[col * n + k] = A[piv * n + k]; A[piv * n + k] = t;
      }
      const t = b[col]; b[col] = b[piv]; b[piv] = t;
    }
    const d = A[col * n + col];
    for (let r = col + 1; r < n; r++) {
      const f = A[r * n + col] / d;
      if (f === 0) continue;
      for (let k = col; k < n; k++) A[r * n + k] -= f * A[col * n + k];
      b[r] -= f * b[col];
    }
  }
  const x = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let k = r + 1; k < n; k++) s -= A[r * n + k] * x[k];
    x[r] = s / A[r * n + r];
  }
  return x;
}

/** Diode current and conductance at vd (includes GMIN across the junction). */
export function diodeIV(is, nvt, vd) {
  const e = safeExp(vd / nvt);
  return { i: is * (e - 1) + GMIN * vd, g: (is / nvt) * e + GMIN };
}

/**
 * DC operating point. Returns { v: Float64Array (node voltages, v[0] = 0), ok, iterations }.
 * `guess` (previous solution) speeds up convergence.
 */
export function solve(circuit, guess = null, { maxIter = 150, reltol = 1e-6, vntol = 1e-7 } = {}) {
  const N = circuit.n;          // unknowns: nodes 1…N-1
  const m = N - 1;
  if (m <= 0) return { v: new Float64Array(N), ok: true, iterations: 0 };
  const els = circuit.elements;
  // linear part, stamped once
  const G0 = new Float64Array(m * m), I0 = new Float64Array(m);
  const addG = (G, a, b, g) => {
    if (a > 0) G[(a - 1) * m + (a - 1)] += g;
    if (b > 0) G[(b - 1) * m + (b - 1)] += g;
    if (a > 0 && b > 0) { G[(a - 1) * m + (b - 1)] -= g; G[(b - 1) * m + (a - 1)] -= g; }
  };
  const inj = (I, a, i) => { if (a > 0) I[a - 1] += i; };
  for (let k = 1; k < N; k++) G0[(k - 1) * m + (k - 1)] += GMIN;
  const nonlinear = [];
  for (const el of els) {
    switch (el.kind) {
      case 'R': addG(G0, el.a, el.b, 1 / el.r); break;
      case 'V': {
        const g = 1 / el.r;
        addG(G0, el.a, el.b, g);
        inj(I0, el.a, el.e * g);
        inj(I0, el.b, -el.e * g);
        break;
      }
      case 'I': inj(I0, el.a, -el.i); inj(I0, el.b, el.i); break;
      default: nonlinear.push(el);
    }
  }
  let v = new Float64Array(N);
  if (guess && guess.length === N) v.set(guess);
  // initialise junctions from the guess (or a sensible forward bias)
  for (const el of nonlinear) {
    if (el.kind === 'D') {
      const nvt = el.n * VT;
      el.vcrit = nvt * Math.log(nvt / (Math.SQRT2 * el.is));
      el.vd = guess ? v[el.a] - v[el.k] : 0;
    } else if (el.kind === 'Q') {
      el.vcrit = VT * Math.log(VT / (Math.SQRT2 * el.is));
      el.vbe = guess ? v[el.b] - v[el.e] : 0;
      el.vbc = guess ? v[el.b] - v[el.c] : 0;
    }
  }
  if (!nonlinear.length) {
    const x = solveDense(G0.slice(), I0.slice(), m);
    if (!x) return { v, ok: false, iterations: 1 };
    v = new Float64Array(N);
    v.set(x, 1);
    return { v, ok: true, iterations: 1 };
  }
  const G = new Float64Array(m * m), I = new Float64Array(m);
  for (let it = 1; it <= maxIter; it++) {
    G.set(G0);
    I.set(I0);
    for (const el of nonlinear) {
      if (el.kind === 'D') {
        const nvt = el.n * VT;
        const { i, g } = diodeIV(el.is, nvt, el.vd);
        const ieq = i - g * el.vd;
        addG(G, el.a, el.k, g);
        inj(I, el.a, -ieq);
        inj(I, el.k, ieq);
      } else if (el.kind === 'Q') stampBJT(el, G, I, m);
    }
    const x = solveDense(G, I, m);
    if (!x) return { v, ok: false, iterations: it };
    const nv = new Float64Array(N);
    nv.set(x, 1);
    // converged when the node voltages stop moving and no junction was limited
    let maxDv = 0;
    for (let k = 1; k < N; k++) maxDv = Math.max(maxDv, Math.abs(nv[k] - v[k]) / (reltol * Math.max(Math.abs(nv[k]), Math.abs(v[k])) + vntol));
    let limited = false;
    for (const el of nonlinear) {
      if (el.kind === 'D') {
        const nvt = el.n * VT;
        const want = nv[el.a] - nv[el.k];
        const lim = pnjlim(want, el.vd, nvt, el.vcrit);
        if (Math.abs(lim - want) > 1e-9) limited = true;
        el.vd = lim;
      } else if (el.kind === 'Q') {
        const wbe = nv[el.b] - nv[el.e], wbc = nv[el.b] - nv[el.c];
        const lbe = pnjlim(wbe, el.vbe, VT, el.vcrit), lbc = pnjlim(wbc, el.vbc, VT, el.vcrit);
        if (Math.abs(lbe - wbe) > 1e-9 || Math.abs(lbc - wbc) > 1e-9) limited = true;
        el.vbe = lbe;
        el.vbc = lbc;
      }
    }
    v = nv;
    if (maxDv <= 1 && !limited && it > 1) return { v, ok: true, iterations: it };
  }
  return { v, ok: false, iterations: maxIter };
}

/** Ebers–Moll (transport form) NPN terminal currents into C, B, E and their Jacobian w.r.t. vbe, vbc. */
export function bjtCurrents(el, vbe, vbc) {
  const ef = safeExp(vbe / VT), er = safeExp(vbc / VT);
  const iF = el.is * (ef - 1), iR = el.is * (er - 1);
  const gF = (el.is / VT) * ef, gR = (el.is / VT) * er;
  const ic = iF - iR * (1 + 1 / el.br) - GMIN * vbc;
  const ib = iF / el.bf + iR / el.br + GMIN * (vbe + vbc);
  return {
    ic, ib, ie: -(ic + ib),
    // partial derivatives
    dic_dvbe: gF, dic_dvbc: -gR * (1 + 1 / el.br) - GMIN,
    dib_dvbe: gF / el.bf + GMIN, dib_dvbc: gR / el.br + GMIN,
  };
}

function stampBJT(el, G, I, m) {
  const r = bjtCurrents(el, el.vbe, el.vbc);
  // derivatives with respect to node voltages vC, vB, vE
  // vbe = vB − vE, vbc = vB − vC
  const d = (dvbe, dvbc) => ({ c: -dvbc, b: dvbe + dvbc, e: -dvbe });
  const dIc = d(r.dic_dvbe, r.dic_dvbc), dIb = d(r.dib_dvbe, r.dib_dvbc);
  const dIe = { c: -(dIc.c + dIb.c), b: -(dIc.b + dIb.b), e: -(dIc.e + dIb.e) };
  const nodes = { c: el.c, b: el.b, e: el.e };
  // linearisation point in node terms: choose vE as 0 reference (only differences matter)
  const v0 = { c: -el.vbc + el.vbe, b: el.vbe, e: 0 };
  const rows = [['c', r.ic, dIc], ['b', r.ib, dIb], ['e', r.ie, dIe]];
  for (const [t, cur, der] of rows) {
    const row = nodes[t];
    let ieq = cur;
    for (const s of ['c', 'b', 'e']) ieq -= der[s] * v0[s];
    if (row > 0) {
      for (const s of ['c', 'b', 'e']) {
        const col = nodes[s];
        if (col > 0) G[(row - 1) * m + (col - 1)] += der[s];
      }
      I[row - 1] -= ieq;
    }
  }
}

/** Current through an element (a→b for R/V, anode→cathode for D, collector for Q) at solution v. */
export function elementCurrent(el, v) {
  switch (el.kind) {
    case 'R': return (v[el.a] - v[el.b]) / el.r;
    case 'V': return (v[el.a] - v[el.b] - el.e) / el.r;
    case 'I': return el.i;
    case 'D': return diodeIV(el.is, el.n * VT, v[el.a] - v[el.k]).i;
    case 'Q': {
      const r = bjtCurrents(el, v[el.b] - v[el.e], v[el.b] - v[el.c]);
      return { ic: r.ic, ib: r.ib, ie: r.ie };
    }
  }
  return 0;
}
