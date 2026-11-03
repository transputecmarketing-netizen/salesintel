# Tinker Lab Arduino runtime

Runs learners' Arduino sketches in the browser. It is an **interpreter for the Arduino
language** (the C++ used in sketches), not an AVR, Xtensa or ARM emulator: it does not run
machine code, and its timing is a teaching model, not cycle accurate.

What it does model faithfully:

- the real type widths of each board (`int` is 16-bit and `double` is 32-bit on AVR;
  32-bit / 64-bit on ESP32), integer overflow and wrap-around, integer division, char
  arithmetic, the usual arithmetic conversions, and `Print` formatting (`Serial.print(x, HEX)`,
  2 decimals for floats, `"ovf"`, AVR `printf` without `%f`);
- g++-style compile errors and warnings (missing `;`, undeclared names, wrong argument
  counts, `-Woverflow` on constants, `if (x = 5)`, unknown libraries) with beginner hints;
- a simulated clock: `delay()`, `millis()`, `micros()`, Serial baud rate and TX buffer,
  `analogRead()` (~112 µs on AVR), I²C transfers, EEPROM writes (3.3 ms) and every statement
  (~1 µs) take simulated time, so busy loops still let `millis()` advance;
- interrupts (`attachInterrupt` on the board's real interrupt pins, edge and level modes),
  `noInterrupts()`, AVR power-down sleep (Timer 0 stops, so `millis()` freezes), ESP32 deep
  sleep and `RTC_DATA_ATTR`;
- runtime errors with line numbers: division by zero, array index out of bounds
  (reported like UBSan, execution continues), null pointers, stack overflow sized to the
  board's RAM;
- a debugger: breakpoints, pause, step into / over / out, call stack, live variables.

Libraries are emulations of their public APIs (see `SUPPORTED_LIBRARIES` in `index.js`),
backed by `hal.devices` that a lesson or Tinker Studio provides. The contract is in
[`docs/RUNTIME_API.md`](../../docs/RUNTIME_API.md).

## Layout

| File | Does |
| --- | --- |
| `lexer.js`, `preprocess.js` | tokens, `#include` / `#define` / `#if` |
| `parser.js` | recursive-descent parser to an AST |
| `types.js` | board type widths, conversions, `sizeof`, struct layout |
| `compiler.js` | name resolution, type checking, diagnostics, code generation to closures / generators |
| `vm.js` | scheduler, simulated clock, pins, serial, interrupts, debugger |
| `libs/` | Arduino core and library emulations |
| `devices.js` | helpers for lesson HALs (MPU-6050 registers, Serial Plotter parsing, OLED images) |
| `ui/` | "Run my code" in the lesson app: CodeMirror editor, toolbar, problems / variables drawer |

Tests: `node --test tests/` from `tinker-lab/`.
