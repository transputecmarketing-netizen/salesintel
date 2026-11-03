// Emulated hardware libraries: Servo, Wire, LiquidCrystal_I2C, Adafruit_SSD1306 + GFX,
// Adafruit_NeoPixel, DHT, Stepper, EEPROM, Keypad, IRremote, RTClib, SPI, SD, LowPower.
// Each maps onto hal.devices (see docs/RUNTIME_API.md) and degrades to a no-op without one.
import { M, AVR, ESP32, ALL } from './registry.js';
import { printMethods, streamMethods } from './core.js';
import { AStr, Ptr, cstr, charArray } from '../values.js';
import { canon, sizeOf, toBytesLE, fromBytesLE } from '../types.js';
import { glyph } from '../../scene/modules/font5x7.js';

const H = (...names) => ({ header: names });

// ------------------------------------------------------------------ I²C presence
export function i2cDevice(vm, addr) {
  const d = vm.devices;
  const dev = d.i2c?.(addr);
  if (dev) return dev;
  if ((addr === 0x27 || addr === 0x3f) && d.lcd) return { builtin: 'lcd' };
  if ((addr === 0x3c || addr === 0x3d) && d.oled) return { builtin: 'oled' };
  if (addr === 0x68 && d.rtc) return { builtin: 'rtc' };
  return null;
}

export function addHardware(R) {
  // ================================================================ Servo
  R.header('Servo.h', { boards: ['uno', 'nano', 'mega', 'unor4', 'nodemcu'], alt: 'On the ESP32 use #include <ESP32Servo.h>.' });
  R.header('ESP32Servo.h', { boards: ESP32, alt: 'ESP32Servo is for ESP32 boards; on the Uno use #include <Servo.h>.' });
  R.cls({
    name: 'Servo',
    construct: () => ({ pin: -1, deg: 90, us: 1500, min: 544, max: 2400, dev: null }),
    methods: {
      attach: M(['uint8_t (int)', 'uint8_t (int, int, int)'], (vm, s, pin, min = 544, max = 2400) => {
        s.pin = pin; s.min = min; s.max = max;
        s.dev = vm.devices.servo?.(pin) ?? null;
        vm.servoPins ??= new Set();
        vm.servoPins.add(pin);
        vm.pinMode(pin, 1);
        if (vm.T.avr) vm.servoTimer1 = true;
        return 0;
      }),
      detach: M('void ()', (vm, s) => { vm.servoPins?.delete(s.pin); s.pin = -1; s.dev = null; }),
      attached: M('bool ()', (vm, s) => +(s.pin >= 0)),
      write: M('void (int)', (vm, s, v) => {
        if (v < 544) { v = Math.max(0, Math.min(180, v)); s.deg = v; s.us = Math.round(s.min + ((s.max - s.min) * v) / 180); }
        else { s.us = Math.max(s.min, Math.min(s.max, v)); s.deg = Math.round(((s.us - s.min) * 180) / (s.max - s.min)); }
        if (s.pin < 0) { vm.warnOnce('servo-attach', 'Servo.write() before attach(): the servo is not connected to a pin yet', 'Call myServo.attach(pin) in setup() first.'); return; }
        s.dev?.write(s.deg, s.us);
        vm.emit('pin', { pin: s.pin, kind: 'servo', value: s.deg });
      }),
      writeMicroseconds: M('void (int)', (vm, s, us) => {
        s.us = Math.max(s.min, Math.min(s.max, us));
        s.deg = Math.round(((s.us - s.min) * 180) / (s.max - s.min));
        s.dev?.write(s.deg, s.us);
        if (s.pin >= 0) vm.emit('pin', { pin: s.pin, kind: 'servo', value: s.deg });
      }),
      read: M('int ()', (vm, s) => s.deg),
      readMicroseconds: M('int ()', (vm, s) => s.us),
      setPeriodHertz: M('void (int)', () => {}, { boards: ESP32 }),
    },
  }, H('Servo.h', 'ESP32Servo.h'));

  // ================================================================ Wire
  R.header('Wire.h');
  const wireMethods = {
    begin: M(['void ()', 'void (int, int)', 'void (uint8_t)'], (vm, w) => { w.on = true; }),
    end: M('void ()', (vm, w) => { w.on = false; }),
    setClock: M('void (unsigned long)', () => {}),
    beginTransmission: M(['void (int)'], (vm, w, addr) => { w.addr = addr & 127; w.tx = []; w.txing = true; }),
    write: M(['size_t (any)', 'size_t (any, size_t)'], [
      (vm, w, a) => {
        const t = canon(a.t);
        if (t.k === 'array' || t.k === 'ptr') { const s = cstr(a.v); for (const c of s) w.tx.push(c.charCodeAt(0)); return s.length; }
        w.tx.push(a.v & 255);
        return 1;
      },
      (vm, w, a, n) => { const p = a.v instanceof Ptr ? a.v : new Ptr(a.v, 0); for (let i = 0; i < n; i++) w.tx.push((p.b[p.o + i] ?? 0) & 255); return n; },
    ]),
    endTransmission: M(['uint8_t ()', 'uint8_t (bool)'], (vm, w) => {
      if (!w.on) vm.warnOnce('wire-begin', 'Wire.endTransmission() before Wire.begin()', 'Call Wire.begin(); in setup() first.');
      w.txing = false;
      vm.us += 100 + w.tx.length * 90;
      const dev = i2cDevice(vm, w.addr);
      if (!dev) return 2; // NACK on address
      if (w.tx.length) { w.ptr[w.addr] = w.tx[0]; dev.write?.(w.tx); }
      return 0;
    }),
    requestFrom: M(['uint8_t (int, int)', 'uint8_t (int, int, int)'], (vm, w, addr, n) => {
      addr &= 127;
      vm.us += 100 + n * 90;
      const dev = i2cDevice(vm, addr);
      if (!dev || !dev.read) { w.rx = []; return 0; }
      const reg = w.ptr[addr] ?? 0;
      const bytes = [...(dev.read(reg, n) ?? [])].slice(0, n).map((x) => x & 255);
      w.ptr[addr] = reg + bytes.length;
      w.rx = bytes;
      return bytes.length;
    }),
    available: M('int ()', (vm, w) => w.rx.length),
    read: M('int ()', (vm, w) => (w.rx.length ? w.rx.shift() : -1)),
    peek: M('int ()', (vm, w) => (w.rx.length ? w.rx[0] : -1)),
    onReceive: M('void (fn)', () => {}),
    onRequest: M('void (fn)', () => {}),
  };
  R.cls({ name: 'TwoWire', methods: wireMethods });
  R.obj('Wire', 'TwoWire', () => ({ on: false, addr: 0, tx: [], rx: [], ptr: {} }), H('Wire.h'));
  R.obj('Wire1', 'TwoWire', () => ({ on: false, addr: 0, tx: [], rx: [], ptr: {} }), { header: ['Wire.h'], boards: ESP32 });

  // ================================================================ SPI (bus only)
  R.header('SPI.h');
  R.cls({
    name: 'SPIClass',
    methods: {
      begin: M(['void ()', 'void (int, int, int, int)'], () => {}),
      end: M('void ()', () => {}),
      transfer: M('uint8_t (uint8_t)', (vm) => { vm.us += 2; return 0xff; }),
      beginTransaction: M('void (any)', () => {}),
      endTransaction: M('void ()', () => {}),
      setClockDivider: M('void (uint8_t)', () => {}),
      setBitOrder: M('void (uint8_t)', () => {}),
      setDataMode: M('void (uint8_t)', () => {}),
    },
  });
  R.obj('SPI', 'SPIClass', () => ({}), H('SPI.h'));
  R.cls({ name: 'SPISettings', ctors: ['()', '(uint32_t, uint8_t, uint8_t)'], construct: () => ({}) }, H('SPI.h'));
  R.consts('int', { SPI_MODE0: 0, SPI_MODE1: 4, SPI_MODE2: 8, SPI_MODE3: 12, SPI_CLOCK_DIV2: 4, SPI_CLOCK_DIV4: 0, SPI_CLOCK_DIV8: 5, SPI_CLOCK_DIV16: 1 }, H('SPI.h'));

  // ================================================================ LiquidCrystal_I2C (HD44780 + PCF8574)
  R.header('LiquidCrystal_I2C.h');
  const ROWOFF = [0x00, 0x40, 0x14, 0x54];
  const lcdShow = (vm, l) => {
    if (!l.dev) return;
    for (let r = 0; r < l.rows; r++) {
      let s = '';
      for (let c = 0; c < l.cols; c++) {
        let a = ROWOFF[r] + c;
        // display shift moves the window over each 40-char line
        const line = a >= 0x40 ? 0x40 : 0;
        a = line + ((((a - line) + l.shift) % 40) + 40) % 40;
        const code = l.on ? l.ddram[a] : 32;
        s += lcdChar(code, l);
      }
      if (s !== l.shown[r]) { l.shown[r] = s; l.dev.print(r, 0, s); }
    }
  };
  function lcdChar(code, l) {
    if (code < 8) return l.cg[code] ?? '█';
    if (code === 0xdf) return '°';
    if (code === 0x7e) return '→';
    if (code === 0x7f) return '←';
    if (code === 0xff) return '█';
    if (code < 32 || code > 126) return '█';
    return String.fromCharCode(code);
  }
  const lcdWrite = (vm, l, bytes) => {
    if (!l.inited) { vm.warnOnce('lcd-init', 'lcd.print() before lcd.init(): the LCD has not been set up, so nothing appears', 'Call lcd.init(); (or lcd.begin();) and lcd.backlight(); in setup().'); return; }
    for (let i = 0; i < bytes.length; i++) {
      const c = bytes.charCodeAt(i);
      l.ddram[l.ac] = c;
      vm.us += 50;
      l.ac = l.ac === 0x27 ? 0x40 : l.ac === 0x67 ? 0x00 : l.ac + 1;
    }
    lcdShow(vm, l);
  };
  R.cls({
    name: 'LiquidCrystal_I2C',
    ctors: ['(uint8_t, uint8_t, uint8_t)'],
    construct: (vm, [addr, cols, rows]) => ({ addr, cols, rows, ddram: new Uint8Array(0x68).fill(32), ac: 0, shift: 0, on: true, inited: false, cg: {}, shown: [], dev: null, light: false }),
    methods: {
      ...printMethods(lcdWrite, { printfBoards: ESP32 }),
      init: M('void ()', (vm, l) => {
        l.dev = vm.devices.lcd?.(l.addr) ?? null;
        if (!i2cDevice(vm, l.addr)) vm.warnOnce('lcd-addr', `No I2C device answers at address 0x${l.addr.toString(16)}, so the LCD stays blank`, 'Common backpack addresses are 0x27 and 0x3F. Run an I2C scanner to find yours.');
        l.inited = true; l.ddram.fill(32); l.ac = 0; l.shift = 0; l.shown = [];
        vm.us += 50000;
        l.dev?.clear?.();
        lcdShow(vm, l);
      }),
      begin: M(['void ()', 'void (uint8_t, uint8_t)'], (vm, l) => { l.dev = vm.devices.lcd?.(l.addr) ?? null; l.inited = true; l.ddram.fill(32); l.ac = 0; l.shown = []; l.dev?.clear?.(); lcdShow(vm, l); }),
      clear: M('void ()', (vm, l) => { l.ddram.fill(32); l.ac = 0; l.shift = 0; vm.us += 2000; lcdShow(vm, l); }),
      home: M('void ()', (vm, l) => { l.ac = 0; l.shift = 0; vm.us += 2000; lcdShow(vm, l); }),
      setCursor: M('void (uint8_t, uint8_t)', (vm, l, c, r) => { if (r >= l.rows) r = l.rows - 1; l.ac = (ROWOFF[r] + c) & 0x7f; if (l.ac >= 0x68) l.ac = 0; }),
      backlight: M('void ()', (vm, l) => { l.light = true; l.dev?.backlight?.(true); }),
      noBacklight: M('void ()', (vm, l) => { l.light = false; l.dev?.backlight?.(false); }),
      setBacklight: M('void (uint8_t)', (vm, l, v) => { l.light = !!v; l.dev?.backlight?.(!!v); }),
      display: M('void ()', (vm, l) => { l.on = true; lcdShow(vm, l); }),
      noDisplay: M('void ()', (vm, l) => { l.on = false; lcdShow(vm, l); }),
      cursor: M('void ()', () => {}), noCursor: M('void ()', () => {}), blink: M('void ()', () => {}), noBlink: M('void ()', () => {}),
      scrollDisplayLeft: M('void ()', (vm, l) => { l.shift++; lcdShow(vm, l); }),
      scrollDisplayRight: M('void ()', (vm, l) => { l.shift--; lcdShow(vm, l); }),
      leftToRight: M('void ()', () => {}), rightToLeft: M('void ()', () => {}), autoscroll: M('void ()', () => {}), noAutoscroll: M('void ()', () => {}),
      createChar: M('void (uint8_t, any)', (vm, l, i, a) => {
        const p = a.v instanceof Ptr ? a.v : new Ptr(a.v, 0);
        const bytes = [];
        for (let k = 0; k < 8; k++) bytes.push((p.b[p.o + k] ?? 0) & 31);
        const slot = i & 7;
        l.cg[slot] = l.dev?.createChar?.(slot, bytes) ?? guessGlyph(bytes);
        l.shown = [];
        lcdShow(vm, l);
      }),
      printstr: M('void (cstr)', (vm, l, s) => lcdWrite(vm, l, s)),
    },
  }, H('LiquidCrystal_I2C.h'));

  // ================================================================ Adafruit_SSD1306 + GFX
  R.header('Adafruit_GFX.h');
  R.header('Adafruit_SSD1306.h');
  R.consts('int', { SSD1306_BLACK: 0, SSD1306_WHITE: 1, SSD1306_INVERSE: 2, BLACK: 0, WHITE: 1, INVERSE: 2, SSD1306_SWITCHCAPVCC: 2, SSD1306_EXTERNALVCC: 1 }, H('Adafruit_SSD1306.h'));
  const gfx = gfxMethods();
  R.cls({
    name: 'Adafruit_SSD1306',
    ctors: ['(uint8_t, uint8_t, any, int8_t = -1)', '(uint8_t, uint8_t)', '(int8_t)', '()'],
    construct: (vm, args, types, idx) => {
      const w = idx <= 1 ? args[0] : 128, h = idx <= 1 ? args[1] : idx === 2 ? 64 : 32;
      return { w, h, buf: new Uint8Array(w * h), cx: 0, cy: 0, size: 1, sizeY: 1, fg: 1, bg: 1, wrap: true, rot: 0, begun: false, dev: null, invert: false };
    },
    methods: {
      ...gfx,
      begin: M(['bool ()', 'bool (uint8_t)', 'bool (uint8_t, uint8_t)', 'bool (uint8_t, uint8_t, bool)', 'bool (uint8_t, uint8_t, bool, bool)'], (vm, d, vcc, addr = 0x3c) => {
        d.addr = addr; d.begun = true;
        d.dev = vm.devices.oled?.(addr) ?? null;
        vm.us += 100000;
        if (!i2cDevice(vm, addr)) vm.warnOnce('oled-addr', `No I2C device answers at 0x${addr.toString(16)}: the screen stays dark (begin() still returns true, as on real hardware)`, 'Most 128×64 OLEDs use 0x3C; some use 0x3D.');
        return 1;
      }),
      display: M('void ()', (vm, d) => {
        if (!d.begun) { vm.warnOnce('oled-begin', 'display.display() before display.begin()', 'Call display.begin(SSD1306_SWITCHCAPVCC, 0x3C) in setup().'); return; }
        vm.us += d.w * d.h / 8 * 25;
        if (d.dev) d.dev.show(d.invert ? d.buf.map((x) => 1 - x) : d.buf, d.w, d.h);
        vm.emit('oled', d);
      }),
      clearDisplay: M('void ()', (vm, d) => { d.buf.fill(0); }),
      invertDisplay: M('void (bool)', (vm, d, on) => { d.invert = !!on; if (d.dev) d.dev.show(d.invert ? d.buf.map((x) => 1 - x) : d.buf, d.w, d.h); }),
      dim: M('void (bool)', () => {}),
      ssd1306_command: M('void (uint8_t)', () => {}),
      startscrollright: M('void (uint8_t, uint8_t)', () => {}), startscrollleft: M('void (uint8_t, uint8_t)', () => {}),
      startscrolldiagright: M('void (uint8_t, uint8_t)', () => {}), startscrolldiagleft: M('void (uint8_t, uint8_t)', () => {}),
      stopscroll: M('void ()', () => {}),
      getPixel: M('bool (int16_t, int16_t)', (vm, d, x, y) => (x >= 0 && y >= 0 && x < d.w && y < d.h ? d.buf[y * d.w + x] : 0)),
    },
  }, H('Adafruit_SSD1306.h'));

  // ================================================================ Adafruit_NeoPixel
  R.header('Adafruit_NeoPixel.h');
  R.consts('int', { NEO_GRB: 0x52, NEO_RGB: 0x06, NEO_GRBW: 0xd2, NEO_RGBW: 0xc6, NEO_BRG: 0x58, NEO_KHZ800: 0x0000, NEO_KHZ400: 0x0100 }, H('Adafruit_NeoPixel.h'));
  const GAMMA = Array.from({ length: 256 }, (_, i) => Math.floor(Math.pow(i / 255, 2.6) * 255 + 0.5));
  const colorHSV = (hue, sat = 255, val = 255) => {
    let r, g, b;
    hue = Math.floor(((hue & 0xffff) * 1530 + 32768) / 65536);
    if (hue < 510) { b = 0; if (hue < 255) { r = 255; g = hue; } else { r = 510 - hue; g = 255; } }
    else if (hue < 1020) { r = 0; if (hue < 765) { g = 255; b = hue - 510; } else { g = 1020 - hue; b = 255; } }
    else if (hue < 1530) { g = 0; if (hue < 1275) { r = hue - 1020; b = 255; } else { r = 255; b = 1530 - hue; } }
    else { r = 255; g = b = 0; }
    const v1 = 1 + val, s1 = 1 + sat, s2 = 255 - sat;
    return ((((((r * s1) >> 8) + s2) * v1) & 0xff00) << 8 | (((((g * s1) >> 8) + s2) * v1) & 0xff00) | (((((b * s1) >> 8) + s2) * v1) >> 8)) >>> 0;
  };
  const npSet = (p, i, r, g, b) => {
    if (i < 0 || i >= p.n) return;
    if (p.bright) { r = (r * p.bright) >> 8; g = (g * p.bright) >> 8; b = (b * p.bright) >> 8; }
    p.px[i * 3] = r; p.px[i * 3 + 1] = g; p.px[i * 3 + 2] = b;
  };
  R.cls({
    name: 'Adafruit_NeoPixel',
    ctors: ['(uint16_t, int16_t, uint16_t = 82)', '()'],
    construct: (vm, args) => ({ n: args[0] ?? 0, pin: args[1] ?? -1, px: new Uint8Array((args[0] ?? 0) * 3), bright: 0, dev: null, begun: false }),
    methods: {
      begin: M('void ()', (vm, p) => { p.begun = true; p.dev = vm.devices.neopixel?.(p.pin, p.n) ?? null; vm.pinMode(p.pin, 1); }),
      show: M('void ()', (vm, p) => {
        if (!p.begun) vm.warnOnce('np-begin', 'strip.show() before strip.begin()', 'Call strip.begin(); in setup().');
        vm.us += p.n * 30 + 50;
        p.dev?.show([...p.px]);
        vm.emit('pin', { pin: p.pin, kind: 'neopixel', value: p.n });
      }),
      setPixelColor: M(['void (uint16_t, uint8_t, uint8_t, uint8_t)', 'void (uint16_t, uint8_t, uint8_t, uint8_t, uint8_t)', 'void (uint16_t, uint32_t)'], [
        (vm, p, i, r, g, b) => npSet(p, i, r, g, b),
        (vm, p, i, r, g, b) => npSet(p, i, r, g, b),
        (vm, p, i, c) => npSet(p, i, (c >>> 16) & 255, (c >>> 8) & 255, c & 255),
      ]),
      getPixelColor: M('uint32_t (uint16_t)', (vm, p, i) => {
        if (i >= p.n) return 0;
        let [r, g, b] = [p.px[i * 3], p.px[i * 3 + 1], p.px[i * 3 + 2]];
        if (p.bright) { r = Math.floor((r << 8) / p.bright); g = Math.floor((g << 8) / p.bright); b = Math.floor((b << 8) / p.bright); }
        return ((r << 16) | (g << 8) | b) >>> 0;
      }),
      fill: M(['void ()', 'void (uint32_t)', 'void (uint32_t, uint16_t)', 'void (uint32_t, uint16_t, uint16_t)'], (vm, p, c = 0, first = 0, count = 0) => {
        if (first >= p.n) return;
        const end = count === 0 ? p.n : Math.min(p.n, first + count);
        for (let i = first; i < end; i++) npSet(p, i, (c >>> 16) & 255, (c >>> 8) & 255, c & 255);
      }),
      clear: M('void ()', (vm, p) => p.px.fill(0)),
      setBrightness: M('void (uint8_t)', (vm, p, b) => {
        const nb = (b + 1) & 255;
        if (nb !== p.bright) {
          const old = (p.bright - 1) & 255;
          const scale = old === 0 ? 0 : b === 255 ? Math.floor(65535 / old) : Math.floor(((nb << 8) - 1) / old);
          for (let i = 0; i < p.px.length; i++) p.px[i] = (p.px[i] * scale) >> 8;
          p.bright = nb;
        }
      }),
      getBrightness: M('uint8_t ()', (vm, p) => (p.bright - 1) & 255),
      numPixels: M('uint16_t ()', (vm, p) => p.n),
      updateLength: M('void (uint16_t)', (vm, p, n) => { p.n = n; p.px = new Uint8Array(n * 3); }),
      setPin: M('void (int16_t)', (vm, p, pin) => { p.pin = pin; }),
      canShow: M('bool ()', () => 1),
      Color: M(['uint32_t (uint8_t, uint8_t, uint8_t)', 'uint32_t (uint8_t, uint8_t, uint8_t, uint8_t)'], (vm, p, r, g, b, w = 0) => (((w << 24) | (r << 16) | (g << 8) | b) >>> 0)),
      ColorHSV: M(['uint32_t (uint16_t)', 'uint32_t (uint16_t, uint8_t)', 'uint32_t (uint16_t, uint8_t, uint8_t)'], (vm, p, h, s, v) => colorHSV(h, s, v)),
      gamma32: M('uint32_t (uint32_t)', (vm, p, c) => ((GAMMA[(c >>> 24) & 255] << 24) | (GAMMA[(c >>> 16) & 255] << 16) | (GAMMA[(c >>> 8) & 255] << 8) | GAMMA[c & 255]) >>> 0),
      gamma8: M('uint8_t (uint8_t)', (vm, p, x) => GAMMA[x & 255]),
      sine8: M('uint8_t (uint8_t)', (vm, p, x) => Math.round(127.5 + 127.5 * Math.sin(((x & 255) / 256) * 2 * Math.PI - Math.PI / 2)) & 255),
      rainbow: M(['void ()', 'void (uint16_t)', 'void (uint16_t, int8_t)', 'void (uint16_t, int8_t, uint8_t, uint8_t, bool)'], (vm, p, first = 0, reps = 1, sat = 255, bri = 255, gam = 1) => {
        for (let i = 0; i < p.n; i++) {
          const hue = (first + Math.floor((i * reps * 65536) / p.n)) & 0xffff;
          let c = colorHSV(hue, sat, bri);
          if (gam) c = ((GAMMA[(c >>> 16) & 255] << 16) | (GAMMA[(c >>> 8) & 255] << 8) | GAMMA[c & 255]) >>> 0;
          npSet(p, i, (c >>> 16) & 255, (c >>> 8) & 255, c & 255);
        }
      }),
    },
  }, H('Adafruit_NeoPixel.h'));

  // ================================================================ DHT
  R.header('DHT.h');
  R.header('DHT_U.h');
  R.consts('int', { DHT11: 11, DHT12: 12, DHT21: 21, DHT22: 22, AM2301: 21 }, H('DHT.h', 'DHT_U.h'));
  const dhtRead = (vm, d, force) => {
    const now = vm.millis();
    if (!force && d.last !== null && now - d.last < 2000) return d.ok;
    d.last = now;
    vm.us += 5000;
    const dev = d.dev;
    if (!d.begun) { d.ok = false; return false; }
    if (!dev) { d.ok = false; return false; }
    let t = dev.temperature?.(), h = dev.humidity?.();
    if (t == null || h == null || Number.isNaN(t) || Number.isNaN(h)) { d.ok = false; return false; }
    if (d.type === 11) { h = Math.max(0, Math.min(99, Math.round(h))); t = Math.round(t * 10) / 10; }
    else { h = Math.round(h * 10) / 10; t = Math.round(t * 10) / 10; }
    d.t = Math.fround(t); d.h = Math.fround(h); d.ok = true;
    return true;
  };
  R.cls({
    name: 'DHT',
    ctors: ['(uint8_t, uint8_t)', '(uint8_t, uint8_t, uint8_t)'],
    construct: (vm, [pin, type]) => ({ pin, type, t: NaN, h: NaN, ok: false, last: null, begun: false, dev: null }),
    methods: {
      begin: M(['void ()', 'void (uint8_t)'], (vm, d) => { d.begun = true; d.dev = vm.devices.dht?.(d.pin, d.type) ?? null; d.last = null; }),
      read: M(['bool ()', 'bool (bool)'], (vm, d, force = 0) => +dhtRead(vm, d, force)),
      readTemperature: M(['float ()', 'float (bool)', 'float (bool, bool)'], (vm, d, F = 0, force = 0) => {
        if (!dhtRead(vm, d, force)) return NaN;
        return F ? Math.fround(d.t * 1.8 + 32) : d.t;
      }),
      readHumidity: M(['float ()', 'float (bool)'], (vm, d, force = 0) => (dhtRead(vm, d, force) ? d.h : NaN)),
      computeHeatIndex: M(['float (float, float)', 'float (float, float, bool)'], (vm, d, t, h, isF = 1) => Math.fround(heatIndex(t, h, !!isF))),
      convertCtoF: M('float (float)', (vm, d, c) => Math.fround(c * 1.8 + 32)),
      convertFtoC: M('float (float)', (vm, d, f) => Math.fround((f - 32) * 0.55555)),
    },
  }, H('DHT.h', 'DHT_U.h'));

  // ================================================================ Stepper
  R.header('Stepper.h');
  const STEP4 = [[1, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 1], [1, 0, 0, 1]];
  const STEP2 = [[0, 1], [1, 1], [1, 0], [0, 0]];
  R.cls({
    name: 'Stepper',
    ctors: ['(int, int, int)', '(int, int, int, int, int)'],
    construct: (vm, args) => ({ steps: args[0], pins: args.slice(1), n: 0, delay: 0, last: 0, dev: null }),
    methods: {
      setSpeed: M('void (long)', (vm, s, rpm) => {
        if (rpm <= 0) { vm.warnOnce('stepper-speed', 'Stepper.setSpeed() needs a speed above 0 rpm'); return; }
        s.delay = Math.floor((60 * 1000 * 1000) / s.steps / rpm);
      }),
      step: M('void (int)', function* (vm, s, n) {
        if (!s.delay) { vm.warnOnce('stepper-nospeed', 'Stepper.step() before setSpeed(): the library divides by zero speed', 'Call motor.setSpeed(rpm); first.'); s.delay = 1; }
        s.dev ??= vm.devices.stepper?.(s.pins) ?? null;
        const dir = n > 0 ? 1 : -1;
        let left = Math.abs(n);
        while (left > 0) {
          const now = vm.micros();
          const wait = s.delay - ((now - s.last) >>> 0);
          if (wait > 0) yield* vm.sleep(wait);
          s.last = vm.micros();
          if (dir > 0) { s.n++; if (s.n === s.steps) s.n = 0; }
          else { if (s.n === 0) s.n = s.steps; s.n--; }
          left--;
          const seq = s.pins.length === 4 ? STEP4[s.n % 4] : STEP2[s.n % 4];
          seq.forEach((v, i) => vm.digitalWrite(s.pins[i], v));
          s.dev?.step(dir);
        }
      }),
      version: M('int ()', () => 5),
    },
  }, H('Stepper.h'));

  // ================================================================ EEPROM
  R.header('EEPROM.h');
  const eeData = (vm) => vm.lib('eeprom', () => {
    const size = vm.info.eeprom;
    const dev = vm.devices.eeprom;
    if (dev instanceof Uint8Array) return dev;
    return new Uint8Array(size).fill(0xff);
  });
  const eeCheck = (vm, addr, n = 1) => {
    const d = eeData(vm);
    if (addr < 0 || addr + n > d.length) { vm.oob(vm.line, `EEPROM address ${addr} is outside 0–${d.length - 1}`, `The ${vm.info.name} has ${d.length} bytes of EEPROM.`); return false; }
    if (vm.info.arch === 'esp32' && !vm.eepromBegun) vm.warnOnce('ee-begin', 'On the ESP32, call EEPROM.begin(size) before using EEPROM, and EEPROM.commit() to save');
    return true;
  };
  const eeWrite = (vm, addr, v) => {
    if (!eeCheck(vm, addr)) return;
    const d = eeData(vm);
    if (vm.T.avr) vm.us += 3400; // each byte write takes 3.3 ms on the ATmega
    d[addr] = v & 255;
    vm.emit('eeprom', { addr, value: v & 255 });
  };
  R.cls({
    name: 'EEPROMClass',
    index: { type: 'uint8_t', container: (vm) => eeData(vm) },
    methods: {
      read: M('uint8_t (int)', (vm, e, a) => (eeCheck(vm, a) ? eeData(vm)[a] : 0)),
      write: M('void (int, uint8_t)', (vm, e, a, v) => eeWrite(vm, a, v)),
      update: M('void (int, uint8_t)', (vm, e, a, v) => { if (eeCheck(vm, a) && eeData(vm)[a] !== (v & 255)) eeWrite(vm, a, v); }),
      put: M('void (int, any)', (vm, e, a, val) => {
        const bytes = toBytesLE(val.v, val.t, vm.T);
        if (!eeCheck(vm, a, bytes.length)) return;
        const d = eeData(vm);
        bytes.forEach((b, i) => { if (d[a + i] !== b) eeWrite(vm, a + i, b); });
      }),
      get: M('void (int, any&)', (vm, e, a, r) => {
        const n = sizeOf(r.t, vm.T);
        if (!eeCheck(vm, a, n)) return;
        r.ref.b[r.ref.o] = fromBytesLE(eeData(vm), a, r.t, vm.T);
      }),
      length: M('uint16_t ()', (vm) => eeData(vm).length),
      begin: M('bool (size_t)', (vm) => { vm.eepromBegun = true; return 1; }, { boards: ['esp32', 'nodemcu'] }),
      commit: M('bool ()', (vm) => { vm.emit('eeprom', { commit: true }); return 1; }, { boards: ['esp32', 'nodemcu'] }),
      end: M('void ()', () => {}),
    },
  });
  R.obj('EEPROM', 'EEPROMClass', () => ({}), H('EEPROM.h'));

  // ================================================================ Keypad
  R.header('Keypad.h');
  R.special('makeKeymap', H('Keypad.h'));
  R.konst('NO_KEY', 'char', 0, H('Keypad.h'));
  R.consts('int', { IDLE: 0, PRESSED: 1, HOLD: 2, RELEASED: 3 }, H('Keypad.h'));
  const keyFromDevice = (k, raw) => {
    if (raw == null || raw === 0 || raw === '') return 0;
    if (typeof raw === 'object' && 'row' in raw) return k.map[raw.row]?.[raw.col] ?? 0;
    const code = typeof raw === 'string' ? raw.charCodeAt(0) : raw;
    return code;
  };
  R.cls({
    name: 'Keypad',
    ctors: ['(any, any, any, uint8_t, uint8_t)'],
    construct: (vm, args) => {
      const [map, rows, cols, nr, nc] = args;
      const grid = [];
      const m = map.v instanceof Ptr ? map.v.b : map.v;
      for (let r = 0; r < nr; r++) grid.push(Array.from({ length: nc }, (_, c) => (Array.isArray(m?.[0]) ? m[r]?.[c] : m?.[r * nc + c]) ?? 0));
      return { map: grid, rows: rows.v, cols: cols.v, nr, nc, last: 0, state: 0, dev: null };
    },
    copy: (k) => k,
    methods: {
      getKey: M('char ()', (vm, k) => {
        k.dev ??= vm.devices.keypad?.() ?? null;
        vm.us += 200;
        const key = keyFromDevice(k, k.dev?.getKey?.());
        if (key) { k.last = key; k.state = 1; }
        return (key << 24) >> 24;
      }),
      waitForKey: M('char ()', function* (vm, k) {
        k.dev ??= vm.devices.keypad?.() ?? null;
        for (;;) {
          const key = keyFromDevice(k, k.dev?.getKey?.());
          if (key) { k.last = key; return (key << 24) >> 24; }
          yield* vm.sleep(10000);
        }
      }),
      getState: M('int ()', (vm, k) => (k.dev?.isPressed?.() ? 1 : 0)),
      isPressed: M('bool (char)', (vm, k, c) => +(k.dev?.isPressed?.(String.fromCharCode(c & 255)) ?? false)),
      setDebounceTime: M('void (unsigned int)', () => {}),
      setHoldTime: M('void (unsigned int)', () => {}),
      keyStateChanged: M('bool ()', () => 0),
      addEventListener: M('void (fn)', (vm) => vm.warnOnce('kp-event', 'Keypad event listeners are not supported in the simulator yet; use getKey() in loop()')),
    },
  }, H('Keypad.h'));

  // ================================================================ IRremote (v4 API)
  R.header('IRremote.hpp');
  R.header('IRremote.h');
  R.struct('IRData', { protocol: 'int', address: 'uint16_t', command: 'uint16_t', extra: 'uint16_t', numberOfBits: 'uint16_t', flags: 'uint8_t', decodedRawData: 'uint32_t' }, H('IRremote.hpp', 'IRremote.h'));
  R.consts('int', { IRDATA_FLAGS_IS_REPEAT: 0x01, IRDATA_FLAGS_IS_AUTO_REPEAT: 0x02, IRDATA_FLAGS_PARITY_FAILED: 0x04, UNKNOWN: 0, NEC: 8, SONY: 19, SAMSUNG: 17, RC5: 15 }, H('IRremote.hpp', 'IRremote.h'));
  R.consts('bool', { ENABLE_LED_FEEDBACK: 1, DISABLE_LED_FEEDBACK: 0, USE_DEFAULT_FEEDBACK_LED_PIN: 0 }, H('IRremote.hpp', 'IRremote.h'));
  R.cls({
    name: 'IRrecv',
    fields: { decodedIRData: 'IRData' },
    methods: {
      begin: M(['void (uint8_t)', 'void (uint8_t, bool)', 'void (uint8_t, bool, uint8_t)'], (vm, ir, pin) => { ir.pin = pin; ir.dev = vm.devices.ir?.(pin) ?? null; ir.on = true; ir.locked = false; }),
      enableIRIn: M('void ()', (vm, ir) => { ir.on = true; }),
      start: M('void ()', (vm, ir) => { ir.on = true; }),
      stop: M('void ()', (vm, ir) => { ir.on = false; }),
      decode: M('bool ()', (vm, ir) => {
        if (!ir.on || ir.locked || !ir.dev) return 0;
        const f = ir.dev.next?.();
        if (!f) return 0;
        const addr = f.address ?? 0, cmd = f.command ?? 0;
        const d = ir.decodedIRData;
        d.protocol = f.protocol ?? 8; d.address = addr & 0xffff; d.command = cmd & 0xffff; d.numberOfBits = 32;
        d.flags = f.repeat ? 1 : 0;
        d.decodedRawData = f.repeat ? 0 : (((~cmd & 0xff) << 24) | ((cmd & 0xff) << 16) | ((~addr & 0xff) << 8) | (addr & 0xff)) >>> 0;
        ir.locked = true;
        vm.us += 200;
        return 1;
      }),
      resume: M('void ()', (vm, ir) => { ir.locked = false; }),
      isIdle: M('bool ()', () => 1),
      printIRResultShort: M(['void (any)', 'void (any, bool)'], function* (vm, ir) {
        const d = ir.decodedIRData;
        const name = { 8: 'NEC', 19: 'SONY', 17: 'SAMSUNG', 15: 'RC5' }[d.protocol] ?? 'UNKNOWN';
        const hex = (x) => '0x' + x.toString(16).toUpperCase();
        yield* vm.uartWrite(0, `Protocol=${name} Address=${hex(d.address)} Command=${hex(d.command)}${d.flags & 1 ? ' Repeat gap=110000us' : ` Raw-Data=${hex(d.decodedRawData)} 32 bits LSB first`}\r\n`);
      }),
    },
  }, H('IRremote.hpp', 'IRremote.h'));
  R.obj('IrReceiver', 'IRrecv', () => ({ on: false, locked: false, dev: null, decodedIRData: { protocol: 0, address: 0, command: 0, extra: 0, numberOfBits: 0, flags: 0, decodedRawData: 0 } }), H('IRremote.hpp', 'IRremote.h'));

  // ================================================================ RTClib
  R.header('RTClib.h');
  const DAYS_SEC = 86400;
  const dt = (sec) => ({ sec: Math.floor(sec) });
  const parts = (d) => { const x = new Date(d.sec * 1000); return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate(), H: x.getUTCHours(), M: x.getUTCMinutes(), S: x.getUTCSeconds(), w: x.getUTCDay() }; };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  R.cls({
    name: 'DateTime',
    ctors: ['()', '(uint32_t)', '(uint16_t, uint8_t, uint8_t)', '(uint16_t, uint8_t, uint8_t, uint8_t, uint8_t, uint8_t)', '(cstr, cstr)'],
    construct: (vm, args, types, idx) => {
      if (idx === 0) return dt(946684800);
      if (idx === 1) return dt(args[0]);
      if (idx === 4) {
        const [ds, ts] = args;
        const m = /(\w{3})\s+(\d+)\s+(\d{4})/.exec(ds) ?? [];
        const t = /(\d+):(\d+):(\d+)/.exec(ts) ?? [];
        return dt(Date.UTC(+m[3] || 2000, Math.max(0, MONTHS.indexOf(m[1])), +m[2] || 1, +t[1] || 0, +t[2] || 0, +t[3] || 0) / 1000);
      }
      let [y, mo, d, h = 0, mi = 0, s = 0] = args;
      if (y < 100) y += 2000;
      return dt(Date.UTC(y, mo - 1, d, h, mi, s) / 1000);
    },
    printTo: (d) => { const p = parts(d); const z = (x) => String(x).padStart(2, '0'); return `${p.y}-${z(p.m)}-${z(p.d)}T${z(p.H)}:${z(p.M)}:${z(p.S)}`; },
    inspect: (d) => { const p = parts(d); const z = (x) => String(x).padStart(2, '0'); return { value: `${p.y}-${z(p.m)}-${z(p.d)} ${z(p.H)}:${z(p.M)}:${z(p.S)}` }; },
    ops: { '+': { ret: 'DateTime', fn: (a, b) => dt(a.sec + (b.sec ?? b)) }, '-': { ret: 'DateTime', fn: (a, b) => dt(a.sec - (b.sec ?? b)) } },
    methods: {
      year: M('uint16_t ()', (vm, d) => parts(d).y),
      month: M('uint8_t ()', (vm, d) => parts(d).m),
      day: M('uint8_t ()', (vm, d) => parts(d).d),
      hour: M('uint8_t ()', (vm, d) => parts(d).H),
      minute: M('uint8_t ()', (vm, d) => parts(d).M),
      second: M('uint8_t ()', (vm, d) => parts(d).S),
      dayOfTheWeek: M('uint8_t ()', (vm, d) => parts(d).w),
      unixtime: M('uint32_t ()', (vm, d) => d.sec >>> 0),
      secondstime: M('uint32_t ()', (vm, d) => (d.sec - 946684800) >>> 0),
      isValid: M('bool ()', () => 1),
      timestamp: M(['String ()', 'String (int)'], (vm, d) => { const p = parts(d); const z = (x) => String(x).padStart(2, '0'); return new AStr(`${p.y}-${z(p.m)}-${z(p.d)}T${z(p.H)}:${z(p.M)}:${z(p.S)}`); }),
    },
  }, H('RTClib.h'));
  R.cls({ name: 'TimeSpan', ctors: ['(int32_t)', '(int16_t, int8_t, int8_t, int8_t)'], construct: (vm, a, t, idx) => ({ sec: idx === 0 ? a[0] : a[0] * DAYS_SEC + a[1] * 3600 + a[2] * 60 + a[3] }) }, H('RTClib.h'));
  const rtcNow = (vm) => {
    const st = vm.lib('rtc', () => {
      const dev = vm.devices.rtc;
      const real = dev?.now?.();
      let base;
      if (real instanceof Date) base = Date.UTC(real.getFullYear(), real.getMonth(), real.getDate(), real.getHours(), real.getMinutes(), real.getSeconds()) / 1000;
      else if (typeof real === 'number') base = real;
      else { const n = new Date(); base = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate(), n.getHours(), n.getMinutes(), n.getSeconds()) / 1000; }
      return { base, at: vm.us, lost: !!dev?.lostPower };
    });
    return st.base + Math.floor((vm.us - st.at) / 1e6);
  };
  const rtcMethods = {
    begin: M(['bool ()', 'bool (any)'], (vm) => { vm.us += 500; return +!!i2cDevice(vm, 0x68); }),
    lostPower: M('bool ()', (vm) => { rtcNow(vm); return +vm.lib('rtc', () => ({})).lost; }),
    isrunning: M('bool ()', (vm) => { rtcNow(vm); return +!vm.lib('rtc', () => ({})).lost; }),
    adjust: M('void (DateTime)', (vm, r, d) => { rtcNow(vm); const st = vm.lib('rtc', () => ({})); st.base = d.sec; st.at = vm.us; st.lost = false; vm.devices.rtc?.adjust?.(d.sec); }),
    now: M('DateTime ()', (vm) => { vm.us += 800; return dt(rtcNow(vm)); }),
    getTemperature: M('float ()', (vm) => Math.fround(Math.round((vm.devices.rtc?.temperature?.() ?? 22.25) * 4) / 4)),
  };
  R.cls({ name: 'RTC_DS3231', methods: rtcMethods, construct: () => ({}) }, H('RTClib.h'));
  R.cls({ name: 'RTC_DS1307', methods: rtcMethods, construct: () => ({}) }, H('RTClib.h'));
  R.cls({ name: 'RTC_PCF8523', methods: rtcMethods, construct: () => ({}) }, H('RTClib.h'));

  // ================================================================ SD
  R.header('SD.h');
  R.consts('int', { FILE_READ: 1, FILE_WRITE: 0x13, O_READ: 1, O_WRITE: 2, O_APPEND: 4, O_CREAT: 0x10 }, H('SD.h'));
  const fs = (vm) => vm.lib('sd', () => {
    const dev = vm.devices.sd;
    return { files: dev?.files instanceof Map ? dev.files : new Map(), present: !!dev, begun: false };
  });
  const key = (name) => String(name).replace(/^\/+/, '').toUpperCase();
  const fileWrite = (vm, f, bytes) => {
    if (!f.open || !f.write) return 0;
    const F = fs(vm);
    const cur = F.files.get(f.key) ?? '';
    F.files.set(f.key, cur.slice(0, f.pos) + bytes + cur.slice(f.pos + bytes.length));
    f.pos += bytes.length;
    vm.us += 20 * bytes.length;
    vm.emit('sd', { file: f.key });
    return bytes.length;
  };
  const fileSrc = {
    avail: (vm, f) => (f.open ? Math.max(0, (fs(vm).files.get(f.key) ?? '').length - f.pos) : 0),
    readByte: (vm, f) => { const s = fs(vm).files.get(f.key) ?? ''; if (!f.open || f.pos >= s.length) return -1; return s.charCodeAt(f.pos++); },
    peekByte: (vm, f) => { const s = fs(vm).files.get(f.key) ?? ''; return f.open && f.pos < s.length ? s.charCodeAt(f.pos) : -1; },
    timeout: () => 0,
  };
  R.cls({
    name: 'File',
    construct: () => ({ open: false, key: '', pos: 0 }),
    toBool: (f) => !!f?.open,
    copy: (f) => f,
    methods: {
      ...printMethods((vm, f, b) => fileWrite(vm, f, b), { printfBoards: ESP32 }),
      ...streamMethods(fileSrc),
      size: M('uint32_t ()', (vm, f) => (fs(vm).files.get(f.key) ?? '').length),
      position: M('uint32_t ()', (vm, f) => f.pos),
      seek: M('bool (uint32_t)', (vm, f, p) => { f.pos = Math.min(p, (fs(vm).files.get(f.key) ?? '').length); return 1; }),
      close: M('void ()', (vm, f) => { f.open = false; }),
      flush: M('void ()', () => {}),
      name: M('char* ()', (vm, f) => new Ptr(charArray(f.key), 0)),
      isDirectory: M('bool ()', () => 0),
    },
  }, H('SD.h'));
  R.cls({
    name: 'SDClass',
    methods: {
      begin: M(['bool ()', 'bool (uint8_t)'], (vm) => { const F = fs(vm); vm.us += 20000; F.begun = F.present; return +F.present; }),
      open: M(['File (cstr)', 'File (cstr, uint8_t)'], (vm, sd, name, mode = 1) => {
        const F = fs(vm);
        const k = key(name);
        if (!F.begun) return { open: false, key: k, pos: 0 };
        const w = (mode & 2) !== 0 || mode === 0x13;
        if (!F.files.has(k)) { if (!w) return { open: false, key: k, pos: 0 }; F.files.set(k, ''); }
        return { open: true, key: k, pos: w ? F.files.get(k).length : 0, write: w };
      }),
      exists: M('bool (cstr)', (vm, sd, name) => +fs(vm).files.has(key(name))),
      remove: M('bool (cstr)', (vm, sd, name) => +fs(vm).files.delete(key(name))),
      mkdir: M('bool (cstr)', () => 1),
      rmdir: M('bool (cstr)', () => 1),
    },
  });
  R.obj('SD', 'SDClass', () => ({}), H('SD.h'));

  // ================================================================ LowPower (Rocket Scream)
  R.header('LowPower.h', { boards: AVR, alt: 'LowPower.h is for AVR boards (Uno, Nano, Mega). On the ESP32 use esp_deep_sleep_start().' });
  const periods = { SLEEP_15MS: 0, SLEEP_30MS: 1, SLEEP_60MS: 2, SLEEP_120MS: 3, SLEEP_250MS: 4, SLEEP_500MS: 5, SLEEP_1S: 6, SLEEP_2S: 7, SLEEP_4S: 8, SLEEP_8S: 9, SLEEP_FOREVER: 10 };
  R.consts('int', periods, H('LowPower.h'));
  R.consts('int', { ADC_OFF: 0, ADC_ON: 1, BOD_OFF: 0, BOD_ON: 1, TIMER2_OFF: 0, TIMER2_ON: 1, TIMER1_OFF: 0, TIMER1_ON: 1, TIMER0_OFF: 0, TIMER0_ON: 1, SPI_OFF: 0, SPI_ON: 1, USART0_OFF: 0, USART0_ON: 1, TWI_OFF: 0, TWI_ON: 1, TIMER5_OFF: 0, TIMER4_OFF: 0, TIMER3_OFF: 0, USART3_OFF: 0, USART2_OFF: 0, USART1_OFF: 0 }, H('LowPower.h'));
  const PERIOD_MS = [15, 30, 60, 120, 250, 500, 1000, 2000, 4000, 8000, Infinity];
  function* sleepAvr(vm, period, stopsTimer0) {
    const seq = vm.irqSeq;
    const start = vm.us;
    vm.emit('sleep', { mode: 'powerDown', ms: PERIOD_MS[period] });
    const max = PERIOD_MS[period] * 1000;
    yield* vm.waitFor(() => vm.irqSeq !== seq, max, 1000);
    if (stopsTimer0) vm.frozenUs += vm.us - start; // Timer0 is stopped: millis() does not advance while asleep
    vm.emit('wake', {});
  }
  R.cls({
    name: 'LowPowerClass',
    methods: {
      powerDown: M('void (int, int, int)', function* (vm, lp, p) { yield* sleepAvr(vm, p, true); }),
      powerSave: M('void (int, int, int, int)', function* (vm, lp, p) { yield* sleepAvr(vm, p, true); }),
      powerStandby: M('void (int, int, int)', function* (vm, lp, p) { yield* sleepAvr(vm, p, true); }),
      powerExtStandby: M('void (int, int, int, int)', function* (vm, lp, p) { yield* sleepAvr(vm, p, true); }),
      idle: M('void (int, ...)', function* (vm, lp, p) { yield* sleepAvr(vm, p, false); }),
      adcNoiseReduction: M('void (int, int, int)', function* (vm, lp, p) { yield* sleepAvr(vm, p, true); }),
    },
  });
  R.obj('LowPower', 'LowPowerClass', () => ({}), H('LowPower.h'));
  void ALL;
}

// ------------------------------------------------------------------ GFX drawing (shared by displays)
function gfxMethods() {
  const px = (d, x, y, c) => {
    x = Math.trunc(x); y = Math.trunc(y);
    // rotation
    let X = x, Y = y;
    const r = d.rot & 3;
    if (r === 1) { X = d.w - 1 - y; Y = x; } else if (r === 2) { X = d.w - 1 - x; Y = d.h - 1 - y; } else if (r === 3) { X = y; Y = d.h - 1 - x; }
    if (X < 0 || Y < 0 || X >= d.w || Y >= d.h) return;
    const i = Y * d.w + X;
    d.buf[i] = c === 2 ? 1 - d.buf[i] : c ? 1 : 0;
  };
  const W = (d) => (d.rot & 1 ? d.h : d.w), Hh = (d) => (d.rot & 1 ? d.w : d.h);
  const line = (d, x0, y0, x1, y1, c) => {
    x0 = Math.trunc(x0); y0 = Math.trunc(y0); x1 = Math.trunc(x1); y1 = Math.trunc(y1);
    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    if (steep) { [x0, y0] = [y0, x0]; [x1, y1] = [y1, x1]; }
    if (x0 > x1) { [x0, x1] = [x1, x0]; [y0, y1] = [y1, y0]; }
    const dx = x1 - x0, dy = Math.abs(y1 - y0);
    let err = Math.trunc(dx / 2);
    const ys = y0 < y1 ? 1 : -1;
    for (; x0 <= x1; x0++) {
      if (steep) px(d, y0, x0, c); else px(d, x0, y0, c);
      err -= dy;
      if (err < 0) { y0 += ys; err += dx; }
    }
  };
  const hline = (d, x, y, w, c) => { for (let i = 0; i < w; i++) px(d, x + i, y, c); };
  const vline = (d, x, y, h, c) => { for (let i = 0; i < h; i++) px(d, x, y + i, c); };
  const fillRect = (d, x, y, w, h, c) => { for (let j = 0; j < h; j++) hline(d, x, y + j, w, c); };
  const circleHelper = (d, x0, y0, r, corner, c) => {
    let f = 1 - r, ddx = 1, ddy = -2 * r, x = 0, y = r;
    while (x < y) {
      if (f >= 0) { y--; ddy += 2; f += ddy; }
      x++; ddx += 2; f += ddx;
      if (corner & 4) { px(d, x0 + x, y0 + y, c); px(d, x0 + y, y0 + x, c); }
      if (corner & 2) { px(d, x0 + x, y0 - y, c); px(d, x0 + y, y0 - x, c); }
      if (corner & 8) { px(d, x0 - y, y0 + x, c); px(d, x0 - x, y0 + y, c); }
      if (corner & 1) { px(d, x0 - y, y0 - x, c); px(d, x0 - x, y0 - y, c); }
    }
  };
  const fillCircleHelper = (d, x0, y0, r, corners, delta, c) => {
    let f = 1 - r, ddx = 1, ddy = -2 * r, x = 0, y = r, px_ = x, py = y;
    delta++;
    while (x < y) {
      if (f >= 0) { y--; ddy += 2; f += ddy; }
      x++; ddx += 2; f += ddx;
      if (x < y + 1) { if (corners & 1) vline(d, x0 + x, y0 - y, 2 * y + delta, c); if (corners & 2) vline(d, x0 - x, y0 - y, 2 * y + delta, c); }
      if (y !== py) { if (corners & 1) vline(d, x0 + py, y0 - px_, 2 * px_ + delta, c); if (corners & 2) vline(d, x0 - py, y0 - px_, 2 * px_ + delta, c); py = y; }
      px_ = x;
    }
  };
  const drawChar = (d, x, y, ch, c, bg, sx, sy) => {
    if (x >= W(d) || y >= Hh(d) || x + 6 * sx - 1 < 0 || y + 8 * sy - 1 < 0) return;
    const cols = ch === 32 ? [0, 0, 0, 0, 0] : glyph(String.fromCharCode(ch));
    for (let i = 0; i < 5; i++) {
      let lineBits = cols[i];
      for (let j = 0; j < 8; j++, lineBits >>= 1) {
        if (lineBits & 1) { if (sx === 1 && sy === 1) px(d, x + i, y + j, c); else fillRect(d, x + i * sx, y + j * sy, sx, sy, c); }
        else if (bg !== c) { if (sx === 1 && sy === 1) px(d, x + i, y + j, bg); else fillRect(d, x + i * sx, y + j * sy, sx, sy, bg); }
      }
    }
    if (bg !== c) { if (sx === 1 && sy === 1) vline(d, x + 5, y, 8, bg); else fillRect(d, x + 5 * sx, y, sx, 8 * sy, bg); }
  };
  const write = (vm, d, bytes) => {
    for (let k = 0; k < bytes.length; k++) {
      const c = bytes.charCodeAt(k);
      if (c === 10) { d.cx = 0; d.cy += d.sizeY * 8; continue; }
      if (c === 13) continue;
      if (d.wrap && d.cx + d.size * 6 > W(d)) { d.cx = 0; d.cy += d.sizeY * 8; }
      drawChar(d, d.cx, d.cy, c, d.fg, d.bg, d.size, d.sizeY);
      d.cx += d.size * 6;
    }
  };
  return {
    ...printMethods(write, { printfBoards: ESP32 }),
    drawPixel: M('void (int16_t, int16_t, uint16_t)', (vm, d, x, y, c) => px(d, x, y, c)),
    drawLine: M('void (int16_t, int16_t, int16_t, int16_t, uint16_t)', (vm, d, a, b, e, f, c) => line(d, a, b, e, f, c)),
    drawFastHLine: M('void (int16_t, int16_t, int16_t, uint16_t)', (vm, d, x, y, w, c) => hline(d, x, y, w, c)),
    drawFastVLine: M('void (int16_t, int16_t, int16_t, uint16_t)', (vm, d, x, y, h, c) => vline(d, x, y, h, c)),
    drawRect: M('void (int16_t, int16_t, int16_t, int16_t, uint16_t)', (vm, d, x, y, w, h, c) => { hline(d, x, y, w, c); hline(d, x, y + h - 1, w, c); vline(d, x, y, h, c); vline(d, x + w - 1, y, h, c); }),
    fillRect: M('void (int16_t, int16_t, int16_t, int16_t, uint16_t)', (vm, d, x, y, w, h, c) => fillRect(d, x, y, w, h, c)),
    fillScreen: M('void (uint16_t)', (vm, d, c) => fillRect(d, 0, 0, W(d), Hh(d), c)),
    drawCircle: M('void (int16_t, int16_t, int16_t, uint16_t)', (vm, d, x0, y0, r, c) => {
      px(d, x0, y0 + r, c); px(d, x0, y0 - r, c); px(d, x0 + r, y0, c); px(d, x0 - r, y0, c);
      let f = 1 - r, ddx = 1, ddy = -2 * r, x = 0, y = r;
      while (x < y) {
        if (f >= 0) { y--; ddy += 2; f += ddy; }
        x++; ddx += 2; f += ddx;
        px(d, x0 + x, y0 + y, c); px(d, x0 - x, y0 + y, c); px(d, x0 + x, y0 - y, c); px(d, x0 - x, y0 - y, c);
        px(d, x0 + y, y0 + x, c); px(d, x0 - y, y0 + x, c); px(d, x0 + y, y0 - x, c); px(d, x0 - y, y0 - x, c);
      }
    }),
    fillCircle: M('void (int16_t, int16_t, int16_t, uint16_t)', (vm, d, x0, y0, r, c) => { vline(d, x0, y0 - r, 2 * r + 1, c); fillCircleHelper(d, x0, y0, r, 3, 0, c); }),
    drawRoundRect: M('void (int16_t, int16_t, int16_t, int16_t, int16_t, uint16_t)', (vm, d, x, y, w, h, r, c) => {
      const m = Math.trunc(Math.min(w, h) / 2); if (r > m) r = m;
      hline(d, x + r, y, w - 2 * r, c); hline(d, x + r, y + h - 1, w - 2 * r, c); vline(d, x, y + r, h - 2 * r, c); vline(d, x + w - 1, y + r, h - 2 * r, c);
      circleHelper(d, x + r, y + r, r, 1, c); circleHelper(d, x + w - r - 1, y + r, r, 2, c); circleHelper(d, x + w - r - 1, y + h - r - 1, r, 4, c); circleHelper(d, x + r, y + h - r - 1, r, 8, c);
    }),
    fillRoundRect: M('void (int16_t, int16_t, int16_t, int16_t, int16_t, uint16_t)', (vm, d, x, y, w, h, r, c) => {
      const m = Math.trunc(Math.min(w, h) / 2); if (r > m) r = m;
      fillRect(d, x + r, y, w - 2 * r, h, c);
      fillCircleHelper(d, x + w - r - 1, y + r, r, 1, h - 2 * r - 1, c);
      fillCircleHelper(d, x + r, y + r, r, 2, h - 2 * r - 1, c);
    }),
    drawTriangle: M('void (int16_t, int16_t, int16_t, int16_t, int16_t, int16_t, uint16_t)', (vm, d, a, b, e, f, g, h, c) => { line(d, a, b, e, f, c); line(d, e, f, g, h, c); line(d, g, h, a, b, c); }),
    fillTriangle: M('void (int16_t, int16_t, int16_t, int16_t, int16_t, int16_t, uint16_t)', (vm, d, x0, y0, x1, y1, x2, y2, c) => {
      const pts = [[x0, y0], [x1, y1], [x2, y2]].sort((p, q) => p[1] - q[1]);
      const [[ax, ay], [bx, by], [cx, cy]] = pts;
      for (let y = ay; y <= cy; y++) {
        const xs = [];
        const edge = (x1_, y1_, x2_, y2_) => { if (y1_ === y2_) { if (y === y1_) xs.push(x1_, x2_); return; } if (y >= Math.min(y1_, y2_) && y <= Math.max(y1_, y2_)) xs.push(Math.round(x1_ + ((y - y1_) * (x2_ - x1_)) / (y2_ - y1_))); };
        edge(ax, ay, bx, by); edge(bx, by, cx, cy); edge(ax, ay, cx, cy);
        if (xs.length) { const lo = Math.min(...xs), hi = Math.max(...xs); hline(d, lo, y, hi - lo + 1, c); }
      }
    }),
    drawBitmap: M(['void (int16_t, int16_t, any, int16_t, int16_t, uint16_t)', 'void (int16_t, int16_t, any, int16_t, int16_t, uint16_t, uint16_t)'], (vm, d, x, y, bmp, w, h, c, bg) => {
      const p = bmp.v instanceof Ptr ? bmp.v : new Ptr(bmp.v, 0);
      const bw = Math.trunc((w + 7) / 8);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const byte = p.b[p.o + j * bw + (i >> 3)] ?? 0;
        if (byte & (0x80 >> (i & 7))) px(d, x + i, y + j, c); else if (bg !== undefined) px(d, x + i, y + j, bg);
      }
    }),
    drawChar: M(['void (int16_t, int16_t, unsigned char, uint16_t, uint16_t, uint8_t)'], (vm, d, x, y, ch, c, bg, s) => drawChar(d, x, y, ch, c, bg, s, s)),
    setCursor: M('void (int16_t, int16_t)', (vm, d, x, y) => { d.cx = x; d.cy = y; }),
    getCursorX: M('int16_t ()', (vm, d) => d.cx),
    getCursorY: M('int16_t ()', (vm, d) => d.cy),
    setTextSize: M(['void (uint8_t)', 'void (uint8_t, uint8_t)'], (vm, d, s, sy) => { d.size = Math.max(1, s); d.sizeY = Math.max(1, sy ?? s); }),
    setTextColor: M(['void (uint16_t)', 'void (uint16_t, uint16_t)'], (vm, d, c, bg) => { d.fg = c; d.bg = bg ?? c; }),
    setTextWrap: M('void (bool)', (vm, d, w) => { d.wrap = !!w; }),
    cp437: M(['void ()', 'void (bool)'], () => {}),
    setFont: M(['void ()', 'void (any)'], (vm) => vm.warnOnce('gfx-font', 'Custom GFX fonts are not supported in the simulator; the built-in 5×7 font is used')),
    setRotation: M('void (uint8_t)', (vm, d, r) => { d.rot = r & 3; }),
    getRotation: M('uint8_t ()', (vm, d) => d.rot),
    width: M('int16_t ()', (vm, d) => W(d)),
    height: M('int16_t ()', (vm, d) => Hh(d)),
    getTextBounds: M(['void (cstr, int16_t, int16_t, any&, any&, any&, any&)'], (vm, d, s, x, y, x1, y1, w, h) => {
      const lines = s.split('\n');
      const maxLen = Math.max(...lines.map((l) => l.length));
      x1.ref.b[x1.ref.o] = x; y1.ref.b[y1.ref.o] = y;
      w.ref.b[w.ref.o] = maxLen ? maxLen * 6 * d.size - d.size : 0;
      h.ref.b[h.ref.o] = lines.length * 8 * d.sizeY;
    }),
  };
}

/** Pick a display glyph for an LCD custom character. */
function guessGlyph(bytes) {
  const heart = [0, 10, 31, 31, 31, 14, 4, 0];
  if (bytes.every((b, i) => b === heart[i])) return '♥';
  if (bytes.every((b) => b === 31)) return '█';
  if (bytes.every((b) => b === 0)) return ' ';
  return '█';
}

/** Adafruit DHT heat index (Rothfusz + Steadman), in °C or °F. */
function heatIndex(t, h, isF) {
  const R = Math.fround;
  let T = isF ? t : R(t * 1.8 + 32);
  let hi = R(0.5 * (T + 61.0 + (T - 68.0) * 1.2 + h * 0.094));
  if (hi > 79) {
    hi = -42.379 + 2.04901523 * T + 10.14333127 * h + -0.22475541 * T * h + -0.00683783 * T ** 2 + -0.05481717 * h ** 2 + 0.00122874 * T ** 2 * h + 0.00085282 * T * h ** 2 + -0.00000199 * T ** 2 * h ** 2;
    if (h < 13 && T >= 80 && T <= 112) hi -= ((13 - h) * 0.25) * Math.sqrt((17 - Math.abs(T - 95)) * 0.05882);
    else if (h > 85 && T >= 80 && T <= 87) hi += ((h - 85) * 0.1) * ((87 - T) * 0.2);
  }
  return isF ? hi : (hi - 32) * 0.55555;
}
