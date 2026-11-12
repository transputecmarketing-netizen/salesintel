// Designer gradient family (canvas). Reads window.BRAND (resolved palette) and window.SPEC.
// Every design composes its light on the RIGHT; build.py mirrors the art layer for side "left".
(() => {
  const P = BRAND.colors, SP = SPEC, W = 1920, H = 1080;
  const c = document.getElementById('c'), g = c.getContext('2d');
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = (h, a = 1) => `rgba(${rgb(h).join(',')},${a})`;
  const mix = (a, b, t) => '#' + rgb(a).map((x, i) => Math.max(0, Math.min(255, Math.round(x + (rgb(b)[i] - x) * t))).toString(16).padStart(2, '0')).join('');
  const CLEAR = 'rgba(0,0,0,0)';
  function blob(x, y, r, col) { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, CLEAR); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
  function base(col = P.base) { g.fillStyle = col; g.fillRect(0, 0, W, H); }
  function blur(px, fn) { const o = document.createElement('canvas'); o.width = W; o.height = H; fn(o.getContext('2d')); g.save(); g.filter = `blur(${px}px)`; g.drawImage(o, 0, 0); g.restore(); }
  const spot = (o, x, y, r, col) => { const rg = o.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, CLEAR); o.fillStyle = rg; o.fillRect(0, 0, W, H); };
  const deep2 = mix(P.base, P.deep, .55);

  const R = {
    mesh() { base(); blur(150, o => { o.globalCompositeOperation = 'screen';
        spot(o, 1500, 250, 820, P.vivid); spot(o, 1880, 760, 640, P.primary); spot(o, 1650, 1000, 520, P.bright); spot(o, 1350, 520, 360, A(P.pale, .8)); spot(o, 900, 1150, 600, A(P.vivid, .55)); spot(o, 200, 1000, 600, A(P.deep, .8)); });
      g.globalCompositeOperation = 'screen'; blur(220, o => spot(o, 1550, 450, 700, A(P.bright, .55))); g.globalCompositeOperation = 'source-over';
      const v = g.createLinearGradient(0, 0, W, 0); v.addColorStop(0, A(P.base, .8)); v.addColorStop(.5, A(P.base, .2)); v.addColorStop(1, A(P.base, 0)); g.fillStyle = v; g.fillRect(0, 0, W, H); },
    ribbon() { base(); blob(1500, 300, 1100, A(P.deep, .7));
      for (let k = 0; k < 60; k++) { const t = k / 60; g.beginPath(); for (let x = -100; x <= W + 100; x += 10) { const y = 640 + Math.sin(x / 420 + t * 1.6) * 170 * (1 - t * .3) - t * 260 + Math.cos(x / 260 - t * 2) * 40; x < -90 ? g.moveTo(x, y) : g.lineTo(x, y); }
        const l = g.createLinearGradient(0, 0, W, 0); l.addColorStop(0, A(P.vivid, 0)); l.addColorStop(.4, A(P.primary, .06 + .2 * t)); l.addColorStop(.55, A(P.primary, .2 + .5 * t)); l.addColorStop(.7, A(P.bright, .4 + .5 * t)); l.addColorStop(1, A(P.cyan, .2 + .6 * t));
        g.strokeStyle = l; g.lineWidth = 1.4; g.stroke(); }
      blur(60, o => spot(o, 1300, 420, 500, A(P.bright, .45))); },
    horizon() { const l = g.createLinearGradient(0, 0, 0, H); l.addColorStop(0, P.base); l.addColorStop(.55, deep2); l.addColorStop(.78, mix(P.deep, P.primary, .6)); l.addColorStop(.86, P.bright); l.addColorStop(1, P.base); g.fillStyle = l; g.fillRect(0, 0, W, H);
      blur(90, o => { const rg = o.createRadialGradient(W / 2, 2560, 0, W / 2, 2560, 1100); rg.addColorStop(0, A(P.pale, .9)); rg.addColorStop(.3, A(P.bright, .55)); rg.addColorStop(1, CLEAR); o.fillStyle = rg; o.scale(1, .35); o.fillRect(0, 0, W, H * 3); });
      const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(.9, A(P.base, 0)); v.addColorStop(1, A(P.base, .9)); g.fillStyle = v; g.fillRect(0, 0, W, H); },
    fluted() { const src = document.createElement('canvas'); src.width = W; src.height = H; const s = src.getContext('2d');
      s.fillStyle = P.base; s.fillRect(0, 0, W, H); s.filter = 'blur(120px)';
      for (const [x, y, r, col] of [[1450, 380, 520, P.primary], [1700, 820, 420, P.cyan], [1150, 900, 380, P.vivid], [1550, 260, 240, P.pale]]) { s.fillStyle = col; s.beginPath(); s.arc(x, y, r, 0, 7); s.fill(); }
      const sw = 48; for (let x = 0; x < W; x += sw) { // reeded glass: each flute shows a compressed, offset slice
        g.drawImage(src, x - sw * .9, 0, sw * 2.8, H, x, 0, sw, H);
        const sh = g.createLinearGradient(x, 0, x + sw, 0); sh.addColorStop(0, 'rgba(255,255,255,.07)'); sh.addColorStop(.18, 'rgba(255,255,255,0)'); sh.addColorStop(.82, CLEAR); sh.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = sh; g.fillRect(x, 0, sw, H); }
      const v = g.createLinearGradient(0, 0, W, 0); v.addColorStop(0, A(P.base, .75)); v.addColorStop(.55, A(P.base, .25)); v.addColorStop(1, A(P.base, 0)); g.fillStyle = v; g.fillRect(0, 0, W, H); },
    glass() { base(); blur(130, o => { spot(o, 1500, 300, 700, P.primary); spot(o, 1800, 900, 600, A(P.cyan, .8)); spot(o, 900, 1000, 600, A(P.vivid, .7)); });
      const pane = (l, t, w, h, r, a) => `<div style="position:absolute;left:${l}px;top:${t}px;width:${w}px;height:${h}px;border-radius:${r}px;backdrop-filter:blur(40px) saturate(140%);background:linear-gradient(140deg,rgba(255,255,255,${a}),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 40px 80px rgba(0,0,0,.3)"></div>`;
      document.getElementById('art').insertAdjacentHTML('beforeend', pane(1340, 140, 420, 560, 40, .1) + pane(1520, 520, 300, 380, 36, .14) + pane(1180, 620, 260, 260, 130, .08)); },
    rings() { base(); blob(1920, 1080, 1300, A(P.deep, .75));
      for (let i = 0; i < 26; i++) { const r = 220 + i * 46; const l = g.createLinearGradient(1920 - r, 1080 - r, 1920, 1080); l.addColorStop(0, A(P.pale, .85 - i * .025)); l.addColorStop(.6, A(P.bright, .8 - i * .022)); l.addColorStop(1, A(P.primary, 0));
        g.strokeStyle = l; g.lineWidth = i % 4 === 0 ? 3 : 1.4; g.beginPath(); g.arc(1920, 1080, r, Math.PI, Math.PI * 1.5); g.stroke(); }
      blur(80, o => { const rg = o.createRadialGradient(1920, 1080, 0, 1920, 1080, 420); rg.addColorStop(0, P.bright); rg.addColorStop(.5, A(P.vivid, .6)); rg.addColorStop(1, CLEAR); o.fillStyle = rg; o.fillRect(0, 0, W, H); }); },
    orb() { base(); blob(1500, 540, 1100, A(P.deep, .55));
      const x = 1560, y = 560, r = 470; const sp = g.createRadialGradient(x - 170, y - 200, 20, x, y, r); sp.addColorStop(0, mix(P.pale, '#ffffff', .4)); sp.addColorStop(.18, P.bright); sp.addColorStop(.55, P.vivid); sp.addColorStop(.85, deep2); sp.addColorStop(1, P.base);
      g.fillStyle = sp; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      const rim = g.createRadialGradient(x + 140, y + 220, r * .6, x, y, r); rim.addColorStop(0, A(P.cyan, 0)); rim.addColorStop(.92, A(P.cyan, .45)); rim.addColorStop(1, A(P.cyan, 0)); g.fillStyle = rim; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      blur(120, o => spot(o, x, y + 80, 700, A(P.primary, .6))); },
    beam() { base(); blob(400, 0, 1300, A(P.deep, .6));
      blur(70, o => { o.save(); o.translate(1560, -120); o.rotate(.42); const l = o.createLinearGradient(-260, 0, 260, 0); l.addColorStop(0, CLEAR); l.addColorStop(.5, A(P.vivid, .95)); l.addColorStop(1, CLEAR); o.fillStyle = l; o.fillRect(-260, 0, 520, 1800);
        o.translate(330, 60); const l2 = o.createLinearGradient(-120, 0, 120, 0); l2.addColorStop(0, CLEAR); l2.addColorStop(.5, A(P.pale, .5)); l2.addColorStop(1, CLEAR); o.fillStyle = l2; o.fillRect(-120, 0, 240, 1800); o.restore(); });
      blur(4, o => { o.save(); o.translate(1560, -120); o.rotate(.42); o.fillStyle = A(P.glow, .55); o.fillRect(-2, 0, 4, 1800); o.restore(); }); },
    // Reference sheet, not a background: shows the brand's four gradients.
    system() { base(); const F = BRAND._font, gr = Object.entries(BRAND.gradients);
      document.getElementById('art').insertAdjacentHTML('beforeend', `<div style="position:absolute;left:96px;top:170px;font:600 64px ${F};letter-spacing:-.03em;color:#fff">Gradient system</div><div style="position:absolute;left:96px;top:262px;font:300 22px ${F};color:${P.muted}">${gr.length} gradients. Every background in the set is built from these.</div>` +
        gr.map(([k, v], i) => `<div style="position:absolute;left:${96 + i * 438}px;top:380px;width:410px;font-family:${F};color:#fff"><div style="height:420px;border-radius:28px;background:linear-gradient(160deg,${v.join(',')});border:1px solid rgba(255,255,255,.12)"></div><div style="margin-top:26px;font-weight:600;font-size:26px">${k}</div><div style="margin-top:10px;font-size:16px;letter-spacing:.08em;color:${P.muted}">${v.join('  >  ')}</div></div>`).join('')); },
  };
  (async () => { await document.fonts.ready; if (!R[SP.design]) throw new Error('gradient: unknown design ' + SP.design); R[SP.design](); await new Promise(r => setTimeout(r, 200)); window.__done = true; })();
})();
