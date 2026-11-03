# Tinker Lab Arduino Runtime: contract

`src/runtime/` runs real Arduino sketches (Arduino C++) in the browser: it parses
the source, reports compile errors with line numbers, and interprets the program
against a virtual board through a hardware abstraction layer (HAL). It is used by
lessons ("Run my code"), by Tinker Studio, and by the test suite. It is an
interpreter for the Arduino language, not an AVR emulator; it must say so in
its own docs and never claim cycle accuracy.

## Entry points (`src/runtime/index.js`)

```js
import { compile, SUPPORTED_LIBRARIES } from '../runtime/index.js';

const result = compile(source, { board: 'uno' });   // board: uno | mega | nano | nodemcu | esp32 | unor4
// result.ok: boolean
// result.diagnostics: [{ severity: 'error' | 'warning', line, col, message, hint? }]
//   messages read like the Arduino IDE / avr-gcc ("'ledPin' was not declared in this scope",
//   "expected ';' before '}' token"), plus a friendly hint for beginners.
// result.program: Program | null

const vm = result.program.instantiate(hal, { speed: 1 });
```

### `vm` (one running sketch)
| Member | Does |
| --- | --- |
| `vm.start()` | runs `setup()` once, then `loop()` forever (real time × `speed`) |
| `vm.stop()` | stops; resets nothing on the HAL (the caller resets parts) |
| `vm.pause()` / `vm.resume()` | pause at the next statement |
| `vm.step()` / `vm.stepOver()` / `vm.stepOut()` | debugger stepping while paused |
| `vm.setBreakpoints([line, ...])` | lines are 1-based source lines |
| `vm.state` | `'idle' \| 'running' \| 'paused' \| 'stopped' \| 'error'` |
| `vm.line` | current 1-based line |
| `vm.millis()` | simulated time in ms since start |
| `vm.callStack()` | `[{ fn, line }]`, innermost last |
| `vm.scopes()` | `[{ name: 'Locals' \| 'Globals', vars: [{ name, type, value }] }]` (arrays and structs expand) |
| `vm.serialInput(text)` | feeds bytes to `Serial.read()` / `readString*` |
| `vm.on(event, fn)` | events: `line(line)`, `pause({ line, reason: 'breakpoint' \| 'step' \| 'user' })`, `serial(text)`, `error({ line, message })` (runtime errors such as divide by zero, array index out of range, stack overflow), `state(state)` |
| `vm.speed` | settable time multiplier |

`delay()`, `delayMicroseconds()`, `millis()`, `micros()` use simulated time; a
loop without delays must still yield regularly so the page never freezes
(statement budget per animation frame). `while (!Serial)` returns at once.

## The HAL (what the caller provides)

```js
const hal = {
  pinMode(pin, mode) {},                 // mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP'
  digitalWrite(pin, value) {},           // 0 | 1
  digitalRead(pin) { return 0 },         // 0 | 1
  analogWrite(pin, value) {},            // 0–255 (PWM pins only; others warn once)
  analogRead(pin) { return 0 },          // 0–1023 (pin is the analog number 0–5 for A0–A5, or the raw pin)
  tone(pin, freq, durationMs) {}, noTone(pin) {},
  pulseIn(pin, level, timeoutUs) { return 0 },   // µs, e.g. ultrasonic echo
  serialWrite(text) {},                  // everything Serial.print* writes
  devices: {},                           // optional virtual peripherals, see Libraries
  now() { return performance.now() },    // optional real clock
};
```
Pins are numbers; `A0`–`A5` are 14–19 on the Uno (54–69 on the Mega), and
`LED_BUILTIN` is 13. The runtime does all Arduino semantics (constants, `map`,
`constrain`, `bitRead`, `String`, `random`) itself; the HAL only touches pins.

## Language coverage (target)
Preprocessor (`#define` constants and simple macros, `#include` of supported libraries,
`#if 0`), all integer and floating types with correct widths and overflow (`byte`,
`int` is 16-bit on AVR and 32-bit on ESP32, `long`, `unsigned`, `uint8_t`…),
`bool`, `char`, string literals, arrays (multi-dimensional), `const`, `static`,
`volatile`, enums, structs, functions (overloads by arity, default args, recursion),
pointers and references to variables and arrays (enough for common sketches),
all operators including bitwise/compound/ternary/`++`/`--`, `if/else`, `switch`,
`for`, `while`, `do`, `break`, `continue`, `return`, the `String` class, `F()`,
`PROGMEM` (ignored), lambdas optional. Classes beyond library objects are optional.

## Libraries (emulated; each maps onto `hal.devices` or pins)
Serial (print/println with formats, read, available, parseInt, readStringUntil),
Servo, Wire (I²C master; devices registered by address), LiquidCrystal_I2C,
Adafruit_SSD1306 + Adafruit_GFX (draw calls go to a 128×64 buffer the caller can
render), Adafruit_NeoPixel, DHT, Stepper, EEPROM, Keypad, IRremote (v4 API),
Tone. `SUPPORTED_LIBRARIES` lists them; including anything else is a compile
error that says the library is not available in the simulator yet.

`hal.devices` entries a caller may provide:
`servo(pin) → { write(deg) }`, `lcd(addr) → { print(row, col, text), clear(), backlight(on), createChar(i, bytes) }`,
`oled(addr) → { show(buffer128x64) }`, `neopixel(pin, n) → { show(rgbArray) }`,
`dht(pin) → { temperature(), humidity() }`, `stepper(pins) → { step(dir) }`,
`keypad() → { getKey() }`, `ir(pin) → { next() }`, `eeprom → Uint8Array(1024)`,
`i2c(addr) → { read(reg, n), write(bytes) }`.

## Lesson binding: `lesson.hw`
A lesson that sets `hw(built, io)` can run the learner's own code ("Run my code")
instead of its scripted simulation. `hw` returns a HAL for that circuit, e.g.

```js
hw: (b) => ({
  digitalWrite: (pin, v) => { if (pin === 13) b.led.set(v ? b.state.gain : 0); },
  digitalRead: (pin) => (pin === 2 ? (b.btn.pressed ? 0 : 1) : 0),
  analogRead: (pin) => (pin === 0 ? Math.round(b.state.knob * 1023) : 0),
}),
```
Missing HAL functions default to no-ops / 0. The lesson app supplies
`serialWrite`, `tone` and the signal chips itself.

## Tests
`tests/runtime.test.js` (node --test) must compile every C++ lesson sketch in the
course (with `{{param}}` tokens replaced by their default values) with zero
errors, run each for a few simulated seconds against a recording HAL without
runtime errors, and check known outputs (Blink toggles pin 13 every 1000 ms,
the knob sketch prints `A0 = …`, etc.).
