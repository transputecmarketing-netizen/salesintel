// Arduino core: pins, time, math, C strings, Serial / Print, the String class.
import { M, isGen, AVR, ESP32, ESP, ALL } from './registry.js';
import { AStr, Ptr, cstr, charArray, writeCstr, textOf, dtostrf, Reset, fmtUnsigned } from '../values.js';
import { formatPrintf } from '../printf.js';
import { canon, sizeOf, toBytesLE, fromBytesLE } from '../types.js';

// ------------------------------------------------------------------ Print
/** Text a print() call produces for a typed argument. */
export function printText(vm, a, base) {
  const t = canon(a.t);
  if (t.k === 'class') {
    if (t.cls.name === 'String') return a.v.s;
    if (t.cls.printTo) return t.cls.printTo(a.v);
    return '';
  }
  if (t.k === 'array' || t.k === 'ptr') return cstr(a.v);
  if (base === undefined) return textOf(a.v, a.t, vm.T);
  if (t.k === 'float') return textOf(a.v, a.t, vm.T, { digits: base });
  if (base === 0) return String.fromCharCode(a.v & 255);
  // print(x, base): a char is promoted and printed as a number
  const nt = t.isChar ? vm.T.int : a.t;
  return textOf(t.isChar ? a.v : a.v, nt, vm.T, { base });
}

function printCheck({ args, error, T }) {
  const a = args[0];
  if (!a) return;
  const t = canon(a.t);
  if (t.k === 'void') error("invalid use of void expression", "This function doesn't return a value, so there is nothing to print.");
  else if (t.k === 'struct') error(`no matching function for call to 'print(${t.name}&)'`, 'Print the fields one at a time, e.g. Serial.print(s.x);');
  else if (t.k === 'int' && t.bits === 64 && T.avr) error(`call of overloaded 'print(${t.name})' is ambiguous`, 'The AVR Print class has no 64-bit overload. Cast to long or unsigned long first.');
  else if (t.k === 'class' && !t.cls.printTo && t.cls.name !== 'String') error(`no matching function for call to 'print(${t.cls.name}&)'`);
  else if (t.k === 'fn') error("no matching function for call to 'print(<function>)'", 'Did you forget the () to call the function?');
}

/** Print-family methods for a class whose output goes through write(vm, self, bytes). */
export function printMethods(write, { printfBoards = ESP } = {}) {
  const W = isGen(write) ? write : function* (vm, self, b) { return write(vm, self, b); };
  return {
    print: M(['size_t (any)', 'size_t (any, int)'], [
      function* (vm, self, a) { const s = printText(vm, a); yield* W(vm, self, s); return s.length; },
      function* (vm, self, a, base) { const s = printText(vm, a, base); yield* W(vm, self, s); return s.length; },
    ], { check: printCheck }),
    println: M(['size_t ()', 'size_t (any)', 'size_t (any, int)'], [
      function* (vm, self) { yield* W(vm, self, '\r\n'); return 2; },
      function* (vm, self, a) { const s = printText(vm, a) + '\r\n'; yield* W(vm, self, s); return s.length; },
      function* (vm, self, a, base) { const s = printText(vm, a, base) + '\r\n'; yield* W(vm, self, s); return s.length; },
    ], { check: printCheck }),
    write: M(['size_t (any)', 'size_t (any, size_t)'], [
      function* (vm, self, a) {
        const t = canon(a.t);
        const s = t.k === 'int' || t.k === 'enum' ? String.fromCharCode(a.v & 255) : t.k === 'class' && t.cls.name === 'String' ? a.v.s : cstr(a.v);
        yield* W(vm, self, s);
        return s.length;
      },
      function* (vm, self, a, n) {
        let s = '';
        const p = a.v instanceof Ptr ? a.v : new Ptr(a.v, 0);
        for (let i = 0; i < n; i++) s += String.fromCharCode((p.b[p.o + i] ?? 0) & 255);
        yield* W(vm, self, s);
        return n;
      },
    ]),
    printf: M('size_t (cstr, ...)', function* (vm, self, fmt, args) {
      const s = formatPrintf(fmt, args, vm.T, (m) => vm.warnOnce(`printf:${m}`, m));
      yield* W(vm, self, s);
      return s.length;
    }, { boards: printfBoards, boardsText: 'ESP32 / ESP8266' }),
  };
}

// ------------------------------------------------------------------ Stream reading (Serial, BT, files)
/** Stream methods over a source with avail(vm, self) → n, readByte(vm, self) → code | -1, peekByte. */
export function streamMethods(src) {
  const timeoutUs = (vm, self) => (src.timeout?.(vm, self) ?? 1000) * 1000;
  function* timedRead(vm, self) {
    const end = vm.us + timeoutUs(vm, self);
    for (;;) {
      if (src.avail(vm, self) > 0) return src.readByte(vm, self);
      if (vm.us >= end) return -1;
      yield* vm.sleep(Math.min(1000, end - vm.us));
    }
  }
  function* timedPeek(vm, self) {
    const end = vm.us + timeoutUs(vm, self);
    for (;;) {
      if (src.avail(vm, self) > 0) return src.peekByte(vm, self);
      if (vm.us >= end) return -1;
      yield* vm.sleep(Math.min(1000, end - vm.us));
    }
  }
  function* parseNumber(vm, self, float) {
    // skip anything that isn't part of a number
    let c;
    for (;;) {
      c = yield* timedPeek(vm, self);
      if (c < 0) return 0;
      const ch = String.fromCharCode(c);
      if (ch === '-' || (ch >= '0' && ch <= '9') || (float && ch === '.')) break;
      src.readByte(vm, self);
    }
    let s = '';
    for (;;) {
      const ch = String.fromCharCode(c);
      if (!((ch >= '0' && ch <= '9') || (s === '' && ch === '-') || (float && ch === '.' && !s.includes('.')))) break;
      s += ch;
      src.readByte(vm, self);
      c = yield* timedPeek(vm, self);
      if (c < 0) break;
    }
    const v = float ? parseFloat(s) : parseInt(s, 10);
    return Number.isFinite(v) ? v : 0;
  }
  return {
    available: M('int ()', (vm, self) => src.avail(vm, self)),
    read: M('int ()', (vm, self) => src.readByte(vm, self)),
    peek: M('int ()', (vm, self) => src.peekByte(vm, self)),
    setTimeout: M('void (unsigned long)', (vm, self, ms) => { src.setTimeout?.(vm, self, ms); }),
    parseInt: M(['long ()', 'long (int)'], function* (vm, self) { return (yield* parseNumber(vm, self, false)) | 0; }),
    parseFloat: M(['float ()', 'float (int)'], function* (vm, self) { return Math.fround(yield* parseNumber(vm, self, true)); }),
    readString: M('String ()', function* (vm, self) {
      let s = '';
      for (;;) { const c = yield* timedRead(vm, self); if (c < 0) break; s += String.fromCharCode(c); }
      return new AStr(s);
    }),
    readStringUntil: M('String (char)', function* (vm, self, term) {
      let s = '';
      for (;;) { const c = yield* timedRead(vm, self); if (c < 0 || c === (term & 255)) break; s += String.fromCharCode(c); }
      return new AStr(s);
    }),
    readBytes: M('size_t (any, size_t)', function* (vm, self, buf, n) {
      const p = buf.v instanceof Ptr ? buf.v : new Ptr(buf.v, 0);
      let i = 0;
      for (; i < n; i++) { const c = yield* timedRead(vm, self); if (c < 0) break; p.b[p.o + i] = c; }
      return i;
    }),
    readBytesUntil: M('size_t (char, any, size_t)', function* (vm, self, term, buf, n) {
      const p = buf.v instanceof Ptr ? buf.v : new Ptr(buf.v, 0);
      let i = 0;
      for (; i < n; i++) { const c = yield* timedRead(vm, self); if (c < 0 || c === (term & 255)) break; p.b[p.o + i] = c; }
      return i;
    }),
    find: M('bool (cstr)', function* (vm, self, target) {
      let k = 0;
      for (;;) {
        const c = yield* timedRead(vm, self);
        if (c < 0) return 0;
        if (c === target.charCodeAt(k)) { if (++k === target.length) return 1; } else k = c === target.charCodeAt(0) ? 1 : 0;
      }
    }),
  };
}

// ------------------------------------------------------------------ the core
export function addCore(R) {
  const SERIAL_BOARDS = { 1: ['mega', 'esp32', 'nodemcu', 'unor4'], 2: ['mega', 'esp32'], 3: ['mega'] };

  // ---- constants
  R.consts('int', { HIGH: 1, LOW: 0, INPUT: 0, OUTPUT: 1, INPUT_PULLUP: 2, LSBFIRST: 0, MSBFIRST: 1, DEC: 10, HEX: 16, OCT: 8, BIN: 2 });
  R.konst('INPUT_PULLDOWN', 'int', 3, { boards: ESP });
  R.konst('CHANGE', 'int', (b) => (ESP32.includes(b) ? 3 : 1));
  R.konst('FALLING', 'int', 2);
  R.konst('RISING', 'int', (b) => (ESP32.includes(b) ? 1 : 3));
  R.konst('ONLOW', 'int', 4, { boards: ESP32 });
  R.konst('ONHIGH', 'int', 5, { boards: ESP32 });
  R.konst('NOT_AN_INTERRUPT', 'int', -1);
  R.konst('LED_BUILTIN', 'int', (b) => ({ esp32: 2, nodemcu: 2 }[b] ?? 13));
  for (let i = 0; i < 16; i++) {
    R.konst(`A${i}`, 'int', (b) => {
      if (b === 'mega') return 54 + i;
      if (b === 'esp32') return { 0: 36, 3: 39, 4: 32, 5: 33, 6: 34, 7: 35, 10: 4, 11: 0, 12: 2, 13: 15, 14: 13, 15: 12 }[i];
      if (b === 'nodemcu') return i === 0 ? 17 : undefined;
      if (b === 'nano') return i < 8 ? 14 + i : undefined;
      return i < 6 ? 14 + i : undefined;
    });
  }
  R.konst('SDA', 'int', (b) => ({ mega: 20, esp32: 21, nodemcu: 4 }[b] ?? 18));
  R.konst('SCL', 'int', (b) => ({ mega: 21, esp32: 22, nodemcu: 5 }[b] ?? 19));
  R.konst('SS', 'int', (b) => ({ mega: 53, esp32: 5, nodemcu: 15 }[b] ?? 10));
  R.konst('MOSI', 'int', (b) => ({ mega: 51, esp32: 23, nodemcu: 13 }[b] ?? 11));
  R.konst('MISO', 'int', (b) => ({ mega: 50, esp32: 19, nodemcu: 12 }[b] ?? 12));
  R.konst('SCK', 'int', (b) => ({ mega: 52, esp32: 18, nodemcu: 14 }[b] ?? 13));
  R.konst('NUM_DIGITAL_PINS', 'int', (b) => ({ mega: 70, nano: 22, esp32: 40, nodemcu: 17 }[b] ?? 20));
  R.konst('NUM_ANALOG_INPUTS', 'int', (b) => ({ mega: 16, nano: 8, esp32: 16, nodemcu: 1 }[b] ?? 6));
  for (const [k, v] of Object.entries({ D0: 16, D1: 5, D2: 4, D3: 0, D4: 2, D5: 14, D6: 12, D7: 13, D8: 15, D9: 3, D10: 1 })) R.konst(k, 'int', v, { boards: ['nodemcu'] });
  R.consts('double', { PI: Math.PI, HALF_PI: Math.PI / 2, TWO_PI: Math.PI * 2, DEG_TO_RAD: Math.PI / 180, RAD_TO_DEG: 180 / Math.PI, EULER: Math.E, M_PI: Math.PI, M_E: Math.E, M_SQRT2: Math.SQRT2 });
  R.konst('NAN', 'float', NaN);
  R.konst('INFINITY', 'float', Infinity);
  R.konst('INT_MAX', 'int', (b) => (AVR.includes(b) ? 32767 : 2147483647));
  R.konst('INT_MIN', 'int', (b) => (AVR.includes(b) ? -32768 : -2147483648));
  R.konst('UINT_MAX', 'unsigned int', (b) => (AVR.includes(b) ? 65535 : 4294967295));
  R.konst('LONG_MAX', 'long', 2147483647);
  R.konst('LONG_MIN', 'long', -2147483648);
  R.konst('ULONG_MAX', 'unsigned long', 4294967295);
  R.konst('RAND_MAX', 'int', (b) => (AVR.includes(b) ? 32767 : 2147483647));
  R.konst('RANDOM_MAX', 'long', 0x7fffffff);
  R.konst('SERIAL_8N1', 'int', 6);
  R.konst('SERIAL_8E1', 'int', 0x26);
  R.konst('DEFAULT', 'int', 1, { boards: AVR });
  R.konst('INTERNAL', 'int', 3, { boards: ['uno', 'nano'] });
  R.konst('EXTERNAL', 'int', 0, { boards: AVR });
  R.konst('INTERNAL1V1', 'int', 2, { boards: ['mega'] });
  R.konst('INTERNAL2V56', 'int', 3, { boards: ['mega'] });
  R.konst('true', 'bool', 1);

  // ---- digital / analog
  const MODE = (m) => m;
  R.fn('pinMode', 'void (uint8_t, uint8_t)', (vm, pin, mode) => vm.pinMode(pin, MODE(mode)));
  R.fn('digitalWrite', 'void (uint8_t, uint8_t)', (vm, pin, v) => vm.digitalWrite(pin, v), { check: pinCheck('digitalWrite') });
  R.fn('digitalRead', 'int (uint8_t)', (vm, pin) => vm.digitalRead(pin), { check: pinCheck('digitalRead') });
  R.fn('analogRead', 'int (uint8_t)', (vm, pin) => vm.analogRead(pin), {
    check: ({ args, warn, T, board }) => {
      const a = args[0];
      if (a?.cv === undefined) return;
      const info = T.info;
      if (info.analogBase != null && a.cv >= 0 && a.cv < info.analogBase && a.cv >= info.analogCount && board !== 'nodemcu') warn(`analogRead(${a.cv}): pin ${a.cv} is a digital pin`, 'Use A0 … A5 for analog inputs.');
    },
  });
  R.fn('analogWrite', 'void (uint8_t, int)', (vm, pin, v) => vm.analogWrite(pin, v), {
    check: ({ args, warn, T }) => {
      const a = args[0], b = args[1];
      if (a?.cv !== undefined && T.info.pwm !== 'all' && !T.info.pwm.includes(a.cv)) warn(`pin ${a.cv} is not a PWM pin on the ${T.info.name}, so analogWrite() can only turn it fully on or off`, `PWM pins (marked ~): ${T.info.pwm.join(', ')}.`);
      if (b?.cv !== undefined && (b.cv > 255 || b.cv < 0)) warn(`analogWrite() value ${b.cv} is outside 0–255`, 'The duty cycle is a byte: 0 = off, 255 = always on. Use map(x, 0, 1023, 0, 255) to scale a reading.');
    },
  });
  R.fn('analogReference', 'void (uint8_t)', () => {}, { boards: ['uno', 'nano', 'mega', 'unor4'] });
  R.fn('analogReadResolution', 'void (int)', (vm, bits) => { vm.adcBits = Math.max(1, Math.min(16, bits)); }, { boards: ['esp32', 'unor4'] });
  R.fn('analogWriteResolution', 'void (int)', () => {}, { boards: ['esp32', 'unor4'] });
  R.fn('analogSetAttenuation', 'void (int)', () => {}, { boards: ESP32 });
  R.consts('int', { ADC_0db: 0, ADC_2_5db: 1, ADC_6db: 2, ADC_11db: 3 }, { boards: ESP32 });
  R.fn('dacWrite', 'void (uint8_t, uint8_t)', (vm, pin, v) => { vm.hal.analogWrite?.(pin, v); vm.emit('pin', { pin, kind: 'pwm', value: v }); }, { boards: ESP32 });

  // ---- time
  R.fn('delay', 'void (unsigned long)', function* (vm, ms) { yield* vm.sleep(ms * 1000); });
  R.fn('delayMicroseconds', 'void (unsigned int)', function* (vm, us) { yield* vm.sleep(us); });
  R.fn('millis', 'unsigned long ()', (vm) => vm.millis());
  R.fn('micros', 'unsigned long ()', (vm) => vm.micros());
  R.fn('yield', 'void ()', (vm) => { vm.us += 1; });
  R.fn('pulseIn', ['unsigned long (uint8_t, uint8_t)', 'unsigned long (uint8_t, uint8_t, unsigned long)'], function* (vm, pin, level, timeout = 1000000) {
    const r = Math.max(0, Math.round(vm.hal.pulseIn?.(pin, level, timeout) ?? 0));
    if (!r || r > timeout) { yield* vm.sleep(timeout); return 0; }
    yield* vm.sleep(r + 450);
    return r >>> 0;
  });
  R.fn('pulseInLong', ['unsigned long (uint8_t, uint8_t)', 'unsigned long (uint8_t, uint8_t, unsigned long)'], function* (vm, pin, level, timeout = 1000000) {
    const r = Math.max(0, Math.round(vm.hal.pulseIn?.(pin, level, timeout) ?? 0));
    if (!r || r > timeout) { yield* vm.sleep(timeout); return 0; }
    yield* vm.sleep(r + 450);
    return r >>> 0;
  });

  // ---- sound
  R.fn('tone', ['void (uint8_t, unsigned int)', 'void (uint8_t, unsigned int, unsigned long)'], (vm, pin, f, d = 0) => vm.tone(pin, f, d));
  R.fn('noTone', 'void (uint8_t)', (vm, pin) => vm.noTone(pin));

  // ---- shift registers
  R.fn('shiftOut', 'void (uint8_t, uint8_t, uint8_t, uint8_t)', (vm, data, clock, order, val) => {
    for (let i = 0; i < 8; i++) {
      const bit = order === 0 ? (val >> i) & 1 : (val >> (7 - i)) & 1;
      vm.digitalWrite(data, bit);
      vm.digitalWrite(clock, 1);
      vm.digitalWrite(clock, 0);
    }
  });
  R.fn('shiftIn', 'uint8_t (uint8_t, uint8_t, uint8_t)', (vm, data, clock, order) => {
    let v = 0;
    for (let i = 0; i < 8; i++) {
      vm.digitalWrite(clock, 1);
      const b = vm.digitalRead(data);
      if (order === 0) v |= b << i; else v |= b << (7 - i);
      vm.digitalWrite(clock, 0);
    }
    return v;
  });

  // ---- interrupts
  R.special('digitalPinToInterrupt');
  R.fn('attachInterrupt', 'void (uint8_t, fn, int)', (vm, num, fn, mode) => {
    const esp = vm.info.arch === 'esp32';
    const name = esp ? { 1: 'RISING', 2: 'FALLING', 3: 'CHANGE', 4: 'LOW', 5: 'HIGH' }[mode] : { 0: 'LOW', 1: 'CHANGE', 2: 'FALLING', 3: 'RISING' }[mode];
    if (!name) { vm.warnOnce(`irqmode${mode}`, `attachInterrupt(): mode ${mode} is not a valid interrupt mode on this board`); return; }
    vm.attachInterrupt(num, fn, name);
  }, {
    check: ({ args, warn, T }) => {
      if (args[0]?.cv !== undefined && T.info.interrupts !== 'all' && !Object.values(T.info.interrupts).includes(args[0].cv) && args[0].cv !== -1) {
        warn(`attachInterrupt(${args[0].cv}, …): the first argument is an interrupt number, not a pin`, 'Write attachInterrupt(digitalPinToInterrupt(pin), isr, mode).');
      }
    },
  });
  R.fn('detachInterrupt', 'void (uint8_t)', (vm, num) => vm.detachInterrupt(num));
  R.fn('interrupts', 'void ()', (vm) => { vm.irqEnabled = true; if (vm.irqPending) vm.budget = 0; });
  R.fn('noInterrupts', 'void ()', (vm) => { vm.irqEnabled = false; });
  R.fn('sei', 'void ()', (vm) => { vm.irqEnabled = true; if (vm.irqPending) vm.budget = 0; }, { boards: AVR });
  R.fn('cli', 'void ()', (vm) => { vm.irqEnabled = false; }, { boards: AVR });

  // ---- maths
  R.special('min'); R.special('max'); R.special('abs'); R.special('constrain'); R.special('sq'); R.special('round');
  R.special('bitRead'); R.special('bitSet'); R.special('bitClear'); R.special('bitWrite'); R.special('lowByte'); R.special('highByte');
  R.special('F'); R.special('PSTR'); R.special('FPSTR');
  R.special('pgm_read_byte'); R.special('pgm_read_word'); R.special('pgm_read_dword'); R.special('pgm_read_float'); R.special('pgm_read_ptr');
  R.fn('map', 'long (long, long, long, long, long)', (vm, x, a, b, c, d) => {
    if (b === a) vm.fail('division by zero in map()', 'map(x, fromLow, fromHigh, …) divides by fromHigh − fromLow, so the two must differ.');
    // long arithmetic, exactly like WMath.cpp (the product can overflow 32 bits)
    const prod = Math.imul((x - a) | 0, (d - c) | 0);
    return (Math.trunc(prod / ((b - a) | 0)) + c) | 0;
  }, { pure: true });
  const D = (name, fn, n = 1) => R.fn(name, n === 1 ? 'double (double)' : n === 2 ? 'double (double, double)' : 'double (double, double, double)', (vm, ...a) => { const r = fn(...a); return vm && vm.T.avr ? Math.fround(r) : r; }, { pure: true });
  D('sqrt', Math.sqrt); D('sin', Math.sin); D('cos', Math.cos); D('tan', Math.tan); D('asin', Math.asin); D('acos', Math.acos); D('atan', Math.atan);
  D('atan2', Math.atan2, 2); D('exp', Math.exp); D('log', Math.log); D('log10', Math.log10); D('log2', Math.log2); D('pow', Math.pow, 2); D('fabs', Math.abs);
  D('floor', Math.floor); D('ceil', Math.ceil); D('fmod', (a, b) => a % b, 2); D('fmin', Math.min, 2); D('fmax', Math.max, 2); D('trunc', Math.trunc); D('hypot', Math.hypot, 2);
  D('cbrt', Math.cbrt); D('sinh', Math.sinh); D('cosh', Math.cosh); D('tanh', Math.tanh); D('square', (x) => x * x);
  D('radians', (x) => (x * Math.PI) / 180); D('degrees', (x) => (x * 180) / Math.PI);
  R.fn('sqrtf', 'float (float)', (vm, x) => Math.fround(Math.sqrt(x)), { pure: true });
  R.fn('powf', 'float (float, float)', (vm, x, y) => Math.fround(x ** y), { pure: true });
  R.fn('fabsf', 'float (float)', (vm, x) => Math.abs(x), { pure: true });
  R.fn('lround', 'long (double)', (vm, x) => (Math.sign(x) * Math.round(Math.abs(x))) | 0, { pure: true });
  R.fn('lrint', 'long (double)', (vm, x) => Math.round(x) | 0, { pure: true });
  R.fn('isnan', 'int (double)', (vm, x) => (Number.isNaN(x) ? 1 : 0), { pure: true });
  R.fn('isinf', 'int (double)', (vm, x) => (x === Infinity ? 1 : x === -Infinity ? -1 : 0), { pure: true });
  R.fn('isfinite', 'int (double)', (vm, x) => (Number.isFinite(x) ? 1 : 0), { pure: true });
  R.fn('bit', 'unsigned long (int)', (vm, n) => (n >= 32 ? 0 : 2 ** n) >>> 0, { pure: true });
  R.fn('word', ['unsigned int (unsigned int)', 'unsigned int (uint8_t, uint8_t)'], [(vm, w) => w & 0xffff, (vm, h, l) => ((h << 8) | l) & 0xffff], { pure: true });
  R.fn('random', ['long (long)', 'long (long, long)'], [
    (vm, max) => (max === 0 ? 0 : vm.random.random() % max),
    (vm, min, max) => (min >= max ? min : (vm.random.random() % (max - min)) + min),
  ]);
  R.fn('randomSeed', 'void (unsigned long)', (vm, s) => { if (s !== 0) vm.random.seed(s); });
  R.fn('rand', 'int ()', (vm) => vm.random.random() % (vm.T.avr ? 32768 : 2147483648));
  R.fn('srand', 'void (unsigned int)', (vm, s) => vm.random.seed(s));
  R.fn('esp_random', 'uint32_t ()', () => (Math.random() * 4294967296) >>> 0, { boards: ESP32 });

  // ---- characters (Arduino WCharacter.h + ctype)
  const C = (name, test, ret = 'bool') => R.fn(name, `${ret} (int)`, (vm, c) => (test(String.fromCharCode(c & 255)) ? 1 : 0), { pure: true });
  C('isDigit', (c) => /[0-9]/.test(c)); C('isAlpha', (c) => /[A-Za-z]/.test(c)); C('isAlphaNumeric', (c) => /[A-Za-z0-9]/.test(c));
  C('isSpace', (c) => /[ \t\n\v\f\r]/.test(c)); C('isWhitespace', (c) => c === ' ' || c === '\t'); C('isUpperCase', (c) => /[A-Z]/.test(c));
  C('isLowerCase', (c) => /[a-z]/.test(c)); C('isPunct', (c) => /[!-/:-@[-`{-~]/.test(c)); C('isHexadecimalDigit', (c) => /[0-9A-Fa-f]/.test(c));
  C('isPrintable', (c) => c >= ' ' && c <= '~'); C('isControl', (c) => c < ' ' || c === '\x7f'); C('isGraph', (c) => c > ' ' && c <= '~'); C('isAscii', (c) => c.charCodeAt(0) < 128);
  C('isdigit', (c) => /[0-9]/.test(c), 'int'); C('isalpha', (c) => /[A-Za-z]/.test(c), 'int'); C('isalnum', (c) => /[A-Za-z0-9]/.test(c), 'int');
  C('isspace', (c) => /[ \t\n\v\f\r]/.test(c), 'int'); C('isupper', (c) => /[A-Z]/.test(c), 'int'); C('islower', (c) => /[a-z]/.test(c), 'int');
  C('ispunct', (c) => /[!-/:-@[-`{-~]/.test(c), 'int'); C('isxdigit', (c) => /[0-9A-Fa-f]/.test(c), 'int'); C('isprint', (c) => c >= ' ' && c <= '~', 'int');
  R.fn('toupper', 'int (int)', (vm, c) => (c >= 97 && c <= 122 ? c - 32 : c), { pure: true });
  R.fn('tolower', 'int (int)', (vm, c) => (c >= 65 && c <= 90 ? c + 32 : c), { pure: true });
  R.fn('toUpperCase', 'int (int)', (vm, c) => (c >= 97 && c <= 122 ? c - 32 : c), { pure: true });
  R.fn('toLowerCase', 'int (int)', (vm, c) => (c >= 65 && c <= 90 ? c + 32 : c), { pure: true });

  // ---- C strings
  const ptrOf = (v) => (v instanceof Ptr ? v : v == null ? null : new Ptr(v, 0));
  R.fn('strlen', 'size_t (cstr)', (vm, s) => s.length, { pure: true });
  R.fn('strcmp', 'int (cstr, cstr)', (vm, a, b) => (a < b ? -1 : a > b ? 1 : 0));
  R.fn('strncmp', 'int (cstr, cstr, size_t)', (vm, a, b, n) => { a = a.slice(0, n); b = b.slice(0, n); return a < b ? -1 : a > b ? 1 : 0; });
  R.fn('strcasecmp', 'int (cstr, cstr)', (vm, a, b) => { a = a.toLowerCase(); b = b.toLowerCase(); return a < b ? -1 : a > b ? 1 : 0; });
  R.fn('strcpy', 'char* (any, cstr)', (vm, d, s) => { const p = ptrOf(d.v); if (s.length + 1 > p.b.length - p.o) vm.oob(vm.line, `runtime error: strcpy() writes ${s.length + 1} bytes into a ${p.b.length - p.o}-byte buffer`, 'Make the char array bigger: it needs one extra byte for the hidden \\0 at the end.'); writeCstr(p, s); return p; });
  R.fn('strncpy', 'char* (any, cstr, size_t)', (vm, d, s, n) => { const p = ptrOf(d.v); for (let i = 0; i < n && p.o + i < p.b.length; i++) p.b[p.o + i] = i < s.length ? s.charCodeAt(i) : 0; return p; });
  R.fn('strcat', 'char* (any, cstr)', (vm, d, s) => { const p = ptrOf(d.v); const cur = cstr(p); if (cur.length + s.length + 1 > p.b.length - p.o) vm.oob(vm.line, 'runtime error: strcat() overflows the destination buffer', 'The char array is too small for the joined text plus its \\0.'); writeCstr(p, cur + s); return p; });
  R.fn('strncat', 'char* (any, cstr, size_t)', (vm, d, s, n) => { const p = ptrOf(d.v); writeCstr(p, cstr(p) + s.slice(0, n)); return p; });
  R.fn('strchr', 'char* (any, int)', (vm, s, c) => { const p = ptrOf(s.v); const str = cstr(p); const i = c === 0 ? str.length : str.indexOf(String.fromCharCode(c & 255)); return i < 0 ? null : new Ptr(p.b, p.o + i); });
  R.fn('strrchr', 'char* (any, int)', (vm, s, c) => { const p = ptrOf(s.v); const i = cstr(p).lastIndexOf(String.fromCharCode(c & 255)); return i < 0 ? null : new Ptr(p.b, p.o + i); });
  R.fn('strstr', 'char* (any, cstr)', (vm, s, n) => { const p = ptrOf(s.v); const i = cstr(p).indexOf(n); return i < 0 ? null : new Ptr(p.b, p.o + i); });
  const atol = (s) => { const m = /^\s*([+-]?\d+)/.exec(s); return m ? Number(BigInt.asIntN(32, BigInt(m[1]))) : 0; };
  const atof = (s) => { const m = /^\s*([+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)/.exec(s); return m ? parseFloat(m[1]) : 0; };
  R.fn('atoi', 'int (cstr)', (vm, s) => { const v = atol(s); return vm.T.avr ? (v << 16) >> 16 : v; });
  R.fn('atol', 'long (cstr)', (vm, s) => atol(s));
  R.fn('atof', 'double (cstr)', (vm, s) => atof(s));
  R.fn('strtol', 'long (cstr, any, int)', (vm, s, end, base) => { const v = parseInt(s.trim(), base || 10); return Number.isFinite(v) ? v | 0 : 0; });
  R.fn('strtoul', 'unsigned long (cstr, any, int)', (vm, s, end, base) => { const v = parseInt(s.trim(), base || 10); return Number.isFinite(v) ? v >>> 0 : 0; });
  R.fn('strtod', 'double (cstr, any)', (vm, s) => atof(s));
  const itoa = (vm, v, d, base, unsigned) => {
    const p = ptrOf(d.v);
    const s = base === 10 && !unsigned ? String(v) : fmtUnsigned(unsigned || base !== 10 ? (v < 0 ? (vm.T.avr && !unsigned ? v & 0xffff : v >>> 0) : v) : v, base).toLowerCase();
    writeCstr(p, s);
    return p;
  };
  R.fn('itoa', 'char* (int, any, int)', (vm, v, d, b) => itoa(vm, v, d, b, false));
  R.fn('ltoa', 'char* (long, any, int)', (vm, v, d, b) => itoa(vm, v, d, b, false));
  R.fn('utoa', 'char* (unsigned int, any, int)', (vm, v, d, b) => itoa(vm, v, d, b, true));
  R.fn('ultoa', 'char* (unsigned long, any, int)', (vm, v, d, b) => itoa(vm, v, d, b, true));
  R.fn('dtostrf', 'char* (double, int, int, any)', (vm, v, w, p, d) => { const ptr = ptrOf(d.v); writeCstr(ptr, dtostrf(v, w, p)); return ptr; });
  const fmt = (vm, f, args) => formatPrintf(f, args, vm.T, (m) => vm.warnOnce(`printf:${m}`, m));
  R.fn('sprintf', 'int (any, cstr, ...)', (vm, d, f, args) => {
    const s = fmt(vm, f, args);
    const p = ptrOf(d.v);
    if (s.length + 1 > p.b.length - p.o) vm.oob(vm.line, `runtime error: sprintf() writes ${s.length + 1} bytes into a ${p.b.length - p.o}-byte buffer`, 'Use snprintf(buf, sizeof(buf), …) or make the buffer bigger.');
    writeCstr(p, s);
    return s.length;
  });
  R.fn('snprintf', 'int (any, size_t, cstr, ...)', (vm, d, n, f, args) => { const s = fmt(vm, f, args); writeCstr(ptrOf(d.v), s, n); return s.length; });
  const elemsOf = (a) => { const p = ptrOf(a.v); return p; };
  R.fn('memset', 'void* (any, int, size_t)', (vm, d, c, n) => {
    const p = elemsOf(d);
    const t = canon(d.t);
    const el = canon(t.of ?? t.to ?? vm.T.uchar);
    if (!Array.isArray(p.b) && el.k !== 'struct') { vm.warnOnce('memset', 'memset() on this kind of variable is not supported in the simulator'); return p; }
    const es = Math.max(1, sizeOf(el.k === 'array' ? el.of : el, vm.T));
    const bytes = new Array(es).fill(c & 255);
    for (let i = 0; i < Math.floor(n / es) && p.o + i < p.b.length; i++) {
      if (el.k === 'int' || el.k === 'float' || el.k === 'enum') p.b[p.o + i] = fromBytesLE(bytes, 0, el, vm.T);
    }
    return p;
  });
  R.fn('memcpy', 'void* (any, any, size_t)', (vm, d, s, n) => {
    const pd = elemsOf(d), ps = elemsOf(s);
    const el = canon(canon(d.t).of ?? canon(d.t).to);
    const es = Math.max(1, sizeOf(el, vm.T));
    for (let i = 0; i < Math.floor(n / es); i++) pd.b[pd.o + i] = ps.b[ps.o + i];
    return pd;
  });
  R.fn('memcmp', 'int (any, any, size_t)', (vm, a, b, n) => {
    const pa = elemsOf(a), pb = elemsOf(b);
    for (let i = 0; i < n; i++) { const x = (pa.b[pa.o + i] ?? 0) & 255, y = (pb.b[pb.o + i] ?? 0) & 255; if (x !== y) return x < y ? -1 : 1; }
    return 0;
  });

  // ---- String class
  const S = 'String';
  const txt = (vm, a) => {
    const t = canon(a.t);
    if (t.k === 'class' && t.cls.name === 'String') return a.v.s;
    if (t.k === 'array' || t.k === 'ptr') return cstr(a.v);
    if (t.k === 'int' && t.isChar) return String.fromCharCode(a.v & 255);
    return textOf(a.v, a.t, vm.T, { forString: true });
  };
  const toLong = (s) => atol(s);
  R.cls({
    name: S,
    cppName: 'String',
    sizeof: 6,
    copy: (v) => new AStr(v.s),
    construct: () => new AStr(''),
    printTo: (v) => v.s,
    methods: {
      length: M('unsigned int ()', (vm, s) => s.s.length),
      c_str: M('const char* ()', (vm, s) => new Ptr(charArray(s.s), 0)),
      charAt: M('char (unsigned int)', (vm, s, i) => (i < s.s.length ? (s.s.charCodeAt(i) << 24) >> 24 : 0)),
      setCharAt: M('void (unsigned int, char)', (vm, s, i, c) => { if (i < s.s.length) s.s = s.s.slice(0, i) + String.fromCharCode(c & 255) + s.s.slice(i + 1); }),
      concat: M('bool (any)', (vm, s, a) => { s.s += txt(vm, a); return 1; }),
      equals: M('bool (cstr)', (vm, s, o) => +(s.s === o)),
      equalsIgnoreCase: M('bool (cstr)', (vm, s, o) => +(s.s.toLowerCase() === o.toLowerCase())),
      compareTo: M('int (cstr)', (vm, s, o) => (s.s < o ? -1 : s.s > o ? 1 : 0)),
      startsWith: M(['bool (cstr)', 'bool (cstr, unsigned int)'], (vm, s, o, off = 0) => +(o.length > 0 && s.s.startsWith(o, off))),
      endsWith: M('bool (cstr)', (vm, s, o) => +(o.length > 0 && s.s.endsWith(o))),
      indexOf: M(['int (any)', 'int (any, unsigned int)'], (vm, s, a, from = 0) => s.s.indexOf(txt(vm, a), from)),
      lastIndexOf: M(['int (any)', 'int (any, unsigned int)'], (vm, s, a, from) => s.s.lastIndexOf(txt(vm, a), from ?? Infinity)),
      substring: M(['String (unsigned int)', 'String (unsigned int, unsigned int)'], (vm, s, a, b) => {
        const n = s.s.length;
        if (b === undefined) b = n;
        if (a > b) [a, b] = [b, a];
        if (a >= n) return new AStr('');
        return new AStr(s.s.slice(a, Math.min(b, n)));
      }),
      replace: M('void (any, any)', (vm, s, a, b) => { const x = txt(vm, a); if (x.length) s.s = s.s.split(x).join(txt(vm, b)); }),
      remove: M(['void (unsigned int)', 'void (unsigned int, unsigned int)'], (vm, s, i, n) => { if (i < s.s.length) s.s = s.s.slice(0, i) + (n === undefined ? '' : s.s.slice(i + n)); }),
      toLowerCase: M('void ()', (vm, s) => { s.s = s.s.replace(/[A-Z]/g, (c) => c.toLowerCase()); }),
      toUpperCase: M('void ()', (vm, s) => { s.s = s.s.replace(/[a-z]/g, (c) => c.toUpperCase()); }),
      trim: M('void ()', (vm, s) => { s.s = s.s.replace(/^[ \t\n\v\f\r]+|[ \t\n\v\f\r]+$/g, ''); }),
      toInt: M('long ()', (vm, s) => toLong(s.s)),
      toFloat: M('float ()', (vm, s) => Math.fround(atof(s.s))),
      toDouble: M('double ()', (vm, s) => atof(s.s)),
      reserve: M('bool (unsigned int)', () => 1),
      isEmpty: M('bool ()', (vm, s) => +(s.s.length === 0), { boards: ESP, boardsText: 'ESP32 / ESP8266' }),
      clear: M('void ()', (vm, s) => { s.s = ''; }, { boards: ESP, boardsText: 'ESP32 / ESP8266' }),
      getBytes: M('void (any, unsigned int)', (vm, s, buf, n) => writeCstr(ptrOf(buf.v), s.s, n)),
      toCharArray: M('void (any, unsigned int)', (vm, s, buf, n) => {
        const p = ptrOf(buf.v);
        if (n > p.b.length - p.o) vm.oob(vm.line, `runtime error: toCharArray() was told the buffer has ${n} bytes but it only has ${p.b.length - p.o}`, 'Pass sizeof(buffer) as the second argument.');
        writeCstr(p, s.s, n);
      }),
    },
  });

  // ---- Serial ports
  const portWrite = function* (vm, self, bytes) { yield* vm.uartWrite(self.n, bytes); };
  const src = {
    avail: (vm, self) => vm.uartFill(self.n).rx.length,
    readByte: (vm, self) => { const p = vm.uartFill(self.n); if (!p.rx.length) return -1; const c = p.rx.charCodeAt(0); p.rx = p.rx.slice(1); return c; },
    peekByte: (vm, self) => { const p = vm.uartFill(self.n); return p.rx.length ? p.rx.charCodeAt(0) : -1; },
    timeout: (vm, self) => vm.port(self.n).timeout,
    setTimeout: (vm, self, ms) => { vm.port(self.n).timeout = ms; },
  };
  const serialMethods = {
    ...printMethods(portWrite),
    ...streamMethods(src),
    begin: M(['void (unsigned long)', 'void (unsigned long, int)', 'void (unsigned long, int, int, int)'], (vm, self, baud) => {
      const p = vm.port(self.n);
      p.begun = true;
      p.baud = baud || 9600;
      vm.emit('baud', { port: self.n, baud: p.baud });
    }),
    end: M('void ()', (vm, self) => { vm.port(self.n).begun = false; }),
    flush: M('void ()', function* (vm, self) { const p = vm.port(self.n); if (p.txBusy > vm.us) yield* vm.sleep(p.txBusy - vm.us); }),
    availableForWrite: M('int ()', (vm, self) => { const p = vm.port(self.n); const byteUs = 1e7 / p.baud; return Math.max(0, 63 - Math.ceil(Math.max(0, p.txBusy - vm.us) / byteUs)); }),
    setRxBufferSize: M('size_t (size_t)', (vm, self, n) => n, { boards: ESP32 }),
    baudRate: M('uint32_t ()', (vm, self) => vm.port(self.n).baud, { boards: ESP32 }),
  };
  R.cls({ name: 'HardwareSerial', toBool: () => true, methods: serialMethods });
  R.obj('Serial', 'HardwareSerial', () => ({ n: 0 }));
  for (const n of [1, 2, 3]) R.obj(`Serial${n}`, 'HardwareSerial', () => ({ n }), { boards: SERIAL_BOARDS[n], boardsText: n === 3 ? 'Mega' : n === 2 ? 'Mega / ESP32' : 'Mega, ESP32, ESP8266 and Uno R4' });

  // ---- misc core
  R.fn('abort', 'void ()', (vm) => vm.fail('abort() was called'));
  R.fn('exit', 'void (int)', function* (vm) { yield* vm.waitFor(() => false); });
  R.fn('serialEvent', 'void ()', () => {}, { internal: true });
  void ALL; void Reset; void toBytesLE;
}

function pinCheck(name) {
  return ({ args, error, warn, T, board }) => {
    const p = args[0];
    if (p?.cv === undefined) return;
    if (p.cv < 0 || p.cv >= T.info.digitalCount + (board === 'esp32' ? 0 : 0)) warn(`${name}(${p.cv}, …): the ${T.info.name} has no pin ${p.cv}`);
    if (name === 'digitalWrite' && args[1]?.cv !== undefined && args[1].cv > 1 && canon(args[1].t).k === 'int' && !canon(args[1].t).isBool) warn(`digitalWrite() value ${args[1].cv}: any value other than 0 means HIGH`, 'digitalWrite() only knows HIGH and LOW. For brightness use analogWrite() on a PWM pin.');
    void error;
  };
}
