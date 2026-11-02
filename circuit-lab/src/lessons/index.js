// Course registry: tracks of lessons from beginner to advanced.
import { foundations } from './foundations.js';
import { foundationsExtra, parts as pFound } from './foundations-extra.js';
import { sensorsA, parts as pSensA } from './sensors-a.js';
import { sensorsB, parts as pSensB } from './sensors-b.js';
import { displaysA, parts as pDispA } from './displays-a.js';
import { displaysB, parts as pDispB } from './displays-b.js';
import { advanced, parts as pAdv } from './advanced.js';
import { esp32, parts as pEsp } from './esp32.js';
import { pico, parts as pPico } from './pico.js';
import { jetson, parts as pJet } from './jetson.js';
import { projects, parts as pProj } from './projects.js';

// the Foundations capstone ("Build a project") stays last in its track
const capstone = foundations.find((l) => l.id === 'project');
const foundationsAll = [...foundations.filter((l) => l !== capstone), ...foundationsExtra, capstone];

/**
 * Each track: { id, title, level, board, lang, blurb, icon, lessons }.
 * Lesson ids must be unique across the whole course (they are used in URLs).
 */
export const TRACKS = [
  { id: 'foundations', title: 'Foundations', level: 'Beginner', board: 'uno', icon: 'chip', blurb: 'Your first circuits: LEDs, buttons, knobs, sound, motors, timing — and your first complete project.', lessons: foundationsAll },
  { id: 'sensors', title: 'Sensors & Inputs', level: 'Beginner → Intermediate', board: 'uno', icon: 'radar', blurb: 'Let your projects sense the world: motion, temperature, humidity, sound, gas, flame, touch, tilt, remotes and keypads.', lessons: [...sensorsA, ...sensorsB] },
  { id: 'output', title: 'Displays, Light & Motion', level: 'Intermediate', board: 'uno', icon: 'palette', blurb: 'Show information and move things: 7-segment, LCD and OLED displays, NeoPixels, shift registers, steppers, relays and motor drivers.', lessons: [...displaysA, ...displaysB] },
  { id: 'advanced', title: 'Advanced Arduino', level: 'Advanced', board: 'mega', icon: 'gear', blurb: 'Write firmware like a pro on the Mega and Nano: interrupts, non-blocking state machines, I²C, SPI, EEPROM, data logging and low power.', lessons: advanced },
  { id: 'esp32', title: 'IoT with ESP32', level: 'Intermediate → Advanced', board: 'esp32', icon: 'globe', blurb: 'Connect to the internet: Wi-Fi, web servers, live dashboards, MQTT, Bluetooth, touch sensing and deep sleep.', lessons: esp32 },
  { id: 'pico', title: 'MicroPython on Pico', level: 'Intermediate', board: 'pico', lang: 'python', icon: 'code', blurb: 'Program the RP2040 in Python: pins, interrupts, PWM, ADC, I²C displays and addressable LEDs.', lessons: pico },
  { id: 'jetson', title: 'Edge AI with Jetson Nano', level: 'Advanced', board: 'jetson', lang: 'python', icon: 'radar', blurb: 'Run neural networks at the edge: GPIO from Python, cameras, image classification, object detection and an AI security camera.', lessons: jetson },
  { id: 'projects', title: 'Capstone Projects', level: 'Advanced', board: 'uno', icon: 'traffic', blurb: 'Complete builds that combine everything: a smart plant, a weather station, an obstacle-avoiding robot, a smart home and a security system.', lessons: projects },
].filter((t) => t.lessons.length);

export const lessons = [];
for (const t of TRACKS) {
  t.lessons.forEach((l, i) => {
    l.track = t;
    l.indexInTrack = i;
    l.board ??= t.board;
    l.lang ??= t.lang ?? 'cpp';
    l.level ??= t.level;
    lessons.push(l);
  });
}
// parts contributed by track files (each may export `parts`)
export const extraParts = [...pFound, ...pSensA, ...pSensB, ...pDispA, ...pDispB, ...pAdv, ...pEsp, ...pPico, ...pJet, ...pProj];

{
  const seen = new Set();
  for (const l of lessons) {
    if (seen.has(l.id)) console.warn(`Duplicate lesson id: ${l.id}`);
    seen.add(l.id);
  }
}

/** Parts glossary for the "Components" flyout: [icon, name, description, lessonId]. */
export const glossary = [
  ['chip', 'Microcontroller board', 'Runs your sketch and talks to everything else.', 'board'],
  ['pins', 'Breadboard', 'Push-in prototyping board; each 5-hole column is connected.', 'blink'],
  ['led', 'LED', 'Light-emitting diode. Long leg +, short leg –.', 'blink'],
  ['resistor', 'Resistor', 'Limits current. Coloured bands give its value.', 'blink'],
  ['button', 'Push button', 'Momentary switch for digital input.', 'button'],
  ['knob', 'Potentiometer', 'Variable resistor for analog input.', 'knob'],
  ['palette', 'RGB LED', 'Red, green and blue LEDs in one package.', 'rgb'],
  ['sun', 'Light sensor (LDR)', 'Resistance falls as light increases.', 'light'],
  ['sound', 'Piezo buzzer', 'Makes tones when its pin flips quickly.', 'sound'],
  ['transistor', 'Transistor', 'An electronic switch for bigger loads.', 'motor'],
  ['diode', 'Diode', 'Lets current flow one way only.', 'motor'],
  ['motor', 'DC motor', 'Spins when current flows; speed via PWM.', 'motor'],
  ['thermo', 'TMP36', 'Analog temperature sensor, 10 mV per °C.', 'heat'],
  ['servo', 'Servo', 'Motor that turns to an exact angle.', 'servo'],
  ['radar', 'HC-SR04', 'Ultrasonic distance sensor.', 'distance'],
  ['traffic', 'Traffic light module', 'Red, amber and green LEDs on one stick.', 'project'],
];
