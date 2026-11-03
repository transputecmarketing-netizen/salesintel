// Loads the Tinker Lab Arduino runtime (src/runtime/) when it is part of the
// build. Studio keeps working (editing, wiring, the live circuit) without it.
const mods = import.meta.glob('../runtime/index.js');

let cached = null;
export function loadRuntime() {
  cached ??= (async () => {
    const load = mods['../runtime/index.js'];
    if (!load) return null;
    try {
      const m = await load();
      return typeof m.compile === 'function' ? m : null;
    } catch (e) {
      console.warn('Arduino runtime failed to load', e);
      return null;
    }
  })();
  return cached;
}
