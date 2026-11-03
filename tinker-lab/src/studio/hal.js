// The HAL a running sketch talks to, generated from the solved circuit:
// writes change the board's pin sources and re-solve the circuit; reads
// sample the solved net voltages (digital thresholds with hysteresis, the
// 10/12-bit ADC). Virtual peripherals (servo, LCD, OLED, NeoPixel, DHT,
// keypad, ultrasonic) only answer when they are wired and powered correctly.
import { boardKey } from './circuit/netlist.js';

const I2C_ADDR = { oled: [0x3c, 0x3d], lcd: [0x27, 0x3f] };

/**
 * Work out, for every module, whether it is wired and powered, which board pin
 * drives it and what is missing. Returns Map(partId → { ok, pin, num, hints[] }).
 */
export function analyzeModules({ project, sim, studioBoard, defs, result }) {
  const net = sim.net, b = studioBoard.def;
  const out = new Map();
  if (!net) return out;
  const netOfBoard = (name) => net.netOf(boardKey(name, b));
  const gpioOnNet = (id) => {
    if (id == null) return null;
    for (const [name, p] of Object.entries(b.pins)) if (p.gpio && netOfBoard(name) === id) return { name, num: p.num };
    return null;
  };
  // a signal may also reach the pin through a small series resistor (NeoPixel DIN, servo)
  const viaResistor = (id) => {
    for (const part of project.parts) {
      if (part.type !== 'resistor' || part.props.ohms > 2200) continue;
      const pins = net.partPins.get(part.id);
      if (!pins) continue;
      const a = net.netOf(pins['1']), c = net.netOf(pins['2']);
      if (a === id) { const g = gpioOnNet(c); if (g) return g; }
      if (c === id) { const g = gpioOnNet(a); if (g) return g; }
    }
    return null;
  };
  const supplies = ['5V', '3V3', 'VIN', 'IOREF', '5V_2', '5V_3'].filter((n) => b.power[n] != null);
  const label = (n) => studioBoard.label(n);
  for (const part of project.parts) {
    const def = defs[part.type];
    if (!def?.needs) continue;
    const pins = net.partPins.get(part.id);
    if (!pins) continue;
    const pnet = (p) => net.netOf(pins[p]);
    const hints = [];
    const r = result?.parts.get(part.id) ?? {};
    const [vccPin, gndPin] = def.needs.power;
    const gndOk = pnet(gndPin) === netOfBoard('GND') || hasPath(project, net, pins[gndPin], defs);
    const vccOk = supplies.some((s) => pnet(vccPin) === netOfBoard(s)) || (r.vcc ?? 0) > 1;
    if (!vccOk) hints.push(`Connect ${vccPin} to ${def.needs.min > 3.6 ? '5V' : '5V or 3V3'}.`);
    if (!gndOk && (r.vcc ?? 0) < 1) hints.push(`Connect ${gndPin} to GND.`);
    if (vccOk && (r.vcc ?? 0) < def.needs.min) hints.push(`Only ${(r.vcc ?? 0).toFixed(1)} V between ${vccPin} and ${gndPin}; it needs at least ${def.needs.min} V.`);
    const info = { ok: false, hints, pin: null, num: null };
    if (def.needs.i2c) {
      const sda = netOfBoard(b.i2c.SDA), scl = netOfBoard(b.i2c.SCL);
      const mSda = pnet('SDA'), mScl = pnet('SCL');
      if (mSda === scl && mScl === sda) hints.push(`SDA and SCL are swapped: SDA goes to ${label(b.i2c.SDA)}, SCL to ${label(b.i2c.SCL)}.`);
      else {
        if (mSda !== sda) hints.push(`Wire SDA to ${label(b.i2c.SDA)} (the board's SDA).`);
        if (mScl !== scl) hints.push(`Wire SCL to ${label(b.i2c.SCL)} (the board's SCL).`);
      }
      info.addr = part.props.addr;
    }
    const sig = { ring: 'DIN', strip: 'DIN', servo: 'SIG', dht11: 'DATA' }[part.type];
    if (sig) {
      const g = gpioOnNet(pnet(sig)) ?? viaResistor(pnet(sig));
      if (g) { info.pin = g.name; info.num = g.num; }
      else hints.push(`Wire ${sig} to a digital pin.`);
    }
    if (part.type === 'ultrasonic') {
      const t = gpioOnNet(pnet('TRIG')), e = gpioOnNet(pnet('ECHO'));
      if (!t) hints.push('Wire TRIG to a digital pin.');
      if (!e) hints.push('Wire ECHO to a digital pin.');
      info.trig = t?.num ?? null;
      info.echo = e?.num ?? null;
    }
    info.ok = hints.length === 0;
    out.set(part.id, info);
  }
  // keypad: every row and column on its own GPIO
  for (const part of project.parts) {
    if (part.type !== 'keypad') continue;
    const pins = net.partPins.get(part.id);
    if (!pins) continue;
    const lines = defs.keypad.pins.map((p) => gpioOnNet(net.netOf(pins[p])));
    const missing = defs.keypad.pins.filter((p, i) => !lines[i]);
    out.set(part.id, { ok: !missing.length, hints: missing.length ? [`Wire ${missing.join(', ')} to digital pins.`] : [], pins: lines.map((l) => l?.num) });
  }
  return out;
}

// GND reached through another wire chain counts (e.g. via the rail)
function hasPath(project, net, key, defs) {
  return net.netOf(key) === net.netOf('b:GND');
}

/** Decode an OLED frame: 1024-byte SSD1306 page buffer, 8192 bytes (one per pixel) or a 2D array. */
export function oledPixels(buf, w = 128, h = 64) {
  const px = new Uint8Array(128 * 64);
  if (!buf) return px;
  if (buf.length === w * h && w <= 128 && h <= 64 && buf.length !== 1024) {
    // one entry per pixel (the runtime's Adafruit_SSD1306 buffer); 128×32 panels use the top half
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[y * 128 + x] = buf[y * w + x] ? 1 : 0;
  } else if (buf.length === 1024) {
    for (let page = 0; page < 8; page++)
      for (let x = 0; x < 128; x++) {
        const byte = buf[page * 128 + x];
        for (let bit = 0; bit < 8; bit++) px[(page * 8 + bit) * 128 + x] = (byte >> bit) & 1;
      }
  } else if (buf.length === 8192) {
    for (let i = 0; i < 8192; i++) px[i] = buf[i] ? 1 : 0;
  } else if (Array.isArray(buf) && Array.isArray(buf[0])) {
    for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) px[y * 128 + x] = buf[y]?.[x] ? 1 : 0;
  }
  return px;
}

/** Normalise NeoPixel colours: flat [r,g,b,…], [[r,g,b],…] or packed 0xRRGGBB. */
export function rgbList(arr, n) {
  const out = [];
  if (!arr) return out;
  if (typeof arr[0] === 'number' && arr.length >= n * 3 && n > 0 && arr.length !== n) {
    for (let i = 0; i < n; i++) out.push([arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]]);
  } else {
    for (const c of arr) {
      if (Array.isArray(c)) out.push([c[0] | 0, c[1] | 0, c[2] | 0]);
      else if (typeof c === 'number') out.push([(c >> 16) & 255, (c >> 8) & 255, c & 255]);
      else if (c && typeof c === 'object') out.push([c.r | 0, c.g | 0, c.b | 0]);
    }
  }
  return out;
}

/**
 * Build the HAL for the current circuit. `host` is the studio: it owns the
 * scene parts, the module analysis and the clock.
 *   host.sim, host.board (studio board), host.modules() → Map, host.partApi(id),
 *   host.partState(id), host.project, host.clock() → µs, host.onPins(), host.serial(text),
 *   host.tone(freq|0), host.invalidate(), host.hint(id, text)
 */
export function createHal(host) {
  const sim = host.sim, sb = host.board, b = sb.def;
  // the runtime expects 0–1023 and rescales to the board's ADC width itself
  const maxAdc = 1023;
  const lastRead = new Map();
  const trigHigh = new Map();
  const toneTimers = new Map();
  const floating = (name) => {
    host.hint?.(`float:${name}`, { level: 'info', pin: name, title: `${name} is floating`, text: 'Nothing holds this input HIGH or LOW, so it reads random values (it picks up electrical noise).', fix: 'Use pinMode(pin, INPUT_PULLUP), or add a 10 kΩ pull-down resistor to GND.' });
    return Math.random() < 0.5 ? 1 : 0;
  };
  const changed = () => host.onPins?.();
  const nameOf = (pin) => sb.nameOfNum(pin);

  const findPart = (type, test) => {
    const mods = host.modules();
    for (const p of host.project.parts) {
      if (!type.includes(p.type)) continue;
      const m = mods.get(p.id);
      if (m && test(m, p)) return { part: p, info: m };
    }
    return null;
  };

  const hal = {
    pinMode(pin, mode) {
      const st = sim.pin(pin);
      const m = String(mode).toUpperCase();
      st.mode = m === 'OUTPUT' || m === '1' ? 'OUTPUT' : m === 'INPUT_PULLUP' || m === '2' ? 'INPUT_PULLUP' : m === 'INPUT_PULLDOWN' ? 'INPUT_PULLDOWN' : 'INPUT';
      if (st.mode === 'OUTPUT') st.duty = null;
      else { st.duty = null; st.tone = 0; }
      changed();
    },
    digitalWrite(pin, value) {
      const st = sim.pin(pin);
      const v = value ? 1 : 0;
      if (st.value === v && st.duty == null) return;
      st.value = v;
      st.duty = null;
      if (st.mode === 'OUTPUT' && v) trigHigh.set(pin, host.clock());
      changed();
    },
    digitalRead(pin) {
      const name = nameOf(pin);
      if (!name) return 0;
      const st = sim.pin(pin);
      const v = sim.pinVoltage(name);
      if (v == null) {
        if (st.mode === 'OUTPUT') return st.value;
        if (st.mode === 'INPUT_PULLUP' || (st.mode === 'INPUT' && st.value && b.avr)) return 1;
        if (st.mode === 'INPUT_PULLDOWN') return 0;
        return floating(name);
      }
      if (st.mode === 'INPUT' && !(st.value && b.avr) && sim.impedanceAt(name) > 5e6) return floating(name);
      const prev = lastRead.get(pin) ?? 0;
      let r = prev;
      if (v >= b.vih * b.logic) r = 1;
      else if (v <= b.vil * b.logic) r = 0;
      lastRead.set(pin, r);
      return r;
    },
    analogWrite(pin, value) {
      const st = sim.pin(pin);
      const name = nameOf(pin);
      const v = Math.max(0, Math.min(255, Math.round(value)));
      st.mode = 'OUTPUT';
      if (!name || !b.pins[name]?.pwm) {
        // wiring_analog.c: a pin without PWM just goes LOW below 128 and HIGH above
        st.duty = null;
        st.value = v < 128 ? 0 : 1;
      } else if (v === 0) { st.duty = null; st.value = 0; }
      else if (v === 255) { st.duty = null; st.value = 1; }
      else { st.duty = v / 255; st.value = 1; }
      changed();
    },
    analogRead(pin) {
      const name = sb.analogName(pin);
      if (!name || b.pins[name]?.adc == null) return 0;
      const v = sim.pinVoltage(name);
      if (v == null || sim.impedanceAt(name) > 5e6) {
        host.hint?.(`float:${name}`, { level: 'info', pin: name, title: `${name} is not connected`, text: 'An unconnected analog input drifts and returns meaningless numbers.', fix: 'Wire a sensor or a potentiometer wiper to it.' });
        const t = host.clock() / 1e6;
        return Math.round(maxAdc * (0.32 + 0.08 * Math.sin(t * 2.1) + 0.03 * Math.random()));
      }
      return Math.max(0, Math.min(maxAdc, Math.round((v / b.vref) * maxAdc)));
    },
    tone(pin, freq, durationMs) {
      const st = sim.pin(pin);
      st.mode = 'OUTPUT';
      st.tone = Math.max(31, Math.round(freq));
      st.duty = null;
      if (durationMs > 0) toneTimers.set(pin, host.clock() + durationMs * 1000);
      else toneTimers.delete(pin);
      changed();
    },
    noTone(pin) {
      const st = sim.pin(pin);
      st.tone = 0;
      st.value = 0;
      toneTimers.delete(pin);
      changed();
    },
    pulseIn(pin, level, timeoutUs = 1e6) {
      const hit = findPart(['ultrasonic'], (m) => m.echo === pin);
      if (!hit) return 0;
      const { part, info } = hit;
      if (!info.ok) return 0;
      const t = trigHigh.get(info.trig);
      if (t == null) {
        host.hint?.(`trig:${part.id}`, { level: 'info', part: part.id, title: 'No trigger pulse', text: 'The HC-SR04 only measures after a 10 µs HIGH pulse on TRIG.', fix: 'digitalWrite(trig, HIGH); delayMicroseconds(10); digitalWrite(trig, LOW); then pulseIn(echo, HIGH).' });
        return 0;
      }
      trigHigh.delete(info.trig);
      const cm = part.props.cm;
      if (cm > 400 || !(level === 1 || level === 'HIGH' || level === true)) return 0;
      const us = Math.round(cm * 58.31);   // round trip at 343 m/s
      return us > timeoutUs ? 0 : us;
    },
    serialWrite(text) { host.serial?.(text); },
    now: () => performance.now(),
    devices: {
      servo(pin) {
        const api = {
          attach() {}, detach() {},
          write(deg) {
            const hit = findPart(['servo'], (m) => m.num === pin);
            if (!hit) return;
            const st = host.partState(hit.part.id);
            const d = Number(deg);
            st.target = d >= 0 && d <= 180 ? d : d > 180 && d < 544 ? 180 : Math.max(0, Math.min(180, ((d - 544) / (2400 - 544)) * 180));
            st.powered = hit.info.ok;
          },
          writeMicroseconds(us) { api.write(Math.max(0, Math.min(180, ((us - 544) / (2400 - 544)) * 180))); },
        };
        return api;
      },
      lcd(addr) {
        const get = () => {
          const hit = findPart(['lcd'], (m, p) => (addr == null || p.props.addr === addr) && m.ok);
          return hit ? host.partApi(hit.part.id)?.screen : null;
        };
        return {
          print(row, col, text) { get()?.print(row, col, String(text)); },
          clear() { get()?.clear(); },
          backlight(on = true) { get()?.backlight(!!on); },
          createChar() {},
          setCursor(col, row) { get()?.setCursor(col, row); },
        };
      },
      oled(addr) {
        return {
          show(buffer, w, h) {
            const hit = findPart(['oled'], (m, p) => (addr == null || p.props.addr === addr || I2C_ADDR.oled.includes(addr)) && m.ok);
            const scr = hit && host.partApi(hit.part.id)?.screen;
            if (!scr) return;
            const px = oledPixels(buffer, w, h);
            scr.draw((ctx) => {
              for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) if (px[y * 128 + x]) ctx.fillRect(x, y, 1, 1);
            });
          },
        };
      },
      neopixel(pin, n) {
        return {
          show(colors) {
            const hit = findPart(['ring', 'strip'], (m) => m.num === pin);
            if (!hit) return;
            const api = host.partApi(hit.part.id)?.pixels;
            const st = host.partState(hit.part.id);
            const list = rgbList(colors, n ?? api?.count ?? 12);
            let draw = 0;
            const count = api?.count ?? list.length;
            for (let i = 0; i < count; i++) {
              const [r, g, bl] = list[i] ?? [0, 0, 0];
              draw += 0.0006 + ((r + g + bl) / 255) * 0.02;
              if (api && hit.info.ok) api.setPixel(i, r, g, bl);
            }
            if (api && hit.info.ok) api.show();
            if (Math.abs((st.draw ?? 0) - draw) > 0.002) { st.draw = draw; host.invalidate(); }
          },
        };
      },
      dht(pin) {
        const read = (k) => {
          const hit = findPart(['dht11'], (m) => m.num === pin);
          if (!hit || !hit.info.ok) return NaN;   // the real library returns NaN on a failed read
          return k === 'temp' ? hit.part.props.temp : hit.part.props.hum;
        };
        return { temperature: () => read('temp'), humidity: () => read('hum'), readTemperature: () => read('temp'), readHumidity: () => read('hum') };
      },
      keypad() {
        return {
          // { row, col } of the pressed key (R1–R4 × C1–C4), so the sketch's own key map applies
          getKey() {
            const hit = findPart(['keypad'], (m) => m.ok);
            if (!hit) return null;
            const st = host.partState(hit.part.id);
            if (!st.key || st.key === st.reported) return null;
            st.reported = st.key;
            const k = '123A456B789C*0#D'.indexOf(st.key);
            return { row: Math.floor(k / 4), col: k % 4 };
          },
          isPressed(c) {
            const hit = findPart(['keypad'], (m) => m.ok);
            const st = hit && host.partState(hit.part.id);
            return !!st?.key && (c == null || st.key === c);
          },
        };
      },
      i2c(addr) {
        const hit = findPart(['oled', 'lcd'], (m, p) => m.ok && p.props.addr === addr);
        return hit ? { read: (reg, n) => new Uint8Array(n ?? 1), write() {} } : null;
      },
      eeprom: host.eeprom ?? new Uint8Array(1024).fill(0xff),
    },
    /** Called every frame by the studio: ends timed tones. */
    tick() {
      const now = host.clock();
      for (const [pin, end] of toneTimers) if (now >= end) hal.noTone(pin);
    },
    reset() {
      lastRead.clear();
      trigHigh.clear();
      toneTimers.clear();
    },
  };
  return hal;
}
