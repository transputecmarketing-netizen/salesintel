# Paused work: where each workstream stopped

Paused on 3 November 2026 (usage limit). Resume each workstream from here.

| Workstream | Owns | Stopped at |
| --- | --- | --- |
| Arduino runtime + debugger | `src/runtime/**`, `tests/**`, "Run my code" in the lesson app | Lexer, parser and interpreter in progress; next: debugger value formatting, libraries, tests, lesson `hw` bindings |
| IKEA-style build guides | `src/guide/**`, `guide/index.html`, part labels | Line-art renderer and step planner done; next: tighter zoom on short-jumper steps, the guide index page, print view, landing intro animation |
| Visual explainers | `src/explainers/**`, `src/lessons/{basics,sensing,computing}.js` | Engine validated; next: remaining Basics scenes, then Sensors and Computers tracks |
| Hairline figures | `src/figures/**`, `dev/figures.*` | Several figures drafted; next: fix block picking on stepped parts (rule 01), the rest of the figures, gallery |
| New boards | `src/scene/boards/{nodemcu,rpi5,unor4,orin}.js`, `src/lessons/{nodemcu,raspberry-pi,jetson-orin}.js` | NodeMCU and Pi 5 boards in progress; next: QA NodeMCU lessons, then Pi, R4, Orin |
| Tinker Studio | `studio/index.html`, `src/studio/**` | Parts catalogue and circuit solver drafted; next: the app controller (`src/studio/main.js`) |
| Site pages + legal + icons | `about`, `mission`, `story`, `educators`, `curriculum`, `boards`, `contact`, `transparency`, `legal/*`, `404.html`, icons | Pages written; next: full width-matrix QA (1440 to 360 px) of every page |
| Robotics, industry, cities | `src/scene/modules/industry.js`, `src/lessons/projects-{industry,city}.js` | Parts and first lessons done; next: lessons 3 to 6, then cities |
| Planet + physical AI | `src/scene/modules/planet.js`, `src/lessons/projects-{planet,ai}.js` | Parts module drafted; next: part tweaks, then the lessons |

Lead (integration) still to do after all workstreams finish: wire the intro animation and figures into the landing page (already auto-detected), add the pages' head tags to `/` and `/learn/`, full build, QA of every page and lesson at desktop and phone widths, README update, commit and push.

Note: while workstreams are mid-edit the production build may fail (for example a module importing a file not written yet). Run `npx vite build` after resuming.

## Lead follow-ups (after the runtime agent releases src/main.js)
- Serial monitor shows "9600 baud" always: read the rate from `Serial.begin(N)` in the lesson code.
- Download/copy wording: "a .py file on the Raspberry Pi" for `rpi5`, "on the Jetson" for `jetson`/`orin`.
- Auto power LED and fan: also for `rpi5` and `orin`, not only `jetson`.
- The `unor4` board has no lessons yet (LED-matrix lessons would suit it).
- Add an "Open in Studio" button in the lesson app linking to `/studio/#lesson=<id>` (C++ lessons).
