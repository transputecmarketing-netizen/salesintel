# Circuit Lab

An interactive 3D electronics course that runs entirely in the browser. Learners wire real circuits on a 3D breadboard, read and tweak real code, run a simulation of it, and check their understanding with quizzes and challenges — from a first blinking LED to Wi-Fi devices and edge-AI cameras.

- **Landing page** — `/` (`index.html`, `src/landing.js`)
- **Lesson app** — `/learn/` (`learn/index.html`, `src/main.js`); every lesson has a stable URL such as `/learn/#esp32-webserver`

## Curriculum

77 lessons in 8 tracks, beginner to advanced, with 280 quiz questions and 3 challenges per lesson.

| Track | Board | Level | Lessons |
| --- | --- | --- | --- |
| Foundations | Uno-style | Beginner | 18 |
| Sensors & Inputs | Uno-style | Beginner → Intermediate | 12 |
| Displays, Light & Motion | Uno-style | Intermediate | 9 |
| Advanced Arduino | Mega 2560 / Nano | Advanced | 8 |
| IoT with ESP32 | ESP32 DevKit | Intermediate → Advanced | 9 |
| MicroPython on Pico | Raspberry Pi Pico | Intermediate | 6 |
| Edge AI with Jetson Nano | Jetson Nano | Advanced | 10 |
| Capstone Projects | mixed | Advanced | 5 |

## Features

- Procedural three.js models of six boards and 40+ components and modules (no external 3D assets)
- Callout cards with leader lines, pan / rotate / zoom (mouse, touch, WASD, Q/E), current-flow animation and live pin-state chips
- Real Arduino C++, MicroPython and Python code with syntax colouring; click highlighted numbers to edit them; copy or download the file
- Step-by-step simulation with line highlighting, a serial monitor / terminal with input, and panels: serial plotter, phone browser (ESP32 web pages, MQTT, Bluetooth) and a camera feed with detection boxes (Jetson)
- Clickable parts: press buttons, turn knobs, move obstacles, tilt sensors, type on keypads
- Overview, Wiring, Practice (challenges), Quiz and Specs tabs; progress saved per lesson and track in `localStorage`
- Searchable course and parts index, keyboard shortcuts, responsive layout down to phone width, reduced-motion support

## Develop

```bash
cd circuit-lab
npm install
npm run dev          # http://localhost:5173/  and  /learn/
npm run build        # production build into dist/
npm run preview      # serve the build
```

Previews of individual parts: `/dev/boards.html?b=jetson` and `/dev/modules.html?m=oled` (dev server only).

Visual QA (needs Playwright's Chromium):

```bash
node scripts/qa.cjs --url http://localhost:5173 --ids blink,esp32-webserver --run --out qa-shots
```

## Adding lessons

See [`docs/LESSON_API.md`](docs/LESSON_API.md) for the lesson schema, the `ctx` / `io` APIs, every board, component and module, and the quality bar. Lessons live in `src/lessons/<track>.js`; tracks are registered in `src/lessons/index.js`.

## Project layout

```
index.html, src/landing.*        landing page
learn/index.html, src/main.js    lesson app
src/scene/                       three.js stage, board, breadboard, wires, components
src/scene/boards/                Mega, Nano, ESP32, Pico, Jetson (+ CSI camera, ribbon)
src/scene/modules/               displays, sensors, actuators, inputs, robot car …
src/lessons/                     the course content, one file per track (part)
src/ui/                          code view, runner, panels, icons, storage
docs/LESSON_API.md               authoring guide
scripts/qa.cjs                   screenshot QA
```

## Deploy

The app is a static site. On Vercel, import the repository and set **Root Directory** to `circuit-lab`; `vercel.json` configures the Vite build, clean URLs and caching headers. Any static host works: run `npm run build` and serve `dist/`.

## Notes

The simulation is a teaching model that follows each program step by step; it does not compile or execute the C++/Python. Board models are stylised illustrations. Arduino, ESP32, Raspberry Pi, Pico, NVIDIA and Jetson are trademarks of their respective owners; this project is independent and not affiliated with them.
