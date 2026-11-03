# Writing a Tinker Lab lesson

A lesson is a plain JS object in a track file under `src/lessons/`. Track files
export an array of lessons (and optionally `parts`, extra glossary entries).
`src/lessons/index.js` registers tracks. Study `src/lessons/foundations.js`
first: it is the reference for tone, depth and code style.

## Lesson object

```js
{
  id: 'esp32-webserver',            // globally unique, kebab-case, used in the URL (#id)
  title: 'Serve a web page',        // short, imperative, ≤ 24 chars ideally
  icon: 'globe',                    // name from src/ui/icons.js
  level: 'Intermediate',            // optional; defaults to the track's level
  board: 'esp32',                   // optional; defaults to the track board: uno|mega|nano|esp32|pico|jetson
  lang: 'cpp',                      // 'cpp' (Arduino C++) or 'python' (MicroPython / Python 3)
  thumb: () => Object3D,            // a fresh 3D object for the lesson card thumbnail (one key part)
  view: { center: [x, y, z], size: 15, az: 0 },  // camera framing: world centre + approx width in cm to fit
  build(ctx) { ... return built },  // builds the circuit (see ctx below); returns state used by setup/loop
  callouts: [ { anchor, x, y, icon, title, text } ],  // 3–6 labels around the stage
  overview: { heading, text /* html */, features: [[icon, html], [icon, html], [icon, html]] },
  pinout: [[pin, connectsTo, note], ...],             // the Wiring tab
  example: { text /* html */, points: [html, ...] },  // real-world uses + "try this"
  specs: [[label, value /* html ok */], ...],         // 4–8 rows
  quiz: [ { q, options: [4 strings], answer: index, explain }, ... ],  // exactly 3 or 4 questions
  challenges: [warmUp, levelUp, stretch],             // exactly 3 exercises, increasing difficulty
  code: `...`,                      // the REAL program (compiles on real hardware); {{name}} = editable number
  params: { name: { value, min, max } },  // one entry per {{name}} token
  async setup(io, built, params) {},      // simulate setup()
  async loop(io, built, params) {},       // simulate one pass of loop() (called forever)
  reset(built, io) {},                    // put visuals back to idle when stopped
  serialInput: { placeholder: 'on / off' }, // optional: show a "send" box under the serial monitor
}
```

### Callout positions
`x, y` are fractions of the stage (card top-left). Use these six slots and keep
3–6 callouts: top-left `[0.04, 0.17]`, top-centre `[0.36, 0.12]`,
top-right `[0.70, 0.17]`, bottom-left `[0.04, 0.68]`, bottom-centre `[0.36, 0.72]`,
bottom-right `[0.70, 0.68]`. If the lesson opens a panel (camera, browser,
plotter) it docks bottom-right, so leave that slot empty. `anchor` is a key
from `ctx.anchor(...)` or from the board's `anchors`.

## `ctx` (passed to build)

| Call | Does |
| --- | --- |
| `ctx.board` | The lesson's board, already in the scene at the origin. `ctx.board.pin('D13')` → world `Vector3` of that socket/pin. `ctx.board.anchors` has named points. |
| `ctx.breadboard(x, z)` | Adds a half-size breadboard; returns `bb` with `bb.hole(col 1–30, row 'a'–'j' or 'top-'/'top+'/'bot-'/'bot+')`. Standard spot next to an Uno: `BB = [9.4, -0.6]` from helpers. Rows a–e are on the back (−z, towards the board's digital header) side, f–j on the front. Each 5-hole column (a–e, f–j) is connected. |
| `ctx.add(part)` | Adds a component (anything with `.group`); auto-registers `part.tick(dt)`. Returns the part. |
| `ctx.addObject(obj3d)` | Adds a raw `Object3D`. |
| `ctx.wire(a, b, color, opts)` | Jumper wire between two world points. Colours: red, black, orange, yellow, green, blue, white, brown, purple. `opts.signal` = label key (e.g. `'D9'`, `'GND'`, `'5V'`) used by `io.pin()` and the live chips; `opts.dir: -1` if current flows b→a (GND returns); `opts.lift` arc height; `opts.bend` Vector3 offset of the arc peak. Returns `{ mid, curve, live, ... }`. |
| `ctx.interact(part, spec)` | Makes a part clickable. `spec = { name, hint, controls?, hold?, onClick?, note? }`. `hold: { down(), up() }` for press-and-hold (buttons). `controls`: `{type:'range', label, min, max, step, get, set, format?}`, `{type:'choice', label, options:[[value,label]], get, set}`, `{type:'toggle', label, get, set}`, `{type:'button', label, press}` or `{type:'button', label, hold:true, down, up}`, `{type:'keys', label, keys:['1','2',...], down(key), up()}`. `note()` returns a live status string. |
| `ctx.anchor(name, Vector3)` | Named point for callouts. Use `part.anchor`, `wire.mid`. |
| `ctx.onTick(fn(dt))` | Per-frame callback (animation, auto-moving objects). |
| `ctx.setDarkness(0–1)` | Dims the stage (light-sensor lessons). |
| `ctx.camera({ position, target, fov, title, sub })` | Camera-feed panel rendered from a virtual camera. Returns `{ project(v3), boxOf(obj3d), draw(fn(ctx2d, w, h)), clear(), label(ctx2d, box, text, color) }` — use `draw` + `boxOf` + `label` to draw detection boxes that follow 3D objects. |
| `ctx.browser({ url, title, render: () => html, onAction(action, value, el) })` | Phone-browser panel for IoT lessons. Elements with `data-action` (and optional `data-value`) are clickable; inputs with `data-action` fire on input. Returns `{ update(), setUrl() }`. Useful classes: `h5`, `.big`, `.row`, `button.on/.off`, `.muted`. |
| `ctx.plotter({ title, series: [{ name, color, min, max }] })` | Serial-plotter panel. Returns `{ push(...values), reset() }`. |
| `ctx.THREE` | The three.js namespace. |

## `io` (passed to setup/loop)

| Call | Does |
| --- | --- |
| `io.line(text, nth = 1)` | Highlights the nth line of the code containing `text` (match on a unique substring of the line *after* `{{param}}` substitution). Call it before doing what that line does. |
| `await io.delay(ms)` | Waits (cancellable). Every loop must await something; real `delay()` lines should map to `io.delay`. Keep simulated waits ≤ ~3 s. |
| `io.print(text)` | Serial monitor / terminal output line. |
| `io.pin(key, text, live)` | Updates the chip on wires whose `signal === key` (e.g. `io.pin('D13', 'HIGH', true)`) and turns current-flow on/off for them. |
| `io.tone(freq)` / `io.noTone()` | Plays a square wave when sound is enabled. |
| `io.board` | The board (e.g. `io.board.setBuiltinLed(1)`). |
| `io.readLine()` / `io.available()` | Lines the learner typed into the serial monitor (needs `serialInput` on the lesson). `readLine()` returns the next line or `null` — never blocks; poll it in `loop`. |

The simulation is JavaScript that mirrors the real program step by step; it
must **not** claim to execute the C++/Python. Keep simulated behaviour
truthful (correct maths, units and ranges).

## Quality bar
- Code must be correct, idiomatic and compile/run on the real board with the
  wiring shown. Use widely available libraries only (Servo, Wire,
  Adafruit_SSD1306/GFX, LiquidCrystal_I2C, Adafruit_NeoPixel, DHT, Stepper,
  IRremote, Keypad, WiFi/WebServer (ESP32 core), PubSubClient, BluetoothSerial,
  machine/utime (MicroPython), Jetson.GPIO, smbus2, OpenCV, jetson_inference
  / jetson_utils). Mention the library in the specs or features.
- Wiring must be electrically correct (resistors on LEDs, common ground,
  3.3 V logic on ESP32/Pico/Jetson, never drive motors from pins, etc.).
- Text: friendly, precise, British/US neutral, no fluff. Overview ≤ 60 words.
- Every lesson: 3–6 callouts, 3 features, wiring table, real-world example
  with 2–3 points, 4–8 specs, 3–4 quiz questions with explanations, 3
  challenges, runnable simulation with serial output.
- Never use real brand logos; boards are "-style" generic models.

## Testing
Run `npx vite --port <port>` in `tinker-lab/`, then
`node scripts/qa.cjs --url http://localhost:<port> --ids a,b,c --run --out <dir>`
and look at the screenshots. Fix overlapping callouts, parts floating or
intersecting, wires through parts, and any console errors.

## Boards (`ctx.board`, chosen by `lesson.board` / track)
All boards sit at the origin and expose `pin(name)` (world position of the
socket top / male pin tip), `pins`, `anchors`, `setBuiltinLed(level)`.
- **uno** (`src/scene/board.js`): `D0`–`D13`, `A0`–`A5`, `5V`, `3V3`, `GND` (back header), `GND_2`, `GND_3` (front), `VIN`, `AREF`, `IOREF`, `RESET`, `SCL`, `SDA`. Digital header is on the back (−z) edge, power/analog on the front (+z). Board is 6.86 × 5.34 cm. Anchors: usb, jack, chip, digital, power, analog, reset, lLed, d13, gnd.
- **mega** (`boards/mega.js`, 10.16 × 5.33): as Uno plus `D14`–`D53`, `A6`–`A15`; double header D22–D53 at the right (+x) end.
- **nano** (`boards/nano.js`, 4.3 × 1.8, male pins up): `D0`–`D13`, `A0`–`A7`, `5V`, `3V3`, `GND`, `GND_2`, `VIN`, `RESET`, `RESET_2`, `AREF`.
- **esp32** (`boards/esp32.js`, DevKit 30-pin, male pins up, 3.3 V logic): `GPIO2` (blue built-in LED), `GPIO4`, `GPIO5`, `GPIO12`–`GPIO19`, `GPIO21`–`GPIO23`, `GPIO25`–`GPIO27`, `GPIO32`–`GPIO35`, `VP`(36), `VN`(39), `TX0`, `RX0`, `EN`, `3V3`, `VIN` (5 V from USB), `GND`, `GND_2`. Aliases like `GPIO36`, `D2` resolve.
- **pico** (`boards/pico.js`, male pins up, 3.3 V): `GP0`–`GP22`, `GP26`–`GP28` (ADC0–2), `GP25` = on-board LED, `3V3`, `3V3_EN`, `VSYS`, `VBUS`, `RUN`, `ADC_VREF`, `GND`, `GND_2`…`GND_8`.
- **jetson** (`boards/jetson.js`, ~10 × 8 cm, 40-pin header, 3.3 V): `PIN1`–`PIN40` (physical BOARD numbering, Raspberry-Pi layout) + aliases `3V3`, `5V`, `5V_2`, `SDA`(3), `SCL`(5), `GND`(6) … `GND_8`, `TXD`(8), `RXD`(10), `PWM0`(32), `PWM2`(33), `3V3_2`(17). `setFan(0–1)`, `csi` (Vector3 of the camera connector). Same file exports `makeCSICamera(pos, { yaw })` → `{ group, pick, anchor, lensWorld, lookDir, ribbonEnd, ribbonDir, ribbonAxis, ribbonBend }` and `makeRibbon(a, b, width, opts)` → `{ group, curve }`. Connect: `makeRibbon(board.csi, cam.ribbonEnd, 1.6, { dirB: cam.ribbonDir, axisA: board.csiAxis, axisB: cam.ribbonAxis, bendB: cam.ribbonBend })`.
Check `BOARD_INFO` / anchors in `src/scene/boards/index.js` and each board file for exact names.

## Components (`src/scene/components.js`, breadboard-mounted unless noted)
`makeLED(color, anodeHole, cathodeHole)` → `set(0–1)`, `setColor(name)`; `makeRGBLED([R,GND,G,B])` → `set(r,g,b 0–255)`; `makeResistor(a, b, ohms, {height})` → `setValue`; `makeButton([4 holes])` → `press(bool)`, `pressed`; `makePot([3 holes])` → `set(0–1)`; `makeLDR(a,b)`; `makeBuzzer(a,b)` → `set(on, freq)`; `makeTO92([3 holes], label)`; `makeDiode(a,b)`; `makeMotor(pos)` (free-standing) → `set(speed)`, `terminals`; `makeServo(pos)` (free-standing) → `set(deg)`, `leads[gnd,pwr,sig]`; `makeUltrasonic([VCC,TRIG,ECHO,GND])` → `front`; `makeTrafficLight([R,Y,G,GND])` → `set(name, on)`; `makeCar(pos)`; `makeBlock(pos)`; `makePing(origin)` → `fire(dist)`. Helpers in `src/lessons/helpers.js`: `v`, `clamp`, `BB`, `ledOnPin(ctx, bb, {pin, col, color, gnd, ohms})` (resistor + LED + 2 wires, returns `{ led, res, sig, gw, on(level) }`).

## Modules (`src/scene/modules.js`)
Free-standing modules `(pos, opts)` (`opts.rotY` radians) return `{ group, pick, anchor, pins, pin(name) }` with pins pointing UP (wire straight to `m.pin('VCC')`). Breadboard modules `(holes)` return `{ group, pick, anchor }`. Animated ones have `tick(dt)` (auto-registered by `ctx.add`).
- `makeOLED` — GND VCC SCL SDA; `draw(fn(ctx,128,64), {clear})`, `clear()`, `text(lines, {x,y,size,align,lineHeight,clear})` (5×7 pixel font), `bar(x,y,w,h,frac)`, `pixel(x,y,on)`; `opts.yellowTop`.
- `makeLCD1602` — GND VCC SDA SCL (I²C backpack on the left); `print(row, col, text)` or `print(text)`, `setCursor(col,row)`, `clear()`, `backlight(on)`; `opts.variant:'blue'`.
- `makeNeoPixelRing` / `makeNeoPixelStrip(pos, n=8)` — DIN 5V GND; `setPixel(i,r,g,b)`, `fill`, `clear`, `show()`, `count`.
- `makeStepper` — 28BYJ-48 + ULN2003 (driver 4.5 cm to +x): IN1–IN4 VCC GND; `step(dir)` = one half-step (4096/rev), `setAngle`, `angle`, `release()`.
- `makeRelay` — IN VCC GND + terminals NO COM NC (`terminal(name)`); `set(on)`. `makeLamp(pos)` → `set(on)`, `terminal(0|1)`.
- `makePIR` — VCC OUT GND; `trigger(on)`. `makePerson(pos)` (≈5.4 cm figure) → `{group, pick, anchor, head}`.
- `makeDHT11` — VCC DATA GND.
- `makeJoystick` — GND +5V VRX VRY SW; `set(x,y)` −1..1, `press(on)`.
- `makeIRReceiver` — OUT GND VCC; `flash()`, `front`. `makeRemote(pos)` → `keys`, `tip`, `flash(dur)`.
- `makeKeypad` — R1–R4 C1–C4; `press(key)`, `release()`, `keyPos(key)`.
- `makeMPU6050` — VCC GND SCL SDA XDA XCL AD0 INT; `setTilt(pitchDeg, rollDeg)` (on a small stand).
- `makeSoilSensor` — GND VCC AOUT (pins ~10 cm up, probe in a pot with a plant); `setMoisture(0–1)`.
- `makeSoundSensor` — AO GND + DO; `hear(on)`, `setDetect(on)`. `makeGasSensor` — VCC GND DO AO; `setDetect(on)`. `makeFlameSensor` — VCC GND DO AO; `setDetect(on)`, `front`.
- `makeRotaryEncoder` — CLK DT SW + GND; `setAngle(deg)`, `press(on)`.
- `makeRTC` — GND VCC SDA SCL. `makeSDCard` — GND VCC MISO MOSI SCK CS. `makeHC05` — STATE RXD TXD GND VCC EN; `setLinked(on)`.
- `makeL298N` — ENA IN1 IN2 IN3 IN4 ENB + screw terminals 12V GND 5V OUT1–OUT4; `setPower(on)`, `opts.jumpers`.
- `makeFSR` — P1 P2; `press(0–1)`.
- `makeRobotCar(pos)` — life-size 2WD chassis (~16 cm long, give it its own scene); `pos` = ground under the drive axle, forward = local +z; `setWheels(l, r)` −1..1, `tick`, `reset()`, `stop()`, `deck` (Group that moves with the car), `heading`, `position`.
- Breadboard: `makeSevenSegment([10 holes])` — top row g f COM a b, bottom row e d COM c DP; `setSegments(mask)` (bit0=a … bit7=dp), `showDigit(n, dp)`. `makeDIP(holes, label, pinCount)` (standard DIP numbering straddling the channel). `makeLEDBar([20 holes])` → `setLevel(n)`, `set(i,on)`.
- Also `makeBreakout({...})` for custom breakout boards.
Run `dev/modules.html?m=<key>` and `dev/boards.html?b=<id>` to preview parts.
