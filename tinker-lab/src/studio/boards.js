// Electrical description of each board Studio can use: which header pins are
// GPIO (and their Arduino pin numbers), PWM / ADC capability, power pins, the
// pins that are joined on the PCB, and the I/O electrical characteristics the
// circuit solver needs.
import { makeBoardOfType, BOARD_INFO } from '../scene/boards/index.js';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function avrPins({ digital, analog, analogBase, pwm, analogOnly = [] }) {
  const pins = {};
  for (const d of range(0, digital - 1)) pins[`D${d}`] = { num: d, gpio: true, pwm: pwm.includes(d) };
  analog.forEach((a) => {
    const num = analogBase + a;
    pins[`A${a}`] = { num, gpio: !analogOnly.includes(a), adc: a, pwm: false };
  });
  return pins;
}

export const STUDIO_BOARDS = {
  uno: {
    id: 'uno', name: 'Uno-style', runtime: 'uno', logic: 5, vin: 4.6,
    outR: 25, maxPinMA: 40, recPinMA: 20, pullup: 35000, adcBits: 10, vref: 5,
    vih: 0.6, vil: 0.3, builtinLed: 13, i2c: { SDA: 'A4', SCL: 'A5' },
    pins: avrPins({ digital: 14, analog: range(0, 5), analogBase: 14, pwm: [3, 5, 6, 9, 10, 11] }),
    power: { '5V': 5, '3V3': 3.3, VIN: 4.6, IOREF: 5 },
    gnd: ['GND', 'GND_2', 'GND_3'],
    joined: [['SDA', 'A4'], ['SCL', 'A5']],
    view: { center: [4, 0.6, 0], size: 17 },
  },
  nano: {
    id: 'nano', name: 'Nano-style', runtime: 'nano', logic: 5, vin: 4.6,
    outR: 25, maxPinMA: 40, recPinMA: 20, pullup: 35000, adcBits: 10, vref: 5,
    vih: 0.6, vil: 0.3, builtinLed: 13, i2c: { SDA: 'A4', SCL: 'A5' },
    pins: avrPins({ digital: 14, analog: range(0, 7), analogBase: 14, pwm: [3, 5, 6, 9, 10, 11], analogOnly: [6, 7] }),
    power: { '5V': 5, '3V3': 3.3, VIN: 4.6 },
    gnd: ['GND', 'GND_2'],
    joined: [['RESET', 'RESET_2']],
    view: { center: [3.2, 0.6, 0], size: 15 },
  },
  mega: {
    id: 'mega', name: 'Mega 2560-style', runtime: 'mega', logic: 5, vin: 4.6,
    outR: 25, maxPinMA: 40, recPinMA: 20, pullup: 35000, adcBits: 10, vref: 5,
    vih: 0.6, vil: 0.3, builtinLed: 13, i2c: { SDA: 'D20', SCL: 'D21' },
    pins: avrPins({ digital: 54, analog: range(0, 15), analogBase: 54, pwm: [...range(2, 13), 44, 45, 46] }),
    power: { '5V': 5, '5V_2': 5, '5V_3': 5, '3V3': 3.3, VIN: 4.6, IOREF: 5 },
    gnd: ['GND', 'GND_2', 'GND_3', 'GND_4', 'GND_5'],
    joined: [['SDA', 'D20'], ['SCL', 'D21'], ['5V', '5V_2', '5V_3']],
    view: { center: [5, 0.6, 0], size: 20 },
  },
  esp32: {
    id: 'esp32', name: 'ESP32 DevKit', runtime: 'esp32', logic: 3.3, vin: 4.7,
    outR: 40, maxPinMA: 40, recPinMA: 20, pullup: 45000, adcBits: 12, vref: 3.3,
    vih: 0.75, vil: 0.25, builtinLed: 2, i2c: { SDA: 'GPIO21', SCL: 'GPIO22' },
    pins: (() => {
      const p = {};
      const io = [2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];
      const adc = { 32: 4, 33: 5, 34: 6, 35: 7, 36: 0, 39: 3, 25: 18, 26: 19, 27: 17, 14: 16, 12: 15, 13: 14, 4: 10, 2: 12, 15: 13 };
      for (const n of io) p[`GPIO${n}`] = { num: n, gpio: true, pwm: true, adc: adc[n] ?? null };
      for (const n of [34, 35]) p[`GPIO${n}`] = { num: n, gpio: true, inputOnly: true, pwm: false, adc: adc[n] };
      p.VP = { num: 36, gpio: true, inputOnly: true, pwm: false, adc: 0 };
      p.VN = { num: 39, gpio: true, inputOnly: true, pwm: false, adc: 3 };
      p.TX0 = { num: 1, gpio: true, pwm: true, serial: true };
      p.RX0 = { num: 3, gpio: true, pwm: true, serial: true };
      return p;
    })(),
    power: { '3V3': 3.3, VIN: 4.7 },
    gnd: ['GND', 'GND_2'],
    joined: [],
    view: { center: [3.4, 0.6, 0], size: 16 },
  },
};

export const STUDIO_BOARD_ORDER = ['uno', 'nano', 'mega', 'esp32'];

/** Build the 3D board plus its electrical description. */
export function makeStudioBoard(type) {
  const def = STUDIO_BOARDS[type] ?? STUDIO_BOARDS.uno;
  const api = makeBoardOfType(def.id);
  const byNum = new Map();
  for (const [name, p] of Object.entries(def.pins)) if (!byNum.has(p.num)) byNum.set(p.num, name);
  return {
    def,
    api,
    info: BOARD_INFO[def.id],
    /** Header pin names that exist on the 3D model. */
    pinNames: api.pins.filter((n) => n !== 'NC'),
    /** Board pin name for an Arduino pin number (or analog channel for analogRead). */
    nameOfNum(num) { return byNum.get(num) ?? null; },
    analogName(pin) {
      if (def.id === 'esp32') return byNum.get(pin) ?? null;
      // analogRead(0) means A0; analogRead(A0) passes the raw pin number
      const base = def.pins.A0.num;
      if (pin >= 0 && pin < base && def.pins[`A${pin}`]) return `A${pin}`;
      return byNum.get(pin) ?? null;
    },
    /** Short label for a header pin. */
    label(name) { return name.replace(/_\d+$/, ''); },
  };
}
