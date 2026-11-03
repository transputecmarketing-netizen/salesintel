// Soldering basics, IKEA-manual style: safety, heat, touch, feed, remove, inspect, snip.
import { scene, clamp } from '../../engine.js';
import { panel } from '../../kit.js';

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A soldering iron making a joint on a circuit board, step by step',
  steps: [
    'Safety first: glasses on, fumes away, iron back in its stand.',
    'Heat the iron to about 350 °C and wipe the tip clean.',
    'Touch the tip to the pad and the leg together: count two seconds.',
    'Feed solder into the joint, not onto the iron.',
    'Take the solder away, then the iron. Keep still while it cools.',
    'Good joint: a shiny little cone. Bad: a dull blob or a bridge.',
    'Snip the extra leg, then wash your hands.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { safety: 1, iron: 0, temp: 25, wipe: 0, heat: 0, feed: 0, fill: 0, cool: 0, joints: 0, snip: 0, board: 0.3 };
    const HX = 400, BY = 330;
    // ---------- the board in cross-section with one through-hole
    const boardG = d.g();
    let lead, leadTop;
    d.into(boardG, () => {
      d.rect(120, BY, 560, 34, { fill: '#2e8b57', stroke: C.ink, strokeWidth: 2, roughness: 0.6 });
      d.rect(HX - 14, BY - 1, 28, 36, { fill: '#fff', stroke: 'none', roughness: 0.2 });
      d.rect(HX - 44, BY - 7, 30, 7, { fill: C.copper, stroke: C.ink, strokeWidth: 1.2, roughness: 0.3 });
      d.rect(HX + 14, BY - 7, 30, 7, { fill: C.copper, stroke: C.ink, strokeWidth: 1.2, roughness: 0.3 });
      d.rect(HX - 14, BY - 1, 4, 36, { fill: C.copper, stroke: 'none' }); d.rect(HX + 10, BY - 1, 4, 36, { fill: C.copper, stroke: 'none' });
      d.rect(HX - 44, BY + 34, 30, 7, { fill: C.copper, stroke: C.ink, strokeWidth: 1.2, roughness: 0.3 });
      d.rect(HX + 14, BY + 34, 30, 7, { fill: C.copper, stroke: C.ink, strokeWidth: 1.2, roughness: 0.3 });
      d.rect(HX - 60, BY + 60, 120, 40, { fill: '#ead7b0', stroke: C.ink, strokeWidth: 2, roughness: 0.5 });
      d.text(HX + 70, BY + 82, 'part', { size: 15, fill: C.muted, mono: true, anchor: 'start' });
      lead = d.g(boardG);
      d.into(lead, () => d.line(HX, BY + 60, HX, BY - 20, { stroke: '#9a9ca3', strokeWidth: 5, roughness: 0.2 }));
      leadTop = d.g(boardG);
      d.into(leadTop, () => d.line(HX, BY - 20, HX, BY - 70, { stroke: '#9a9ca3', strokeWidth: 5, roughness: 0.2 }));
      d.text(130, BY + 56, 'circuit board', { size: 15, fill: C.muted, mono: true, anchor: 'start' });
      d.text(HX - 50, BY - 22, 'pad', { size: 15, fill: C.copper, mono: true, anchor: 'end' });
    });
    const heatGlow = d.glow(HX, BY - 6, 90, C.accent);
    const fillet = d.el('path', { fill: '#c7c9cf', stroke: C.ink, 'stroke-width': 1.6 }, S.layers.main);
    const shine = d.el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, S.layers.main);
    // ---------- the iron (tip at the origin, pointing down-left)
    const iron = d.g(S.layers.top);
    let tipGlow;
    d.into(iron, () => {
      tipGlow = d.glow(0, 0, 40, C.accent, iron);
      d.poly([[0, 0], [24, -20], [36, -8]], { fill: '#8e9097', stroke: C.ink, strokeWidth: 1.6, roughness: 0.4 });
      d.poly([[24, -20], [130, -110], [142, -98], [36, -8]], { fill: '#c7c9cf', stroke: C.ink, strokeWidth: 1.8, roughness: 0.4 });
      d.poly([[130, -110], [250, -210], [275, -182], [142, -98]], { fill: C.ink, stroke: C.ink, strokeWidth: 2, roughness: 0.5 });
      d.line(160, -122, 240, -190, { stroke: C.accent, strokeWidth: 3, roughness: 0.3 });
    });
    // ---------- the solder wire (end at the origin, from the upper left)
    const solder = d.g(S.layers.top);
    d.into(solder, () => d.path('M0 0 C -40 -40, -120 -60, -220 -130', { stroke: '#b9bcc2', strokeWidth: 6, fill: 'none', roughness: 0.5 }));
    const smoke = [0, 1, 2].map(() => d.el('path', { fill: 'none', stroke: C.line2, 'stroke-width': 3, 'stroke-linecap': 'round' }, S.layers.fx));
    // sponge
    const spongeG = d.g(undefined, { opacity: 0 });
    d.into(spongeG, () => { d.rect(560, 230, 120, 40, { fill: C.yellowSoft, stroke: C.ink, fillStyle: 'solid', roughness: 0.8 }); d.text(620, 290, 'damp sponge or brass wool', { size: 14, fill: C.muted, mono: true }); });
    const tempT = d.text(700, 60, '', { size: 30, fill: C.ink, mono: true, weight: 500 });
    d.text(700, 88, 'tip temperature', { size: 14, fill: C.muted, mono: true });
    const countT = d.text(HX, 170, '', { size: 40, fill: C.accent, weight: 400 });

    // ---------- safety icons
    const safeG = d.g(S.layers.top);
    d.into(safeG, () => {
      panel(S, 40, 40, 720, 210, { parent: safeG });
      // goggles
      d.ellipse(150, 130, 70, 50, { fill: C.blueSoft, strokeWidth: 2.4 }); d.ellipse(230, 130, 70, 50, { fill: C.blueSoft, strokeWidth: 2.4 });
      d.line(185, 128, 195, 128, { strokeWidth: 3 }); d.path('M115 125 q-20 -10 -30 10 M265 125 q20 -10 30 10', { strokeWidth: 2.4, fill: 'none' });
      d.text(190, 205, 'safety glasses', { size: 18, fill: C.ink2 });
      // fan blowing fumes away
      d.circle(400, 125, 90, { fill: '#fff', strokeWidth: 2.4 });
      for (let k = 0; k < 3; k++) { const a = k * 2.09; d.ellipse(400 + Math.cos(a) * 20, 125 + Math.sin(a) * 20, 34, 16, { fill: C.line2, strokeWidth: 1.4 }); }
      d.path('M460 105 q15 -8 30 0 t30 0 M460 130 q15 -8 30 0 t30 0', { stroke: C.muted, strokeWidth: 2, fill: 'none' });
      d.text(420, 205, 'air flowing away from you', { size: 18, fill: C.ink2 });
      // stand
      d.path('M600 170 L700 170 L690 180 L610 180 Z', { fill: C.ink2, strokeWidth: 2 });
      d.path('M620 170 C 625 120, 660 90, 690 70 L700 80 C 672 100, 645 125, 640 170', { fill: '#c7c9cf', strokeWidth: 2 });
      d.text(650, 205, 'hot iron lives in its stand', { size: 18, fill: C.ink2 });
    });

    // ---------- good and bad joints
    const jG = d.g(S.layers.top, { opacity: 0 });
    d.into(jG, () => {
      const card = (x, title, ok) => {
        panel(S, x - 100, 40, 200, 200, { parent: jG });
        d.rect(x - 80, 170, 160, 18, { fill: '#2e8b57', roughness: 0.4 });
        d.text(x, 222, title, { size: 18, fill: ok ? C.green : C.accentInk, weight: 500 });
        d.text(x + 80, 64, ok ? '✓' : '✗', { size: 28, fill: ok ? C.green : C.accentInk, anchor: 'end' });
      };
      card(170, 'shiny cone', true);
      d.path('M136 170 C 150 160, 162 130, 167 110 L173 110 C 178 130, 190 160, 204 170 Z', { fill: '#d5d7dc', strokeWidth: 1.6 });
      d.line(170, 80, 170, 170, { stroke: '#9a9ca3', strokeWidth: 4 });
      d.path('M160 150 q4 -14 7 -28', { stroke: '#fff', strokeWidth: 2.5, fill: 'none' });
      card(400, 'dull blob (cold)', false);
      d.line(400, 80, 400, 170, { stroke: '#9a9ca3', strokeWidth: 4 });
      d.circle(400, 140, 58, { fill: '#a3a5aa', fillStyle: 'cross-hatch', hachureGap: 5, strokeWidth: 1.6 });
      card(630, 'bridge (short)', false);
      d.line(600, 80, 600, 170, { stroke: '#9a9ca3', strokeWidth: 4 }); d.line(660, 80, 660, 170, { stroke: '#9a9ca3', strokeWidth: 4 });
      d.path('M580 170 C 590 140, 610 130, 630 140 C 650 130, 670 140, 680 170 Z', { fill: '#d5d7dc', strokeWidth: 1.6 });
    });
    // ---------- snip and wash
    const snipG = d.g(S.layers.top, { opacity: 0 });
    let cutA, cutB, drops;
    d.into(snipG, () => {
      cutA = d.g(snipG); cutB = d.g(snipG);
      d.into(cutA, () => { d.path('M0 0 L70 -10 L76 4 Z', { fill: C.ink2, strokeWidth: 1.6 }); d.path('M70 -10 L190 -60 L196 -46 L76 4', { fill: C.accent, strokeWidth: 1.8 }); });
      d.into(cutB, () => { d.path('M0 0 L70 10 L76 -4 Z', { fill: C.ink2, strokeWidth: 1.6 }); d.path('M70 10 L190 60 L196 46 L76 -4', { fill: C.accent, strokeWidth: 1.8 }); });
      drops = d.g(snipG);
      d.into(drops, () => {
        for (let k = 0; k < 4; k++) d.path(`M${620 + k * 30} ${150 + (k % 2) * 20} q-9 14 0 18 q9 -4 0 -18`, { fill: C.blueSoft, stroke: C.blue, strokeWidth: 2 });
        d.text(665, 210, 'wash your hands', { size: 18, fill: C.blue });
      });
    });

    const setFillet = (f, cool) => {
      if (f < 0.02) { fillet.setAttribute('d', ''); shine.setAttribute('d', ''); return; }
      const w = 44 * Math.min(1, f * 1.3), h = 42 * f;
      fillet.setAttribute('d', `M${HX - w} ${BY - 6} C ${HX - w * 0.6} ${BY - 8}, ${HX - 6} ${BY - h * 0.6}, ${HX - 3} ${BY - 6 - h} L${HX + 3} ${BY - 6 - h} C ${HX + 6} ${BY - h * 0.6}, ${HX + w * 0.6} ${BY - 8}, ${HX + w} ${BY - 6} Z`);
      fillet.setAttribute('fill', cool ? '#d5d7dc' : '#e9e2d2');
      shine.setAttribute('d', cool ? `M${HX - 16} ${BY - 12} q6 -6 10 -${(h * 0.6).toFixed(1)}` : '');
    };
    const ironAt = (p) => { // p: 0 = parked top-right, 1 = touching the joint, -1 = at the sponge
      const tx = p >= 0 ? 600 + (HX + 16 - 600) * p : 600 + (620 - 600) * -p, ty = p >= 0 ? 290 + (BY - 12 - 290) * p : 290 + (236 - 290) * -p;
      S.at(iron, tx, ty);
    };
    S.onTick((dt, t) => {
      safeG.setAttribute('opacity', st.safety.toFixed(3));
      boardG.setAttribute('opacity', (1 - 0.75 * st.safety - 0.7 * st.joints).toFixed(3));
      ironAt(st.wipe > 0 ? -st.wipe : st.iron);
      iron.setAttribute('opacity', (1 - st.safety * 0.8 - st.joints).toFixed(3));
      tipGlow.setAttribute('opacity', clamp((st.temp - 150) / 250).toFixed(3));
      tempT.textContent = `${Math.round(st.temp)} °C`;
      tempT.setAttribute('fill', st.temp > 60 ? C.accentInk : C.ink);
      heatGlow.setAttribute('opacity', (st.heat * 0.8 * (1 - st.joints)).toFixed(3));
      S.at(solder, HX - 18 - (1 - st.feed) * 150, BY - 16 - (1 - st.feed) * 80);
      solder.setAttribute('opacity', (st.feed > 0.02 ? 1 : 0.0001) * (1 - st.joints));
      setFillet(st.fill * (1 - st.joints), st.cool > 0.5);
      smoke.forEach((p, i) => {
        const ph = (t * 0.5 + i / 3) % 1, x = HX - 10 + i * 10, y = BY - 30 - ph * 90;
        p.setAttribute('d', `M${x} ${y} q10 -12 0 -24 q-10 -12 0 -24`);
        p.setAttribute('opacity', (st.feed > 0.5 && st.fill < 0.99 ? Math.sin(ph * Math.PI) * 0.8 : 0).toFixed(2));
      });
      spongeG.setAttribute('opacity', (st.wipe > 0 || (S.step === 1) ? 1 : 0).toString());
      jG.setAttribute('opacity', st.joints.toFixed(3));
      snipG.setAttribute('opacity', st.snip > 0 ? 1 : 0);
      const cut = clamp(st.snip * 2), gone = clamp(st.snip * 2 - 1);
      cutA.setAttribute('transform', `translate(${HX + 8} ${BY - 40}) rotate(${(-12 + cut * 12).toFixed(1)})`);
      cutB.setAttribute('transform', `translate(${HX + 8} ${BY - 40}) rotate(${(12 - cut * 12).toFixed(1)})`);
      cutA.setAttribute('opacity', 1 - gone); cutB.setAttribute('opacity', 1 - gone);
      leadTop.setAttribute('transform', `translate(${gone * 120} ${-gone * 40 + gone * gone * 180}) rotate(${gone * 200} ${HX} ${BY - 45})`);
      leadTop.setAttribute('opacity', (1 - gone).toFixed(2));
      drops.setAttribute('opacity', gone.toFixed(2));
      countT.textContent = st.count ?? '';
    }, { essential: true });

    const base = { safety: 0, iron: 0, wipe: 0, heat: 0, feed: 0, fill: 0, cool: 0, joints: 0, snip: 0 };
    return {
      step(i) {
        st.count = '';
        S.to(st, { ...base }, 0);
        if (i === 0) S.to(st, { safety: 1, temp: 25 }, 0.5);
        if (i === 1) { st.temp = 25; S.play(async (w) => { await w.to(st, { temp: 350 }, 3, { ease: 'out' }); await w.to(st, { wipe: 1 }, 0.8); for (let k = 0; k < 2; k++) { await w.to(st, { wipe: 0.75 }, 0.25); await w.to(st, { wipe: 1 }, 0.25); } await w.to(st, { wipe: 0 }, 0.6); }); }
        if (i === 2) { st.temp = 350; S.play(async (w) => { await w.to(st, { iron: 1 }, 1); S.to(st, { heat: 1 }, 2); st.count = '1…'; await w(1); st.count = '2…'; await w(1); st.count = ''; }); }
        if (i === 3) { st.temp = 350; st.iron = 1; st.heat = 1; S.play(async (w) => { await w.to(st, { feed: 1 }, 0.8); await w.to(st, { fill: 1 }, 1.6, { ease: 'out' }); }); }
        if (i === 4) { st.temp = 350; st.iron = 1; st.heat = 1; st.feed = 1; st.fill = 1; S.play(async (w) => { await w(0.4); await w.to(st, { feed: 0 }, 0.7); await w(0.3); await w.to(st, { iron: 0, heat: 0 }, 0.9); await w(0.6); st.cool = 1; }); }
        if (i === 5) { st.fill = 1; st.cool = 1; S.to(st, { joints: 1 }, 0.6); }
        if (i === 6) { st.fill = 1; st.cool = 1; st.snip = 0; S.play(async (w) => { await w(0.4); await w.to(st, { snip: 1 }, 1.6, { ease: 'linear' }); }); }
      },
    };
  },
});
