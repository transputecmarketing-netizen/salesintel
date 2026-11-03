// Breakout modules for the Tinker Lab scene (units: cm, y up).
//
// Two mounting styles:
//  • Free-standing modules: make*(pos, opts) — `pos` is the world point under the
//    module's bottom centre, opts.rotY rotates it about Y. They expose a male
//    header with pins pointing UP and return
//      { group, pick, anchor, pins: [names…], pin(name) → world Vector3 of the pin tip, … }
//    pin() is evaluated live (handles rotY / tilting / re-parenting).
//  • Breadboard modules: make*(holes) — `holes` are world Vector3s from bb.hole();
//    they stand on their legs and return { group, pick, anchor, … }.
// Anything animated exposes tick(dt).
export { makeBreakout, PITCH, PIN_TIP } from './modules/common.js';
export { makeOLED, makeLCD1602, makeNeoPixelRing, makeNeoPixelStrip, makeSevenSegment, makeDIP, makeLEDBar } from './modules/displays.js';
export { makeStepper, makeRelay, makeLamp, makeL298N } from './modules/actuators.js';
export { makePIR, makePerson, makeDHT11, makeIRReceiver, makeRemote, makeMPU6050, makeSoilSensor, makeSoundSensor, makeGasSensor, makeFlameSensor, makeFSR } from './modules/sensors.js';
export { makeJoystick, makeKeypad, makeRotaryEncoder } from './modules/inputs.js';
export { makeRTC, makeSDCard, makeHC05 } from './modules/misc.js';
export { makeRobotCar } from './modules/robot.js';
