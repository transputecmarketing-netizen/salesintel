// Board registry: build any supported board by type, plus a short spec
// sheet for each (used by board pickers / info panels).
import { makeBoard } from '../board.js';
import { makeMega } from './mega.js';
import { makeNano } from './nano.js';
import { makeESP32 } from './esp32.js';
import { makePico } from './pico.js';
import { makeJetson } from './jetson.js';
import { makeNodeMCU } from './nodemcu.js';
import { makeRPi5 } from './rpi5.js';
import { makeUnoR4 } from './unor4.js';
import { makeOrin } from './orin.js';

export const BOARD_TYPES = ['uno', 'mega', 'nano', 'esp32', 'pico', 'jetson', 'nodemcu', 'rpi5', 'unor4', 'orin'];

export const BOARD_INFO = {
  uno: {
    name: 'Uno-style',
    chip: 'ATmega328P',
    mcu: 'ATmega328P',
    cpu: '8-bit AVR',
    clock: '16 MHz',
    voltage: '5 V',
    flash: '32 KB',
    ram: '2 KB SRAM',
    pins: '14 digital I/O (6 PWM), 6 analog inputs',
    wireless: 'none',
    usb: 'USB-B',
    builtinLed: 'D13',
    language: 'C++',
  },
  mega: {
    name: 'Mega 2560-style',
    chip: 'ATmega2560',
    mcu: 'ATmega2560',
    cpu: '8-bit AVR',
    clock: '16 MHz',
    voltage: '5 V',
    flash: '256 KB',
    ram: '8 KB SRAM',
    pins: '54 digital I/O (15 PWM), 16 analog inputs, 4 hardware UARTs',
    wireless: 'none',
    usb: 'USB-B',
    builtinLed: 'D13',
    language: 'C++',
  },
  nano: {
    name: 'Nano-style',
    chip: 'ATmega328P',
    mcu: 'ATmega328P',
    cpu: '8-bit AVR',
    clock: '16 MHz',
    voltage: '5 V',
    flash: '32 KB',
    ram: '2 KB SRAM',
    pins: '14 digital I/O (6 PWM), 8 analog inputs, breadboard-friendly',
    wireless: 'none',
    usb: 'Mini-USB',
    builtinLed: 'D13',
    language: 'C++',
  },
  esp32: {
    name: 'ESP32 DevKit',
    chip: 'ESP32 (ESP32-WROOM-32 module)',
    mcu: 'ESP32-D0WD',
    cpu: '32-bit dual-core Xtensa LX6',
    clock: '240 MHz',
    voltage: '3.3 V logic (5 V via USB / VIN)',
    flash: '4 MB',
    ram: '520 KB SRAM',
    pins: '30-pin board: 25 GPIO (PWM on all outputs), 15 ADC, 2 DAC, touch',
    wireless: 'Wi-Fi 802.11 b/g/n + Bluetooth 4.2 / BLE',
    usb: 'Micro-USB',
    builtinLed: 'GPIO2',
    language: 'C++',
  },
  pico: {
    name: 'Pico-style',
    chip: 'RP2040',
    mcu: 'RP2040',
    cpu: '32-bit dual-core Arm Cortex-M0+',
    clock: '133 MHz',
    voltage: '3.3 V logic (1.8–5.5 V on VSYS)',
    flash: '2 MB',
    ram: '264 KB SRAM',
    pins: '26 GPIO (16 PWM channels), 3 ADC, 2 UART, 2 SPI, 2 I2C, 8 PIO state machines',
    wireless: 'none',
    usb: 'Micro-USB',
    builtinLed: 'GP25',
    language: 'MicroPython',
  },
  jetson: {
    name: 'Jetson Nano-style Dev Kit',
    chip: 'Tegra X1-class SoC',
    mcu: 'Quad-core Arm Cortex-A57 + 128-core Maxwell GPU',
    cpu: '64-bit quad-core Arm Cortex-A57',
    clock: '1.43 GHz',
    voltage: '5 V supply, 3.3 V GPIO',
    flash: 'microSD (16 GB+)',
    ram: '4 GB LPDDR4',
    pins: '40-pin Pi-compatible header (GPIO, I2C, SPI, UART, PWM), MIPI CSI-2 camera',
    wireless: 'none (M.2 Key E slot for a Wi-Fi card)',
    usb: '4× USB 3.0, micro-USB (power / device)',
    builtinLed: 'power LED',
    language: 'Python',
  },
  nodemcu: {
    name: 'NodeMCU v3 (ESP8266)',
    chip: 'ESP8266EX (ESP-12E module)',
    mcu: 'ESP8266EX',
    cpu: '32-bit single-core Tensilica L106',
    clock: '80 MHz (160 MHz option)',
    voltage: '3.3 V logic (5 V via USB / VIN)',
    flash: '4 MB',
    ram: '80 KB user data RAM',
    pins: '11 usable GPIO (D0–D8, RX, TX), 1 ADC (A0, 0–3.3 V on this board), software PWM, I2C, SPI, UART',
    wireless: 'Wi-Fi 802.11 b/g/n (2.4 GHz)',
    usb: 'Micro-USB (CH340 USB-serial)',
    builtinLed: 'D4 / GPIO2 (active-low)',
    language: 'C++',
  },
  rpi5: {
    name: 'Raspberry Pi 5-style',
    chip: 'BCM2712 SoC + RP1 I/O controller',
    mcu: 'Quad-core Arm Cortex-A76 + VideoCore VII GPU',
    cpu: '64-bit quad-core Arm Cortex-A76',
    clock: '2.4 GHz',
    voltage: '5 V 5 A USB-C supply, 3.3 V GPIO',
    flash: 'microSD (or NVMe via PCIe)',
    ram: '2 / 4 / 8 / 16 GB LPDDR4X',
    pins: '40-pin header: 26 GPIO, I2C, SPI, UART, 4 hardware PWM; 2 × 4-lane MIPI CAM/DISP, PCIe 2.0 x1',
    wireless: 'Wi-Fi 5 (802.11ac) + Bluetooth 5.0 / BLE',
    usb: '2× USB 3.0, 2× USB 2.0, USB-C (power)',
    builtinLed: 'ACT (green)',
    language: 'Python',
  },
  unor4: {
    name: 'Uno R4 WiFi-style',
    chip: 'Renesas RA4M1 + ESP32-S3 (Wi-Fi / BLE)',
    mcu: 'R7FA4M1AB3CFM',
    cpu: '32-bit Arm Cortex-M4F',
    clock: '48 MHz',
    voltage: '5 V logic (VIN 6–24 V)',
    flash: '256 KB',
    ram: '32 KB SRAM',
    pins: '14 digital I/O (6 PWM), 6 analog inputs (14-bit ADC), 12-bit DAC on A0, Qwiic I2C, CAN',
    wireless: 'Wi-Fi 802.11 b/g/n + Bluetooth LE (ESP32-S3)',
    usb: 'USB-C',
    builtinLed: 'D13 (+ 12×8 LED matrix)',
    language: 'C++',
  },
  orin: {
    name: 'Jetson Orin Nano-style Dev Kit',
    chip: 'Orin-class SoC (module)',
    mcu: '6-core Arm Cortex-A78AE + 1024-core Ampere GPU (32 Tensor Cores)',
    cpu: '64-bit 6-core Arm Cortex-A78AE',
    clock: 'up to 1.7 GHz',
    voltage: '9–20 V DC supply, 3.3 V GPIO',
    flash: 'NVMe SSD (M.2 Key M) or microSD',
    ram: '8 GB LPDDR5 (shared CPU / GPU)',
    pins: '40-pin header (GPIO, I2C, SPI, UART, PWM), 2× MIPI CSI-2 camera connectors',
    wireless: 'Wi-Fi / Bluetooth on an M.2 Key E card',
    usb: '4× USB 3.2 Type-A, USB-C, DisplayPort, Gigabit Ethernet',
    builtinLed: 'power LED',
    language: 'Python',
  },
};

const FACTORIES = { uno: makeBoard, mega: makeMega, nano: makeNano, esp32: makeESP32, pico: makePico, jetson: makeJetson, nodemcu: makeNodeMCU, rpi5: makeRPi5, unor4: makeUnoR4, orin: makeOrin };

/** Build a board API ({ id, name, group, pin(), pins, setBuiltinLed(), anchors, ... }) by type. */
export function makeBoardOfType(type = 'uno') {
  const make = FACTORIES[type];
  if (!make) throw new Error(`Unknown board type "${type}". Use one of: ${BOARD_TYPES.join(', ')}`);
  const api = make();
  if (type === 'uno') {
    // the Uno factory predates the shared contract: fill in the extras
    api.id ??= 'uno';
    api.name ??= BOARD_INFO.uno.name;
    if (!api.pins) {
      const names = ['SCL', 'SDA', 'AREF', 'GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0', 'IOREF', 'RESET', '3V3', '5V', 'GND_2', 'GND_3', 'VIN', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
      api.pins = names;
    }
    const raw = api.pin;
    api.pin = (name) => {
      const v = (() => { try { return raw(name); } catch { return undefined; } })();
      if (!v) throw new Error(`Uno-style: unknown pin "${name}". Valid pins: ${api.pins.join(', ')}`);
      return v;
    };
  }
  api.info = BOARD_INFO[type];
  return api;
}
