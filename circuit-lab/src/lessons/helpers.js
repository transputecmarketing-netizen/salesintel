// Shared helpers for lesson files.
import * as THREE from 'three';
import { makeLED, makeResistor } from '../scene/components.js';

export const v = (x, y, z) => new THREE.Vector3(x, y, z);
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const BB = [9.4, -0.6]; // breadboard position next to the board

export const LED_COLORS = [['red', 'Red'], ['yellow', 'Yellow'], ['green', 'Green'], ['blue', 'Blue'], ['white', 'White']];
export const OHMS = [[100, '100 Ω'], [220, '220 Ω'], [470, '470 Ω'], [1000, '1 kΩ'], [10000, '10 kΩ']];
export const fmtOhms = (o) => (o >= 1000 ? `${o / 1000} kΩ` : `${o} Ω`);
/** LED brightness for a series resistor on 5 V (≈2 V across the LED). */
export const ledGain = (ohms) => clamp(((3 / ohms) * 1000) / 13, 0.05, 1);

/** Resistor + LED from a digital pin to ground — reused by several lessons. */
export function ledOnPin(ctx, bb, { pin, col = 4, color = 'red', gnd = 'GND', ohms = 220 }) {
  const res = ctx.add(makeResistor(bb.hole(col, 'd'), bb.hole(col + 4, 'd'), ohms));
  const led = ctx.add(makeLED(color, bb.hole(col + 4, 'c'), bb.hole(col + 5, 'c')));
  const sig = ctx.wire(ctx.board.pin(pin), bb.hole(col, 'b'), 'orange', { signal: pin });
  const gw = ctx.wire(ctx.board.pin(gnd), bb.hole(col + 5, 'a'), 'black', { signal: 'GND', dir: -1 });
  const state = { gain: ledGain(ohms) };
  ctx.interact(led, {
    name: 'LED', hint: 'Click to change its colour',
    controls: [{ type: 'choice', label: 'Colour', options: LED_COLORS, get: () => led.color, set: (c) => led.setColor(c) }],
  });
  ctx.interact(res, {
    name: 'Resistor', hint: 'Click to try other values',
    controls: [{
      type: 'choice', label: 'Resistance', options: OHMS, get: () => res.ohms,
      set: (o) => { res.setValue(o); state.gain = ledGain(o); led.set(led.level > 0 ? state.gain : 0); },
    }],
    note: () => `Current ≈ ${((3 / res.ohms) * 1000).toFixed(1)} mA${res.ohms < 150 ? ' — too much for a small LED!' : ''}`,
  });
  return { res, led, sig, gw, state, on: (x = 1) => led.set(x * state.gain) };
}

