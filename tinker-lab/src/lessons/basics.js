// Track — Electronics Basics: explainer lessons (no board, no code), told in pictures.
import { lazy } from '../explainers/lazy.js';
import { thumb } from '../explainers/thumbs.js';

const L = (id, o) => ({ id, thumb: () => thumb(id), ...o });

export const basics = [
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
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [];
