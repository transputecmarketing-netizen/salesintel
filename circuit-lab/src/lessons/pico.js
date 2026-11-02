// Track — MicroPython on Pico: the RP2040 programmed in Python.
import * as THREE from 'three';
import { makeLED, makeResistor, makeButton, makePot } from '../scene/components.js';
import { makeNeoPixelRing, makeOLED } from '../scene/modules.js';
import { makePico } from '../scene/boards/pico.js';
import { v, clamp, LED_COLORS } from './helpers.js';

/** Breadboard spot to the right (+x) of the Pico, clear of its pins. */
const BBP = [7.4, 0.2];
const OHMS_33 = [[100, '100 Ω'], [220, '220 Ω'], [330, '330 Ω'], [1000, '1 kΩ'], [10000, '10 kΩ']];
/** LED brightness for a series resistor on a 3.3 V pin (≈2 V across a red LED). */
const gain33 = (ohms) => clamp(((1.3 / ohms) * 1000) / 4, 0.05, 1);
const mA33 = (ohms) => (1.3 / ohms) * 1000;

/** Resistor + LED from a Pico pin to ground on the front half (rows f–j). */
function picoLed(ctx, bb, { pin, col = 4, color = 'red', gnd = 'GND_4', ohms = 330 }) {
  const res = ctx.add(makeResistor(bb.hole(col, 'g'), bb.hole(col + 4, 'g'), ohms));
  const led = ctx.add(makeLED(color, bb.hole(col + 4, 'h'), bb.hole(col + 5, 'h')));
  const sig = ctx.wire(ctx.board.pin(pin), bb.hole(col, 'i'), 'orange', { signal: pin });
  const gw = ctx.wire(ctx.board.pin(gnd), bb.hole(col + 5, 'j'), 'black', { signal: 'GND', dir: -1 });
  const state = { gain: gain33(ohms), level: 0 };
  ctx.interact(led, {
    name: 'LED', hint: 'Click to change its colour',
    controls: [{ type: 'choice', label: 'Colour', options: LED_COLORS, get: () => led.color, set: (c) => led.setColor(c) }],
  });
  ctx.interact(res, {
    name: 'Resistor', hint: 'Click to try other values',
    controls: [{
      type: 'choice', label: 'Resistance', options: OHMS_33, get: () => res.ohms,
      set: (o) => { res.setValue(o); state.gain = gain33(o); led.set(state.level * state.gain); },
    }],
    note: () => `Current ≈ ${mA33(res.ohms).toFixed(1)} mA from 3.3 V${res.ohms < 150 ? ' — more than a Pico pin should supply!' : ''}`,
  });
  const on = (x = 1) => { state.level = x; led.set(x * state.gain); };
  return { res, led, sig, gw, state, on };
}

/** 12-bit ADC sample scaled to 16 bits the way MicroPython's read_u16() does. */
const u16 = (frac, noise = 2) => {
  const r12 = clamp(Math.round(frac * 4095 + (Math.random() - 0.5) * noise * 2), 0, 4095);
  return (r12 << 4) | (r12 >> 8);
};

/** The classic colour wheel: 0–255 → [r, g, b]. */
function wheel(pos) {
  pos &= 255;
  if (pos < 85) return [255 - pos * 3, pos * 3, 0];
  if (pos < 170) { pos -= 85; return [0, 255 - pos * 3, pos * 3]; }
  pos -= 170;
  return [pos * 3, 0, 255 - pos * 3];
}

export const pico = [
  // ------------------------------------------------------------------ 1
  {
    id: 'pico-blink', title: 'Hello, Pico', icon: 'code',
    thumb: () => makePico().group,
    view: { center: [4.4, 0.6, 0.5], size: 13 },
    build(ctx) {
      const bb = ctx.breadboard(...BBP);
      const c = picoLed(ctx, bb, { pin: 'GP15', col: 8, gnd: 'GND_4' });
      ctx.anchor('extLed', c.led.anchor);
      ctx.anchor('res', c.res.anchor);
      return c;
    },
    callouts: [
      { anchor: 'usb', x: 0.04, y: 0.17, icon: 'usb', title: 'Micro-USB', text: 'Power, plus the REPL: a Python prompt you can type into.' },
      { anchor: 'chip', x: 0.36, y: 0.12, icon: 'chip', title: 'RP2040', text: 'Dual-core Arm Cortex-M0+ running the MicroPython interpreter.' },
      { anchor: 'extLed', x: 0.7, y: 0.17, icon: 'led', title: 'LED on GP15', text: 'Follows the on-board LED, through a 330 Ω resistor.' },
      { anchor: 'led', x: 0.04, y: 0.68, icon: 'info', title: 'On-board LED', text: '<code>Pin("LED")</code> — GP25 on a classic Pico.' },
      { anchor: 'res', x: 0.7, y: 0.68, icon: 'resistor', title: '330 Ω resistor', text: 'About 4 mA from a 3.3 V pin — bright enough, and safe.' },
    ],
    overview: {
      heading: 'Hello, Pico',
      text: 'MicroPython puts a Python interpreter on the RP2040. Plug in USB and you get a <code>&gt;&gt;&gt;</code> prompt (the REPL) to try lines one at a time; save them as <code>main.py</code> and they run on every power-up. First program: blink.',
      features: [['code', '<code>Pin(25, Pin.OUT)</code> or <code>Pin("LED", Pin.OUT)</code>'], ['timer', '<code>utime.sleep()</code> pauses in seconds'], ['pins', '3.3 V logic: every pin is 0 V or 3.3 V']],
    },
    pinout: [['GP25 / "LED"', 'On-board LED', 'Not on the header'], ['GP15 (pin 20)', '330 Ω → LED (+)', 'Long leg is the anode'], ['GND (pin 23)', 'LED (–)', 'Any of the 8 GND pins'], ['USB', 'Computer', 'Power + REPL over serial']],
    example: {
      text: 'At the REPL try <code>from machine import Pin</code>, then <code>led = Pin("LED", Pin.OUT)</code> and <code>led.on()</code> — the LED lights instantly, no compiling. When it works, save the lines as <code>main.py</code> in Thonny so the Pico runs them without a computer.',
      points: ['Type <code>help("modules")</code> at the REPL to list the built-in modules', 'Press Ctrl+C to stop <code>main.py</code> and get the prompt back', 'Click the number in <code>utime.sleep()</code> to blink faster or slower'],
    },
    specs: [['Microcontroller', 'RP2040, 2 × Cortex-M0+ @ 133 MHz'], ['Memory', '264 KB SRAM, 2 MB flash'], ['Logic level', '3.3 V (pins are NOT 5 V tolerant)'], ['Pin current', '4 mA default drive, 12 mA max'], ['LED current', '(3.3 − 2.0) V / 330 Ω ≈ 4 mA'], ['Firmware', 'MicroPython .uf2 (hold BOOTSEL, drag and drop)']],
    quiz: [
      { q: 'What is the REPL?', options: ['A file on the Pico', 'An interactive Python prompt over USB: Read, Evaluate, Print, Loop', 'A type of resistor', 'The bootloader'], answer: 1, explain: 'It reads a line you type, runs it, prints the result and waits for the next — perfect for experimenting.' },
      { q: 'What voltage does a Pico pin output when set to 1?', options: ['5 V', '3.3 V', '1.8 V', '12 V'], answer: 1, explain: 'The RP2040 uses 3.3 V logic. Never feed 5 V into a Pico pin.' },
      { q: 'What does led.toggle() do?', options: ['Turns the LED on', 'Flips the pin to the opposite state', 'Deletes the pin', 'Waits one second'], answer: 1, explain: 'toggle() sets the pin to 1 if it was 0, and to 0 if it was 1.' },
      { q: 'How do you make a program run automatically at power-up?', options: ['Save it as main.py on the Pico', 'Keep Thonny open', 'Press BOOTSEL', 'You can’t'], answer: 0, explain: 'MicroPython runs boot.py and then main.py from its flash file system on every reset.' },
    ],
    challenges: ['Make a heartbeat: two quick blinks, then a long pause.', 'Blink GP15 and the on-board LED in opposite phase.', 'Blink “SOS” in Morse code using a list of on/off times and a for loop.'],
    code: `# Hello, Pico! Blink the on-board LED and an LED on GP15.
from machine import Pin
import utime

led = Pin("LED", Pin.OUT)   # GP25 on a classic Pico: Pin(25, Pin.OUT)
ext = Pin(15, Pin.OUT)      # external LED through 330 ohm
print("Hello from MicroPython!")

while True:
    led.toggle()
    ext.value(led.value())  # copy the on-board LED
    print("LED", "on" if led.value() else "off")
    utime.sleep({{ms}} / 1000)`,
    params: { ms: { value: 500, min: 20, max: 5000 } },
    async setup(io, b) {
      b.level = 0;
      io.line('led = Pin'); await io.delay(120);
      io.line('ext = Pin'); await io.delay(120);
      io.line('print("Hello'); io.print('Hello from MicroPython!'); await io.delay(150);
    },
    async loop(io, b, p) {
      io.line('led.toggle()'); b.level = b.level ? 0 : 1; io.board.setBuiltinLed(b.level);
      io.line('ext.value'); b.on(b.level); io.pin('GP15', b.level ? '1' : '0', !!b.level);
      io.line('print("LED"'); io.print(`LED ${b.level ? 'on' : 'off'}`);
      io.line('utime.sleep'); await io.delay(p.ms);
    },
    reset(b, io) { b.on(0); b.level = 0; io.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'pico-button-irq', title: 'Buttons & interrupts', icon: 'button',
    thumb: () => makeButton([v(-0.25, 0, -0.38), v(0.25, 0, -0.38), v(-0.25, 0, 0.38), v(0.25, 0, 0.38)], 0x2aa7a1).group,
    view: { center: [4.4, 0.6, 0.6], size: 14.5 },
    build(ctx) {
      const bb = ctx.breadboard(...BBP);
      const c = picoLed(ctx, bb, { pin: 'GP15', col: 4, gnd: 'GND_4' });
      const btn = ctx.add(makeButton([bb.hole(18, 'e'), bb.hole(20, 'e'), bb.hole(18, 'f'), bb.hole(20, 'f')], 0x2aa7a1));
      const w14 = ctx.wire(ctx.board.pin('GP14'), bb.hole(18, 'j'), 'yellow', { signal: 'GP14', lift: 2.4 });
      const gw = ctx.wire(ctx.board.pin('GND_5'), bb.hole(20, 'a'), 'black', { signal: 'GND', dir: -1 });
      const state = { edges: [], presses: 0 };
      // a real switch bounces: one press makes several falling edges a few ms apart
      const bounce = (t, n) => { for (let i = 0; i < n; i++) state.edges.push(t + i * (0.6 + Math.random() * 1.4)); };
      ctx.interact(btn, {
        name: 'Push button', hint: 'Press and hold — it bounces like a real one',
        hold: {
          down: () => { btn.press(true); bounce(performance.now(), 3); },
          up: () => { btn.press(false); if (Math.random() < 0.6) bounce(performance.now() + 0.4, 1); },
        },
        note: () => `Falling edges seen: ${state.presses}`,
      });
      ctx.anchor('btn', btn.anchor);
      ctx.anchor('gp14', w14.mid);
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('gnd', gw.mid);
      return { ...c, btn, state };
    },
    callouts: [
      { anchor: 'gp14', x: 0.36, y: 0.12, icon: 'pins', title: 'GP14 · PULL_UP', text: 'Reads 1 until the button connects it to GND.' },
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'LED on GP15', text: 'Toggles once per press — if the debounce works.' },
      { anchor: 'btn', x: 0.7, y: 0.17, icon: 'hand', title: 'Push button', text: 'Press and hold it. Each press bounces several times.' },
      { anchor: 'gnd', x: 0.7, y: 0.68, icon: 'gnd', title: 'GND', text: 'The other side of the switch goes to 0 V.' },
      { anchor: 'chip', x: 0.04, y: 0.68, icon: 'bolt', title: 'Interrupt', text: 'The RP2040 calls your handler the instant GP14 falls.' },
    ],
    overview: {
      heading: 'Buttons & interrupts',
      text: 'Instead of checking the button over and over, ask the chip to call a function the moment GP14 falls from 1 to 0. Switch contacts bounce, so the handler ignores edges that arrive within a few milliseconds of the last one.',
      features: [['bolt', '<code>Pin.irq(trigger=Pin.IRQ_FALLING, handler=…)</code>'], ['timer', 'Debounce with <code>ticks_ms()</code> and <code>ticks_diff()</code>'], ['hand', 'Set the debounce to 0 and watch the bounces']],
    },
    pinout: [['GP14 (pin 19)', 'Button leg', 'Pin.IN, Pin.PULL_UP'], ['GND (pin 23)', 'Other button leg', 'Pressed = 0'], ['GP15 (pin 20)', '330 Ω → LED', 'Toggled by the handler'], ['GND (pin 38)', 'LED (–)', '']],
    example: {
      text: 'Interrupts are how devices react instantly while busy doing something else: a game controller registering a tap mid-frame, a door sensor waking an alarm, a rotary encoder counting fast clicks.',
      points: ['Keep handlers tiny: set a flag or a counter, do the printing in the main loop', '<code>ticks_diff()</code> stays correct when the millisecond counter wraps around', 'Change the debounce to 0 ms and press a few times'],
    },
    specs: [['Internal pull-up', '≈ 50 kΩ to 3.3 V'], ['Trigger', 'IRQ_FALLING (1 → 0)'], ['Bounce time', 'typically 0.5–10 ms'], ['Debounce window', '50 ms (editable in the code)'], ['Handler argument', 'The Pin that fired']],
    quiz: [
      { q: 'With Pin.PULL_UP, what does GP14 read while the button is held?', options: ['1', '0', '3.3', 'It floats'], answer: 1, explain: 'The pull-up holds the pin at 1; pressing connects it to GND, so it reads 0.' },
      { q: 'Why does one press sometimes toggle the LED several times?', options: ['The LED is faulty', 'The contacts bounce, creating several falling edges', 'Interrupts are random', 'The resistor is too small'], answer: 1, explain: 'Each bounce is a real 1 → 0 edge, and each one fires the interrupt.' },
      { q: 'Why use utime.ticks_diff(now, last) instead of now - last?', options: ['It is faster', 'It handles the counter wrapping around', 'It returns seconds', 'It debounces automatically'], answer: 1, explain: 'ticks_ms() eventually wraps; ticks_diff() gives the right answer across the wrap.' },
      { q: 'What should an interrupt handler do?', options: ['As little as possible — set a flag or counter', 'Print long messages', 'Sleep for a second', 'Draw on a display'], answer: 0, explain: 'Handlers interrupt your main code; keep them short and do the slow work in the loop.' },
    ],
    challenges: ['Count presses and print the total only when it changes.', 'Add a second button on GP13 that turns the LED off, whatever its state.', 'Detect a long press (held > 1 s) using IRQ_FALLING | IRQ_RISING and the time between edges.'],
    code: `from machine import Pin
import utime

led = Pin(15, Pin.OUT)
button = Pin(14, Pin.IN, Pin.PULL_UP)
DEBOUNCE_MS = {{debounce}}
presses = 0
last = 0

def on_press(pin):
    global presses, last
    now = utime.ticks_ms()
    if utime.ticks_diff(now, last) < DEBOUNCE_MS:
        return                  # still bouncing: ignore
    last = now
    led.toggle()
    presses += 1

button.irq(trigger=Pin.IRQ_FALLING, handler=on_press)

shown = 0
while True:
    if presses != shown:        # do the slow printing here
        shown = presses
        print("press", shown, "LED", led.value())
    utime.sleep_ms(20)`,
    params: { debounce: { value: 50, min: 0, max: 500 } },
    async setup(io, b) {
      b.level = 0; b.presses = 0; b.shown = 0; b.last = -1e9; b.state.edges.length = 0; b.state.presses = 0;
      io.line('led = Pin'); await io.delay(100);
      io.line('button = Pin'); io.pin('GP14', '1', false); await io.delay(100);
      io.line('button.irq'); await io.delay(100);
      io.print('Waiting for presses…');
    },
    async loop(io, b, p) {
      const edges = b.state.edges.splice(0).sort((x, y) => x - y);
      for (const t of edges) {
        b.state.presses++;
        io.pin('GP14', '0', true);
        io.line('def on_press'); await io.delay(60);
        const now = Math.floor(t);
        io.line('ticks_diff');
        if (now - b.last < p.debounce) { io.line('return'); await io.delay(60); continue; }
        b.last = now;
        io.line('led.toggle()'); b.level ^= 1; b.on(b.level); io.pin('GP15', String(b.level), !!b.level);
        io.line('presses += 1'); b.presses++;
        await io.delay(60);
      }
      io.pin('GP14', b.btn.pressed ? '0' : '1', b.btn.pressed);
      io.line('if presses != shown');
      if (b.presses !== b.shown) {
        b.shown = b.presses;
        io.line('print("press"'); io.print(`press ${b.shown} LED ${b.level}`);
      }
      io.line('sleep_ms(20)'); await io.delay(20);
    },
    reset(b) { b.on(0); b.level = 0; b.state.edges.length = 0; },
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'pico-pwm', title: 'Fade with PWM', icon: 'pwm',
    thumb: () => { const l = makeLED('blue', v(0.13, 0, 0), v(-0.13, 0, 0)); l.set(0.7); return l.group; },
    view: { center: [4.0, 0.6, 0.4], size: 14.5 },
    build(ctx) {
      const bb = ctx.breadboard(...BBP);
      const c = picoLed(ctx, bb, { pin: 'GP15', col: 8, color: 'blue', gnd: 'GND_4', ohms: 220 });
      const pwm = { duty: 0, freq: 1000, t: 0 };
      // what your eye sees: smooth above ~60 Hz, visible flicker below
      ctx.onTick((dt) => {
        pwm.t += dt;
        if (pwm.freq >= 60) return;
        const high = (pwm.t * pwm.freq) % 1 < pwm.duty;
        c.led.set(high ? c.state.gain : 0);
      });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'duty %', color: '#2aa7a1', min: 0, max: 100 }] });
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('sig', c.sig.mid);
      ctx.anchor('res', c.res.anchor);
      return { ...c, pwm, plot };
    },
    callouts: [
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pwm', title: 'GP15 · PWM', text: 'Switches on and off 1000 times a second; the on-time sets the brightness.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'Breathing LED', text: 'Fades in and out as duty_u16() sweeps 0 → 65535.' },
      { anchor: 'chip', x: 0.04, y: 0.17, icon: 'chip', title: 'PWM slices', text: '8 hardware slices × 2 channels — every GPIO can do PWM.' },
      { anchor: 'res', x: 0.04, y: 0.68, icon: 'resistor', title: '220 Ω', text: 'Limits the current at full duty to about 6 mA.' },
    ],
    overview: {
      heading: 'Fade with PWM',
      text: 'A pin can only be 0 V or 3.3 V, but switched fast enough your eye averages the pulses. <code>duty_u16()</code> sets the fraction of each cycle spent on, from 0 (off) to 65535 (fully on). Sweep it up and down and the LED breathes.',
      features: [['pwm', '<code>PWM(Pin(15))</code> with <code>freq()</code> and <code>duty_u16()</code>'], ['wave', 'The plotter shows the duty cycle'], ['timer', 'Set the frequency below 60 Hz to see the flicker']],
    },
    pinout: [['GP15 (pin 20)', '220 Ω → LED (+)', 'PWM slice 7, channel B'], ['GND (pin 23)', 'LED (–)', '']],
    example: {
      text: 'Dimmable lamps, the “breathing” sleep light on a laptop, motor speed controllers and servo signals are all PWM. Phone screens use it to dim their backlights.',
      points: ['Our eyes are non-linear: try <code>duty = (i * i) // 65535</code> for a smoother-looking fade', 'Drop <code>freq</code> to 20 and watch it flicker', 'A bigger step makes the breath faster'],
    },
    specs: [['Duty range', '0–65535 (duty_u16)'], ['Frequency', '≈ 8 Hz – 62.5 MHz'], ['Resolution', 'up to 16 bits'], ['PWM channels', '16 (8 slices × A/B)'], ['Full-duty current', '(3.3 − 3.0) V / 220 Ω ≈ 1.5 mA blue, ≈ 6 mA red']],
    quiz: [
      { q: 'What does duty_u16(32768) do?', options: ['Turns the LED off', 'Keeps the pin on for about half of each cycle', 'Sets the frequency to 32 kHz', 'Sets the pin to 1.65 V exactly'], answer: 1, explain: '32768 / 65535 ≈ 50% duty: on half the time, off half the time.' },
      { q: 'Why don’t you see the LED flicker at 1000 Hz?', options: ['It does not switch at all', 'Your eye averages pulses faster than about 60 Hz', 'The resistor smooths it', 'MicroPython is slow'], answer: 1, explain: 'Persistence of vision blends fast pulses into a steady brightness.' },
      { q: 'Which pins can do PWM on the Pico?', options: ['Only GP25', 'Only GP26–28', 'Any GPIO', 'None — you need a library'], answer: 2, explain: 'Every GPIO maps to one of 16 PWM channels (two pins can share a channel).' },
      { q: 'What does range(65535, -1, -step) produce?', options: ['Numbers counting down from 65535 to 0', 'Numbers counting up', 'An error', 'Only even numbers'], answer: 0, explain: 'A negative step counts down; the stop value −1 makes it include 0.' },
    ],
    challenges: ['Make the fade-in fast and the fade-out slow.', 'Apply gamma correction (square the duty) and compare the look.', 'Fade an RGB LED through the rainbow with three PWM pins.'],
    code: `from machine import Pin, PWM
import utime

led = PWM(Pin(15))
led.freq({{freq}})            # pulses per second

while True:
    for duty in range(0, 65536, {{step}}):      # fade in
        led.duty_u16(duty)
        print(duty * 100 // 65535)              # for the plotter
        utime.sleep_ms(10)
    for duty in range(65535, -1, -{{step}}):    # fade out
        led.duty_u16(duty)
        print(duty * 100 // 65535)
        utime.sleep_ms(10)`,
    params: { freq: { value: 1000, min: 8, max: 100000 }, step: { value: 1024, min: 64, max: 16384 } },
    async setup(io, b, p) {
      io.line('PWM(Pin(15))'); await io.delay(100);
      io.line('led.freq'); b.pwm.freq = p.freq; await io.delay(100);
    },
    async loop(io, b, p) {
      b.pwm.freq = p.freq;
      const set = (duty, k) => {
        io.line('led.duty_u16', k);
        b.pwm.duty = duty / 65535;
        if (p.freq >= 60) b.led.set(b.pwm.duty * b.state.gain);
        b.state.level = b.pwm.duty;
        io.pin('GP15', `${Math.round(b.pwm.duty * 100)}%`, duty > 0);
        const pct = Math.floor((duty * 100) / 65535);
        b.plot.push(pct);
        io.line('print(duty', k);
        io.print(String(pct));
      };
      for (let d = 0; d < 65536; d += p.step) { set(d, 1); io.line('sleep_ms(10)', 1); await io.delay(10); }
      for (let d = 65535; d >= 0; d -= p.step) { set(d, 2); io.line('sleep_ms(10)', 2); await io.delay(10); }
    },
    reset(b) { b.pwm.duty = 0; b.state.level = 0; b.led.set(0); b.plot.reset(); },
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'pico-adc', title: 'Read analog', icon: 'knob',
    thumb: () => makePot([v(-0.5, 0, 0), v(0, 0, 0), v(0.5, 0, 0)]).group,
    view: { center: [4.0, 0.6, 0.4], size: 14.5 },
    build(ctx) {
      const bb = ctx.breadboard(...BBP);
      const pot = ctx.add(makePot([bb.hole(12, 'c'), bb.hole(14, 'c'), bb.hole(16, 'c')]));
      const w33 = ctx.wire(ctx.board.pin('3V3'), bb.hole(12, 'a'), 'red', { signal: '3V3', lift: 1.8, chipT: 0.45 });
      const wA = ctx.wire(ctx.board.pin('GP26'), bb.hole(14, 'a'), 'green', { signal: 'GP26', lift: 1.4, chipT: 0.62 });
      const wG = ctx.wire(ctx.board.pin('GND_7'), bb.hole(16, 'a'), 'black', { signal: 'GND', dir: -1, lift: 1.0, chipT: 0.8 });
      const state = { knob: 0.4, chipC: 24 };
      pot.set(state.knob);
      ctx.interact(pot, {
        name: 'Potentiometer', hint: 'Click to turn the knob',
        controls: [{ type: 'range', label: 'Position', min: 0, max: 100, step: 1, get: () => Math.round(state.knob * 100), set: (x) => { state.knob = x / 100; pot.set(state.knob); }, format: (x) => `${x}%` }],
        note: () => `Wiper ≈ ${(state.knob * 3.3).toFixed(2)} V`,
      });
      ctx.interact(ctx.board, {
        name: 'RP2040 temperature', hint: 'Warm the chip with your finger',
        controls: [{ type: 'range', label: 'Chip temperature', min: 5, max: 70, step: 1, get: () => state.chipC, set: (x) => (state.chipC = x), format: (x) => `${x} °C` }],
      });
      const plot = ctx.plotter({ title: 'Serial plotter', series: [{ name: 'pot V', color: '#2aa7a1', min: 0, max: 3.3 }, { name: 'chip °C', color: '#ef8a2b', min: 0, max: 70 }] });
      ctx.anchor('pot', pot.anchor);
      ctx.anchor('a0', wA.mid);
      ctx.anchor('v33', w33.mid);
      ctx.anchor('agnd', wG.mid);
      return { pot, state, plot };
    },
    callouts: [
      { anchor: 'v33', x: 0.04, y: 0.17, icon: 'plug', title: '3V3 (pin 36)', text: 'Top of the divider — the ADC measures 0–3.3 V.' },
      { anchor: 'a0', x: 0.36, y: 0.12, icon: 'wave', title: 'GP26 = ADC0', text: 'The wiper voltage, read as 0–65535.' },
      { anchor: 'pot', x: 0.7, y: 0.17, icon: 'knob', title: 'Potentiometer', text: 'Click it, then drag the slider to turn.' },
      { anchor: 'chip', x: 0.04, y: 0.68, icon: 'thermo', title: 'ADC 4: temperature', text: 'A sensor inside the RP2040. Click the board to warm it.' },
      { anchor: 'agnd', x: 0.36, y: 0.74, icon: 'gnd', title: 'AGND (pin 33)', text: 'The quiet analog ground for the ADC.' },
    ],
    overview: {
      heading: 'Read analog',
      text: 'GP26–GP28 connect to a 12-bit ADC. <code>read_u16()</code> scales every reading to 0–65535, whatever the hardware resolution, so volts = reading × 3.3 / 65535. Channel 4 is a temperature sensor built into the chip.',
      features: [['knob', '<code>ADC(26).read_u16()</code> on the potentiometer'], ['thermo', 'Bonus: <code>ADC(4)</code> reads the chip temperature'], ['wave', 'Both values stream to the plotter']],
    },
    pinout: [['3V3 (pin 36)', 'Pot outer leg', 'Never 5 V into an ADC pin'], ['GP26 / ADC0 (pin 31)', 'Pot wiper (middle)', '0–3.3 V'], ['AGND (pin 33)', 'Pot other outer leg', 'Analog ground'], ['ADC 4', 'On-chip sensor', 'No wiring']],
    example: {
      text: 'Every knob, slider, light sensor, battery monitor and joystick is read this way. The temperature sensor is handy for spotting a chip that runs hot, although it reads the die rather than the room.',
      points: ['Average 16 readings to tame the noise', 'Use the pot to set an LED’s PWM duty (lesson 3)', 'Convert to °F: <code>t * 9 / 5 + 32</code>'],
    },
    specs: [['ADC', '12-bit SAR, 500 ksps'], ['Inputs', 'GP26, GP27, GP28 + internal temp (ch 4)'], ['read_u16()', '0–65535 (12-bit value scaled up)'], ['Step size', '3.3 V / 4096 ≈ 0.8 mV'], ['Temp formula', '27 − (V − 0.706) / 0.001721'], ['Pot', '10 kΩ linear']],
    quiz: [
      { q: 'read_u16() returns 32768. Roughly what is the voltage?', options: ['0.5 V', '1.65 V', '3.3 V', '32.8 V'], answer: 1, explain: '32768 / 65535 × 3.3 V ≈ 1.65 V — the knob is in the middle.' },
      { q: 'Which pins can read analog voltages on the Pico?', options: ['All of them', 'GP26, GP27 and GP28', 'Only GP25', 'GP0 and GP1'], answer: 1, explain: 'They are ADC0–2. Channel 3 measures VSYS/3 and channel 4 is the temperature sensor.' },
      { q: 'Why is the pot powered from 3V3 and not VBUS (5 V)?', options: ['5 V would exceed the ADC’s 3.3 V limit and could damage the pin', 'It would be too dim', 'VBUS is an input only', 'No reason'], answer: 0, explain: 'Pico pins are not 5 V tolerant — keep analog inputs between 0 and 3.3 V.' },
      { q: 'What does ADC(4) measure?', options: ['GP4', 'The RP2040’s internal temperature sensor', 'The USB voltage', 'Light'], answer: 1, explain: 'Channel 4 is wired to a sensor on the chip itself.' },
    ],
    challenges: ['Print the knob position as a percentage.', 'Average 16 readings before converting and compare the noise on the plotter.', 'Light the LED from lesson 1 when the chip is warmer than 30 °C.'],
    code: `from machine import ADC
import utime

pot = ADC(26)               # GP26 = ADC0
temp = ADC(4)               # on-chip temperature sensor
CONV = 3.3 / 65535

while True:
    raw = pot.read_u16()                    # 0 - 65535
    volts = raw * CONV
    t = 27 - (temp.read_u16() * CONV - 0.706) / 0.001721
    print(raw, "{:.2f} V".format(volts), "chip {:.1f} C".format(t))
    utime.sleep_ms({{rate}})`,
    params: { rate: { value: 250, min: 20, max: 3000 } },
    async setup(io) { io.line('pot = ADC'); await io.delay(100); io.line('temp = ADC'); await io.delay(100); },
    async loop(io, b, p) {
      io.line('raw = pot.read_u16');
      const raw = u16(b.state.knob);
      io.pin('GP26', String(raw), true);
      io.line('volts = raw'); const volts = raw * (3.3 / 65535);
      io.line('t = 27');
      const vT = 0.706 - (b.state.chipC - 27) * 0.001721;
      const tr = u16(vT / 3.3, 1.5);
      const t = 27 - (tr * (3.3 / 65535) - 0.706) / 0.001721;
      io.line('print(raw'); io.print(`${raw} ${volts.toFixed(2)} V chip ${t.toFixed(1)} C`);
      b.plot.push(volts, t);
      io.line('sleep_ms'); await io.delay(p.rate);
    },
    reset(b) { b.plot.reset(); },
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'pico-neopixel', title: 'NeoPixels', icon: 'palette',
    thumb: () => {
      const r = makeNeoPixelRing(v(0, 0, 0));
      for (let i = 0; i < r.count; i++) r.setPixel(i, ...wheel((i * 256) / r.count));
      r.show();
      return r.group;
    },
    view: { center: [-0.6, 0.6, 2.4], size: 10.5 },
    build(ctx) {
      const ring = ctx.add(makeNeoPixelRing(v(-1.9, 0, 5.0)));
      const din = ctx.wire(ctx.board.pin('GP0'), ring.pin('DIN'), 'green', { signal: 'GP0', lift: 1.6 });
      const vb = ctx.wire(ctx.board.pin('VBUS'), ring.pin('5V'), 'red', { signal: 'VBUS', lift: 2.0 });
      const gw = ctx.wire(ctx.board.pin('GND'), ring.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.2 });
      const state = { light: 1 };
      ctx.interact(ring, {
        name: '12-LED NeoPixel ring', hint: 'Dim the room to see the colours glow',
        controls: [{ type: 'range', label: 'Room light', min: 0, max: 100, step: 1, get: () => Math.round(state.light * 100), set: (x) => { state.light = x / 100; ctx.setDarkness(1 - state.light); }, format: (x) => `${x}%` }],
        note: () => {
          let sum = 0;
          for (let i = 0; i < ring.count; i++) sum += ring.getPixel(i).reduce((a, c) => a + c, 0);
          return `Ring current ≈ ${Math.round(ring.count + (sum / 255) * 20)} mA from VBUS`;
        },
      });
      ctx.anchor('ring', ring.anchor);
      ctx.anchor('din', din.mid);
      ctx.anchor('vbus', vb.mid);
      ctx.anchor('gnd', gw.mid);
      return { ring, state };
    },
    callouts: [
      { anchor: 'vbus', x: 0.04, y: 0.17, icon: 'plug', title: 'VBUS · 5 V', text: 'Straight from USB — the LEDs want 5 V and up to 60 mA each.' },
      { anchor: 'din', x: 0.36, y: 0.12, icon: 'pins', title: 'GP0 → DIN', text: 'One data wire carries every pixel’s colour, one after another.' },
      { anchor: 'ring', x: 0.7, y: 0.17, icon: 'palette', title: '12 × WS2812B', text: 'Each LED has its own tiny controller chip.' },
      { anchor: 'gnd', x: 0.04, y: 0.68, icon: 'gnd', title: 'Common GND', text: 'Data only makes sense when both share a ground.' },
      { anchor: 'chip', x: 0.36, y: 0.74, icon: 'chip', title: 'PIO timing', text: 'The <code>neopixel</code> module uses the RP2040’s PIO for exact 800 kHz bits.' },
    ],
    overview: {
      heading: 'NeoPixels in MicroPython',
      text: 'WS2812B “NeoPixels” chain together: one data pin sets each LED to any of 16 million colours. The built-in <code>neopixel</code> module treats the ring like a Python list of (r, g, b) tuples — set them, then <code>write()</code> to send.',
      features: [['palette', '<code>neopixel.NeoPixel(Pin(0), 12)</code>'], ['code', 'A <code>wheel()</code> function maps 0–255 to a rainbow'], ['bolt', 'Powered from VBUS, with a brightness cap']],
    },
    pinout: [['VBUS (pin 40)', 'Ring 5V', 'USB 5 V, keep total < 500 mA'], ['GND (pin 3)', 'Ring GND', 'Common ground'], ['GP0 (pin 1)', 'Ring DIN', '3.3 V data usually works; a 74AHCT125 makes it bullet-proof']],
    example: {
      text: 'LED strips behind TVs, festival costumes, smart lamps and keyboard backlights are chains of addressable LEDs. A 300-LED strip uses exactly the same code with a bigger N.',
      points: ['Lower <code>BRIGHT</code> to save power — full white is 60 mA per LED', 'A bigger <code>offset</code> step spins the rainbow faster', 'Pixels are GRB inside; the module reorders for you'],
    },
    specs: [['LEDs', '12 × WS2812B (5050)'], ['Data rate', '800 kHz, 24 bits per pixel'], ['Supply', '5 V (3.5–5.3 V)'], ['Max current', '≈ 60 mA per LED at full white'], ['Library', 'neopixel (built into MicroPython)'], ['Ring diameter', '≈ 37 mm']],
    quiz: [
      { q: 'What does ring.write() do?', options: ['Clears the ring', 'Sends the colour buffer out on the data pin', 'Saves to flash', 'Reads the colours back'], answer: 1, explain: 'Setting ring[i] only changes a buffer in RAM; write() pushes it to the LEDs.' },
      { q: 'Why power the ring from VBUS rather than 3V3?', options: ['The LEDs need about 5 V and more current than the 3.3 V regulator likes to give', 'VBUS is quieter', 'DIN needs 5 V', 'No reason'], answer: 0, explain: 'WS2812B LEDs are 5 V parts and 12 of them can draw 700 mA at full white.' },
      { q: 'What colour is (0, 0, 255)?', options: ['Red', 'Green', 'Blue', 'White'], answer: 2, explain: 'The tuple is (red, green, blue).' },
      { q: 'How many data pins does a 100-LED strip need?', options: ['100', '3', '1', '24'], answer: 2, explain: 'Each pixel takes its 24 bits and passes the rest down the chain.' },
    ],
    challenges: ['Make a single red “comet” chase round the ring.', 'Turn the ring into a clock: one pixel for the hour, one for the minute.', 'Add the potentiometer from lesson 4 to set the brightness live.'],
    code: `from machine import Pin
import neopixel, utime

N = 12
ring = neopixel.NeoPixel(Pin(0), N)
BRIGHT = {{bright}}            # 0-255: caps the current draw

def wheel(pos):                # 0-255 -> a colour of the rainbow
    if pos < 85:
        return (255 - pos * 3, pos * 3, 0)
    if pos < 170:
        pos -= 85
        return (0, 255 - pos * 3, pos * 3)
    pos -= 170
    return (pos * 3, 0, 255 - pos * 3)

offset = 0
while True:
    for i in range(N):
        r, g, b = wheel((i * 256 // N + offset) & 255)
        ring[i] = (r * BRIGHT // 255, g * BRIGHT // 255, b * BRIGHT // 255)
    ring.write()
    offset = (offset + {{speed}}) & 255
    if offset < {{speed}}:
        print("one lap of the rainbow")
    utime.sleep_ms(20)`,
    params: { bright: { value: 96, min: 0, max: 255 }, speed: { value: 3, min: 1, max: 64 } },
    async setup(io, b) {
      b.offset = 0;
      io.line('ring = neopixel'); io.pin('VBUS', '5 V', true); await io.delay(120);
    },
    async loop(io, b, p) {
      io.line('for i in range(N)');
      const N = b.ring.count;
      for (let i = 0; i < N; i++) {
        const [r, g, bl] = wheel((Math.floor((i * 256) / N) + b.offset) & 255);
        b.ring.setPixel(i, Math.floor((r * p.bright) / 255), Math.floor((g * p.bright) / 255), Math.floor((bl * p.bright) / 255));
      }
      io.line('ring.write()'); b.ring.show(); io.pin('GP0', 'data', true);
      io.line('offset = (offset'); b.offset = (b.offset + p.speed) & 255;
      if (b.offset < p.speed) { io.line('print("one lap'); io.print('one lap of the rainbow'); }
      io.line('sleep_ms(20)'); await io.delay(20);
    },
    reset(b) { b.ring.clear().show(); },
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'pico-oled', title: 'I²C OLED', icon: 'serial',
    thumb: () => { const o = makeOLED(v(0, 0, 0)); o.text(['Pico + OLED', '', 'Pot:  62%'], { y: 4 }); o.bar(0, 44, 128, 14, 0.62); return o.group; },
    view: { center: [4.2, 0.6, 2.2], size: 14 },
    build(ctx) {
      const bb = ctx.breadboard(...BBP);
      const oled = ctx.add(makeOLED(v(4.4, 0, 5.6)));
      const sda = ctx.wire(ctx.board.pin('GP0'), oled.pin('SDA'), 'blue', { signal: 'GP0', lift: 2.0 });
      const scl = ctx.wire(ctx.board.pin('GP1'), oled.pin('SCL'), 'yellow', { signal: 'GP1', lift: 1.7 });
      ctx.wire(ctx.board.pin('3V3'), bb.hole(2, 'bot+'), 'red', { signal: '3V3', lift: 2.2 });
      ctx.wire(ctx.board.pin('GND_4'), bb.hole(3, 'bot-'), 'black', { signal: 'GND', dir: -1, lift: 1.4 });
      const vcc = ctx.wire(bb.hole(1, 'bot+'), oled.pin('VCC'), 'red', { signal: '3V3', lift: 1.4 });
      ctx.wire(bb.hole(4, 'bot-'), oled.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.1 });
      // potentiometer on the breadboard; 3V3 and GND go to the front rails
      const pot = ctx.add(makePot([bb.hole(13, 'h'), bb.hole(15, 'h'), bb.hole(17, 'h')]));
      ctx.wire(bb.hole(13, 'j'), bb.hole(13, 'bot+'), 'red', { lift: 0.5 });
      ctx.wire(bb.hole(17, 'j'), bb.hole(17, 'bot-'), 'black', { lift: 0.4 });
      const wA = ctx.wire(ctx.board.pin('GP26'), bb.hole(15, 'f'), 'green', { signal: 'GP26', lift: 1.8 });
      const state = { knob: 0.62 };
      pot.set(state.knob);
      ctx.interact(pot, {
        name: 'Potentiometer', hint: 'Click to turn the knob',
        controls: [{ type: 'range', label: 'Position', min: 0, max: 100, step: 1, get: () => Math.round(state.knob * 100), set: (x) => { state.knob = x / 100; pot.set(state.knob); }, format: (x) => `${x}%` }],
      });
      ctx.interact(oled, { name: '0.96" OLED (SSD1306)', hint: '128 × 64 pixels at I²C address 0x3C' });
      ctx.anchor('oled', oled.anchor);
      ctx.anchor('sda', sda.mid);
      ctx.anchor('scl', scl.mid);
      ctx.anchor('vcc', vcc.mid);
      ctx.anchor('pot', pot.anchor);
      ctx.anchor('a0', wA.mid);
      return { oled, pot, state };
    },
    callouts: [
      { anchor: 'vcc', x: 0.04, y: 0.17, icon: 'plug', title: '3V3 and GND', text: 'The OLED runs happily on the Pico’s 3.3 V.' },
      { anchor: 'sda', x: 0.36, y: 0.12, icon: 'serial', title: 'GP0 SDA · GP1 SCL', text: 'I²C bus 0: data and clock, shared by every I²C device.' },
      { anchor: 'pot', x: 0.7, y: 0.17, icon: 'knob', title: 'Pot on GP26', text: 'Click it — the bar on the screen follows.' },
      { anchor: 'oled', x: 0.04, y: 0.68, icon: 'info', title: 'SSD1306 OLED', text: 'Draw into a frame buffer, then <code>show()</code> sends it.' },
      { anchor: 'a0', x: 0.36, y: 0.74, icon: 'wave', title: 'ADC0', text: 'Same <code>read_u16()</code> as the last lesson.' },
    ],
    overview: {
      heading: 'I²C OLED in MicroPython',
      text: 'The SSD1306 OLED talks I²C: two wires for any number of devices. The <code>ssd1306</code> driver gives you a frame buffer with <code>text()</code>, <code>rect()</code> and <code>fill_rect()</code>. Here it shows the potentiometer from lesson 4 as a number and a live bar.',
      features: [['serial', '<code>I2C(0, sda=Pin(0), scl=Pin(1))</code> + <code>scan()</code>'], ['code', '<code>ssd1306.SSD1306_I2C(128, 64, i2c)</code>'], ['knob', 'A live bar graph of the pot']],
    },
    pinout: [['GP0 (pin 1)', 'OLED SDA', 'I2C0 data'], ['GP1 (pin 2)', 'OLED SCL', 'I2C0 clock'], ['3V3 (pin 36)', 'Front + rail → OLED VCC, pot', 'The only 3.3 V output'], ['GND (pin 38)', 'Front – rail → OLED GND, pot', ''], ['GP26 (pin 31)', 'Pot wiper', 'Pot ends on the 3V3 / GND rails']],
    example: {
      text: 'Small OLEDs show status on 3D printers, smart watches, e-bike displays and handheld test gear. I²C means you can add a temperature sensor or a clock on the same two wires.',
      points: ['Copy <code>ssd1306.py</code> to the Pico first (from micropython-lib, or install it with Thonny’s package manager)', '<code>i2c.scan()</code> should print <code>[\'0x3c\']</code> — if it’s empty, check the wiring', 'Each <code>text()</code> character is 8 × 8 pixels'],
    },
    specs: [['Display', '0.96", 128 × 64 monochrome OLED'], ['Controller', 'SSD1306, I²C address 0x3C'], ['Bus speed', '400 kHz (fast mode)'], ['Supply', '3.3–5 V, ≈ 20 mA'], ['Library', 'ssd1306.py (micropython-lib)'], ['Text', '16 characters × 8 lines']],
    quiz: [
      { q: 'How many signal wires does I²C use?', options: ['One', 'Two: SDA (data) and SCL (clock)', 'Four', 'Eight'], answer: 1, explain: 'Every I²C device shares the same SDA and SCL lines and has its own address.' },
      { q: 'Why does nothing appear until oled.show() is called?', options: ['The screen is asleep', 'Drawing only changes a frame buffer in the Pico’s RAM', 'I²C is slow', 'text() is broken'], answer: 1, explain: 'show() sends the whole 1 KB buffer to the display in one go.' },
      { q: 'What does i2c.scan() return?', options: ['The screen contents', 'A list of addresses of devices that answered', 'The bus speed', 'The pot reading'], answer: 1, explain: 'A quick way to check wiring: the SSD1306 answers at 0x3C (60).' },
      { q: 'How wide is the bar at 50% if it is pct * 124 // 100 pixels?', options: ['50 px', '62 px', '64 px', '124 px'], answer: 1, explain: '50 × 124 // 100 = 62 pixels.' },
    ],
    challenges: ['Show the chip temperature from lesson 4 on a second line.', 'Draw a needle gauge with <code>oled.line()</code> instead of a bar.', 'Plot the pot over time: scroll the screen with <code>oled.scroll(-1, 0)</code> and add one pixel per reading.'],
    code: `from machine import Pin, I2C, ADC
import ssd1306, utime

i2c = I2C(0, sda=Pin(0), scl=Pin(1), freq=400000)
print("I2C devices:", [hex(a) for a in i2c.scan()])
oled = ssd1306.SSD1306_I2C(128, 64, i2c)
pot = ADC(26)

while True:
    raw = pot.read_u16()
    pct = raw * 100 // 65535
    oled.fill(0)
    oled.text("Pico + OLED", 0, 0)
    oled.text("Pot: {:3d}%".format(pct), 0, 16)
    oled.text("{:.2f} V".format(raw * 3.3 / 65535), 0, 28)
    oled.rect(0, 44, 128, 14, 1)                   # outline
    oled.fill_rect(2, 46, pct * 124 // 100, 10, 1) # the bar
    oled.show()
    utime.sleep_ms({{rate}})`,
    params: { rate: { value: 100, min: 20, max: 2000 } },
    async setup(io) {
      io.line('i2c = I2C'); io.pin('GP1', 'SCL', true); await io.delay(120);
      io.line('print("I2C devices'); io.print("I2C devices: ['0x3c']"); await io.delay(120);
      io.line('oled = ssd1306'); await io.delay(120);
      io.line('pot = ADC'); await io.delay(80);
    },
    async loop(io, b, p) {
      io.line('raw = pot.read_u16');
      const raw = u16(b.state.knob);
      io.pin('GP26', String(raw), true);
      io.line('pct = raw'); const pct = Math.floor((raw * 100) / 65535);
      io.line('oled.fill(0)');
      io.line('oled.text("Pico');
      io.line('oled.text("Pot');
      io.line('oled.rect');
      io.line('oled.fill_rect');
      io.line('oled.show()');
      const o = b.oled;
      o.text(['Pico + OLED'], { y: 0 });
      o.text([`Pot: ${String(pct).padStart(3)}%`], { y: 16, clear: false });
      o.text([`${(raw * 3.3 / 65535).toFixed(2)} V`], { y: 28, clear: false });
      o.bar(0, 44, 128, 14, Math.floor((pct * 124) / 100) / 124);
      io.pin('GP0', 'SDA', true);
      io.line('sleep_ms'); await io.delay(p.rate);
    },
    reset(b) { b.oled.clear(); },
  },
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['chip', 'Pico-style RP2040 board', 'Dual-core 3.3 V microcontroller programmed in MicroPython.', 'pico-blink'],
  ['bolt', 'Pin interrupt (IRQ)', 'Calls a Python function the instant a pin changes.', 'pico-button-irq'],
  ['pwm', 'PWM slice', 'Hardware that pulses a pin; duty_u16() sets the on-time.', 'pico-pwm'],
  ['wave', 'RP2040 ADC', '12-bit analog input on GP26–28, plus an on-chip temperature sensor.', 'pico-adc'],
  ['palette', 'NeoPixel ring', '12 chained WS2812B RGB LEDs on one data wire.', 'pico-neopixel'],
  ['serial', 'SSD1306 OLED', '128 × 64 I²C display driven by ssd1306.py.', 'pico-oled'],
];
