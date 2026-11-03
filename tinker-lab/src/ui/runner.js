// Runs a lesson's simulated sketch: setup() once, then loop() until stopped.
// Lessons talk to the page through the `io` object.
class Abort extends Error {}

export class Runner {
  constructor(hooks) {
    this.hooks = hooks; // { line(text, nth), print(text), pin(key, text, live), tone(f), noTone(), board, state(running) }
    this.running = false;
    this.token = 0;
  }

  async start(lesson, built, params) {
    this.stop();
    const token = ++this.token;
    this.running = true;
    this.lesson = lesson;
    this.built = built;
    this.hooks.state(true);
    const timers = new Set();
    this.timers = timers;
    const check = () => { if (token !== this.token) throw new Abort(); };
    const io = {
      board: this.hooks.board,
      line: (text, nth = 1) => { check(); this.hooks.line(text, nth); },
      print: (text) => { check(); this.hooks.print(text); },
      pin: (key, text, live) => { check(); this.hooks.pin(key, text, live); },
      tone: (f) => this.hooks.tone(f),
      /** Next line typed into the serial monitor / terminal, or null. */
      readLine: () => this.hooks.readLine?.() ?? null,
      available: () => this.hooks.available?.() ?? 0,
      noTone: () => this.hooks.noTone(),
      delay: (ms) => new Promise((res, rej) => {
        if (token !== this.token) return rej(new Abort());
        const id = setTimeout(() => { timers.delete(id); token === this.token ? res() : rej(new Abort()); }, Math.max(0, ms));
        timers.add(id);
        timers[id] = rej;
      }),
    };
    this.io = io;
    try {
      const intro = lesson.lang === 'python'
        ? (lesson.board === 'pico' ? ['Connecting to Pico (MicroPython v1.23)…', 'Running main.py'] : [`$ python3 ${lesson.id}.py`])
        : ['Compiling sketch…', 'Uploading… done.'];
      for (const t of intro) { this.hooks.print(t); await io.delay(220); }
      await lesson.setup?.(io, built, params);
      for (;;) {
        check();
        const t0 = performance.now();
        await lesson.loop(io, built, params);
        // never let a loop without delays freeze the page
        if (performance.now() - t0 < 16) await io.delay(16);
      }
    } catch (e) {
      if (!(e instanceof Abort)) {
        console.error(e);
        this.hooks.print(`Error: ${e.message}`);
      }
    }
  }

  stop() {
    if (!this.running) return;
    this.token++;
    for (const id of this.timers ?? []) {
      clearTimeout(id);
      this.timers[id]?.(new Abort());
    }
    this.running = false;
    this.hooks.noTone();
    this.lesson?.reset?.(this.built, this.io);
    this.hooks.state(false);
  }
}
