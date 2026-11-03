// One square-wave voice for buzzers (tone() on a passive piezo, or an active buzzer).
let ctx = null, osc = null, gain = null;
let enabled = true, current = 0;

export function setSoundEnabled(on) {
  enabled = on;
  if (!on) play(0);
}
export const soundEnabled = () => enabled;

/** Play `freq` Hz (0 = silence). Call from a user gesture once to unlock audio. */
export function play(freq) {
  if (!enabled) freq = 0;
  if (freq === current) return;
  current = freq;
  try {
    if (!ctx) {
      if (!freq) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      osc = ctx.createOscillator();
      osc.type = 'square';
      osc.connect(gain);
      osc.start();
    }
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    if (freq) osc.frequency.setTargetAtTime(freq, t, 0.002);
    gain.gain.setTargetAtTime(freq ? 0.035 : 0, t, 0.006);
  } catch {
    /* audio unavailable */
  }
}
