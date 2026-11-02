// Track 5 — IoT with ESP32: Wi-Fi, web servers, dashboards, MQTT, Bluetooth,
// touch sensing and deep sleep on an ESP32 DevKit (3.3 V logic).
import * as THREE from 'three';
import { makeESP32 } from '../scene/boards/esp32.js';
import { makeLED, makeResistor, makeButton } from '../scene/components.js';
import { makeDHT11 } from '../scene/modules.js';
import { mat, mesh, box, cyl, at, slab, roundedRectShape, metal, smdLed, textDecal, pulseRings } from '../scene/modules/common.js';
import { v, clamp, LED_COLORS } from './helpers.js';

// ---------------------------------------------------------------- shared bits
const IP = '192.168.1.42';
const PHONE_IP = '192.168.1.23';
const BBX = -0.6, BBZ = 4.75; // breadboard centre z: just in front of the ESP32's right-hand header
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const now = () => performance.now();

const LED_OHMS = [[100, '100 Ω'], [220, '220 Ω'], [330, '330 Ω'], [1000, '1 kΩ']];
/** LED brightness for a series resistor on a 3.3 V pin (≈ 2 V across a red LED). */
const gain33 = (ohms) => clamp(((1.3 / ohms) * 1000) / 5.5, 0.05, 1);
const mA33 = (ohms) => (1.3 / ohms) * 1000;

/**
 * GPIO → resistor → LED → GND rail on the breadboard in front of the ESP32.
 * dir = 1 builds to the right of `col`, -1 to the left. GND_2 feeds the top − rail at gndCol.
 */
function ledOnGpio(ctx, bb, { pin, col, dir = 1, color = 'red', ohms = 220, gndCol }) {
  const c2 = col + 4 * dir, c3 = col + 5 * dir;
  const sig = ctx.wire(ctx.board.pin(pin), bb.hole(col, 'a'), 'orange', { signal: pin });
  const res = ctx.add(makeResistor(bb.hole(col, 'c'), bb.hole(c2, 'c'), ohms));
  const led = ctx.add(makeLED(color, bb.hole(c2, 'd'), bb.hole(c3, 'd')));
  const jump = ctx.wire(bb.hole(c3, 'b'), bb.hole(c3, 'top-'), 'black', { lift: 0.45 });
  const gw = ctx.wire(ctx.board.pin('GND_2'), bb.hole(gndCol, 'top-'), 'black', { signal: 'GND', dir: -1 });
  const state = { gain: gain33(ohms), level: 0 };
  const apply = () => { led.set(state.level * state.gain); jump.live = state.level > 0; };
  ctx.interact(led, {
    name: 'LED', hint: 'Click to change its colour',
    controls: [{ type: 'choice', label: 'Colour', options: LED_COLORS, get: () => led.color, set: (c) => led.setColor(c) }],
  });
  ctx.interact(res, {
    name: 'Resistor', hint: 'Click to try other values',
    controls: [{ type: 'choice', label: 'Resistance', options: LED_OHMS, get: () => res.ohms, set: (o) => { res.setValue(o); state.gain = gain33(o); apply(); } }],
    note: () => `(3.3 V − 2.0 V) / ${res.ohms} Ω ≈ ${mA33(res.ohms).toFixed(1)} mA${res.ohms < 150 ? ' — brighter than needed; keep GPIO current ≤ 20 mA' : ''}`,
  });
  return { led, res, sig, gw, jump, state, set: (x) => { state.level = x; apply(); } };
}

/** DHT11 module wired to 3V3 / GPIO4 / GND. Returns the module plus a live "room". */
function dhtOnGpio4(ctx, pos, gndFrom, rotY = 0) {
  const dht = ctx.add(makeDHT11(pos, { rotY }));
  ctx.wire(ctx.board.pin('3V3'), dht.pin('VCC'), 'red', { signal: '3V3', chipT: 0.85 });
  const data = ctx.wire(ctx.board.pin('GPIO4'), dht.pin('DATA'), 'yellow', { signal: 'GPIO4', chipT: 0.4 });
  const gw = ctx.wire(gndFrom ?? ctx.board.pin('GND_2'), dht.pin('GND'), 'black', { signal: 'GND', dir: -1, chipT: 0.6 });
  const room = { t: 23, h: 45, breath: 0 };
  ctx.onTick((dt) => (room.breath = Math.max(0, room.breath - dt / 10)));
  ctx.interact(dht, {
    name: 'DHT11 sensor', hint: 'Click to change the room',
    controls: [
      { type: 'range', label: 'Temperature', min: 0, max: 50, step: 1, get: () => room.t, set: (x) => (room.t = x), format: (x) => `${x} °C` },
      { type: 'range', label: 'Humidity', min: 20, max: 90, step: 1, get: () => room.h, set: (x) => (room.h = x), format: (x) => `${x} %` },
      { type: 'button', label: 'Breathe on it', press: () => (room.breath = 1) },
    ],
    note: () => 'DHT11: 0–50 °C ± 2 °C, 20–90 % RH ± 5 %, 1 reading per second at most',
  });
  // the DHT11 reports whole degrees and whole percent
  const read = () => ({ t: Math.round(room.t + room.breath * 3), h: Math.round(Math.min(95, room.h + room.breath * 30)) });
  return { dht, data, gw, room, read };
}

/** A small desk Wi-Fi router prop: two antennas, status LEDs and broadcast rings. */
function makeRouter(pos) {
  const g = new THREE.Group();
  const W = 3.6, H = 0.7, D = 2.2;
  g.add(slab(roundedRectShape(W, D, 0.35), H, mat(0x2b2f3a, { rough: 0.5 })));
  const top = textDecal(['WI-FI ROUTER', 'SSID: YOUR_WIFI · 2.4 GHz'], 2.6, 0.7, { color: '#c9ceda', sizes: [0.3, 0.2] });
  top.position.set(0, H + 0.004, -0.15);
  g.add(top);
  const antennas = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group();
    a.add(at(cyl(0.17, 0.19, 0.28, mat(0x23262e)), 0, 0.14, 0));
    a.add(at(cyl(0.09, 0.11, 2.5, mat(0x23262e, { rough: 0.45 })), 0, 1.5, 0));
    a.position.set(s * 1.35, H, -D / 2 + 0.3);
    a.rotation.z = -s * 0.12;
    g.add(a);
    antennas.push(a);
  }
  const leds = [[0x3fbf5f, -0.9], [0x23a39d, -0.5], [0xf5c02a, -0.1]].map(([c, x]) => {
    const l = smdLed(c, { glow: 0.7 });
    l.group.position.set(x, H, D / 2 - 0.28);
    g.add(l.group);
    return l;
  });
  const rings = pulseRings(0x23a39d, 0.7, 2);
  rings.group.position.set(0, H + 2.4, -D / 2 + 0.3);
  g.add(rings.group);
  g.position.copy(pos);
  g.updateMatrixWorld(true);
  let on = true, flash = 0, t = 0;
  const api = {
    group: g,
    pick: g,
    anchor: g.localToWorld(v(0, H + 2.6, -D / 2 + 0.3)),
    get on() { return on; },
    setPower(x) { on = !!x; rings.set(on); },
    activity() { flash = 0.18; },
    tick(dt) {
      t += dt;
      flash = Math.max(0, flash - dt);
      leds[0].set(on ? 1 : 0);
      leds[1].set(on ? (flash > 0 ? 0.2 : 1) : 0);
      leds[2].set(on ? (Math.sin(t * 5) > 0.6 ? 1 : 0.35) : 0);
      rings.tick(dt, 0.6);
    },
  };
  api.setPower(true);
  return api;
}

/**
 * A copper touch pad on a small PCB standing in two breadboard holes, plus a
 * finger that presses it. touch(level) 0–1 (animated); level = current proximity.
 */
function makeTouchPad(holes) {
  const g = new THREE.Group();
  const m = holes[0].clone().lerp(holes[1], 0.5);
  const H = 0.95;
  for (const p of holes) g.add(at(cyl(0.03, 0.03, H, metal(), { outline: false }), p.x, p.y + H / 2 - 0.05, p.z));
  const pcb = new THREE.Group();
  const PW = 2.3, PD = 2.0;
  pcb.add(at(box(PW, 0.12, PD, mat(0x1f7a5a, { rough: 0.55 })), 0, 0.06, 0));
  pcb.add(at(box(1.9, 0.03, 1.4, mat(0xd9904f, { metal: 0.75, rough: 0.28 }), { outline: false }), 0, 0.135, 0.18));
  const lab = textDecal('TOUCH · T0', 1.6, 0.24, { color: '#eef4ee', size: 0.6 });
  lab.position.set(0, 0.125, -0.74);
  pcb.add(lab);
  pcb.position.set(m.x, m.y + H, m.z + PD / 2 - 0.25);
  g.add(pcb);
  const padTop = pcb.position.clone().add(v(0, 0.16, 0.18));
  const finger = new THREE.Group();
  const skin = mat(0xe7b394, { rough: 0.7 });
  finger.add(at(mesh(new THREE.CapsuleGeometry(0.34, 2.4, 6, 16), skin, { outline: false }), 0, 0.34 + 1.2, 0));
  finger.add(at(mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf3d9cb, { rough: 0.35 }), { outline: false }), 0.18, 0.5, 0));
  finger.rotation.set(0.5, 0, -0.18);
  g.add(finger);
  let level = 0, target = 0;
  const place = () => {
    finger.position.set(padTop.x, padTop.y + (1 - level) * 1.6, padTop.z);
    finger.visible = level > 0.01 || target > 0; // only show the finger while it's coming in
  };
  place();
  return {
    group: g,
    pick: pcb,
    anchor: padTop.clone().add(v(0, 0.4, 0)),
    get level() { return level; },
    touch(x) { target = clamp(x, 0, 1); },
    tick(dt) {
      level += clamp(target - level, -dt * 6, dt * 6);
      place();
    },
  };
}

/** Simulate the standard "WiFi.begin → dots → connected" block. */
async function joinWifi(io, { begin = 'WiFi.begin', wait = 'delay(500)', dot = 'Serial.print(".")', ok = () => true, blink } = {}) {
  io.line(begin);
  let dots = '', n = 0, on = false;
  while (n < 4 || !ok()) {
    io.line(wait);
    if (blink) { on = !on; blink(on); }
    await io.delay(500);
    io.line(dot);
    dots += '.';
    n++;
    if (dots.length >= 12) { io.print(`Connecting${dots}`); dots = ''; }
  }
  io.print(`Connecting${dots}`);
}

const ESP32_THUMB = () => makeESP32().group;

export const esp32 = [
  // ------------------------------------------------------------------ 1
  {
    id: 'esp32-meet', title: 'Meet the ESP32', icon: 'chip',
    thumb: ESP32_THUMB,
    view: { center: [0, 0.6, 0.15], size: 8 },
    build(ctx) {
      const state = { resetReq: false };
      ctx.interact(ctx.board, {
        name: 'ESP32 DevKit', hint: 'Click to press the EN (reset) button',
        controls: [{ type: 'button', label: 'Press EN (reset)', press: () => (state.resetReq = true) }],
        note: () => 'EN restarts the chip: the ROM boot log appears, then setup() runs again.',
      });
      return { state };
    },
    callouts: [
      { anchor: 'usb', x: 0.04, y: 0.17, icon: 'usb', title: 'Micro-USB', text: 'Power, uploads and Serial — via the USB-to-UART chip next to it.' },
      { anchor: 'module', x: 0.36, y: 0.12, icon: 'chip', title: 'ESP32-WROOM-32', text: 'Two 240 MHz cores, 520 KB RAM, 4 MB flash, Wi-Fi and Bluetooth under the can.' },
      { anchor: 'antenna', x: 0.7, y: 0.17, icon: 'globe', title: 'PCB antenna', text: 'The zig-zag copper is the 2.4 GHz antenna — keep metal away from it.' },
      { anchor: 'en', x: 0.04, y: 0.68, icon: 'button', title: 'EN and BOOT', text: 'EN resets the chip. Hold BOOT while resetting to force upload mode.' },
      { anchor: 'power', x: 0.36, y: 0.72, icon: 'bolt', title: '3.3 V regulator', text: 'Turns USB 5 V into 3.3 V. GPIOs are 3.3 V only — never feed them 5 V.' },
      { anchor: 'led', x: 0.7, y: 0.68, icon: 'led', title: 'Blue LED · GPIO2', text: 'An on-board LED you can blink without any wiring.' },
    ],
    overview: {
      heading: 'Meet the ESP32',
      text: 'The ESP32 is a 3.3 V microcontroller with two 240 MHz cores, built-in Wi-Fi and Bluetooth — for the price of a sandwich. You program it in the same Arduino C++ you already know. First job: blink its blue LED and ask the chip about itself.',
      features: [['chip', 'Dual-core 32-bit CPU at 240 MHz'], ['globe', 'Wi-Fi 802.11 b/g/n and Bluetooth 4.2 / BLE'], ['bolt', '<b>3.3 V logic</b> — not 5 V tolerant']],
    },
    pinout: [
      ['GPIO2', 'Blue on-board LED', 'Also a boot strapping pin'],
      ['GPIO 4–33', 'General-purpose I/O', '3.3 V, keep each pin ≤ 20 mA'],
      ['GPIO34–39 (VP, VN)', 'Input only', 'No output, no internal pull-ups'],
      ['3V3', '3.3 V out', 'From the on-board regulator'],
      ['VIN', '5 V', 'USB 5 V out, or 5–12 V in'],
      ['GND', 'Ground', 'Two pins, one per header'],
      ['EN', 'Reset', 'Pulled LOW = chip held in reset'],
    ],
    example: {
      text: 'ESP32s are inside smart plugs, light bulbs, weather stations and countless maker projects. Before any of that, every ESP32 project starts like this: upload, open the Serial Monitor at <b>115200 baud</b>, and check the chip says hello.',
      points: ['Set the board to <b>ESP32 Dev Module</b> in the Arduino IDE', 'Press <b>EN</b> after uploading if the monitor stays blank', 'Click the board to press EN and watch it reboot'],
    },
    specs: [['Chip', 'ESP32-D0WD in a WROOM-32 module'], ['CPU', 'Dual-core Xtensa LX6, up to 240 MHz'], ['Memory', '520 KB SRAM · 4 MB flash'], ['Wireless', 'Wi-Fi 2.4 GHz b/g/n · Bluetooth 4.2 + BLE'], ['Logic level', '3.3 V (not 5 V tolerant)'], ['ADC', '12-bit (0–4095)'], ['Arduino core', 'Arduino-ESP32 2.x / 3.x']],
    quiz: [
      { q: "What logic voltage do the ESP32's GPIO pins use?", options: ['5 V', '3.3 V', '12 V', '1.8 V'], answer: 1, explain: 'ESP32 pins are 3.3 V and are not 5 V tolerant — use a level shifter or divider for 5 V signals.' },
      { q: 'Which pin drives the blue on-board LED?', options: ['GPIO13', 'GPIO0', 'GPIO2', 'GPIO34'], answer: 2, explain: 'On DevKit V1-style boards the blue LED sits on GPIO2.' },
      { q: 'How many CPU cores does the original ESP32 have?', options: ['One', 'Two', 'Four', 'Eight'], answer: 1, explain: 'Two Xtensa cores: Wi-Fi/Bluetooth tasks usually run on core 0, your setup() and loop() on core 1.' },
      { q: 'Why can’t you drive an LED from GPIO34?', options: ['It is 5 V only', 'GPIO34–39 are input-only', 'It is the reset pin', 'It is already used by the LED'], answer: 1, explain: 'GPIO34–39 have no output driver — use them for sensors and buttons (with external pull-ups).' },
    ],
    challenges: ['Blink the blue LED in an SOS pattern (··· ––– ···).', 'Print the uptime in seconds with <code>millis() / 1000</code> every time the LED turns on.', 'Print the chip’s unique ID with <code>ESP.getEfuseMac()</code> as 12 hex digits.'],
    code: `const int LED_PIN = 2;   // blue on-board LED

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Hello from the ESP32!");
  Serial.print("Chip model: ");  Serial.println(ESP.getChipModel());
  Serial.print("CPU cores: ");   Serial.println(ESP.getChipCores());
  Serial.print("CPU MHz: ");     Serial.println(ESP.getCpuFreqMHz());
  Serial.print("Flash MB: ");    Serial.println(ESP.getFlashChipSize() / (1024 * 1024));
  Serial.print("Free heap: ");   Serial.println(ESP.getFreeHeap());
  Serial.print("loop() runs on core ");
  Serial.println(xPortGetCoreID());
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED on");
  delay({{on}});
  digitalWrite(LED_PIN, LOW);
  Serial.println("LED off");
  delay({{off}});
}`,
    params: { on: { value: 500, min: 20, max: 5000 }, off: { value: 500, min: 20, max: 5000 } },
    async setup(io, b) {
      b.state.resetReq = false;
      await this.boot(io, 'rst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)');
    },
    async boot(io, rst) {
      io.print('ets Jun  8 2016 00:22:57');
      io.print(rst);
      await io.delay(200);
      io.line('Serial.begin'); await io.delay(80);
      io.line('pinMode'); await io.delay(80);
      io.line('Hello from'); io.print('Hello from the ESP32!'); await io.delay(150);
      const heap = 341000 + Math.round(Math.random() * 2400);
      const info = [['Chip model', 'ESP32-D0WD-V3'], ['CPU cores', '2'], ['CPU MHz', '240'], ['Flash MB', '4'], ['Free heap', String(heap)]];
      for (const [k, val] of info) { io.line(`"${k}: "`); io.print(`${k}: ${val}`); await io.delay(150); }
      io.line('xPortGetCoreID'); io.print('loop() runs on core 1'); await io.delay(150);
    },
    async loop(io, b, p) {
      if (b.state.resetReq) {
        b.state.resetReq = false;
        io.board.setBuiltinLed(0);
        await io.delay(300);
        await this.boot(io, 'rst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)');
      }
      io.line('HIGH'); io.board.setBuiltinLed(1);
      io.line('"LED on"'); io.print('LED on');
      io.line('delay', 1); await io.delay(p.on);
      io.line('LOW'); io.board.setBuiltinLed(0);
      io.line('"LED off"'); io.print('LED off');
      io.line('delay', 2); await io.delay(p.off);
    },
    reset(b, io) { io.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'esp32-wifi', title: 'Connect to Wi-Fi', icon: 'globe',
    thumb: () => makeRouter(v(0, 0, 0)).group,
    view: { center: [3.2, 1.0, 0.2], size: 12.5 },
    build(ctx) {
      const router = ctx.add(makeRouter(v(6.6, 0, -0.2)));
      const st = { dist: 3, walls: 0, linked: false, running: false };
      const rssi = () => Math.round(-40 - 25 * Math.log10(st.dist) - 9 * st.walls);
      const linkOk = () => router.on && rssi() > -92;
      ctx.interact(router, {
        name: 'Wi-Fi router', hint: 'Move it, add walls or switch it off',
        controls: [
          { type: 'range', label: 'Distance', min: 1, max: 60, step: 1, get: () => st.dist, set: (x) => (st.dist = x), format: (x) => `${x} m` },
          { type: 'choice', label: 'Walls in between', options: [[0, 'None'], [1, '1'], [2, '2'], [3, '3']], get: () => st.walls, set: (x) => (st.walls = x) },
          { type: 'toggle', label: 'Router power', get: () => router.on, set: (x) => router.setPower(x) },
        ],
        note: () => (router.on ? `Expected signal ≈ ${rssi()} dBm${rssi() <= -92 ? ' — too weak, the link drops' : rssi() < -75 ? ' (weak)' : rssi() < -60 ? ' (fair)' : ' (good)'}` : 'Router is off'),
      });
      const plot = ctx.plotter({ title: 'Signal strength', series: [{ name: 'RSSI dBm', color: '#23a39d', min: -100, max: -30 }] });
      ctx.anchor('router', router.anchor);
      return { router, st, rssi, linkOk, plot };
    },
    callouts: [
      { anchor: 'antenna', x: 0.04, y: 0.17, icon: 'globe', title: '2.4 GHz antenna', text: 'The ESP32 only sees 2.4 GHz networks — 5 GHz ones are invisible to it.' },
      { anchor: 'module', x: 0.36, y: 0.12, icon: 'chip', title: 'Station mode', text: '<code>WIFI_STA</code> joins an existing network, just like a phone.' },
      { anchor: 'router', x: 0.7, y: 0.17, icon: 'hand', title: 'Wi-Fi router', text: 'Click it: move it away, add walls or switch it off.' },
      { anchor: 'led', x: 0.04, y: 0.68, icon: 'led', title: 'Status LED', text: 'Blinks while connecting, steady once online.' },
    ],
    overview: {
      heading: 'Connect to Wi-Fi',
      text: 'Scan the airwaves, join your network and read back the IP address your router hands out. The sketch then reports signal strength (RSSI) and quietly reconnects if the link drops — the backbone of every IoT gadget.',
      features: [['radar', '<code>WiFi.scanNetworks()</code> lists nearby networks'], ['globe', '<code>WiFi.begin()</code>, <code>localIP()</code> and <code>RSSI()</code>'], ['gear', 'Automatic reconnect when the router disappears']],
    },
    pinout: [['GPIO2', 'Blue on-board LED', 'Connection status'], ['Antenna', 'PCB trace on the module', 'No wiring needed'], ['USB', 'Power + Serial Monitor', '115200 baud']],
    example: {
      text: 'Every smart device does this at power-up. RSSI is measured in dBm: −50 is excellent, −70 is usable, and below about −90 the link falls apart.',
      points: ['Click the router and move it to 40 m with 2 walls', 'Switch it off and back on to test the reconnect logic', 'Never commit real passwords — keep them in a separate <code>secrets.h</code>'],
    },
    specs: [['Library', '<code>WiFi.h</code> (built into the ESP32 core)'], ['Band', '2.4 GHz only, 802.11 b/g/n'], ['Security', 'Open, WPA2, WPA3 (core 3.x)'], ['IP address', 'Given by the router (DHCP)'], ['RSSI', '−30 dBm (next to it) … −90 dBm (lost)'], ['Wi-Fi current', '≈ 100–240 mA peaks while transmitting']],
    quiz: [
      { q: "Why doesn't your 5 GHz network show up in the scan?", options: ['It is hidden', 'The ESP32 radio only supports 2.4 GHz', 'The scan is too short', 'It needs WPA3'], answer: 1, explain: 'The original ESP32 has a 2.4 GHz-only radio. Many routers broadcast both bands under different names.' },
      { q: 'Which RSSI reading means the strongest signal?', options: ['−85 dBm', '−70 dBm', '−45 dBm', '−100 dBm'], answer: 2, explain: 'RSSI is negative; closer to zero is stronger. −45 dBm is excellent.' },
      { q: 'What does WiFi.localIP() return?', options: ["The router's public IP", 'The address the router gave the ESP32 on your network', 'The MAC address', 'The DNS server'], answer: 1, explain: 'DHCP on the router hands out a local address such as 192.168.1.42.' },
      { q: 'Why check WiFi.status() inside loop()?', options: ['To save power', 'Connections can drop at any time, so reconnect when they do', 'It is required by the compiler', 'To read the temperature'], answer: 1, explain: 'Routers reboot and signals fade; robust devices notice and reconnect.' },
    ],
    challenges: ['Print the MAC address with <code>WiFi.macAddress()</code>.', 'Give up after 20 seconds of dots and restart with <code>ESP.restart()</code>.', 'Light the LED only when RSSI is better than −70 dBm.'],
    code: `#include <WiFi.h>

const char* ssid     = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const int LED_PIN = 2;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  WiFi.mode(WIFI_STA);

  Serial.println("Scanning...");
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; i++) {
    Serial.printf("%d: %s (%d dBm) %s\\n", i + 1, WiFi.SSID(i).c_str(), WiFi.RSSI(i),
                  WiFi.encryptionType(i) == WIFI_AUTH_OPEN ? "open" : "secured");
  }

  WiFi.begin(ssid, password);
  Serial.print("Connecting");
  bool blink = false;
  while (WiFi.status() != WL_CONNECTED) {
    blink = !blink;
    digitalWrite(LED_PIN, blink);
    delay(500);
    Serial.print(".");
  }
  digitalWrite(LED_PIN, HIGH);   // steady = online
  Serial.println();
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_PIN, LOW);
    Serial.println("Wi-Fi lost, reconnecting...");
    WiFi.reconnect();
    delay({{retry}});
    return;
  }
  digitalWrite(LED_PIN, HIGH);
  Serial.printf("RSSI: %d dBm\\n", WiFi.RSSI());
  delay({{interval}});
}`,
    params: { retry: { value: 2000, min: 500, max: 10000 }, interval: { value: 1000, min: 200, max: 10000 } },
    async setup(io, b) {
      b.st.running = true;
      b.st.linked = false;
      b.plot.reset();
      io.line('Serial.begin'); await io.delay(80);
      io.line('WiFi.mode'); await io.delay(80);
      io.line('"Scanning..."'); io.print('Scanning...');
      io.line('WiFi.scanNetworks'); await io.delay(1500);
      const nets = [];
      if (b.linkOk()) nets.push(['YOUR_WIFI', b.rssi() + Math.round(Math.random() * 2), 'secured']);
      nets.push(['Office-Guest', -71, 'open'], ['Kitchen-Printer', -78, 'secured'], ['Cafe-Downstairs', -86, 'secured']);
      nets.sort((x, y) => y[1] - x[1]);
      for (const [i, [name, r, enc]] of nets.entries()) {
        io.line('Serial.printf("%d');
        io.print(`${i + 1}: ${name} (${r} dBm) ${enc}`);
        await io.delay(120);
      }
      await joinWifi(io, { wait: 'delay(500)', dot: 'Serial.print(".")', ok: b.linkOk, blink: (on) => io.board.setBuiltinLed(on ? 1 : 0) });
      b.st.linked = true;
      b.router.activity();
      io.line('steady = online'); io.board.setBuiltinLed(1);
      io.line('"IP address: "'); io.print(`IP address: ${IP}`);
      await io.delay(200);
    },
    async loop(io, b, p) {
      if (b.st.linked && !b.linkOk()) b.st.linked = false;
      io.line('WiFi.status() != WL_CONNECTED', 2);
      if (!b.st.linked) {
        io.line('digitalWrite(LED_PIN, LOW)'); io.board.setBuiltinLed(0);
        io.line('Wi-Fi lost'); io.print('Wi-Fi lost, reconnecting...');
        io.line('WiFi.reconnect');
        b.plot.push(-100);
        io.line(`delay(${p.retry})`); await io.delay(Math.min(p.retry, 3000));
        if (b.linkOk()) b.st.linked = true;
        io.line('return;');
        return;
      }
      b.router.activity();
      io.line('digitalWrite(LED_PIN, HIGH);', 2); io.board.setBuiltinLed(1);
      const r = b.rssi() + Math.round((Math.random() - 0.5) * 4);
      io.line('"RSSI: %d'); io.print(`RSSI: ${r} dBm`);
      b.plot.push(r);
      io.line(`delay(${p.interval})`); await io.delay(p.interval);
    },
    reset(b, io) { b.st.running = false; b.st.linked = false; io.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'esp32-webserver', title: 'LED from your phone', icon: 'globe',
    thumb: () => makeLED('red', v(0.13, 0, 0), v(-0.13, 0, 0)).group,
    view: { center: [0.9, 0.5, 2.9], size: 10 },
    build(ctx) {
      const bb = ctx.breadboard(BBX, BBZ);
      const c = ledOnGpio(ctx, bb, { pin: 'GPIO4', col: 15, dir: 1, gndCol: 11 });
      const st = { serverUp: false, pending: null, page: null, last: '' };
      const queue = [];
      const phone = ctx.browser({
        url: `http://${IP}/`, title: 'Phone browser',
        render: () => {
          if (!st.serverUp) return `<h5>Can’t reach this page</h5><p class="muted">${IP} took too long to respond. Press <b>Run</b> to start the ESP32 web server.</p>`;
          if (!st.page) return '<p class="muted">Loading…</p>';
          const on = st.page.ledOn;
          return `<h5>ESP32 LED</h5><p>LED is <b>${on ? 'ON' : 'OFF'}</b></p>
            <div style="display:flex;gap:8px;margin:10px 0"><button class="${on ? 'on' : 'off'}" data-action="get" data-value="/on" style="flex:1">ON</button><button class="${on ? 'off' : 'on'}" data-action="get" data-value="/off" style="flex:1">OFF</button></div>
            <p class="muted">${st.pending ? `Loading ${esc(st.pending)}…` : esc(st.last)}</p>`;
        },
        onAction(action, value) {
          if (action !== 'get' || !st.serverUp || st.pending) return;
          st.pending = value;
          queue.push(value);
          phone.setUrl(`http://${IP}${value}`);
        },
      });
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('sig', c.sig.mid);
      ctx.anchor('res', c.res.anchor);
      return { ...c, st, queue, phone };
    },
    callouts: [
      { anchor: 'module', x: 0.04, y: 0.17, icon: 'globe', title: 'Web server', text: '<code>WebServer</code> listens on port 80 and runs a handler for each URL.' },
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pins', title: 'GPIO4', text: '<code>/on</code> and <code>/off</code> switch this pin HIGH and LOW.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'LED + 220 Ω', text: '(3.3 V − 2 V) / 220 Ω ≈ 6 mA — plenty for an indicator.' },
      { anchor: 'antenna', x: 0.04, y: 0.68, icon: 'info', title: 'Same network', text: 'Your phone must be on the same Wi-Fi to reach 192.168.1.42.' },
    ],
    overview: {
      heading: 'Control an LED from your phone',
      text: 'The ESP32 runs a tiny web server. Open its IP address on your phone and it sends back a page with two buttons; tapping one requests <code>/on</code> or <code>/off</code>, and the matching handler flips GPIO4.',
      features: [['globe', '<code>WebServer server(80)</code> with three routes'], ['code', 'HTML built as a <code>String</code> in the sketch'], ['hand', 'Tap ON / OFF in the phone browser panel']],
    },
    pinout: [['GPIO4', '220 Ω → LED anode (+)', 'Long leg'], ['GND', 'LED cathode (–) via the − rail', 'Short leg'], ['USB', 'Power + Serial Monitor', '115200 baud']],
    example: {
      text: 'Smart plugs, garage-door openers and 3D-printer controllers all serve a little web page like this one. Each URL is an “endpoint” that does one job.',
      points: ['Add a <code>/toggle</code> route', 'Send the visitor back to <code>/</code> with a 303 redirect after a change', 'Watch the Serial Monitor: every request is logged with the phone’s IP'],
    },
    specs: [['Libraries', '<code>WiFi.h</code> + <code>WebServer.h</code> (ESP32 core)'], ['Port', '80 (HTTP)'], ['Routes', '<code>/</code>, <code>/on</code>, <code>/off</code>, 404 otherwise'], ['URL', `http://${IP}/ (yours will differ)`], ['LED current', '≈ 6 mA with 220 Ω at 3.3 V'], ['Security', 'Plain HTTP — fine at home, never expose to the internet']],
    quiz: [
      { q: 'What does server.handleClient() do?', options: ['Connects to Wi-Fi', 'Checks for an incoming HTTP request and runs the matching handler', 'Turns the LED on', 'Restarts the server'], answer: 1, explain: 'It must be called often from loop(); otherwise requests time out.' },
      { q: 'Your phone shows “can’t reach this page”. The most likely cause?', options: ['The LED is broken', 'The phone is on a different network (e.g. mobile data)', 'Port 80 is too low', 'The resistor is too big'], answer: 1, explain: '192.168.x.x addresses only exist inside your local network.' },
      { q: 'Why add a 220 Ω resistor even though the pin is only 3.3 V?', options: ['It isn’t needed', 'To limit the LED current to a safe few mA', 'To raise the voltage', 'For Wi-Fi'], answer: 1, explain: 'Without it the LED would draw far more than the ~20 mA a GPIO should supply.' },
      { q: 'What does server.on("/on", handleOn) do?', options: ['Calls handleOn() immediately', 'Registers handleOn() to run when /on is requested', 'Turns the server on', 'Opens /on in a browser'], answer: 1, explain: 'It maps a URL path to a function; handleClient() calls it later when a request arrives.' },
    ],
    challenges: ['Add a <code>/toggle</code> route and a third button.', 'Show how long the LED has been on (use <code>millis()</code>).', 'Control two LEDs, each with its own pair of routes.'],
    code: `#include <WiFi.h>
#include <WebServer.h>

const char* ssid     = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const int LED_PIN = 4;

WebServer server(80);
bool ledOn = false;

String page() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<meta name='viewport' content='width=device-width'></head>";
  html += "<body style='font-family:sans-serif'><h1>ESP32 LED</h1>";
  html += "<p>LED is <b>";
  html += ledOn ? "ON" : "OFF";
  html += "</b></p><a href='/on'><button>ON</button></a> ";
  html += "<a href='/off'><button>OFF</button></a></body></html>";
  return html;
}

void logRequest() {
  Serial.print("GET " + server.uri());
  Serial.println(" from " + server.client().remoteIP().toString());
}

void handleRoot() {
  logRequest();
  server.send(200, "text/html", page());
}

void handleOn() {
  logRequest();
  ledOn = true;
  digitalWrite(LED_PIN, HIGH);
  server.send(200, "text/html", page());
}

void handleOff() {
  logRequest();
  ledOn = false;
  digitalWrite(LED_PIN, LOW);
  server.send(200, "text/html", page());
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  WiFi.begin(ssid, password);
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Open http://");
  Serial.println(WiFi.localIP());

  server.on("/", handleRoot);
  server.on("/on", handleOn);
  server.on("/off", handleOff);
  server.onNotFound([]() { server.send(404, "text/plain", "Not found"); });
  server.begin();
}

void loop() {
  server.handleClient();
}`,
    params: {},
    async setup(io, b) {
      b.queue.length = 0;
      io.line('Serial.begin'); await io.delay(80);
      io.line('pinMode'); await io.delay(80);
      await joinWifi(io);
      io.line('"Open http://"'); io.print(`Open http://${IP}`);
      for (const r of ['server.on("/",', 'server.on("/on"', 'server.on("/off"', 'onNotFound', 'server.begin']) { io.line(r); await io.delay(120); }
      b.st.serverUp = true;
      b.st.page = null;
      b.queue.push('/');
      b.phone.update();
    },
    async loop(io, b) {
      io.line('server.handleClient');
      const path = b.queue.shift();
      if (!path) { await io.delay(50); return; }
      const fn = { '/': 'handleRoot', '/on': 'handleOn', '/off': 'handleOff' }[path];
      io.line(`void ${fn}`); await io.delay(60);
      io.line('logRequest();', ['/', '/on', '/off'].indexOf(path) + 1);
      io.print(`GET ${path} from ${PHONE_IP}`);
      if (path !== '/') {
        const on = path === '/on';
        io.line(on ? 'ledOn = true' : 'ledOn = false', on ? 1 : 2);
        io.line(on ? 'digitalWrite(LED_PIN, HIGH)' : 'digitalWrite(LED_PIN, LOW)');
        b.set(on ? 1 : 0);
        io.pin('GPIO4', on ? 'HIGH' : 'LOW', on);
        b.st.ledOn = on;
      }
      await io.delay(60);
      io.line('server.send(200', ['/', '/on', '/off'].indexOf(path) + 1);
      await io.delay(120);
      b.st.page = { ledOn: !!b.st.ledOn };
      b.st.pending = null;
      b.st.last = `GET ${path} · 200 OK`;
      b.phone.update();
    },
    reset(b) {
      b.set(0);
      b.queue.length = 0;
      Object.assign(b.st, { serverUp: false, pending: null, page: null, ledOn: false, last: '' });
      b.phone.setUrl(`http://${IP}/`);
      b.phone.update();
    },
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'esp32-dashboard', title: 'Live sensor dashboard', icon: 'thermo',
    thumb: () => makeDHT11(v(0, 0, 0)).group,
    view: { center: [0.2, 0.8, 1.6], size: 10 },
    build(ctx) {
      const s = dhtOnGpio4(ctx, v(-3.4, 0, 3.7), null, Math.PI);
      const st = { serverUp: false, loaded: false, t: null, h: null, polls: 0, lastPoll: 0, poll: 2000, sinceRead: 0, err: false };
      const queue = [];
      const phone = ctx.browser({
        url: `http://${IP}/`, title: 'Phone browser',
        render: () => {
          if (!st.serverUp) return `<h5>Can’t reach this page</h5><p class="muted">${IP} took too long to respond. Press <b>Run</b> to start the dashboard.</p>`;
          if (!st.loaded) return '<p class="muted">Loading…</p>';
          const t = st.t == null ? '--' : st.t.toFixed(1), h = st.h == null ? '--' : st.h.toFixed(0);
          return `<h5>Room dashboard</h5>
            <div class="row"><span>Temperature</span><span class="big">${t}<small style="font-size:16px"> °C</small></span></div>
            <div class="row"><span>Humidity</span><span class="big">${h}<small style="font-size:16px"> %</small></span></div>
            <p class="muted">fetch('/api') every ${st.poll} ms · ${st.polls} updates</p>`;
        },
      });
      const plot = ctx.plotter({ title: 'Readings', series: [{ name: '°C', color: '#e5412e', min: 0, max: 50 }, { name: '% RH', color: '#3b78e7', min: 0, max: 100 }] });
      ctx.onTick((dt) => {
        if (!st.loaded || !st.serverUp) return;
        st.lastPoll += dt * 1000;
        if (st.lastPoll >= st.poll && !queue.includes('/api')) { st.lastPoll = 0; queue.push('/api'); }
      });
      ctx.anchor('dht', s.dht.anchor);
      ctx.anchor('data', s.data.mid);
      return { ...s, st, queue, phone, plot };
    },
    callouts: [
      { anchor: 'module', x: 0.04, y: 0.17, icon: 'code', title: 'JSON endpoint', text: '<code>/api</code> answers <code>{"temp":23.0,"hum":45}</code> — data, not a page.' },
      { anchor: 'data', x: 0.36, y: 0.12, icon: 'pins', title: 'Data · GPIO4', text: 'The DHT11 talks over a single wire with precise timing.' },
      { anchor: 'dht', x: 0.7, y: 0.17, icon: 'thermo', title: 'DHT11', text: 'Click it to change the room — or breathe on it.' },
      { anchor: 'power', x: 0.04, y: 0.68, icon: 'bolt', title: 'Powered from 3V3', text: 'Keeps the data line at 3.3 V, safe for the ESP32.' },
    ],
    overview: {
      heading: 'Live sensor dashboard',
      text: 'Serve a page once, then let the phone fetch fresh numbers by itself. JavaScript in the page calls <code>fetch(\'/api\')</code> every two seconds; the ESP32 answers with a tiny JSON object built from the latest DHT11 reading.',
      features: [['thermo', 'DHT11 temperature + humidity on GPIO4'], ['code', 'A JSON API endpoint at <code>/api</code>'], ['wave', 'Live values in the browser and plotter']],
    },
    pinout: [['3V3', 'DHT11 VCC', '3.3–5.5 V'], ['GPIO4', 'DHT11 DATA', 'Module has a 10 kΩ pull-up'], ['GND', 'DHT11 GND', '']],
    example: {
      text: 'Home-automation sensors, greenhouse monitors and server-room alarms work exactly like this: a small JSON API that apps and dashboards poll.',
      points: ['Open <code>/api</code> directly to see the raw JSON', 'Click the DHT11 and press <b>Breathe on it</b>', 'Reading the sensor in <code>loop()</code> keeps requests fast — the handler only formats numbers'],
    },
    specs: [['Libraries', '<code>WiFi.h</code>, <code>WebServer.h</code>, <code>DHT.h</code> (Adafruit DHT sensor library)'], ['Sensor', 'DHT11: 0–50 °C ± 2 °C, 20–90 % RH ± 5 %'], ['Sample rate', '≤ 1 Hz (sketch reads every 2 s)'], ['Endpoints', '<code>/</code> (HTML) and <code>/api</code> (JSON)'], ['Polling', '<code>fetch()</code> every 2 s (the <code>poll</code> number)'], ['Supply', '3.3 V from the 3V3 pin']],
    quiz: [
      { q: 'Why does the page use fetch() instead of reloading itself?', options: ['fetch() is required by the ESP32', 'It only downloads the small JSON data, so updates are fast and smooth', 'Reloading is impossible', 'To save the battery of the sensor'], answer: 1, explain: 'The HTML is sent once; after that only a few bytes of JSON travel each update.' },
      { q: 'Why read the DHT11 in loop() rather than inside handleApi()?', options: ['The sensor is slow and must not be read more than about once a second', 'Handlers can’t call functions', 'It saves flash', 'JSON needs it'], answer: 0, explain: 'A DHT11 read takes ~20 ms and too-frequent reads return errors, so cache the last good values.' },
      { q: 'What does server.send(200, "application/json", json) tell the browser?', options: ['The request failed', 'Success, and the body is JSON', 'Redirect to /', 'Plain text'], answer: 1, explain: '200 = OK; the content type tells the page how to parse it.' },
      { q: 'Why power the DHT11 from 3V3 rather than VIN (5 V)?', options: ['It is brighter', 'Its data line is pulled up to its supply — 5 V on a GPIO could damage the ESP32', 'VIN is input only', 'The DHT11 needs exactly 3.3 V'], answer: 1, explain: 'The module’s pull-up connects DATA to VCC, so VCC must be 3.3 V for an ESP32.' },
    ],
    challenges: ['Add the heat index with <code>dht.computeHeatIndex(t, h, false)</code> to the JSON.', 'Colour the temperature red on the page above 28 °C.', 'Keep the last 30 readings in an array and serve them at <code>/history</code>.'],
    code: `#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>

const char* ssid     = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";

DHT dht(4, DHT11);           // data on GPIO4
WebServer server(80);
float tempC = NAN, humidity = NAN;
unsigned long lastRead = 0;

const char PAGE[] = R"rawliteral(
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"></head>
<body style="font-family:sans-serif">
<h2>Room dashboard</h2>
<p>Temperature: <b id="t">--</b> &deg;C</p>
<p>Humidity: <b id="h">--</b> %</p>
<script>
async function update() {
  const r = await fetch('/api');
  const d = await r.json();
  document.getElementById('t').textContent = d.temp.toFixed(1);
  document.getElementById('h').textContent = d.hum;
}
setInterval(update, {{poll}});
update();
</script></body></html>
)rawliteral";

void handleRoot() {
  Serial.println("GET /");
  server.send(200, "text/html", PAGE);
}

void handleApi() {
  if (isnan(tempC)) {
    server.send(503, "application/json", "{\\"error\\":\\"no reading yet\\"}");
    return;
  }
  String json = "{\\"temp\\":" + String(tempC, 1) + ",\\"hum\\":" + String(humidity, 0) + "}";
  Serial.println("GET /api -> " + json);
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(ssid, password);
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Dashboard: http://");
  Serial.println(WiFi.localIP());
  server.on("/", handleRoot);
  server.on("/api", handleApi);
  server.begin();
}

void loop() {
  server.handleClient();
  if (millis() - lastRead >= 2000) {    // DHT11: max ~1 reading per second
    lastRead = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      tempC = t;
      humidity = h;
    }
  }
}`,
    params: { poll: { value: 2000, min: 500, max: 10000 } },
    async setup(io, b, p) {
      b.queue.length = 0;
      b.plot.reset();
      Object.assign(b.st, { poll: p.poll, polls: 0, lastPoll: 0, t: null, h: null, loaded: false, sinceRead: 2000, readAt: 0 });
      io.line('Serial.begin'); await io.delay(80);
      io.line('dht.begin'); await io.delay(80);
      await joinWifi(io);
      io.line('"Dashboard: http://"'); io.print(`Dashboard: http://${IP}`);
      for (const r of ['server.on("/",', 'server.on("/api"', 'server.begin']) { io.line(r); await io.delay(120); }
      b.st.serverUp = true;
      b.st.readAt = now() - 2000;
      b.queue.push('/');
      b.phone.update();
    },
    async loop(io, b) {
      io.line('server.handleClient');
      const path = b.queue.shift();
      if (path === '/') {
        io.line('void handleRoot'); io.line('Serial.println("GET /")'); io.print('GET /');
        io.line('server.send(200, "text/html"'); await io.delay(120);
        b.st.loaded = true;
        b.queue.push('/api'); // update() runs once straight away
        b.phone.update();
      } else if (path === '/api') {
        io.line('void handleApi');
        if (b.cache == null) {
          io.line('isnan(tempC)'); io.line('server.send(503'); io.print('GET /api -> 503 (no reading yet)');
        } else {
          io.line('String json');
          const json = `{"temp":${b.cache.t.toFixed(1)},"hum":${b.cache.h}}`;
          io.line('"GET /api -> "'); io.print(`GET /api -> ${json}`);
          io.line('server.send(200, "application/json"');
          b.st.t = b.cache.t; b.st.h = b.cache.h; b.st.polls++;
          io.pin('GPIO4', `${b.cache.t} °C`, false);
        }
        await io.delay(60);
        b.phone.update();
      }
      if (now() - b.st.readAt >= 2000) {
        b.st.readAt = now();
        io.line('millis() - lastRead >= 2000');
        io.line('dht.readTemperature'); io.pin('GPIO4', 'DATA', true);
        await io.delay(40);
        const r = b.read();
        io.line('dht.readHumidity'); await io.delay(20);
        io.line('tempC = t'); b.cache = r;
        io.pin('GPIO4', `${r.t} °C`, false);
      }
      if (b.cache) b.plot.push(b.cache.t, b.cache.h);
      await io.delay(120);
    },
    reset(b) {
      b.queue.length = 0;
      b.cache = null;
      Object.assign(b.st, { serverUp: false, loaded: false, t: null, h: null });
      b.phone.update();
    },
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'esp32-pwm', title: 'Web dimmer with PWM', icon: 'pwm',
    thumb: () => { const l = makeLED('yellow', v(0.13, 0, 0), v(-0.13, 0, 0)); l.set(0.5); return l.group; },
    view: { center: [0.9, 0.5, 2.9], size: 10 },
    build(ctx) {
      const bb = ctx.breadboard(BBX, BBZ);
      const c = ledOnGpio(ctx, bb, { pin: 'GPIO18', col: 18, dir: 1, color: 'yellow', gndCol: 11 });
      const st = { serverUp: false, loaded: false, slider: 0, duty: 0, sent: 0 };
      const queue = [];
      const phone = ctx.browser({
        url: `http://${IP}/`, title: 'Phone browser',
        render: () => {
          if (!st.serverUp) return `<h5>Can’t reach this page</h5><p class="muted">${IP} took too long to respond. Press <b>Run</b> — the dimmer page appears after the fade test.</p>`;
          if (!st.loaded) return '<p class="muted">Loading…</p>';
          return `<h5>Dimmer</h5><input type="range" min="0" max="255" value="${st.slider}" data-action="set" aria-label="Brightness">
            <p>Brightness: <b class="pv">${st.slider}</b> <span class="muted pp">(${Math.round((st.slider * 100) / 255)} %)</span></p>
            <p class="muted pl">${st.sent} requests sent</p>`;
        },
        onAction(action, value, el) {
          if (action !== 'set' || !st.loaded) return;
          const val = clamp(Math.round(Number(value ?? el?.value ?? st.slider)), 0, 255);
          st.slider = val;
          const page = el?.closest('.page');
          if (page) {
            page.querySelector('.pv').textContent = val;
            page.querySelector('.pp').textContent = `(${Math.round((val * 100) / 255)} %)`;
          }
          // the page fires fetch('/set?v=…') on every input event; coalesce queued ones
          const last = queue[queue.length - 1];
          if (last && last.startsWith('/set')) queue[queue.length - 1] = `/set?v=${val}`;
          else queue.push(`/set?v=${val}`);
        },
      });
      ctx.interact(c.led, {
        name: 'LED on GPIO18', hint: 'Its brightness follows the PWM duty cycle',
        controls: [{ type: 'choice', label: 'Colour', options: LED_COLORS, get: () => c.led.color, set: (x) => c.led.setColor(x) }],
        note: () => `Duty ${st.duty}/255 = ${Math.round((st.duty * 100) / 255)} % → average ≈ ${((3.3 * st.duty) / 255).toFixed(2)} V at 5 kHz`,
      });
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('sig', c.sig.mid);
      ctx.anchor('res', c.res.anchor);
      return { ...c, st, queue, phone };
    },
    callouts: [
      { anchor: 'module', x: 0.04, y: 0.17, icon: 'pwm', title: 'LEDC hardware', text: '16 PWM channels with adjustable frequency and resolution.' },
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pins', title: 'GPIO18 · 5 kHz', text: 'Switches 5000 times a second; the duty sets the brightness.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'Dimmable LED', text: 'Too fast to see flicker — your eye averages it.' },
      { anchor: 'res', x: 0.04, y: 0.68, icon: 'resistor', title: '220 Ω', text: 'Still limits the peak current while the pin is HIGH.' },
    ],
    overview: {
      heading: 'Web dimmer with LEDC PWM',
      text: 'ESP32 PWM comes from LEDC, a hardware unit where you choose the frequency and resolution. Attach GPIO18 at 5 kHz with 8-bit resolution, fade the LED to test it, then dim it from a slider on your phone: each move sends <code>/set?v=128</code>.',
      features: [['pwm', '<code>ledcAttach(pin, freq, bits)</code> + <code>ledcWrite(pin, duty)</code>'], ['globe', 'Query parameters with <code>server.arg("v")</code>'], ['hand', 'Drag the slider in the phone panel']],
    },
    pinout: [['GPIO18', '220 Ω → LED anode (+)', 'Any output pin can do PWM'], ['GND', 'LED cathode (–) via the − rail', ''], ['USB', 'Power + Serial Monitor', '115200 baud']],
    example: {
      text: 'Smart bulbs, LED strips, fan controllers and screen backlights are all dimmed with PWM. A web slider is the simplest remote control you can build.',
      points: ['Our eyes are non-linear: try <code>duty = v * v / 255</code> for a smoother feel', 'Raise <code>PWM_BITS</code> to 10 for 1024 steps', 'Make the fade-test step delay shorter or longer'],
    },
    specs: [['API (core 3.x)', '<code>ledcAttach(pin, freq, bits)</code>, <code>ledcWrite(pin, duty)</code>'], ['Core 2.x equivalent', '<code>ledcSetup(ch, freq, bits)</code> + <code>ledcAttachPin(pin, ch)</code> + <code>ledcWrite(ch, duty)</code>'], ['Frequency', '5 kHz'], ['Resolution', '8 bits → duty 0–255'], ['Channels', '16 (LEDC)'], ['Route', '<code>/set?v=0…255</code>']],
    quiz: [
      { q: 'What does ledcWrite(LED_PIN, 64) produce with 8-bit resolution?', options: ['64 V', 'A 25 % duty cycle', '64 Hz', 'The LED fully on'], answer: 1, explain: '64 / 255 ≈ 25 % of each period HIGH, so the LED looks about a quarter as bright.' },
      { q: 'Which call reads the 128 from /set?v=128?', options: ['server.uri()', 'server.arg("v")', 'Serial.read()', 'WiFi.RSSI()'], answer: 1, explain: 'server.arg() returns the query parameter as a String; toInt() converts it.' },
      { q: 'Why constrain() the value before ledcWrite()?', options: ['To make it faster', 'A request like /set?v=999 must not produce an invalid duty', 'ledcWrite needs negative numbers', 'For Wi-Fi'], answer: 1, explain: 'Never trust input from the network — clamp it to the valid range.' },
      { q: 'This sketch uses ledcAttach(pin, freq, bits). Which core version is that?', options: ['Arduino-ESP32 3.x', 'AVR core', 'Core 1.0.0 only', 'MicroPython'], answer: 0, explain: 'Core 3.x attaches by pin; core 2.x used ledcSetup() with explicit channels.' },
    ],
    challenges: ['Add ON (255) and OFF (0) buttons that call <code>/set</code>.', 'Apply a gamma curve so 50 % on the slider looks half as bright.', 'Add <code>/fade</code> that breathes the LED until a new <code>/set</code> arrives.'],
    code: `#include <WiFi.h>
#include <WebServer.h>

const char* ssid     = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const int LED_PIN  = 18;
const int PWM_FREQ = 5000;   // 5 kHz
const int PWM_BITS = 8;      // duty 0–255

WebServer server(80);
int duty = 0;

const char PAGE[] = R"rawliteral(
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"></head>
<body style="font-family:sans-serif">
<h2>Dimmer</h2>
<input type="range" min="0" max="255" value="0" oninput="setLevel(this.value)">
<p>Brightness: <b id="v">0</b></p>
<script>
function setLevel(v) {
  document.getElementById('v').textContent = v;
  fetch('/set?v=' + v);
}
</script></body></html>
)rawliteral";

void handleSet() {
  if (!server.hasArg("v")) {
    server.send(400, "text/plain", "missing v");
    return;
  }
  duty = constrain(server.arg("v").toInt(), 0, 255);
  ledcWrite(LED_PIN, duty);
  Serial.printf("GET /set?v=%d -> %d%%\\n", duty, duty * 100 / 255);
  server.send(200, "text/plain", String(duty));
}

void setup() {
  Serial.begin(115200);
  ledcAttach(LED_PIN, PWM_FREQ, PWM_BITS);   // core 3.x API
  for (int d = 0; d <= 255; d++) {           // fade test: up...
    ledcWrite(LED_PIN, d);
    delay({{fade}});
  }
  for (int d = 255; d >= 0; d--) {           // ...and down
    ledcWrite(LED_PIN, d);
    delay({{fade}});
  }
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  Serial.print("Dimmer: http://");
  Serial.println(WiFi.localIP());
  server.on("/", []() { server.send(200, "text/html", PAGE); });
  server.on("/set", handleSet);
  server.begin();
}

void loop() {
  server.handleClient();
}`,
    params: { fade: { value: 4, min: 1, max: 20 } },
    async setup(io, b, p) {
      b.queue.length = 0;
      const write = (d) => { b.st.duty = d; b.set(d / 255); io.pin('GPIO18', `PWM ${d}`, d > 0); };
      io.line('Serial.begin'); await io.delay(80);
      io.line('ledcAttach'); await io.delay(150);
      // 256 steps each way on the chip; the simulation shows every 15th step (same total time)
      for (let d = 0; d <= 255; d += 15) { io.line('ledcWrite(LED_PIN, d)', 1); write(d); io.line(`delay(${p.fade})`, 1); await io.delay(p.fade * 15); }
      for (let d = 255; d >= 0; d -= 15) { io.line('ledcWrite(LED_PIN, d)', 2); write(d); io.line(`delay(${p.fade})`, 2); await io.delay(p.fade * 15); }
      write(0);
      io.line('WiFi.begin');
      for (let i = 0; i < 4; i++) { io.line('delay(500)'); await io.delay(500); }
      io.line('"Dimmer: http://"'); io.print(`Dimmer: http://${IP}`);
      io.line('server.on("/",'); await io.delay(100);
      io.line('server.on("/set"'); await io.delay(100);
      io.line('server.begin'); await io.delay(100);
      b.st.serverUp = true;
      b.queue.push('/');
      b.phone.update();
    },
    async loop(io, b) {
      io.line('server.handleClient');
      const path = b.queue.shift();
      if (!path) { await io.delay(40); return; }
      if (path === '/') {
        io.line('server.on("/",');
        await io.delay(100);
        b.st.loaded = true;
        b.phone.update();
        return;
      }
      io.line('void handleSet');
      io.line('server.hasArg');
      const v = clamp(parseInt(path.split('=')[1], 10) || 0, 0, 255);
      io.line('duty = constrain');
      io.line('ledcWrite(LED_PIN, duty)');
      b.st.duty = v; b.set(v / 255); io.pin('GPIO18', `PWM ${v}`, v > 0);
      io.line('Serial.printf("GET /set'); io.print(`GET /set?v=${v} -> ${Math.floor((v * 100) / 255)}%`);
      io.line('server.send(200, "text/plain"');
      b.st.sent++;
      const pl = b.phone.el.querySelector('.pl');
      if (pl) pl.textContent = `${b.st.sent} requests sent · last: 200 OK "${v}"`;
      await io.delay(40);
    },
    reset(b) {
      b.set(0);
      b.queue.length = 0;
      Object.assign(b.st, { serverUp: false, loaded: false, slider: 0, duty: 0, sent: 0 });
      b.phone.update();
    },
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'esp32-touch', title: 'Touch sensing', icon: 'hand',
    thumb: () => makeTouchPad([v(-0.13, 0, -0.9), v(0.13, 0, -0.9)]).group,
    view: { center: [0.9, 0.7, 2.9], size: 10 },
    build(ctx) {
      const bb = ctx.breadboard(BBX, BBZ);
      const c = ledOnGpio(ctx, bb, { pin: 'GPIO2', col: 14, dir: -1, color: 'green', gndCol: 11 });
      const pad = ctx.add(makeTouchPad([bb.hole(18, 'e'), bb.hole(20, 'e')]));
      const tw = ctx.wire(ctx.board.pin('GPIO4'), bb.hole(18, 'a'), 'purple', { signal: 'GPIO4' });
      const st = { resting: false, holding: false };
      const apply = () => pad.touch(st.holding || st.resting ? 1 : 0);
      ctx.interact(pad, {
        name: 'Touch pad', hint: 'Press and hold to touch it',
        hold: { down: () => { st.holding = true; apply(); }, up: () => { st.holding = false; apply(); } },
      });
      const plot = ctx.plotter({ title: 'touchRead(T0)', series: [{ name: 'touch', color: '#8a5cc6', min: 0, max: 90 }, { name: 'threshold', color: '#e5412e', min: 0, max: 90 }] });
      ctx.anchor('pad', pad.anchor);
      ctx.anchor('tw', tw.mid);
      ctx.anchor('led', c.led.anchor);
      return { ...c, pad, st, plot };
    },
    callouts: [
      { anchor: 'pad', x: 0.7, y: 0.17, icon: 'hand', title: 'Copper pad', text: 'Press and hold it: your finger adds capacitance.' },
      { anchor: 'tw', x: 0.36, y: 0.12, icon: 'pins', title: 'GPIO4 = T0', text: 'One of 10 touch-capable pins. No resistor needed.' },
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'LED on GPIO2', text: 'Each new touch toggles it — the blue on-board LED follows.' },
      { anchor: 'module', x: 0.04, y: 0.68, icon: 'chip', title: 'Touch sensor', text: 'Built into the chip: it counts charge cycles on the pin.' },
    ],
    overview: {
      heading: 'Touch sensing',
      text: 'Ten ESP32 pins can sense touch with nothing but a piece of metal. <code>touchRead()</code> returns a number that <b>drops</b> when a finger is near. Calibrate a baseline at start-up, set a threshold below it, and toggle an LED on each new touch.',
      features: [['hand', '<code>touchRead(T0)</code> on GPIO4 — no extra parts'], ['gear', 'Self-calibrating threshold'], ['wave', 'Watch the value fall in the plotter']],
    },
    pinout: [['GPIO4 (T0)', 'Copper touch pad', 'Any metal: foil, a coin, a screw'], ['GPIO2', '220 Ω → green LED (+)', 'Also lights the blue on-board LED'], ['GND', 'LED cathode via the − rail', '']],
    example: {
      text: 'Touch lamps, hidden buttons under a table top and water-proof control panels use exactly this trick. Put the pad behind a thin sheet of plastic or wood and it still works.',
      points: ['Lower <code>SENSITIVITY</code> if it triggers by itself', 'Long wires pick up noise — keep the pad close', 'Stick foil under a desk to make an invisible switch'],
    },
    specs: [['Function', '<code>touchRead(pin)</code>'], ['Touch pins', 'T0–T9: GPIO4, 0, 2, 15, 13, 12, 14, 27, 33, 32'], ['Untouched', '≈ 60–80 (depends on pad and wiring)'], ['Touched', '≈ 10–20 — the value falls on the original ESP32'], ['ESP32-S2/S3', 'Values rise when touched — flip the comparison'], ['Wake-up', 'Touch can also wake the chip from deep sleep']],
    quiz: [
      { q: 'On the original ESP32, what happens to touchRead() when you touch the pad?', options: ['It rises', 'It drops', 'It stays the same', 'It becomes negative'], answer: 1, explain: 'Your finger adds capacitance, so fewer charge cycles are counted and the value falls.' },
      { q: 'Why calibrate a baseline in setup()?', options: ['The untouched value depends on pad size, wiring and humidity', 'touchRead needs it to start', 'To save power', 'It makes the LED brighter'], answer: 0, explain: 'A fixed number might work on one build and fail on another; measuring makes it adaptive.' },
      { q: 'Why compare touched with wasTouched before toggling?', options: ['To debounce Wi-Fi', 'So holding your finger down toggles the LED only once', 'To read faster', 'It is required by touchRead'], answer: 1, explain: 'This is edge detection: act on the change from not-touched to touched.' },
    ],
    challenges: ['Turn the LED on only while the pad is touched.', 'Use two pads (T0 and T3/GPIO15) as up/down buttons for a PWM brightness.', 'Print how long each touch lasted, in milliseconds.'],
    code: `const int TOUCH_PIN = T0;              // GPIO4
const int LED_PIN = 2;                 // green LED + blue on-board LED
const int SENSITIVITY = {{sens}};          // % drop that counts as a touch

int threshold;
bool ledOn = false;
bool wasTouched = false;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Calibrating - don't touch the pad");
  long sum = 0;
  for (int i = 0; i < 20; i++) {
    sum += touchRead(TOUCH_PIN);
    delay(50);
  }
  int baseline = sum / 20;
  threshold = baseline * (100 - SENSITIVITY) / 100;
  Serial.printf("baseline:%d threshold:%d\\n", baseline, threshold);
}

void loop() {
  int value = touchRead(TOUCH_PIN);
  bool touched = value < threshold;
  if (touched && !wasTouched) {        // a new touch
    ledOn = !ledOn;
    digitalWrite(LED_PIN, ledOn);
  }
  wasTouched = touched;
  Serial.printf("touch:%d threshold:%d\\n", value, threshold);
  delay({{rate}});
}`,
    params: { sens: { value: 40, min: 10, max: 80 }, rate: { value: 100, min: 20, max: 1000 } },
    read(b) {
      const L = b.pad.level;
      return Math.max(4, Math.round(72 - L * L * 58 + (Math.random() - 0.5) * 3));
    },
    async setup(io, b, p) {
      b.plot.reset();
      b.ledOn = false; b.was = false;
      io.line('Serial.begin'); await io.delay(80);
      io.line('pinMode'); await io.delay(80);
      io.line('Calibrating'); io.print("Calibrating - don't touch the pad");
      let sum = 0;
      for (let i = 0; i < 20; i++) {
        io.line('sum += touchRead');
        const r = this.read(b);
        sum += r;
        io.pin('GPIO4', String(r), true);
        io.line('delay(50)'); await io.delay(50);
      }
      io.line('int baseline'); const base = Math.floor(sum / 20);
      io.line('threshold = baseline'); b.threshold = Math.floor((base * (100 - p.sens)) / 100);
      io.line('"baseline:%d'); io.print(`baseline:${base} threshold:${b.threshold}`);
      await io.delay(150);
    },
    async loop(io, b, p) {
      io.line('int value = touchRead');
      const val = this.read(b);
      io.pin('GPIO4', String(val), val < b.threshold);
      io.line('bool touched');
      const touched = val < b.threshold;
      if (touched && !b.was) {
        io.line('if (touched && !wasTouched)');
        io.line('ledOn = !ledOn'); b.ledOn = !b.ledOn;
        io.line('digitalWrite(LED_PIN, ledOn)');
        b.set(b.ledOn ? 1 : 0); io.board.setBuiltinLed(b.ledOn ? 1 : 0);
        io.pin('GPIO2', b.ledOn ? 'HIGH' : 'LOW', b.ledOn);
      }
      io.line('wasTouched = touched'); b.was = touched;
      io.line('"touch:%d'); io.print(`touch:${val} threshold:${b.threshold}`);
      b.plot.push(val, b.threshold);
      io.line(`delay(${p.rate})`); await io.delay(p.rate);
    },
    reset(b, io) { b.set(0); io.board.setBuiltinLed(0); },
  },

  // ------------------------------------------------------------------ 7
  {
    id: 'esp32-mqtt', title: 'Publish with MQTT', icon: 'serial',
    thumb: () => makeDHT11(v(0, 0, 0)).group,
    view: { center: [1.4, 0.8, 2.4], size: 12.5 },
    build(ctx) {
      const bb = ctx.breadboard(3.1, BBZ);
      const c = ledOnGpio(ctx, bb, { pin: 'GPIO5', col: 5, dir: 1, color: 'blue', gndCol: 2 });
      const s = dhtOnGpio4(ctx, v(-3.4, 0, 3.7), bb.hole(1, 'top-'), Math.PI);
      const st = { broker: true, online: false, msgs: [], temp: null, led: false, app: 'idle' };
      const inbox = []; // app → ESP32 messages, delivered by the broker
      const log = (dir, topic, payload) => {
        const t = new Date();
        st.msgs.unshift({ dir, topic, payload, time: `${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}` });
        st.msgs.length = Math.min(st.msgs.length, 6);
      };
      const app = ctx.browser({
        url: 'mqtt://test.mosquitto.org:1883', title: 'MQTT dashboard app',
        render: () => {
          const tile = 'background:#f4efe4;border-radius:8px;padding:8px 10px';
          const online = st.online && st.broker;
          return `<div class="row"><b>circuitlab/room</b><span class="muted">${online ? '● ESP32 online' : '○ waiting for ESP32'}</span></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0">
              <div style="${tile}"><span class="muted">temp</span><div class="big">${st.temp ?? '--'}<small style="font-size:15px">°C</small></div></div>
              <div style="${tile}"><span class="muted">led</span><div style="margin-top:6px"><button class="${st.led ? 'on' : 'off'}" data-action="led" style="width:100%">${st.led ? 'ON' : 'OFF'}</button></div></div>
            </div>
            <div class="muted">Messages</div>
            <div style="font:500 11px var(--mono);line-height:1.6">${st.msgs.map((m) => `<div>${m.time} ${m.dir === 'out' ? '→' : '←'} ${esc(m.topic.replace('circuitlab/room/', ''))}: <b>${esc(m.payload)}</b></div>`).join('') || '<span class="muted">No messages yet</span>'}</div>`;
        },
        onAction(action) {
          if (action !== 'led') return;
          st.led = !st.led;
          const payload = st.led ? 'on' : 'off';
          log('out', 'circuitlab/room/led', payload);
          if (st.broker) inbox.push({ payload, at: now() + 120 });
        },
      });
      ctx.interact(ctx.board, {
        name: 'Network', hint: 'Simulate the broker going down',
        controls: [{ type: 'toggle', label: 'Broker reachable', get: () => st.broker, set: (x) => { st.broker = x; app.update(); } }],
      });
      ctx.anchor('dht', s.dht.anchor);
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('sig', c.sig.mid);
      return { ...c, ...s, st, inbox, app, log };
    },
    callouts: [
      { anchor: 'dht', x: 0.04, y: 0.17, icon: 'thermo', title: 'Publisher', text: 'Temperature goes to <code>circuitlab/room/temp</code>.' },
      { anchor: 'module', x: 0.36, y: 0.12, icon: 'serial', title: 'PubSubClient', text: 'Keeps one TCP connection open to the broker on port 1883.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'Subscriber', text: 'The LED obeys <code>circuitlab/room/led</code>: “on” or “off”.' },
      { anchor: 'sig', x: 0.04, y: 0.68, icon: 'pins', title: 'GPIO5', text: 'Set by the callback whenever a message arrives.' },
    ],
    overview: {
      heading: 'Publish & subscribe with MQTT',
      text: 'MQTT is the language of IoT. Devices never talk to each other directly: they <b>publish</b> messages to topics on a broker, and anyone <b>subscribed</b> to a topic receives them. Here the ESP32 publishes temperature and listens for LED commands from a phone app.',
      features: [['serial', '<code>PubSubClient</code> publish + subscribe'], ['thermo', 'DHT11 reading every few seconds'], ['hand', 'Flip the LED switch in the app panel']],
    },
    pinout: [['GPIO4', 'DHT11 DATA', 'VCC on 3V3'], ['GPIO5', '220 Ω → blue LED (+)', ''], ['GND', '− rail: LED and DHT11', 'Fed from GND']],
    example: {
      text: 'Home Assistant, Node-RED and most cloud IoT platforms speak MQTT. The same sketch could report to all of them at once — the broker does the fan-out.',
      points: ['Public brokers are shared: use a unique topic prefix', 'Click the board and switch the broker off to test reconnects', 'Try a desktop client such as MQTT Explorer on the same topics'],
    },
    specs: [['Library', '<code>PubSubClient</code> (Nick O’Leary) + <code>DHT.h</code>'], ['Broker', '<code>test.mosquitto.org:1883</code> (public, unencrypted test broker)'], ['Publishes', '<code>circuitlab/room/temp</code> every 5 s (the <code>interval</code> number)'], ['Subscribes', '<code>circuitlab/room/led</code> → "on" / "off"'], ['Max packet', '256 bytes by default (<code>setBufferSize()</code>)'], ['Keep-alive', '15 s ping — call <code>mqtt.loop()</code> often']],
    quiz: [
      { q: 'In MQTT, who delivers a published message to subscribers?', options: ['The publisher sends it to each device', 'The broker', 'The Wi-Fi router', 'DNS'], answer: 1, explain: 'Clients only talk to the broker; it forwards each message to every subscriber of that topic.' },
      { q: 'Why must loop() call mqtt.loop() frequently?', options: ['To publish the temperature', 'It receives incoming messages and keeps the connection alive', 'To read the DHT11', 'It resets the ESP32'], answer: 1, explain: 'Without it no callbacks run and the broker drops the client after the keep-alive timeout.' },
      { q: 'Why subscribe again inside reconnect()?', options: ['Subscriptions are lost when the connection drops', 'It is faster', 'To publish', 'It is optional decoration'], answer: 0, explain: 'A new session starts clean (by default), so subscriptions must be renewed after every connect.' },
      { q: 'Why use millis() instead of delay(5000) between publishes?', options: ['delay() is not allowed on ESP32', 'So mqtt.loop() keeps running and incoming messages are handled immediately', 'millis() is more accurate', 'To save memory'], answer: 1, explain: 'A blocking delay would freeze message handling for 5 s.' },
    ],
    challenges: ['Also publish humidity to <code>circuitlab/room/hum</code>.', 'Publish the LED state back to <code>circuitlab/room/led/state</code> (retained).', 'Add a Last Will so the broker announces “offline” if the ESP32 dies.'],
    code: `#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

const char* ssid        = "YOUR_WIFI";
const char* password    = "YOUR_PASSWORD";
const char* mqtt_server = "test.mosquitto.org";   // public test broker

const int LED_PIN = 5;
DHT dht(4, DHT11);
WiFiClient espClient;
PubSubClient mqtt(espClient);
unsigned long lastPub = 0;

void onMessage(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.printf("<- %s: %s\\n", topic, msg.c_str());
  if (String(topic) == "circuitlab/room/led") {
    digitalWrite(LED_PIN, msg == "on" ? HIGH : LOW);
  }
}

void reconnect() {
  while (!mqtt.connected()) {
    Serial.print("MQTT connecting...");
    String id = "circuitlab-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (mqtt.connect(id.c_str())) {
      Serial.println("connected");
      mqtt.subscribe("circuitlab/room/led");
    } else {
      Serial.printf("failed, rc=%d. Retry in 3 s\\n", mqtt.state());
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  dht.begin();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  Serial.println("Wi-Fi OK: " + WiFi.localIP().toString());
  mqtt.setServer(mqtt_server, 1883);
  mqtt.setCallback(onMessage);
}

void loop() {
  if (!mqtt.connected()) reconnect();
  mqtt.loop();
  if (millis() - lastPub >= {{interval}}) {
    lastPub = millis();
    float t = dht.readTemperature();
    if (!isnan(t)) {
      mqtt.publish("circuitlab/room/temp", String(t, 1).c_str());
      Serial.printf("-> circuitlab/room/temp: %.1f\\n", t);
    }
  }
}`,
    params: { interval: { value: 5000, min: 1000, max: 60000 } },
    async setup(io, b) {
      b.inbox.length = 0;
      b.st.online = false;
      b.lastPub = -Infinity;
      io.line('Serial.begin'); await io.delay(80);
      io.line('pinMode'); await io.delay(60);
      io.line('dht.begin'); await io.delay(60);
      io.line('WiFi.begin');
      for (let i = 0; i < 4; i++) { io.line('delay(500)'); await io.delay(500); }
      io.line('"Wi-Fi OK: "'); io.print(`Wi-Fi OK: ${IP}`);
      io.line('mqtt.setServer'); await io.delay(100);
      io.line('mqtt.setCallback'); await io.delay(100);
    },
    async loop(io, b, p) {
      if (b.st.online && !b.st.broker) { b.st.online = false; b.app.update(); }
      io.line('if (!mqtt.connected()) reconnect()');
      while (!b.st.online) {
        io.line('Serial.print("MQTT connecting...")');
        io.line('String id'); await io.delay(300);
        io.line('if (mqtt.connect');
        await io.delay(400);
        if (b.st.broker) {
          io.line('Serial.println("connected")'); io.print('MQTT connecting...connected');
          io.line('mqtt.subscribe'); await io.delay(100);
          b.st.online = true;
          b.inbox.length = 0;
          b.app.update();
        } else {
          io.line('Serial.printf("failed'); io.print('MQTT connecting...failed, rc=-2. Retry in 3 s');
          io.line('delay(3000)'); await io.delay(3000);
        }
      }
      io.line('mqtt.loop()');
      const due = b.inbox.filter((m) => m.at <= now());
      for (const m of due) {
        b.inbox.splice(b.inbox.indexOf(m), 1);
        io.line('void onMessage'); await io.delay(40);
        io.line('Serial.printf("<- %s'); io.print(`<- circuitlab/room/led: ${m.payload}`);
        io.line('digitalWrite(LED_PIN, msg');
        const on = m.payload === 'on';
        b.set(on ? 1 : 0); io.pin('GPIO5', on ? 'HIGH' : 'LOW', on);
        await io.delay(60);
      }
      if (now() - b.lastPub >= p.interval) {
        b.lastPub = now();
        io.line('lastPub = millis()');
        io.line('dht.readTemperature'); io.pin('GPIO4', 'DATA', true); await io.delay(40);
        const t = b.read().t;
        io.pin('GPIO4', `${t} °C`, false);
        io.line('mqtt.publish'); await io.delay(40);
        io.line('Serial.printf("-> circuitlab'); io.print(`-> circuitlab/room/temp: ${t.toFixed(1)}`);
        setTimeout(() => { if (b.st.online) { b.st.temp = t.toFixed(1); b.log('in', 'circuitlab/room/temp', t.toFixed(1)); b.app.update(); } }, 150);
      }
      await io.delay(50);
    },
    reset(b) {
      b.set(0);
      b.inbox.length = 0;
      Object.assign(b.st, { online: false, led: false });
      b.app.update();
    },
  },

  // ------------------------------------------------------------------ 8
  {
    id: 'esp32-bluetooth', title: 'Bluetooth serial', icon: 'serial',
    thumb: () => makeLED('blue', v(0.13, 0, 0), v(-0.13, 0, 0)).group,
    view: { center: [0.9, 0.5, 2.9], size: 10 },
    build(ctx) {
      const bb = ctx.breadboard(BBX, BBZ);
      const c = ledOnGpio(ctx, bb, { pin: 'GPIO5', col: 18, dir: 1, color: 'blue', gndCol: 11 });
      const st = { ready: false, linked: false, reported: false, lines: [] };
      const inbox = [];
      const term = (dir, text) => { st.lines.push({ dir, text }); if (st.lines.length > 9) st.lines.shift(); };
      const phone = ctx.browser({
        url: 'bt://CircuitLab-ESP32', title: 'Bluetooth terminal app',
        render: () => {
          if (!st.ready) return '<h5>Devices</h5><p class="muted">Scanning… no “CircuitLab-ESP32” found. Press <b>Run</b> to start Bluetooth on the ESP32.</p>';
          if (!st.linked) return `<h5>Devices</h5><div class="row"><span><b>CircuitLab-ESP32</b><br><span class="muted">Classic Bluetooth · SPP</span></span><button class="on" data-action="connect">Connect</button></div>`;
          const log = st.lines.map((l) => `<div style="color:${l.dir === 'out' ? '#7fd8ff' : l.dir === 'sys' ? '#8a90a8' : '#d8f5c8'}">${l.dir === 'out' ? '&gt; ' : ''}${esc(l.text)}</div>`).join('');
          const btn = (t) => `<button data-action="send" data-value="${t}" style="flex:1;text-transform:none">${t}</button>`;
          return `<div class="row"><b>CircuitLab-ESP32</b><button class="off" data-action="disconnect">Disconnect</button></div>
            <div style="margin:8px 0;padding:8px;height:150px;overflow:hidden;border-radius:6px;background:#141a2b;font:500 11.5px var(--mono);line-height:1.5;display:flex;flex-direction:column;justify-content:flex-end">${log}</div>
            <div style="display:flex;gap:6px">${btn('on')}${btn('off')}${btn('status')}${btn('hello')}</div>`;
        },
        onAction(action, value) {
          if (action === 'connect' && st.ready) { st.linked = true; term('sys', 'Connected to CircuitLab-ESP32'); }
          if (action === 'disconnect') { st.linked = false; st.lines.length = 0; }
          if (action === 'send' && st.linked) { term('out', value); inbox.push(value); }
        },
      });
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('sig', c.sig.mid);
      return { ...c, st, inbox, phone, term };
    },
    callouts: [
      { anchor: 'antenna', x: 0.04, y: 0.17, icon: 'globe', title: 'Classic Bluetooth', text: 'Same 2.4 GHz antenna as Wi-Fi, speaking the Serial Port Profile.' },
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pins', title: 'GPIO5', text: 'Switched by the commands “on” and “off”.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'Blue LED', text: 'Answers to your phone — no Wi-Fi network needed.' },
      { anchor: 'usb', x: 0.04, y: 0.68, icon: 'usb', title: 'USB serial', text: 'Type in the Serial Monitor and it is forwarded to the phone.' },
    ],
    overview: {
      heading: 'Bluetooth serial',
      text: '<code>BluetoothSerial</code> turns the ESP32 into a wireless serial port. Pair a phone running a Bluetooth terminal app, send <code>on</code>, <code>off</code> or <code>status</code>, and the ESP32 replies. Anything you type in the Serial Monitor goes the other way.',
      features: [['serial', '<code>SerialBT</code> works just like <code>Serial</code>'], ['hand', 'Tap Connect, then the command buttons in the phone panel'], ['code', 'Line-based command parser']],
    },
    pinout: [['GPIO5', '220 Ω → blue LED (+)', ''], ['GND', 'LED cathode via the − rail', ''], ['USB', 'Serial Monitor', '115200 baud']],
    example: {
      text: 'Bluetooth serial is perfect for robots, test rigs and anything without Wi-Fi: no router, no IP address — just pair and type.',
      points: ['Android: pair in Settings, then use any “Serial Bluetooth Terminal” app', 'iPhones don’t support classic SPP — use BLE for iOS', 'Type a message in the Serial Monitor below to send it to the phone'],
    },
    specs: [['Library', '<code>BluetoothSerial.h</code> (ESP32 core)'], ['Profile', 'Classic Bluetooth SPP'], ['Chips', 'Original ESP32 only (not S2/S3/C3 — they are BLE-only)'], ['Phones', 'Android (iOS needs BLE instead)'], ['Range', '≈ 10 m indoors'], ['Flash use', '≈ 1 MB — pick a large partition scheme if needed']],
    quiz: [
      { q: 'Which ESP32 can run BluetoothSerial?', options: ['ESP32-C3', 'ESP32-S3', 'The original ESP32', 'All of them'], answer: 2, explain: 'Classic Bluetooth (needed for SPP) is only on the original ESP32; newer chips have BLE only.' },
      { q: 'What does SerialBT.available() tell you?', options: ['Whether Bluetooth is on', 'How many received bytes are waiting to be read', 'The signal strength', 'The phone’s name'], answer: 1, explain: 'It works exactly like Serial.available().' },
      { q: 'Why build up a String until "\\n" before acting?', options: ['Bytes arrive one at a time, so wait for the whole command', 'Bluetooth needs it', 'To save power', 'To pair faster'], answer: 0, explain: 'Without a line ending you might act on “o” before “n” has arrived.' },
    ],
    challenges: ['Add a <code>blink</code> command that flashes the LED five times.', 'Accept <code>pwm 128</code> to set the brightness with LEDC.', 'Send the uptime to the phone automatically every 10 seconds.'],
    code: `#include "BluetoothSerial.h"

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled - use an original ESP32
#endif

BluetoothSerial SerialBT;
const int LED_PIN = 5;
bool ledOn = false;
bool hadClient = false;
String line = "";

void handle(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  Serial.println("BT> " + cmd);
  if (cmd == "on") {
    ledOn = true;
    SerialBT.println("LED is ON");
  } else if (cmd == "off") {
    ledOn = false;
    SerialBT.println("LED is OFF");
  } else if (cmd == "status") {
    SerialBT.printf("LED %s, up %lu s\\n", ledOn ? "ON" : "OFF", millis() / 1000);
  } else {
    SerialBT.println("Unknown. Try on / off / status");
  }
  digitalWrite(LED_PIN, ledOn);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  SerialBT.begin("CircuitLab-ESP32");     // Bluetooth device name
  Serial.println("Bluetooth ready - pair with CircuitLab-ESP32");
}

void loop() {
  if (SerialBT.hasClient() != hadClient) {
    hadClient = !hadClient;
    Serial.println(hadClient ? "Phone connected" : "Phone disconnected");
  }
  while (SerialBT.available()) {          // phone -> ESP32
    char c = SerialBT.read();
    if (c == '\\n') { handle(line); line = ""; }
    else if (c != '\\r') line += c;
  }
  if (Serial.available()) {               // PC -> phone
    String msg = Serial.readStringUntil('\\n');
    SerialBT.println("PC: " + msg);
  }
  delay(20);
}`,
    params: {},
    serialInput: { placeholder: 'Message for the phone' },
    async setup(io, b) {
      b.inbox.length = 0;
      b.ledOn = false;
      b.started = now();
      Object.assign(b.st, { ready: false, linked: false, reported: false, lines: [] });
      io.line('Serial.begin'); await io.delay(80);
      io.line('pinMode'); await io.delay(80);
      io.line('SerialBT.begin'); await io.delay(500);
      io.line('"Bluetooth ready'); io.print('Bluetooth ready - pair with CircuitLab-ESP32');
      b.st.ready = true;
      b.phone.update();
    },
    async loop(io, b) {
      io.line('SerialBT.hasClient');
      if (b.st.linked !== b.st.reported) {
        b.st.reported = b.st.linked;
        io.line('hadClient = !hadClient');
        io.line('Phone connected'); io.print(b.st.linked ? 'Phone connected' : 'Phone disconnected');
        await io.delay(60);
      }
      io.line('while (SerialBT.available())');
      const cmd = b.inbox.shift();
      if (cmd != null) {
        io.line('char c = SerialBT.read()'); await io.delay(40);
        io.line("if (c == '\\n')");
        io.line('void handle'); io.line('Serial.println("BT> "'); io.print(`BT> ${cmd}`);
        let reply;
        if (cmd === 'on') { io.line('if (cmd == "on")'); io.line('ledOn = true'); b.ledOn = true; reply = 'LED is ON'; }
        else if (cmd === 'off') { io.line('"off"'); io.line('ledOn = false', 2); b.ledOn = false; reply = 'LED is OFF'; }
        else if (cmd === 'status') { io.line('"status"'); reply = `LED ${b.ledOn ? 'ON' : 'OFF'}, up ${Math.floor((now() - b.started) / 1000)} s`; }
        else { io.line('Unknown. Try'); reply = 'Unknown. Try on / off / status'; }
        await io.delay(60);
        io.line('digitalWrite(LED_PIN, ledOn)');
        b.set(b.ledOn ? 1 : 0); io.pin('GPIO5', b.ledOn ? 'HIGH' : 'LOW', b.ledOn);
        setTimeout(() => { if (b.st.linked) { b.term('in', reply); b.phone.update(); } }, 80);
        b.phone.update();
      }
      io.line('if (Serial.available())');
      const msg = io.readLine();
      if (msg != null) {
        io.line('readStringUntil'); io.line('"PC: "');
        if (b.st.linked) { b.term('in', `PC: ${msg}`); b.phone.update(); }
      }
      io.line('delay(20)'); await io.delay(30);
    },
    reset(b) {
      b.set(0);
      b.inbox.length = 0;
      Object.assign(b.st, { ready: false, linked: false, reported: false, lines: [] });
      b.phone.update();
    },
  },

  // ------------------------------------------------------------------ 9
  {
    id: 'esp32-deepsleep', title: 'Deep sleep', icon: 'timer',
    thumb: ESP32_THUMB,
    view: { center: [0.9, 0.5, 2.9], size: 10 },
    build(ctx) {
      const bb = ctx.breadboard(BBX, BBZ);
      const btn = ctx.add(makeButton([bb.hole(15, 'e'), bb.hole(17, 'e'), bb.hole(15, 'f'), bb.hole(17, 'f')], 0x2f6fd8));
      const res = ctx.add(makeResistor(bb.hole(15, 'c'), bb.hole(19, 'c'), 10000));
      const w4 = ctx.wire(ctx.board.pin('GPIO4'), bb.hole(15, 'a'), 'yellow', { signal: 'GPIO4' });
      ctx.wire(ctx.board.pin('3V3'), bb.hole(10, 'top+'), 'red', { signal: '3V3' });
      ctx.wire(bb.hole(17, 'top+'), bb.hole(17, 'b'), 'red', { lift: 0.45 });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(11, 'top-'), 'black', { signal: 'GND', dir: -1 });
      ctx.wire(bb.hole(19, 'b'), bb.hole(19, 'top-'), 'black', { lift: 0.45 });
      const st = { boot: 0, mA: 0, asleep: false, running: false, pressed: false, t: 0 };
      ctx.interact(btn, {
        name: 'Wake button', hint: 'Press to wake the ESP32 early (EXT0 on GPIO4)',
        hold: { down: () => { btn.press(true); st.pressed = true; }, up: () => { btn.press(false); st.pressed = false; } },
      });
      ctx.interact(res, { name: '10 kΩ pull-down', hint: 'Holds GPIO4 LOW until the button connects it to 3V3' });
      const plot = ctx.plotter({ title: 'Supply current', series: [{ name: 'mA', color: '#e5412e', min: 0, max: 100 }] });
      ctx.onTick((dt) => {
        if (!st.running) return;
        st.t += dt;
        if (st.t < 0.1) return;
        st.t = 0;
        plot.push(st.asleep ? 0.01 : Math.round(st.mA + (Math.random() - 0.5) * 6));
      });
      ctx.interact(ctx.board, {
        name: 'ESP32 DevKit', hint: 'Watch the current meter',
        note: () => (!st.running ? 'Run the sketch to start the wake/sleep cycle.' : st.asleep ? 'Deep sleep: CPU, RAM and radio off — the chip draws ≈ 10 µA. Long sleeps are shortened to 4 s in this simulation.' : `Awake: ≈ ${st.mA} mA`),
      });
      ctx.anchor('btn', btn.anchor);
      ctx.anchor('res', res.anchor);
      ctx.anchor('w4', w4.mid);
      return { btn, res, st, plot };
    },
    callouts: [
      { anchor: 'module', x: 0.04, y: 0.17, icon: 'timer', title: 'RTC timer', text: 'Keeps ticking at ≈ 10 µA while everything else sleeps.' },
      { anchor: 'w4', x: 0.36, y: 0.12, icon: 'pins', title: 'GPIO4 · EXT0', text: 'An RTC pin: a HIGH here wakes the chip early.' },
      { anchor: 'btn', x: 0.7, y: 0.17, icon: 'button', title: 'Wake button', text: 'Hold it while the chip sleeps to wake it now.' },
      { anchor: 'res', x: 0.04, y: 0.68, icon: 'resistor', title: '10 kΩ pull-down', text: 'Keeps GPIO4 LOW so it doesn’t wake by accident.' },
    ],
    overview: {
      heading: 'Deep sleep',
      text: 'Awake, an ESP32 draws tens of milliamps — a battery lasts days. In deep sleep the CPU and radio switch off and only the RTC keeps time, at about 10 µA. Each wake-up restarts <code>setup()</code>; an <code>RTC_DATA_ATTR</code> variable remembers how many times.',
      features: [['timer', '<code>esp_sleep_enable_timer_wakeup()</code>'], ['button', 'Wake early with a button on RTC pin GPIO4'], ['wave', 'Current plot: ≈ 80 mA awake vs ≈ 10 µA asleep']],
    },
    pinout: [['GPIO4', 'Button → 3V3, 10 kΩ → GND', 'EXT0 wake source (RTC GPIO)'], ['3V3', 'Button via the + rail', ''], ['GND', '10 kΩ via the − rail', ''], ['GPIO2', 'On-board LED', 'Flashes once per wake']],
    example: {
      text: 'Battery sensors wake, measure, send and sleep. Awake 1 s at 80 mA every 60 s and asleep at 10 µA averages ≈ 1.3 mA — about two months on a 2000 mAh cell instead of one day.',
      points: ['Set the sleep time with the <code>SLEEP_S</code> number', 'Hold the blue button during sleep to wake via EXT0', 'A DevKit’s regulator, USB chip and power LED draw milliamps — use a bare module on batteries'],
    },
    specs: [['Header', '<code>esp_sleep.h</code> (ESP-IDF, included by the core)'], ['Timer wake', '<code>esp_sleep_enable_timer_wakeup(µs)</code>'], ['Pin wake', '<code>esp_sleep_enable_ext0_wakeup(GPIO_NUM_4, 1)</code>'], ['Sleep current', '≈ 10 µA (chip, RTC timer on)'], ['Awake current', '≈ 40–80 mA without Wi-Fi, 100–240 mA with'], ['Memory kept', '8 KB RTC slow memory (<code>RTC_DATA_ATTR</code>)']],
    quiz: [
      { q: 'What happens when the ESP32 wakes from deep sleep?', options: ['loop() continues where it stopped', 'It reboots and runs setup() again', 'Nothing until you press EN', 'It reconnects USB'], answer: 1, explain: 'Deep sleep powers down the CPU and RAM, so the program starts from the top.' },
      { q: 'Why is bootCount marked RTC_DATA_ATTR?', options: ['To make it faster', 'It is stored in RTC memory, which survives deep sleep', 'To save flash', 'So Serial can print it'], answer: 1, explain: 'Normal variables are lost on wake-up; RTC slow memory stays powered.' },
      { q: 'esp_sleep_enable_timer_wakeup() takes its time in…', options: ['Seconds', 'Milliseconds', 'Microseconds', 'Minutes'], answer: 2, explain: 'That’s why the sketch multiplies by 1,000,000ULL — ULL keeps the large number 64-bit.' },
      { q: 'Which pins can wake the chip with EXT0?', options: ['Any GPIO', 'Only RTC GPIOs such as 0, 2, 4, 12–15, 25–27, 32–39', 'Only GPIO2', 'Only the EN pin'], answer: 1, explain: 'During deep sleep only the RTC domain is powered, so only RTC-capable pins can wake it.' },
    ],
    challenges: ['Sleep for 10 s normally, but only 2 s after a button wake.', 'Store the last five wake reasons in an <code>RTC_DATA_ATTR</code> array and print them.', 'Connect to Wi-Fi on each wake, publish <code>bootCount</code> with MQTT, then sleep.'],
    code: `#include "esp_sleep.h"

const int LED_PIN = 2;
const gpio_num_t WAKE_PIN = GPIO_NUM_4;   // button to 3V3, 10k to GND
const int SLEEP_S = {{sleep}};

RTC_DATA_ATTR int bootCount = 0;          // survives deep sleep

void printWakeReason() {
  switch (esp_sleep_get_wakeup_cause()) {
    case ESP_SLEEP_WAKEUP_TIMER: Serial.println("Wake reason: timer"); break;
    case ESP_SLEEP_WAKEUP_EXT0:  Serial.println("Wake reason: button on GPIO4"); break;
    default:                     Serial.println("Wake reason: power-on or reset"); break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  bootCount++;
  Serial.printf("Boot #%d\\n", bootCount);
  printWakeReason();

  pinMode(LED_PIN, OUTPUT);                // the "work": one short flash
  digitalWrite(LED_PIN, HIGH);
  delay(300);
  digitalWrite(LED_PIN, LOW);

  esp_sleep_enable_timer_wakeup(SLEEP_S * 1000000ULL);
  esp_sleep_enable_ext0_wakeup(WAKE_PIN, 1);   // wake when GPIO4 goes HIGH
  Serial.printf("Sleeping for %d s\\n", SLEEP_S);
  Serial.flush();
  esp_deep_sleep_start();                  // never returns
}

void loop() {
  // never runs: every wake-up starts again at setup()
}`,
    params: { sleep: { value: 5, min: 1, max: 3600 } },
    async awake(io, b, p, reason) {
      b.st.asleep = false;
      b.st.mA = 78;
      io.line('Serial.begin'); await io.delay(60);
      io.line('delay(100)'); await io.delay(100);
      io.line('bootCount++'); b.st.boot++;
      io.line('"Boot #%d'); io.print(`Boot #${b.st.boot}`);
      io.line('printWakeReason();');
      const caseLine = { timer: 'case ESP_SLEEP_WAKEUP_TIMER', ext0: 'case ESP_SLEEP_WAKEUP_EXT0', power: 'default:' }[reason];
      io.line(caseLine); await io.delay(60);
      io.print({ timer: 'Wake reason: timer', ext0: 'Wake reason: button on GPIO4', power: 'Wake reason: power-on or reset' }[reason]);
      io.line('pinMode'); await io.delay(40);
      io.line('digitalWrite(LED_PIN, HIGH)'); io.board.setBuiltinLed(1); b.st.mA = 81;
      io.line('delay(300)'); await io.delay(300);
      io.line('digitalWrite(LED_PIN, LOW)'); io.board.setBuiltinLed(0); b.st.mA = 78;
      io.line('esp_sleep_enable_timer_wakeup'); await io.delay(40);
      io.line('esp_sleep_enable_ext0_wakeup'); await io.delay(40);
      io.line('"Sleeping for %d s'); io.print(`Sleeping for ${p.sleep} s`);
      io.line('Serial.flush'); await io.delay(60);
      io.line('esp_deep_sleep_start');
      io.pin('GPIO4', 'LOW', false);
      b.st.asleep = true;
    },
    async setup(io, b, p) {
      b.plot.reset();
      Object.assign(b.st, { boot: 0, running: true, asleep: false, mA: 78 });
      await this.awake(io, b, p, 'power');
    },
    async loop(io, b, p) {
      // asleep: nothing runs. Long sleeps are compressed to 4 s of real time.
      const ms = Math.min(p.sleep, 4) * 1000;
      const t0 = now();
      let reason = 'timer';
      while (now() - t0 < ms) {
        if (b.st.pressed) { reason = 'ext0'; break; }
        await io.delay(50);
      }
      if (reason === 'ext0') io.pin('GPIO4', 'HIGH', true);
      b.st.asleep = false;
      b.st.mA = 60;
      io.print('ets Jun  8 2016 00:22:57');
      io.print('rst:0x5 (DEEPSLEEP_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)');
      await io.delay(250);
      await this.awake(io, b, p, reason);
    },
    reset(b, io) {
      Object.assign(b.st, { running: false, asleep: false, mA: 0 });
      b.btn.press(false);
      io.board.setBuiltinLed(0);
    },
  },
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['chip', 'ESP32 DevKit', 'Dual-core 240 MHz board with Wi-Fi and Bluetooth. 3.3 V logic.', 'esp32-meet'],
  ['globe', 'Wi-Fi router', 'The access point an ESP32 joins in station mode (2.4 GHz only).', 'esp32-wifi'],
  ['thermo', 'DHT11', 'Digital temperature and humidity sensor on one data wire.', 'esp32-dashboard'],
  ['hand', 'Touch pad', 'Any piece of metal on a touch pin becomes a capacitive button.', 'esp32-touch'],
  ['serial', 'MQTT broker', 'Server that passes published messages on to every subscriber.', 'esp32-mqtt'],
];
