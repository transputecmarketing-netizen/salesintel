// More emulated libraries used by the project tracks: TM1637Display, LedControl (MAX7219),
// Adafruit_TCS34725, VL53L0X (Pololu), Adafruit_INA219, PMS, Adafruit_SGP30, OneWire +
// DallasTemperature, LoRa, HTTPClient, ArduinoJson (v6/v7 subset) and time.h / NTP.
import { M, ESP32, ESP } from './registry.js';
import { printMethods, streamMethods } from './core.js';
import { i2cDevice } from './hardware.js';
import { AStr, Ptr, cstr, charArray, writeCstr, textOf } from '../values.js';
import { canon } from '../types.js';

const H = (...names) => ({ header: names });
const setRef = (p, v) => { if (p instanceof Ptr) p.b[p.o] = v; };

export function addModules(R) {
  // ================================================================ TM1637 4-digit display
  R.header('TM1637Display.h');
  const SEG = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71];
  R.consts('int', { SEG_A: 1, SEG_B: 2, SEG_C: 4, SEG_D: 8, SEG_E: 16, SEG_F: 32, SEG_G: 64, SEG_DP: 128 }, H('TM1637Display.h'));
  const tmShow = (vm, d) => {
    d.dev ??= vm.devices.tm1637?.(d.clk, d.dio) ?? null;
    vm.us += 600;
    d.dev?.show([...d.segs], d.on ? d.bright : -1);
    vm.emit('pin', { pin: d.clk, kind: 'display', value: d.segs.join(',') });
  };
  const tmNumber = (vm, d, base, num, dots, lz, length, pos) => {
    let negative = false;
    if (base < 0) { base = -base; negative = true; }
    num &= 0xffff;
    const digits = new Array(length).fill(0);
    if (num === 0 && !lz) digits[length - 1] = SEG[0];
    else {
      for (let i = length - 1; i >= 0; --i) {
        const digit = num % base;
        if (digit === 0 && num === 0 && !lz) digits[i] = 0;
        else digits[i] = SEG[digit];
        if (digit === 0 && num === 0 && negative) { digits[i] = 0x40; negative = false; }
        num = Math.floor(num / base);
      }
    }
    if (dots) for (let i = 0; i < 4 && i < length; i++) { digits[i] |= dots & 0x80; dots = (dots << 1) & 0xff; }
    for (let i = 0; i < length && pos + i < 4; i++) d.segs[pos + i] = digits[i];
    tmShow(vm, d);
  };
  R.cls({
    name: 'TM1637Display',
    ctors: ['(uint8_t, uint8_t)', '(uint8_t, uint8_t, unsigned int)'],
    construct: (vm, [clk, dio]) => ({ clk, dio, segs: [0, 0, 0, 0], bright: 7, on: true, dev: null }),
    methods: {
      setBrightness: M(['void (uint8_t)', 'void (uint8_t, bool)'], (vm, d, b, on = 1) => { d.bright = b & 7; d.on = !!on; }),
      setSegments: M(['void (any)', 'void (any, uint8_t)', 'void (any, uint8_t, uint8_t)'], (vm, d, a, len = 4, pos = 0) => {
        const p = a.v instanceof Ptr ? a.v : new Ptr(a.v, 0);
        for (let i = 0; i < len && pos + i < 4; i++) d.segs[pos + i] = (p.b[p.o + i] ?? 0) & 0xff;
        tmShow(vm, d);
      }),
      clear: M('void ()', (vm, d) => { d.segs = [0, 0, 0, 0]; tmShow(vm, d); }),
      showNumberDec: M(['void (int)', 'void (int, bool)', 'void (int, bool, uint8_t)', 'void (int, bool, uint8_t, uint8_t)'], (vm, d, n, lz = 0, len = 4, pos = 0) => tmNumber(vm, d, n < 0 ? -10 : 10, n < 0 ? -n : n, 0, lz, len, pos)),
      showNumberDecEx: M(['void (int, uint8_t)', 'void (int, uint8_t, bool)', 'void (int, uint8_t, bool, uint8_t)', 'void (int, uint8_t, bool, uint8_t, uint8_t)'], (vm, d, n, dots, lz = 0, len = 4, pos = 0) => tmNumber(vm, d, n < 0 ? -10 : 10, n < 0 ? -n : n, dots, lz, len, pos)),
      showNumberHexEx: M(['void (uint16_t)', 'void (uint16_t, uint8_t)', 'void (uint16_t, uint8_t, bool)', 'void (uint16_t, uint8_t, bool, uint8_t, uint8_t)'], (vm, d, n, dots = 0, lz = 0, len = 4, pos = 0) => tmNumber(vm, d, 16, n, dots, lz, len, pos)),
      encodeDigit: M('uint8_t (uint8_t)', (vm, d, x) => SEG[x & 15]),
    },
  }, H('TM1637Display.h'));

  // ================================================================ LedControl (MAX7219)
  R.header('LedControl.h');
  const CHARS = { 0: 0x7e, 1: 0x30, 2: 0x6d, 3: 0x79, 4: 0x33, 5: 0x5b, 6: 0x5f, 7: 0x70, 8: 0x7f, 9: 0x7b, a: 0x77, b: 0x1f, c: 0x0d, d: 0x3d, e: 0x4f, f: 0x47, h: 0x37, l: 0x0e, p: 0x67, '-': 0x01, ' ': 0, '.': 0x80, _: 0x08 };
  const lcPush = (vm, l, addr) => {
    l.dev ??= vm.devices.max7219?.(l.din, l.clk, l.cs, l.n) ?? null;
    vm.us += 120;
    l.dev?.show(addr, [...l.rows[addr]], l.on[addr] ? l.intensity[addr] : -1);
  };
  R.cls({
    name: 'LedControl',
    ctors: ['(int, int, int)', '(int, int, int, int)'],
    construct: (vm, [din, clk, cs, n = 1]) => ({ din, clk, cs, n: Math.max(1, Math.min(8, n)), rows: Array.from({ length: 8 }, () => new Array(8).fill(0)), on: new Array(8).fill(false), intensity: new Array(8).fill(8), dev: null }),
    methods: {
      getDeviceCount: M('int ()', (vm, l) => l.n),
      shutdown: M('void (int, bool)', (vm, l, a, off) => { if (a < l.n) { l.on[a] = !off; lcPush(vm, l, a); } }),
      setIntensity: M('void (int, int)', (vm, l, a, v) => { if (a < l.n) { l.intensity[a] = v & 15; lcPush(vm, l, a); } }),
      setScanLimit: M('void (int, int)', () => {}),
      clearDisplay: M('void (int)', (vm, l, a) => { if (a < l.n) { l.rows[a].fill(0); lcPush(vm, l, a); } }),
      setLed: M('void (int, int, int, bool)', (vm, l, a, r, c, on) => {
        if (a >= l.n || r < 0 || r > 7 || c < 0 || c > 7) return;
        const bit = 0x80 >> c;
        l.rows[a][r] = on ? l.rows[a][r] | bit : l.rows[a][r] & ~bit;
        lcPush(vm, l, a);
      }),
      setRow: M('void (int, int, uint8_t)', (vm, l, a, r, v) => { if (a < l.n && r >= 0 && r < 8) { l.rows[a][r] = v & 255; lcPush(vm, l, a); } }),
      setColumn: M('void (int, int, uint8_t)', (vm, l, a, c, v) => {
        if (a >= l.n || c < 0 || c > 7) return;
        for (let r = 0; r < 8; r++) { const bit = 0x80 >> c; l.rows[a][r] = (v >> (7 - r)) & 1 ? l.rows[a][r] | bit : l.rows[a][r] & ~bit; }
        lcPush(vm, l, a);
      }),
      setDigit: M('void (int, int, uint8_t, bool)', (vm, l, a, dig, v, dp) => { if (a < l.n && dig < 8) { l.rows[a][dig] = (CHARS[v & 15] ?? CHARS[(v & 15).toString(16)] ?? 0) | (dp ? 0x80 : 0); lcPush(vm, l, a); } }),
      setChar: M('void (int, int, char, bool)', (vm, l, a, dig, ch, dp) => { if (a < l.n && dig < 8) { l.rows[a][dig] = (CHARS[String.fromCharCode(ch).toLowerCase()] ?? 0) | (dp ? 0x80 : 0); lcPush(vm, l, a); } }),
    },
  }, H('LedControl.h'));

  // ================================================================ Adafruit_TCS34725 colour sensor
  R.header('Adafruit_TCS34725.h');
  R.consts('int', { TCS34725_INTEGRATIONTIME_2_4MS: 0xff, TCS34725_INTEGRATIONTIME_24MS: 0xf6, TCS34725_INTEGRATIONTIME_50MS: 0xeb, TCS34725_INTEGRATIONTIME_60MS: 0xe7, TCS34725_INTEGRATIONTIME_101MS: 0xd5, TCS34725_INTEGRATIONTIME_120MS: 0xce, TCS34725_INTEGRATIONTIME_154MS: 0xc0, TCS34725_INTEGRATIONTIME_180MS: 0xb5, TCS34725_INTEGRATIONTIME_199MS: 0xad, TCS34725_INTEGRATIONTIME_240MS: 0x9c, TCS34725_INTEGRATIONTIME_300MS: 0x83, TCS34725_INTEGRATIONTIME_600MS: 0x06, TCS34725_INTEGRATIONTIME_614MS: 0x00, TCS34725_GAIN_1X: 0, TCS34725_GAIN_4X: 1, TCS34725_GAIN_16X: 2, TCS34725_GAIN_60X: 3 }, H('Adafruit_TCS34725.h'));
  const GAINS = [1, 4, 16, 60];
  const tcsRead = function* (vm, s) {
    yield* vm.sleep((256 - s.it) * 2400);
    s.dev ??= vm.devices.colorSensor?.() ?? null;
    const raw = s.dev?.read?.() ?? { r: 0, g: 0, b: 0, c: 0 };
    const k = (GAINS[s.gain] / 4) * ((256 - s.it) / 21);
    const max = Math.min(65535, (256 - s.it) * 1024);
    const clip = (x) => Math.max(0, Math.min(max, Math.round(x * k)));
    return { r: clip(raw.r), g: clip(raw.g), b: clip(raw.b), c: clip(raw.c ?? (raw.r + raw.g + raw.b)) };
  };
  R.cls({
    name: 'Adafruit_TCS34725',
    ctors: ['()', '(uint8_t)', '(uint8_t, uint8_t)'],
    construct: (vm, [it = 0xff, gain = 0]) => ({ it, gain, dev: null }),
    methods: {
      begin: M(['bool ()', 'bool (uint8_t)', 'bool (uint8_t, any)'], (vm) => +!!(vm.devices.colorSensor || i2cDevice(vm, 0x29))),
      getRawData: M('void (any, any, any, any)', function* (vm, s, r, g, b, c) {
        const v = yield* tcsRead(vm, s);
        setRef(r.v, v.r); setRef(g.v, v.g); setRef(b.v, v.b); setRef(c.v, v.c);
      }),
      getRGB: M('void (any, any, any)', function* (vm, s, r, g, b) {
        const v = yield* tcsRead(vm, s);
        const sum = v.c || 1;
        setRef(r.v, Math.fround((v.r / sum) * 255)); setRef(g.v, Math.fround((v.g / sum) * 255)); setRef(b.v, Math.fround((v.b / sum) * 255));
      }),
      setGain: M('void (uint8_t)', (vm, s, g) => { s.gain = g & 3; }),
      setIntegrationTime: M('void (uint8_t)', (vm, s, it) => { s.it = it & 255; }),
      setInterrupt: M('void (bool)', () => {}),
      calculateColorTemperature: M('uint16_t (uint16_t, uint16_t, uint16_t)', (vm, s, r, g, b) => {
        const X = -0.14282 * r + 1.54924 * g + -0.95641 * b, Y = -0.32466 * r + 1.57837 * g + -0.73191 * b, Z = -0.68202 * r + 0.77073 * g + 0.56332 * b;
        const xc = X / (X + Y + Z), yc = Y / (X + Y + Z), n = (xc - 0.332) / (0.1858 - yc);
        return Math.max(0, Math.round(449 * n ** 3 + 3525 * n ** 2 + 6823.3 * n + 5520.33)) & 0xffff;
      }),
      calculateLux: M('uint16_t (uint16_t, uint16_t, uint16_t)', (vm, s, r, g, b) => Math.max(0, Math.round(-0.32466 * r + 1.57837 * g + -0.73191 * b)) & 0xffff),
    },
  }, H('Adafruit_TCS34725.h'));

  // ================================================================ VL53L0X time-of-flight (Pololu)
  R.header('VL53L0X.h');
  R.cls({
    name: 'VL53L0X',
    construct: () => ({ timeout: 0, timedOut: false, dev: null, cont: false }),
    methods: {
      init: M(['bool ()', 'bool (bool)'], (vm, s) => { s.dev = vm.devices.tof?.() ?? null; vm.us += 40000; return +!!(s.dev || i2cDevice(vm, 0x29)); }),
      setTimeout: M('void (uint16_t)', (vm, s, t) => { s.timeout = t; }),
      getTimeout: M('uint16_t ()', (vm, s) => s.timeout),
      timeoutOccurred: M('bool ()', (vm, s) => { const t = s.timedOut; s.timedOut = false; return +t; }),
      setAddress: M('void (uint8_t)', () => {}),
      setMeasurementTimingBudget: M('bool (uint32_t)', () => 1),
      setSignalRateLimit: M('bool (float)', () => 1),
      startContinuous: M(['void ()', 'void (uint32_t)'], (vm, s) => { s.cont = true; }),
      stopContinuous: M('void ()', (vm, s) => { s.cont = false; }),
      readRangeSingleMillimeters: M('uint16_t ()', function* (vm, s) { return yield* tofRead(vm, s); }),
      readRangeContinuousMillimeters: M('uint16_t ()', function* (vm, s) { return yield* tofRead(vm, s); }),
    },
  }, H('VL53L0X.h'));
  function* tofRead(vm, s) {
    if (!s.dev) {
      yield* vm.sleep((s.timeout || 500) * 1000);
      s.timedOut = !!s.timeout;
      return 65535;
    }
    yield* vm.sleep(33000);
    const mm = s.dev.mm?.();
    return mm == null || mm >= 8190 ? 8190 : Math.max(0, Math.round(mm)) & 0xffff;
  }

  // ================================================================ Adafruit_INA219 current sensor
  R.header('Adafruit_INA219.h');
  R.cls({
    name: 'Adafruit_INA219',
    ctors: ['()', '(uint8_t)'],
    construct: (vm, [addr = 0x40]) => ({ addr, dev: null }),
    methods: {
      begin: M(['bool ()', 'bool (any)'], (vm, s) => { s.dev = vm.devices.ina219?.(s.addr) ?? null; return +!!(s.dev || i2cDevice(vm, s.addr)); }),
      getBusVoltage_V: M('float ()', (vm, s) => { vm.us += 600; return Math.fround(Math.round((s.dev?.volts?.() ?? 0) / 0.004) * 0.004); }),
      getShuntVoltage_mV: M('float ()', (vm, s) => { vm.us += 600; return Math.fround(Math.round((s.dev?.mA?.() ?? 0) * 0.1 * 100) / 100); }),
      getCurrent_mA: M('float ()', (vm, s) => { vm.us += 600; return Math.fround(Math.round((s.dev?.mA?.() ?? 0) * 10) / 10); }),
      getPower_mW: M('float ()', (vm, s) => { vm.us += 600; return Math.fround(Math.round((s.dev?.volts?.() ?? 0) * (s.dev?.mA?.() ?? 0) / 2) * 2); }),
      setCalibration_32V_2A: M('void ()', () => {}), setCalibration_32V_1A: M('void ()', () => {}), setCalibration_16V_400mA: M('void ()', () => {}),
      powerSave: M('void (bool)', () => {}),
    },
  }, H('Adafruit_INA219.h'));

  // ================================================================ PMS particulate sensor
  R.header('PMS.h');
  R.struct('PMS::DATA', { PM_SP_UG_1_0: 'uint16_t', PM_SP_UG_2_5: 'uint16_t', PM_SP_UG_10_0: 'uint16_t', PM_AE_UG_1_0: 'uint16_t', PM_AE_UG_2_5: 'uint16_t', PM_AE_UG_10_0: 'uint16_t' }, H('PMS.h'));
  const pmsFrame = (vm, s, ref, force) => {
    if (s.sleeping) return 0;
    if (!force && vm.us < s.next) return 0;
    s.next = vm.us + 1000000;
    s.dev ??= vm.devices.pms?.() ?? null;
    const d = s.dev?.read?.();
    if (!d) return 0;
    const r = (x) => Math.max(0, Math.round(x ?? 0)) & 0xffff;
    ref.b[ref.o] = { PM_SP_UG_1_0: r(d.pm1), PM_SP_UG_2_5: r(d.pm25), PM_SP_UG_10_0: r(d.pm10), PM_AE_UG_1_0: r(d.pm1), PM_AE_UG_2_5: r(d.pm25), PM_AE_UG_10_0: r(d.pm10) };
    return 1;
  };
  R.cls({
    name: 'PMS',
    ctors: ['(any)'],
    construct: () => ({ next: 0, sleeping: false, dev: null }),
    methods: {
      read: M('bool (any&)', (vm, s, r) => pmsFrame(vm, s, r.ref, false)),
      readUntil: M(['bool (any&)', 'bool (any&, uint16_t)'], function* (vm, s, r, t = 1000) {
        const end = vm.us + t * 1000;
        while (vm.us < end) { if (pmsFrame(vm, s, r.ref, false)) return 1; yield* vm.sleep(Math.min(50000, end - vm.us)); }
        return 0;
      }),
      sleep: M('void ()', (vm, s) => { s.sleeping = true; }),
      wakeUp: M('void ()', (vm, s) => { s.sleeping = false; s.next = vm.us + 30e6; }),
      activeMode: M('void ()', () => {}), passiveMode: M('void ()', () => {}),
      requestRead: M('void ()', (vm, s) => { s.next = 0; }),
    },
  }, H('PMS.h'));

  // ================================================================ Adafruit_SGP30 gas sensor
  R.header('Adafruit_SGP30.h');
  R.cls({
    name: 'Adafruit_SGP30',
    fields: { TVOC: 'uint16_t', eCO2: 'uint16_t', rawH2: 'uint16_t', rawEthanol: 'uint16_t' },
    construct: () => ({ TVOC: 0, eCO2: 400, rawH2: 0, rawEthanol: 0, start: null, dev: null }),
    methods: {
      begin: M(['bool ()', 'bool (any)'], (vm, s) => { s.dev = vm.devices.sgp30?.() ?? null; s.start = vm.us; return +!!(s.dev || i2cDevice(vm, 0x58)); }),
      IAQinit: M('bool ()', (vm, s) => { s.start = vm.us; return 1; }),
      IAQmeasure: M('bool ()', (vm, s) => {
        vm.us += 12000;
        if (!s.dev) return 0;
        // the SGP30 reports 0 ppb / 400 ppm for its first 15 s
        if (vm.us - (s.start ?? 0) < 15e6) { s.TVOC = 0; s.eCO2 = 400; return 1; }
        s.TVOC = Math.max(0, Math.round(s.dev.tvoc?.() ?? 0)) & 0xffff;
        s.eCO2 = Math.max(400, Math.round(s.dev.eco2?.() ?? 400)) & 0xffff;
        return 1;
      }),
      IAQmeasureRaw: M('bool ()', (vm, s) => { s.rawH2 = 13500; s.rawEthanol = 18500; return 1; }),
      setHumidity: M('bool (uint32_t)', () => 1),
      getIAQBaseline: M('bool (any, any)', (vm, s, a, b) => { setRef(a.v, 0x8e68); setRef(b.v, 0x8f41); return 1; }),
      setIAQBaseline: M('bool (uint16_t, uint16_t)', () => 1),
    },
  }, H('Adafruit_SGP30.h'));

  // ================================================================ OneWire + DallasTemperature (DS18B20)
  R.header('OneWire.h');
  R.header('DallasTemperature.h');
  R.konst('DEVICE_DISCONNECTED_C', 'float', -127, H('DallasTemperature.h'));
  R.konst('DEVICE_DISCONNECTED_F', 'float', -196.6, H('DallasTemperature.h'));
  R.cls({ name: 'OneWire', ctors: ['(uint8_t)'], construct: (vm, [pin]) => ({ pin }), methods: { reset: M('uint8_t ()', (vm, o) => +!!vm.devices.ds18b20?.(o.pin)), reset_search: M('void ()', () => {}), search: M('bool (any)', () => 0) } }, H('OneWire.h'));
  const probes = (vm, d) => {
    const dev = vm.devices.ds18b20?.(d.pin);
    if (!dev) return [];
    return Array.isArray(dev) ? dev : [dev];
  };
  R.cls({
    name: 'DallasTemperature',
    ctors: ['()', '(any)'],
    construct: (vm, [ow]) => ({ pin: ow?.v instanceof Ptr ? ow.v.b[ow.v.o]?.pin : ow?.v?.pin, res: 12, wait: true, temps: [] }),
    methods: {
      begin: M('void ()', () => {}),
      getDeviceCount: M('uint8_t ()', (vm, d) => probes(vm, d).length),
      setResolution: M(['void (uint8_t)', 'bool (any, uint8_t)'], (vm, d, r) => { d.res = Math.max(9, Math.min(12, r)); }),
      setWaitForConversion: M('void (bool)', (vm, d, w) => { d.wait = !!w; }),
      requestTemperatures: M('void ()', function* (vm, d) {
        const ms = { 9: 94, 10: 188, 11: 375, 12: 750 }[d.res];
        if (d.wait) yield* vm.sleep(ms * 1000);
        const step = 0.0625 * 2 ** (12 - d.res);
        d.temps = probes(vm, d).map((p) => Math.round((p.temperature?.() ?? 85) / step) * step);
      }),
      getTempCByIndex: M('float (uint8_t)', (vm, d, i) => Math.fround(d.temps[i] ?? -127)),
      getTempFByIndex: M('float (uint8_t)', (vm, d, i) => Math.fround(d.temps[i] == null ? -196.6 : d.temps[i] * 1.8 + 32)),
      isConversionComplete: M('bool ()', () => 1),
    },
  }, H('DallasTemperature.h'));

  // ================================================================ LoRa (sandeepmistry)
  R.header('LoRa.h');
  const lora = (vm) => vm.lib('lora', () => ({ sf: 7, bw: 125e3, power: 17, freq: 0, tx: null, rx: '', rssi: 0, snr: 0, begun: false, dev: null }));
  const airtime = (L, n) => {
    const tsym = 2 ** L.sf / L.bw;
    const de = L.sf >= 11 ? 1 : 0;
    const payloadSym = 8 + Math.max(Math.ceil((8 * n - 4 * L.sf + 28 + 16) / (4 * (L.sf - 2 * de))) * 5, 0);
    return (12.25 + payloadSym) * tsym;
  };
  R.cls({
    name: 'LoRaClass',
    construct: () => ({}),
    methods: {
      ...printMethods((vm, s, bytes) => { const L = lora(vm); if (L.tx != null) L.tx += bytes; }, { printfBoards: ESP }),
      ...streamMethods({
        avail: (vm) => lora(vm).rx.length,
        readByte: (vm) => { const L = lora(vm); if (!L.rx.length) return -1; const c = L.rx.charCodeAt(0); L.rx = L.rx.slice(1); return c; },
        peekByte: (vm) => { const L = lora(vm); return L.rx.length ? L.rx.charCodeAt(0) : -1; },
        timeout: () => 0,
      }),
      setPins: M(['void (int)', 'void (int, int)', 'void (int, int, int)'], () => {}),
      begin: M('int (long)', (vm, s, f) => { const L = lora(vm); L.freq = f; L.dev = vm.devices.lora?.() ?? null; L.begun = !!L.dev; vm.us += 10000; return +L.begun; }),
      end: M('void ()', (vm) => { lora(vm).begun = false; }),
      setSpreadingFactor: M('void (int)', (vm, s, sf) => { lora(vm).sf = Math.max(6, Math.min(12, sf)); }),
      setSignalBandwidth: M('void (long)', (vm, s, bw) => { lora(vm).bw = bw; }),
      setTxPower: M(['void (int)', 'void (int, int)'], (vm, s, p) => { lora(vm).power = p; }),
      setSyncWord: M('void (int)', () => {}), setCodingRate4: M('void (int)', () => {}), setPreambleLength: M('void (long)', () => {}),
      enableCrc: M('void ()', () => {}), disableCrc: M('void ()', () => {}),
      beginPacket: M(['int ()', 'int (int)'], (vm) => { lora(vm).tx = ''; return 1; }),
      endPacket: M(['int ()', 'int (bool)'], function* (vm) {
        const L = lora(vm);
        const text = L.tx ?? '';
        L.tx = null;
        if (!L.begun) return 0;
        yield* vm.sleep(airtime(L, text.length) * 1e6);
        L.dev?.send?.(text, { sf: L.sf, power: L.power, freq: L.freq });
        vm.emit('lora', { sent: text });
        return 1;
      }),
      parsePacket: M(['int ()', 'int (int)'], (vm) => {
        const L = lora(vm);
        vm.us += 50;
        const p = L.begun ? L.dev?.receive?.() : null;
        if (!p) return 0;
        L.rx = typeof p === 'string' ? p : p.text ?? '';
        L.rssi = p.rssi ?? -92; L.snr = p.snr ?? 7.5;
        return L.rx.length;
      }),
      packetRssi: M('int ()', (vm) => lora(vm).rssi),
      packetSnr: M('float ()', (vm) => Math.fround(lora(vm).snr)),
      receive: M(['void ()', 'void (int)'], () => {}),
      idle: M('void ()', () => {}),
      sleep: M('void ()', () => {}),
      onReceive: M('void (fn)', (vm) => vm.warnOnce('lora-cb', 'LoRa.onReceive() callbacks are not supported in the simulator yet; poll LoRa.parsePacket() in loop()')),
    },
  });
  R.obj('LoRa', 'LoRaClass', () => ({}), H('LoRa.h'));

  // ================================================================ HTTPClient
  R.header('HTTPClient.h', { boards: ESP32, alt: 'On the ESP8266 use ESP8266HTTPClient.h.' });
  R.header('ESP8266HTTPClient.h', { boards: ['nodemcu'], alt: 'On the ESP32 use HTTPClient.h.' });
  R.consts('int', { HTTP_CODE_OK: 200, HTTP_CODE_CREATED: 201, HTTP_CODE_NO_CONTENT: 204, HTTP_CODE_MOVED_PERMANENTLY: 301, HTTP_CODE_FOUND: 302, HTTP_CODE_BAD_REQUEST: 400, HTTP_CODE_UNAUTHORIZED: 401, HTTP_CODE_FORBIDDEN: 403, HTTP_CODE_NOT_FOUND: 404, HTTP_CODE_INTERNAL_SERVER_ERROR: 500, HTTPC_ERROR_CONNECTION_REFUSED: -1, HTTPC_ERROR_SEND_HEADER_FAILED: -2, HTTPC_ERROR_CONNECTION_LOST: -5, HTTPC_ERROR_NOT_CONNECTED: -4, HTTPC_ERROR_READ_TIMEOUT: -11 }, H('HTTPClient.h', 'ESP8266HTTPClient.h'));
  const ERRS = { '-1': 'connection refused', '-2': 'send header failed', '-3': 'send payload failed', '-4': 'not connected', '-5': 'connection lost', '-6': 'no stream', '-7': 'no HTTP server', '-8': 'too less RAM', '-9': 'Transfer-Encoding not supported', '-10': 'Stream write error', '-11': 'read Timeout' };
  function* httpDo(vm, h, method, body = '') {
    if (!h.url) return -1;
    const wifi = vm.lib('wifi', () => ({ status: 0 }));
    if (wifi.status !== 3) { yield* vm.sleep(100000); h.code = -1; return -1; }
    yield* vm.sleep((h.url.startsWith('https') ? 900 : 300) * 1000);
    const dev = vm.devices.http;
    const res = dev ? dev({ method, url: h.url, headers: Object.fromEntries(h.headers), body }) : null;
    vm.emit('http', { method, url: h.url, body, code: res?.code ?? -1 });
    if (!res) { h.code = -1; h.body = ''; return -1; }
    h.code = res.code ?? 200;
    h.body = String(res.body ?? '');
    return h.code;
  }
  const http = {
    name: 'HTTPClient',
    construct: () => ({ url: '', headers: [], code: 0, body: '' }),
    methods: {
      begin: M(['bool (cstr)', 'bool (any, cstr)'], [(vm, h, url) => { h.url = url; h.headers = []; return 1; }, (vm, h, c, url) => { h.url = url; h.headers = []; return 1; }]),
      addHeader: M(['void (cstr, cstr)', 'void (cstr, cstr, bool)'], (vm, h, k, v) => { h.headers.push([k, v]); }),
      setTimeout: M('void (uint16_t)', () => {}), setReuse: M('void (bool)', () => {}), setUserAgent: M('void (any)', () => {}), setAuthorization: M(['void (cstr)', 'void (cstr, cstr)'], () => {}),
      GET: M('int ()', function* (vm, h) { return yield* httpDo(vm, h, 'GET'); }),
      POST: M('int (cstr)', function* (vm, h, b) { return yield* httpDo(vm, h, 'POST', b); }),
      PUT: M('int (cstr)', function* (vm, h, b) { return yield* httpDo(vm, h, 'PUT', b); }),
      PATCH: M('int (cstr)', function* (vm, h, b) { return yield* httpDo(vm, h, 'PATCH', b); }),
      sendRequest: M(['int (cstr)', 'int (cstr, cstr)'], function* (vm, h, m, b = '') { return yield* httpDo(vm, h, m, b); }),
      getString: M('String ()', (vm, h) => new AStr(h.body)),
      getSize: M('int ()', (vm, h) => h.body.length),
      errorToString: M('String (int)', (vm, h, c) => new AStr(ERRS[c] ?? '')),
      end: M('void ()', (vm, h) => { h.url = ''; }),
    },
  };
  R.cls(http, H('HTTPClient.h', 'ESP8266HTTPClient.h'));

  // ================================================================ ArduinoJson (subset)
  addJson(R);

  // ================================================================ time.h / NTP (ESP)
  R.header('time.h', { boards: ESP, alt: 'Clock time from the internet (NTP) needs an ESP32 or ESP8266. On the Uno use an RTC module with RTClib.' });
  R.header('sys/time.h', { boards: ESP });
  R.typedef('time_t', 'long long', { header: ['time.h', 'sys/time.h'], boards: ESP });
  R.struct('tm', { tm_sec: 'int', tm_min: 'int', tm_hour: 'int', tm_mday: 'int', tm_mon: 'int', tm_year: 'int', tm_wday: 'int', tm_yday: 'int', tm_isdst: 'int' }, { header: ['time.h', 'sys/time.h'], boards: ESP });
  const ntp = (vm) => vm.lib('ntp', () => ({ syncAt: null, offset: 0, base: Math.floor(Date.now() / 1000), at: vm.us }));
  const epoch = (vm) => {
    const n = ntp(vm);
    if (n.syncAt == null || vm.us < n.syncAt) return Math.floor((vm.us - vm.bootUs) / 1e6);
    return n.base + Math.floor((vm.us - n.at) / 1e6);
  };
  const toTm = (sec) => {
    const d = new Date(sec * 1000);
    const start = Date.UTC(d.getUTCFullYear(), 0, 1);
    return { tm_sec: d.getUTCSeconds(), tm_min: d.getUTCMinutes(), tm_hour: d.getUTCHours(), tm_mday: d.getUTCDate(), tm_mon: d.getUTCMonth(), tm_year: d.getUTCFullYear() - 1900, tm_wday: d.getUTCDay(), tm_yday: Math.floor((d - start) / 864e5), tm_isdst: 0 };
  };
  const tmOpts = { header: ['time.h', 'sys/time.h'], boards: ESP };
  R.fn('configTime', ['void (long, int, cstr)', 'void (long, int, cstr, cstr)', 'void (long, int, cstr, cstr, cstr)'], (vm, gmt, dst) => {
    const n = ntp(vm);
    n.offset = gmt + dst;
    n.syncAt = vm.us + 1200000;
  }, tmOpts);
  R.fn('configTzTime', ['void (cstr, cstr)', 'void (cstr, cstr, cstr)'], (vm) => { ntp(vm).syncAt = vm.us + 1200000; }, tmOpts);
  R.fn('time', 'time_t (any)', (vm, p) => { const t = epoch(vm); if (p.v instanceof Ptr) p.v.b[p.v.o] = t; return t; }, tmOpts);
  const local = (vm, sec) => toTm(sec + ntp(vm).offset);
  R.fn('localtime_r', 'tm* (any, any)', (vm, tp, out) => { const t = tp.v instanceof Ptr ? tp.v.b[tp.v.o] : epoch(vm); setRef(out.v, local(vm, t)); return out.v; }, tmOpts);
  R.fn('gmtime_r', 'tm* (any, any)', (vm, tp, out) => { const t = tp.v instanceof Ptr ? tp.v.b[tp.v.o] : epoch(vm); setRef(out.v, toTm(t)); return out.v; }, tmOpts);
  R.fn('localtime', 'tm* (any)', (vm, tp) => new Ptr([local(vm, tp.v instanceof Ptr ? tp.v.b[tp.v.o] : epoch(vm))], 0), tmOpts);
  R.fn('gmtime', 'tm* (any)', (vm, tp) => new Ptr([toTm(tp.v instanceof Ptr ? tp.v.b[tp.v.o] : epoch(vm))], 0), tmOpts);
  R.fn('mktime', 'time_t (any)', (vm, p) => { const t = p.v.b[p.v.o]; return Math.floor(Date.UTC(t.tm_year + 1900, t.tm_mon, t.tm_mday, t.tm_hour, t.tm_min, t.tm_sec) / 1000) - ntp(vm).offset; }, tmOpts);
  R.fn('getLocalTime', ['bool (any)', 'bool (any, uint32_t)'], function* (vm, out, ms = 5000) {
    const n = ntp(vm);
    if (n.syncAt == null) { yield* vm.sleep(Math.min(ms, 5000) * 1000); return 0; }
    if (vm.us < n.syncAt) { const w = Math.min(n.syncAt - vm.us, ms * 1000); yield* vm.sleep(w); if (vm.us < n.syncAt) return 0; }
    setRef(out.v, local(vm, epoch(vm)));
    return 1;
  }, { header: ['time.h'], boards: ESP32 });
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const strftime = (fmt, t) => fmt.replace(/%([a-zA-Z%])/g, (m, c) => {
    const z = (x, n = 2) => String(x).padStart(n, '0');
    switch (c) {
      case 'H': return z(t.tm_hour); case 'M': return z(t.tm_min); case 'S': return z(t.tm_sec);
      case 'd': return z(t.tm_mday); case 'e': return String(t.tm_mday).padStart(2, ' '); case 'm': return z(t.tm_mon + 1);
      case 'Y': return String(t.tm_year + 1900); case 'y': return z((t.tm_year + 1900) % 100);
      case 'a': return DAYS[t.tm_wday].slice(0, 3); case 'A': return DAYS[t.tm_wday];
      case 'b': case 'h': return MONTHS[t.tm_mon].slice(0, 3); case 'B': return MONTHS[t.tm_mon];
      case 'I': return z(((t.tm_hour + 11) % 12) + 1); case 'p': return t.tm_hour < 12 ? 'AM' : 'PM';
      case 'j': return z(t.tm_yday + 1, 3); case 'w': return String(t.tm_wday); case 'u': return String(t.tm_wday || 7);
      case 'D': return `${z(t.tm_mon + 1)}/${z(t.tm_mday)}/${z((t.tm_year + 1900) % 100)}`;
      case 'F': return `${t.tm_year + 1900}-${z(t.tm_mon + 1)}-${z(t.tm_mday)}`;
      case 'T': return `${z(t.tm_hour)}:${z(t.tm_min)}:${z(t.tm_sec)}`;
      case 'R': return `${z(t.tm_hour)}:${z(t.tm_min)}`;
      case 'c': return `${DAYS[t.tm_wday].slice(0, 3)} ${MONTHS[t.tm_mon].slice(0, 3)} ${String(t.tm_mday).padStart(2)} ${z(t.tm_hour)}:${z(t.tm_min)}:${z(t.tm_sec)} ${t.tm_year + 1900}`;
      case 'Z': return 'UTC'; case 'z': return '+0000'; case 'n': return '\n'; case 't': return '\t'; case '%': return '%';
      default: return m;
    }
  });
  R.fn('strftime', 'size_t (any, size_t, cstr, any)', (vm, buf, n, fmt, tp) => {
    const t = tp.v instanceof Ptr ? tp.v.b[tp.v.o] : tp.v;
    const s = strftime(fmt, t ?? toTm(0));
    if (s.length + 1 > n) { const p = buf.v instanceof Ptr ? buf.v : new Ptr(buf.v, 0); if (p.b.length - p.o > 0) p.b[p.o] = 0; return 0; }
    writeCstr(buf.v instanceof Ptr ? buf.v : new Ptr(buf.v, 0), s, n);
    return s.length;
  }, tmOpts);

  // ---- ESP32 / ESP8266 odds and ends used by sketches
  R.typedef('wl_status_t', 'int', H('WiFi.h', 'ESP8266WiFi.h'));
  R.typedef('portMUX_TYPE', 'int', { boards: ESP32 });
  R.konst('portMUX_INITIALIZER_UNLOCKED', 'int', 0, { boards: ESP32 });
  for (const n of ['portENTER_CRITICAL', 'portEXIT_CRITICAL', 'portENTER_CRITICAL_ISR', 'portEXIT_CRITICAL_ISR', 'taskENTER_CRITICAL', 'taskEXIT_CRITICAL']) {
    const enter = n.includes('ENTER');
    R.fn(n, 'void (any)', (vm) => { if (!vm.inIsr) vm.irqEnabled = !enter; if (!enter && vm.irqPending) vm.budget = 0; }, { boards: ESP32 });
  }
  R.fn('analogSetPinAttenuation', 'void (uint8_t, int)', () => {}, { boards: ESP32 });
  R.fn('analogReadMilliVolts', 'uint32_t (uint8_t)', (vm, pin) => Math.round((vm.analogRead(pin) / ((1 << (vm.adcBits ?? 12)) - 1)) * 3100), { boards: ESP32 });
  void textOf; void cstr; void charArray; void canon;
}

// ------------------------------------------------------------------ ArduinoJson
function addJson(R) {
  R.header('ArduinoJson.h');
  const HJ = { header: ['ArduinoJson.h'] };
  // a reference into a document: { doc, path }
  const ref = (doc, path) => ({ doc, path });
  const get = (r) => { let v = r.doc.v; for (const k of r.path) { if (v == null || typeof v !== 'object') return undefined; v = v[k]; } return v; };
  const set = (r, val) => {
    if (!r.path.length) { r.doc.v = val; return; }
    if (r.doc.v == null || typeof r.doc.v !== 'object') r.doc.v = typeof r.path[0] === 'number' ? [] : {};
    let o = r.doc.v;
    for (let i = 0; i < r.path.length - 1; i++) {
      const k = r.path[i];
      if (o[k] == null || typeof o[k] !== 'object') o[k] = typeof r.path[i + 1] === 'number' ? [] : {};
      o = o[k];
    }
    o[r.path[r.path.length - 1]] = val;
  };
  const jsValue = (v, t) => {
    const c = canon(t);
    if (c.k === 'class') {
      if (c.cls.name === 'String') return v.s;
      if (c.cls.jsonRef) { const x = c.cls.name === 'JsonDocument' ? v.v : get(v); return x === undefined ? null : JSON.parse(JSON.stringify(x)); }
      return null;
    }
    if (c.k === 'array' || c.k === 'ptr') return v == null ? null : cstr(v);
    if (c.k === 'int' && c.isBool) return !!v;
    if (c.k === 'float') return c.bits === 32 ? Number(Math.fround(v).toPrecision(7)) : v;
    return v;
  };
  const convertTo = (val, to, T) => {
    const c = canon(to);
    if (c.k === 'class' && c.cls.name === 'String') return new AStr(val == null ? 'null' : typeof val === 'object' ? JSON.stringify(val) : String(val));
    if (c.k === 'ptr') return typeof val === 'string' ? new Ptr(charArray(val), 0) : null;
    if (c.k === 'int' && c.isBool) return val ? 1 : 0;
    if (c.k === 'int' || c.k === 'enum') { const n = typeof val === 'number' ? Math.trunc(val) : typeof val === 'boolean' ? +val : 0; return c.unsigned ? (c.bits === 32 ? n >>> 0 : n & ((1 << c.bits) - 1)) : n | 0; }
    if (c.k === 'float') { const n = typeof val === 'number' ? val : 0; return c.bits === 32 ? Math.fround(n) : n; }
    void T;
    return val;
  };
  const varVal = (x) => (x && 'doc' in x ? get(x) : x?.v);
  const asM = M('void ()', (vm, r, tt) => convertTo(varVal(r), tt, vm.T), { targ: 'ret' });
  const isM = M('bool ()', (vm, r, tt) => {
    const v = varVal(r), c = canon(tt);
    if (c.k === 'int' && c.isBool) return +(typeof v === 'boolean');
    if (c.k === 'int') return +(typeof v === 'number' && Number.isInteger(v));
    if (c.k === 'float') return +(typeof v === 'number');
    if (c.k === 'ptr' || (c.k === 'class' && c.cls.name === 'String')) return +(typeof v === 'string');
    if (c.k === 'class' && c.cls.name === 'JsonArray') return +Array.isArray(v);
    if (c.k === 'class' && c.cls.name === 'JsonObject') return +(v != null && typeof v === 'object' && !Array.isArray(v));
    return 0;
  }, { targ: true });
  const toM = M('void ()', (vm, r, tt) => {
    const c = canon(tt);
    const empty = c.cls?.name === 'JsonArray' ? [] : {};
    if ('doc' in r) { set(r, empty); return r; }
    r.v = empty; return ref(r, []);
  }, { targ: 'ret' });
  const index = { type: 'JsonVariant', fn: (o, k, kt) => { const key = canon(kt).k === 'int' ? k : cstr(k?.s ?? k); return 'doc' in o ? ref(o.doc, [...o.path, key]) : ref(o, [key]); } };
  const assign = (lv, rv, rt) => { const v = jsValue(rv, rt); if ('doc' in lv) set(lv, v); else lv.v = v; };
  const common = {
    as: asM, is: isM, to: toM,
    isNull: M('bool ()', (vm, r) => +(varVal(r) == null)),
    size: M('size_t ()', (vm, r) => { const v = varVal(r); return Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0; }),
    containsKey: M('bool (cstr)', (vm, r, k) => { const v = varVal(r); return +(v != null && typeof v === 'object' && k in v); }),
    add: M(['bool (any)', 'JsonVariant ()'], [
      (vm, r, a) => { const cur = varVal(r); const arr = Array.isArray(cur) ? cur : []; arr.push(jsValue(a.v, a.t)); if ('doc' in r) set(r, arr); else r.v = arr; return 1; },
      (vm, r) => { const cur = varVal(r); const arr = Array.isArray(cur) ? cur : []; arr.push(null); if ('doc' in r) set(r, arr); else r.v = arr; return 'doc' in r ? ref(r.doc, [...r.path, arr.length - 1]) : ref(r, [arr.length - 1]); },
    ]),
    remove: M('void (cstr)', (vm, r, k) => { const v = varVal(r); if (v && typeof v === 'object') delete v[k]; }),
    clear: M('void ()', (vm, r) => { if ('doc' in r) set(r, null); else r.v = null; }),
    createNestedObject: M(['JsonObject ()', 'JsonObject (cstr)'], (vm, r, k) => { const base = 'doc' in r ? r : ref(r, []); const p = k === undefined ? null : [...base.path, k]; if (p) { set(ref(base.doc, p), {}); return ref(base.doc, p); } const cur = varVal(r); const arr = Array.isArray(cur) ? cur : []; arr.push({}); set(base, arr); return ref(base.doc, [...base.path, arr.length - 1]); }),
    createNestedArray: M(['JsonArray ()', 'JsonArray (cstr)'], (vm, r, k) => { const base = 'doc' in r ? r : ref(r, []); const p = k === undefined ? null : [...base.path, k]; if (p) { set(ref(base.doc, p), []); return ref(base.doc, p); } const cur = varVal(r); const arr = Array.isArray(cur) ? cur : []; arr.push([]); set(base, arr); return ref(base.doc, [...base.path, arr.length - 1]); }),
  };
  const printTo = (x) => JSON.stringify(varVal(x) ?? null);
  const iterate = (x) => { const v = varVal(x); const base = 'doc' in x ? x : ref(x, []); return Array.isArray(v) ? v.map((_, i) => ref(base.doc, [...base.path, i])) : []; };
  const variant = { jsonRef: true, copy: (r) => r, indexOp: index, assign, convertTo: (r, to, T) => convertTo(get(r), to, T), printTo, iterate, elemType: 'JsonVariant', methods: common, ops: { '|': { ret: 'right', fn: (r, d, dt) => { const v = get(r); return v == null ? d : convertTo(v, dt, null); } } } };
  R.cls({ name: 'JsonVariant', ...variant }, HJ);
  R.cls({ name: 'JsonObject', ...variant }, HJ);
  R.cls({ name: 'JsonArray', ...variant }, HJ);
  R.cls({ name: 'JsonVariantConst', ...variant }, HJ);
  R.cls({ name: 'JsonObjectConst', ...variant }, HJ);
  R.cls({ name: 'JsonArrayConst', ...variant }, HJ);
  const docDef = (name) => ({
    name, jsonRef: true,
    ctors: ['()', '(size_t)'],
    construct: () => ({ v: null }),
    copy: (d) => ({ v: JSON.parse(JSON.stringify(d.v)) }),
    indexOp: index,
    assign: (d, rv, rt) => { d.v = jsValue(rv, rt); },
    printTo: (d) => JSON.stringify(d.v ?? null),
    iterate: (d) => (Array.isArray(d.v) ? d.v.map((_, i) => ref(d, [i])) : []),
    elemType: 'JsonVariant',
    convertTo: (d, to, T) => convertTo(d.v, to, T),
    methods: { ...common, memoryUsage: M('size_t ()', (vm, d) => JSON.stringify(d.v ?? null).length * 2), overflowed: M('bool ()', () => 0), shrinkToFit: M('void ()', () => {}), garbageCollect: M('bool ()', () => 1) },
  });
  R.cls(docDef('JsonDocument'), HJ);
  R.cls(docDef('StaticJsonDocument'), HJ);
  R.cls(docDef('DynamicJsonDocument'), HJ);
  const ERR = ['Ok', 'EmptyInput', 'IncompleteInput', 'InvalidInput', 'NoMemory', 'TooDeep'];
  R.cls({
    name: 'DeserializationError',
    construct: () => ({ code: 0 }),
    toBool: (e) => e.code !== 0,
    printTo: (e) => ERR[e.code],
    ops: { '==': { ret: 'bool', fn: (a, b) => +((a.code ?? a) === (b.code ?? b)) }, '!=': { ret: 'bool', fn: (a, b) => +((a.code ?? a) !== (b.code ?? b)) } },
    methods: { c_str: M('const char* ()', (vm, e) => new Ptr(charArray(ERR[e.code]), 0)), code: M('int ()', (vm, e) => e.code), f_str: M('const char* ()', (vm, e) => new Ptr(charArray(ERR[e.code]), 0)) },
  }, HJ);
  ERR.forEach((n, i) => R.konst(`DeserializationError::${n}`, 'int', i, HJ));
  const inputText = (vm, a) => {
    const c = canon(a.t);
    if (c.k === 'class' && c.cls.name === 'String') return a.v.s;
    if (c.k === 'array' || c.k === 'ptr') return cstr(a.v);
    if (c.k === 'class' && c.cls.methods?.readString) { const src = vm.port(a.v.n ?? 0); const s = src.rx; src.rx = ''; return s; }
    return '';
  };
  const docOf = (a) => (a.ref ? a.ref.b[a.ref.o] : a.v);
  R.fn('deserializeJson', ['DeserializationError (any&, any)', 'DeserializationError (any&, any, size_t)'], (vm, d, input) => {
    const text = inputText(vm, input);
    vm.us += text.length * 8;
    const doc = docOf(d);
    if (!text.trim()) return { code: 1 };
    try { doc.v = JSON.parse(text); return { code: 0 }; } catch { doc.v = null; return { code: /Unexpected end/i.test(String(text)) ? 2 : 3 }; }
  }, HJ);
  const out = function* (vm, json, target, n) {
    const c = canon(target.t);
    if (c.k === 'class' && c.cls.name === 'String') { const s = target.ref ? target.ref.b[target.ref.o] : target.v; s.s += json; return json.length; }
    if (c.k === 'class' && c.cls.name === 'HardwareSerial') { yield* vm.uartWrite(target.v.n ?? 0, json); return json.length; }
    if (c.k === 'array' || c.k === 'ptr') { writeCstr(target.v instanceof Ptr ? target.v : new Ptr(target.v, 0), json, n ?? Infinity); return json.length; }
    if (c.k === 'class' && c.cls.methods?.print) { vm.warnOnce('json-out', 'serializeJson() to this kind of stream is not supported in the simulator'); return 0; }
    return 0;
  };
  const docText = (d, pretty) => { const doc = docOf(d); const v = 'doc' in doc ? get(doc) : doc.v; return JSON.stringify(v ?? null, null, pretty ? 2 : 0); };
  R.fn('serializeJson', ['size_t (any, any&)', 'size_t (any, any, size_t)'], [function* (vm, d, t) { return yield* out(vm, docText(d), t); }, function* (vm, d, t, n) { return yield* out(vm, docText(d), t, n); }], HJ);
  R.fn('serializeJsonPretty', ['size_t (any, any&)', 'size_t (any, any, size_t)'], [function* (vm, d, t) { return yield* out(vm, docText(d, true), t); }, function* (vm, d, t, n) { return yield* out(vm, docText(d, true), t, n); }], HJ);
  R.fn('measureJson', 'size_t (any)', (vm, d) => docText(d).length, HJ);
  R.fn('measureJsonPretty', 'size_t (any)', (vm, d) => docText(d, true).length, HJ);
  void printMethods; void streamMethods;
}
