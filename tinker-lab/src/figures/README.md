# Tinker Lab figures

Credit: built on the hairline kernel by Lucas Marques (https://github.com/lucasmarkes/hairline), MIT licence; the licence text is in `vendor/HAIRLINE-LICENSE` and below.

Isometric line figures of electronics and maker objects that answer the pointer. Every figure keeps the ten rules in `vendor/rules.md`, uses the 400 × 320 frame, and runs on the same kernel (`vendor/hairline-kernel.js`, unchanged).

## Use

```js
import { mountFigure, mountAll, FIGURES } from './figures/index.js';

const fig = mountFigure(el, 'servo', {
  intensity: 0.5,        // 0..1, the figure's one number (see the table)
  play: false,           // true: an unseen pointer walks the figure's tour until a hand arrives
  label: '…',            // accessible name; defaults to the registry description
  onRead: (text) => {},  // the read-out ("rest", "090°", "core 3" …), on every change
  accent: 'red',         // the one bright stroke: 'red' (--tl-accent), 'iris' (--tl-iris) or 'ink' (--tl-ink)
  lazy: true,            // mount when the element nears the viewport (default)
});
fig.update({ intensity: 0.8, play: true });
fig.destroy();
await fig.ready;         // resolves once the figure's module has loaded and mounted

mountAll(document);      // every <div data-figure="pcb" data-intensity="0.6" data-play data-accent="iris">
```

The element gets a 5:4 box (`aspect-ratio`), `role="img"` and an `aria-label`; set its width. Colours come from the brand's custom properties in `src/brand/tokens.css` (plate `--tl-bg`, bright stroke `--tl-accent` / `--tl-iris` / `--tl-ink`), so load that stylesheet on the page. All figures share the kernel's one frame loop: it sleeps offscreen and lands every motion at once under `prefers-reduced-motion`. Each figure is its own chunk, loaded on first view.

`FIGURES` is `[{ name, title, description }]`. Put any text around a figure in Newsreader Light; nothing inside the drawing is text.

| name | what the pointer does | intensity drives (0 · 0.5 · 1) |
| --- | --- | --- |
| `chip` | x opens the gap between an IC's layers, height picks a layer | gap 14 · 21 · 28 |
| `breadboard` | the hole under it lifts its five-hole clip, or a whole rail | lift 8 · 14 · 20 |
| `servo` | the horn follows its angle round the shaft, 0–180° | spring k 40 · 100 · 220 |
| `stepper` | the dial needle steps to it detent by detent | ms per step 160 · 100 · 55 |
| `led-matrix` | paints the 8 × 8 LEDs, which fade like phosphor (ambient loop) | afterglow ms 150 · 520 · 1500 |
| `robot-arm` | the arm reaches it with two-link IK; the gripper closes | reach 46 · 60 · 74 |
| `processor` | the core under it takes the load, its cache slice follows | rise 20 · 30 · 40 |
| `pcb` | the net under it lifts, its pads follow nearest first | lift 10 · 16 · 24 |
| `solar` | the panel turns to face it, as the sun | azimuth reach ° 25 · 45 · 62 |
| `gearbox` | the big gear's crank turns to it; the train follows | spring k 40 · 100 · 220 |
| `windmill` | pointer speed is wind; the meter reads volts (ambient) | coast ms 300 · 900 · 2000 |
| `radar` | an echo rises where it is as the beam passes (ambient) | turns/s 0.12 · 0.22 · 0.4 |
| `conveyor` | tags the crate under it; the diverter sorts it to the chute (ambient) | belt speed × 0.6 · 1 · 1.6 |
| `lidar` | moves the bin the lidar's point cloud finds (ambient) | turns/s 0.25 · 0.45 · 0.8 |

Gallery (dev server only): `/dev/figures.html`, or `/dev/figures.html?f=servo&w=480&intensity=0.5&play=1&accent=iris&at=300,150`.

## Adding a figure

Write `<name>.js` in the shape of the others: `import HL from './vendor/hairline-kernel.js'`, a `mount({ stage, svg, read }, value)` that returns `{ set, destroy }`, and `export default { name, means, rules, range, tour, mount }`. Keep it under 200 lines, use only the kernel's classes for paint, and register it in `index.js` (`FIGURES` and `LOAD`). The hairline skill's `validate.mjs` and `look.mjs` check a figure once its first line is dropped and `export default {` is read as `hairline({`.

## Licence of the kernel

MIT License

Copyright (c) 2026 Lucas Marques

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
