// Track — Raspberry Pi: a Raspberry Pi 5-style Linux computer programmed in
// Python 3 (Raspberry Pi OS Bookworm). GPIO with gpiozero (lgpio backend on
// a Pi 5), I²C with smbus2, the camera with Picamera2, a Flask web app and a
// systemd service that logs to SQLite. Header pins use BCM numbers in code
// and physical numbers on the board. The simulation mirrors each script step
// by step; it does not run Python.
import * as THREE from 'three';
import { makeRPi5 } from '../scene/boards/rpi5.js';
import { makeCSICamera, makeRibbon } from '../scene/boards/jetson.js';
import { makeLED, makeResistor, makeButton, makeServo, makeTO92 } from '../scene/components.js';
import { makeMPU6050, makePerson } from '../scene/modules.js';
import { mat, mesh, box, at, canvasTexture } from '../scene/kit.js';
import { v, clamp, LED_COLORS } from './helpers.js';

// ================================================================ shared helpers
const BBP = [-10.4, -0.9]; // breadboard to the left of the board (pin 1 end of the header)
const PI_IP = '192.168.1.50';
const PHONE_IP = '192.168.1.23';
const OHMS33 = [[220, '220 Ω'], [330, '330 Ω'], [1000, '1 kΩ'], [2200, '2.2 kΩ']];
const gain33 = (ohms) => clamp(((1.3 / ohms) * 1000) / 4, 0.12, 1);
const fmtOhms = (o) => (o >= 1000 ? `${o / 1000} kΩ` : `${o} Ω`);
const pad2 = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clock = (d = new Date()) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const journal = (d = new Date()) => `${MON[d.getMonth()]} ${pad2(d.getDate())} ${clock(d)} pi5`;
const iso = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${clock(d)}`;

/** Power LED on; the green ACT LED flickers with SD-card activity (the Pi is running Linux). */
function powerOn(ctx, busy = () => 0.15) {
  ctx.board.setPowerLed?.(0.85);
  let t = 0;
  ctx.onTick((dt) => {
    t -= dt;
    if (t <= 0) {
      ctx.board.setBuiltinLed(Math.random() < busy() ? 1 : 0);
      t = 0.05 + Math.random() * 0.25;
    }
  });
}

/** Pi 5 Active Cooler default curve: off < 50 °C, 30 % at 50, 50 % at 60, 70 % at 67.5, 100 % at 75 °C. */
const fanCurve = (c) => (c >= 75 ? 1 : c >= 67.5 ? 0.7 : c >= 60 ? 0.5 : c >= 50 ? 0.3 : 0);

/** A tiny thermal model: workload 0–100 % → CPU temperature, fan and clock. */
function thermals(ctx, st) {
  st.temp ??= 44;
  ctx.onTick((dt) => {
    const fan = fanCurve(st.temp);
    const target = 41 + (st.load / 100) * 36 - fan * 9;
    st.temp += (target - st.temp) * (1 - Math.exp(-dt / 6));
    ctx.board.setFan?.(fan);
  });
  return {
    fan: () => fanCurve(st.temp),
    rpm: () => Math.round(fanCurve(st.temp) * 7000 / 10) * 10,
    mhz: () => (st.load > 8 ? 2400 : 1500),
  };
}

/** Resistor + LED from a header pin to a GND pin (3.3 V logic). */
function piLed(ctx, bb, { pin, col, color = 'red', gnd = 'PIN9', ohms = 330, wire = 'orange' }) {
  const bcm = ctx.board.bcm[+/\d+/.exec(ctx.board.resolve(pin))[0]];
  const key = `GPIO${bcm}`;
  const res = ctx.add(makeResistor(bb.hole(col, 'g'), bb.hole(col + 4, 'g'), ohms));
  const led = ctx.add(makeLED(color, bb.hole(col + 4, 'h'), bb.hole(col + 5, 'h')));
  const sig = ctx.wire(ctx.board.pin(pin), bb.hole(col, 'j'), wire, { signal: key });
  const gw = ctx.wire(ctx.board.pin(gnd), bb.hole(col + 5, 'j'), 'black', { signal: 'GND', dir: -1 });
  const state = { gain: gain33(ohms) };
  ctx.interact(led, {
    name: 'LED', hint: 'Click to change its colour',
    controls: [{ type: 'choice', label: 'Colour', options: LED_COLORS, get: () => led.color, set: (c) => led.setColor(c) }],
  });
  ctx.interact(res, {
    name: 'Resistor', hint: 'Click to try other values',
    controls: [{ type: 'choice', label: 'Resistance', options: OHMS33, get: () => res.ohms, set: (o) => { res.setValue(o); state.gain = gain33(o); if (led.level > 0) led.set(state.gain); } }],
    note: () => `${fmtOhms(res.ohms)} on 3.3 V → ≈ ${((1.3 / res.ohms) * 1000).toFixed(1)} mA${res.ohms < 300 ? ' (fine, but keep each pin under ≈ 16 mA)' : ''}`,
  });
  return { res, led, sig, gw, key, state, on: (x = 1) => led.set(x * state.gain), off: () => led.set(0), get lit() { return led.level > 0; } };
}

/** A room only the virtual camera sees (layer 1): wall with a window + a floor. */
function feedRoom(cx, farZ) {
  const g = new THREE.Group();
  const wallTex = canvasTexture(1024, 512, (c, W, H) => {
    const gr = c.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#d5dbe5');
    gr.addColorStop(1, '#ece6da');
    c.fillStyle = gr;
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#f7f4ec';
    c.fillRect(W * 0.14, H * 0.28, W * 0.2, H * 0.4);
    const sky = c.createLinearGradient(0, H * 0.28, 0, H * 0.68);
    sky.addColorStop(0, '#8fc3ea');
    sky.addColorStop(1, '#dcedf7');
    c.fillStyle = sky;
    c.fillRect(W * 0.15, H * 0.3, W * 0.18, H * 0.36);
    c.fillStyle = '#7a5b3d'; // door
    c.fillRect(W * 0.66, H * 0.3, W * 0.12, H * 0.64);
    c.fillStyle = '#f5c02a';
    c.beginPath(); c.arc(W * 0.765, H * 0.64, W * 0.006, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#b9a07c';
    c.fillRect(0, H * 0.94, W, H * 0.06);
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(64, 32), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 }));
  wall.position.set(cx, 15.6, farZ);
  wall.rotation.y = Math.PI;
  g.add(wall);
  const floorTex = canvasTexture(512, 512, (c, W, H) => {
    c.fillStyle = '#c9b08c';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(110,80,50,.25)';
    for (let i = 0; i < 16; i++) { c.lineWidth = 2; c.beginPath(); c.moveTo(0, (i / 16) * H); c.lineTo(W, (i / 16) * H); c.stroke(); }
  }, { repeat: [4, 2] });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(64, 30), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, -0.03, farZ - 15);
  g.add(floor);
  g.traverse((o) => { o.layers.set(1); o.raycast = () => {}; });
  return g;
}

const PI_THUMB = () => makeRPi5().group;

export const raspberryPi = [
  // ------------------------------------------------------------------ 1
  {
    id: 'rpi-meet', title: 'Meet the Raspberry Pi 5', icon: 'chip', board: 'rpi5',
    thumb: PI_THUMB,
    view: { center: [0, 1.0, 0.2], size: 11 },
    build(ctx) {
      const st = { load: 10 };
      powerOn(ctx, () => 0.1 + st.load / 250);
      const th = thermals(ctx, st);
      ctx.interact(ctx.board, {
        name: 'Raspberry Pi 5-style', hint: 'Change the workload and watch the fan',
        controls: [{ type: 'range', label: 'CPU workload', min: 0, max: 100, step: 1, get: () => st.load, set: (x) => (st.load = x), format: (x) => `${x}%` }],
        note: () => `CPU ${st.temp.toFixed(1)} °C · fan ${Math.round(th.fan() * 100)}% · ${th.mhz()} MHz${st.temp > 80 ? ' · close to the 85 °C throttle point' : ''}`,
      });
      return { st, th };
    },
    callouts: [
      { anchor: 'fan', x: 0.04, y: 0.17, icon: 'gear', title: 'Active cooler', text: 'A blower fan that only spins up above 50 °C. Click the board to load it.' },
      { anchor: 'gpio', x: 0.36, y: 0.12, icon: 'pins', title: '40-pin header', text: 'GPIO, I²C, SPI, UART and PWM at 3.3 V. Run <code>pinout</code> to see it.' },
      { anchor: 'usb', x: 0.7, y: 0.17, icon: 'usb', title: 'USB 3 · USB 2 · LAN', text: 'Keyboard, mouse, storage and Gigabit Ethernet: a whole computer.' },
      { anchor: 'power', x: 0.04, y: 0.68, icon: 'bolt', title: 'USB-C 5 V 5 A', text: 'A 27 W supply lets the USB ports deliver their full 1.6 A.' },
      { anchor: 'hdmi', x: 0.36, y: 0.74, icon: 'serial', title: '2 × micro-HDMI', text: 'Two 4K displays. Next to them: two MIPI camera / display ports.' },
      { anchor: 'rp1', x: 0.7, y: 0.68, icon: 'chip', title: 'RP1 I/O chip', text: 'A Pi-designed chip that runs the GPIO, USB and Ethernet over PCIe.' },
    ],
    overview: {
      heading: 'A computer the size of a card',
      text: 'The Raspberry Pi 5 runs a full Linux desktop, Raspberry Pi OS, from a microSD card. Its quad-core 2.4 GHz CPU runs ordinary Python, and its 40-pin header talks to electronics. Open a terminal, type <code>pinout</code> to see the header, then run this script to ask the Pi about itself.',
      features: [['chip', 'BCM2712: 4 × Cortex-A76 at 2.4 GHz + VideoCore VII GPU'], ['code', 'Linux shows hardware as files: <code>/proc</code>, <code>/sys</code>'], ['gear', '<code>vcgencmd</code> reports clocks, voltages and throttling']],
    },
    pinout: [['J8', '40-pin GPIO header', '3.3 V logic, 5 V and 3.3 V supply pins'], ['USB-C', '5 V ⎓ 5 A power in', '27 W supply recommended'], ['HDMI0 / HDMI1', 'Micro-HDMI', 'Two 4Kp60 displays'], ['CAM/DISP 0 / 1', '22-pin MIPI connectors', 'Camera or DSI display'], ['FAN', '4-pin JST', 'PWM fan with tacho'], ['PCIe', 'FFC connector', 'NVMe SSD via an M.2 HAT'], ['USB', '2 × USB 3.0 (blue), 2 × USB 2.0', ''], ['LAN', 'Gigabit Ethernet', 'PoE+ via a HAT']],
    example: {
      text: 'Raspberry Pis run home automation hubs, retro games consoles, robots, digital signage and small web servers. Learning the terminal is the first step: <code>ls</code>, <code>cd</code>, <code>sudo apt update</code>, <code>python3 script.py</code>.',
      points: ['Type <code>pinout</code> in a terminal: it prints a map of this very header', 'Drag the workload to 100 %: the fan curve kicks in at 50, 60, 67.5 and 75 °C', 'Run <code>vcgencmd get_throttled</code>; <code>0x0</code> means power and cooling are fine'],
    },
    specs: [['CPU', '4 × Arm Cortex-A76 @ 2.4 GHz'], ['GPU', 'VideoCore VII, OpenGL ES 3.1, Vulkan 1.2'], ['Memory', '2 / 4 / 8 / 16 GB LPDDR4X'], ['Storage', 'microSD (SDR104), NVMe over PCIe 2.0 x1'], ['Wireless', 'Wi-Fi 5 (802.11ac), Bluetooth 5.0 / BLE'], ['Power', '5 V ⎓ 5 A USB-C (USB PD)'], ['OS', 'Raspberry Pi OS (Debian 12 Bookworm), Python 3.11'], ['Size', '85 × 56 mm']],
    quiz: [
      { q: 'What does the pinout command do?', options: ['Changes pin modes', 'Prints a map of the 40-pin header and board details', 'Measures pin voltages', 'Updates the firmware'], answer: 1, explain: 'pinout comes with gpiozero and draws the board and its header, with BCM numbers next to physical pin numbers.' },
      { q: 'The file /sys/class/thermal/thermal_zone0/temp contains 52350. What is the CPU temperature?', options: ['523.5 °C', '52.35 °C', '5.235 °C', '52350 °C'], answer: 1, explain: 'Linux thermal zones report millidegrees Celsius: divide by 1000.' },
      { q: 'How is a Raspberry Pi different from a NodeMCU or an Uno?', options: ['It has no GPIO', 'It is a full Linux computer that runs programs from files', 'It only runs C++', 'It needs no power supply'], answer: 1, explain: 'A Pi boots an operating system and runs many programs at once; a microcontroller runs one bare-metal sketch.' },
      { q: 'When does the Pi 5 Active Cooler start spinning by default?', options: ['Always', 'At 50 °C', 'At 85 °C', 'Only when you call a function'], answer: 1, explain: 'The firmware fan curve starts at 50 °C (30 %) and reaches 100 % at 75 °C; at 85 °C the CPU throttles.' },
    ],
    challenges: ['Also print the free memory from <code>/proc/meminfo</code> (MemAvailable).', 'Log the temperature to a CSV file with a timestamp every 10 s.', 'Print a warning when <code>get_throttled</code> is anything other than <code>0x0</code>.'],
    code: `import glob
import os
import platform
import subprocess
import time

def read(path):
    with open(path) as f:
        return f.read().strip('\\x00\\n ')

def vcgencmd(*args):
    out = subprocess.run(['vcgencmd', *args], capture_output=True, text=True)
    return out.stdout.strip()

def fan_rpm():
    paths = glob.glob('/sys/devices/platform/cooling_fan/hwmon/*/fan1_input')
    return int(read(paths[0])) if paths else 0

print('Model  :', read('/proc/device-tree/model'))
print('OS     :', platform.freedesktop_os_release()['PRETTY_NAME'])
print('Kernel :', platform.release(), platform.machine())
print('Python :', platform.python_version())
print('CPUs   :', os.cpu_count())
subprocess.run(['pinout', '--monochrome'])      # header map (gpiozero)

while True:
    temp = int(read('/sys/class/thermal/thermal_zone0/temp')) / 1000
    mhz = int(vcgencmd('measure_clock', 'arm').split('=')[1]) / 1e6
    print('CPU {:.1f} C | {:.0f} MHz | fan {} rpm | {}'.format(
        temp, mhz, fan_rpm(), vcgencmd('get_throttled')))
    time.sleep({{interval}})`,
    params: { interval: { value: 2, min: 1, max: 10 } },
    async setup(io) {
      io.line("print('Model"); io.print('Model  : Raspberry Pi 5 Model B Rev 1.0'); await io.delay(120);
      io.line("print('OS"); io.print('OS     : Debian GNU/Linux 12 (bookworm)'); await io.delay(100);
      io.line("print('Kernel"); io.print('Kernel : 6.6.51+rpt-rpi-2712 aarch64'); await io.delay(100);
      io.line("print('Python"); io.print('Python : 3.11.2'); await io.delay(100);
      io.line("print('CPUs"); io.print('CPUs   : 4'); await io.delay(100);
      io.line("subprocess.run(['pinout'");
      const lines = ['Description        : Raspberry Pi 5B rev 1.0', 'SoC                : BCM2712', 'RAM                : 4GB', 'Storage            : MicroSD', 'USB ports          : 4 (of which 2 USB3)', 'Ethernet ports     : 1 (1000Mbps max. speed)', 'Wi-fi              : True', 'Bluetooth          : True', 'Camera ports (CSI) : 2', 'Display ports (DSI): 2', '', 'J8:'];
      for (const l of lines) io.print(l);
      const b = ctxBoardNames();
      for (let r = 0; r < 20; r++) io.print(`${b[2 * r + 1].padStart(8)} (${String(2 * r + 1).padStart(2)}) (${String(2 * r + 2).padStart(2)}) ${b[2 * r + 2]}`);
      await io.delay(300);
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line("temp = int(read('/sys/class/thermal");
      io.line('mhz = int(vcgencmd');
      io.line("print('CPU {:.1f}");
      const t = st.temp + (Math.random() - 0.5) * 0.4;
      const thr = st.temp > 85 ? 'throttled=0x80008' : 'throttled=0x0';
      io.print(`CPU ${t.toFixed(1)} C | ${b.th.mhz()} MHz | fan ${b.th.rpm()} rpm | ${thr}`);
      io.line('time.sleep'); await io.delay(p.interval * 1000);
    },
    reset() {},
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'rpi-gpiozero-led', title: 'Blink with gpiozero', icon: 'led', board: 'rpi5',
    thumb: () => makeLED('red', v(0.13, 0, 0), v(-0.13, 0, 0)).group,
    view: { center: [-5.2, 0.9, -1.2], size: 15, az: -10 },
    build(ctx) {
      powerOn(ctx);
      const bb = ctx.breadboard(...BBP);
      const c = piLed(ctx, bb, { pin: 'GPIO17', col: 20 });
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('res', c.res.anchor);
      ctx.anchor('sig', c.sig.mid);
      ctx.anchor('gndw', c.gw.mid);
      return c;
    },
    callouts: [
      { anchor: 'gpio', x: 0.7, y: 0.17, icon: 'pins', title: 'GPIO17 = pin 11', text: 'Code uses BCM numbers; the header is numbered 1–40.' },
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pins', title: 'Signal wire', text: '<code>led.on()</code> puts 3.3 V on it, <code>led.off()</code> 0 V.' },
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'LED', text: 'Long leg (+) towards the resistor.' },
      { anchor: 'res', x: 0.04, y: 0.68, icon: 'resistor', title: '330 Ω', text: '(3.3 V − 2 V) / 330 Ω ≈ 4 mA. Click to try others.' },
      { anchor: 'gndw', x: 0.36, y: 0.74, icon: 'gnd', title: 'GND · pin 9', text: 'Every circuit needs a way back.' },
    ],
    overview: {
      heading: 'Blink with gpiozero',
      text: '<code>gpiozero</code> is the friendly way to use the header from Python: make an <code>LED(17)</code> and call <code>on()</code> and <code>off()</code>. The 17 is the <b>BCM</b> GPIO number, not the pin position: GPIO17 sits on physical pin 11.',
      features: [['code', '<code>from gpiozero import LED</code>, pre-installed on Raspberry Pi OS'], ['pins', 'BCM numbering: <code>LED(17)</code> = pin 11'], ['bolt', '3.3 V outputs; never connect 5 V to a GPIO']],
    },
    pinout: [['Pin 11 (GPIO17)', '330 Ω → LED (+)', 'Output'], ['Pin 9 (GND)', 'LED (−)', 'Short leg'], ['Resistor', '330 Ω', 'Orange · orange · brown']],
    example: {
      text: 'Status lights on 3D-printer controllers, home servers and robots are blinked exactly like this. gpiozero also has <code>led.blink()</code>, <code>PWMLED</code> for brightness and <code>RGBLED</code>.',
      points: ['Replace the loop with <code>led.blink(on_time=0.2, off_time=0.8)</code> and <code>pause()</code>', 'On a Pi 5, <code>RPi.GPIO</code> does not work: gpiozero (via lgpio) does', 'Press Ctrl+C on a real Pi: gpiozero releases the pin when Python exits'],
    },
    specs: [['Library', 'gpiozero 2.x (lgpio pin factory on a Pi 5)'], ['Numbering', 'BCM (GPIO17), or <code>"BOARD11"</code>'], ['Logic level', '3.3 V'], ['LED current', '≈ 4 mA with 330 Ω'], ['Pin limit', 'Keep each pin under ≈ 16 mA'], ['Permissions', 'User in the <code>gpio</code> group (the default user is)']],
    quiz: [
      { q: 'In LED(17), what does 17 mean?', options: ['Physical pin 17', 'BCM GPIO number 17 (physical pin 11)', 'The 17th LED', '17 mA'], answer: 1, explain: 'gpiozero uses BCM numbers by default. Write LED("BOARD11") if you prefer physical numbers.' },
      { q: 'Which library does not work on a Raspberry Pi 5?', options: ['gpiozero', 'lgpio', 'RPi.GPIO', 'smbus2'], answer: 2, explain: 'The Pi 5’s GPIO lives on the RP1 chip; RPi.GPIO pokes the old registers directly and cannot drive it.' },
      { q: 'What voltage does a GPIO output when on?', options: ['5 V', '3.3 V', '1.8 V', '12 V'], answer: 1, explain: 'The header uses 3.3 V logic. 5 V applied to a GPIO can damage the RP1.' },
    ],
    challenges: ['Blink a heartbeat: two quick flashes, then a pause.', 'Add a green LED on GPIO27 (pin 13) and alternate the two.', 'Fade the LED in and out with <code>PWMLED(17)</code> and its <code>pulse()</code> method.'],
    code: `from gpiozero import LED
from time import sleep

led = LED(17)          # BCM GPIO17 = physical pin 11

while True:
    led.on()
    print("GPIO17 -> HIGH")
    sleep({{on}} / 1000)
    led.off()
    print("GPIO17 -> LOW")
    sleep({{off}} / 1000)`,
    params: { on: { value: 500, min: 50, max: 3000 }, off: { value: 500, min: 50, max: 3000 } },
    async setup(io) {
      io.line('led = LED(17)'); await io.delay(150);
    },
    async loop(io, b, p) {
      io.line('led.on()'); b.on(); io.pin('GPIO17', 'HIGH', true);
      io.line('-> HIGH'); io.print('GPIO17 -> HIGH');
      io.line('sleep(', 1); await io.delay(p.on);
      io.line('led.off()'); b.off(); io.pin('GPIO17', 'LOW', false);
      io.line('-> LOW'); io.print('GPIO17 -> LOW');
      io.line('sleep(', 2); await io.delay(p.off);
    },
    reset(b) { b.off(); },
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'rpi-button', title: 'Buttons with callbacks', icon: 'button', board: 'rpi5',
    thumb: () => makeButton([v(-0.25, 0, -0.38), v(0.25, 0, -0.38), v(-0.25, 0, 0.38), v(0.25, 0, 0.38)]).group,
    view: { center: [-5.6, 0.9, -1.2], size: 15, az: -10 },
    serialInput: { placeholder: 'q = quit (Ctrl+C)' },
    build(ctx) {
      powerOn(ctx);
      const bb = ctx.breadboard(...BBP);
      const c = piLed(ctx, bb, { pin: 'GPIO17', col: 22 });
      const btn = ctx.add(makeButton([bb.hole(10, 'e'), bb.hole(12, 'e'), bb.hole(10, 'f'), bb.hole(12, 'f')]));
      const w27 = ctx.wire(ctx.board.pin('GPIO27'), bb.hole(12, 'j'), 'yellow', { signal: 'GPIO27', lift: 2.4 });
      const wg = ctx.wire(ctx.board.pin('PIN14'), bb.hole(10, 'j'), 'black', { signal: 'GND', dir: -1, lift: 2.0 });
      const st = { events: [], downAt: 0, held: false };
      ctx.interact(btn, {
        name: 'Push button', hint: 'Press and hold to push it',
        hold: {
          down: () => { btn.press(true); st.events.push({ type: 'down', t: performance.now() }); },
          up: () => { btn.press(false); st.events.push({ type: 'up', t: performance.now() }); },
        },
        note: () => 'Internal pull-up: GPIO27 reads HIGH until the button connects it to GND',
      });
      ctx.anchor('btn', btn.anchor);
      ctx.anchor('w27', w27.mid);
      ctx.anchor('wg', wg.mid);
      ctx.anchor('led', c.led.anchor);
      return { ...c, btn, st };
    },
    callouts: [
      { anchor: 'btn', x: 0.04, y: 0.68, icon: 'hand', title: 'Push button', text: 'Click and hold. Hold it long enough to fire <code>when_held</code>.' },
      { anchor: 'w27', x: 0.36, y: 0.12, icon: 'pins', title: 'GPIO27 · pin 13', text: 'An input with the Pi’s internal pull-up switched on.' },
      { anchor: 'wg', x: 0.04, y: 0.17, icon: 'gnd', title: 'GND · pin 14', text: 'Pressing pulls the input LOW: no resistor needed.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'LED · GPIO17', text: 'Toggled by the <code>pressed()</code> callback.' },
    ],
    overview: {
      heading: 'Buttons with callbacks',
      text: 'Instead of checking the button in a loop, give gpiozero functions to call: <code>when_pressed</code>, <code>when_released</code> and <code>when_held</code>. <code>pause()</code> then just waits while a background thread watches the pin. <code>Button</code> turns on the internal pull-up and debounces for you.',
      features: [['hand', 'Hold the 3D button; long holds fire <code>when_held</code>'], ['code', '<code>Button(27, bounce_time=0.05, hold_time=…)</code>'], ['timer', 'Callbacks run in their own thread; <code>pause()</code> keeps the script alive']],
    },
    pinout: [['Pin 13 (GPIO27)', 'Button leg', 'Input, internal pull-up'], ['Pin 14 (GND)', 'Other button leg', 'Pressed = LOW'], ['Pin 11 (GPIO17)', '330 Ω → LED', 'Output'], ['Pin 9 (GND)', 'LED (−)', '']],
    example: {
      text: 'A doorbell that sends a phone notification, a photo booth trigger or a “shutdown” button on a headless Pi: callbacks let the main program do other work while waiting for a press.',
      points: ['Hold the button for longer than <code>hold_time</code> to reset the counter', 'Set <code>bounce_time=None</code> on a real, cheap button and watch single presses count twice', 'gpiozero also has <code>button.wait_for_press()</code> for simple scripts'],
    },
    specs: [['Library', 'gpiozero <code>Button</code>, <code>LED</code>, <code>signal.pause</code>'], ['Pull-up', 'Internal (≈ 50 kΩ), enabled by default'], ['Debounce', '<code>bounce_time</code> = 50 ms'], ['Hold', '<code>hold_time</code> from the code (seconds)'], ['Threads', 'Callbacks run outside the main thread']],
    quiz: [
      { q: 'Why does this circuit need no external pull-up resistor?', options: ['Buttons do not need one', 'Button() enables the Pi’s internal pull-up on GPIO27', 'The LED acts as one', 'GPIO27 is always HIGH'], answer: 1, explain: 'gpiozero’s Button defaults to pull_up=True, so the pin idles HIGH and reads LOW when pressed.' },
      { q: 'What does pause() do at the end of the script?', options: ['Pauses the LED', 'Keeps the program running so the callbacks can fire', 'Waits one second', 'Stops the callbacks'], answer: 1, explain: 'Without it the script would reach the end and exit, and nothing would watch the button.' },
      { q: 'You assign button.when_pressed = pressed(). What goes wrong?', options: ['Nothing', 'pressed() runs once immediately and its result (None) is assigned', 'The LED burns out', 'Python crashes'], answer: 1, explain: 'Assign the function itself, without brackets: when_pressed = pressed.' },
      { q: 'How long must you hold the button before when_held fires?', options: ['Always 1 s', 'hold_time seconds', '50 ms', 'It never fires'], answer: 1, explain: 'when_held fires once the button has been held for hold_time (and again every hold_time if hold_repeat=True).' },
    ],
    challenges: ['Print how long each press lasted (use <code>button.active_time</code> in <code>released()</code>).', 'Make three quick presses in a row turn on a second LED.', 'Shut the Pi down safely on a 3-second hold with <code>subprocess.run(["sudo", "shutdown", "now"])</code>.'],
    code: `from gpiozero import Button, LED
from signal import pause

button = Button(27, bounce_time=0.05, hold_time={{hold}} / 1000)
led = LED(17)
presses = 0

def pressed():
    global presses
    presses += 1
    led.toggle()
    print("pressed #{} -> LED {}".format(presses, "on" if led.is_lit else "off"))

def released():
    print("released")

def held():
    global presses
    presses = 0
    led.off()
    print("held: counter reset, LED off")

button.when_pressed = pressed
button.when_released = released
button.when_held = held
print("Ready - press the button (Ctrl+C to quit)")
pause()`,
    params: { hold: { value: 1000, min: 200, max: 5000 } },
    async setup(io, b) {
      b.st.events.length = 0;
      b.st.presses = 0;
      b.off();
      io.line('button = Button(27'); io.pin('GPIO27', 'HIGH', false); await io.delay(100);
      io.line('led = LED(17)'); await io.delay(80);
      io.line('button.when_pressed'); io.line('button.when_released'); io.line('button.when_held'); await io.delay(80);
      io.line('print("Ready'); io.print('Ready - press the button (Ctrl+C to quit)');
      io.line('pause()');
    },
    async loop(io, b, p) {
      const st = b.st;
      if (st.quit) { await io.delay(200); return; }
      const cmd = io.readLine();
      if (cmd && /^(q|quit|exit)$/i.test(cmd.trim())) { st.quit = true; io.print('^CTraceback (most recent call last):'); io.print('KeyboardInterrupt'); io.print('(gpiozero released GPIO17 and GPIO27 as Python exited)'); b.off(); return; }
      // hold detection
      if (b.btn.pressed && !st.held && st.downAt && performance.now() - st.downAt >= p.hold) {
        st.held = true;
        io.line('def held'); io.line('presses = 0', 2);
        st.presses = 0;
        io.line('led.off()'); b.off(); io.pin('GPIO17', 'LOW', false);
        io.line('"held: counter reset'); io.print('held: counter reset, LED off');
      }
      const ev = st.events.shift();
      if (!ev) { io.line('pause()'); await io.delay(30); return; }
      if (ev.type === 'down') {
        if (ev.t - (st.lastDown ?? -1e9) < 50) return; // inside bounce_time
        st.lastDown = ev.t;
        st.downAt = ev.t;
        st.held = false;
        io.pin('GPIO27', 'LOW', true);
        io.line('def pressed'); await io.delay(10);
        io.line('presses += 1'); st.presses++;
        io.line('led.toggle()');
        if (b.lit) { b.off(); io.pin('GPIO17', 'LOW', false); } else { b.on(); io.pin('GPIO17', 'HIGH', true); }
        io.line('"pressed #{}'); io.print(`pressed #${st.presses} -> LED ${b.lit ? 'on' : 'off'}`);
      } else {
        st.downAt = 0;
        io.pin('GPIO27', 'HIGH', false);
        io.line('def released'); io.line('print("released")'); io.print('released');
      }
      await io.delay(20);
    },
    reset(b) { b.off(); b.st.events.length = 0; b.st.downAt = 0; b.st.quit = false; },
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'rpi-pwm-servo', title: 'Servo with PWM', icon: 'servo', board: 'rpi5',
    thumb: () => { const s = makeServo(v(0, 0, 0)); s.set(60); return s.group; },
    view: { center: [-4.4, 1.0, -0.4], size: 14, az: -12 },
    build(ctx) {
      const st = { angle: 0, load: 10, jitter: 0, t: 0 };
      powerOn(ctx, () => 0.1 + st.load / 250);
      const servo = ctx.add(makeServo(v(-9.0, 0, -1.2)));
      const [gnd, pwr, sig] = servo.leads;
      const wg = ctx.wire(gnd, ctx.board.pin('PIN6'), 'brown', { signal: 'GND', lift: 1.8 });
      const wp = ctx.wire(pwr, ctx.board.pin('PIN2'), 'red', { signal: '5V', lift: 2.2, dir: -1 });
      const ws = ctx.wire(sig, ctx.board.pin('GPIO18'), 'orange', { signal: 'GPIO18', lift: 1.4, dir: -1 });
      const plot = ctx.plotter({ title: 'Pulse on GPIO18', series: [{ name: 'pulse ms', color: '#f08a2c', min: 0.4, max: 2.6 }] });
      ctx.onTick((dt) => {
        st.t += dt;
        // software-timed PWM: pulse edges wander a little, more under CPU load
        st.jitter = (Math.sin(st.t * 37) * 0.5 + (Math.random() - 0.5)) * (0.004 + (st.load / 100) * 0.03);
        servo.set(clamp(st.angle + 90 + st.jitter * 90, 0, 180));
      });
      ctx.interact(servo, {
        name: 'Micro servo (SG90-style)', hint: 'Load the CPU and watch the servo twitch',
        controls: [{ type: 'range', label: 'CPU workload (other programs)', min: 0, max: 100, step: 5, get: () => st.load, set: (x) => (st.load = x), format: (x) => `${x}%` }],
        note: () => `Pulse ≈ ${(1.5 + st.angle / 90).toFixed(2)} ms ± ${((0.004 + (st.load / 100) * 0.03) * 1000 / 2).toFixed(0)} µs (software timing)`,
      });
      servo.set(90);
      ctx.anchor('servo', servo.anchor);
      ctx.anchor('sig', ws.mid);
      ctx.anchor('pwr', wp.mid);
      ctx.anchor('gndw', wg.mid);
      return { servo, plot, st };
    },
    callouts: [
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pwm', title: 'GPIO18 · pin 12', text: 'A 50 Hz pulse train; its width (0.5–2.5 ms) sets the angle.' },
      { anchor: 'servo', x: 0.04, y: 0.17, icon: 'servo', title: 'Micro servo', text: 'Click it: load the CPU and the software-timed pulses wobble.' },
      { anchor: 'pwr', x: 0.7, y: 0.17, icon: 'plug', title: '5 V · pin 2', text: 'One micro servo is fine; bigger ones need their own supply.' },
      { anchor: 'gndw', x: 0.04, y: 0.68, icon: 'gnd', title: 'GND · pin 6', text: 'Servo and Pi share ground, always.' },
    ],
    overview: {
      heading: 'Servo with PWM',
      text: 'A hobby servo reads one pulse every 20 ms: 0.5 ms means −90°, 1.5 ms the middle, 2.5 ms +90°. gpiozero’s <code>AngularServo</code> converts an angle into that pulse. On a Pi 5 it times the pulses in software (lgpio), which is good enough for a demo; for rock-steady servos use hardware PWM.',
      features: [['servo', '<code>AngularServo(18, min_pulse_width=…, max_pulse_width=…)</code>'], ['pwm', 'Pulse ms = 1.5 + angle ÷ 90 for this servo'], ['gear', 'Hardware PWM: <code>dtoverlay=pwm-2chan</code> + rpi-hardware-pwm']],
    },
    pinout: [['Pin 12 (GPIO18)', 'Servo signal (orange)', 'Hardware-PWM capable pin'], ['Pin 2 (5 V)', 'Servo power (red)', 'Straight from the USB-C supply'], ['Pin 6 (GND)', 'Servo ground (brown)', 'Common ground']],
    example: {
      text: 'Pan-tilt camera heads, robot grippers and model-railway points use servos. A servo HAT (a PCA9685 PWM chip on I²C) drives 16 of them with perfect timing and its own power input.',
      points: ['Drag the CPU workload to 100 %: software pulse timing gets noisier and the horn twitches', 'For hardware PWM add <code>dtoverlay=pwm-2chan</code> to <code>/boot/firmware/config.txt</code>; on a Pi 5 GPIO18 is PWM channel 2', 'Lower <code>step</code> for a smoother sweep'],
    },
    specs: [['Library', 'gpiozero <code>AngularServo</code> (lgpio software timing)'], ['Frequency', '50 Hz (20 ms frame)'], ['Pulse range', '0.5–2.5 ms → −90° … +90°'], ['Servo', 'SG90-style, 4.8–6 V, up to ≈ 700 mA stalled'], ['Hardware PWM pins', 'GPIO12, 13, 18, 19']],
    quiz: [
      { q: 'What pulse width puts this servo at 0° (the middle)?', options: ['0.5 ms', '1.5 ms', '2.5 ms', '20 ms'], answer: 1, explain: 'With min 0.5 ms (−90°) and max 2.5 ms (+90°), the midpoint is 1.5 ms.' },
      { q: 'Why can the servo twitch when the Pi is busy?', options: ['The 5 V pin is too weak', 'The pulses are timed in software, so other programs delay the edges slightly', 'Servos dislike Python', 'GPIO18 is input-only'], answer: 1, explain: 'Linux is not a real-time OS. Hardware PWM (or a PWM HAT) times the pulses in silicon instead.' },
      { q: 'Why must the servo’s ground connect to a Pi GND pin?', options: ['It looks tidy', 'The signal is measured relative to ground; without a shared ground the pulses mean nothing', 'To cool the servo', 'It is optional'], answer: 1, explain: 'A signal voltage only makes sense against a common reference.' },
    ],
    challenges: ['Move to −90°, 0° and +90° with a one-second pause at each.', 'Read an angle typed into the terminal with <code>input()</code> and go there.', 'Drive two servos from GPIO12 and GPIO13 so they move in opposite directions.'],
    code: `from gpiozero import AngularServo
from time import sleep

# SG90-style servo: 0.5 ms = -90 deg, 2.5 ms = +90 deg, one pulse every 20 ms
servo = AngularServo(18, min_angle=-90, max_angle=90,
                     min_pulse_width=0.0005, max_pulse_width=0.0025)
STEP = {{step}}

def go(angle):
    servo.angle = angle
    print("angle {:4d} deg  pulse {:.2f} ms".format(angle, 1.5 + angle / 90))
    sleep(0.05)

while True:
    for angle in range(-90, 91, STEP):
        go(angle)
    for angle in range(90, -91, -STEP):
        go(angle)`,
    params: { step: { value: 10, min: 1, max: 45 } },
    async setup(io, b) {
      io.line('servo = AngularServo'); await io.delay(150);
      io.pin('GPIO18', '50 Hz', true);
      b.dir = 1;
      b.st.angle = -90;
    },
    async loop(io, b, p) {
      const st = b.st;
      const step = Math.max(1, p.step);
      const seq = [];
      if (b.dir > 0) for (let a = -90; a <= 90; a += step) seq.push(a);
      else for (let a = 90; a >= -90; a -= step) seq.push(a);
      io.line(b.dir > 0 ? 'for angle in range(-90' : 'for angle in range(90');
      for (const a of seq) {
        io.line('servo.angle = angle');
        st.angle = a;
        const ms = 1.5 + a / 90;
        io.line('print("angle'); io.print(`angle ${String(a).padStart(4)} deg  pulse ${ms.toFixed(2)} ms`);
        for (let k = 0; k < 2; k++) b.plot.push(ms + st.jitter);
        io.line('sleep(0.05)'); await io.delay(50);
      }
      b.dir = -b.dir;
    },
    reset(b) { b.st.angle = 0; },
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'rpi-i2c-sensor', title: 'I²C motion sensor', icon: 'wave', board: 'rpi5',
    thumb: () => { const m = makeMPU6050(v(0, 0, 0)); m.setTilt(15, -10); return m.group; },
    view: { center: [-4.0, 1.0, -1.4], size: 13.5, az: -10 },
    build(ctx) {
      powerOn(ctx);
      const mpu = ctx.add(makeMPU6050(v(-8.6, 0, -2.6)));
      const wv = ctx.wire(ctx.board.pin('PIN1'), mpu.pin('VCC'), 'red', { signal: '3V3', lift: 1.6 });
      ctx.wire(ctx.board.pin('PIN9'), mpu.pin('GND'), 'black', { signal: 'GND', dir: -1, lift: 1.4 });
      const wsda = ctx.wire(ctx.board.pin('PIN3'), mpu.pin('SDA'), 'blue', { signal: 'SDA', lift: 2.0 });
      const wscl = ctx.wire(ctx.board.pin('PIN5'), mpu.pin('SCL'), 'yellow', { signal: 'SCL', lift: 2.3 });
      const plot = ctx.plotter({ title: 'Tilt', series: [{ name: 'pitch °', color: '#e5412e', min: -90, max: 90 }, { name: 'roll °', color: '#3b78e7', min: -90, max: 90 }] });
      const st = { pitch: 0, roll: 0, auto: true, t: 0, shake: 0 };
      ctx.onTick((dt) => {
        if (st.auto) {
          st.t += dt;
          st.pitch = 28 * Math.sin(st.t * 0.9);
          st.roll = 20 * Math.sin(st.t * 0.55 + 1);
        }
        st.shake = Math.max(0, st.shake - dt);
        mpu.setTilt(st.pitch + (st.shake ? (Math.random() - 0.5) * 12 : 0), st.roll + (st.shake ? (Math.random() - 0.5) * 12 : 0));
      });
      ctx.interact(mpu, {
        name: 'MPU-6050 (GY-521)', hint: 'Tilt or shake the sensor',
        controls: [
          { type: 'range', label: 'Pitch', min: -80, max: 80, step: 1, get: () => Math.round(st.pitch), set: (x) => { st.auto = false; st.pitch = x; }, format: (x) => `${x}°` },
          { type: 'range', label: 'Roll', min: -80, max: 80, step: 1, get: () => Math.round(st.roll), set: (x) => { st.auto = false; st.roll = x; }, format: (x) => `${x}°` },
          { type: 'toggle', label: 'Wobble by itself', get: () => st.auto, set: (x) => (st.auto = x) },
          { type: 'button', label: 'Shake it', press: () => (st.shake = 1.2) },
        ],
      });
      ctx.anchor('mpu', mpu.anchor);
      ctx.anchor('sda', wsda.mid);
      ctx.anchor('scl', wscl.mid);
      ctx.anchor('vcc', wv.mid);
      return { mpu, plot, st };
    },
    callouts: [
      { anchor: 'sda', x: 0.36, y: 0.12, icon: 'wave', title: 'SDA · pin 3', text: 'Data line of I²C bus 1 (<code>/dev/i2c-1</code>).' },
      { anchor: 'scl', x: 0.7, y: 0.17, icon: 'timer', title: 'SCL · pin 5', text: 'The clock the Pi drives, 100 kHz by default.' },
      { anchor: 'mpu', x: 0.04, y: 0.17, icon: 'hand', title: 'MPU-6050', text: 'Click it to tilt or shake. Accelerometer + gyro at 0x68.' },
      { anchor: 'vcc', x: 0.04, y: 0.68, icon: 'bolt', title: '3.3 V · pin 1', text: 'Powers the module; GND on pin 9.' },
    ],
    overview: {
      heading: 'Read an I²C sensor',
      text: 'I²C needs two wires shared by every sensor on the bus. With <code>smbus2</code> you wake the MPU-6050 by writing one register, then read 14 bytes at once: acceleration, temperature and rotation. Gravity tells you which way is down, so two <code>atan2()</code> calls give pitch and roll.',
      features: [['wave', '<code>SMBus(1)</code>: <code>write_byte_data</code>, <code>read_i2c_block_data</code>'], ['code', '16-bit signed registers, ±2 g = 16384 counts per g'], ['radar', 'Pitch and roll from the gravity vector']],
    },
    pinout: [['Pin 1 (3V3)', 'MPU-6050 VCC', 'Module regulator accepts 3.3–5 V'], ['Pin 9 (GND)', 'MPU-6050 GND', ''], ['Pin 3 (SDA, GPIO2)', 'MPU-6050 SDA', 'Pi has 1.8 kΩ pull-ups'], ['Pin 5 (SCL, GPIO3)', 'MPU-6050 SCL', ''], ['AD0', 'Unconnected (LOW)', 'Address 0x68; HIGH = 0x69']],
    example: {
      text: 'Self-balancing robots, drone flight controllers, step counters and screen rotation all read an accelerometer and gyro just like this.',
      points: ['Enable I²C first: <code>sudo raspi-config</code> → Interface Options → I2C', '<code>i2cdetect -y 1</code> should show <b>68</b> in the grid', 'Shake the sensor: the total g jumps away from 1.00'],
    },
    specs: [['Library', 'smbus2 (<code>pip install smbus2</code>, or python3-smbus2)'], ['Bus', 'I²C-1 on pins 3 / 5'], ['Address', '0x68 (AD0 low)'], ['Accel range', '±2 g → 16384 LSB/g'], ['Gyro range', '±250 °/s → 131 LSB/(°/s)'], ['Temperature', 'raw / 340 + 36.53 °C']],
    quiz: [
      { q: 'Why does the script write 0 to register 0x6B first?', options: ['To reset the Pi', 'The MPU-6050 starts asleep; clearing PWR_MGMT_1 wakes it up', 'To set the address', 'To calibrate the gyro'], answer: 1, explain: 'After power-up the sleep bit is set and every reading is zero until you clear it.' },
      { q: 'The sensor lies flat and still. What should az read?', options: ['0 g', 'About 1 g', '9.8 g', '−16384 g'], answer: 1, explain: 'An accelerometer at rest measures gravity: about 1 g on the axis pointing up.' },
      { q: 'What does word(hi, lo) do with values above 32767?', options: ['Clips them', 'Converts the 16-bit two’s complement value to a negative number', 'Doubles them', 'Ignores them'], answer: 1, explain: 'The registers hold signed 16-bit numbers; subtracting 65536 turns 0xFFFF into −1.' },
      { q: 'Which shell command lists the I²C devices on bus 1?', options: ['lsusb', 'i2cdetect -y 1', 'pinout', 'vcgencmd i2c'], answer: 1, explain: 'i2cdetect probes every address and prints the ones that answer.' },
    ],
    challenges: ['Also print the rotation rate around Y and Z (registers 0x45 and 0x47).', 'Light an LED on GPIO17 when the sensor tilts more than 30°.', 'Smooth pitch with a complementary filter: 0.98 × (pitch + gyro × dt) + 0.02 × accel pitch.'],
    code: `from smbus2 import SMBus
import math
import time

ADDR = 0x68              # AD0 low
PWR_MGMT_1 = 0x6B
ACCEL_XOUT_H = 0x3B

def word(hi, lo):
    v = (hi << 8) | lo
    return v - 65536 if v > 32767 else v

with SMBus(1) as bus:                         # I2C bus 1 = pins 3 and 5
    bus.write_byte_data(ADDR, PWR_MGMT_1, 0)  # wake the sensor
    print("WHO_AM_I = 0x{:02X}".format(bus.read_byte_data(ADDR, 0x75)))
    while True:
        d = bus.read_i2c_block_data(ADDR, ACCEL_XOUT_H, 14)
        ax, ay, az = (word(d[i], d[i + 1]) / 16384 for i in (0, 2, 4))
        temp = word(d[6], d[7]) / 340 + 36.53
        gx = word(d[8], d[9]) / 131
        pitch = math.degrees(math.atan2(-ax, math.sqrt(ay * ay + az * az)))
        roll = math.degrees(math.atan2(ay, az))
        g = math.sqrt(ax * ax + ay * ay + az * az)
        print("pitch {:6.1f}  roll {:6.1f}  gx {:6.1f} dps | {:.2f} g  {:.1f} C".format(
            pitch, roll, gx, g, temp))
        time.sleep({{interval}} / 1000)`,
    params: { interval: { value: 200, min: 20, max: 2000 } },
    async setup(io) {
      io.line('with SMBus(1)'); io.pin('SCL', 'SCL', true); await io.delay(100);
      io.line('bus.write_byte_data'); io.pin('SDA', '0x6B←0', true); await io.delay(100);
      io.line('WHO_AM_I'); io.print('WHO_AM_I = 0x68'); await io.delay(100);
      this.prev = null;
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('d = bus.read_i2c_block_data');
      const pr = b.mpu.pitch * Math.PI / 180, rr = b.mpu.roll * Math.PI / 180;
      const shake = st.shake ? 0.4 * Math.random() : 0;
      const ax = -Math.sin(pr) + (Math.random() - 0.5) * 0.01 + shake;
      const ay = Math.sin(rr) * Math.cos(pr) + (Math.random() - 0.5) * 0.01;
      const az = Math.cos(rr) * Math.cos(pr) + (Math.random() - 0.5) * 0.01;
      io.pin('SDA', `0x${(Math.round(ax * 16384) & 0xffff).toString(16).padStart(4, '0')}`, true);
      io.line('ax, ay, az');
      io.line('temp = word');
      const now = performance.now();
      const gx = this.prev ? (b.mpu.roll - this.prev.roll) / ((now - this.prev.t) / 1000) : 0;
      this.prev = { roll: b.mpu.roll, t: now };
      io.line('pitch = math.degrees'); io.line('roll = math.degrees');
      const pitch = Math.atan2(-ax, Math.hypot(ay, az)) * 180 / Math.PI;
      const roll = Math.atan2(ay, az) * 180 / Math.PI;
      const g = Math.hypot(ax, ay, az);
      io.line('print("pitch');
      io.print(`pitch ${pitch.toFixed(1).padStart(6)}  roll ${roll.toFixed(1).padStart(6)}  gx ${clamp(gx, -250, 250).toFixed(1).padStart(6)} dps | ${g.toFixed(2)} g  ${(29.6 + Math.random() * 0.2).toFixed(1)} C`);
      b.plot.push(pitch, roll);
      io.line('time.sleep'); await io.delay(p.interval);
    },
    reset() {},
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'rpi-camera', title: 'Camera + motion detect', icon: 'radar', board: 'rpi5',
    thumb: () => makeCSICamera(v(0, 0, 0)).group,
    view: { center: [-0.6, 2.2, 7.0], size: 22, az: -14 },
    build(ctx) {
      powerOn(ctx);
      const cam = makeCSICamera(v(1.4, 0, 6.2));
      ctx.addObject(cam.group);
      const ribbon = makeRibbon(ctx.board.csi, cam.ribbonEnd, 1.2, { dirB: cam.ribbonDir, axisA: ctx.board.csiAxis, axisB: cam.ribbonAxis, bendB: cam.ribbonBend });
      ctx.addObject(ribbon.group);
      ctx.addObject(feedRoom(1.4, 36));
      const person = ctx.add(makePerson(v(-6, 0, 17), { rotY: Math.PI / 2, shirt: 0xe5412e }));
      const st = { x: -12, dir: 1, walking: true, t: 0, lights: true, lightFlash: 0, running: false, box: null, score: 0, motion: false, shots: 0 };
      ctx.onTick((dt) => {
        st.t += dt;
        if (st.walking) {
          st.x += st.dir * 2.2 * dt;
          if (st.x > 14) st.dir = -1;
          if (st.x < -12) st.dir = 1;
        }
        person.group.position.set(st.x, st.walking ? Math.abs(Math.sin(st.t * 7)) * 0.12 : 0, 17);
        person.group.rotation.y = st.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        st.lightFlash = Math.max(0, st.lightFlash - dt);
      });
      const eye = cam.lensWorld.clone().addScaledVector(cam.lookDir, 0.08);
      const target = eye.clone().addScaledVector(cam.lookDir, 10);
      target.y = 2.6;
      const feed = ctx.camera({ position: eye, target, fov: 62, title: 'Picamera2 · lores 320×240', sub: 'idle' });
      feed.camera.layers.enable(1);
      feed.el.style.background = 'transparent';
      feed.el.querySelector('.panel-body')?.style.setProperty('background', 'transparent');
      feed.el.querySelector('header')?.style.setProperty('background', 'var(--paper-solid)');
      const subEl = feed.el.querySelector('header small');
      const feedEl = feed.el.querySelector('.feed');
      feed.draw((g, w, h) => {
        if (!st.lights) { g.fillStyle = 'rgba(10,12,24,.72)'; g.fillRect(0, 0, w, h); }
        if (!st.running) {
          g.fillStyle = 'rgba(13,16,32,.6)'; g.fillRect(0, 0, w, 24);
          g.fillStyle = '#e9ecf5'; g.font = '600 11px "IBM Plex Mono", monospace'; g.fillText('Press Run to start the script', 10, 16);
          return;
        }
        if (st.box) {
          g.strokeStyle = st.motion ? '#ff5a4a' : 'rgba(255,255,255,.5)';
          g.lineWidth = 2;
          g.setLineDash(st.motion ? [] : [4, 4]);
          g.strokeRect(st.box.x, st.box.y, st.box.w, st.box.h);
          g.setLineDash([]);
        }
        g.font = '600 12px "IBM Plex Mono", monospace';
        const label = `change ${st.score.toFixed(1)}${st.motion ? '  MOTION' : ''}`;
        const tw = g.measureText(label).width;
        g.fillStyle = st.motion ? 'rgba(229,65,46,.85)' : 'rgba(40,44,60,.72)';
        g.fillRect(6, h - 24, tw + 12, 18);
        g.fillStyle = '#fff';
        g.fillText(label, 12, h - 10);
      });
      ctx.interact(person, { name: 'Person', hint: 'Walks across the room', controls: [{ type: 'toggle', label: 'Walking', get: () => st.walking, set: (x) => (st.walking = x) }] });
      ctx.interact(cam, {
        name: 'Camera Module 3-style', hint: '12 MP sensor on a 22-to-15-way ribbon',
        controls: [{ type: 'toggle', label: 'Room lights', get: () => st.lights, set: (x) => { st.lights = x; ctx.setDarkness(x ? 0 : 0.55); st.lightFlash = 0.6; } }],
        note: () => 'Switching the lights changes every pixel at once: frame differencing calls that motion too.',
      });
      ctx.anchor('cam', cam.anchor);
      ctx.anchor('ribbon', ribbon.curve.getPointAt(0.5));
      ctx.anchor('person', person.anchor);
      return {
        st, person, feed,
        setSub: (t) => { if (subEl && subEl.textContent !== t) subEl.textContent = t; },
        size: () => { const r = feedEl?.getBoundingClientRect(); return r && r.width > 10 ? r : null; },
      };
    },
    callouts: [
      { anchor: 'cam', x: 0.36, y: 0.12, icon: 'radar', title: 'Camera module', text: 'Click it to switch the room lights and fool the detector.' },
      { anchor: 'ribbon', x: 0.04, y: 0.68, icon: 'serial', title: 'CAM/DISP 0', text: 'A Pi 5 needs a 22-way to 15-way ribbon for most cameras.' },
      { anchor: 'person', x: 0.7, y: 0.17, icon: 'hand', title: 'Something moving', text: 'Pixels that change between frames add up to a motion score.' },
      { anchor: 'chip', x: 0.04, y: 0.17, icon: 'chip', title: 'ISP in the SoC', text: 'Turns raw sensor data into a full-size and a small (lores) stream.' },
    ],
    overview: {
      heading: 'Camera and motion detection',
      text: '<code>Picamera2</code> runs the camera with two streams: a full-size one for photos and a small greyscale-friendly one for analysis. Subtract each small frame from the last: if the average change passes a threshold, something moved, so save a full-size JPEG.',
      features: [['radar', '<code>create_video_configuration(main=…, lores=…)</code>'], ['code', 'NumPy frame differencing on the Y (brightness) plane'], ['knob', 'Edit <code>THRESHOLD</code>: too low = false alarms, too high = misses']],
    },
    pinout: [['CAM/DISP 0', 'Camera ribbon', '22-pin; 22-to-15 adapter cable for Camera Module 2/3'], ['main stream', '1280×720 RGB', 'Saved as JPEG'], ['lores stream', '320×240 YUV420', 'Used for the motion maths']],
    example: {
      text: 'Wildlife cameras, doorbells and simple security systems use exactly this idea before reaching for neural networks: cheap, fast and good enough indoors.',
      points: ['Stop the person walking: the change score falls to almost zero', 'Switch the room lights off: one huge spike, a false alarm', 'Check the camera with <code>rpicam-hello</code> in a terminal before running Python'],
    },
    specs: [['Library', 'Picamera2 + NumPy (pre-installed on Raspberry Pi OS)'], ['Camera', 'Camera Module 3-style, 12 MP, autofocus'], ['Analysis', '320×240 Y plane, mean absolute difference'], ['Output', 'JPEG from the 1280×720 main stream'], ['Simulation', 'The score and box come from the real 3D person in view']],
    quiz: [
      { q: 'Why analyse the small lores stream instead of the full image?', options: ['It has more colour', 'It is about 12 times fewer pixels, so the maths is fast', 'Full images cannot be read', 'Lores is in focus'], answer: 1, explain: '320×240 is 76 800 pixels versus 921 600 at 1280×720; motion does not need fine detail.' },
      { q: 'Why convert to int16 before subtracting?', options: ['To save memory', 'uint8 values wrap around: 10 − 20 would become 246', 'NumPy needs it for mean()', 'For colour'], answer: 1, explain: 'Unsigned 8-bit arithmetic cannot go negative; a wider signed type keeps the difference correct.' },
      { q: 'The lights switch off and a JPEG is saved. Why?', options: ['A bug in Picamera2', 'Every pixel changed brightness, which looks like motion to frame differencing', 'The camera rebooted', 'The threshold is ignored at night'], answer: 1, explain: 'Frame differencing measures change, not people. Neural networks (next track) tell what changed.' },
    ],
    challenges: ['Ignore changes in the top third of the image (a tree outside the window).', 'Save at most one photo every 5 seconds.', 'Record a 10-second H.264 clip with <code>picam2.start_and_record_video()</code> when motion starts.'],
    code: `from picamera2 import Picamera2
import numpy as np
import time

THRESHOLD = {{threshold}} / 10      # mean change (0-255) that counts as motion

picam2 = Picamera2()
config = picam2.create_video_configuration(
    main={"size": (1280, 720)},
    lores={"size": (320, 240), "format": "YUV420"})
picam2.configure(config)
picam2.start()
w, h = picam2.stream_configuration("lores")["size"]
prev = None

while True:
    yuv = picam2.capture_buffer("lores")
    cur = yuv[: w * h].reshape(h, w).astype(np.int16)   # Y = brightness
    if prev is not None:
        diff = np.abs(cur - prev)
        score = diff.mean()
        if score > THRESHOLD:
            ys, xs = np.nonzero(diff > 25)
            name = time.strftime("motion-%H%M%S.jpg")
            picam2.capture_file(name)
            print("motion {:.1f} at x {}-{}, y {}-{} -> {}".format(
                score, xs.min(), xs.max(), ys.min(), ys.max(), name))
    prev = cur
    time.sleep(0.1)`,
    params: { threshold: { value: 20, min: 2, max: 200 } },
    async setup(io, b) {
      const st = b.st;
      io.line('picam2 = Picamera2()'); io.print('[0:01:12.338] INFO Camera camera_manager.cpp:325 libcamera v0.3.2+rpt'); await io.delay(300);
      io.line('create_video_configuration'); await io.delay(100);
      io.line('picam2.configure'); io.print('INFO RPI pisp.cpp: Sensor: /base/axi/pcie@120000/rp1/i2c@88000/imx708@1a - Selected sensor format: 1536x864-SBGGR10_1X10'); await io.delay(200);
      io.line('picam2.start()'); await io.delay(200);
      st.running = true; st.prevArea = null; st.lastLight = st.lights;
      b.setSub('running · 10 fps');
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('yuv = picam2.capture_buffer');
      io.line('cur = yuv');
      const r = b.size();
      let score = 0.4 + Math.random() * 0.3; // sensor noise
      st.box = null;
      if (r) {
        const bx = b.feed.boxOf(b.person.group);
        if (bx.visible) {
          const x0 = Math.max(0, bx.x), y0 = Math.max(0, bx.y), x1 = Math.min(r.width, bx.x + bx.w), y1 = Math.min(r.height, bx.y + bx.h);
          if (x1 - x0 > 2 && y1 - y0 > 2) {
            st.box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
            // moving silhouette: the changed area is about the part of the body that moved in 0.1 s
            if (st.walking) score += ((x1 - x0) * (y1 - y0)) / (r.width * r.height) * 60;
          }
        }
      }
      if (st.lights !== st.lastLight) { score += 70; st.lastLight = st.lights; }
      if (!st.lights) score = score * 0.5 + 0.6; // darker image, more noise relative to signal
      st.score = score;
      io.line('if prev is not None');
      io.line('diff = np.abs'); io.line('score = diff.mean()');
      const thr = p.threshold / 10;
      st.motion = score > thr;
      io.line('if score > THRESHOLD');
      if (st.motion) {
        io.line('ys, xs = np.nonzero');
        io.line('picam2.capture_file');
        const d = new Date();
        const name = `motion-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}.jpg`;
        const k = r ? 320 / r.width : 1;
        const bx = st.box && !(score > 60) ? st.box : { x: 0, y: 0, w: r?.width ?? 320, h: r?.height ?? 240 };
        io.line('print("motion');
        io.print(`motion ${score.toFixed(1)} at x ${Math.round(bx.x * k)}-${Math.round((bx.x + bx.w) * k) - 1}, y ${Math.round(bx.y * k)}-${Math.min(239, Math.round((bx.y + bx.h) * k))} -> ${name}`);
      }
      b.setSub(`running · change ${score.toFixed(1)} / ${thr.toFixed(1)}`);
      io.line('prev = cur');
      io.line('time.sleep(0.1)'); await io.delay(st.motion ? 350 : 100); // saving a JPEG takes a moment
    },
    reset(b, io) { b.st.running = false; b.st.box = null; b.st.motion = false; b.setSub('idle'); },
  },

  // ------------------------------------------------------------------ 7
  {
    id: 'rpi-flask-dashboard', title: 'Flask web dashboard', icon: 'globe', board: 'rpi5',
    thumb: () => makeLED('green', v(0.13, 0, 0), v(-0.13, 0, 0)).group,
    view: { center: [-5.2, 0.9, -1.4], size: 15, az: -10 },
    build(ctx) {
      const st = { up: false, page: null, pending: null, json: null, load: 10 };
      powerOn(ctx, () => (st.up ? 0.3 : 0.12));
      const th = thermals(ctx, st);
      const bb = ctx.breadboard(...BBP);
      const c = piLed(ctx, bb, { pin: 'GPIO17', col: 20, color: 'green' });
      const queue = [];
      const port = () => st.port ?? 5000;
      const phone = ctx.browser({
        url: `http://raspberrypi.local:5000/`, title: 'Phone browser',
        render: () => {
          if (!st.up) return `<h5>Can’t reach this page</h5><p class="muted">raspberrypi.local refused to connect. Press <b>Run</b> to start the Flask app.</p>`;
          if (!st.page) return '<p class="muted">Loading…</p>';
          const pg = st.page;
          return `<h5>Pi dashboard</h5><div class="row"><span>LED</span><span class="big">${pg.on ? 'ON' : 'OFF'}</span></div><div class="row"><span>CPU</span><span class="big">${pg.temp.toFixed(1)}<small style="font-size:16px"> °C</small></span></div>
            <div style="display:flex;gap:6px;margin:10px 0"><button class="${pg.on ? 'on' : 'off'}" data-action="get" data-value="/led/on" style="flex:1">On</button><button class="${pg.on ? 'off' : 'on'}" data-action="get" data-value="/led/off" style="flex:1">Off</button><button data-action="get" data-value="/led/toggle" style="flex:1">Toggle</button></div>
            <p><button data-action="get" data-value="/api/status">GET /api/status</button></p>
            ${st.json ? `<p class="muted" style="font-family:var(--mono)">${esc(st.json)}</p>` : ''}<p class="muted">${st.pending ? `Loading ${esc(st.pending)}…` : ''}</p>`;
        },
        onAction(action, value) {
          if (action !== 'get' || !st.up || st.pending) return;
          st.pending = value;
          queue.push(value);
          phone.setUrl(`http://raspberrypi.local:${port()}${value}`);
        },
      });
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('sig', c.sig.mid);
      return { ...c, st, th, queue, phone };
    },
    callouts: [
      { anchor: 'chip', x: 0.36, y: 0.12, icon: 'globe', title: 'Flask app', text: 'A Python web server: each <code>@app.route</code> is one URL.' },
      { anchor: 'sig', x: 0.04, y: 0.17, icon: 'pins', title: 'GPIO17 · pin 11', text: '<code>/led/on</code> and <code>/led/off</code> drive this pin.' },
      { anchor: 'led', x: 0.04, y: 0.68, icon: 'led', title: 'Green LED', text: 'Lit while the page says ON.' },
      { anchor: 'ethernet', x: 0.7, y: 0.17, icon: 'globe', title: 'Same network', text: 'Phone and Pi must share a network: <code>raspberrypi.local</code> resolves there.' },
    ],
    overview: {
      heading: 'A web dashboard in Flask',
      text: 'Flask turns Python functions into web pages. The page shows the LED and the CPU temperature; three links switch the LED and redirect back to the page, and <code>/api/status</code> returns JSON for other programs. <code>host="0.0.0.0"</code> makes it reachable from your phone.',
      features: [['globe', '<code>@app.route("/led/&lt;action&gt;")</code> with a URL variable'], ['code', '<code>jsonify()</code> for an API, <code>redirect()</code> after a change'], ['thermo', 'gpiozero <code>CPUTemperature</code> on the page']],
    },
    pinout: [['Pin 11 (GPIO17)', '330 Ω → green LED (+)', 'Output'], ['Pin 9 (GND)', 'LED (−)', ''], ['Network', 'Wi-Fi or Ethernet', 'Port from the code']],
    example: {
      text: 'Home dashboards, greenhouse controllers and robot control panels are often tiny Flask apps like this. Add Chart.js to the page and poll <code>/api/status</code> for live graphs.',
      points: ['Tap Toggle and read the request log in the terminal: 302 means “redirected”', 'Try <code>GET /api/status</code>: that JSON is what a phone app or Home Assistant would read', 'Flask’s built-in server is for development; use gunicorn or waitress for anything long-running'],
    },
    specs: [['Libraries', 'Flask 2.x (python3-flask), gpiozero'], ['Routes', '<code>/</code>, <code>/led/&lt;action&gt;</code>, <code>/api/status</code>'], ['Host', '0.0.0.0 = every network interface'], ['Address', 'http://raspberrypi.local:PORT (mDNS) or the Pi’s IP'], ['Security', 'No login: home network only']],
    quiz: [
      { q: 'What does host="0.0.0.0" do?', options: ['Disables the server', 'Listens on every network interface, so other devices can connect', 'Uses port 0', 'Only allows the Pi itself'], answer: 1, explain: 'The default 127.0.0.1 only accepts connections from the Pi itself.' },
      { q: 'Why does set_led() return redirect("/")?', options: ['To log out', 'So the browser goes back to the main page and a refresh does not repeat the action', 'Flask requires it', 'To speed up the LED'], answer: 1, explain: 'Redirect-after-action is a common web pattern; the log shows 302 for the redirect, then 200 for the page.' },
      { q: 'What does /api/status return?', options: ['An HTML page', 'JSON such as {"cpu_c": 45.2, "led": true}', 'A photo', 'Nothing'], answer: 1, explain: 'jsonify() builds a JSON response that scripts and apps can read easily.' },
    ],
    challenges: ['Add a <code>/led/blink</code> route that calls <code>led.blink()</code>.', 'Refresh the temperature every 2 s with a few lines of JavaScript and <code>fetch("/api/status")</code>.', 'Run the app automatically at boot with a systemd service (next lesson).'],
    code: `from flask import Flask, jsonify, redirect
from gpiozero import LED, CPUTemperature

app = Flask(__name__)
led = LED(17)
cpu = CPUTemperature()

PAGE = """<!doctype html>
<meta name="viewport" content="width=device-width">
<title>Pi dashboard</title>
<h1>Pi dashboard</h1>
<p>LED is <b>{state}</b> - CPU {temp:.1f} &deg;C</p>
<p><a href="/led/on">On</a> | <a href="/led/off">Off</a> | <a href="/led/toggle">Toggle</a></p>
"""

@app.route("/")
def index():
    return PAGE.format(state="ON" if led.is_lit else "OFF", temp=cpu.temperature)

@app.route("/led/<action>")
def set_led(action):
    if action == "on":
        led.on()
    elif action == "off":
        led.off()
    elif action == "toggle":
        led.toggle()
    else:
        return "unknown action", 404
    return redirect("/")

@app.route("/api/status")
def status():
    return jsonify(led=led.is_lit, cpu_c=round(cpu.temperature, 1))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port={{port}})`,
    params: { port: { value: 5000, min: 1024, max: 65535 } },
    async setup(io, b, p) {
      const st = b.st;
      st.port = p.port;
      b.queue.length = 0;
      io.line('app = Flask'); io.line('led = LED(17)'); io.line('cpu = CPUTemperature()'); await io.delay(150);
      io.line('app.run(host');
      io.print(' * Serving Flask app \'dashboard\'');
      io.print(' * Debug mode: off');
      io.print('WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.');
      io.print(` * Running on all addresses (0.0.0.0)`);
      io.print(` * Running on http://127.0.0.1:${p.port}`);
      io.print(` * Running on http://${PI_IP}:${p.port}`);
      io.print('Press CTRL+C to quit');
      st.up = true;
      st.page = null;
      b.phone.setUrl(`http://raspberrypi.local:${p.port}/`);
      b.queue.push('/');
      b.phone.update();
    },
    async loop(io, b) {
      const st = b.st;
      io.line('app.run(host');
      const path = b.queue.shift();
      if (!path) { await io.delay(50); return; }
      const stamp = () => { const d = new Date(); return `${pad2(d.getDate())}/${MON[d.getMonth()]}/${d.getFullYear()} ${clock(d)}`; };
      const log = (code) => io.print(`${PHONE_IP} - - [${stamp()}] "GET ${path} HTTP/1.1" ${code} -`);
      if (path === '/api/status') {
        io.line('def status'); io.line('return jsonify'); await io.delay(40);
        st.json = JSON.stringify({ cpu_c: Math.round(st.temp * 10) / 10, led: b.lit }).replace(/,/g, ', ').replace(/:/g, ': ');
        log(200);
      } else if (path.startsWith('/led/')) {
        const action = path.slice(5);
        io.line('def set_led'); await io.delay(30);
        io.line(`if action == "on"`);
        if (action === 'on') { io.line('led.on()'); b.on(); }
        else if (action === 'off') { io.line('elif action == "off"'); io.line('led.off()'); b.off(); }
        else { io.line('elif action == "toggle"'); io.line('led.toggle()'); if (b.lit) b.off(); else b.on(); }
        io.pin('GPIO17', b.lit ? 'HIGH' : 'LOW', b.lit);
        io.line('return redirect'); log(302);
        b.queue.unshift('/');
        await io.delay(80);
        return;
      } else {
        io.line('def index'); io.line('return PAGE.format');
        st.page = { on: b.lit, temp: st.temp };
        st.json = null;
        log(200);
      }
      st.pending = null;
      b.phone.setUrl(`http://raspberrypi.local:${st.port}${path}`);
      b.phone.update();
      await io.delay(80);
    },
    reset(b) {
      b.off();
      Object.assign(b.st, { up: false, page: null, pending: null, json: null });
      b.queue.length = 0;
      b.phone.update();
    },
  },

  // ------------------------------------------------------------------ 8
  {
    id: 'rpi-home-server', title: 'A logging home server', icon: 'thermo', board: 'rpi5',
    thumb: () => makeTO92([v(-0.254, 0, 0), v(0, 0, 0), v(0.254, 0, 0)], 'DS18B20').group,
    view: { center: [-5.4, 0.9, -1.2], size: 14.5, az: -10 },
    build(ctx) {
      const st = { room: 21.5, finger: 0, rows: 0, sum: 0, rebootReq: false, load: 12 };
      powerOn(ctx);
      const th = thermals(ctx, st);
      const bb = ctx.breadboard(...BBP);
      const ds = ctx.add(makeTO92([bb.hole(20, 'h'), bb.hole(21, 'h'), bb.hole(22, 'h')], 'DS18B20'));
      const pull = ctx.add(makeResistor(bb.hole(21, 'f'), bb.hole(25, 'f'), 4700));
      ctx.wire(ctx.board.pin('PIN9'), bb.hole(20, 'j'), 'black', { signal: 'GND', dir: -1, lift: 2.0 });
      const dq = ctx.wire(ctx.board.pin('GPIO4'), bb.hole(21, 'j'), 'yellow', { signal: 'GPIO4', lift: 2.4 });
      const vdd = ctx.wire(ctx.board.pin('PIN1'), bb.hole(25, 'j'), 'red', { signal: '3V3', lift: 2.8 });
      ctx.wire(bb.hole(22, 'j'), bb.hole(25, 'i'), 'red', { lift: 0.5 });
      ctx.onTick((dt) => (st.finger = Math.max(0, st.finger - dt / 25)));
      ctx.interact(ds, {
        name: 'DS18B20 temperature sensor', hint: '1-Wire, ±0.5 °C, unique 64-bit ID',
        controls: [
          { type: 'range', label: 'Room temperature', min: -10, max: 40, step: 0.5, get: () => st.room, set: (x) => (st.room = x), format: (x) => `${x} °C` },
          { type: 'button', label: 'Hold it between your fingers', press: () => (st.finger = 1) },
        ],
      });
      ctx.interact(ctx.board, {
        name: 'Raspberry Pi 5-style', hint: 'Simulate a power cut',
        controls: [{ type: 'button', label: 'Pull the power and plug it back in', press: () => (st.rebootReq = true) }],
        note: () => `The database survives on the SD card: ${st.rows} rows so far.`,
      });
      ctx.interact(pull, { name: '4.7 kΩ pull-up', hint: '1-Wire data line idles HIGH through this resistor' });
      const temp = () => Math.round((st.room + st.finger * (33 - st.room)) * 16) / 16; // 12-bit = 1/16 °C
      ctx.anchor('ds', ds.anchor);
      ctx.anchor('pull', pull.anchor);
      ctx.anchor('dq', dq.mid);
      ctx.anchor('vdd', vdd.mid);
      return { st, th, temp };
    },
    callouts: [
      { anchor: 'ds', x: 0.04, y: 0.17, icon: 'thermo', title: 'DS18B20', text: 'Digital thermometer on a 1-Wire bus. Click it to warm it up.' },
      { anchor: 'dq', x: 0.36, y: 0.12, icon: 'pins', title: 'GPIO4 · pin 7', text: 'The default 1-Wire pin; the kernel driver does the timing.' },
      { anchor: 'pull', x: 0.04, y: 0.68, icon: 'resistor', title: '4.7 kΩ pull-up', text: 'Between data and 3.3 V: 1-Wire needs it.' },
      { anchor: 'chip', x: 0.7, y: 0.17, icon: 'gear', title: 'systemd service', text: 'Starts the logger at boot and restarts it if it crashes. Click the board to pull the power.' },
      { anchor: 'vdd', x: 0.36, y: 0.74, icon: 'bolt', title: '3V3 · pin 1', text: 'Powers the sensor and the pull-up.' },
    ],
    overview: {
      heading: 'A home server that logs',
      text: 'A Pi is happiest running quietly for months. This script reads a DS18B20 through Linux’s 1-Wire driver and appends each reading to an SQLite database. A <b>systemd</b> unit starts it at boot, restarts it after a crash, and <code>journalctl</code> shows its output.',
      features: [['thermo', '1-Wire: read <code>/sys/bus/w1/devices/28-*/w1_slave</code>'], ['code', '<code>sqlite3</code>: a whole database in one file, built into Python'], ['gear', '<code>systemctl enable --now logger</code>, <code>journalctl -u logger -f</code>']],
    },
    pinout: [['Pin 7 (GPIO4)', 'DS18B20 DQ (middle leg)', '+ 4.7 kΩ to 3.3 V'], ['Pin 1 (3V3)', 'DS18B20 VDD (right leg, flat face forward)', 'Also feeds the pull-up'], ['Pin 9 (GND)', 'DS18B20 GND (left leg)', '']],
    example: {
      text: 'Home servers log temperatures, run Home Assistant, block adverts or store backups. Save the unit below as <code>/etc/systemd/system/logger.service</code>:<pre style="font:12px var(--mono);margin:8px 0;white-space:pre-wrap">[Unit]\nDescription=Room temperature logger\nAfter=multi-user.target\n\n[Service]\nExecStart=/usr/bin/python3 /home/pi/logger/logger.py\nRestart=always\nUser=pi\n\n[Install]\nWantedBy=multi-user.target</pre>',
      points: ['Enable 1-Wire: add <code>dtoverlay=w1-gpio</code> to <code>/boot/firmware/config.txt</code> and reboot', 'Click the board to pull the power: the service starts again by itself and the row count carries on', 'Query the data any time: <code>sqlite3 readings.db "SELECT * FROM readings ORDER BY ts DESC LIMIT 5"</code>'],
    },
    specs: [['Sensor', 'DS18B20, −55…125 °C, ±0.5 °C, 12-bit (1/16 °C)'], ['Bus', '1-Wire on GPIO4 (w1-gpio overlay)'], ['Database', 'SQLite file <code>readings.db</code> (Python <code>sqlite3</code>)'], ['Service', 'systemd unit with <code>Restart=always</code>'], ['Logs', '<code>journalctl -u logger -f</code>'], ['Reading time', '≈ 750 ms per 12-bit conversion']],
    quiz: [
      { q: 'What does Restart=always in the unit file do?', options: ['Reboots the Pi every day', 'Starts the script again whenever it stops or crashes', 'Restarts the sensor', 'Clears the database'], answer: 1, explain: 'systemd watches the process and relaunches it; WantedBy=multi-user.target makes it start at boot.' },
      { q: 'Why does the script check that the first line ends with YES?', options: ['It is a password', 'The driver reports whether the CRC check passed; NO means a corrupted reading', 'To see if the sensor is hot', 'For SQLite'], answer: 1, explain: 'w1_slave prints the raw bytes, then crc=… YES or NO. Skip readings that fail.' },
      { q: 'Why call db.commit() after each INSERT?', options: ['It speeds up reads', 'Until committed, the new row is not safely written to the file', 'SQLite needs it to open', 'It deletes old rows'], answer: 1, explain: 'An uncommitted transaction is lost if the power goes; commit makes it durable.' },
      { q: 'Which command follows the service’s output live?', options: ['tail /dev/gpio', 'journalctl -u logger -f', 'pinout -f', 'systemctl print logger'], answer: 1, explain: 'Anything the service prints goes to the systemd journal; -f follows new lines.' },
    ],
    challenges: ['Add a second DS18B20 on the same wire and log both (they have different 28-… IDs).', 'Every hour, print the min, max and mean of the last 24 hours with one SQL query.', 'Serve the last 100 rows as JSON with a small Flask app (previous lesson).'],
    code: `#!/usr/bin/env python3
# /home/pi/logger/logger.py - started at boot by logger.service
import glob
import sqlite3
import time
from datetime import datetime

DB = "/home/pi/logger/readings.db"
INTERVAL = {{interval}}               # seconds between readings

def ds18b20():
    path = glob.glob("/sys/bus/w1/devices/28-*/w1_slave")[0]
    with open(path) as f:
        crc_line, data_line = f.read().splitlines()[:2]
    if not crc_line.endswith("YES"):
        return None                    # CRC failed, try again next time
    return int(data_line.split("t=")[1]) / 1000

def cpu_temp():
    with open("/sys/class/thermal/thermal_zone0/temp") as f:
        return int(f.read()) / 1000

db = sqlite3.connect(DB)
db.execute("""CREATE TABLE IF NOT EXISTS readings (
                ts TEXT PRIMARY KEY, room_c REAL, cpu_c REAL)""")
print("logger started, writing to", DB, flush=True)

while True:
    room = ds18b20()
    if room is not None:
        ts = datetime.now().isoformat(timespec="seconds")
        db.execute("INSERT INTO readings VALUES (?, ?, ?)", (ts, room, cpu_temp()))
        db.commit()
        n, avg = db.execute("SELECT COUNT(*), AVG(room_c) FROM readings").fetchone()
        print("{} room {:.3f} C | {} rows, mean {:.2f} C".format(ts, room, n, avg), flush=True)
    time.sleep(INTERVAL)`,
    params: { interval: { value: 2, min: 1, max: 60 } },
    async setup(io, b) {
      io.print('pi@pi5:~ $ sudo systemctl enable --now logger.service');
      io.print('Created symlink /etc/systemd/system/multi-user.target.wants/logger.service → /etc/systemd/system/logger.service.');
      io.print('pi@pi5:~ $ journalctl -u logger -f');
      await io.delay(250);
      await this.start(io, b);
    },
    async start(io, b) {
      const pid = 700 + Math.floor(Math.random() * 400);
      b.pid = pid;
      io.print(`${journal()} systemd[1]: Started logger.service - Room temperature logger.`);
      io.line('db = sqlite3.connect'); await io.delay(60);
      io.line('CREATE TABLE IF NOT EXISTS'); await io.delay(60);
      io.line('"logger started'); io.print(`${journal()} python3[${pid}]: logger started, writing to /home/pi/logger/readings.db`);
    },
    async loop(io, b, p) {
      const st = b.st;
      if (st.rebootReq) {
        st.rebootReq = false;
        io.board.setPowerLed?.(0);
        io.print('-- Boot 6f3c… (power was lost: no clean shutdown) --');
        await io.delay(1600);
        io.board.setPowerLed?.(0.85);
        io.print(`${journal()} systemd[1]: Starting logger.service…`);
        await io.delay(300);
        await this.start(io, b);
      }
      io.line('room = ds18b20()');
      io.line('glob.glob("/sys/bus/w1');
      io.pin('GPIO4', '1-Wire', true);
      await io.delay(750); // 12-bit conversion time
      io.line('if not crc_line.endswith');
      if (Math.random() < 0.03) { io.line('return None'); io.pin('GPIO4', 'CRC NO', false); await io.delay(p.interval * 1000); return; }
      const room = b.temp();
      io.line('return int(data_line');
      io.line('ts = datetime.now()');
      io.line('db.execute("INSERT'); io.line('db.commit()');
      st.rows++;
      st.sum += room;
      io.line('n, avg = db.execute');
      io.line('print("{} room');
      io.print(`${journal()} python3[${b.pid}]: ${iso()} room ${room.toFixed(3)} C | ${st.rows} rows, mean ${(st.sum / st.rows).toFixed(2)} C`);
      io.line('time.sleep(INTERVAL)'); await io.delay(Math.max(0, p.interval * 1000 - 750));
    },
    reset(b, io) { io.board.setPowerLed?.(0.85); b.st.rebootReq = false; },
  },
];

/** Physical-pin names used by the pinout printout (index = pin number). */
function ctxBoardNames() {
  const BCM = [null, null, null, 2, null, 3, null, 4, 14, null, 15, 17, 18, 27, null, 22, 23, null, 24, 10, null, 9, 25, 11, 8, null, 7, 0, 1, 5, null, 6, 12, 13, null, 19, 16, 26, 20, null, 21];
  const PWR = { 1: '3V3', 2: '5V', 4: '5V', 6: 'GND', 9: 'GND', 14: 'GND', 17: '3V3', 20: 'GND', 25: 'GND', 30: 'GND', 34: 'GND', 39: 'GND' };
  return Array.from({ length: 41 }, (_, n) => (n === 0 ? '' : PWR[n] ?? `GPIO${BCM[n]}`));
}

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['chip', 'Raspberry Pi 5-style board', 'Quad-core Linux computer with a 40-pin GPIO header.', 'rpi-meet'],
  ['code', 'gpiozero', 'Friendly Python library for LEDs, buttons, servos and sensors on the Pi header.', 'rpi-gpiozero-led'],
  ['servo', 'AngularServo', 'gpiozero class that turns an angle into a 50 Hz servo pulse.', 'rpi-pwm-servo'],
  ['wave', 'MPU-6050', 'I²C accelerometer + gyroscope (address 0x68).', 'rpi-i2c-sensor'],
  ['radar', 'Camera Module 3-style', '12 MP MIPI CSI-2 camera driven by Picamera2.', 'rpi-camera'],
  ['globe', 'Flask', 'Python web framework: routes, pages and JSON APIs.', 'rpi-flask-dashboard'],
  ['thermo', 'DS18B20', '1-Wire digital thermometer, ±0.5 °C, needs a 4.7 kΩ pull-up.', 'rpi-home-server'],
  ['gear', 'systemd service', 'Starts a program at boot and restarts it if it stops.', 'rpi-home-server'],
];
