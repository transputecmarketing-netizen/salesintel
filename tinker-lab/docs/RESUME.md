# Project status

All workstreams are complete (3 November 2026): website and legal pages, the lab with 150 lessons in 16 tracks, the Arduino runtime with "My code" and a debugger, line-art build guides, Tinker Studio, the explainer engine, the figure library and ten board models.

## Known limits (see also README "Notes and limits")
- 26 C++ lessons have no `hw` binding yet: their "My code" mode runs Serial and pin chips only (esp32-dashboard, esp32-pwm, esp32-mqtt, proj-weather-station, proj-smart-home, four NodeMCU lessons, and the industry, city and planet capstones). Adding `hw(built, io)` to those lessons makes their 3D parts respond to learners' own code.
- The runtime does not support user-defined classes, templates, `goto` or `new`/`delete`, and reports only the first parse error.
- Python and MicroPython lessons run as guided simulations only.
- Studio has no inductor model, and parts without a Studio version (74HC595, sound sensor) are skipped when a lesson is opened in Studio.
- The Uno R4 WiFi board has no lessons yet; its LED matrix API is ready for them.
- Some published performance figures (Orin inference time, LLM tokens per second, Pi fan speed) are marked approximate in the lessons.

## Before launch
Fill in `src/brand/brand.js`, set `VITE_SITE_URL`, and have the legal pages reviewed. See README "Before launch".
