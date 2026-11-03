// Track — Electronics Basics: explainer lessons (no board, no code), told in pictures.
// Each lesson mounts an animated, hand-drawn scene from src/explainers/scenes/basics/.
import { lazy } from '../explainers/lazy.js';
import { thumb } from '../explainers/thumbs.js';

const L = (id, o) => ({ id, thumb: () => thumb(id), ...o });

export const basics = [
  // ------------------------------------------------------------------ 1
  L('basics-electricity', {
    title: 'What is electricity?', icon: 'bolt',
    explainer: lazy(() => import('../explainers/scenes/basics/electricity.js')),
    overview: {
      heading: 'Electrons on the move',
      text: 'Everything is made of atoms, and every atom has electrons. In a metal wire some of them roam free. A battery gives them a push: they drift slowly, but the push itself races along the wire almost instantly.',
      features: [['bolt', 'Atoms, nuclei and electrons'], ['wave', 'Slow drift, fast push'], ['info', 'The water analogy, used honestly']],
    },
    pinout: [
      ['Atom', 'The tiny building block of everything', 'A nucleus with electrons around it'],
      ['Electron', 'A tiny particle with negative (−) charge', 'Electric current is moving charge'],
      ['Conductor', 'A material whose electrons move easily', 'Copper, aluminium, gold'],
      ['Insulator', 'A material that holds its electrons tight', 'Plastic, rubber, glass'],
      ['Drift', 'The slow, overall movement of electrons', 'Fractions of a millimetre per second'],
    ],
    example: {
      text: 'Flip a light switch and the lamp comes on at once, even though each electron in the wire creeps along slower than a snail. The wire is already full of electrons; the battery or the mains pushes them all at the same time.',
      points: ['Find three conductors and three insulators in your room', 'Look at a cut cable: copper inside, plastic outside. Why both?'],
    },
    specs: [['Copper atom', '29 protons, 29 electrons'], ['Free electrons in copper', '≈ 8.5 × 10²⁸ per m³ (one per atom)'], ['Drift speed', '≈ 0.07 mm/s (1 A, 1 mm² copper)'], ['Random electron speed', '≈ 1,500 km/s'], ['Signal speed in a cable', '≈ 50–99 % of light speed'], ['Electron charge', '1.6 × 10⁻¹⁹ coulombs']],
    quiz: [
      { q: 'What actually moves when current flows in a copper wire?', options: ['Protons', 'Electrons', 'Copper atoms', 'Air'], answer: 1, explain: 'In metals the loose outer electrons drift along; the copper atoms stay in place.' },
      { q: 'How fast do electrons drift in a typical wire?', options: ['Near the speed of light', 'About 300 km/s', 'Less than a millimetre per second', 'About walking pace'], answer: 2, explain: 'Drift is very slow, around 0.07 mm/s for 1 A in a 1 mm² copper wire.' },
      { q: 'Why does a lamp light the instant you flip the switch?', options: ['Electrons sprint from the switch to the lamp', 'The wire is already full of electrons, so the push arrives almost at once', 'Light travels down the wire', 'The lamp guesses'], answer: 1, explain: 'Like marbles in a full tube: push one in and one pops out at the far end straight away.' },
      { q: 'Which is an insulator?', options: ['Copper', 'Gold', 'Rubber', 'Aluminium'], answer: 2, explain: 'Rubber holds its electrons tightly, so current can’t flow through it easily.' },
    ],
    challenges: [
      'Draw the water loop from the animation and label which part is like the battery, the wire and a resistor.',
      'Line up ten coins touching in a row and flick one into the end. Which coin moves? How is that like a wire?',
      'Where does the water analogy break down? (Hint: a cut pipe spills water. Does a cut wire spill electrons?)',
    ],
  }),
  // ------------------------------------------------------------------ 2
  L('basics-vir', {
    title: 'Volts, amps, ohms', icon: 'wave',
    explainer: lazy(() => import('../explainers/scenes/basics/vir.js')),
    overview: {
      heading: 'Push, flow and resistance',
      text: 'Voltage is the push that lifts electrons up an energy hill. Current is how many flow past each second. Resistance is how hard the path is. Change one and watch the others respond in a live circuit.',
      features: [['bolt', 'Voltage (V): the push'], ['wave', 'Current (A): the flow'], ['resistor', 'Resistance (Ω): what slows it']],
    },
    pinout: [
      ['Voltage (V)', 'Energy each charge gets', 'Measured across two points'],
      ['Current (A)', 'Charge flowing past each second', '1 A ≈ 6.2 × 10¹⁸ electrons per second'],
      ['Resistance (Ω)', 'How strongly a part resists flow', 'Turns electrical energy into heat'],
      ['mA', 'Milliamp, one thousandth of an amp', 'LEDs use about 5–20 mA'],
      ['Circuit', 'A complete loop', 'No loop, no current'],
    ],
    example: {
      text: 'A phone charger supplies 5 V. A tiny LED takes milliamps, a phone charging fast can take 2–3 A. Same voltage, very different currents, because the loads have very different resistance.',
      points: ['Read the label on a charger: find its volts and amps', 'An AA cell gives 1.5 V; a car battery 12 V. Which pushes harder?'],
    },
    specs: [['1 volt', '1 joule of energy per coulomb of charge'], ['1 amp', '1 coulomb per second'], ['1 ohm', '1 volt needed per amp of current'], ['AA cell', '1.5 V'], ['USB', '5 V'], ['UK/EU mains', '230 V AC (US: 120 V)']],
    quiz: [
      { q: 'Which quantity is the “push” in a circuit?', options: ['Current', 'Resistance', 'Voltage', 'Power'], answer: 2, explain: 'Voltage is the energy given to each bit of charge: the push.' },
      { q: 'You raise the voltage and keep the resistor the same. The current…', options: ['goes up', 'goes down', 'stays the same', 'stops'], answer: 0, explain: 'A bigger push drives more charge through the same resistance.' },
      { q: 'What unit is current measured in?', options: ['Volts', 'Ohms', 'Amps', 'Watts'], answer: 2, explain: 'Current is measured in amps (A), often milliamps (mA) in small circuits.' },
    ],
    challenges: [
      'In the animation, find two different settings that give the same current.',
      'Predict the current for 9 V and 1 kΩ, then check it on screen.',
      'Explain to a friend, using the energy hill, why a resistor gets warm.',
    ],
  }),
  // ------------------------------------------------------------------ 3
  L('basics-ohm', {
    title: "Ohm's law", icon: 'resistor',
    explainer: lazy(() => import('../explainers/scenes/basics/ohm.js')),
    overview: {
      heading: 'V = I × R',
      text: 'Voltage, current and resistance are tied together by one simple rule. Slide the voltage and the resistor, watch the current change, light an LED safely and see why fuses exist.',
      features: [['bolt', 'Double the voltage, double the current'], ['resistor', 'Double the resistance, half the current'], ['led', 'An LED takes about 2 V; the resistor takes the rest']],
    },
    pinout: [
      ['V (volts)', 'The push', 'Voltage across a part'],
      ['I (amps)', 'The flow', '1 mA = one thousandth of an amp'],
      ['R (ohms, Ω)', 'The resistance', 'How hard the part resists the flow'],
      ['V = I × R', "Ohm's law", 'Also I = V ÷ R and R = V ÷ I'],
      ['Fuse', 'A deliberate weak link', 'Its thin wire melts if the current is too high'],
    ],
    example: {
      text: 'Every LED on an Arduino board sits behind a resistor chosen with Ohm’s law. With a 5 V pin and a red LED (≈ 2 V), a 220 Ω resistor gives (5 − 2) ÷ 220 ≈ 14 mA: bright, and safe for both LED and pin.',
      points: ['Work out the current for 330 Ω, then check it in the animation', 'Find the smallest resistor that keeps a red LED under 20 mA at 5 V'],
    },
    specs: [['Ohm’s law', 'V = I × R'], ['Red LED forward voltage', '≈ 1.8–2.2 V'], ['Typical LED current', '5–20 mA'], ['LED absolute max (5 mm)', '≈ 30 mA'], ['Fuse in the animation', '100 mA fast-blow'], ['Common resistor rating', '¼ W (0.25 W)'], ['Power in a resistor', 'P = V × I = I² × R']],
    quiz: [
      { q: 'A 100 Ω resistor has 4 V across it. What current flows?', options: ['4 mA', '40 mA', '400 mA', '25 mA'], answer: 1, explain: 'I = V ÷ R = 4 V ÷ 100 Ω = 0.04 A, which is 40 mA.' },
      { q: 'You double the resistance and keep the voltage the same. The current…', options: ['doubles', 'stays the same', 'halves', 'drops to zero'], answer: 2, explain: 'Current is V ÷ R, so twice the R gives half the I.' },
      { q: 'A red LED (≈ 2 V) and a resistor run from 5 V. How many volts does the resistor get?', options: ['5 V', '2 V', '3 V', '7 V'], answer: 2, explain: 'The voltages around the loop add up to the supply: 5 V − 2 V = 3 V for the resistor.' },
      { q: 'What does a fuse do?', options: ['Makes current flow faster', 'Melts and breaks the circuit if the current is too high', 'Stores charge', 'Lights up when on'], answer: 1, explain: 'A fuse is a thin wire designed to melt before anything else overheats.' },
    ],
    challenges: [
      'In the animation, set 6 V and find the resistor that gives about 20 mA with the LED in. Check it with I = (6 − 2) ÷ R.',
      'Without the LED, which settings blow the 100 mA fuse? Predict three before you try them.',
      'Build it for real in the Arduino lesson “Blink an LED”, then swap 220 Ω for 1 kΩ and compare the brightness.',
    ],
  }),
  // ------------------------------------------------------------------ 4
  L('basics-switch', {
    title: 'Open and closed', icon: 'button',
    explainer: lazy(() => import('../explainers/scenes/basics/switch.js')),
    overview: {
      heading: 'No loop, no current',
      text: 'Current only flows round a complete loop. A switch is a deliberate gap you can open and close. See what a loose wire does, why a short circuit is dangerous, and how a push button differs from a toggle.',
      features: [['button', 'Tap the switch to open and close it'], ['bolt', 'A short circuit skips the load'], ['hand', 'Hold the push button to light the bulb']],
    },
    pinout: [
      ['Closed circuit', 'A complete loop', 'Current flows'],
      ['Open circuit', 'A gap somewhere in the loop', 'No current anywhere in it'],
      ['Switch', 'A gap you control', 'Toggle switches stay where you put them'],
      ['Push button', 'Momentary switch', 'Connects only while pressed'],
      ['Short circuit', 'A path with (almost) no resistance', 'Huge current, heat, danger'],
    ],
    example: {
      text: 'A torch, a doorbell and a keyboard key are all switches in a loop. A doorbell uses a push button: it rings only while you press. A light switch is a toggle: it stays on.',
      points: ['Find three toggles and three push buttons at home', 'Why does a fuse or circuit breaker protect against short circuits?'],
    },
    specs: [['Battery in the animation', '4.5 V (3 × AA)'], ['Switch resistance when closed', '< 0.1 Ω'], ['Open switch', 'Millions of ohms (air gap)'], ['AA short-circuit current', 'Several amps: gets hot fast'], ['Push-button switch', 'Normally open (NO)']],
    quiz: [
      { q: 'What happens to the bulb when you open the switch?', options: ['It gets brighter', 'It goes out', 'It stays the same', 'It flickers forever'], answer: 1, explain: 'The loop is broken, so no current can flow anywhere in it.' },
      { q: 'A wire connects straight from + to − with nothing in between. This is…', options: ['a parallel circuit', 'an open circuit', 'a short circuit', 'a fuse'], answer: 2, explain: 'With almost no resistance, a very large current flows and the wire and battery heat up.' },
      { q: 'A doorbell button is a…', options: ['toggle switch', 'push button (momentary)', 'fuse', 'resistor'], answer: 1, explain: 'It only connects while you hold it down.' },
    ],
    challenges: [
      'In the animation, list three different ways to make the bulb go out.',
      'Draw a circuit with two switches where the bulb lights only if both are closed.',
      'Try the Arduino lesson “Push a button” and see how a board reads a switch.',
    ],
  }),
  // ------------------------------------------------------------------ 5
  L('basics-series-parallel', {
    title: 'Series and parallel', icon: 'led',
    explainer: lazy(() => import('../explainers/scenes/basics/series-parallel.js')),
    overview: {
      heading: 'One path or many',
      text: 'Bulbs in series share one path and share the battery’s push, so they dim. In parallel, each bulb has its own path and stays bright, but the battery has to supply more current. Tap bulbs to unscrew them.',
      features: [['led', 'Series: bulbs share the voltage'], ['bolt', 'Parallel: each gets the full voltage'], ['hand', 'Tap a bulb to unscrew it']],
    },
    pinout: [
      ['Series', 'Parts one after another', 'Same current through each'],
      ['Parallel', 'Parts side by side', 'Same voltage across each'],
      ['Branch', 'One of the parallel paths', 'Currents in branches add up'],
      ['Load', 'Anything that uses the energy', 'Bulb, LED, motor, heater'],
    ],
    example: {
      text: 'Your home is wired in parallel: every lamp gets the full mains voltage and switching one off doesn’t affect the others. Some old Christmas lights were in series: one dead bulb made the whole string go dark.',
      points: ['Why would series wiring be a bad idea for a house?', 'Cells in a torch are in series. What does that do to the voltage?'],
    },
    specs: [['Battery', '6 V'], ['Bulb (model)', '30 Ω each'], ['2 in series', '3 V each, ¼ of the power'], ['3 in series', '2 V each, 1/9 of the power'], ['Parallel', '6 V each, currents add'], ['Series resistance', 'R = R₁ + R₂ + …'], ['Parallel resistance', '1/R = 1/R₁ + 1/R₂ + …']],
    quiz: [
      { q: 'Two identical bulbs in series on 6 V. Each bulb gets…', options: ['6 V', '3 V', '12 V', '0 V'], answer: 1, explain: 'In series the voltage is shared: 3 V each.' },
      { q: 'In parallel, one bulb is unscrewed. The others…', options: ['go out', 'get dimmer', 'stay lit', 'explode'], answer: 2, explain: 'Each bulb has its own path to the battery, so the others still have a complete loop.' },
      { q: 'Adding bulbs in parallel makes the battery current…', options: ['go up', 'go down', 'stay the same', 'reverse'], answer: 0, explain: 'Every branch draws its own current and they add up, so the battery works harder and runs down faster.' },
    ],
    challenges: [
      'Predict the battery current for three bulbs in parallel, then check it.',
      'Why do series bulbs dim so much? (Hint: power = V² ÷ R.)',
      'Design a circuit where one switch controls two bulbs that both stay fully bright.',
    ],
  }),
  // ------------------------------------------------------------------ 6
  L('basics-battery', {
    title: 'Batteries and DC', icon: 'plug',
    explainer: lazy(() => import('../explainers/scenes/basics/battery.js')),
    overview: {
      heading: 'Chemistry that pushes',
      text: 'Inside a battery, zinc and manganese dioxide react and push electrons out of the − end. The result is direct current: steady and one way. Stack cells to add voltage, and read mAh to know how long they last.',
      features: [['plug', 'Look inside an AA cell'], ['wave', 'DC versus mains AC'], ['timer', 'Capacity and running time']],
    },
    pinout: [
      ['Cell', 'One chemical unit', 'An AA alkaline cell makes 1.5 V'],
      ['Battery', 'Strictly, several cells together', 'A 9 V battery holds six small cells'],
      ['DC', 'Direct current', 'Flows one way, steady'],
      ['AC', 'Alternating current', 'Changes direction many times a second'],
      ['mAh', 'Milliamp-hours', 'How much charge it stores'],
    ],
    example: {
      text: 'A TV remote with two AA cells in series runs on 3 V and draws tiny currents, so the cells last for a year or more. A toy car motor draws hundreds of milliamps and empties the same cells in hours.',
      points: ['Look at a battery label: find its voltage and capacity', 'How long would a 2500 mAh cell last at 50 mA?'],
    },
    specs: [['AA alkaline', '1.5 V nominal (≈ 1.6 V when new)'], ['AA capacity', '≈ 2000–2800 mAh at low current'], ['Rechargeable NiMH AA', '1.2 V'], ['Li-ion cell', '3.6–3.7 V'], ['Empty alkaline', '≈ 0.9 V per cell'], ['UK/EU mains', '230 V AC, 50 Hz'], ['US mains', '120 V AC, 60 Hz']],
    quiz: [
      { q: 'Four AA cells in series give…', options: ['1.5 V', '4 V', '6 V', '9 V'], answer: 2, explain: 'Voltages add in series: 4 × 1.5 V = 6 V.' },
      { q: 'A 2500 mAh cell powers a 100 mA toy. Roughly how long?', options: ['2.5 hours', '25 hours', '250 hours', '25 minutes'], answer: 1, explain: '2500 mAh ÷ 100 mA = 25 h (less at high currents, where cells are less efficient).' },
      { q: 'Which end do the electrons leave from?', options: ['The + end', 'The − end', 'Both', 'Neither'], answer: 1, explain: 'Electrons are pushed out of the − end, round the circuit and back into the + end.' },
      { q: 'DC means…', options: ['the current changes direction', 'the current flows one way', 'there is no current', 'double current'], answer: 1, explain: 'Direct current flows in one direction, like from a battery.' },
    ],
    challenges: [
      'Count the cells in three devices at home and work out their voltage.',
      'Why do toys say “do not mix old and new batteries”?',
      'Look up the mAh of your phone battery and estimate hours of use at 300 mA.',
    ],
  }),
  // ------------------------------------------------------------------ 7
  L('basics-resistor', {
    title: 'The colour code', icon: 'resistor',
    explainer: lazy(() => import('../explainers/scenes/basics/resistor.js')),
    overview: {
      heading: 'Read a resistor',
      text: 'Resistors are too small to print numbers on, so they wear coloured bands. Two digits, a multiplier and a tolerance. Tap the bands, pick colours and read the value like a pro.',
      features: [['palette', 'Black 0 · brown 1 · red 2 … white 9'], ['resistor', 'Band 3 is the number of zeros'], ['check', 'Gold band = ±5 %']],
    },
    pinout: [
      ['Band 1', 'First digit', 'Furthest from the gold or silver band'],
      ['Band 2', 'Second digit', ''],
      ['Band 3', 'Multiplier', 'Brown ×10, red ×100, orange ×1000'],
      ['Band 4', 'Tolerance', 'Gold ±5 %, silver ±10 %, brown ±1 %'],
      ['Colour order', 'Black, brown, red, orange, yellow, green, blue, violet, grey, white', '0 to 9'],
    ],
    example: {
      text: 'The two resistors you’ll use most with an Arduino are 220 Ω (red-red-brown) for LEDs and 10 kΩ (brown-black-orange) for buttons and sensors. Learn those two by sight and you’re halfway there.',
      points: ['Set the bands for 10 kΩ in the animation', 'What value is yellow-violet-red-gold?'],
    },
    specs: [['220 Ω', 'red · red · brown · gold'], ['1 kΩ', 'brown · black · red · gold'], ['10 kΩ', 'brown · black · orange · gold'], ['4.7 kΩ', 'yellow · violet · red · gold'], ['Gold multiplier', '× 0.1'], ['Common power rating', '¼ W']],
    quiz: [
      { q: 'Red, red, brown, gold is…', options: ['22 Ω', '220 Ω', '2.2 kΩ', '221 Ω'], answer: 1, explain: '2, 2, then one zero (brown) = 220 Ω, ±5 % (gold).' },
      { q: 'Brown, black, orange is…', options: ['103 Ω', '1 kΩ', '10 kΩ', '100 kΩ'], answer: 2, explain: '1, 0, then three zeros (orange) = 10,000 Ω = 10 kΩ.' },
      { q: 'A gold fourth band means…', options: ['±1 %', '±5 %', '±10 %', 'it is expensive'], answer: 1, explain: 'Gold tolerance means the real value is within 5 % of the label.' },
    ],
    challenges: [
      'Make 470 Ω, 1 kΩ and 47 kΩ in the picker.',
      'A 220 Ω ±5 % resistor could really be what range of values?',
      'Make up a memory sentence for the colour order: Black Brown Red Orange Yellow Green Blue Violet Grey White.',
    ],
  }),
  // ------------------------------------------------------------------ 8
  L('basics-led', {
    title: 'LEDs and polarity', icon: 'diode',
    explainer: lazy(() => import('../explainers/scenes/basics/led.js')),
    overview: {
      heading: 'A one-way light',
      text: 'A diode lets current through one way only, like a flap valve. An LED is a diode that glows. Put it in the right way round, always with a resistor, and it lasts for years.',
      features: [['diode', 'One-way flow, like a check valve'], ['led', 'Long leg to +, flat side to −'], ['resistor', 'Pick the resistor with Ohm’s law']],
    },
    pinout: [
      ['Anode (+)', 'Long leg', 'Connect towards +'],
      ['Cathode (−)', 'Short leg, flat edge on the rim', 'Connect towards −'],
      ['Forward voltage', 'Volts the LED uses when lit', 'Red ≈ 2 V, blue ≈ 3 V'],
      ['Series resistor', 'Limits the current', 'R = (supply − LED volts) ÷ current'],
      ['Reverse', 'Backwards connection', 'No current, no light'],
    ],
    example: {
      text: 'Every indicator light around you is an LED behind a resistor. Traffic lights, screens and torches use thousands of them. LEDs turn far more of their power into light than old filament bulbs.',
      points: ['Find the flat edge on a real LED', 'Work out the resistor for a blue LED (3 V) at 15 mA from 5 V'],
    },
    specs: [['Red LED', '≈ 1.8–2.2 V'], ['Yellow LED', '≈ 2.0–2.2 V'], ['Blue / white LED', '≈ 3.0–3.3 V'], ['Typical current', '10–20 mA'], ['Max reverse voltage', '≈ 5 V (more can damage it)'], ['Red LED on 5 V', '220 Ω → ≈ 14 mA']],
    quiz: [
      { q: 'Which leg of an LED is the anode (+)?', options: ['The short leg', 'The long leg', 'Either', 'The middle one'], answer: 1, explain: 'The longer leg is the anode; the flat edge marks the cathode.' },
      { q: 'An LED is connected backwards. What happens?', options: ['It glows brighter', 'It glows a different colour', 'Nothing: no current flows', 'It becomes a resistor'], answer: 2, explain: 'A diode blocks reverse current, so it stays dark.' },
      { q: 'Why does an LED need a resistor?', options: ['To change its colour', 'To limit the current so it isn’t damaged', 'To make it flash', 'It doesn’t'], answer: 1, explain: 'Once lit, an LED’s current rises very fast with voltage; the resistor keeps it safe.' },
    ],
    challenges: [
      'Flip the LED in the animation and watch the valve close too.',
      'Change the LED colour in the last step. Why does the current change?',
      'Wire it for real in the Arduino lesson “Blink an LED”.',
    ],
  }),
  // ------------------------------------------------------------------ 9
  L('basics-capacitor', {
    title: 'Capacitors', icon: 'timer',
    explainer: lazy(() => import('../explainers/scenes/basics/capacitor.js')),
    overview: {
      heading: 'A tiny charge store',
      text: 'A capacitor stores charge on two plates. Charged through a resistor it fills fast at first, then slower: after one time constant, R × C, it is 63 % full. That curve lets circuits keep time and smooth power.',
      features: [['timer', 'Charge and discharge in real time'], ['wave', 'The famous RC curve'], ['resistor', 'Change R and C, watch τ change']],
    },
    pinout: [
      ['Capacitance (F)', 'How much charge it stores per volt', 'µF = millionth of a farad'],
      ['Plates', 'Two conductors facing each other', 'Separated by an insulator'],
      ['τ (tau)', 'Time constant, R × C', '10 kΩ × 100 µF = 1 s'],
      ['63 %', 'Charge after one τ', 'About 99 % after 5 τ'],
      ['Electrolytic', 'Big-value polarised capacitor', 'Mind its − stripe'],
    ],
    example: {
      text: 'Camera flashes charge a capacitor slowly from a small battery, then dump it into the flash tube in a thousandth of a second. Circuit boards scatter small capacitors next to chips to smooth out tiny dips in the supply.',
      points: ['Find τ for 22 kΩ and 470 µF', 'Why does a phone charger’s LED fade slowly after you unplug it?'],
    },
    specs: [['Time constant', 'τ = R × C'], ['After 1 τ', '63 % charged (37 % left when discharging)'], ['After 5 τ', '≈ 99 %'], ['Supply in the animation', '5 V'], ['Common values', '100 nF ceramic, 10–1000 µF electrolytic'], ['Unit', '1 F = 1 coulomb per volt']],
    quiz: [
      { q: 'What is τ for 10 kΩ and 100 µF?', options: ['0.1 s', '1 s', '10 s', '100 s'], answer: 1, explain: '10,000 Ω × 0.0001 F = 1 second.' },
      { q: 'After one time constant, a charging capacitor is about…', options: ['10 % full', '50 % full', '63 % full', '100 % full'], answer: 2, explain: 'It reaches 1 − e⁻¹ ≈ 63 % of the supply voltage.' },
      { q: 'Making the resistor bigger makes charging…', options: ['faster', 'slower', 'the same', 'impossible'], answer: 1, explain: 'A bigger R lets less current flow, so the plates fill more slowly: τ grows.' },
    ],
    challenges: [
      'Set R and C for the slowest charge possible. How many seconds is τ?',
      'Sketch the discharge curve and mark where 37 % is.',
      'Find a capacitor on a real board and read its value and voltage rating.',
    ],
  }),
  // ------------------------------------------------------------------ 10
  L('basics-transistor', {
    title: 'The transistor', icon: 'transistor',
    explainer: lazy(() => import('../explainers/scenes/basics/transistor.js')),
    overview: {
      heading: 'A small current controls a big one',
      text: 'A transistor is a switch with no moving parts. A tiny current into the base lets a current about 100 times bigger flow from collector to emitter. Use it to switch a lamp or amplify a signal.',
      features: [['transistor', 'Base, collector, emitter'], ['bolt', 'Gain: about 100×'], ['wave', 'Switch or amplifier']],
    },
    pinout: [
      ['Base (B)', 'The control input', 'Small current in'],
      ['Collector (C)', 'Where the big current enters', 'For an NPN transistor'],
      ['Emitter (E)', 'Where both currents leave', 'Usually to ground'],
      ['Gain (β, hFE)', 'Collector current ÷ base current', 'Often 100–300'],
      ['Saturation', 'Fully on', 'More base current won’t increase it'],
    ],
    example: {
      text: 'An Arduino pin can give only about 20 mA, but a motor may need 500 mA. A transistor bridges the gap: the pin drives the base and the motor current flows through the collector. Your phone contains billions of tiny transistors.',
      points: ['See it switch a motor in the Arduino lesson “Control a motor”', 'Why does a motor also need a diode across it?'],
    },
    specs: [['Gain in the animation', 'β = 100'], ['Load', '60 Ω bulb on 9 V'], ['Full-on current', '≈ 147 mA'], ['Base–emitter voltage', '≈ 0.7 V when on'], ['Common parts', '2N2222, BC547 (NPN)'], ['Transistors in a phone chip', 'Billions']],
    quiz: [
      { q: 'Which leg controls an NPN transistor?', options: ['Collector', 'Emitter', 'Base', 'All three'], answer: 2, explain: 'A small current into the base controls the larger collector current.' },
      { q: 'With a gain of 100, 0.5 mA into the base allows up to…', options: ['0.5 mA', '5 mA', '50 mA', '500 mA'], answer: 2, explain: '100 × 0.5 mA = 50 mA, if the load allows it.' },
      { q: 'What does “saturated” mean?', options: ['Wet', 'Fully on: more base current doesn’t help', 'Fully off', 'Broken'], answer: 1, explain: 'The load limits the current; the transistor is acting as a closed switch.' },
    ],
    challenges: [
      'Find the smallest base current that turns the bulb fully on.',
      'Explain the tap-and-gate analogy in your own words, then say where it is not quite right.',
      'Build the motor circuit in the Arduino lesson “Control a motor”.',
    ],
  }),
  // ------------------------------------------------------------------ 11
  L('basics-pot', {
    title: 'Potentiometers', icon: 'knob',
    explainer: lazy(() => import('../explainers/scenes/basics/pot.js')),
    overview: {
      heading: 'A knob that divides voltage',
      text: 'Inside a potentiometer a wiper slides along a resistor track, splitting it into two parts. That makes a voltage divider: turn the knob and the middle pin goes smoothly from 0 to 5 V, which an Arduino reads as 0 to 1023.',
      features: [['knob', 'Drag the knob to turn it'], ['resistor', 'Two resistors from one track'], ['chip', 'analogRead() gives 0–1023']],
    },
    pinout: [
      ['Outer pins', 'The two ends of the track', 'Connect to 5 V and GND'],
      ['Middle pin (wiper)', 'The sliding contact', 'Gives the output voltage'],
      ['Voltage divider', 'Two resistors in series', 'Vout = Vin × R2 ÷ (R1 + R2)'],
      ['Linear (B)', 'Resistance changes evenly with angle', 'Common for controls'],
      ['analogRead', 'Arduino’s 10-bit reading', '0 V → 0, 5 V → 1023'],
    ],
    example: {
      text: 'Volume knobs, joysticks and oven dials are potentiometers. A joystick is just two of them at right angles. The same divider idea turns light and temperature sensors into voltages too.',
      points: ['Read a real pot in the Arduino lesson “Turn a knob”', 'What reading does 1.25 V give? (Hint: a quarter of 1023.)'],
    },
    specs: [['Track', '10 kΩ linear'], ['Rotation', '≈ 270°'], ['Divider output', '0–5 V'], ['Arduino ADC', '10 bits: 0–1023'], ['Step size', '5 V ÷ 1024 ≈ 4.9 mV']],
    quiz: [
      { q: 'Which pin of a potentiometer gives the changing voltage?', options: ['Left', 'Middle (wiper)', 'Right', 'None'], answer: 1, explain: 'The wiper taps the track between the two ends.' },
      { q: 'With 5 V across the track and the knob halfway, Vout is…', options: ['0 V', '1 V', '2.5 V', '5 V'], answer: 2, explain: 'Equal halves: Vout = 5 × 5k ÷ 10k = 2.5 V.' },
      { q: 'An Arduino reads 2.5 V on A0 as about…', options: ['25', '255', '512', '1023'], answer: 2, explain: 'Half of 1023 is about 512.' },
    ],
    challenges: [
      'Set the knob to give 1 V. What are R1 and R2?',
      'Use a pot to dim an LED in the Arduino lesson “Fade an LED”.',
      'Design a divider from two fixed resistors that turns 9 V into about 3 V.',
    ],
  }),
  // ------------------------------------------------------------------ 12
  L('basics-magnet', {
    title: 'Motors and generators', icon: 'motor',
    explainer: lazy(() => import('../explainers/scenes/basics/magnet.js')),
    overview: {
      heading: 'Magnetism makes motion',
      text: 'Current makes a magnetic field. Coil the wire and it becomes a magnet that magnets can push, which is how a motor spins. Turn the motor by hand instead and it makes electricity: a generator.',
      features: [['motor', 'A DC motor, seen along its shaft'], ['bolt', 'The commutator flips the current'], ['hand', 'Crank the generator to light an LED']],
    },
    pinout: [
      ['Magnetic field', 'The region where magnets push and pull', 'Made by magnets and by currents'],
      ['Electromagnet', 'A coil carrying current', 'Switch off the current, the magnet stops'],
      ['Commutator', 'A split ring on the motor shaft', 'Reverses the coil current each half turn'],
      ['Brushes', 'Sliding contacts', 'Carry current to the spinning coil'],
      ['Generator', 'Motion in, electricity out', 'Faster turning gives more voltage'],
    ],
    example: {
      text: 'Wind turbines, bike dynamos and power stations all spin magnets past coils. Electric cars even use their motors as generators when braking, sending energy back into the battery.',
      points: ['Spin a small DC motor by hand with an LED on its wires', 'Control a real motor in the Arduino lesson “Control a motor”'],
    },
    specs: [['Force on a wire', 'F = B × I × L'], ['Generator voltage', 'Grows with speed and coil turns'], ['Animation generator', '≈ 2 V per turn per second'], ['Red LED lights from', '≈ 1.8 V'], ['Real hand-crank torches', 'Use gears to spin faster']],
    quiz: [
      { q: 'What does a current in a wire create around it?', options: ['Heat only', 'A magnetic field', 'Light', 'Sound'], answer: 1, explain: 'Every current is surrounded by a magnetic field; compasses near the wire turn.' },
      { q: 'What is the commutator for?', options: ['Cooling the motor', 'Flipping the coil current every half turn so it keeps spinning', 'Measuring speed', 'Holding the magnets'], answer: 1, explain: 'Without it the coil would rock back and forth instead of turning.' },
      { q: 'You turn a generator faster. The voltage…', options: ['goes up', 'goes down', 'stays the same', 'becomes zero'], answer: 0, explain: 'The faster the magnetic field changes through the coil, the bigger the voltage.' },
    ],
    challenges: [
      'Crank the generator: what is the slowest speed that makes the LED glow?',
      'What would happen if you cranked the other way? (Hint: an LED is a one-way valve.)',
      'Find three motors and one generator in your home or street.',
    ],
  }),
  // ------------------------------------------------------------------ 13
  L('basics-breadboard', {
    title: 'The breadboard', icon: 'pins',
    explainer: lazy(() => import('../explainers/scenes/basics/breadboard.js')),
    overview: {
      heading: 'Circuits without solder',
      text: 'A breadboard hides metal clips under its holes. Each short column of five holes is one connection, the middle gap separates the halves, and long rails carry power. X-ray it and tap holes to see what joins what.',
      features: [['pins', 'Columns of five are connected'], ['bolt', 'Red + and blue − rails'], ['chip', 'Chips straddle the middle gap']],
    },
    pinout: [
      ['Terminal strip', 'Five holes in a column', 'All connected together'],
      ['Middle gap', 'The channel down the centre', 'Separates the two halves'],
      ['Power rail', 'Long row along the edge', 'Red + and blue −'],
      ['Half-size board', '30 columns, rows a–j', 'Rails run the full length'],
      ['Jumper wire', 'A short wire with pins', 'Links rows and rails'],
    ],
    example: {
      text: 'Engineers prototype on breadboards before designing a printed circuit board. Every Arduino lesson in Tinker Lab builds on one, so knowing which holes connect saves hours of puzzling.',
      points: ['Find the columns the LED and resistor share in the animation', 'Why must a chip sit across the gap?'],
    },
    specs: [['Hole spacing', '2.54 mm (0.1 inch)'], ['Half-size', '400 tie points'], ['Full-size', '830 tie points'], ['Rails on full-size boards', 'Sometimes split in the middle: check!'], ['Wire size', '22 AWG solid core fits best']],
    quiz: [
      { q: 'Which holes are connected on a breadboard?', options: ['Every hole', 'Each column of five, on one side of the gap', 'Each whole row of 30', 'None'], answer: 1, explain: 'Each numbered column has two separate strips of five: a–e and f–j.' },
      { q: 'Why do chips sit across the middle gap?', options: ['It looks neat', 'So each pin gets its own strip', 'To keep them cool', 'The gap is a fuse'], answer: 1, explain: 'Otherwise opposite pins would be shorted together by the same strip.' },
      { q: 'The red rail is usually used for…', options: ['ground', '+ power', 'signals only', 'nothing'], answer: 1, explain: 'Red for + supply, blue (or black) for ground (−).' },
    ],
    challenges: [
      'Tap holes until you find two that look close but are not connected.',
      'Plan where to put an LED and a resistor so they connect in series.',
      'Build your first breadboard circuit in the Arduino lesson “Blink an LED”.',
    ],
  }),
  // ------------------------------------------------------------------ 14
  L('basics-multimeter', {
    title: 'The multimeter', icon: 'info',
    explainer: lazy(() => import('../explainers/scenes/basics/multimeter.js')),
    overview: {
      heading: 'See the invisible',
      text: 'A multimeter turns volts, amps and ohms into numbers. Measure volts across a part, amps with the meter in the loop, ohms with the power off, and listen for the continuity beep.',
      features: [['knob', 'Turn the dial to pick a mode'], ['bolt', 'Volts across, amps through'], ['sound', 'Continuity beeps for a connection']],
    },
    pinout: [
      ['V mode', 'Measures voltage', 'Probes across a part (parallel)'],
      ['mA / A mode', 'Measures current', 'Meter in series; red lead in the mA socket'],
      ['Ω mode', 'Measures resistance', 'Power off, part out of circuit'],
      ['Continuity', 'Beeps if two points connect', 'Great for finding broken wires'],
      ['COM', 'Common socket', 'Black lead always goes here'],
    ],
    example: {
      text: 'When a circuit doesn’t work, a multimeter tells you where it stops: is the battery flat, is a wire broken, is the LED getting its 2 V? Every electronics bench has one.',
      points: ['Measure a real AA cell: new ones read about 1.6 V', 'Use continuity to test a jumper wire'],
    },
    specs: [['Battery in the animation', '9 V'], ['Resistor', '470 Ω (yellow-violet-brown)'], ['Current', '(9 − 2) ÷ 470 ≈ 14.9 mA'], ['Voltmeter input', '≈ 10 MΩ (barely disturbs the circuit)'], ['Ammeter', 'Near 0 Ω, protected by a fuse'], ['Continuity beep', 'Below about 30–50 Ω']],
    quiz: [
      { q: 'To measure current, the meter goes…', options: ['across the part', 'in series, in the loop', 'anywhere', 'on the battery'], answer: 1, explain: 'Current must flow through the meter, so you open the loop and insert it.' },
      { q: 'Why should you never put an ammeter straight across a battery?', options: ['It reads zero', 'It’s a short circuit: huge current blows the meter’s fuse', 'It reads backwards', 'It is fine'], answer: 1, explain: 'In current mode the meter has almost no resistance.' },
      { q: 'Before measuring resistance you should…', options: ['turn the power off', 'turn the power up', 'add a battery', 'shake the meter'], answer: 0, explain: 'The meter uses its own small battery; outside voltages give wrong readings or damage it.' },
    ],
    challenges: [
      'In the animation, find the one combination that would blow the meter’s fuse.',
      'Predict the voltage across the LED in the circuit, then think how you’d measure it.',
      'Check the voltage on an Arduino’s 5V pin with a real meter.',
    ],
  }),
  // ------------------------------------------------------------------ 15
  L('basics-solder', {
    title: 'Soldering basics', icon: 'hand',
    explainer: lazy(() => import('../explainers/scenes/basics/solder.js')),
    overview: {
      heading: 'Make a joint that lasts',
      text: 'Soldering joins metal with melted metal. Heat the pad and the leg together, feed in solder, remove the solder then the iron, and leave a shiny cone. Safety first: glasses, fresh air and the iron in its stand.',
      features: [['hand', 'Seven steps, manual style'], ['check', 'Good and bad joints'], ['info', 'Ask an adult to help the first time']],
    },
    pinout: [
      ['Soldering iron', 'A hot tip on a handle', 'Set to ≈ 330–370 °C'],
      ['Solder', 'Soft metal wire with flux inside', 'Lead-free melts at ≈ 217–227 °C'],
      ['Flux', 'Cleans the metal so solder flows', 'Makes the smoke: don’t breathe it'],
      ['Pad', 'Copper ring around a hole', 'Heat it as well as the leg'],
      ['Cold joint', 'Dull, lumpy, badly connected', 'Reheat and add a little flux'],
    ],
    example: {
      text: 'Every circuit board in a phone, car or TV is soldered, mostly by machines. Learning to solder lets you turn a breadboard prototype into something permanent.',
      points: ['Practise on a cheap kit before anything precious', 'Use a stand, a damp sponge or brass wool, and a fan'],
    },
    specs: [['Iron temperature', '≈ 330–370 °C'], ['Lead-free solder (SAC)', 'melts ≈ 217–227 °C'], ['Leaded 63/37 solder', 'melts 183 °C'], ['Heat time per joint', '≈ 2–3 s'], ['Good joint', 'Shiny, concave cone'], ['Never', 'Touch the tip or the metal shaft']],
    quiz: [
      { q: 'Where should you feed the solder?', options: ['Onto the iron tip', 'Into the heated joint (pad and leg)', 'Onto the plastic part', 'Anywhere'], answer: 1, explain: 'The hot joint melts the solder, so it flows and grips both metals.' },
      { q: 'What does a good joint look like?', options: ['A dull ball', 'A shiny little cone', 'A bridge to the next pad', 'A black spot'], answer: 1, explain: 'Shiny and cone-shaped means the solder wetted both the pad and the leg.' },
      { q: 'Which order do you take things away?', options: ['Iron first, then solder', 'Solder first, then iron', 'Both at once', 'Leave them'], answer: 1, explain: 'Remove the solder, then the iron, so the joint stays hot while the solder finishes flowing.' },
    ],
    challenges: [
      'Explain each of the seven steps to someone else without looking.',
      'Why is a solder bridge a problem? (Hint: the lesson “Open and closed”.)',
      'With an adult, solder header pins onto a small module.',
    ],
  }),
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['bolt', 'Fuse', 'A deliberate weak link that melts if the current is too high.', 'basics-ohm'],
  ['timer', 'Capacitor', 'Stores charge on two plates; with a resistor it keeps time.', 'basics-capacitor'],
  ['info', 'Multimeter', 'Measures volts, amps, ohms and continuity.', 'basics-multimeter'],
  ['hand', 'Soldering iron', 'Melts solder to join metal parts permanently.', 'basics-solder'],
];
