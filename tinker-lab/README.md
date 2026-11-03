# Tinker Lab

The virtual maker space. Tinker Lab teaches electronics, Arduino, IoT, robotics and edge AI from first principles, in pictures first. Learners then build circuits in interactive 3D, write and debug real code, follow paper-manual style build guides, and take it all to real hardware. Everything runs in the browser, with no account and nothing to install.

## What is in it

| Area | Where | What it does |
| --- | --- | --- |
| Website | `/`, `/about/`, `/mission/`, `/story/`, `/educators/`, `/curriculum/`, `/boards/`, `/contact/`, `/transparency/`, `/legal/*`, `404.html` | Landing page with a line-art assembly intro and interactive figures, plus the company, curriculum, trust and legal pages |
| The lab | `/learn/#<lesson-id>` | 150 lessons: 3D circuits with callouts, Guided runs, **My code** (your own Arduino C++ runs, with breakpoints and stepping), serial monitor and plotter, camera and phone panels, quizzes and challenges, progress saved in the browser |
| Build guides | `/guide/`, `/guide/#<id>`, `/guide/#<id>?print` | IKEA-style line-art manuals generated for every project: cover, parts list with counts, one change per step, printable on A4 |
| Tinker Studio | `/studio/` | Free-build maker space: drag parts onto a breadboard, wire them, solved circuit physics (LEDs really burn out), real Arduino code with a debugger, autosave, share links, `.ino` download, open any lesson's circuit |

## Curriculum

150 lessons in 16 tracks, with 532 quiz questions and 450 challenges. 34 lessons are animated, hand-drawn explainers that need no board; 83 use Arduino C++ and 33 use Python or MicroPython.

| Group | Track | Board | Level | Lessons |
| --- | --- | --- | --- | --- |
| Start here | Electronics Basics | none | Beginner | 15 |
| Start here | How Sensors See | none | Beginner | 9 |
| Start here | How Computers Think | none | Beginner → Intermediate | 10 |
| Microcontrollers | Arduino Foundations | Uno-style | Beginner | 18 |
| Microcontrollers | Sensors & Inputs | Uno-style | Beginner → Intermediate | 12 |
| Microcontrollers | Displays, Light & Motion | Uno-style | Intermediate | 9 |
| Microcontrollers | Advanced Arduino | Mega 2560 / Nano | Advanced | 8 |
| Connected devices | IoT with ESP32 & NodeMCU | ESP32 / ESP8266 | Intermediate → Advanced | 14 |
| Connected devices | MicroPython on Pico | Pico | Intermediate | 6 |
| Single-board computers | Raspberry Pi | Raspberry Pi 5 | Intermediate → Advanced | 8 |
| Single-board computers | Edge AI with NVIDIA Jetson | Jetson Nano / Orin Nano | Advanced | 14 |
| Capstone projects | Robotics & Industry | Uno-style | Advanced | 6 |
| Capstone projects | Smart Cities & Mobility | Uno-style | Advanced | 5 |
| Capstone projects | Planet & Environment | ESP32 | Intermediate → Advanced | 6 |
| Capstone projects | Physical AI | Jetson | Advanced | 5 |
| Capstone projects | Home & Maker Projects | mixed | Advanced | 5 |

Boards: Uno-style, Mega 2560, Nano, Uno R4 WiFi, ESP32 DevKit, NodeMCU (ESP8266), Raspberry Pi Pico, Raspberry Pi 5, Jetson Nano and Jetson Orin Nano. All boards, parts and props are procedural three.js models; there are no external 3D assets.

## Develop

Requires Node 20 or newer.

```bash
cd tinker-lab
npm install
npm run dev          # http://localhost:5173/ (every page)
npm run build        # production build into dist/
npm run preview      # serve the build
npm test             # Arduino runtime tests (node --test)
```

`npm run dev` and `npm run build` first run `scripts/build-catalog.mjs` (a light course index for the website pages) and `scripts/build-icons.mjs` (only the Lucide icons the project uses).

Developer previews (dev server only): `/dev/boards.html?b=jetson`, `/dev/modules.html?m=oled`, `/dev/figures.html`.

Screenshot QA (needs Playwright's Chromium):

```bash
npx vite --config scripts/vite.qa.config.js --port 5300   # no hot reload
node scripts/qa.cjs --url http://localhost:5300 --ids blink,esp32-webserver --run --out qa-shots
```

## Project layout

```
index.html, src/landing.*          landing page
about/ mission/ story/ …, src/site/ website pages, shared header/footer (src/site/shell.js)
learn/, src/main.js                the lab (lesson app)
guide/, src/guide/                 line-art build guides and the landing intro
studio/, src/studio/               Tinker Studio (parts, wiring, circuit solver in src/studio/circuit/)
src/runtime/                       Arduino C++ runtime, libraries and debugger (see src/runtime/README.md)
src/explainers/                    hand-drawn animated explainer engine and scenes
src/figures/                       interactive isometric figures (hairline kernel, MIT)
src/lessons/                       the course, one file per track; index.js registers tracks
src/scene/                         three.js stage, boards, breadboard, wires, components, modules
src/brand/                         brand config, colour tokens, logo, icon helper
docs/                              LESSON_API.md (authoring guide), RUNTIME_API.md, RESUME.md
scripts/, tests/                   build helpers, QA scripts, runtime tests
```

## Brand

Name, legal entity, contact details, colours and logo live in `src/brand/` (`brand.js`, `tokens.css`, `logo.js`). Primary colour Tinker red `#e5132d`, secondary Electric Iris `#5b3df5`, on white; type is Newsreader Light with IBM Plex Mono for code; no italics. After a brand change, regenerate the favicons, app icons and social image with `node scripts/gen-icons.cjs` (needs Playwright).

## Before launch

1. Fill in the placeholders in `src/brand/brand.js` (company name, address, emails, domain, governing law, hosting provider). The legal pages show a "Draft" note until they are filled.
2. Set `VITE_SITE_URL` (your domain, no trailing slash) in `.env` and in your host's environment variables; it is used for canonical links and social previews.
3. Have the Terms, Privacy and Cookie policies reviewed by a lawyer.

## Deploy

It is a static site. On Vercel, import the repository and set **Root Directory** to `tinker-lab`; `vercel.json` sets the Vite build, clean URLs and caching headers. Any static host works: `npm run build`, then serve `dist/`.

## Notes and limits

- **Simulation.** Guided runs follow each program step by step and model what the parts do. **My code** runs the learner's own Arduino C++ through the Tinker Lab runtime, an interpreter for the Arduino language with emulated libraries; it is not an AVR emulator and is not cycle-accurate. Python and MicroPython lessons run as guided simulations. Tinker Studio solves circuits with modified nodal analysis; inductive spikes are not modelled.
- **AI lessons** show simulated inference derived from the objects actually in the virtual camera's view, and say so.
- **Credits:** three.js (MIT), hairline kernel by Lucas Marques (MIT), rough.js (MIT), Lucide icons (ISC), CodeMirror (MIT), lz-string (MIT), Newsreader and IBM Plex Mono (OFL). Board models are stylised illustrations. Arduino, ESP32, ESP8266, Raspberry Pi, NVIDIA and Jetson are trademarks of their owners; Tinker Lab is independent and not affiliated with them.
