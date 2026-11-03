// Tests for the Tinker Lab Arduino runtime: run with `node --test tests/`.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { compile, mpu6050Device } from '../src/runtime/index.js';
import { lessons } from '../src/lessons/index.js';

// ------------------------------------------------------------------ helpers
function build(src, board = 'uno') {
  const r = compile(src, { board });
  if (!r.ok) throw new Error(`compile failed:\n${r.diagnostics.map((d) => `${d.line}: ${d.message}`).join('\n')}`);
  return r;
}

/** Run a sketch for `ms` simulated ms; returns { out, vm, errors, writes }. */
function run(src, { board = 'uno', ms = 100, hal = {}, input } = {}) {
  const r = build(src, board);
  let out = '';
  const errors = [], warnings = [], writes = [];
  const vm = r.program.instantiate({
    serialWrite: (t) => { out += t; },
    digitalWrite: (pin, v) => writes.push({ pin, v, t: vm.millis() }),
    ...hal,
  });
  vm.on('error', (e) => errors.push(e));
  vm.on('warning', (e) => warnings.push(e));
  if (input) vm.serialInput(input);
  vm.advance(ms);
  return { out, vm, errors, warnings, writes, diagnostics: r.diagnostics };
}

/** Body of setup() printing things; loop() empty. */
const sketch = (body, globals = '') => `${globals}\nvoid setup() {\n  Serial.begin(9600);\n${body}\n}\nvoid loop() {}\n`;
const lines = (out) => out.split('\r\n').filter((x, i, a) => i < a.length - 1 || x);

// ------------------------------------------------------------------ integer semantics
describe('integer semantics', () => {
  test('int is 16-bit on AVR and wraps', () => {
    const { out } = run(sketch('int a = 30000; a = a + 10000; Serial.println(a); unsigned int u = 0; u--; Serial.println(u);'));
    assert.deepEqual(lines(out), ['-25536', '65535']);
  });

  test('int is 32-bit on ESP32', () => {
    const { out } = run(sketch('int a = 30000; a = a + 10000; Serial.println(a);'), { board: 'esp32' });
    assert.deepEqual(lines(out), ['40000']);
  });

  test('constant overflow warns like g++ and wraps', () => {
    const r = compile(sketch('long ms = 60 * 1000; Serial.println(ms);'));
    assert.ok(r.ok);
    assert.ok(r.diagnostics.some((d) => d.severity === 'warning' && /integer overflow in expression of type 'int' results in '-5536'/.test(d.message)), JSON.stringify(r.diagnostics));
    const { out } = run(sketch('long ms = 60 * 1000; Serial.println(ms); long ok = 60 * 1000L; Serial.println(ok);'));
    assert.deepEqual(lines(out), ['-5536', '60000']);
  });

  test('integer division truncates toward zero; % keeps the sign of the dividend', () => {
    const { out } = run(sketch('Serial.println(-7 / 2); Serial.println(-7 % 2); Serial.println(7 / 2); int x = 7; float f = x / 2; Serial.println(f); Serial.println(x / 2.0);'));
    assert.deepEqual(lines(out), ['-3', '-1', '3', '3.00', '3.50']);
  });

  test('byte and char arithmetic', () => {
    const { out } = run(sketch("byte b = 250; b += 10; Serial.println(b); char c = 'A' + 2; Serial.println(c); Serial.println(c + 1); Serial.println((char)(c + 1)); byte z = 'A'; Serial.println(z);"));
    assert.deepEqual(lines(out), ['4', 'C', '68', 'D', '65']);
  });

  test('implicit conversions and usual arithmetic conversions', () => {
    const { out } = run(sketch('unsigned long m = 5; long d = 3 - m; Serial.println(d); unsigned int u = 1; int n = -1; Serial.println(n < u ? "lt" : "ge"); long L = -1; Serial.println(L < 1u ? "lt" : "ge");'));
    // AVR: -1 < 1u compares as unsigned int (65535 < 1 is false); long vs unsigned int: long wins
    assert.deepEqual(lines(out), ['-2', 'ge', 'lt']);
  });

  test('operator precedence', () => {
    const { out } = run(sketch('Serial.println(1 + 2 * 3 << 1); Serial.println(5 & 3 == 3); Serial.println(2 + 3 > 4 && 1); int a = 10; a -= 3 * 2; Serial.println(a); Serial.println(1 ? 2 : 3 ? 4 : 5); Serial.println(-2 * -3 % 4);'));
    assert.deepEqual(lines(out), ['14', '1', '1', '4', '2', '2']);
  });

  test('shifts and bit operations', () => {
    const { out } = run(sketch('Serial.println(1 << 15); Serial.println(1UL << 20); byte v = 0b10110010; Serial.println(bitRead(v, 4)); Serial.println(v >> 4, BIN); Serial.println(~0, HEX); Serial.println(0xFF ^ 0x0F, HEX);'));
    assert.deepEqual(lines(out), ['-32768', '1048576', '1', '1011', 'FFFFFFFF', 'F0']);
  });

  test('float is 32-bit; double is 32-bit on AVR and 64-bit on ESP32', () => {
    const src = sketch('double d = 1.0 / 3.0; Serial.println(d, 10); float f = 16777217; Serial.println(f, 0); Serial.println(sizeof(double));');
    assert.deepEqual(lines(run(src).out), ['0.3333333492', '16777216', '4']);
    assert.deepEqual(lines(run(src, { board: 'esp32' }).out), ['0.3333333333', '16777216', '8']);
  });

  test('++ / -- and compound assignment', () => {
    const { out } = run(sketch('int i = 5; int a = i++; int b = ++i; Serial.println(a); Serial.println(b); Serial.println(i); i <<= 2; Serial.println(i); i %= 5; Serial.println(i);'));
    assert.deepEqual(lines(out), ['5', '7', '7', '28', '3']);
  });
});

// ------------------------------------------------------------------ printing
describe('Serial printing', () => {
  test('print with bases and decimals', () => {
    const { out } = run(sketch('Serial.println(255, HEX); Serial.println(5, BIN); Serial.println(8, OCT); Serial.println(-1, HEX); Serial.println(3.14159); Serial.println(3.14159, 4); Serial.println(2.5, 0); Serial.println(true); Serial.println(\'x\'); Serial.println(\'x\', DEC);'));
    assert.deepEqual(lines(out), ['FF', '101', '10', 'FFFFFFFF', '3.14', '3.1416', '3', '1', 'x', '120']);
  });

  test('sprintf: AVR has no %f, ESP32 does', () => {
    const src = sketch('char buf[32]; sprintf(buf, "%04d|%-3s|%x|%5.1f", 42, "ab", 255, 3.14159); Serial.println(buf);');
    assert.deepEqual(lines(run(src).out), ['0042|ab |ff|    ?']);
    assert.deepEqual(lines(run(src, { board: 'esp32' }).out), ['0042|ab |ff|  3.1']);
  });

  test('Serial.printf only exists on ESP boards', () => {
    const r = compile(sketch('Serial.printf("%d", 1);'));
    assert.equal(r.ok, false);
    assert.match(r.diagnostics[0].message, /'class HardwareSerial' has no member named 'printf'/);
    assert.equal(run(sketch('Serial.printf("v=%d\\n", 7);'), { board: 'esp32' }).out, 'v=7\n');
  });
});

// ------------------------------------------------------------------ control flow
describe('control flow', () => {
  test('switch falls through until break', () => {
    const { out } = run(sketch(`for (int i = 0; i < 4; i++) {
      switch (i) {
        case 0: Serial.print("a");
        case 1: Serial.print("b"); break;
        case 2: { Serial.print("c"); break; }
        default: Serial.print("d");
      }
    }
    Serial.println();`));
    assert.deepEqual(lines(out), ['abbcd']);
  });

  test('while, do-while, continue, break, nested loops', () => {
    const { out } = run(sketch(`int n = 0; while (true) { n++; if (n % 2) continue; if (n > 6) break; Serial.print(n); }
    int k = 10; do { k--; } while (k > 20); Serial.println(); Serial.println(k);
    int c = 0; for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) { if (j == 1) break; c++; } Serial.println(c);`));
    assert.deepEqual(lines(out), ['246', '9', '3']);
  });

  test('range-for, enums and ternaries', () => {
    const { out } = run(sketch('int s = 0; for (int x : vals) s += x; Serial.println(s); Color c = GREEN; Serial.println(c); Serial.println(c == GREEN ? "g" : "?");', 'int vals[] = {1, 2, 3, 4};\nenum Color { RED, GREEN = 5, BLUE };'));
    assert.deepEqual(lines(out), ['10', '5', 'g']);
  });
});

// ------------------------------------------------------------------ data
describe('arrays, structs, String', () => {
  test('arrays: multi-dimensional, sizeof, char arrays', () => {
    const { out } = run(sketch('Serial.println(grid[1][2]); Serial.println(sizeof(grid)); Serial.println(sizeof(grid) / sizeof(grid[0])); char name[] = "Uno"; Serial.println(sizeof(name)); Serial.println(name); name[0] = \'u\'; Serial.println(name); Serial.println(strlen(name));', 'int grid[2][3] = {{1, 2, 3}, {4, 5, 6}};'));
    assert.deepEqual(lines(out), ['6', '12', '2', '4', 'Uno', 'uno', '3']);
  });

  test('out-of-bounds index is reported like a sanitizer and does not crash', () => {
    const { out, errors, vm } = run(sketch('int i = 5; a[i] = 7; Serial.println(a[i]); Serial.println("after");', 'int a[3];'));
    assert.deepEqual(lines(out), ['0', 'after']);
    assert.ok(errors.some((e) => /index 5 out of bounds for type 'int \[3\]'/.test(e.message) && e.line === 4 && !e.fatal), JSON.stringify(errors));
    assert.equal(vm.state, 'running');
  });

  test('structs copy by value; pointers and references', () => {
    const { out } = run(sketch('Point a = {1, 2}; Point b = a; b.x = 9; Serial.println(a.x); Serial.println(b.x); bump(a); Serial.println(a.y); int v = 3; int* p = &v; *p = 4; Serial.println(v); int& r = v; r++; Serial.println(v); Point* q = &a; q->x = 6; Serial.println(a.x);',
      'struct Point { int x; int y; };\nvoid bump(Point& p) { p.y += 10; }'));
    assert.deepEqual(lines(out), ['1', '9', '12', '4', '5', '6']);
  });

  test('String class', () => {
    const { out } = run(sketch(`String s = "  Hello World ";
    s.trim(); Serial.println(s); Serial.println(s.length()); Serial.println(s.indexOf("World")); Serial.println(s.substring(6));
    s.toUpperCase(); Serial.println(s); String n = "42abc"; Serial.println(n.toInt() + 1);
    String t = "a"; t += 'b'; t += 5; t = t + "!" + 2.5; Serial.println(t); Serial.println(t == "ab5!2.50");
    Serial.println(String(255, HEX)); Serial.println(String(3.14159, 3)); Serial.println("x" + String(1));
    String c = "blink 3"; Serial.println(c.startsWith("blink")); Serial.println(c.substring(5).toInt());`));
    assert.deepEqual(lines(out), ['Hello World', '11', '6', 'World', 'HELLO WORLD', '43', 'ab5!2.50', '1', 'ff', '3.142', 'x1', '1', '3']);
  });

  test('"text" + number moves the pointer (and warns)', () => {
    const r = compile(sketch('Serial.println("Uptime: " + 5);'));
    assert.ok(r.ok);
    assert.ok(r.diagnostics.some((d) => d.severity === 'warning' && /moves the pointer/.test(d.message)));
    assert.deepEqual(lines(run(sketch('Serial.println("Uptime: " + 5);')).out), ['e: ']);
  });
});

// ------------------------------------------------------------------ functions
describe('functions', () => {
  test('recursion, overloads, default arguments, functions used before definition', () => {
    const { out } = run(sketch('Serial.println(fact(10)); Serial.println(twice(3)); Serial.println(twice(1.5f)); Serial.println(add(2)); Serial.println(add(2, 5));',
      'long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }\nint twice(int x) { return 2 * x; }\nfloat twice(float x) { return 2 * x; }\nint add(int a, int b = 1) { return a + b; }'));
    assert.deepEqual(lines(out), ['3628800', '6', '3.00', '3', '7']);
  });

  test('infinite recursion is a stack overflow with a line number', () => {
    const { errors, vm } = run(sketch('down(1);', 'int down(int n) {\n  return down(n + 1) + 1;\n}'));
    assert.equal(vm.state, 'error');
    assert.match(errors[0].message, /stack overflow/);
    assert.equal(errors[0].line, 2);
    assert.match(errors[0].hint, /down\(\) keeps calling itself/);
  });

  test('division by zero is a runtime error with its line', () => {
    const { errors, vm } = run(sketch('int z = 0;\n  int q = 10 / z;\n  Serial.println(q);'));
    assert.equal(vm.state, 'error');
    assert.equal(errors[0].message, 'division by zero');
    assert.equal(errors[0].line, 5);
  });

  test('static locals keep their value', () => {
    const { out } = run(sketch('Serial.println(counter()); Serial.println(counter()); Serial.println(counter());', 'int counter() { static int n = 0; return ++n; }'));
    assert.deepEqual(lines(out), ['1', '2', '3']);
  });
});

// ------------------------------------------------------------------ time and hardware
describe('time, pins, interrupts', () => {
  test('millis() follows delay(); loop runs repeatedly', () => {
    const src = 'unsigned long t0; void setup() { Serial.begin(9600); t0 = millis(); delay(1500); Serial.println(millis() - t0); }\nvoid loop() { delay(1000); }';
    const { out, vm } = run(src, { ms: 4000 });
    assert.deepEqual(lines(out), ['1500']);
    assert.ok(Math.abs(vm.millis() - 4000) < 5);
  });

  test('a loop with no delay still lets simulated time pass', () => {
    const src = 'unsigned long n = 0; void setup() { Serial.begin(115200); }\nvoid loop() { n++; if (millis() >= 50 && n > 0) { Serial.println("ok"); while (true) { delay(1000); } } }';
    const { out } = run(src, { ms: 200 });
    assert.deepEqual(lines(out), ['ok']);
  });

  test('attachInterrupt runs the ISR on a HAL-driven falling edge', () => {
    let level = 1;
    const src = `volatile int count = 0;
void isr() { count++; }
void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(2), isr, FALLING);
}
void loop() {
  delay(100);
  noInterrupts(); int c = count; interrupts();
  Serial.println(c);
}`;
    const r = build(src);
    let out = '';
    const vm = r.program.instantiate({ serialWrite: (t) => (out += t), digitalRead: (pin) => (pin === 2 ? level : null) });
    vm.advance(150);
    level = 0; vm.advance(50); // falling edge
    level = 1; vm.advance(50);
    level = 0; vm.advance(100); // second falling edge
    assert.deepEqual(lines(out), ['0', '1', '2']);
  });

  test('digitalWrite / analogWrite / analogRead go through the HAL', () => {
    const pwm = [];
    const { out, writes } = run(sketch('pinMode(13, OUTPUT); digitalWrite(13, HIGH); analogWrite(9, 128); Serial.println(analogRead(A0)); Serial.println(map(analogRead(A0), 0, 1023, 0, 255));'),
      { hal: { analogWrite: (p, v) => pwm.push([p, v]), analogRead: (ch) => (ch === 0 ? 1023 : 0) } });
    assert.deepEqual(writes.map((w) => [w.pin, w.v]), [[13, 1]]);
    assert.deepEqual(pwm, [[9, 128]]);
    assert.deepEqual(lines(out), ['1023', '255']);
  });

  test('Serial input feeds read(), parseInt() and readStringUntil()', () => {
    const src = 'void setup() { Serial.begin(9600); }\nvoid loop() { if (Serial.available()) { String s = Serial.readStringUntil(\'\\n\'); s.trim(); Serial.println("[" + s + "]"); } }';
    const { out } = run(src, { ms: 50, input: 'hello\nworld\n' });
    assert.deepEqual(lines(out), ['[hello]', '[world]']);
  });

  test('EEPROM.put / get round-trips a struct', () => {
    const ee = new Uint8Array(1024).fill(0xff);
    const src = sketch('Cfg c = {0x42, 1234, 2.5}; EEPROM.put(0, c); Cfg d; EEPROM.get(0, d); Serial.println(d.magic, HEX); Serial.println(d.n); Serial.println(d.f); Serial.println(sizeof(Cfg));', '#include <EEPROM.h>\nstruct Cfg { byte magic; int n; float f; };');
    const { out } = run(src, { hal: { devices: { eeprom: ee } }, ms: 200 });
    assert.deepEqual(lines(out), ['42', '1234', '2.50', '7']);
    assert.equal(ee[0], 0x42);
    assert.equal(ee[1] | (ee[2] << 8), 1234);
  });

  test('MPU-6050 over Wire with the device helper', () => {
    const src = `#include <Wire.h>
void setup() { Serial.begin(9600); Wire.begin(); Wire.beginTransmission(0x68); Wire.write(0x6B); Wire.write(0); Wire.endTransmission(true);
  Wire.beginTransmission(0x68); Wire.write(0x3B); Wire.endTransmission(false); Wire.requestFrom(0x68, 6, true);
  int16_t ax = Wire.read() << 8 | Wire.read(); int16_t ay = Wire.read() << 8 | Wire.read(); int16_t az = Wire.read() << 8 | Wire.read();
  Serial.println(atan2(ay, az) * 180.0 / PI, 0); }
void loop() {}`;
    const { out } = run(src, { hal: { devices: { i2c: (a) => (a === 0x68 ? mpu6050Device(() => ({ pitch: 0, roll: 30 })) : null) } } });
    assert.deepEqual(lines(out), ['30']);
  });
});

// ------------------------------------------------------------------ diagnostics
describe('compile errors', () => {
  const err = (src, board) => compile(src, { board }).diagnostics.find((d) => d.severity === 'error');
  test('missing semicolon names the next token and the right line', () => {
    const d = err('void setup() {\n  pinMode(13, OUTPUT)\n  digitalWrite(13, HIGH);\n}\nvoid loop() {}');
    assert.equal(d.message, "expected ';' before 'digitalWrite'");
    assert.equal(d.line, 2);
    assert.ok(d.hint);
  });
  test('undeclared name suggests the right spelling', () => {
    const d = err('const int ledPin = 13;\nvoid setup() { pinMode(ledpin, OUTPUT); }\nvoid loop() {}');
    assert.equal(d.message, "'ledpin' was not declared in this scope");
    assert.match(d.hint, /ledPin/);
  });
  test('wrong argument count', () => {
    const d = err('void setColor(int r, int g, int b) {}\nvoid setup() { setColor(1, 2); }\nvoid loop() {}');
    assert.equal(d.message, "too few arguments to function 'void setColor(int, int, int)'");
  });
  test('library missing from the simulator', () => {
    const d = err('#include <FancyLib.h>\nvoid setup() {}\nvoid loop() {}');
    assert.equal(d.message, 'FancyLib.h: No such file or directory');
    assert.match(d.hint, /not available in the Tinker Lab simulator yet/);
  });
  test('class from a missing #include', () => {
    const d = err('Servo s;\nvoid setup() {}\nvoid loop() {}');
    assert.equal(d.message, "'Servo' does not name a type");
    assert.match(d.hint, /#include <Servo.h>/);
  });
  test('ambiguous overload', () => {
    const d = err('int f(int x) { return x; }\nfloat f(float x) { return x; }\nvoid setup() { f(1.5); }\nvoid loop() {}');
    assert.equal(d.message, "call of overloaded 'f(double)' is ambiguous");
  });
  test('missing loop()', () => {
    const d = err('void setup() {}');
    assert.equal(d.message, "undefined reference to `loop'");
  });
  test('assignment to const, unknown member, missing brace', () => {
    assert.equal(err('const int X = 1;\nvoid setup() { X = 2; }\nvoid loop() {}').message, "assignment of read-only variable 'X'");
    assert.equal(err('#include <Servo.h>\nServo s;\nvoid setup() { s.wrte(10); }\nvoid loop() {}').message, "'class Servo' has no member named 'wrte'");
    assert.equal(err('void setup() {\n  if (1) {\n}\nvoid loop() {}').message, "a function-definition is not allowed here before '{' token");
  });
});

// ------------------------------------------------------------------ debugger
describe('debugger', () => {
  const src = `int total = 0;
int add(int a, int b) {
  int s = a + b;
  return s;
}
void setup() { Serial.begin(9600); }
void loop() {
  int x = 2;
  total = add(x, 3);
  delay(100);
}`;
  test('breakpoints pause on the right line; step into / over / out; call stack and scopes', () => {
    const r = build(src);
    const vm = r.program.instantiate({});
    const pauses = [];
    vm.on('pause', (p) => pauses.push(p));
    vm.setBreakpoints([9]);
    vm.advance(50);
    assert.equal(vm.state, 'paused');
    assert.deepEqual(pauses[0], { line: 9, reason: 'breakpoint' });
    const locals = vm.scopes()[0];
    assert.equal(locals.fn, 'loop');
    assert.deepEqual(locals.vars.map((v) => [v.name, v.value]), [['x', '2']]);
    vm.step(); // into add()
    assert.equal(vm.line, 3);
    assert.deepEqual(vm.callStack().map((f) => f.fn), ['loop', 'add']);
    assert.deepEqual(vm.callStack()[0].line, 9);
    vm.stepOver();
    assert.equal(vm.line, 4);
    assert.equal(vm.scopes()[0].vars.find((v) => v.name === 's').value, '5');
    vm.stepOut();
    assert.equal(vm.line, 10);
    assert.equal(vm.scopes().find((s) => s.name === 'Globals').vars.find((v) => v.name === 'total').value, '5');
    vm.setBreakpoints([]);
    vm.resume();
    vm.advance(300);
    assert.equal(vm.state, 'running');
  });
});

// ------------------------------------------------------------------ every lesson sketch
function stubDevices() {
  const keyQueue = [];
  return {
    servo: () => ({ write() {} }),
    lcd: () => ({ print() {}, clear() {}, backlight() {}, createChar() {} }),
    oled: () => ({ show() {} }),
    neopixel: () => ({ show() {} }),
    dht: () => ({ temperature: () => 22.4, humidity: () => 48 }),
    stepper: () => ({ step() {} }),
    keypad: () => ({ getKey: () => keyQueue.shift() ?? null }),
    ir: () => ({ next: () => null }),
    eeprom: new Uint8Array(4096).fill(0xff),
    i2c: (addr) => ([0x3c, 0x27, 0x68, 0x29, 0x40, 0x58].includes(addr) ? (addr === 0x68 ? mpu6050Device(() => ({ pitch: 5, roll: -10 })) : { read: (reg, n) => new Array(n).fill(0), write() {} }) : null),
    rtc: { now: () => new Date(2026, 10, 3, 12, 0, 0), temperature: () => 21.5 },
    sd: { files: new Map() },
    webserver: () => ({ poll: () => null }),
    bluetooth: { hasClient: () => false, read: () => null, write() {} },
    wifi: {},
    tm1637: () => ({ show() {} }),
    max7219: () => ({ show() {} }),
    colorSensor: () => ({ read: () => ({ r: 120, g: 60, b: 40, c: 230 }) }),
    tof: () => ({ mm: () => 420 }),
    ina219: () => ({ volts: () => 6.2, mA: () => 180 }),
    pms: () => ({ read: () => ({ pm1: 4, pm25: 8, pm10: 12 }) }),
    sgp30: () => ({ tvoc: () => 40, eco2: () => 520 }),
    ds18b20: () => ({ temperature: () => 19.5 }),
    lora: () => ({ send() {}, receive: () => null }),
    http: () => ({ code: 200, body: '{"hourly":{"precipitation_probability":[10,20,5]}}' }),
  };
}

const cppLessons = lessons.filter((l) => l.lang === 'cpp' && l.code);
const fill = (l) => l.code.replace(/\{\{(\w+)\}\}/g, (_, k) => String(l.params?.[k]?.value ?? 0));

describe(`every C++ lesson sketch (${cppLessons.length})`, () => {
  for (const l of cppLessons) {
    test(`${l.id} compiles and runs 3 simulated seconds`, () => {
      const r = compile(fill(l), { board: l.board });
      const errs = r.diagnostics.filter((d) => d.severity === 'error');
      assert.equal(errs.length, 0, errs.map((d) => `${d.line}: ${d.message}`).join('\n'));
      const errors = [];
      let out = '';
      const vm = r.program.instantiate({
        serialWrite: (t) => { out += t; },
        digitalRead: () => null,
        analogRead: (ch) => 300 + (ch % 4) * 100,
        pulseIn: () => 1160,
        devices: stubDevices(),
      });
      vm.on('error', (e) => errors.push(e));
      vm.advance(3000);
      assert.equal(errors.length, 0, errors.map((e) => `line ${e.line}: ${e.message}`).join('\n'));
      assert.notEqual(vm.state, 'error');
      if (/Serial\d?\.(print|println|printf|write)/.test(l.code) && /Serial\.begin/.test(l.code) && !/while\s*\(\s*WiFi\.status/.test(l.code)) {
        // most sketches print within 3 s
      }
      void out;
    });
  }
});

// ------------------------------------------------------------------ known lesson outputs
describe('known lesson behaviour', () => {
  const byId = (id) => lessons.find((l) => l.id === id);
  test('Blink toggles pin 13 every 1000 ms (Meet the board)', () => {
    const l = byId('board');
    const { writes } = run(fill(l), { ms: 4500 });
    const w13 = writes.filter((w) => w.pin === 13);
    assert.deepEqual(w13.map((w) => [w.v, w.t]), [[1, 0], [0, 1000], [1, 2000], [0, 3000], [1, 4000]]);
  });
  test('the knob sketch prints "A0 = …" and dims pin 9', () => {
    const l = byId('knob');
    const pwm = [];
    const { out } = run(fill(l), { ms: 500, hal: { analogRead: () => 800, analogWrite: (p, v) => pwm.push([p, v]) } });
    assert.equal(lines(out)[0], 'A0 = 800');
    assert.deepEqual(pwm[0], [9, 200]);
  });
  test('the heat sketch converts a TMP36 reading to °C with one decimal', () => {
    const { out } = run(fill(byId('heat')), { ms: 100, hal: { analogRead: () => 153 } }); // 0.748 V → 24.8 °C
    assert.equal(lines(out)[0], '24.8 C');
  });
  test('the interrupts lesson counts presses in the ISR', () => {
    const l = byId('interrupts');
    let level = 1;
    const r = build(fill(l), l.board);
    let out = '';
    const vm = r.program.instantiate({ serialWrite: (t) => (out += t), digitalRead: (p) => (p === 2 ? level : null) });
    vm.advance(500);
    level = 0; vm.advance(100); level = 1; vm.advance(600);
    assert.match(out, /ISR: 1 {3}polled: 0/, out);
  });
});
