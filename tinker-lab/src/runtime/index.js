// Tinker Lab Arduino runtime.
//
// An interpreter for the Arduino language (C++ as used in sketches), NOT an AVR or
// Xtensa emulator. It parses the sketch, type-checks it with the real integer widths
// of the chosen board (int is 16-bit on AVR, 32-bit on ESP32; double is 32-bit on AVR),
// reports g++-style errors with beginner hints, and runs it against a virtual board
// through a hardware abstraction layer (HAL) with a simulated clock. Timing is a
// teaching model: delay(), millis(), Serial baud rates, analogRead() and I2C traffic
// take plausible simulated time, but nothing here is cycle accurate.
//
// See docs/RUNTIME_API.md for the contract.
import { preprocess } from './preprocess.js';
import { parse } from './parser.js';
import { CompileError } from './lexer.js';
import { compileProgram } from './compiler.js';
import { VM } from './vm.js';
import { getRegistry } from './libs/index.js';

export { VM } from './vm.js';
export { mpu6050Device } from './devices.js';

/** Libraries a sketch can #include in the simulator. */
export const SUPPORTED_LIBRARIES = [
  { header: 'Servo.h', name: 'Servo', boards: 'AVR, Uno R4, ESP8266' },
  { header: 'ESP32Servo.h', name: 'ESP32Servo', boards: 'ESP32' },
  { header: 'Wire.h', name: 'Wire (I²C)', boards: 'all' },
  { header: 'SPI.h', name: 'SPI', boards: 'all' },
  { header: 'LiquidCrystal_I2C.h', name: 'LiquidCrystal I2C', boards: 'all' },
  { header: 'Adafruit_GFX.h', name: 'Adafruit GFX', boards: 'all' },
  { header: 'Adafruit_SSD1306.h', name: 'Adafruit SSD1306', boards: 'all' },
  { header: 'Adafruit_NeoPixel.h', name: 'Adafruit NeoPixel', boards: 'all' },
  { header: 'DHT.h', name: 'DHT sensor library', boards: 'all' },
  { header: 'Stepper.h', name: 'Stepper', boards: 'all' },
  { header: 'EEPROM.h', name: 'EEPROM', boards: 'all' },
  { header: 'Keypad.h', name: 'Keypad', boards: 'all' },
  { header: 'IRremote.hpp', name: 'IRremote (v4 API)', boards: 'all' },
  { header: 'RTClib.h', name: 'RTClib', boards: 'all' },
  { header: 'SD.h', name: 'SD', boards: 'all' },
  { header: 'LowPower.h', name: 'Low-Power (Rocket Scream)', boards: 'AVR' },
  { header: 'WiFi.h', name: 'WiFi', boards: 'ESP32' },
  { header: 'WebServer.h', name: 'WebServer', boards: 'ESP32' },
  { header: 'ESP8266WiFi.h', name: 'ESP8266WiFi', boards: 'ESP8266' },
  { header: 'ESP8266WebServer.h', name: 'ESP8266WebServer', boards: 'ESP8266' },
  { header: 'PubSubClient.h', name: 'PubSubClient (MQTT)', boards: 'all' },
  { header: 'BluetoothSerial.h', name: 'BluetoothSerial', boards: 'ESP32' },
  { header: 'esp_sleep.h', name: 'ESP32 sleep', boards: 'ESP32' },
];

const BOARD_ALIASES = { 'uno-r4': 'unor4', r4: 'unor4', esp8266: 'nodemcu', mega2560: 'mega' };

/**
 * Compile a sketch.
 * @returns {{ ok: boolean, diagnostics: Array<{severity, line, col, message, hint?}>, program: Program | null }}
 */
export function compile(source, { board = 'uno', now } = {}) {
  board = BOARD_ALIASES[board] ?? board;
  const registry = getRegistry();
  const diagnostics = [];
  let ast, includes = [];
  const finish = (program = null) => {
    diagnostics.sort((a, b) => (a.severity === b.severity ? a.line - b.line || a.col - b.col : a.severity === 'error' ? -1 : 1));
    const ok = !diagnostics.some((d) => d.severity === 'error');
    return { ok, diagnostics, program: ok ? program : null };
  };
  try {
    const pp = preprocess(String(source ?? ''), { board, now, isSupported: (h) => registry.isSupported(h, board) });
    includes = pp.includes;
    for (const d of pp.diagnostics) {
      if (d.message.endsWith('No such file or directory')) {
        const h = registry.headers.get(d.message.replace(/: No such file or directory$/, ''));
        if (h?.alt) d.hint = `${h.alt}`;
        else if (!h) d.hint = `${d.hint} Libraries in the simulator: ${SUPPORTED_LIBRARIES.map((l) => l.header).join(', ')}.`;
      }
      diagnostics.push(d);
    }
    if (diagnostics.some((d) => d.severity === 'error')) return finish();
    ast = parse(pp.tokens, { typeNames: new Set([...registry.typeNames(), 'byte', 'boolean', 'word', 'uint8_t', 'int8_t', 'uint16_t', 'int16_t', 'uint32_t', 'int32_t', 'uint64_t', 'int64_t', 'size_t', 'ssize_t', 'uintptr_t', 'gpio_num_t', 'esp_sleep_wakeup_cause_t', 'PinStatus', 'pin_size_t']) });
  } catch (e) {
    if (e instanceof CompileError) {
      diagnostics.push({ severity: 'error', line: e.line, col: e.col, message: e.message, ...(e.hint ? { hint: e.hint } : {}) });
      return finish();
    }
    throw e;
  }
  let P;
  try {
    P = compileProgram(ast, { board, registry, includes, diagnostics });
  } catch (e) {
    if (e instanceof CompileError) {
      diagnostics.push({ severity: 'error', line: e.line, col: e.col, message: e.message, ...(e.hint ? { hint: e.hint } : {}) });
      return finish();
    }
    throw e;
  }
  const lineCount = String(source).split('\n').length;
  const program = {
    ...P,
    board,
    registry,
    lineCount,
    source,
    /** Create a running instance of the sketch on a HAL. */
    instantiate(hal = {}, opts = {}) { return new VM(program, hal, opts); },
    /** Lines that can hold a breakpoint (lines with statements). */
    get executableLines() { return executableLines(ast); },
  };
  return finish(program);
}

function executableLines(ast) {
  const out = new Set();
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (['expr', 'decl', 'if', 'while', 'for', 'rangefor', 'do', 'switch', 'return', 'break', 'continue'].includes(n.kind) && n.line) out.add(n.line);
    if (n.kind === 'func') { walk(n.body); return; }
    for (const k of ['body', 'then', 'els', 'decls']) walk(n[k]);
  };
  for (const d of ast.decls) if (d.kind === 'func') walk(d.body);
  return [...out].sort((a, b) => a - b);
}
