// Track — NodeMCU v3 (ESP8266): the classic Wi-Fi board, programmed in
// Arduino C++ with the ESP8266 core (ESP8266WiFi, ESP8266WebServer,
// ESP8266HTTPClient). 3.3 V logic; the on-board blue LED (GPIO2 / D4) is
// active-low. The simulation follows each sketch step by step: it does not
// run the C++, and it never talks to a real network.
import * as THREE from 'three';
import { makeNodeMCU } from '../scene/boards/nodemcu.js';
import { makeRelay, makeLamp, makeDHT11, makeOLED } from '../scene/modules.js';
import { mat, box, cyl, at, slab, roundedRectShape, smdLed, textDecal, pulseRings } from '../scene/modules/common.js';
import { v, clamp } from './helpers.js';

// ---------------------------------------------------------------- shared bits
const IP = '192.168.1.57';
const PHONE_IP = '192.168.1.23';
const AP_IP = '192.168.4.1';
const BB = [0.4, 5.6]; // breadboard in front of the D0…3V3 row
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pad2 = (n) => String(n).padStart(2, '0');

/** Desk Wi-Fi router prop with two antennas, status LEDs and broadcast rings. */
function makeRouter(pos) {
  const g = new THREE.Group();
  const W = 3.6, H = 0.7, D = 2.2;
  g.add(slab(roundedRectShape(W, D, 0.35), H, mat(0x2b2f3a, { rough: 0.5 })));
  const top = textDecal(['WI-FI ROUTER', 'SSID: YOUR_WIFI · 2.4 GHz'], 2.6, 0.7, { color: '#c9ceda', sizes: [0.3, 0.2] });
  top.position.set(0, H + 0.004, -0.15);
  g.add(top);
  for (const s of [-1, 1]) {
    const a = new THREE.Group();
    a.add(at(cyl(0.17, 0.19, 0.28, mat(0x23262e)), 0, 0.14, 0));
    a.add(at(cyl(0.09, 0.11, 2.5, mat(0x23262e, { rough: 0.45 })), 0, 1.5, 0));
    a.position.set(s * 1.35, H, -D / 2 + 0.3);
    a.rotation.z = -s * 0.12;
    g.add(a);
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
    kind: 'prop',
    label: 'Wi-Fi router',
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

/** Router + its controls; returns { router, st, rssi(), ok() }. */
function wifiRouter(ctx, pos, { dist = 4 } = {}) {
  const router = ctx.add(makeRouter(pos));
  const st = { dist, walls: 0 };
  const rssi = () => Math.round(-40 - 25 * Math.log10(st.dist) - 9 * st.walls);
  const ok = () => router.on && rssi() > -90;
  ctx.interact(router, {
    name: 'Wi-Fi router', hint: 'Move it, add walls or switch it off',
    controls: [
      { type: 'range', label: 'Distance', min: 1, max: 60, step: 1, get: () => st.dist, set: (x) => (st.dist = x), format: (x) => `${x} m` },
      { type: 'choice', label: 'Walls in between', options: [[0, 'None'], [1, '1'], [2, '2'], [3, '3']], get: () => st.walls, set: (x) => (st.walls = x) },
      { type: 'toggle', label: 'Router power', get: () => router.on, set: (x) => router.setPower(x) },
    ],
    note: () => (router.on ? `Expected signal ≈ ${rssi()} dBm${rssi() <= -90 ? ': too weak, the link drops' : ''}` : 'Router is off'),
  });
  ctx.anchor('router', router.anchor);
  return { router, st, rssi, ok };
}

/** The standard "WiFi.begin → dots → connected" block (waits until ok() is true). */
async function joinWifi(io, ok, { blink } = {}) {
  io.line('WiFi.begin');
  let dots = '', n = 0, lit = false;
  while (n < 4 || !ok()) {
    io.line('delay(500)');
    if (blink) { lit = !lit; blink(lit); }
    await io.delay(500);
    io.line('Serial.print(".")');
    dots += '.';
    n++;
    if (dots.length >= 16) { io.print(dots); dots = ''; }
  }
  if (dots) io.print(dots);
}

/** ESP8266 ROM boot banner (printed at 74880 baud, so it looks garbled at 115200). */
function romBanner(io, cause = 2, mode = '(3,6)') {
  io.print('\uFFFDl\uFFFD\uFFFD|\uFFFD\uFFFDl\uFFFD|\uFFFD\uFFFD\uFFFDb|\uFFFD\uFFFDl\uFFFDr\uFFFD\uFFFD');
  io.print(`(ROM boot log at 74880 baud: ets Jan  8 2013,rst cause:${cause}, boot mode:${mode})`);
}

const THUMB = () => makeNodeMCU().group;

export const nodemcu = [
  // ------------------------------------------------------------------ 1
  {
    id: 'node-meet', title: 'Meet the NodeMCU', icon: 'chip', board: 'nodemcu',
    thumb: THUMB,
    view: { center: [0, 0.5, 0.1], size: 8 },
    build(ctx) {
      const st = { resetReq: false, flashHeld: false, inBootloader: false };
      ctx.interact(ctx.board, {
        name: 'NodeMCU v3 (ESP8266)', hint: 'Press RST, or hold FLASH while resetting',
        controls: [
          { type: 'button', label: 'Press RST', press: () => (st.resetReq = true) },
          { type: 'toggle', label: 'Hold FLASH (GPIO0 low)', get: () => st.flashHeld, set: (x) => (st.flashHeld = x) },
        ],
        note: () => (st.flashHeld ? 'FLASH pulls GPIO0 LOW: the next reset enters the serial bootloader instead of your sketch.' : 'RST restarts the chip; your sketch starts again from setup().'),
      });
      return { st };
    },
    callouts: [
      { anchor: 'usb', x: 0.04, y: 0.17, icon: 'usb', title: 'Micro-USB + CH340', text: 'Power, uploads and Serial through the CH340 USB-serial chip.' },
      { anchor: 'module', x: 0.36, y: 0.12, icon: 'chip', title: 'ESP-12E module', text: 'ESP8266 at 80 MHz, 4 MB flash and Wi-Fi under the metal shield.' },
      { anchor: 'antenna', x: 0.7, y: 0.17, icon: 'globe', title: 'PCB antenna', text: 'The zig-zag trace is the 2.4 GHz antenna: keep it clear of metal.' },
      { anchor: 'rst', x: 0.04, y: 0.68, icon: 'button', title: 'RST and FLASH', text: 'RST reboots. FLASH (GPIO0) held during reset = upload mode.' },
      { anchor: 'gpio', x: 0.36, y: 0.74, icon: 'pins', title: 'D0 … D8', text: 'Board labels, not GPIO numbers: D4 is GPIO2, D1 is GPIO5.' },
      { anchor: 'led', x: 0.7, y: 0.68, icon: 'led', title: 'Blue LED · D4', text: 'Active-low: <code>LOW</code> turns it <b>on</b>.' },
    ],
    overview: {
      heading: 'Meet the NodeMCU',
      text: 'The NodeMCU v3 puts an ESP8266 Wi-Fi chip, a USB-serial converter and a 3.3 V regulator on one cheap board. You program it in Arduino C++ with the ESP8266 core. First job: blink the blue LED, which is wired the “wrong” way round: <code>LOW</code> lights it.',
      features: [['chip', 'ESP8266: one 32-bit core at 80 MHz, 4 MB flash'], ['led', 'Blue LED on GPIO2 (D4), <b>active-low</b>'], ['bolt', '<b>3.3 V logic</b>; A0 reads 0–3.3 V on this board']],
    },
    pinout: [
      ['D4 (GPIO2)', 'Blue LED on the ESP-12E', 'Active-low; also a boot pin (must be HIGH at boot)'],
      ['D0 (GPIO16)', 'GPIO, wake from deep sleep', 'No PWM or interrupts'],
      ['D1 / D2 (GPIO5 / 4)', 'Default I²C SCL / SDA', 'Safest general-purpose pins'],
      ['D3 (GPIO0)', 'FLASH button', 'LOW at boot = bootloader'],
      ['D8 (GPIO15)', 'GPIO', 'Must be LOW at boot (pull-down on board)'],
      ['A0', 'Analog input', '10-bit, 0–3.3 V via the on-board divider'],
      ['VIN / VU', '5 V', 'USB 5 V out, or 5 V in on VIN'],
      ['3V3, GND', '3.3 V out, ground', 'Several of each'],
    ],
    example: {
      text: 'The ESP8266 made Wi-Fi gadgets cheap: early smart plugs, LED strips and sensor nodes ran on exactly this chip. Every project starts with the same check: upload, open the Serial Monitor at <b>115200 baud</b> and see the chip say hello.',
      points: ['Choose <b>NodeMCU 1.0 (ESP-12E Module)</b> in the Arduino IDE after adding the ESP8266 board package', 'The garbled line at boot is the ROM log at 74880 baud, not an error', 'Click the board: press RST, then try holding FLASH while you reset'],
    },
    specs: [['Chip', 'ESP8266EX in an ESP-12E module'], ['CPU', 'Tensilica L106, 80 MHz (160 MHz option)'], ['Memory', '≈ 80 KB for your data · 4 MB flash'], ['Wireless', 'Wi-Fi 802.11 b/g/n, 2.4 GHz only'], ['USB-serial', 'CH340 (install its driver if no port appears)'], ['Logic level', '3.3 V (not 5 V tolerant)'], ['Arduino core', 'ESP8266 core 3.x (Boards Manager: esp8266)']],
    quiz: [
      { q: 'You write digitalWrite(LED_BUILTIN, LOW). What does the blue LED do?', options: ['Turns off', 'Turns on', 'Nothing, LOW is ignored', 'Blinks'], answer: 1, explain: 'The LED is wired from 3.3 V through a resistor to GPIO2, so the pin sinks current when it is LOW: active-low.' },
      { q: 'Which GPIO number is the pin labelled D1?', options: ['GPIO1', 'GPIO5', 'GPIO16', 'GPIO2'], answer: 1, explain: 'NodeMCU labels are not GPIO numbers. D1 = GPIO5, D2 = GPIO4, D4 = GPIO2. In sketches you can write D1 directly.' },
      { q: 'Why does a garbled line appear before your first message?', options: ['The board is broken', 'The ROM boot log is sent at 74880 baud', 'The CH340 is overheating', 'Wi-Fi interference'], answer: 1, explain: 'The ESP8266 boot ROM prints at 74880 baud; at 115200 it looks like noise. Set the monitor to 74880 to read it.' },
      { q: 'What happens if you hold FLASH while pressing RST?', options: ['Wi-Fi resets', 'The chip starts the serial bootloader, ready for an upload', 'The flash is erased', 'The LED turns on'], answer: 1, explain: 'FLASH pulls GPIO0 low. If GPIO0 is low at reset, the ROM waits for new firmware instead of running your sketch.' },
    ],
    challenges: ['Blink SOS (··· ––– ···) on the blue LED.', 'Print the uptime in seconds with <code>millis() / 1000</code> each time the LED turns on.', 'Add a second LED on D2 (GPIO4) with a 220 Ω resistor and blink the two alternately.'],
    code: `// NodeMCU v3: the blue LED on the ESP-12E is wired to GPIO2 (D4)
// and is active-LOW: writing LOW turns it ON.
const int LED = LED_BUILTIN;   // = 2 (D4) on the NodeMCU

void setup() {
  Serial.begin(115200);
  Serial.println();
  pinMode(LED, OUTPUT);
  Serial.println("Hello from the ESP8266!");
  Serial.printf("Chip ID: %06X\\n", ESP.getChipId());
  Serial.printf("CPU: %u MHz\\n", ESP.getCpuFreqMHz());
  Serial.printf("Flash: %u KB\\n", ESP.getFlashChipRealSize() / 1024);
  Serial.printf("Free heap: %u bytes\\n", ESP.getFreeHeap());
}

void loop() {
  digitalWrite(LED, LOW);    // LOW = LED on
  Serial.println("LED on");
  delay({{on}});
  digitalWrite(LED, HIGH);   // HIGH = LED off
  Serial.println("LED off");
  delay({{off}});
}`,
    params: { on: { value: 500, min: 20, max: 5000 }, off: { value: 500, min: 20, max: 5000 } },
    hw: (b, io) => ({
      // GPIO2 drives the active-low LED: 0 (LOW) lights it
      digitalWrite: (pin, val) => { if (pin === 2) io.board.setBuiltinLed(val ? 0 : 1); },
    }),
    async setup(io, b) {
      b.st.resetReq = false;
      io.board.setBuiltinLed(0);
      romBanner(io, 2, '(3,6)');
      await this.boot(io, b);
    },
    async boot(io) {
      await io.delay(200);
      io.line('Serial.begin'); await io.delay(80);
      io.line('pinMode'); await io.delay(80);
      io.line('Hello from'); io.print('Hello from the ESP8266!'); await io.delay(120);
      const heap = 51800 + Math.round(Math.random() * 600);
      io.line('Chip ID'); io.print('Chip ID: 3A7C21'); await io.delay(120);
      io.line('CPU: %u'); io.print('CPU: 80 MHz'); await io.delay(120);
      io.line('Flash: %u'); io.print('Flash: 4096 KB'); await io.delay(120);
      io.line('Free heap'); io.print(`Free heap: ${heap} bytes`); await io.delay(120);
    },
    async loop(io, b, p) {
      const st = b.st;
      if (st.resetReq) {
        st.resetReq = false;
        io.board.setBuiltinLed(0);
        await io.delay(300);
        if (st.flashHeld) {
          romBanner(io, 2, '(1,7)');
          io.print('(GPIO0 was LOW: the ROM bootloader is waiting for an upload. Release FLASH and press RST.)');
          st.inBootloader = true;
        } else {
          romBanner(io, 2, '(3,6)');
          st.inBootloader = false;
          await this.boot(io, b);
        }
      }
      if (st.inBootloader) { await io.delay(200); return; }
      io.line('digitalWrite(LED, LOW)'); io.board.setBuiltinLed(1);
      io.line('"LED on"'); io.print('LED on');
      io.line('delay', 1); await io.delay(p.on);
      io.line('digitalWrite(LED, HIGH)'); io.board.setBuiltinLed(0);
      io.line('"LED off"'); io.print('LED off');
      io.line('delay', 2); await io.delay(p.off);
    },
    reset(b, io) { io.board.setBuiltinLed(0); b.st.inBootloader = false; b.st.resetReq = false; },
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'node-wifi', title: 'Station and AP mode', icon: 'globe', board: 'nodemcu',
    thumb: () => makeRouter(v(0, 0, 0)).group,
    view: { center: [2.4, 1.2, -0.9], size: 12.5 },
    build(ctx) {
      const w = wifiRouter(ctx, v(5.6, 0, -3.4));
      const st = { ap: false, sta: false, phoneJoined: false, phoneWants: false, running: false };
      const phone = ctx.browser({
        url: 'Settings › Wi-Fi', title: 'Phone · Wi-Fi settings',
        render: () => {
          const nets = [];
          if (w.router.on) nets.push(['YOUR_WIFI', w.rssi() > -70 ? 'strong' : w.rssi() > -85 ? 'fair' : 'weak', false]);
          if (st.ap) nets.push(['NodeMCU-Setup', 'strong', true]);
          nets.push(['Neighbour-5G', 'fair', false]);
          const rows = nets.map(([n, s, mine]) => `<div class="row"><span>${esc(n)} <small class="muted">${s}</small></span>${mine ? (st.phoneJoined ? '<button class="on" data-action="leave">Joined</button>' : '<button data-action="join">Join</button>') : '<small class="muted">WPA2</small>'}</div>`).join('');
          return `<h5>Wi-Fi networks</h5>${rows}<p class="muted">${st.ap ? (st.phoneJoined ? `Phone got ${AP_IP.replace(/1$/, '2')} from the NodeMCU’s own network.` : 'Tap <b>Join</b> to connect the phone to the NodeMCU’s access point (password tinkerlab).') : 'Press <b>Run</b>: the NodeMCU will start its own network, NodeMCU-Setup.'}</p>`;
        },
        onAction(action) {
          if (action === 'join' && st.ap) st.phoneJoined = true;
          if (action === 'leave') st.phoneJoined = false;
        },
      });
      return { ...w, st, phone };
    },
    callouts: [
      { anchor: 'antenna', x: 0.04, y: 0.17, icon: 'globe', title: 'One radio, two roles', text: '<code>WIFI_AP_STA</code>: a station on your router and an access point at once.' },
      { anchor: 'router', x: 0.36, y: 0.12, icon: 'hand', title: 'Your router', text: 'Click it: move it away, add walls or switch it off.' },
      { anchor: 'module', x: 0.7, y: 0.17, icon: 'chip', title: 'Soft AP', text: '“NodeMCU-Setup” at 192.168.4.1: phones can join it directly.' },
      { anchor: 'led', x: 0.04, y: 0.68, icon: 'led', title: 'Online LED', text: 'On (pin LOW) while the station link is up.' },
    ],
    overview: {
      heading: 'Station and access point',
      text: 'In <b>station</b> mode the ESP8266 joins your router like a phone does. In <b>access-point</b> mode it makes its own network, which is how gadgets let you set them up before they know your Wi-Fi. This sketch does both at once and reports each link.',
      features: [['globe', '<code>WiFi.mode(WIFI_AP_STA)</code>, <code>softAP()</code> and <code>begin()</code>'], ['radar', '<code>RSSI()</code> and <code>softAPgetStationNum()</code>'], ['hand', 'Join the AP from the phone panel']],
    },
    pinout: [['D4 (GPIO2)', 'Blue LED', 'Station status, active-low'], ['Antenna', 'PCB trace on the ESP-12E', 'No wiring'], ['USB', 'Power + Serial Monitor', '115200 baud']],
    example: {
      text: 'Smart plugs and sensors use this trick out of the box: they start an access point, you join it with your phone, type your home Wi-Fi details into a little page, and the device switches to station mode.',
      points: ['Move the router to 40 m behind 2 walls and watch the station drop while the AP keeps working', 'Join <b>NodeMCU-Setup</b> on the phone and see the station count change', 'The AP password must be at least 8 characters, or <code>softAP()</code> fails'],
    },
    specs: [['Library', '<code>ESP8266WiFi.h</code> (ESP8266 core)'], ['Modes', 'WIFI_STA, WIFI_AP, WIFI_AP_STA, WIFI_OFF'], ['Soft AP', 'Up to 8 clients (4 by default), 192.168.4.1'], ['Band', '2.4 GHz only'], ['Channel', 'In AP_STA mode the AP follows the router’s channel'], ['Current', '≈ 70 mA average, 170 mA+ transmit peaks']],
    quiz: [
      { q: 'What IP address does the ESP8266 soft AP give itself by default?', options: ['192.168.1.1', '192.168.4.1', '10.0.0.1', 'It has none'], answer: 1, explain: 'The soft AP runs its own DHCP server on 192.168.4.x and takes .1 for itself.' },
      { q: 'Why can’t the NodeMCU see your 5 GHz network?', options: ['It is hidden', 'The ESP8266 radio is 2.4 GHz only', 'The CH340 blocks it', 'It needs AP mode'], answer: 1, explain: 'The ESP8266 supports 802.11 b/g/n at 2.4 GHz only.' },
      { q: 'In WIFI_AP_STA mode the router changes channel. What happens to the soft AP?', options: ['Nothing', 'It moves to the same channel, briefly dropping its clients', 'It switches off for good', 'It becomes 5 GHz'], answer: 1, explain: 'There is one radio, so the AP must share the station’s channel.' },
      { q: 'Which call tells you how many phones are on the NodeMCU’s own network?', options: ['WiFi.RSSI()', 'WiFi.softAPgetStationNum()', 'WiFi.status()', 'WiFi.localIP()'], answer: 1, explain: 'softAPgetStationNum() counts clients joined to the soft AP.' },
    ],
    challenges: ['Print the soft AP’s MAC address with <code>WiFi.softAPmacAddress()</code>.', 'Blink the LED quickly while the station is not connected, steady when online.', 'Turn the AP off (<code>WiFi.softAPdisconnect(true)</code>) 60 s after the station connects.'],
    code: `#include <ESP8266WiFi.h>

const char* ssid     = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* apName   = "NodeMCU-Setup";
const char* apPass   = "tinkerlab";       // 8 characters or more

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);        // LED off
  WiFi.mode(WIFI_AP_STA);                 // station + access point
  WiFi.softAP(apName, apPass);
  Serial.print("AP ready: ");
  Serial.print(apName);
  Serial.print(" at ");
  Serial.println(WiFi.softAPIP());
  WiFi.begin(ssid, password);
  Serial.print("Joining ");
  Serial.println(ssid);
}

void loop() {
  static wl_status_t last = WL_IDLE_STATUS;
  wl_status_t now = WiFi.status();
  if (now != last) {
    last = now;
    if (now == WL_CONNECTED) {
      Serial.print("Station IP: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("Station: not connected");
    }
  }
  digitalWrite(LED_BUILTIN, now == WL_CONNECTED ? LOW : HIGH);
  if (now == WL_CONNECTED) Serial.printf("RSSI %d dBm | ", WiFi.RSSI());
  Serial.printf("%d phone(s) on the AP\\n", WiFi.softAPgetStationNum());
  delay({{interval}});
}`,
    params: { interval: { value: 2000, min: 250, max: 10000 } },
    async setup(io, b) {
      const st = b.st;
      Object.assign(st, { ap: false, sta: false, last: 'idle', joinAt: 0 });
      io.line('Serial.begin'); await io.delay(60);
      io.line('pinMode'); await io.delay(60);
      io.line('digitalWrite(LED_BUILTIN, HIGH)'); io.board.setBuiltinLed(0);
      io.line('WiFi.mode'); await io.delay(150);
      io.line('WiFi.softAP('); await io.delay(250);
      st.ap = true; b.phone.update();
      io.line('println(WiFi.softAPIP'); io.print(`AP ready: NodeMCU-Setup at ${AP_IP}`);
      io.line('WiFi.begin'); await io.delay(100);
      io.line('"Joining "'); io.print('Joining YOUR_WIFI');
      st.joinAt = performance.now() + 2500; // DHCP + association take a moment
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('wl_status_t now = WiFi.status()');
      const linked = b.ok() && performance.now() > st.joinAt;
      const now = linked ? 'connected' : 'down';
      if (!linked && st.sta) st.joinAt = performance.now() + 3000; // lost: reconnect takes a few seconds
      st.sta = linked;
      if (now !== st.last) {
        st.last = now;
        if (linked) { io.line('"Station IP: "'); io.print(`Station IP: ${IP}`); }
        else { io.line('"Station: not connected"'); io.print('Station: not connected'); }
      }
      io.line('digitalWrite(LED_BUILTIN, now');
      io.board.setBuiltinLed(linked ? 1 : 0);
      if (linked) b.router.activity();
      const n = st.phoneJoined ? 1 : 0;
      io.line('phone(s) on the AP');
      io.print(`${linked ? `RSSI ${b.rssi() + Math.round((Math.random() - 0.5) * 4)} dBm | ` : ''}${n} phone(s) on the AP`);
      b.phone.update();
      io.line(`delay(${p.interval})`); await io.delay(p.interval);
    },
    reset(b, io) {
      Object.assign(b.st, { ap: false, sta: false, phoneJoined: false });
      io.board.setBuiltinLed(0);
      b.phone.update();
    },
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'node-webserver', title: 'Relay from a web page', icon: 'plug', board: 'nodemcu',
    thumb: () => makeRelay(v(0, 0, 0)).group,
    view: { center: [5.2, 1.4, 2.6], size: 18, az: -8 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const relay = ctx.add(makeRelay(v(8.2, 0, 0.2)));
      const lamp = ctx.add(makeLamp(v(14.6, 0, 1.0), { rotY: -0.5 }));
      // 5 V and GND onto the breadboard rails
      ctx.wire(ctx.board.pin('VIN'), bb.hole(2, 'bot+'), 'red', { signal: '5V', lift: 2.4 });
      ctx.wire(ctx.board.pin('GND'), bb.hole(4, 'bot-'), 'black', { signal: 'GND', dir: -1, lift: 1.6 });
      const sig = ctx.wire(ctx.board.pin('D1'), relay.pin('IN'), 'orange', { signal: 'D1', lift: 2.2 });
      ctx.wire(bb.hole(24, 'bot+'), relay.pin('VCC'), 'red', { signal: '5V', lift: 2.0 });
      ctx.wire(bb.hole(25, 'bot-'), relay.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.8 });
      const com = ctx.wire(bb.hole(28, 'bot+'), relay.pin('COM'), 'red', { signal: 'COM', lift: 2.6 });
      const no = ctx.wire(relay.pin('NO'), lamp.terminal(0), 'yellow', { signal: 'NO', lift: 2.0 });
      ctx.wire(lamp.terminal(1), bb.hole(30, 'bot-'), 'black', { signal: 'GND', dir: -1, lift: 2.6 });
      const st = { serverUp: false, pending: null, page: null, last: '', relayOn: false, active: 'high' };
      const queue = [];
      const phone = ctx.browser({
        url: `http://${IP}/`, title: 'Phone browser',
        render: () => {
          if (!st.serverUp) return `<h5>Can’t reach this page</h5><p class="muted">${IP} took too long to respond. Press <b>Run</b> to start the web server.</p>`;
          if (!st.page) return '<p class="muted">Loading…</p>';
          const on = st.page.on;
          return `<h5>Desk lamp</h5><p>The lamp is <b>${on ? 'ON' : 'OFF'}</b></p>
            <div style="display:flex;gap:6px;margin:10px 0"><button class="${on ? 'on' : 'off'}" data-action="get" data-value="/on" style="flex:1">On</button><button class="${on ? 'off' : 'on'}" data-action="get" data-value="/off" style="flex:1">Off</button><button data-action="get" data-value="/toggle" style="flex:1">Toggle</button></div>
            <p class="muted">${st.pending ? `Loading ${esc(st.pending)}…` : esc(st.last)}</p>`;
        },
        onAction(action, value) {
          if (action !== 'get' || !st.serverUp || st.pending) return;
          st.pending = value;
          queue.push(value);
          phone.setUrl(`http://${IP}${value}`);
        },
      });
      ctx.interact(relay, {
        name: 'Relay module', hint: '5 V coil, 3.3 V-friendly transistor input',
        controls: [{ type: 'choice', label: 'Module trigger', options: [['high', 'High-level (IN HIGH = on)'], ['low', 'Low-level (IN LOW = on)']], get: () => st.active, set: (x) => { st.active = x; apply(); } }],
        note: () => (st.active === 'high' ? 'Matches the sketch: HIGH on D1 energises the coil.' : 'This module switches on when IN is LOW: the sketch now works backwards. Invert the digitalWrite.'),
      });
      ctx.interact(lamp, { name: '5 V LED desk lamp', hint: 'Low voltage only: never switch mains on a breadboard' });
      const apply = () => {
        const coil = st.active === 'high' ? st.relayOn : !st.relayOn;
        relay.set(coil);
        lamp.set(coil);
        com.live = no.live = coil;
      };
      ctx.anchor('relay', relay.anchor);
      ctx.anchor('lamp', lamp.anchor);
      ctx.anchor('sig', sig.mid);
      ctx.anchor('rail', bb.hole(14, 'bot+'));
      return { relay, lamp, st, queue, phone, apply };
    },
    callouts: [
      { anchor: 'module', x: 0.04, y: 0.17, icon: 'globe', title: 'Web server', text: '<code>ESP8266WebServer</code> on port 80 runs one handler per URL.' },
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pins', title: 'D1 → IN', text: 'A 3.3 V signal drives the module’s transistor, not the coil itself.' },
      { anchor: 'relay', x: 0.7, y: 0.17, icon: 'plug', title: 'Relay', text: 'Click it: some modules switch on when IN is LOW.' },
      { anchor: 'rail', x: 0.04, y: 0.68, icon: 'bolt', title: 'VIN = USB 5 V', text: 'Powers the relay coil (≈ 70 mA) and the little lamp.' },
      { anchor: 'lamp', x: 0.36, y: 0.74, icon: 'sun', title: 'COM → NO → lamp', text: 'The contacts close a separate circuit. Low voltage only.' },
    ],
    overview: {
      heading: 'Switch a lamp from your phone',
      text: 'The NodeMCU serves a page with three buttons. Each one requests a URL (<code>/on</code>, <code>/off</code>, <code>/toggle</code>); its handler drives D1, the relay clicks, and its contacts switch a 5 V lamp in a completely separate circuit.',
      features: [['globe', '<code>ESP8266WebServer server(80)</code> with four routes'], ['plug', 'A relay module isolates the load from the ESP8266'], ['hand', 'Tap the buttons in the phone panel']],
    },
    pinout: [
      ['D1 (GPIO5)', 'Relay IN', 'HIGH = coil on (high-level module)'],
      ['VIN (5 V)', 'Breadboard + rail → relay VCC, relay COM', 'USB 5 V'],
      ['GND', 'Breadboard − rail → relay GND, lamp −', 'Common ground'],
      ['Relay NO', 'Lamp +', 'Closed only while the coil is on'],
    ],
    example: {
      text: 'Smart plugs are exactly this: a Wi-Fi chip, a relay and a tiny web or cloud interface. Commercial ones are certified for mains; your breadboard is not, so switch only low-voltage loads.',
      points: ['Tap Toggle a few times and watch the Serial Monitor log each request', 'Click the relay and choose a low-level module: the lamp now does the opposite', 'Use the <b>NC</b> contact instead of NO to make a lamp that is on until you switch it off'],
    },
    specs: [['Libraries', '<code>ESP8266WiFi.h</code> + <code>ESP8266WebServer.h</code>'], ['Routes', '<code>/</code>, <code>/on</code>, <code>/off</code>, <code>/toggle</code>, 404'], ['Relay', '5 V coil, contacts rated 10 A (but keep to low voltage here)'], ['Input', 'Transistor + diode on the module: safe from a 3.3 V pin'], ['URL', `http://${IP}/ (yours will differ)`], ['Security', 'Plain HTTP with no password: home network only']],
    quiz: [
      { q: 'Why not connect the relay coil straight to D1?', options: ['It would be too fast', 'A coil needs ≈ 70 mA at 5 V; a GPIO gives 3.3 V and about 12 mA', 'Relays only work on A0', 'It would reverse the logic'], answer: 1, explain: 'The module’s transistor switches the coil current from 5 V; the pin only drives the transistor.' },
      { q: 'What does the lambda in server.on("/on", []() { … }) do?', options: ['Runs once at startup', 'Is called whenever a browser requests /on', 'Turns the server on', 'Sends an email'], answer: 1, explain: 'server.on() stores the function; handleClient() calls it when that URL is requested.' },
      { q: 'The lamp is on whenever the page says OFF. Most likely cause?', options: ['Broken Wi-Fi', 'A low-level-trigger relay module', 'Wrong IP', 'The lamp is wired to NC and NO at once'], answer: 1, explain: 'Many modules energise when IN is LOW. Invert the output (or use NC) to match.' },
      { q: 'Why must loop() keep calling server.handleClient()?', options: ['It reconnects Wi-Fi', 'It checks for incoming requests; without it pages time out', 'It refreshes the relay', 'It is optional'], answer: 1, explain: 'The server only answers requests when handleClient() runs, so loop() must never block for long.' },
    ],
    challenges: ['Add a <code>/status</code> route that returns <code>{"on":true}</code> as JSON.', 'Switch the lamp off automatically 10 minutes after it was turned on, using <code>millis()</code>.', 'Protect the page with <code>server.authenticate("admin", "…")</code> and <code>requestAuthentication()</code>.'],
    code: `#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

const char* ssid     = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const int RELAY = D1;                  // GPIO5 -> relay module IN

ESP8266WebServer server(80);
bool relayOn = false;

String page() {
  String html = F("<!DOCTYPE html><html><head>"
                  "<meta name='viewport' content='width=device-width'>"
                  "</head><body style='font-family:sans-serif'>"
                  "<h1>Desk lamp</h1><p>The lamp is <b>");
  html += relayOn ? "ON" : "OFF";
  html += F("</b></p><a href='/on'><button>On</button></a> "
            "<a href='/off'><button>Off</button></a> "
            "<a href='/toggle'><button>Toggle</button></a></body></html>");
  return html;
}

void setRelay(bool on) {
  relayOn = on;
  digitalWrite(RELAY, on ? HIGH : LOW);
  Serial.println(on ? "Relay ON" : "Relay OFF");
}

void sendPage() {
  Serial.println("GET " + server.uri() + " from " + server.client().remoteIP().toString());
  server.send(200, "text/html", page());
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY, OUTPUT);
  setRelay(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Open http://");
  Serial.println(WiFi.localIP());

  server.on("/", sendPage);
  server.on("/on", []() { setRelay(true); sendPage(); });
  server.on("/off", []() { setRelay(false); sendPage(); });
  server.on("/toggle", []() { setRelay(!relayOn); sendPage(); });
  server.onNotFound([]() { server.send(404, "text/plain", "Not found"); });
  server.begin();
}

void loop() {
  server.handleClient();
}`,
    params: {},
    async setup(io, b) {
      b.queue.length = 0;
      io.line('Serial.begin'); await io.delay(60);
      io.line('pinMode(RELAY'); await io.delay(60);
      io.line('setRelay(false)'); b.st.relayOn = false; b.apply(); io.print('Relay OFF'); io.pin('D1', 'LOW', false);
      io.line('WiFi.mode'); await io.delay(80);
      await joinWifi(io, () => true);
      io.line('"Open http://"'); io.print(`Open http://${IP}`);
      for (const r of ['server.on("/",', 'server.on("/on"', 'server.on("/off"', 'server.on("/toggle"', 'onNotFound', 'server.begin']) { io.line(r); await io.delay(100); }
      b.st.serverUp = true;
      b.st.page = null;
      b.queue.push('/');
      b.phone.update();
    },
    async loop(io, b) {
      io.line('server.handleClient');
      const path = b.queue.shift();
      if (!path) { await io.delay(50); return; }
      const st = b.st;
      if (path !== '/') {
        io.line(`server.on("${path}"`); await io.delay(60);
        const next = path === '/on' ? true : path === '/off' ? false : !st.relayOn;
        io.line('relayOn = on'); st.relayOn = next;
        io.line('digitalWrite(RELAY'); b.apply(); io.pin('D1', next ? 'HIGH' : 'LOW', next);
        io.line('"Relay ON"'); io.print(next ? 'Relay ON' : 'Relay OFF');
        await io.delay(60);
      }
      io.line('"GET " + server.uri()'); io.print(`GET ${path} from ${PHONE_IP}`);
      io.line('server.send(200'); await io.delay(120);
      st.page = { on: st.relayOn };
      st.pending = null;
      st.last = `GET ${path} · 200 OK`;
      b.phone.update();
    },
    reset(b) {
      b.queue.length = 0;
      Object.assign(b.st, { serverUp: false, pending: null, page: null, relayOn: false, last: '' });
      b.apply();
      b.phone.setUrl(`http://${IP}/`);
      b.phone.update();
    },
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'node-thingspeak', title: 'Post data to the cloud', icon: 'thermo', board: 'nodemcu',
    thumb: () => makeDHT11(v(0, 0, 0)).group,
    view: { center: [1.8, 1.2, 0.6], size: 14 },
    build(ctx) {
      const w = wifiRouter(ctx, v(5.4, 0, -3.8), { dist: 3 });
      const dht = ctx.add(makeDHT11(v(-1.2, 0, 5.6), { rotY: Math.PI / 2 }));
      ctx.wire(ctx.board.pin('3V3'), dht.pin('VCC'), 'red', { signal: '3V3', lift: 1.6 });
      const data = ctx.wire(ctx.board.pin('D2'), dht.pin('DATA'), 'yellow', { signal: 'D2', lift: 1.9 });
      ctx.wire(ctx.board.pin('GND_2'), dht.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.3 });
      const room = { t: 22, h: 48, breath: 0 };
      ctx.onTick((dt) => (room.breath = Math.max(0, room.breath - dt / 10)));
      ctx.interact(dht, {
        name: 'DHT11 sensor', hint: 'Change the room or breathe on it',
        controls: [
          { type: 'range', label: 'Temperature', min: 0, max: 50, step: 1, get: () => room.t, set: (x) => (room.t = x), format: (x) => `${x} °C` },
          { type: 'range', label: 'Humidity', min: 20, max: 90, step: 1, get: () => room.h, set: (x) => (room.h = x), format: (x) => `${x} %` },
          { type: 'button', label: 'Breathe on it', press: () => (room.breath = 1) },
        ],
        note: () => 'DHT11: 0–50 °C ± 2 °C, 20–90 % RH ± 5 %, whole numbers only',
      });
      const read = () => ({ t: Math.round(room.t + room.breath * 3), h: Math.round(Math.min(95, room.h + room.breath * 30)) });
      const cloud = { rows: [], errors: 0 };
      const dash = ctx.browser({
        url: 'https://your-cloud.example/dashboard', title: 'Cloud dashboard',
        render: () => {
          if (!cloud.rows.length) return '<h5>your-cloud · nodemcu-1</h5><p class="muted">No data yet. Press <b>Run</b>: the NodeMCU posts a reading every few seconds.</p>';
          const last = cloud.rows[cloud.rows.length - 1];
          const pts = cloud.rows.slice(-24);
          const W = 240, H = 60, lo = 0, hi = 50;
          const path = pts.map((r, i) => `${i ? 'L' : 'M'}${((i / Math.max(1, pts.length - 1)) * W).toFixed(1)},${(H - ((r.t - lo) / (hi - lo)) * H).toFixed(1)}`).join(' ');
          return `<h5>your-cloud · nodemcu-1</h5>
            <div class="row"><span>Temperature</span><span class="big">${last.t.toFixed(1)}<small style="font-size:16px"> °C</small></span></div>
            <div class="row"><span>Humidity</span><span class="big">${last.h}<small style="font-size:16px"> %</small></span></div>
            <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:60px;margin-top:8px"><path d="${path}" fill="none" stroke="#e5412e" stroke-width="2"/></svg>
            <p class="muted">${cloud.rows.length} readings received · last at ${last.at}${cloud.errors ? ` · ${cloud.errors} failed uploads` : ''}</p>`;
        },
      });
      ctx.anchor('dht', dht.anchor);
      ctx.anchor('data', data.mid);
      return { ...w, dht, read, cloud, dash, room };
    },
    callouts: [
      { anchor: 'dht', x: 0.04, y: 0.17, icon: 'thermo', title: 'DHT11 on D2', text: 'Click it to change the room, or breathe on it.' },
      { anchor: 'module', x: 0.36, y: 0.12, icon: 'code', title: 'HTTP POST', text: '<code>HTTPClient</code> sends a small JSON body to your server.' },
      { anchor: 'router', x: 0.7, y: 0.17, icon: 'globe', title: 'Internet link', text: 'Switch the router off: the POST fails with a negative code.' },
      { anchor: 'data', x: 0.04, y: 0.68, icon: 'pins', title: 'One data wire', text: 'The DHT11 sends 40 bits with precise timing on D2.' },
    ],
    overview: {
      heading: 'Post readings to the cloud',
      text: 'Every few seconds the NodeMCU reads a DHT11 and sends the numbers to a web service as JSON in an HTTP <b>POST</b>. Services such as ThingSpeak, Adafruit IO or your own server all work this way; here the endpoint is a placeholder, <code>your-cloud.example</code>.',
      features: [['thermo', 'DHT11 on D2 with the Adafruit <code>DHT</code> library'], ['code', '<code>ESP8266HTTPClient</code>: <code>begin</code>, <code>addHeader</code>, <code>POST</code>'], ['timer', 'Non-blocking timing with <code>millis()</code>']],
    },
    pinout: [['3V3', 'DHT11 VCC', '3.3 V keeps DATA at a safe level'], ['D2 (GPIO4)', 'DHT11 DATA', 'Pull-up is on the module'], ['GND', 'DHT11 GND', '']],
    example: {
      text: 'Weather stations, greenhouse monitors and freezer alarms post readings like this. Free cloud tiers usually limit you to one update every 15 s or so, which is plenty for a room.',
      points: ['Breathe on the sensor and watch the dashboard line jump', 'Turn the router off: the sketch logs <code>-1</code> and simply tries again next time', 'Keep real API keys in a separate <code>secrets.h</code> that never goes into Git'],
    },
    specs: [['Libraries', '<code>ESP8266WiFi.h</code>, <code>ESP8266HTTPClient.h</code>, DHT sensor library'], ['Request', 'POST JSON, header <code>X-API-Key</code>'], ['Endpoint', '<code>http://your-cloud.example/api/readings</code> (placeholder)'], ['Period', 'Edit <code>PERIOD</code>; most free tiers want ≥ 15 s'], ['Errors', 'Negative codes: −1 connection failed, −11 timeout'], ['HTTPS', 'Use <code>WiFiClientSecure</code> for real services']],
    quiz: [
      { q: 'Why is the upload timed with millis() instead of delay()?', options: ['delay() is not allowed on the ESP8266', 'So loop() keeps returning and Wi-Fi background tasks keep running', 'millis() is more accurate', 'It uses less flash'], answer: 1, explain: 'A long delay() works, but a non-blocking loop can do other jobs between uploads and lets the core service Wi-Fi.' },
      { q: 'http.POST(body) returns −1. What does that mean?', options: ['The server said OK', 'No connection could be made to the server', 'The JSON was wrong', 'The sensor failed'], answer: 1, explain: 'Negative values are client-side errors (no connection, timeout); HTTP status codes like 200 or 404 come from the server.' },
      { q: 'Why check isnan(t) before sending?', options: ['NaN is a valid temperature', 'A failed DHT read returns NaN, and you should not upload garbage', 'To save power', 'JSON cannot contain numbers'], answer: 1, explain: 'readTemperature() returns NaN when the sensor does not answer; skip that reading.' },
    ],
    challenges: ['Add the Wi-Fi signal (<code>WiFi.RSSI()</code>) to the JSON body.', 'Only upload when the temperature changed by at least 0.5 °C or 5 minutes have passed.', 'Switch to HTTPS with <code>WiFiClientSecure</code> and <code>setFingerprint()</code> or a root certificate.'],
    code: `#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <DHT.h>

const char* ssid     = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* endpoint = "http://your-cloud.example/api/readings";
const char* apiKey   = "YOUR_API_KEY";
const unsigned long PERIOD = {{period}} * 1000UL;   // ms between uploads

DHT dht(D2, DHT11);
WiFiClient client;
unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Online as ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (millis() - lastSend < PERIOD) return;
  lastSend = millis();
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) {
    Serial.println("DHT read failed");
    return;
  }
  String body = "{\\"device\\":\\"nodemcu-1\\",\\"temp\\":" + String(t, 1) +
                ",\\"hum\\":" + String(h, 0) + "}";
  HTTPClient http;
  http.begin(client, endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  int code = http.POST(body);
  Serial.printf("POST %s -> %d\\n", body.c_str(), code);
  http.end();
}`,
    params: { period: { value: 5, min: 2, max: 300 } },
    async setup(io, b) {
      b.cloud.rows.length = 0;
      b.cloud.errors = 0;
      b.dash.update();
      io.line('Serial.begin'); await io.delay(60);
      io.line('dht.begin'); await io.delay(80);
      await joinWifi(io, b.ok);
      io.line('"Online as "'); io.print(`Online as ${IP}`);
      b.lastSend = -Infinity;
    },
    async loop(io, b, p) {
      io.line('millis() - lastSend < PERIOD');
      const now = performance.now();
      if (now - b.lastSend < p.period * 1000) { await io.delay(100); return; }
      b.lastSend = now;
      io.line('lastSend = millis()');
      io.line('dht.readTemperature'); io.line('dht.readHumidity');
      const r = b.read();
      io.pin('D2', `${r.t} °C`, true);
      await io.delay(30);
      io.line('String body');
      const body = `{"device":"nodemcu-1","temp":${r.t.toFixed(1)},"hum":${r.h}}`;
      io.line('http.begin'); io.line('"Content-Type"'); io.line('"X-API-Key"');
      io.line('int code = http.POST');
      await io.delay(180);
      let code = 200;
      if (!b.ok()) code = -1;
      else b.router.activity();
      io.line('"POST %s'); io.print(`POST ${body} -> ${code}`);
      io.line('http.end()');
      const d = new Date();
      if (code === 200) b.cloud.rows.push({ t: r.t, h: r.h, at: `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}` });
      else b.cloud.errors++;
      b.dash.update();
      await io.delay(100);
    },
    reset(b) { b.dash.update(); },
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'node-oled-clock', title: 'NTP clock on an OLED', icon: 'timer', board: 'nodemcu',
    thumb: () => { const o = makeOLED(v(0, 0, 0)); o.text(['12:34'], { x: 10, y: 8, size: 3 }); o.text(['Tue 03 Nov 2026'], { x: 22, y: 48, clear: false }); return o.group; },
    view: { center: [2.6, 1.0, 1.4], size: 14 },
    build(ctx) {
      const w = wifiRouter(ctx, v(7.2, 0, -3.0), { dist: 3 });
      const oled = ctx.add(makeOLED(v(1.6, 0, 6.6), { rotY: 0 }));
      ctx.wire(ctx.board.pin('3V3'), oled.pin('VCC'), 'red', { signal: '3V3', lift: 1.8 });
      ctx.wire(ctx.board.pin('GND'), oled.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.4 });
      const scl = ctx.wire(ctx.board.pin('D1'), oled.pin('SCL'), 'yellow', { signal: 'D1', lift: 2.2 });
      const sda = ctx.wire(ctx.board.pin('D2'), oled.pin('SDA'), 'blue', { signal: 'D2', lift: 2.6 });
      ctx.interact(oled, { name: '0.96" OLED (SSD1306)', hint: '128 × 64 pixels, I²C address 0x3C' });
      ctx.anchor('oled', oled.anchor);
      ctx.anchor('sda', sda.mid);
      ctx.anchor('scl', scl.mid);
      return { ...w, oled, st: { synced: false, syncAt: 0 } };
    },
    callouts: [
      { anchor: 'router', x: 0.04, y: 0.17, icon: 'globe', title: 'NTP over Wi-Fi', text: 'Time comes from pool.ntp.org, accurate to a few milliseconds.' },
      { anchor: 'sda', x: 0.36, y: 0.12, icon: 'serial', title: 'D2 SDA · D1 SCL', text: 'The ESP8266’s default I²C pins: <code>Wire.begin(D2, D1)</code>.' },
      { anchor: 'oled', x: 0.7, y: 0.17, icon: 'timer', title: 'SSD1306 OLED', text: 'Big digits at text size 3 (18 × 24 px each).' },
      { anchor: 'module', x: 0.04, y: 0.68, icon: 'chip', title: 'Keeps time itself', text: 'After one sync the chip counts on its own and re-syncs hourly.' },
    ],
    overview: {
      heading: 'An internet clock',
      text: 'The ESP8266 has no battery-backed clock, but it can ask an NTP server for the exact time. <code>configTime()</code> sets your offset from UTC and starts SNTP in the background; <code>time()</code> and <code>localtime_r()</code> then give you hours, minutes and the date to draw on the OLED.',
      features: [['globe', '<code>configTime(offset, dst, "pool.ntp.org")</code>'], ['timer', '<code>time()</code>, <code>localtime_r()</code>, <code>strftime()</code>'], ['serial', 'Adafruit_SSD1306 on I²C (D2 / D1)']],
    },
    pinout: [['3V3', 'OLED VCC', ''], ['GND', 'OLED GND', ''], ['D2 (GPIO4)', 'OLED SDA', 'I²C data'], ['D1 (GPIO5)', 'OLED SCL', 'I²C clock']],
    example: {
      text: 'Wall clocks that set themselves, data loggers that timestamp readings and devices that switch on at sunset all start by asking NTP for the time.',
      points: ['Edit <code>UTC_OFFSET</code> to your time zone and run again', 'Switch the router off after the first sync: the clock keeps ticking', 'Switch it off <b>before</b> the sync and the sketch waits, still in 1970'],
    },
    specs: [['Libraries', '<code>ESP8266WiFi.h</code>, <code>time.h</code>, Adafruit_SSD1306 + GFX'], ['Time source', 'SNTP, re-sync every hour (default)'], ['Display', 'SSD1306 128 × 64, I²C 0x3C'], ['Time zone', '<code>configTime(UTC_OFFSET * 3600, DST * 3600, …)</code>'], ['Not synced yet', '<code>time()</code> returns seconds since 1970 counted from boot'], ['Better DST', 'POSIX TZ strings, e.g. <code>configTime("GMT0BST,M3.5.0/1,M10.5.0", …)</code>']],
    quiz: [
      { q: 'Why does the sketch check now < 1700000000?', options: ['To save power', 'Before the first NTP reply the clock still counts from 1 Jan 1970', 'The OLED cannot show big numbers', 'To detect a leap year'], answer: 1, explain: '1 700 000 000 seconds is November 2023: anything smaller means the time is not set yet.' },
      { q: 'Wi-Fi drops after the first sync. What happens to the clock?', options: ['It stops', 'It keeps time with the chip’s own timer and re-syncs when Wi-Fi returns', 'It resets to 1970', 'It shows UTC'], answer: 1, explain: 'SNTP only corrects the time; between syncs the ESP8266 counts by itself (drifting a few seconds a day).' },
      { q: 'What does strftime(hhmm, sizeof(hhmm), "%H:%M", &t) produce at 9:05 pm?', options: ['9:5', '21:05', '09:05 PM', '2105'], answer: 1, explain: '%H is the 24-hour hour with a leading zero and %M the minute with a leading zero.' },
    ],
    challenges: ['Blink a colon between the hours and minutes once a second.', 'Show the day of the year with <code>t.tm_yday + 1</code> on the bottom line.', 'Replace the two offsets with a POSIX TZ string so summer time switches by itself.'],
    code: `#include <ESP8266WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <time.h>

const char* ssid     = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const long UTC_OFFSET = {{utc}};   // hours from UTC
const int  DST = {{dst}};          // 1 during summer time

Adafruit_SSD1306 oled(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  Wire.begin(D2, D1);                         // SDA, SCL
  oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  oled.setTextColor(SSD1306_WHITE);
  oled.clearDisplay();
  oled.setCursor(0, 0);
  oled.print("Joining Wi-Fi...");
  oled.display();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected");
  configTime(UTC_OFFSET * 3600, DST * 3600, "pool.ntp.org", "time.nist.gov");
}

void loop() {
  time_t now = time(nullptr);
  if (now < 1700000000) {                     // not synced yet (still 1970)
    Serial.println("Waiting for NTP...");
    delay(500);
    return;
  }
  struct tm t;
  localtime_r(&now, &t);
  char hhmm[6], ss[3], date[16];
  strftime(hhmm, sizeof(hhmm), "%H:%M", &t);
  strftime(ss, sizeof(ss), "%S", &t);
  strftime(date, sizeof(date), "%a %d %b %Y", &t);

  oled.clearDisplay();
  oled.setTextSize(3);
  oled.setCursor(10, 8);
  oled.print(hhmm);
  oled.setTextSize(2);
  oled.setCursor(100, 15);
  oled.print(ss);
  oled.setTextSize(1);
  oled.setCursor(22, 48);
  oled.print(date);
  oled.display();
  Serial.printf("%s:%s  %s\\n", hhmm, ss, date);
  delay({{refresh}});
}`,
    params: { utc: { value: 0, min: -12, max: 14 }, dst: { value: 0, min: 0, max: 1 }, refresh: { value: 1000, min: 200, max: 5000 } },
    async setup(io, b) {
      b.st.synced = false;
      io.line('Serial.begin'); await io.delay(60);
      io.line('Wire.begin'); io.pin('D1', 'SCL', true); await io.delay(60);
      io.line('oled.begin'); await io.delay(100);
      io.line('"Joining Wi-Fi..."'); io.line('oled.display()', 1);
      b.oled.text(['Joining Wi-Fi...'], { x: 0, y: 0 });
      await joinWifi(io, b.ok);
      io.line('" connected"'); io.print(' connected');
      io.line('configTime'); await io.delay(100);
      b.st.syncAt = performance.now() + 1500; // first SNTP reply after ≈ 1.5 s
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('time_t now = time(nullptr)');
      if (!st.synced && b.ok() && performance.now() > st.syncAt) { st.synced = true; b.router.activity(); }
      if (!st.synced) {
        io.line('"Waiting for NTP..."'); io.print('Waiting for NTP...');
        io.line('delay(500)', 2); await io.delay(500);
        return;
      }
      io.line('localtime_r');
      const d = new Date(Date.now() + (p.utc + p.dst) * 3600e3);
      const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const hhmm = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`, ss = pad2(d.getUTCSeconds());
      const date = `${DAYS[d.getUTCDay()]} ${pad2(d.getUTCDate())} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      io.line('strftime(hhmm'); io.line('strftime(date');
      io.line('oled.clearDisplay()', 2);
      b.oled.text([hhmm], { x: 10, y: 8, size: 3 });
      b.oled.text([ss], { x: 100, y: 15, size: 2, clear: false });
      b.oled.text([date], { x: 22, y: 48, size: 1, clear: false });
      io.line('oled.display()', 2);
      io.pin('D2', 'SDA', true);
      io.line('"%s:%s'); io.print(`${hhmm}:${ss}  ${date}`);
      io.line(`delay(${p.refresh})`); await io.delay(p.refresh);
    },
    reset(b) { b.oled.clear(); b.st.synced = false; },
  },
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['chip', 'NodeMCU v3 (ESP8266)', 'Wi-Fi microcontroller board with a CH340 USB-serial chip; D-pin labels differ from GPIO numbers.', 'node-meet'],
  ['globe', 'Soft access point', 'The ESP8266’s own Wi-Fi network (192.168.4.1) for setting devices up.', 'node-wifi'],
  ['plug', 'Relay module', 'A transistor-driven 5 V relay: a 3.3 V pin switches a separate circuit.', 'node-webserver'],
  ['code', 'HTTP POST', 'Sends data (often JSON) to a web service; returns a status code.', 'node-thingspeak'],
  ['timer', 'NTP', 'Network Time Protocol: gets the exact time from servers such as pool.ntp.org.', 'node-oled-clock'],
];
