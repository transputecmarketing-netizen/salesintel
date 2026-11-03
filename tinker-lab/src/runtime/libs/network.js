// ESP32 / ESP8266 core extras and simulated networking: ESP, LEDC PWM, touch, deep
// sleep, WiFi, WebServer, PubSubClient (MQTT) and BluetoothSerial. Network traffic
// goes to hal.devices (a phone-browser panel, a broker, a phone app); without
// devices the network is simulated locally (Wi-Fi joins after ~1.5 s, MQTT echoes).
import { M, ESP32, ESP } from './registry.js';
import { printMethods, streamMethods } from './core.js';
import { AStr, Ptr, IPAddress, charArray, cstr, Reset, textOf } from '../values.js';
import { canon } from '../types.js';

const H = (...names) => ({ header: names });

export function addNetwork(R) {
  // ================================================================ ESP32 core
  R.header('esp_sleep.h', { boards: ESP32 });
  R.header('esp_system.h', { boards: ESP32 });
  R.header('esp_wifi.h', { boards: ESP32 });
  R.header('freertos/FreeRTOS.h', { boards: ESP32 });
  R.cls({
    name: 'EspClass',
    methods: {
      getChipModel: M('const char* ()', () => new Ptr(charArray('ESP32-D0WD-V3'), 0), { boards: ESP32 }),
      getChipCores: M('uint8_t ()', () => 2, { boards: ESP32 }),
      getChipRevision: M('uint8_t ()', () => 3, { boards: ESP32 }),
      getCpuFreqMHz: M('uint32_t ()', (vm) => (vm.board === 'esp32' ? 240 : 80)),
      getFlashChipSize: M('uint32_t ()', () => 4194304),
      getFreeHeap: M('uint32_t ()', (vm) => (vm.board === 'esp32' ? 294000 : 45000) - (vm.P.globals.length * 16)),
      getHeapSize: M('uint32_t ()', (vm) => (vm.board === 'esp32' ? 327680 : 81920)),
      getMinFreeHeap: M('uint32_t ()', () => 280000, { boards: ESP32 }),
      getMaxAllocHeap: M('uint32_t ()', () => 110580, { boards: ESP32 }),
      getPsramSize: M('uint32_t ()', () => 0, { boards: ESP32 }),
      getSdkVersion: M('const char* ()', () => new Ptr(charArray('v5.1.4'), 0)),
      getSketchSize: M('uint32_t ()', () => 268000),
      getFreeSketchSpace: M('uint32_t ()', () => 1042000),
      getEfuseMac: M('uint64_t ()', () => 0x7856341acfa4, { boards: ESP32 }),
      getChipId: M('uint32_t ()', () => 0x2f3a1c, { boards: ['nodemcu'] }),
      restart: M('void ()', function* (vm) { yield* vm.uartWrite(0, ''); throw new Reset('restart', 12); }),
      deepSleep: M(['void (uint64_t)', 'void (uint64_t, int)'], function* (vm, us) { yield* deepSleep(vm, us, null); }, { boards: ['nodemcu'] }),
    },
  });
  R.obj('ESP', 'EspClass', () => ({}), { boards: ESP });
  R.fn('xPortGetCoreID', 'int ()', () => 1, { boards: ESP32 });
  R.fn('temperatureRead', 'float ()', () => Math.fround(48.3), { boards: ESP32 });
  R.fn('ledcAttach', 'bool (uint8_t, uint32_t, uint8_t)', (vm, pin, freq, bits) => {
    vm.ledc ??= new Map();
    vm.ledc.set(pin, { freq, bits });
    vm.pinMode(pin, 1);
    return 1;
  }, { boards: ESP32 });
  R.fn('ledcAttachChannel', 'bool (uint8_t, uint32_t, uint8_t, uint8_t)', (vm, pin, freq, bits) => { vm.ledc ??= new Map(); vm.ledc.set(pin, { freq, bits }); return 1; }, { boards: ESP32 });
  R.fn('ledcWrite', 'bool (uint8_t, uint32_t)', (vm, pin, duty) => {
    const ch = vm.ledc?.get(pin);
    if (!ch) { vm.warnOnce(`ledc${pin}`, `ledcWrite(${pin}, …) before ledcAttach(${pin}, …): the pin is not set up for PWM`, 'In ESP32 core 3.x the first argument is the pin. Call ledcAttach(pin, freq, bits) in setup().'); return 0; }
    const max = (1 << ch.bits) - 1;
    const d8 = Math.round((Math.min(duty, max) / max) * 255);
    vm.out[pin & 127] = d8 >= 128 ? 1 : 0;
    vm.hal.analogWrite ? vm.hal.analogWrite(pin, d8) : vm.hal.digitalWrite?.(pin, d8 >= 128 ? 1 : 0);
    vm.emit('pin', { pin, kind: 'pwm', value: d8 });
    return 1;
  }, { boards: ESP32 });
  R.fn('ledcWriteTone', 'uint32_t (uint8_t, uint32_t)', (vm, pin, f) => { if (f) vm.tone(pin, f, 0); else vm.noTone(pin); return f; }, { boards: ESP32 });
  R.fn('ledcDetach', 'bool (uint8_t)', (vm, pin) => { vm.ledc?.delete(pin); return 1; }, { boards: ESP32 });
  R.fn('ledcReadFreq', 'uint32_t (uint8_t)', (vm, pin) => vm.ledc?.get(pin)?.freq ?? 0, { boards: ESP32 });
  R.fn('ledcChangeFrequency', 'uint32_t (uint8_t, uint32_t, uint8_t)', (vm, pin, f, bits) => { const c = vm.ledc?.get(pin); if (c) { c.freq = f; c.bits = bits; } return f; }, { boards: ESP32 });
  R.fn('ledcSetup', 'uint32_t (uint8_t, uint32_t, uint8_t)', () => 0, {
    boards: ESP32,
    check: ({ error }) => error("'ledcSetup' was not declared in this scope", 'ledcSetup() and ledcAttachPin() were removed in ESP32 core 3.x. Use ledcAttach(pin, freq, bits) and ledcWrite(pin, duty).'),
  });
  R.fn('ledcAttachPin', 'void (uint8_t, uint8_t)', () => {}, { boards: ESP32, check: ({ error }) => error("'ledcAttachPin' was not declared in this scope", 'Use ledcAttach(pin, freq, bits) in ESP32 core 3.x.') });
  const TOUCH = { T0: 4, T1: 0, T2: 2, T3: 15, T4: 13, T5: 12, T6: 14, T7: 27, T8: 33, T9: 32 };
  R.consts('int', TOUCH, { boards: ESP32 });
  R.fn('touchRead', 'uint16_t (uint8_t)', (vm, pin) => {
    vm.us += 500;
    const v = vm.hal.touchRead?.(pin) ?? vm.devices.touch?.(pin);
    return Math.max(0, Math.round(v ?? 72));
  }, { boards: ESP32 });
  for (let i = 0; i < 40; i++) R.konst(`GPIO_NUM_${i}`, 'gpio_num_t', i, { boards: ESP32 });
  R.consts('int', { ESP_SLEEP_WAKEUP_UNDEFINED: 0, ESP_SLEEP_WAKEUP_ALL: 1, ESP_SLEEP_WAKEUP_EXT0: 2, ESP_SLEEP_WAKEUP_EXT1: 3, ESP_SLEEP_WAKEUP_TIMER: 4, ESP_SLEEP_WAKEUP_TOUCHPAD: 5, ESP_SLEEP_WAKEUP_ULP: 6, ESP_SLEEP_WAKEUP_GPIO: 7, ESP_SLEEP_WAKEUP_UART: 8, ESP_EXT1_WAKEUP_ALL_LOW: 0, ESP_EXT1_WAKEUP_ANY_HIGH: 1, ESP_OK: 0 }, { boards: ESP32 });
  const sleepCfg = (vm) => vm.lib('sleepcfg', () => ({ timer: null, ext0: null, ext1: null, touch: false }));
  R.fn('esp_sleep_enable_timer_wakeup', 'int (uint64_t)', (vm, us) => { sleepCfg(vm).timer = us; return 0; }, { boards: ESP32 });
  R.fn('esp_sleep_enable_ext0_wakeup', 'int (gpio_num_t, int)', (vm, pin, level) => {
    if (![0, 2, 4, 12, 13, 14, 15, 25, 26, 27, 32, 33, 34, 35, 36, 37, 38, 39].includes(pin)) vm.warnOnce('ext0', `GPIO${pin} is not an RTC GPIO, so it can't wake the ESP32 from deep sleep`);
    sleepCfg(vm).ext0 = { pin, level };
    return 0;
  }, { boards: ESP32 });
  R.fn('esp_sleep_enable_ext1_wakeup', 'int (uint64_t, int)', (vm, mask, mode) => { sleepCfg(vm).ext1 = { mask, mode }; return 0; }, { boards: ESP32 });
  R.fn('esp_sleep_enable_touchpad_wakeup', 'int ()', (vm) => { sleepCfg(vm).touch = true; return 0; }, { boards: ESP32 });
  R.fn('esp_sleep_get_wakeup_cause', 'esp_sleep_wakeup_cause_t ()', (vm) => vm.wakeCause ?? 0, { boards: ESP32 });
  R.fn('esp_sleep_get_ext1_wakeup_status', 'uint64_t ()', () => 0, { boards: ESP32 });
  R.fn('esp_deep_sleep_start', 'void ()', function* (vm) { yield* deepSleep(vm, sleepCfg(vm).timer, sleepCfg(vm)); }, { boards: ESP32 });
  R.fn('esp_deep_sleep', 'void (uint64_t)', function* (vm, us) { yield* deepSleep(vm, us, sleepCfg(vm)); }, { boards: ESP32 });
  R.fn('esp_light_sleep_start', 'int ()', function* (vm) {
    const cfg = sleepCfg(vm);
    const cause = yield* sleepUntil(vm, cfg.timer, cfg);
    vm.wakeCause = cause;
    return 0;
  }, { boards: ESP32 });
  R.fn('esp_restart', 'void ()', function* () { throw new Reset('restart', 0); }, { boards: ESP32 });
  R.fn('vTaskDelay', 'void (uint32_t)', function* (vm, ticks) { yield* vm.sleep(ticks * 1000); }, { boards: ESP32 });
  R.konst('portTICK_PERIOD_MS', 'uint32_t', 1, { boards: ESP32 });

  // ================================================================ WiFi
  R.header('WiFi.h', { boards: ESP32, alt: 'WiFi.h here is the ESP32 Wi-Fi library. On the ESP8266 use ESP8266WiFi.h.' });
  R.header('ESP8266WiFi.h', { boards: ['nodemcu'], alt: 'ESP8266WiFi.h is for the ESP8266 (NodeMCU). On the ESP32 use WiFi.h.' });
  R.header('WiFiClient.h', { boards: ESP });
  const WIFI = ['WiFi.h', 'ESP8266WiFi.h'];
  R.consts('int', { WL_IDLE_STATUS: 0, WL_NO_SSID_AVAIL: 1, WL_SCAN_COMPLETED: 2, WL_CONNECTED: 3, WL_CONNECT_FAILED: 4, WL_CONNECTION_LOST: 5, WL_DISCONNECTED: 6, WIFI_OFF: 0, WIFI_STA: 1, WIFI_AP: 2, WIFI_AP_STA: 3, WIFI_AUTH_OPEN: 0, WIFI_AUTH_WEP: 1, WIFI_AUTH_WPA_PSK: 2, WIFI_AUTH_WPA2_PSK: 3, WIFI_AUTH_WPA_WPA2_PSK: 4, WIFI_AUTH_WPA3_PSK: 6, ENC_TYPE_NONE: 7, ENC_TYPE_CCMP: 4 }, H(...WIFI));
  R.cls({
    name: 'IPAddress',
    ctors: ['()', '(uint8_t, uint8_t, uint8_t, uint8_t)', '(uint32_t)'],
    construct: (vm, a, t, idx) => (idx === 1 ? new IPAddress(...a) : idx === 2 ? new IPAddress(a[0] & 255, (a[0] >> 8) & 255, (a[0] >> 16) & 255, a[0] >>> 24) : new IPAddress()),
    printTo: (ip) => ip.toString(),
    copy: (ip) => new IPAddress(...ip.o),
    index: { type: 'uint8_t', container: (vm, ip) => ip.o },
    ops: { '==': { ret: 'bool', fn: (a, b) => +(a.toString() === b.toString()) }, '!=': { ret: 'bool', fn: (a, b) => +(a.toString() !== b.toString()) } },
    methods: {
      toString: M('String ()', (vm, ip) => new AStr(ip.toString())),
      fromString: M('bool (cstr)', (vm, ip, s) => { const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(s); if (!m) return 0; ip.o = m.slice(1).map(Number); return 1; }),
    },
  }, H(...WIFI, 'WebServer.h', 'ESP8266WebServer.h'));
  const net = (vm) => vm.lib('wifi', () => {
    const dev = vm.devices.wifi ?? {};
    return {
      dev,
      status: 0,
      ssid: '',
      joinAt: 0,
      ip: dev.ip ?? '192.168.1.42',
      mac: dev.mac ?? 'A4:CF:12:34:56:78',
      networks: dev.networks ?? [
        { ssid: 'TinkerLab-Guest', rssi: -48, auth: 0 },
        { ssid: 'Workshop-5G', rssi: -61, auth: 3 },
        { ssid: 'HomeNetwork', rssi: -70, auth: 3 },
      ],
      mode: 1,
    };
  });
  const wifiStatus = (vm) => {
    const n = net(vm);
    if (n.status === 'joining' && vm.us >= n.joinAt) {
      const ok = n.dev.accept ? n.dev.accept(n.ssid, n.pass) : true;
      n.status = ok ? 3 : 1;
      if (ok) { n.dev.onConnect?.(n.ssid); vm.emit('wifi', { connected: true, ssid: n.ssid, ip: n.ip }); }
    }
    if (n.status === 3 && n.dev.connected && !n.dev.connected()) n.status = 5;
    return n.status === 'joining' ? 6 : n.status;
  };
  R.cls({
    name: 'WiFiClass',
    cppName: 'WiFiClass',
    methods: {
      mode: M('bool (int)', (vm, w, m) => { net(vm).mode = m; return 1; }),
      begin: M(['int (cstr)', 'int (cstr, cstr)', 'int (cstr, cstr, int)'], (vm, w, ssid, pass = '') => {
        const n = net(vm);
        n.ssid = ssid; n.pass = pass;
        n.status = 'joining';
        n.joinAt = vm.us + (n.dev.connectMs ?? 1500) * 1000;
        vm.emit('wifi', { joining: true, ssid });
        return 6;
      }),
      status: M('int ()', (vm) => { vm.us += 20; return wifiStatus(vm); }),
      isConnected: M('bool ()', (vm) => +(wifiStatus(vm) === 3)),
      disconnect: M(['bool ()', 'bool (bool)'], (vm) => { net(vm).status = 6; return 1; }),
      reconnect: M('bool ()', (vm) => { const n = net(vm); n.status = 'joining'; n.joinAt = vm.us + 1500000; return 1; }),
      setAutoReconnect: M('bool (bool)', () => 1), persistent: M('void (bool)', () => {}), setSleep: M('bool (bool)', () => 1),
      setHostname: M('bool (cstr)', (vm, w, h) => { net(vm).host = h; return 1; }),
      getHostname: M('const char* ()', (vm) => new Ptr(charArray(net(vm).host ?? 'esp32-sim'), 0)),
      config: M(['bool (IPAddress, IPAddress, IPAddress)', 'bool (IPAddress, IPAddress, IPAddress, IPAddress)'], (vm, w, ip) => { net(vm).ip = ip.toString(); return 1; }),
      localIP: M('IPAddress ()', (vm) => { const n = net(vm); return wifiStatus(vm) === 3 ? new IPAddress(...n.ip.split('.').map(Number)) : new IPAddress(); }),
      gatewayIP: M('IPAddress ()', () => new IPAddress(192, 168, 1, 1)),
      subnetMask: M('IPAddress ()', () => new IPAddress(255, 255, 255, 0)),
      dnsIP: M(['IPAddress ()', 'IPAddress (uint8_t)'], () => new IPAddress(192, 168, 1, 1)),
      macAddress: M('String ()', (vm) => new AStr(net(vm).mac)),
      BSSIDstr: M('String ()', () => new AStr('7C:10:C9:AA:21:04')),
      channel: M('int32_t ()', () => 6),
      SSID: M(['String ()', 'String (uint8_t)'], [(vm) => new AStr(wifiStatus(vm) === 3 ? net(vm).ssid : ''), (vm, w, i) => new AStr(net(vm).networks[i]?.ssid ?? '')]),
      RSSI: M(['int8_t ()', 'int32_t (uint8_t)'], [
        (vm) => { if (wifiStatus(vm) !== 3) return 0; const d = net(vm).dev; return Math.round(d.rssi?.() ?? -55 + Math.round(Math.sin(vm.us / 3e6) * 3)); },
        (vm, w, i) => net(vm).networks[i]?.rssi ?? 0,
      ]),
      encryptionType: M('int (uint8_t)', (vm, w, i) => net(vm).networks[i]?.auth ?? 0),
      scanNetworks: M(['int16_t ()', 'int16_t (bool)', 'int16_t (bool, bool)'], function* (vm) { yield* vm.sleep(2200000); return net(vm).networks.length; }),
      scanDelete: M('void ()', () => {}),
      softAP: M(['bool (cstr)', 'bool (cstr, cstr)'], (vm, w, ssid) => { net(vm).ap = ssid; return 1; }),
      softAPIP: M('IPAddress ()', () => new IPAddress(192, 168, 4, 1)),
      softAPgetStationNum: M('uint8_t ()', (vm) => vm.devices.wifi?.stations?.() ?? 0),
      hostByName: M('int (cstr, IPAddress&)', (vm, w, host, ref) => { ref.b[ref.o] = new IPAddress(93, 184, 216, 34); return 1; }),
    },
  });
  R.obj('WiFi', 'WiFiClass', () => ({}), H(...WIFI));
  R.cls({
    name: 'WiFiClient',
    toBool: (c) => !!c.open,
    copy: (c) => c,
    construct: () => ({ open: false, rx: '' }),
    methods: {
      ...printMethods((vm, c, b) => { vm.devices.tcp?.write?.(b); }),
      ...streamMethods({ avail: (vm, c) => c.rx.length, readByte: (vm, c) => { if (!c.rx.length) return -1; const x = c.rx.charCodeAt(0); c.rx = c.rx.slice(1); return x; }, peekByte: (vm, c) => (c.rx.length ? c.rx.charCodeAt(0) : -1), timeout: () => 1000 }),
      connect: M(['int (cstr, uint16_t)', 'int (IPAddress, uint16_t)'], function* (vm, c) { yield* vm.sleep(80000); c.open = wifiStatus(vm) === 3; return +c.open; }),
      connected: M('uint8_t ()', (vm, c) => +!!c.open),
      stop: M('void ()', (vm, c) => { c.open = false; }),
      remoteIP: M('IPAddress ()', (vm, c) => new IPAddress(...(c.remote ?? '192.168.1.23').split('.').map(Number))),
      setInsecure: M('void ()', () => {}),
    },
  }, H(...WIFI, 'WiFiClient.h'));
  R.cls({ name: 'WiFiClientSecure', toBool: (c) => !!c.open, copy: (c) => c, construct: () => ({ open: false, rx: '' }), methods: { setInsecure: M('void ()', () => {}), connect: M('int (cstr, uint16_t)', function* (vm, c) { yield* vm.sleep(400000); c.open = wifiStatus(vm) === 3; return +c.open; }), stop: M('void ()', (vm, c) => { c.open = false; }) } }, H('WiFiClientSecure.h'));
  R.header('WiFiClientSecure.h', { boards: ESP32 });

  // ================================================================ WebServer
  R.header('WebServer.h', { boards: ESP32, alt: 'On the ESP8266 use ESP8266WebServer.h.' });
  R.header('ESP8266WebServer.h', { boards: ['nodemcu'], alt: 'On the ESP32 use WebServer.h.' });
  R.consts('int', { HTTP_ANY: 0, HTTP_GET: 1, HTTP_HEAD: 2, HTTP_POST: 3, HTTP_PUT: 4, HTTP_PATCH: 5, HTTP_DELETE: 6, HTTP_OPTIONS: 7 }, H('WebServer.h', 'ESP8266WebServer.h'));
  const METHODS = { GET: 1, HEAD: 2, POST: 3, PUT: 4, PATCH: 5, DELETE: 6, OPTIONS: 7 };
  const reqArgs = (req) => {
    if (!req) return [];
    if (Array.isArray(req.args)) return req.args;
    const out = Object.entries(req.args ?? {});
    if (!req.args && req.uri?.includes('?')) for (const [k, v] of new URLSearchParams(req.uri.split('?')[1])) out.push([k, v]);
    return out;
  };
  const toText = (a) => {
    if (!a) return '';
    const t = canon(a.t);
    if (t.k === 'class' && t.cls.name === 'String') return a.v.s;
    if (t.k === 'array' || t.k === 'ptr') return cstr(a.v);
    return textOf(a.v, a.t, null);
  };
  const serverMethods = {
    on: M(['void (cstr, fn)', 'void (cstr, int, fn)', 'void (cstr, int, fn, fn)'], [
      (vm, s, uri, fn) => { s.routes.push({ uri, method: 0, fn }); },
      (vm, s, uri, m, fn) => { s.routes.push({ uri, method: m, fn }); },
      (vm, s, uri, m, fn) => { s.routes.push({ uri, method: m, fn }); },
    ]),
    onNotFound: M('void (fn)', (vm, s, fn) => { s.notFound = fn; }),
    begin: M(['void ()', 'void (uint16_t)'], (vm, s) => {
      s.dev = vm.devices.webserver?.(s.port) ?? null;
      s.begun = true;
      if (wifiStatus(vm) !== 3 && !net(vm).ap) vm.warnOnce('ws-wifi', 'server.begin() before Wi-Fi is connected: nobody can reach the server yet', 'Wait for WiFi.status() == WL_CONNECTED first.');
      vm.emit('webserver', { port: s.port, ip: net(vm).ip });
    }),
    stop: M('void ()', (vm, s) => { s.begun = false; }),
    close: M('void ()', (vm, s) => { s.begun = false; }),
    handleClient: M('void ()', function* (vm, s) {
      vm.us += 5;
      if (!s.begun || !s.dev) return;
      const req = s.dev.poll?.();
      if (!req) return;
      const path = (req.uri ?? '/').split('?')[0];
      s.req = { ...req, path, args: reqArgs(req), method: METHODS[(req.method ?? 'GET').toUpperCase()] ?? 1 };
      s.resp = null;
      s.headers = [];
      vm.us += 1500;
      const route = s.routes.find((r) => r.uri === path && (r.method === 0 || r.method === s.req.method));
      if (route) yield* vm.callRef(route.fn, []);
      else if (s.notFound) yield* vm.callRef(s.notFound, []);
      else s.resp = { code: 404, type: 'text/plain', body: `Not found: ${path}` };
      if (s.resp) req.respond?.({ ...s.resp, headers: s.headers });
      else req.respond?.({ code: 0, type: '', body: '', headers: [], timeout: true });
      s.req = null;
    }),
    send: M(['void (int)', 'void (int, cstr)', 'void (int, cstr, any)'], (vm, s, code, type = '', body) => {
      if (!s.req) { vm.warnOnce('ws-send', 'server.send() outside a request handler does nothing'); return; }
      s.resp = { code, type, body: toText(body) };
      vm.us += 300 + (s.resp.body.length * 2);
    }),
    send_P: M('void (int, cstr, cstr)', (vm, s, code, type, body) => { if (s.req) s.resp = { code, type, body }; }),
    sendHeader: M(['void (cstr, cstr)', 'void (cstr, cstr, bool)'], (vm, s, k, v) => { s.headers.push([k, v]); }),
    sendContent: M('void (any)', (vm, s, body) => { if (s.resp) s.resp.body += toText(body); }),
    setContentLength: M('void (size_t)', () => {}),
    arg: M(['String (cstr)', 'String (int)'], [
      (vm, s, name) => new AStr(reqArgs(s.req).find(([k]) => k === name)?.[1] ?? ''),
      (vm, s, i) => new AStr(reqArgs(s.req)[i]?.[1] ?? ''),
    ]),
    argName: M('String (int)', (vm, s, i) => new AStr(reqArgs(s.req)[i]?.[0] ?? '')),
    args: M('int ()', (vm, s) => reqArgs(s.req).length),
    hasArg: M('bool (cstr)', (vm, s, name) => +reqArgs(s.req).some(([k]) => k === name)),
    uri: M('String ()', (vm, s) => new AStr(s.req?.path ?? '')),
    method: M('int ()', (vm, s) => s.req?.method ?? 1),
    client: M('WiFiClient ()', (vm, s) => ({ open: !!s.req, rx: '', remote: s.req?.remoteIP ?? '192.168.1.23' })),
    header: M('String (cstr)', (vm, s, name) => new AStr(s.req?.headers?.[name] ?? '')),
  };
  R.cls({ name: 'WebServer', ctors: ['()', '(int)'], construct: (vm, a) => ({ port: a[0] ?? 80, routes: [], notFound: null, begun: false, req: null }), methods: serverMethods }, { header: ['WebServer.h'], boards: ESP32 });
  R.cls({ name: 'ESP8266WebServer', ctors: ['()', '(int)'], construct: (vm, a) => ({ port: a[0] ?? 80, routes: [], notFound: null, begun: false, req: null }), methods: serverMethods }, { header: ['ESP8266WebServer.h'], boards: ['nodemcu'] });

  // ================================================================ PubSubClient (MQTT)
  R.header('PubSubClient.h');
  R.consts('int', { MQTT_CONNECTION_TIMEOUT: -4, MQTT_CONNECTION_LOST: -3, MQTT_CONNECT_FAILED: -2, MQTT_DISCONNECTED: -1, MQTT_CONNECTED: 0 }, H('PubSubClient.h'));
  const broker = (vm) => vm.lib('mqtt', () => {
    const dev = vm.devices.mqtt?.() ?? null;
    return { dev, subs: new Set(), queue: [] };
  });
  const topicMatch = (filter, topic) => {
    const f = filter.split('/'), t = topic.split('/');
    for (let i = 0; i < f.length; i++) {
      if (f[i] === '#') return true;
      if (f[i] !== '+' && f[i] !== t[i]) return false;
    }
    return f.length === t.length;
  };
  R.cls({
    name: 'PubSubClient',
    ctors: ['()', '(any)'],
    construct: () => ({ host: '', port: 1883, cb: null, state: -1, id: '' }),
    methods: {
      setServer: M(['void (cstr, uint16_t)', 'void (IPAddress, uint16_t)'], (vm, c, host, port) => { c.host = typeof host === 'string' ? host : host.toString(); c.port = port; }),
      setClient: M('void (any)', () => {}),
      setCallback: M('void (fn)', (vm, c, fn) => { c.cb = fn; }),
      setKeepAlive: M('void (uint16_t)', () => {}),
      setSocketTimeout: M('void (uint16_t)', () => {}),
      setBufferSize: M('bool (uint16_t)', () => 1),
      connect: M(['bool (cstr)', 'bool (cstr, cstr, cstr)', 'bool (cstr, cstr, uint8_t, bool, cstr)', 'bool (cstr, cstr, cstr, cstr, uint8_t, bool, cstr)'], function* (vm, c, id) {
        yield* vm.sleep(250000);
        if (wifiStatus(vm) !== 3) { c.state = -2; return 0; }
        if (!c.host) { c.state = -2; return 0; }
        const b = broker(vm);
        const ok = b.dev?.connect ? !!b.dev.connect(id, c.host, c.port) : true;
        c.state = ok ? 0 : -2;
        c.id = id;
        if (ok) vm.emit('mqtt', { connected: true, id, host: c.host });
        return +ok;
      }),
      connected: M('bool ()', (vm, c) => {
        if (c.state === 0 && wifiStatus(vm) !== 3) c.state = -3;
        if (c.state === 0 && broker(vm).dev?.connected && !broker(vm).dev.connected()) c.state = -3;
        return +(c.state === 0);
      }),
      disconnect: M('void ()', (vm, c) => { c.state = -1; }),
      state: M('int ()', (vm, c) => c.state),
      loop: M('bool ()', function* (vm, c) {
        vm.us += 20;
        if (c.state !== 0) return 0;
        const b = broker(vm);
        for (let k = 0; k < 8; k++) {
          const m = b.queue.shift() ?? b.dev?.poll?.();
          if (!m) break;
          if (![...b.subs].some((f) => topicMatch(f, m.topic))) continue;
          vm.emit('mqtt', { received: m });
          if (c.cb) {
            const topic = new Ptr(charArray(m.topic), 0);
            const bytes = typeof m.payload === 'string' ? m.payload : String(m.payload);
            const payload = new Ptr([...bytes].map((x) => x.charCodeAt(0) & 255), 0);
            yield* vm.callRef(c.cb, [topic, payload, bytes.length]);
          }
        }
        return 1;
      }),
      publish: M(['bool (cstr, cstr)', 'bool (cstr, cstr, bool)', 'bool (cstr, any, unsigned int)', 'bool (cstr, any, unsigned int, bool)'], [
        (vm, c, topic, payload) => pub(vm, c, topic, payload, 0),
        (vm, c, topic, payload, ret) => pub(vm, c, topic, payload, ret),
        (vm, c, topic, a, n) => pub(vm, c, topic, cstr(a.v).slice(0, n), 0),
        (vm, c, topic, a, n, ret) => pub(vm, c, topic, cstr(a.v).slice(0, n), ret),
      ]),
      subscribe: M(['bool (cstr)', 'bool (cstr, uint8_t)'], (vm, c, topic) => {
        if (c.state !== 0) return 0;
        const b = broker(vm);
        b.subs.add(topic);
        b.dev?.subscribe?.(topic);
        vm.emit('mqtt', { subscribed: topic });
        return 1;
      }),
      unsubscribe: M('bool (cstr)', (vm, c, topic) => { broker(vm).subs.delete(topic); broker(vm).dev?.unsubscribe?.(topic); return 1; }),
    },
  }, H('PubSubClient.h'));
  function pub(vm, c, topic, payload, retained) {
    if (c.state !== 0) return 0;
    vm.us += 500;
    const b = broker(vm);
    b.dev?.publish?.(topic, payload, !!retained);
    vm.emit('mqtt', { published: { topic, payload } });
    // a real broker sends our own message back if we are subscribed to it
    if (!b.dev && [...b.subs].some((f) => topicMatch(f, topic))) b.queue.push({ topic, payload });
    return 1;
  }

  // ================================================================ BluetoothSerial
  R.header('BluetoothSerial.h', { boards: ESP32, alt: 'BluetoothSerial needs a classic ESP32 (not an S2, S3 or C3, and not an Uno).' });
  const bt = (vm) => vm.lib('bt', () => ({ rx: '', name: '', begun: false }));
  const btFill = (vm) => {
    const b = bt(vm);
    const got = vm.devices.bluetooth?.read?.();
    if (got) b.rx += String(got);
    return b;
  };
  R.cls({
    name: 'BluetoothSerial',
    construct: () => ({}),
    toBool: () => true,
    methods: {
      ...printMethods((vm, s, bytes) => { if (!bt(vm).begun) return; vm.us += bytes.length * 10; vm.devices.bluetooth?.write?.(bytes); vm.emit('bluetooth', { sent: bytes }); }),
      ...streamMethods({
        avail: (vm) => btFill(vm).rx.length,
        readByte: (vm) => { const b = btFill(vm); if (!b.rx.length) return -1; const c = b.rx.charCodeAt(0); b.rx = b.rx.slice(1); return c; },
        peekByte: (vm) => { const b = btFill(vm); return b.rx.length ? b.rx.charCodeAt(0) : -1; },
        timeout: () => 1000,
      }),
      begin: M(['bool ()', 'bool (cstr)', 'bool (cstr, bool)'], (vm, s, name = 'ESP32') => { const b = bt(vm); b.begun = true; b.name = name; vm.devices.bluetooth?.begin?.(name); vm.emit('bluetooth', { begin: name }); return 1; }),
      end: M('void ()', (vm) => { bt(vm).begun = false; }),
      hasClient: M('bool ()', (vm) => +(bt(vm).begun && !!vm.devices.bluetooth?.hasClient?.())),
      connected: M(['bool ()', 'bool (int)'], (vm) => +(bt(vm).begun && !!vm.devices.bluetooth?.hasClient?.())),
      flush: M('void ()', () => {}),
      setPin: M('bool (cstr)', () => 1),
    },
  }, H('BluetoothSerial.h'));
}

/** Wait for a deep-sleep wake source; returns the wake cause. */
function* sleepUntil(vm, timerUs, cfg) {
  const start = vm.us;
  const end = timerUs != null ? start + timerUs : Infinity;
  for (;;) {
    if (vm.us >= end) return 4;
    if (cfg?.ext0 && vm.readRaw(cfg.ext0.pin) === (cfg.ext0.level ? 1 : 0)) return 2;
    if (cfg?.ext1) {
      for (let p = 0; p < 40; p++) if (cfg.ext1.mask / 2 ** p % 2 >= 1 && vm.readRaw(p) === (cfg.ext1.mode ? 1 : 0)) return 3;
    }
    if (cfg?.touch && (vm.hal.touchRead?.(4) ?? 72) < 30) return 5;
    if (timerUs == null && !cfg?.ext0 && !cfg?.ext1 && !cfg?.touch && vm.us - start > 3600e6) return 0;
    yield* vm.sleep(Math.min(10000, end - vm.us));
  }
}

function* deepSleep(vm, timerUs, cfg) {
  vm.emit('sleep', { mode: 'deep', us: timerUs });
  for (const [pin] of vm.toneOn ?? []) vm.hal.noTone?.(pin);
  const cause = yield* sleepUntil(vm, timerUs, cfg);
  // the chip reboots: everything except RTC_DATA_ATTR variables is lost
  throw new Reset('deepsleep', cause);
}
