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
import { basics, parts as pBasics } from './basics.js';
import { sensing, parts as pSensing } from './sensing.js';
import { computing, parts as pComputing } from './computing.js';
import { nodemcu, parts as pNode } from './nodemcu.js';
import { raspberryPi, parts as pRpi } from './raspberry-pi.js';
import { jetsonOrin, parts as pOrin } from './jetson-orin.js';
import { projectsIndustry, parts as pInd } from './projects-industry.js';
import { projectsCity, parts as pCity } from './projects-city.js';
import { projectsPlanet, parts as pPlanet } from './projects-planet.js';
import { projectsAI, parts as pAI } from './projects-ai.js';

// the Foundations capstone ("Build a project") stays last in its track
const capstone = foundations.find((l) => l.id === 'project');
const foundationsAll = [...foundations.filter((l) => l !== capstone), ...foundationsExtra, capstone];

/**
 * Each track: { id, title, level, board, lang, blurb, icon, lessons }.
 * Lesson ids must be unique across the whole course (they are used in URLs).
 */
export const TRACKS = [
  { id: 'basics', title: 'Electronics Basics', level: 'Beginner', board: null, icon: 'bolt', group: 'Start here', blurb: 'No board, no code: what electricity is, how voltage, current and resistance work, and what every common component does, told in pictures and animations.', lessons: basics },
  { id: 'sensing', title: 'How Sensors See', level: 'Beginner', board: null, icon: 'radar', group: 'Start here', blurb: 'How machines sense the world: ultrasonic echoes, infrared, radar, lidar, cameras, accelerometers and more, animated step by step.', lessons: sensing },
  { id: 'computing', title: 'How Computers Think', level: 'Beginner → Intermediate', board: null, icon: 'chip', group: 'Start here', blurb: 'From a switch to a processor: binary, logic gates, memory, the fetch-decode-execute cycle, x86 versus ARM, GPUs and AI accelerators.', lessons: computing },
  { id: 'foundations', title: 'Arduino Foundations', level: 'Beginner', board: 'uno', icon: 'chip', group: 'Microcontrollers', blurb: 'Your first circuits on an Arduino-style board: LEDs, buttons, knobs, sound, motors, timing and your first complete project.', lessons: foundationsAll },
  { id: 'sensors', title: 'Sensors & Inputs', level: 'Beginner → Intermediate', board: 'uno', icon: 'radar', group: 'Microcontrollers', blurb: 'Let your projects sense the world: motion, temperature, humidity, sound, gas, flame, touch, tilt, remotes and keypads.', lessons: [...sensorsA, ...sensorsB] },
  { id: 'output', title: 'Displays, Light & Motion', level: 'Intermediate', board: 'uno', icon: 'palette', group: 'Microcontrollers', blurb: 'Show information and move things: 7-segment, LCD and OLED displays, NeoPixels, shift registers, steppers, relays and motor drivers.', lessons: [...displaysA, ...displaysB] },
  { id: 'advanced', title: 'Advanced Arduino', level: 'Advanced', board: 'mega', icon: 'gear', group: 'Microcontrollers', blurb: 'Write firmware like a pro on the Mega and Nano: interrupts, non-blocking state machines, I²C, SPI, EEPROM, data logging and low power.', lessons: advanced },
  { id: 'esp32', title: 'IoT with ESP32 & NodeMCU', level: 'Intermediate → Advanced', board: 'esp32', icon: 'globe', group: 'Connected devices', blurb: 'Connect to the internet: Wi-Fi, web servers, live dashboards, MQTT, Bluetooth, touch sensing and deep sleep, on the ESP32 and the ESP8266 NodeMCU.', lessons: [...esp32, ...nodemcu] },
  { id: 'pico', title: 'MicroPython on Pico', level: 'Intermediate', board: 'pico', lang: 'python', icon: 'code', group: 'Connected devices', blurb: 'Program the RP2040 in Python: pins, interrupts, PWM, ADC, I²C displays and addressable LEDs.', lessons: pico },
  { id: 'raspberry-pi', title: 'Raspberry Pi', level: 'Intermediate → Advanced', board: 'rpi5', lang: 'python', icon: 'gear', group: 'Single-board computers', blurb: 'A full Linux computer on your desk: GPIO with Python, sensors, the camera, a web dashboard and a home server.', lessons: raspberryPi },
  { id: 'jetson', title: 'Edge AI with NVIDIA Jetson', level: 'Advanced', board: 'jetson', lang: 'python', icon: 'radar', group: 'Single-board computers', blurb: 'Run neural networks at the edge on the Jetson Nano and Orin Nano: GPIO, cameras, classification, detection, tracking and an AI security camera.', lessons: [...jetson, ...jetsonOrin] },
  { id: 'industry', title: 'Robotics & Industry', level: 'Advanced', board: 'uno', icon: 'gear', group: 'Capstone projects', blurb: 'Pick-and-place robot arms, conveyor sorting, line followers and factory automation, built step by step.', lessons: projectsIndustry },
  { id: 'city', title: 'Smart Cities & Mobility', level: 'Advanced', board: 'uno', icon: 'traffic', group: 'Capstone projects', blurb: 'Adaptive traffic lights, speed cameras, smart parking and level crossings: the systems that run a city.', lessons: projectsCity },
  { id: 'planet', title: 'Planet & Environment', level: 'Intermediate → Advanced', board: 'esp32', icon: 'plant', group: 'Capstone projects', blurb: 'Wind turbines, solar trackers, air- and water-quality stations, wildfire alarms and smart farms that protect the planet.', lessons: projectsPlanet },
  { id: 'physical-ai', title: 'Physical AI', level: 'Advanced', board: 'jetson', lang: 'python', icon: 'radar', group: 'Capstone projects', blurb: 'AI that acts in the real world: waste sorting, wildlife cameras, gesture-controlled robots and machines that see and decide.', lessons: projectsAI },
  { id: 'projects', title: 'Home & Maker Projects', level: 'Advanced', board: 'uno', icon: 'traffic', group: 'Capstone projects', blurb: 'Complete builds for everyday life: a smart plant, a weather station, an obstacle-avoiding robot, a smart home and a security system.', lessons: projects },
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
export const extraParts = [...pFound, ...pSensA, ...pSensB, ...pDispA, ...pDispB, ...pAdv, ...pEsp, ...pPico, ...pJet, ...pProj, ...pBasics, ...pSensing, ...pComputing, ...pNode, ...pRpi, ...pOrin, ...pInd, ...pCity, ...pPlanet, ...pAI];

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
