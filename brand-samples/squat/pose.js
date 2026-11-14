// Squat kinematics, side view facing right. Units: px, y down. Proportions after Winter (body height H).
const H = 700, G = 812, AX = 270;
const L = { foot: .152*H, ankleH: .039*H, shank: .246*H, thigh: .245*H, torso: .288*H, neck: .052*H, headR: .066*H, upper: .186*H, fore: .146*H, hand: .09*H };
const M = { foot: .0145, shank: .0465, thigh: .100, trunk: .497, head: .081, upper: .028, fore: .016, hand: .006 };
const rad = d => d * Math.PI / 180;
function pose(s, lean) {   // s: 0 standing .. 1 bottom
  const shin = 35 * s, thigh = 98 * s;            // shin forward from vertical; thigh from vertical (>90 = hip below knee)
  const A = [AX, G - L.ankleH];
  const heel = [AX - .27 * L.foot, G], toe = [heel[0] + L.foot, G], mid = heel[0] + .5 * L.foot;
  const K = [A[0] + L.shank * Math.sin(rad(shin)), A[1] - L.shank * Math.cos(rad(shin))];
  const P = [K[0] - L.thigh * Math.sin(rad(thigh)), K[1] - L.thigh * Math.cos(rad(thigh))];
  const S = [P[0] + L.torso * Math.sin(rad(lean)), P[1] - L.torso * Math.cos(rad(lean))];
  const neckDir = rad(lean * .55);                 // neutral neck: head stays near the torso line, eyes ahead
  const N = [S[0] + L.neck * Math.sin(neckDir), S[1] - L.neck * Math.cos(neckDir)];
  const Hc = [N[0] + L.headR * .55 * Math.sin(neckDir) + 4, N[1] - L.headR * .95];
  const armUp = rad(90 - 6 * (1 - s));             // arms reach straight forward to counterbalance the hips
  const E = [S[0] + L.upper * Math.sin(armUp), S[1] - L.upper * Math.cos(armUp)];
  const W = [E[0] + L.fore * Math.sin(armUp + .05), E[1] - L.fore * Math.cos(armUp + .05)];
  const Hd = [W[0] + 11 * Math.sin(armUp), W[1] - 11 * Math.cos(armUp)];
  const lerp = (a, b, f) => a + (b - a) * f;
  const parts = [
    [2 * M.foot, mid], [2 * M.shank, lerp(K[0], A[0], .433)], [2 * M.thigh, lerp(P[0], K[0], .433)],
    [M.trunk, lerp(P[0], S[0], .5)], [M.head, Hc[0]], [2 * M.upper, lerp(S[0], E[0], .436)], [2 * M.fore, lerp(E[0], W[0], .43)], [2 * M.hand, Hd[0]]];
  const mass = parts.reduce((a, p) => a + p[0], 0), comX = parts.reduce((a, p) => a + p[0] * p[1], 0) / mass;
  const ang = (a, b, c) => { const v1 = [a[0]-b[0], a[1]-b[1]], v2 = [c[0]-b[0], c[1]-b[1]]; return Math.acos((v1[0]*v2[0]+v1[1]*v2[1]) / Math.hypot(...v1) / Math.hypot(...v2)) * 180 / Math.PI; };
  return { s, shin, thigh, lean, A, K, P, S, N, Hc, E, W, Hd, heel, toe, mid, comX, knee: ang(P, K, A), hip: ang(S, P, K) };
}
function solve(s) {   // torso lean that puts the centre of mass over mid-foot
  let lo = -15, hi = 75;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, p = pose(s, m); if (p.comX < p.mid) lo = m; else hi = m; }
  return pose(s, (lo + hi) / 2);
}
if (typeof module !== "undefined") module.exports = { solve, L, H, G };
if (typeof window !== "undefined") window.SQ = { solve, L, H, G };
