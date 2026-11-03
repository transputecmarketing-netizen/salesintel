// "Start from example": complete, electrically correct circuits with their sketches.
// Breadboard holes use the standard spot next to the Uno (BB_SPOT): rows a–e are the
// board side, f–j the front.
import { newProject } from './model.js';

const H = (col, row) => ({ t: 'hole', bb: 'bb1', col, row });
const B = (pin) => ({ t: 'board', pin });
const M = (id, pin) => ({ t: 'part', id, pin });
let n = 0;
const W = (a, b, color) => ({ id: `w${++n}`, a, b, color });
const bbPart = (id, type, col, row, props = {}, rot = 0) => ({ id, type, rot, props, at: { bb: 'bb1', col, row } });
const free = (id, type, x, z, props = {}, rot = 0) => ({ id, type, rot, props, pos: [x, z] });

/** Resistor + LED on a pin: resistor d(c)–d(c+4), LED c(c+4) → c(c+5), cathode strip to GND. */
function ledOn(pin, c, color, gndPin = 'GND', ohms = 220) {
  return {
    parts: [bbPart(`r${c}`, 'resistor', c, 'd', { ohms }), bbPart(`l${c}`, 'led', c + 4, 'c', { color })],
    wires: [W(B(pin), H(c, 'a'), 'orange'), W(B(gndPin), H(c + 5, 'a'), 'black')],
  };
}

function project(name, code, { parts = [], wires = [], breadboard = true, board = 'uno' } = {}) {
  const p = newProject(board, name);
  if (!breadboard) p.breadboards = [];
  p.parts = parts.map((x) => ({ rot: 0, ...x }));
  p.wires = wires;
  p.code = code;
  return p;
}

export const EXAMPLES = [
  {
    id: 'blink', title: 'Blink', blurb: 'An LED and a 220 Ω resistor on pin 13.', icon: 'lightbulb',
    make() {
      const c = ledOn('D13', 10, 'red');
      return project('Blink', `// Blink: switch an LED on and off once a second.
const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);  // 5 V: current flows, the LED lights
  delay(1000);
  digitalWrite(LED_PIN, LOW);   // 0 V: no current
  delay(1000);
}
`, c);
    },
  },
  {
    id: 'button', title: 'Button', blurb: 'A push button on pin 2 (INPUT_PULLUP) lights the LED.', icon: 'square-dot',
    make() {
      const c = ledOn('D13', 4, 'green');
      c.parts.push(bbPart('btn', 'button', 18, 'e'));
      c.wires.push(W(B('D2'), H(18, 'a'), 'yellow'), W(B('GND_2'), H(20, 'j'), 'black'));
      return project('Button', `// Button: the LED is on while the button is held.
const int BUTTON_PIN = 2;
const int LED_PIN = 13;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);  // reads HIGH until pressed
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int pressed = digitalRead(BUTTON_PIN) == LOW;
  digitalWrite(LED_PIN, pressed ? HIGH : LOW);
  Serial.println(pressed);
  delay(20);  // simple debounce
}
`, c);
    },
  },
  {
    id: 'fade', title: 'Fade', blurb: 'PWM on pin ~9 fades an LED up and down.', icon: 'sun-dim',
    make() {
      const c = ledOn('D9', 10, 'blue', 'GND', 100);
      return project('Fade', `// Fade: analogWrite() sets the PWM duty cycle (0–255).
const int LED_PIN = 9;   // a ~ PWM pin
int brightness = 0;
int step = 5;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  analogWrite(LED_PIN, brightness);
  Serial.println(brightness);
  brightness = brightness + step;
  if (brightness <= 0 || brightness >= 255) {
    step = -step;   // turn round at either end
  }
  delay(30);
}
`, c);
    },
  },
  {
    id: 'knob', title: 'Knob → LED', blurb: 'A 10 kΩ potentiometer on A0 sets the LED brightness.', icon: 'gauge',
    make() {
      const c = ledOn('D9', 4, 'yellow');
      c.parts.push(bbPart('pot', 'pot', 17, 'h', { ohms: 10000, pos: 0.4 }));
      c.wires.push(W(B('5V'), H(17, 'j'), 'red'), W(B('A0'), H(19, 'j'), 'green'), W(B('GND_2'), H(21, 'j'), 'black'));
      return project('Knob to LED', `// Knob: read a potentiometer on A0 and dim an LED on pin 9.
const int POT_PIN = A0;
const int LED_PIN = 9;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(POT_PIN);           // 0–1023
  int level = map(raw, 0, 1023, 0, 255);   // 0–255 for PWM
  analogWrite(LED_PIN, level);
  Serial.print("A0 = ");
  Serial.println(raw);
  delay(50);
}
`, c);
    },
  },
  {
    id: 'servo', title: 'Servo sweep', blurb: 'A micro servo sweeps 0–180° on pin 9.', icon: 'rotate-cw',
    make() {
      return project('Servo sweep', `// Sweep: move a servo from 0° to 180° and back.
#include <Servo.h>

Servo arm;

void setup() {
  arm.attach(9);
}

void loop() {
  for (int angle = 0; angle <= 180; angle += 2) {
    arm.write(angle);
    delay(15);
  }
  for (int angle = 180; angle >= 0; angle -= 2) {
    arm.write(angle);
    delay(15);
  }
}
`, {
        breadboard: false,
        parts: [free('srv', 'servo', 7.4, 1.4)],
        wires: [W(M('srv', 'GND'), B('GND_2'), 'brown'), W(M('srv', 'V+'), B('5V'), 'red'), W(M('srv', 'SIG'), B('D9'), 'orange')],
      });
    },
  },
  {
    id: 'parking', title: 'Parking sensor', blurb: 'HC-SR04 distance + a buzzer that beeps faster as you get closer.', icon: 'radar',
    make() {
      return project('Parking sensor', `// Parking sensor: beep faster as the obstacle gets closer.
const int TRIG = 9;
const int ECHO = 10;
const int BUZZER = 8;

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  Serial.begin(9600);
}

long readCm() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);      // 10 µs pulse starts a measurement
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 30000);
  return us / 58;                // sound: 58 µs per cm, there and back
}

void loop() {
  long cm = readCm();
  Serial.print("Distance: ");
  Serial.print(cm);
  Serial.println(" cm");
  if (cm > 0 && cm < 60) {
    tone(BUZZER, 1200, 60);
    delay(map(cm, 2, 60, 80, 600));
  } else {
    delay(200);
  }
}
`, {
        parts: [bbPart('us', 'ultrasonic', 14, 'e', { cm: 35 }), bbPart('bz', 'buzzer', 22, 'h')],
        wires: [W(B('5V'), H(14, 'a'), 'red'), W(B('D9'), H(15, 'a'), 'yellow'), W(B('D10'), H(16, 'a'), 'green'), W(B('GND'), H(17, 'a'), 'black'),
          W(B('D8'), H(22, 'j'), 'orange'), W(B('GND_2'), H(25, 'j'), 'black')],
      });
    },
  },
  {
    id: 'lcd', title: 'LCD hello', blurb: 'Hello on a 16×2 I²C LCD, with a seconds counter.', icon: 'monitor',
    make() {
      return project('LCD hello', `// LCD: print on a 16×2 display through its I²C backpack (address 0x27).
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Hello, maker!");
}

void loop() {
  lcd.setCursor(0, 1);
  lcd.print("Up ");
  lcd.print(millis() / 1000);
  lcd.print(" s   ");
  delay(250);
}
`, {
        breadboard: false,
        parts: [free('lcd', 'lcd', 10.4, 0.2, { addr: 0x27 })],
        wires: [W(M('lcd', 'GND'), B('GND_2'), 'black'), W(M('lcd', 'VCC'), B('5V'), 'red'), W(M('lcd', 'SDA'), B('A4'), 'blue'), W(M('lcd', 'SCL'), B('A5'), 'yellow')],
      });
    },
  },
  {
    id: 'rainbow', title: 'NeoPixel rainbow', blurb: 'A 12-LED ring cycles through the colour wheel.', icon: 'rainbow',
    make() {
      return project('NeoPixel rainbow', `// Rainbow on a 12-pixel WS2812B ring (data on pin 6 through 330 Ω).
#include <Adafruit_NeoPixel.h>

const int PIN = 6;
const int COUNT = 12;
Adafruit_NeoPixel ring(COUNT, PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  ring.begin();
  ring.setBrightness(40);   // keep the current low on USB power
}

long hue = 0;

void loop() {
  for (int i = 0; i < COUNT; i++) {
    long h = hue + (long)i * 65536 / COUNT;
    ring.setPixelColor(i, ring.gamma32(ring.ColorHSV(h)));
  }
  ring.show();
  hue += 256;
  delay(20);
}
`, {
        parts: [bbPart('rd', 'resistor', 10, 'd', { ohms: 330 }), free('ring', 'ring', 9.6, 5.8)],
        wires: [W(B('D6'), H(10, 'a'), 'green'), W(H(14, 'b'), M('ring', 'DIN'), 'green'), W(M('ring', '5V'), B('5V'), 'red'), W(M('ring', 'GND'), B('GND_2'), 'black')],
      });
    },
  },
  {
    id: 'traffic', title: 'Traffic lights', blurb: 'Red, amber and green LEDs run a UK-style sequence.', icon: 'traffic-cone',
    make() {
      const parts = [], wires = [];
      [['D12', 4, 'red'], ['D11', 12, 'yellow'], ['D10', 20, 'green']].forEach(([pin, c, color]) => {
        parts.push(bbPart(`r${c}`, 'resistor', c, 'd', { ohms: 220 }), bbPart(`l${c}`, 'led', c + 4, 'c', { color }));
        wires.push(W(B(pin), H(c, 'a'), 'orange'), W(H(c + 5, 'a'), H(c + 5, 'top-'), 'black'));
      });
      wires.push(W(B('GND'), H(2, 'top-'), 'black'));
      return project('Traffic lights', `// Traffic lights: red → red + amber → green → amber → red.
const int RED = 12;
const int AMBER = 11;
const int GREEN = 10;

void light(bool r, bool a, bool g, int ms) {
  digitalWrite(RED, r);
  digitalWrite(AMBER, a);
  digitalWrite(GREEN, g);
  delay(ms);
}

void setup() {
  pinMode(RED, OUTPUT);
  pinMode(AMBER, OUTPUT);
  pinMode(GREEN, OUTPUT);
}

void loop() {
  light(true, false, false, 3000);   // stop
  light(true, true, false, 1000);    // get ready
  light(false, false, true, 3000);   // go
  light(false, true, false, 1000);   // prepare to stop
}
`, { parts, wires });
    },
  },
  {
    id: 'nightlight', title: 'Night light', blurb: 'An LDR divider on A0 turns an LED on in the dark.', icon: 'moon',
    make() {
      const c = ledOn('D13', 4, 'white', 'GND', 150);
      c.parts.push(bbPart('ldr', 'ldr', 18, 'h', { lux: 300 }), bbPart('rl', 'resistor', 19, 'g', { ohms: 10000 }));
      c.wires.push(W(B('5V'), H(18, 'j'), 'red'), W(B('A0'), H(19, 'j'), 'green'), W(B('GND_2'), H(23, 'j'), 'black'));
      return project('Night light', `// Night light: LDR from 5 V to A0, 10 kΩ from A0 to GND.
// Darker → higher LDR resistance → lower voltage on A0.
const int SENSOR = A0;
const int LED_PIN = 13;
const int THRESHOLD = 300;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(SENSOR);
  Serial.println(light);
  digitalWrite(LED_PIN, light < THRESHOLD ? HIGH : LOW);
  delay(100);
}
`, c);
    },
  },
];
