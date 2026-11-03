// Track — How Sensors See: explainer lessons on how machines detect the world.
// Each lesson mounts an animated, hand-drawn scene from src/explainers/scenes/sensing/.
import { lazy } from '../explainers/lazy.js';
import { thumb } from '../explainers/thumbs.js';

const L = (id, o) => ({ id, thumb: () => thumb(id), ...o });

export const sensing = [
  // ------------------------------------------------------------------ 1
  L('sense-ultrasonic', {
    title: 'Ultrasonic echoes', icon: 'radar',
    explainer: lazy(() => import('../explainers/scenes/sensing/ultrasonic.js')),
    overview: {
      heading: 'Seeing with sound',
      text: 'An ultrasonic sensor chirps at 40 kHz, far too high for us to hear, and times how long the echo takes to come back. Sound travels at 343 m/s, so distance = time × speed ÷ 2. Drag the wall and watch the echo time change.',
      features: [['sound', '40 kHz chirp, 8 cycles'], ['timer', '≈ 58 µs of echo per centimetre'], ['hand', 'Drag the wall closer and further']],
    },
    pinout: [
      ['Ultrasound', 'Sound above about 20 kHz', 'Too high for human ears'],
      ['Time of flight', 'How long a signal takes to travel', 'There and back for an echo'],
      ['TRIG', 'Starts a measurement', '10 µs pulse on an HC-SR04'],
      ['ECHO', 'Stays HIGH for the round trip', 'pulseIn() measures it'],
      ['Speed of sound', '343 m/s at 20 °C', 'Faster in warm air'],
    ],
    example: {
      text: 'Parking sensors in car bumpers, robot vacuum cleaners and water-tank level gauges all measure distance with ultrasonic echoes. Bats and dolphins have done it for millions of years.',
      points: ['Build it in the Arduino lesson “Read a sensor”', 'Work out the echo time for an object 2 m away'],
    },
    specs: [['Frequency', '40 kHz'], ['Burst', '8 cycles (200 µs)'], ['Range (HC-SR04)', '≈ 2–400 cm'], ['Speed of sound', '343 m/s at 20 °C (331 + 0.6 × °C)'], ['Echo time', '≈ 58.3 µs per cm of distance'], ['Formula', 'd = t × 343 ÷ 2']],
    quiz: [
      { q: 'Why do we divide by 2 in distance = time × speed ÷ 2?', options: ['Sound slows down', 'The sound travels there and back', 'The sensor has two eyes', 'To convert to cm'], answer: 1, explain: 'The echo time covers the trip to the object and back again.' },
      { q: 'Why can’t we hear the sensor?', options: ['It is silent', '40 kHz is above human hearing', 'It is too quiet', 'It uses light'], answer: 1, explain: 'People hear up to about 20 kHz; 40 kHz is ultrasound.' },
      { q: 'An echo comes back after 5.8 ms. How far is the wall?', options: ['≈ 10 cm', '≈ 1 m', '≈ 2 m', '≈ 10 m'], answer: 1, explain: '0.0058 s × 343 m/s ÷ 2 ≈ 1.0 m.' },
    ],
    challenges: [
      'Drag the wall until the echo time is 2,000 µs. How far is it?',
      'Why might a soft, fluffy object be hard for the sensor to see?',
      'Use an HC-SR04 in the Arduino lesson “Read a sensor” and print the distance.',
    ],
  }),
  // ------------------------------------------------------------------ 2
  L('sense-infrared', {
    title: 'Infrared and remotes', icon: 'sun',
    explainer: lazy(() => import('../explainers/scenes/sensing/infrared.js')),
    overview: {
      heading: 'Invisible light',
      text: 'Infrared is light just beyond red. Obstacle and line sensors shine it and measure what bounces back. TV remotes flash it in quick 38 kHz bursts that spell out a code, so ordinary lamps and sunlight can’t confuse the receiver.',
      features: [['sun', '940 nm: light we can’t see'], ['wave', '38 kHz bursts'], ['code', 'A remote code, bit by bit']],
    },
    pinout: [
      ['Infrared (IR)', 'Light with longer waves than red', '≈ 700 nm to 1 mm'],
      ['IR LED', 'Emits infrared', 'Remotes use ≈ 940 nm'],
      ['Photodiode', 'Turns light into a small current', 'The “eye” of the sensor'],
      ['Carrier (38 kHz)', 'The fast blinking inside each flash', 'The receiver ignores anything else'],
      ['NEC code', 'A common remote format', 'Address + command, 32 bits'],
    ],
    example: {
      text: 'Line-following robots use IR sensors pointed at the floor: white bounces light back, black tape doesn’t. Automatic taps and hand dryers use the same reflection trick.',
      points: ['Look at a remote through a phone camera while pressing a button', 'Decode a real remote in the Arduino lesson “Remote control”'],
    },
    specs: [['Remote wavelength', '≈ 940 nm'], ['Carrier', '38 kHz'], ['NEC lead burst', '9 ms + 4.5 ms gap'], ['NEC bit', '562.5 µs burst; gap 562.5 µs (0) or 1687.5 µs (1)'], ['Frame', '32 bits, ≈ 68 ms'], ['Receiver output', 'LOW while it hears a burst']],
    quiz: [
      { q: 'Why does a remote flash in 38 kHz bursts?', options: ['To save batteries', 'So the receiver can ignore sunlight and lamps', 'To make it visible', 'To change channels faster'], answer: 1, explain: 'The receiver only responds to light blinking at 38 kHz, which sunlight and bulbs don’t do.' },
      { q: 'A line-following robot sees a black line because…', options: ['black reflects more IR', 'black absorbs IR, so less comes back', 'black is warmer', 'black glows'], answer: 1, explain: 'Dark surfaces absorb most of the light, so the sensor receives less.' },
      { q: 'Can people see infrared?', options: ['Yes, it is red', 'No, it is beyond what our eyes detect', 'Only at night', 'Only through glasses'], answer: 1, explain: 'Our eyes stop at about 700 nm; remotes use about 940 nm.' },
    ],
    challenges: [
      'Press buttons 1, 2 and 3 and compare the command bits.',
      'Why is the command sent twice, once inverted? (Hint: checking for errors.)',
      'Control an LED with a remote in the Arduino lesson “Remote control”.',
    ],
  }),
  // ------------------------------------------------------------------ 3
  L('sense-pir', {
    title: 'Motion sensors (PIR)', icon: 'heart',
    explainer: lazy(() => import('../explainers/scenes/sensing/pir.js')),
    overview: {
      heading: 'It feels your warmth',
      text: 'A PIR sensor sends nothing out. It watches the infrared glow of warm bodies with two side-by-side halves. Its dome splits the room into zones, so walking past makes the halves disagree, and that change triggers the output.',
      features: [['heart', 'Passive: it only listens for heat'], ['radar', 'A lens makes many zones'], ['timer', 'Stays HIGH for a few seconds']],
    },
    pinout: [
      ['PIR', 'Passive infrared', 'Emits nothing'],
      ['Pyroelectric', 'Makes a voltage when its temperature changes', 'Reacts to change, not to steady heat'],
      ['Fresnel lens', 'The ridged plastic dome', 'Splits the view into zones'],
      ['OUT', 'Digital output', 'HIGH when motion is seen'],
      ['Hold time', 'How long OUT stays HIGH', 'Adjustable on most modules'],
    ],
    example: {
      text: 'Automatic porch lights, burglar alarms and hand dryers use PIR sensors. They’re cheap and use almost no power, which is why battery alarms can run for years.',
      points: ['Build one in the Arduino lesson “Motion alarm”', 'Why might a PIR miss someone walking straight towards it?'],
    },
    specs: [['Body heat glow', 'Peaks near 9–10 µm wavelength'], ['Detection range (HC-SR501)', 'Up to ≈ 7 m'], ['Field of view', '≈ 110–120°'], ['Output', '3.3 V HIGH'], ['Hold time', '≈ 3 s to 5 min (adjustable)'], ['Warm-up', '≈ 30–60 s after power on']],
    quiz: [
      { q: 'What does a PIR sensor detect?', options: ['Sound', 'Changes in infrared heat across its zones', 'Radio waves', 'Visible light only'], answer: 1, explain: 'It senses the change when a warm body moves between zones.' },
      { q: 'Why doesn’t it trigger when you stand perfectly still?', options: ['You stop being warm', 'It only reacts to change', 'The battery runs out', 'The dome blocks you'], answer: 1, explain: 'The pyroelectric element only makes a signal when the heat it sees changes.' },
      { q: 'What does “passive” mean here?', options: ['It is slow', 'It sends nothing out, it only receives', 'It has no power', 'It can’t be turned off'], answer: 1, explain: 'Unlike ultrasonic or radar sensors, a PIR emits no signal at all.' },
    ],
    challenges: [
      'Drag the person slowly through one zone. When does the signal swing?',
      'Why are PIR alarms often fooled by a hot radiator switching on?',
      'Wire one up in the Arduino lesson “Motion alarm”.',
    ],
  }),
  // ------------------------------------------------------------------ 4
  L('sense-radar', {
    title: 'Radar and Doppler', icon: 'radar',
    explainer: lazy(() => import('../explainers/scenes/sensing/radar.js')),
    overview: {
      heading: 'Echoes at light speed',
      text: 'Radar sends radio waves and times their echoes. They travel at light speed, so a microsecond there and back means 150 m. If the target moves, the echo’s frequency shifts: the Doppler effect lets a speed gun measure a car.',
      features: [['radar', 'Echo time gives distance'], ['car', 'Doppler shift gives speed'], ['globe', 'A sweeping scope maps the sky']],
    },
    pinout: [
      ['Radio wave', 'Light we can’t see, with long waves', 'Travels at ≈ 300,000 km/s'],
      ['Echo', 'The part that bounces back', 'Weak, so radars listen carefully'],
      ['Doppler effect', 'Frequency shift from motion', 'Like a passing siren changing pitch'],
      ['Speed gun', 'A Doppler radar', 'Often 24 GHz (K band)'],
      ['PPI scope', 'The round radar display', 'Each dot is an echo'],
    ],
    example: {
      text: 'Air-traffic control, weather forecasts (rain reflects radar), ship navigation and modern cars with adaptive cruise control all use radar. Motion-sensing lights and some doorbells use tiny Doppler radar modules.',
      points: ['Work out the Doppler shift for 50 km/h', 'Why can radar see through fog and cloud but cameras can’t?'],
    },
    specs: [['Speed of light', '299,792 km/s'], ['Range rule', '1 µs round trip ≈ 150 m'], ['Speed gun frequency', '24.125 GHz'], ['Doppler shift', 'Δf = 2 × v × f ÷ c'], ['At 100 km/h', '≈ 4.5 kHz shift'], ['Car radar', '≈ 77 GHz']],
    quiz: [
      { q: 'An echo returns after 2 µs. How far is the target?', options: ['150 m', '300 m', '600 m', '2 km'], answer: 1, explain: 'Light covers 600 m in 2 µs; half of that is the distance: 300 m.' },
      { q: 'A car drives towards a speed gun. The echo’s frequency is…', options: ['lower', 'higher', 'the same', 'zero'], answer: 1, explain: 'Approaching objects squash the reflected waves together, raising the frequency.' },
      { q: 'Which is the same “Doppler” effect?', options: ['An echo in a cave', 'A siren sounding higher as it comes towards you', 'A rainbow', 'A shadow'], answer: 1, explain: 'Moving sources or reflectors shift the frequency of sound and radio alike.' },
    ],
    challenges: [
      'Set the car speed to 50 km/h and read the frequency shift.',
      'If the shift doubles, what happened to the speed?',
      'Find three radars you pass in a normal week.',
    ],
  }),
  // ------------------------------------------------------------------ 5
  L('sense-lidar', {
    title: 'Lidar point clouds', icon: 'radar',
    explainer: lazy(() => import('../explainers/scenes/sensing/lidar.js')),
    overview: {
      heading: 'A map made of dots',
      text: 'Lidar fires laser pulses and times their return to the nanosecond. A spinning mirror sweeps the beam around, and each echo becomes a dot. Thousands of dots form a point cloud: a map robots and self-driving cars use to see.',
      features: [['sun', 'Invisible infrared laser'], ['timer', '1 ns ≈ 15 cm of distance'], ['hand', 'Drag the robot round the room']],
    },
    pinout: [
      ['Lidar', 'Light detection and ranging', 'Radar, but with laser light'],
      ['Time of flight', 'Pulse travel time', 'Measured in nanoseconds'],
      ['Point cloud', 'All the measured dots', 'Can be millions per second'],
      ['Spinning scanner', 'Mirror or head that rotates', 'Sweeps 360°'],
      ['Occlusion', 'Hidden behind something', 'The laser can’t see round corners'],
    ],
    example: {
      text: 'Robot vacuum cleaners map your rooms with a little spinning lidar on top. Self-driving cars, drones surveying forests and phones with depth sensors use lidar too.',
      points: ['Find the “shadow” behind the pillar where no dots appear', 'How many centimetres is one nanosecond of round trip?'],
    },
    specs: [['Typical wavelength', '905 nm or 1550 nm (infrared)'], ['Light speed', '0.3 m per nanosecond'], ['Range rule', '1 ns round trip ≈ 15 cm'], ['10 m wall', '≈ 67 ns round trip'], ['Robot-vacuum lidar', '≈ 5–10 turns/s, ≈ 2,000–8,000 points/s'], ['Map scale here', '64 px per metre']],
    quiz: [
      { q: 'How long does light take to reach a wall 15 m away and return?', options: ['10 ns', '50 ns', '100 ns', '1 ms'], answer: 2, explain: '30 m ÷ 0.3 m per ns = 100 ns.' },
      { q: 'Why are there no dots behind the pillar?', options: ['The laser is off there', 'The pillar blocks the beam (occlusion)', 'The room ends', 'Dots are too small'], answer: 1, explain: 'Lidar only sees surfaces the beam can reach in a straight line.' },
      { q: 'What does the spinning mirror do?', options: ['Cools the laser', 'Sweeps the beam all round', 'Makes the light red', 'Stores the map'], answer: 1, explain: 'Rotating the beam lets one laser measure every direction.' },
    ],
    challenges: [
      'Drag the robot into a corner. Which walls disappear from its view?',
      'Work out the round-trip time for 1 m.',
      'Compare lidar with the ultrasonic sensor: what’s similar, what’s different?',
    ],
  }),
  // ------------------------------------------------------------------ 6
  L('sense-camera', {
    title: 'How a camera sees', icon: 'sun',
    explainer: lazy(() => import('../explainers/scenes/sensing/camera.js')),
    overview: {
      heading: 'Millions of light buckets',
      text: 'A lens focuses the world onto a grid of pixels, each counting light as a number. Pixels can’t see colour, so a mosaic of red, green and blue filters sits on top and the camera fills in the gaps. Exposure trades brightness against blur.',
      features: [['sun', 'Pixels count light'], ['palette', 'The Bayer filter: RGGB'], ['timer', 'Shutter speed and motion blur']],
    },
    pinout: [
      ['Pixel', 'One tiny light sensor', 'A 12 MP camera has 12 million'],
      ['Brightness value', 'How much light a pixel got', '0–255 in an 8-bit image'],
      ['Bayer filter', 'Red, green and blue filter mosaic', 'Two greens for every red and blue'],
      ['Demosaicing', 'Filling in the missing colours', 'From each pixel’s neighbours'],
      ['Exposure', 'How long the sensor collects light', 'Longer = brighter, but blurrier'],
    ],
    example: {
      text: 'Your phone camera, a webcam and the camera on a Jetson robot all work like this. AI vision starts from exactly these numbers: an image is just a grid of brightness values in three colours.',
      points: ['Try the Jetson lesson “Capture from the camera”', 'Why does a night photo of moving cars show light streaks?'],
    },
    specs: [['Grid in the animation', '24 × 16 pixels'], ['Phone camera', '12–50 million pixels'], ['Bayer pattern', 'R G / G B (50 % green)'], ['8-bit value', '0 (dark) to 255 (bright)'], ['Common shutter speeds', '1/4000 s to several seconds'], ['Image on the sensor', 'Upside down (the lens flips it)']],
    quiz: [
      { q: 'What does a single pixel measure on its own?', options: ['Colour', 'Brightness (amount of light)', 'Distance', 'Temperature'], answer: 1, explain: 'A bare pixel only counts light; filters add colour information.' },
      { q: 'Why are there twice as many green filters?', options: ['Green is cheaper', 'Our eyes are most sensitive to green', 'It looks nice', 'Red and blue are rare'], answer: 1, explain: 'Matching our eyes gives sharper-looking detail.' },
      { q: 'A longer exposure makes the photo…', options: ['darker and sharper', 'brighter but moving things blur', 'smaller', 'black and white'], answer: 1, explain: 'More light is collected, but anything moving smears across pixels.' },
    ],
    challenges: [
      'Slide the shutter until the sky turns white. What happened to the numbers?',
      'Look at the Filters view: which colour do you see most?',
      'Capture a frame in the Jetson lesson “Capture from the camera”.',
    ],
  }),
  // ------------------------------------------------------------------ 7
  L('sense-imu', {
    title: 'Accelerometers & gyros', icon: 'gear',
    explainer: lazy(() => import('../explainers/scenes/sensing/imu.js')),
    overview: {
      heading: 'A tiny mass on springs',
      text: 'Inside a motion-sensor chip a microscopic mass hangs on springs. Tilt or shake the chip and the mass moves; comb fingers measure the gap. A gyroscope wiggles a mass, and turning nudges it sideways. Phones use both.',
      features: [['gear', 'MEMS: machines on a chip'], ['bolt', 'Gravity reads as 1 g'], ['radar', 'Coriolis for turning']],
    },
    pinout: [
      ['Accelerometer', 'Measures acceleration and gravity', 'In g (1 g ≈ 9.81 m/s²)'],
      ['Gyroscope', 'Measures how fast it turns', 'In degrees per second'],
      ['Proof mass', 'The tiny moving weight', 'Fractions of a millimetre wide'],
      ['Capacitance', 'Stored charge between plates', 'Changes as the gap changes'],
      ['MEMS', 'Micro-electro-mechanical systems', 'Moving parts etched in silicon'],
    ],
    example: {
      text: 'Your phone rotates the screen, counts steps and steadies videos with these sensors. Drones and balancing robots read them hundreds of times a second to stay upright.',
      points: ['Read tilt in the Arduino lesson “Sense tilt”', 'Why does a phone lying flat read about 1 g on its Z axis?'],
    },
    specs: [['Gravity', '1 g ≈ 9.81 m/s²'], ['MPU-6050 accel ranges', '±2, 4, 8, 16 g'], ['MPU-6050 gyro ranges', '±250 to ±2000 °/s'], ['Proof mass size', '≈ 0.1–1 mm'], ['Interface', 'I²C'], ['Sign convention', 'Flat on a table reads +1 g on Z']],
    quiz: [
      { q: 'A phone lies perfectly still. Its accelerometer reads…', options: ['0 g on every axis', 'about 1 g, from gravity', '10 g', 'nothing'], answer: 1, explain: 'It always feels gravity, which is how it knows which way is down.' },
      { q: 'What does a gyroscope measure?', options: ['Temperature', 'How fast it is turning', 'Height', 'Light'], answer: 1, explain: 'Gyroscopes measure rotation rate, for example in degrees per second.' },
      { q: 'How does the chip sense the mass moving?', options: ['A camera', 'Comb fingers whose capacitance changes with the gap', 'A thermometer', 'Sound'], answer: 1, explain: 'Narrowing a gap raises the capacitance; the chip measures the difference.' },
    ],
    challenges: [
      'Tilt to 90°. What do X and Y read, and why?',
      'Why is a gyroscope needed when the accelerometer already knows “down”? (Hint: spin it flat.)',
      'Try the Arduino lesson “Sense tilt”.',
    ],
  }),
  // ------------------------------------------------------------------ 8
  L('sense-temp-light', {
    title: 'Heat and light sensors', icon: 'thermo',
    explainer: lazy(() => import('../explainers/scenes/sensing/temp-light.js')),
    overview: {
      heading: 'Resistance that responds',
      text: 'A thermistor’s resistance falls as it warms; a light-dependent resistor’s falls as light rises. Put either one in a voltage divider and the change becomes a voltage an Arduino can read as a number.',
      features: [['thermo', 'NTC thermistor curve'], ['sun', 'LDR on a log scale'], ['chip', 'Divider → analogRead()']],
    },
    pinout: [
      ['NTC thermistor', 'Resistance falls as it warms', '10 kΩ at 25 °C is common'],
      ['B value', 'How steep the curve is', '≈ 3950 K for common parts'],
      ['LDR', 'Light-dependent resistor', 'Bright: ~1 kΩ, dark: ~1 MΩ'],
      ['Lux', 'Brightness of light falling on a surface', 'Office ≈ 500 lux, sunlight ≈ 100,000'],
      ['Divider', 'Sensor + fixed resistor', 'Turns resistance into voltage'],
    ],
    example: {
      text: 'Thermostats, 3D-printer nozzles and fridges use thermistors. Streetlights that switch on at dusk and phone screens that dim in the dark use light sensors.',
      points: ['Try the Arduino lessons “Sense heat” and “Sense light”', 'Why does a log scale suit the LDR graph?'],
    },
    specs: [['Thermistor', '10 kΩ at 25 °C, B = 3950'], ['At 0 °C', '≈ 33.6 kΩ'], ['At 50 °C', '≈ 3.6 kΩ'], ['LDR (GL5528-style)', '≈ 8–20 kΩ at 10 lux'], ['LDR dark', '≥ 1 MΩ'], ['Divider here', 'Sensor on top, 10 kΩ to GND']],
    quiz: [
      { q: 'An NTC thermistor warms up. Its resistance…', options: ['rises', 'falls', 'stays the same', 'becomes zero'], answer: 1, explain: 'NTC means negative temperature coefficient: warmer, lower resistance.' },
      { q: 'An LDR goes from a dark cupboard into sunlight. Its resistance…', options: ['rises a lot', 'falls a lot', 'stays the same', 'flips sign'], answer: 1, explain: 'More light frees more charge carriers, so resistance drops, by up to a thousand times.' },
      { q: 'Why put the sensor in a voltage divider?', options: ['To protect it from light', 'Because an Arduino measures voltage, not resistance', 'To make it faster', 'It looks neater'], answer: 1, explain: 'The divider turns the changing resistance into a changing voltage on A0.' },
    ],
    challenges: [
      'Find the temperature where the thermistor is exactly 10 kΩ.',
      'In the divider step, what A0 reading do you get at 0 °C and at 50 °C?',
      'Build the Arduino lesson “Sense light” and make a night light.',
    ],
  }),
  // ------------------------------------------------------------------ 9
  L('sense-gps', {
    title: 'How GPS finds you', icon: 'globe',
    explainer: lazy(() => import('../explainers/scenes/sensing/gps.js')),
    overview: {
      heading: 'Circles in the sky',
      text: 'GPS satellites broadcast the exact time from atomic clocks. Your receiver times each signal’s trip to work out distances, and where the distance circles meet, that’s you. A fourth satellite fixes the receiver’s own clock error.',
      features: [['globe', 'Orbits drawn to scale'], ['timer', 'Delay × light speed = distance'], ['hand', 'Drag yourself across the map']],
    },
    pinout: [
      ['GPS', 'Global Positioning System', 'US; others: Galileo, GLONASS, BeiDou'],
      ['Atomic clock', 'A super-accurate clock', 'Loses about a second in millions of years'],
      ['Trilateration', 'Position from distances', 'Where the circles (spheres) meet'],
      ['Clock bias', 'The receiver’s clock error', 'Solved using a 4th satellite'],
      ['Fix', 'A calculated position', 'Needs at least 4 satellites'],
    ],
    example: {
      text: 'Phones, car satnavs, delivery drones and farm tractors use GPS. Even banks and phone networks use GPS signals just for the accurate time.',
      points: ['Look at a GPS app that lists satellites in view', 'How far would a 10 µs clock error move you?'],
    },
    specs: [['Satellites', '≈ 31 operational'], ['Orbit height', '≈ 20,200 km'], ['Orbit time', '≈ 12 hours'], ['Signal delay', '≈ 67–86 ms'], ['Clock error effect', '1 µs ≈ 300 m'], ['Phone accuracy', '≈ 5 m in open sky']],
    quiz: [
      { q: 'Why does a receiver need a fourth satellite?', options: ['For backup only', 'To solve for its own clock error', 'To get colour', 'To make it faster'], answer: 1, explain: 'Three distances fix the position; the fourth lets it correct its cheap clock.' },
      { q: 'A clock is 1 µs wrong. The position can be off by about…', options: ['3 cm', '3 m', '300 m', '300 km'], answer: 2, explain: 'Light travels about 300 m in a microsecond.' },
      { q: 'A GPS signal from a satellite overhead takes about…', options: ['1 second', '67 milliseconds', '1 microsecond', '1 hour'], answer: 1, explain: '20,200 km ÷ 300,000 km/s ≈ 0.067 s.' },
    ],
    challenges: [
      'Drag the receiver: do the three circles always meet at one point?',
      'Set a 2 µs clock error. How big is the gap between the circles in metres?',
      'Read GPS data on a microcontroller in a later IoT project.',
    ],
  }),
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['radar', 'Lidar', 'Laser distance scanner that builds a point cloud.', 'sense-lidar'],
  ['globe', 'GPS receiver', 'Finds its position from satellite signal timing.', 'sense-gps'],
  ['thermo', 'Thermistor', 'Resistor whose value falls as it warms (NTC).', 'sense-temp-light'],
];
