// Track 3 (first half) — Displays, Light & Motion: 7-segment digits, shift
// registers, character LCDs and OLED graphics on an Uno-style board.
import { makeResistor, makeLED, makePot } from '../scene/components.js';
import { makeSevenSegment, makeDIP, makeLCD1602, makeOLED } from '../scene/modules.js';
import { v, BB, clamp, ledGain } from './helpers.js';

/** Arduino map() with integer maths. */
const amap = (x, a, b, c, d) => Math.trunc(((x - a) * (d - c)) / (b - a) + c);
const noise = (n) => Math.round((Math.random() - 0.5) * 2 * n);

// bit 0 = a … bit 6 = g, bit 7 = dp (same table as the sketch)
const SEG = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71];

export const displaysA = [
  // ------------------------------------------------------------------ seven-segment
  {
    id: 'seven-segment', title: 'Count on a 7-segment', icon: 'code',
    thumb: () => {
      const d = makeSevenSegment([...[-0.5, -0.25, 0, 0.25, 0.5].map((x) => v(x, 0, -0.38)), ...[-0.5, -0.25, 0, 0.25, 0.5].map((x) => v(x, 0, 0.38))]);
      d.showDigit(7);
      return d.group;
    },
    view: { center: [6.8, 0.9, -0.2], size: 12.5, az: 35 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      const C = 14; // display occupies columns 14–18
      // top row (row e): g f COM a b · bottom row (row f): e d COM c DP
      const holes = [0, 1, 2, 3, 4].map((i) => bb.hole(C + i, 'e')).concat([0, 1, 2, 3, 4].map((i) => bb.hole(C + i, 'f')));
      const seg = ctx.add(makeSevenSegment(holes));
      // segment → Arduino pin: a2 b3 c4 d5 e6 f7 g8 dp9
      const top = [['D8', 0, 'purple'], ['D7', 1, 'blue'], ['D2', 3, 'yellow'], ['D3', 4, 'orange']];
      const bot = [['D6', 0, 'green'], ['D5', 1, 'white'], ['D4', 3, 'orange'], ['D9', 4, 'brown']];
      const wires = {};
      for (const [pin, i, col] of top) wires[pin] = ctx.wire(ctx.board.pin(pin), bb.hole(C + i, 'a'), col, { signal: pin, chipT: 0.28 + i * 0.04 });
      for (const [pin, i, col] of bot) wires[pin] = ctx.wire(ctx.board.pin(pin), bb.hole(C + i, 'i'), col, { signal: pin, lift: 2.6, chipT: 0.12 + i * 0.03, bend: v(i < 2 ? -1.7 + i * 0.3 : 1.4 + (i - 3) * 0.3, 0, -0.6) });
      // common cathode → resistor → GND rail
      const res = ctx.add(makeResistor(bb.hole(C + 2, 'j'), bb.hole(C + 2, 'bot-'), 330, { height: 0.5 }));
      const gw = ctx.wire(ctx.board.pin('GND_2'), bb.hole(8, 'bot-'), 'black', { signal: 'GND', dir: -1 });
      const state = { ohms: 330 };
      ctx.interact(seg, { name: '7-segment display', hint: 'Common cathode: a segment lights when its pin is HIGH' });
      ctx.interact(res, {
        name: 'COM resistor', hint: 'Limits the current through the common pin',
        controls: [{ type: 'choice', label: 'Resistance', options: [[150, '150 Ω'], [330, '330 Ω'], [1000, '1 kΩ']], get: () => state.ohms, set: (o) => { state.ohms = o; res.setValue(o); } }],
        note: () => {
          const n = Math.max(1, [...Array(8)].reduce((a, _, i) => a + ((seg.mask >> i) & 1), 0));
          const total = (3 / state.ohms) * 1000;
          return `≈ ${total.toFixed(1)} mA shared by ${n} lit segment${n > 1 ? 's' : ''} → ${(total / n).toFixed(1)} mA each`;
        },
      });
      ctx.anchor('seg', seg.anchor);
      ctx.anchor('res', res.anchor);
      ctx.anchor('a', wires.D2.mid);
      ctx.anchor('dp', wires.D9.mid);
      ctx.anchor('gnd', gw.mid);
      return { seg, res };
    },
    callouts: [
      { anchor: 'a', x: 0.04, y: 0.17, icon: 'pins', title: 'Pins 2–9 → a–g, dp', text: 'One pin per segment; HIGH lights it.' },
      { anchor: 'seg', x: 0.36, y: 0.12, icon: 'code', title: '7-segment digit', text: 'Seven bars + a dot, each a separate LED.' },
      { anchor: 'dp', x: 0.7, y: 0.17, icon: 'led', title: 'Bottom row', text: 'e, d, COM, c and the decimal point.' },
      { anchor: 'res', x: 0.04, y: 0.68, icon: 'resistor', title: '330 Ω on COM', text: 'All lit segments share this current to GND.' },
    ],
    overview: {
      heading: 'Count on a 7-segment display',
      text: 'A 7-segment display is eight LEDs — bars <em>a</em> to <em>g</em> plus a dot — sharing one common cathode. Store which segments make each digit in a byte, then copy the byte’s bits onto eight pins to count 0–9, or all the way to F in hex.',
      features: [['code', 'A lookup table of bytes, one per digit'], ['pins', '<code>bitRead()</code> copies bits to pins'], ['resistor', 'Click the resistor to see the current']],
    },
    pinout: [['D2–D8', 'Segments a–g', 'a2 b3 c4 d5 e6 f7 g8'], ['D9', 'Decimal point', ''], ['COM', '330 Ω → GND rail', 'Either COM pin works'], ['GND', '− rail', '']],
    example: {
      text: 'Microwave timers, petrol pumps, scoreboards and alarm clocks all use 7-segment digits because they are bright, cheap and easy to read from across a room.',
      points: ['Set <code>LAST</code> to 15 to count in hexadecimal (A b C d E F)', 'Design your own letters: H is <code>0b01110110</code>'],
    },
    specs: [['Type', '0.56″ single digit, common cathode'], ['Segment LED', '≈ 2 V forward, red'], ['Pins', '10 (8 segments + 2 × COM)'], ['Segment table', '1 byte per digit, bit 0 = a'], ['Current', '≈ 9 mA total with 330 Ω'], ['Board pins used', '8']],
    quiz: [
      { q: 'On a common-cathode display, how do you light a segment?', options: ['Set its pin HIGH', 'Set its pin LOW', 'Set COM HIGH', 'Use analogRead()'], answer: 0, explain: 'The cathodes are joined to GND, so a HIGH anode pin pushes current through that segment.' },
      { q: 'Which segments make the digit 1?', options: ['a and b', 'b and c', 'e and f', 'g only'], answer: 1, explain: 'The two right-hand bars, b and c: 0b00000110.' },
      { q: 'With one resistor on COM, why does an 8 look dimmer than a 1?', options: ['The current through the resistor is shared between all lit segments', '8 is a bigger number', 'The pins get tired', 'It doesn’t'], answer: 0, explain: 'One resistor per segment would give every segment the same current.' },
      { q: 'What does bitRead(0b00000110, 1) return?', options: ['0', '1', '6', '2'], answer: 1, explain: 'Bit 1 (counting from 0 on the right) is a 1.' },
    ],
    challenges: ['Count down from 9 to 0, then flash the decimal point three times.', 'Show the letters of a short word, like “HELLO”, one at a time.', 'Move the resistor: use one 330 Ω per segment and compare the brightness of 1 and 8.'],
    code: `// Segment patterns: bit 0 = a … bit 6 = g, bit 7 = dp
const byte DIGITS[16] = {
  0b00111111,  // 0
  0b00000110,  // 1
  0b01011011,  // 2
  0b01001111,  // 3
  0b01100110,  // 4
  0b01101101,  // 5
  0b01111101,  // 6
  0b00000111,  // 7
  0b01111111,  // 8
  0b01101111,  // 9
  0b01110111,  // A
  0b01111100,  // b
  0b00111001,  // C
  0b01011110,  // d
  0b01111001,  // E
  0b01110001   // F
};
const int SEG_PINS[8] = {2, 3, 4, 5, 6, 7, 8, 9};  // a b c d e f g dp
const int LAST = {{last}};                         // 9 = decimal, 15 = hex

void setup() {
  for (int s = 0; s < 8; s++) pinMode(SEG_PINS[s], OUTPUT);
  Serial.begin(9600);
}

void show(byte pattern) {
  for (int s = 0; s < 8; s++) {
    digitalWrite(SEG_PINS[s], bitRead(pattern, s));  // 1 = on
  }
}

void loop() {
  for (int n = 0; n <= LAST; n++) {
    show(DIGITS[n]);
    Serial.println(n, HEX);
    delay({{step}});
  }
}`,
    params: { last: { value: 9, min: 0, max: 15 }, step: { value: 700, min: 50, max: 3000 } },
    async setup(io) { io.line('pinMode'); await io.delay(120); io.line('Serial.begin'); await io.delay(60); },
    async loop(io, b, p) {
      const last = clamp(Math.round(p.last), 0, 15);
      for (let n = 0; n <= last; n++) {
        io.line('show(DIGITS[n])');
        const pat = SEG[n];
        io.line('bitRead');
        b.seg.setSegments(pat);
        for (let s = 0; s < 8; s++) { const on = (pat >> s) & 1; io.pin(`D${2 + s}`, on ? 'HIGH' : 'LOW', !!on); }
        io.line('Serial.println(n, HEX)'); io.print(n.toString(16).toUpperCase());
        io.line('delay('); await io.delay(p.step);
      }
    },
    reset(b) { b.seg.setSegments(0); },
  },

  // ------------------------------------------------------------------ shift-register
  {
    id: 'shift-register', title: '8 LEDs from 3 pins', icon: 'chip',
    thumb: () => makeDIP([...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => v(-0.89 + i * 0.254, 0, 0.38)), ...[7, 6, 5, 4, 3, 2, 1, 0].map((i) => v(-0.89 + i * 0.254, 0, -0.38))], '74HC595').group,
    view: { center: [6.9, 0.8, -0.2], size: 13.5, az: 20 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      // 74HC595: pins 1–8 along row f (cols 3→10), 9–16 back along row e (cols 10→3)
      const holes = [3, 4, 5, 6, 7, 8, 9, 10].map((c) => bb.hole(c, 'f')).concat([10, 9, 8, 7, 6, 5, 4, 3].map((c) => bb.hole(c, 'e')));
      const chip = ctx.add(makeDIP(holes, '74HC595'));
      // power rails
      ctx.wire(ctx.board.pin('5V'), bb.hole(1, 'top+'), 'red', { signal: '5V' });
      ctx.wire(ctx.board.pin('GND'), bb.hole(2, 'top-'), 'black', { signal: 'GND', dir: -1 });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(2, 'bot-'), 'black', { signal: 'GND', dir: -1 });
      const j = (a, b, color) => ctx.wire(a, b, color, { lift: 0.35 });
      j(bb.hole(3, 'a'), bb.hole(3, 'top+'), 'red'); // pin 16 VCC
      j(bb.hole(9, 'a'), bb.hole(9, 'top+'), 'red'); // pin 10 MR (keep HIGH)
      j(bb.hole(6, 'a'), bb.hole(6, 'top-'), 'black'); // pin 13 OE (LOW = enabled)
      j(bb.hole(10, 'j'), bb.hole(10, 'bot-'), 'black'); // pin 8 GND
      // control lines
      const ds = ctx.wire(ctx.board.pin('D11'), bb.hole(5, 'b'), 'blue', { signal: 'D11', chipT: 0.3 }); // pin 14 DS
      const st = ctx.wire(ctx.board.pin('D8'), bb.hole(7, 'b'), 'green', { signal: 'D8', chipT: 0.7 }); // pin 12 ST_CP
      const sh = ctx.wire(ctx.board.pin('D12'), bb.hole(8, 'b'), 'yellow', { signal: 'D12', chipT: 0.5 }); // pin 11 SH_CP
      // outputs → LEDs (anode col c, cathode col c+1, resistor from cathode col to the − rail)
      const qCol = [4, 3, 4, 5, 6, 7, 8, 9]; // Q0 is pin 15 (top side), Q1–Q7 are pins 1–7
      const colors = ['green', 'green', 'green', 'green', 'yellow', 'yellow', 'yellow', 'yellow'];
      const leds = [], qWires = [];
      for (let i = 0; i < 8; i++) {
        const c = 13 + i * 2;
        leds.push(ctx.add(makeLED(colors[i], bb.hole(c, 'h'), bb.hole(c + 1, 'h'))));
        ctx.add(makeResistor(bb.hole(c + 1, 'j'), bb.hole(c + 1, 'bot-'), 470, { height: 0.5 }));
        qWires.push(i === 0
          ? ctx.wire(bb.hole(4, 'a'), bb.hole(c, 'f'), 'white', { lift: 1.5 })
          : ctx.wire(bb.hole(qCol[i], 'g'), bb.hole(c, 'f'), 'orange', { lift: 0.55 + i * 0.07, bend: v(0, 0, -0.15) }));
      }
      const gain = ledGain(470);
      const state = { slow: false, shift: 0, out: 0 };
      ctx.interact(chip, {
        name: '74HC595 shift register', hint: 'Serial in, 8 parallel outputs',
        controls: [{ type: 'toggle', label: 'Slow-motion shiftOut()', get: () => state.slow, set: (on) => (state.slow = on) }],
        note: () => `Shift stage: ${state.shift.toString(2).padStart(8, '0')} · outputs Q7…Q0: ${state.out.toString(2).padStart(8, '0')}`,
      });
      leds.forEach((l, i) => ctx.interact(l, { name: `LED on Q${i}`, hint: `Bit ${i} of the byte (value ${1 << i})` }));
      ctx.anchor('chip', chip.anchor);
      ctx.anchor('ds', ds.mid);
      ctx.anchor('st', st.mid);
      ctx.anchor('sh', sh.mid);
      ctx.anchor('leds', leds[5].anchor);
      ctx.anchor('q0', qWires[0].mid);
      return { chip, leds, qWires, state, gain };
    },
    callouts: [
      { anchor: 'ds', x: 0.04, y: 0.17, icon: 'pins', title: 'Data · pin 11', text: 'One bit at a time into DS (chip pin 14).' },
      { anchor: 'sh', x: 0.36, y: 0.12, icon: 'timer', title: 'Clock · pin 12', text: 'Each rising edge shifts the bits along by one.' },
      { anchor: 'st', x: 0.7, y: 0.17, icon: 'bolt', title: 'Latch · pin 8', text: 'A rising edge copies all 8 bits to the outputs at once.' },
      { anchor: 'chip', x: 0.04, y: 0.68, icon: 'chip', title: '74HC595', text: 'Click it to watch shiftOut() in slow motion.' },
      { anchor: 'leds', x: 0.7, y: 0.68, icon: 'led', title: 'Q0–Q7', text: 'Q0 (bit 0) is the left LED, each through 470 Ω to GND.' },
    ],
    overview: {
      heading: '8 LEDs from 3 pins',
      text: 'The 74HC595 is a shift register: clock in eight bits one after another on a single data pin, then pulse the latch and all eight outputs change together. Three Arduino pins drive eight LEDs — and you can chain more chips for 16, 24…',
      features: [['chip', 'Serial-in, parallel-out with <code>shiftOut()</code>'], ['code', 'Bytes as bit patterns: counters and scanners'], ['timer', 'Toggle slow motion to see every clock pulse']],
    },
    pinout: [['D11', 'DS (pin 14)', 'Data'], ['D12', 'SH_CP (pin 11)', 'Shift clock'], ['D8', 'ST_CP (pin 12)', 'Latch'], ['5V', 'VCC (16), MR (10)', 'MR HIGH = no reset'], ['GND', 'GND (8), OE (13)', 'OE LOW = outputs on'], ['Q0–Q7', '470 Ω → LED → GND', 'Pins 15, 1–7']],
    example: {
      text: 'Shift registers drive LED matrices, big 7-segment scoreboards, the button rows of old game controllers and printer heads — any time you need more outputs than pins.',
      points: ['Turn on slow motion and watch the bits march in before the latch', 'Change <code>MSBFIRST</code> to <code>LSBFIRST</code> and the pattern flips'],
    },
    specs: [['Chip', '74HC595, 8-bit, DIP-16'], ['Supply', '2–6 V'], ['Per output', '≤ 35 mA abs. max, ≈ 6 mA used here'], ['Whole chip', '≤ 70 mA total — hence 470 Ω'], ['Clock', 'Up to ≈ 25 MHz at 5 V'], ['Cascading', 'Q7′ (pin 9) → DS of the next chip']],
    quiz: [
      { q: 'Why does the LED pattern not flicker while the bits are being shifted in?', options: ['The outputs only change when the latch pin rises', 'shiftOut() is instant', 'The LEDs are too slow', 'OE is HIGH'], answer: 0, explain: 'The shift stage and the output latch are separate; the latch copies all 8 bits at once.' },
      { q: 'How many clock pulses does shiftOut() send for one byte?', options: ['1', '3', '8', '255'], answer: 2, explain: 'One pulse per bit.' },
      { q: 'What does writeLeds(5) light?', options: ['Q5 only', 'Q0 and Q2', 'Q0 to Q4', 'Q1 and Q3'], answer: 1, explain: '5 = 0b00000101: bits 0 and 2.' },
      { q: 'How would you get 16 outputs?', options: ['Use 6 Arduino pins', 'Chain a second 595: Q7′ → DS, shared clock and latch, then shift out two bytes', 'It isn’t possible', 'Use analogWrite()'], answer: 1, explain: 'Daisy-chained 595s still use just three pins.' },
    ],
    challenges: ['Make a “fill up” bar: light 1, then 2, then 3 … LEDs, then empty again.', 'Show the reading of a potentiometer as a bar graph on the 8 LEDs.', 'Chain a second 74HC595 and make a 16-LED Knight Rider scanner.'],
    code: `const int DATA_PIN = 11;   // DS    (595 pin 14)
const int CLOCK_PIN = 12;  // SH_CP (595 pin 11)
const int LATCH_PIN = 8;   // ST_CP (595 pin 12)

void setup() {
  pinMode(DATA_PIN, OUTPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  Serial.begin(9600);
}

void writeLeds(byte pattern) {
  digitalWrite(LATCH_PIN, LOW);                      // hold the outputs
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, pattern);  // 8 clock pulses
  digitalWrite(LATCH_PIN, HIGH);                     // show all 8 at once
}

void loop() {
  for (int n = 0; n <= {{last}}; n++) {     // binary counter
    writeLeds(n);
    Serial.println(n, BIN);
    delay({{step}});
  }
  for (int i = 0; i < 8; i++) {             // scanner: out…
    writeLeds(1 << i);
    delay({{step}});
  }
  for (int i = 6; i > 0; i--) {             // …and back
    writeLeds(1 << i);
    delay({{step}});
  }
}`,
    params: { last: { value: 31, min: 0, max: 255 }, step: { value: 200, min: 20, max: 2000 } },
    async setup(io, b) {
      b.state.shift = b.state.out = 0;
      io.line('pinMode(DATA_PIN'); await io.delay(60);
      io.line('pinMode(LATCH_PIN'); await io.delay(60);
      io.line('Serial.begin'); await io.delay(60);
    },
    async loop(io, b, p) {
      const st = b.state;
      const write = async (pattern, callLine, nth) => {
        io.line(callLine, nth);
        io.line('LATCH_PIN, LOW'); io.pin('D8', 'LOW', false);
        io.line('shiftOut');
        if (st.slow) {
          for (let i = 7; i >= 0; i--) {
            const bit = (pattern >> i) & 1;
            io.pin('D11', `bit ${i} = ${bit}`, !!bit);
            await io.delay(110);
            io.pin('D12', 'CLK ↑', true);
            st.shift = ((st.shift << 1) | bit) & 0xff;
            await io.delay(110);
            io.pin('D12', 'LOW', false);
          }
        } else {
          io.pin('D11', 'DATA', true); io.pin('D12', '8 pulses', true);
          st.shift = pattern & 0xff;
          await io.delay(10);
          io.pin('D11', 'LOW', false); io.pin('D12', 'LOW', false);
        }
        io.line('LATCH_PIN, HIGH'); io.pin('D8', 'HIGH ↑', true);
        st.out = st.shift;
        b.leds.forEach((l, i) => l.set((st.out >> i) & 1 ? b.gain : 0));
        const qWires = b.qWires;
        qWires.forEach((w, i) => (w.live = !!((st.out >> i) & 1)));
        if (st.slow) await io.delay(300);
      };
      const last = clamp(Math.round(p.last), 0, 255);
      for (let n = 0; n <= last; n++) {
        await write(n, 'writeLeds(n)');
        io.line('Serial.println(n, BIN)'); io.print(n.toString(2));
        io.line('delay(', 1); await io.delay(p.step);
      }
      for (let i = 0; i < 8; i++) { await write(1 << i, 'writeLeds(1 << i)', 1); io.line('delay(', 2); await io.delay(p.step); }
      for (let i = 6; i > 0; i--) { await write(1 << i, 'writeLeds(1 << i)', 2); io.line('delay(', 3); await io.delay(p.step); }
    },
    reset(b) { b.state.shift = b.state.out = 0; b.leds.forEach((l) => l.set(0)); b.qWires.forEach((w) => (w.live = false)); },
  },

  // ------------------------------------------------------------------ lcd-hello
  {
    id: 'lcd-hello', title: 'Character LCD', icon: 'serial',
    thumb: () => { const l = makeLCD1602(v(0, 0, 0)); l.print(0, 0, 'Hello, world! ♥'); l.print(1, 0, 'Uptime: 42 s'); return l.group; },
    view: { center: [5.2, 1.2, 0.0], size: 15, az: -30 },
    build(ctx) {
      const lcd = ctx.add(makeLCD1602(v(9.9, 0, 0.2)));
      const g = ctx.wire(lcd.pin('GND'), ctx.board.pin('GND'), 'black', { signal: 'GND', lift: 1.6 });
      const vcc = ctx.wire(ctx.board.pin('5V'), lcd.pin('VCC'), 'red', { signal: '5V', lift: 1.6 });
      const sda = ctx.wire(ctx.board.pin('SDA'), lcd.pin('SDA'), 'blue', { signal: 'SDA', lift: 2.0 });
      const scl = ctx.wire(ctx.board.pin('SCL'), lcd.pin('SCL'), 'yellow', { signal: 'SCL', lift: 2.3 });
      lcd.backlight(false);
      const state = { addr: 0x27 };
      ctx.interact(lcd, {
        name: '16×2 LCD with I²C backpack', hint: 'Type in the serial monitor to change the top line',
        controls: [{ type: 'choice', label: 'This backpack’s address', options: [[0x27, '0x27 (PCF8574T)'], [0x3f, '0x3F (PCF8574AT)']], get: () => state.addr, set: (a) => (state.addr = a) }],
        note: () => (state.addr === 0x27 ? 'Matches LiquidCrystal_I2C lcd(0x27, …) in the sketch.' : 'The sketch talks to 0x27, so this LCD will stay blank. Run an I²C scanner to find the address.'),
      });
      ctx.anchor('lcd', lcd.anchor);
      ctx.anchor('heart', v(12.5, 2.0, 0.01)); // top row, column 15
      ctx.anchor('sda', sda.mid);
      ctx.anchor('scl', scl.mid);
      ctx.anchor('vcc', vcc.mid);
      ctx.anchor('gnd', g.mid);
      return { lcd, state, t0: 0 };
    },
    callouts: [
      { anchor: 'sda', x: 0.04, y: 0.17, icon: 'pins', title: 'SDA and SCL', text: 'I²C needs just two signal wires for the whole display.' },
      { anchor: 'lcd', x: 0.7, y: 0.17, icon: 'serial', title: '16 × 2 characters', text: 'Two rows of sixteen 5 × 8-dot cells.' },
      { anchor: 'vcc', x: 0.04, y: 0.68, icon: 'plug', title: '5V and GND', text: 'Powers the LCD, the backlight and the backpack.' },
      { anchor: 'heart', x: 0.7, y: 0.68, icon: 'heart', title: 'Custom character', text: 'createChar() draws your own 5 × 8 symbol — the heart.' },
    ],
    overview: {
      heading: 'Character LCD',
      text: 'A 16×2 LCD shows two lines of text. The I²C backpack on its back turns 16 fiddly pins into four, and <code>LiquidCrystal_I2C</code> gives you <code>print()</code>, <code>setCursor()</code> and even your own characters.',
      features: [['serial', 'Type a message to show it on the top line'], ['timer', 'A live uptime counter with <code>millis()</code>'], ['heart', 'A custom character from 8 bytes']],
    },
    pinout: [['5V', 'VCC', ''], ['GND', 'GND', ''], ['SDA (A4)', 'SDA', 'I²C data'], ['SCL (A5)', 'SCL', 'I²C clock'], ['Backpack pot', 'Contrast', 'Turn it if you only see blocks or nothing']],
    example: {
      text: '3D printers, vending machines, thermostats and lab instruments use these displays: cheap, readable in sunlight and easy to drive.',
      points: ['Type in the serial monitor to replace “Hello, world!”', 'Draw a smiley: each byte is one row of 5 pixels', 'Click the LCD to try the other common I²C address'],
    },
    specs: [['Display', '16 × 2 characters, HD44780-compatible'], ['Backpack', 'PCF8574 I²C expander'], ['Address', '0x27 (or 0x3F on PCF8574A)'], ['Custom characters', '8 slots, 5 × 8 pixels each'], ['Supply', '5 V, ≈ 20 mA with backlight'], ['Library', '<code>LiquidCrystal_I2C</code>']],
    quiz: [
      { q: 'What does lcd.setCursor(15, 0) do?', options: ['Moves to column 15 of the top row', 'Moves to row 15', 'Clears 15 characters', 'Sets the contrast'], answer: 0, explain: 'setCursor takes (column, row), both counted from 0.' },
      { q: 'Why print a few spaces after the uptime number?', options: ['To wipe leftover digits from a longer previous value', 'For speed', 'Spaces are required', 'To scroll the text'], answer: 0, explain: 'The LCD keeps whatever was there until it is overwritten.' },
      { q: 'The backlight is on but the screen is blank. What should you try first?', options: ['Adjust the contrast pot and check the I²C address', 'Replace the Arduino', 'Use a 9 V battery', 'Swap 5V and GND'], answer: 0, explain: 'Wrong contrast or a 0x27/0x3F mix-up are the two classic causes.' },
      { q: 'How many custom characters can the LCD hold at once?', options: ['1', '8', '16', '256'], answer: 1, explain: 'CGRAM has eight 5 × 8 slots, numbered 0–7.' },
    ],
    challenges: ['Show the uptime as minutes and seconds, like 03:27.', 'Make the heart “beat” by alternating two custom characters every half second.', 'Scroll a long message across the top row with lcd.scrollDisplayLeft().'],
    code: `#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);   // address, columns, rows

byte heart[8] = {
  0b00000,
  0b01010,
  0b11111,
  0b11111,
  0b11111,
  0b01110,
  0b00100,
  0b00000
};

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.createChar(0, heart);           // store it in slot 0
  lcd.setCursor(0, 0);
  lcd.print("Hello, world!");
  lcd.setCursor(15, 0);
  lcd.write(byte(0));                 // draw custom character 0
  Serial.begin(9600);
}

void loop() {
  if (Serial.available()) {           // new text for the top row
    String msg = Serial.readStringUntil('\\n');
    msg.trim();
    lcd.setCursor(0, 0);
    lcd.print("               ");     // blank columns 0–14
    lcd.setCursor(0, 0);
    lcd.print(msg.substring(0, 15));
  }
  unsigned long seconds = millis() / 1000;
  lcd.setCursor(0, 1);
  lcd.print("Uptime: ");
  lcd.print(seconds);
  lcd.print(" s   ");                 // wipe old digits
  Serial.println(seconds);
  delay({{rate}});
}`,
    params: { rate: { value: 500, min: 50, max: 3000 } },
    serialInput: { placeholder: 'Message for the top row (15 chars)' },
    async setup(io, b) {
      const ok = b.state.addr === 0x27;
      b.ok = ok;
      b.t0 = performance.now();
      io.line('lcd.init()'); io.pin('SDA', '0x27', true); io.pin('SCL', 'CLK', true);
      if (ok) b.lcd.clear();
      await io.delay(120);
      io.line('lcd.backlight()'); if (ok) b.lcd.backlight(true); await io.delay(80);
      io.line('lcd.createChar'); await io.delay(80);
      io.line('lcd.print("Hello'); if (ok) b.lcd.print(0, 0, 'Hello, world!'); await io.delay(80);
      io.line('lcd.write(byte(0))'); if (ok) b.lcd.print(0, 15, '♥'); await io.delay(60);
      io.pin('SDA', 'idle', false); io.pin('SCL', 'idle', false);
      io.line('Serial.begin'); await io.delay(40);
    },
    async loop(io, b, p) {
      const ok = b.ok;
      io.line('Serial.available()');
      const msg = io.readLine();
      if (msg !== null) {
        io.line('readStringUntil');
        const text = msg.trim().slice(0, 15);
        io.line('blank columns'); if (ok) b.lcd.print(0, 0, ' '.repeat(15));
        io.line('msg.substring'); if (ok) b.lcd.print(0, 0, text);
        await io.delay(40);
      }
      const s = Math.floor((performance.now() - b.t0) / 1000);
      io.line('millis() / 1000');
      io.line('lcd.print(seconds)');
      io.pin('SDA', `"${s}"`, true); io.pin('SCL', 'CLK', true);
      if (ok) b.lcd.print(1, 0, `Uptime: ${s} s   `);
      await io.delay(20);
      io.pin('SDA', 'idle', false); io.pin('SCL', 'idle', false);
      io.line('Serial.println(seconds)'); io.print(String(s));
      io.line('delay('); await io.delay(Math.max(0, p.rate - 20));
    },
    reset(b) { b.lcd.clear(); b.lcd.backlight(false); },
  },

  // ------------------------------------------------------------------ oled-graphics
  {
    id: 'oled-graphics', title: 'OLED graphics', icon: 'palette',
    thumb: () => {
      const o = makeOLED(v(0, 0, 0));
      o.text(['A0 612'], { size: 1 });
      o.text(['59%'], { size: 2, x: 80, clear: false });
      o.bar(0, 20, 128, 10, 0.6);
      return o.group;
    },
    view: { center: [8.0, 1.0, 1.9], size: 11.5, az: -20 },
    build(ctx) {
      const bb = ctx.breadboard(...BB);
      ctx.wire(ctx.board.pin('5V'), bb.hole(2, 'bot+'), 'red', { signal: '5V' });
      ctx.wire(ctx.board.pin('GND_2'), bb.hole(3, 'bot-'), 'black', { signal: 'GND', dir: -1 });
      const pot = ctx.add(makePot([bb.hole(6, 'h'), bb.hole(8, 'h'), bb.hole(10, 'h')]));
      ctx.wire(bb.hole(6, 'j'), bb.hole(6, 'bot+'), 'red', { lift: 0.35 });
      ctx.wire(bb.hole(10, 'j'), bb.hole(10, 'bot-'), 'black', { lift: 0.35 });
      const a0 = ctx.wire(ctx.board.pin('A0'), bb.hole(8, 'j'), 'green', { signal: 'A0', dir: -1, lift: 1.6 });
      const oled = ctx.add(makeOLED(v(11.6, 0, 4.4)));
      ctx.wire(oled.pin('GND'), bb.hole(23, 'bot-'), 'black', { lift: 0.8 });
      ctx.wire(oled.pin('VCC'), bb.hole(24, 'bot+'), 'red', { lift: 0.8 });
      const scl = ctx.wire(ctx.board.pin('A5'), oled.pin('SCL'), 'yellow', { signal: 'A5', lift: 2.2, chipT: 0.55 });
      const sda = ctx.wire(ctx.board.pin('A4'), oled.pin('SDA'), 'blue', { signal: 'A4', lift: 2.5, chipT: 0.45 });
      const state = { knob: 0.62, auto: false, t: 0 };
      pot.set(state.knob);
      ctx.onTick((dt) => {
        if (!state.auto) return;
        state.t += dt;
        state.knob = clamp(0.5 + 0.42 * Math.sin(state.t * 0.8) + 0.05 * Math.sin(state.t * 3.1), 0, 1);
        pot.set(state.knob);
      });
      ctx.interact(pot, {
        name: 'Potentiometer', hint: 'Turn it and watch the OLED',
        controls: [
          { type: 'range', label: 'Position', min: 0, max: 1023, step: 1, get: () => Math.round(state.knob * 1023), set: (x) => { state.auto = false; state.knob = x / 1023; pot.set(state.knob); } },
          { type: 'toggle', label: 'Wiggle automatically', get: () => state.auto, set: (on) => (state.auto = on) },
        ],
      });
      ctx.interact(oled, { name: 'SSD1306 OLED 128×64', hint: 'Every pixel is drawn by the sketch, then sent with display()' });
      ctx.anchor('pot', pot.anchor);
      ctx.anchor('oled', oled.anchor);
      ctx.anchor('a0', a0.mid);
      ctx.anchor('sda', sda.mid);
      ctx.anchor('scl', scl.mid);
      return { oled, pot, state, history: new Array(64).fill(0), head: 0 };
    },
    callouts: [
      { anchor: 'a0', x: 0.04, y: 0.17, icon: 'wave', title: 'Wiper → A0', text: 'The knob position, 0–1023.' },
      { anchor: 'sda', x: 0.36, y: 0.12, icon: 'pins', title: 'SDA → A4, SCL → A5', text: 'I²C at address 0x3C.' },
      { anchor: 'pot', x: 0.04, y: 0.68, icon: 'knob', title: 'Potentiometer', text: 'Click it to turn the knob.' },
      { anchor: 'oled', x: 0.7, y: 0.17, icon: 'palette', title: 'OLED 128 × 64', text: 'Text, a bar graph and a scrolling chart, all drawn in code.' },
    ],
    overview: {
      heading: 'OLED graphics',
      text: 'An SSD1306 OLED has 8,192 pixels that glow on their own. The Adafruit libraries draw text, rectangles and lines into a buffer in RAM; <code>display()</code> sends the whole picture over I²C. Here a knob drives a number, a bar and a live chart.',
      features: [['knob', 'Turn the knob and watch the screen'], ['wave', 'Text, <code>fillRect()</code> and <code>drawLine()</code>'], ['code', 'A ring buffer remembers the last 64 readings']],
    },
    pinout: [['A4 (SDA)', 'OLED SDA', ''], ['A5 (SCL)', 'OLED SCL', ''], ['5V / GND', 'Rails → OLED VCC / GND', 'Module has a 3.3 V regulator'], ['A0', 'Pot wiper', 'Outer legs to 5V and GND']],
    example: {
      text: 'Smart watches, fitness bands, 3D-printer screens and hobby drones use tiny OLEDs like this to show readings, menus and graphs.',
      points: ['Change the chart height: map to 0–20 instead of 0–27', 'Swap <code>drawLine</code> for <code>drawPixel</code> to plot dots'],
    },
    specs: [['Display', '0.96″ 128 × 64 monochrome OLED'], ['Driver', 'SSD1306, I²C address 0x3C'], ['Buffer', '1 KB of the Uno’s 2 KB RAM'], ['Text size 1', '6 × 8 px cells → 21 × 8 characters'], ['Supply', '3.3–5 V'], ['Libraries', '<code>Adafruit_SSD1306</code>, <code>Adafruit_GFX</code>']],
    quiz: [
      { q: 'Why does nothing change on the OLED until display.display() runs?', options: ['Drawing happens in a RAM buffer; display() sends it to the screen', 'The OLED is slow to warm up', 'I²C only works once per second', 'clearDisplay() blocks it'], answer: 0, explain: 'Drawing into the buffer is fast; display() copies all 1024 bytes over I²C.' },
      { q: 'Where is pixel (0, 0)?', options: ['Bottom-left', 'Top-left', 'Centre', 'Bottom-right'], answer: 1, explain: 'Screen coordinates start top-left; y grows downwards — that’s why the chart uses 63 − a.' },
      { q: 'What does (head + 1) % 64 do?', options: ['Wraps the index back to 0 after 63 — a ring buffer', 'Divides by 64', 'Rounds the value', 'Nothing'], answer: 0, explain: 'The newest reading overwrites the oldest, so history always holds the last 64.' },
      { q: 'How much of the Uno’s RAM does the 128 × 64 buffer use?', options: ['64 bytes', '128 bytes', '1024 bytes', '8192 bytes'], answer: 2, explain: '8192 pixels ÷ 8 bits per byte = 1024 bytes — half the Uno’s 2 KB.' },
    ],
    challenges: ['Draw a needle gauge: a semicircle with drawCircle() and a line at the knob’s angle.', 'Add a min/max marker to the chart showing the lowest and highest reading so far.', 'Make a tiny game: the knob moves a paddle at the bottom and a ball bounces off it.'],
    code: `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);  // no reset pin
const int POT = A0;
byte history[64];                              // last 64 readings
byte head = 0;

void setup() {
  Serial.begin(9600);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("SSD1306 allocation failed");
    for (;;);                                  // stop here
  }
  display.setTextColor(SSD1306_WHITE);
}

void loop() {
  int value = analogRead(POT);
  history[head] = map(value, 0, 1023, 0, 27);
  head = (head + 1) % 64;

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("A0 ");
  display.print(value);
  display.setCursor(0, 10);
  display.print(value * 5.0 / 1023, 2);
  display.print(" V");
  display.setTextSize(2);
  display.setCursor(80, 0);
  display.print(map(value, 0, 1023, 0, 100));
  display.print('%');

  display.drawRect(0, 20, 128, 10, SSD1306_WHITE);                   // bar
  display.fillRect(2, 22, map(value, 0, 1023, 0, 124), 6, SSD1306_WHITE);

  for (int i = 0; i < 63; i++) {                                     // chart
    int a = history[(head + i) % 64];
    int b = history[(head + i + 1) % 64];
    display.drawLine(i * 2, 63 - a, i * 2 + 2, 63 - b, SSD1306_WHITE);
  }
  display.display();                                                 // send it
  Serial.println(value);
  delay({{rate}});
}`,
    params: { rate: { value: 100, min: 20, max: 1000 } },
    async setup(io, b) {
      b.history.fill(0);
      b.head = 0;
      io.line('Serial.begin'); await io.delay(60);
      io.line('display.begin'); io.pin('A4', '0x3C', true); io.pin('A5', 'CLK', true); await io.delay(150);
      b.oled.clear();
      io.pin('A4', 'idle', false); io.pin('A5', 'idle', false);
      io.line('setTextColor'); await io.delay(40);
    },
    async loop(io, b, p) {
      io.line('analogRead(POT)');
      const value = clamp(Math.round(b.state.knob * 1023) + noise(2), 0, 1023);
      io.pin('A0', String(value), true);
      io.line('history[head] =');
      b.history[b.head] = amap(value, 0, 1023, 0, 27);
      b.head = (b.head + 1) % 64;
      io.line('display.clearDisplay()');
      const pct = amap(value, 0, 1023, 0, 100);
      const barW = amap(value, 0, 1023, 0, 124);
      const h = b.history, head = b.head;
      io.line('display.drawLine');
      b.oled.draw((g) => {
        const px = (x, y) => g.fillRect(x, y, 1, 1);
        const line = (x0, y0, x1, y1) => { // Bresenham, like Adafruit_GFX
          const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
          let err = dx + dy;
          for (;;) {
            px(x0, y0);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
          }
        };
        // bar: drawRect outline + fillRect
        g.fillRect(0, 20, 128, 1); g.fillRect(0, 29, 128, 1); g.fillRect(0, 20, 1, 10); g.fillRect(127, 20, 1, 10);
        if (barW > 0) g.fillRect(2, 22, barW, 6);
        for (let i = 0; i < 63; i++) line(i * 2, 63 - h[(head + i) % 64], i * 2 + 2, 63 - h[(head + i + 1) % 64]);
      });
      b.oled.text([`A0 ${value}`, `${((value * 5) / 1023).toFixed(2)} V`], { x: 0, y: 0, size: 1, lineHeight: 10, clear: false });
      b.oled.text([`${pct}%`], { x: 80, y: 0, size: 2, clear: false });
      io.line('display.display()');
      io.pin('A4', 'buffer', true); io.pin('A5', 'CLK', true);
      await io.delay(25); // ≈ 1 KB over 400 kHz I²C
      io.pin('A4', 'idle', false); io.pin('A5', 'idle', false);
      io.line('Serial.println(value)'); io.print(String(value));
      io.line('delay('); await io.delay(Math.max(0, p.rate - 25));
    },
    reset(b) { b.oled.clear(); },
  },
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['code', '7-segment display', 'Eight LEDs (a–g + dot) shaped into a digit.', 'seven-segment'],
  ['chip', '74HC595 shift register', 'Turns 3 pins into 8 outputs; chainable.', 'shift-register'],
  ['serial', '16×2 I²C LCD', 'Two lines of text over just two signal wires.', 'lcd-hello'],
  ['palette', 'SSD1306 OLED', '128×64 pixel display for text and graphics.', 'oled-graphics'],
];
