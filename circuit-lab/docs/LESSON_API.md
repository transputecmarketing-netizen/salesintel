# Writing a Circuit Lab lesson

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
Run `npx vite --port <port>` in `circuit-lab/`, then
`node scripts/qa.cjs --url http://localhost:<port> --ids a,b,c --run --out <dir>`
and look at the screenshots. Fix overlapping callouts, parts floating or
intersecting, wires through parts, and any console errors.
