// Track — How Computers Think: explainer lessons from a single switch to AI accelerators.
// Each lesson mounts an animated, hand-drawn scene from src/explainers/scenes/computing/.
import { lazy } from '../explainers/lazy.js';
import { thumb } from '../explainers/thumbs.js';

const L = (id, o) => ({ id, thumb: () => thumb(id), ...o });

export const computing = [
  // ------------------------------------------------------------------ 1
  L('cpu-binary', {
    title: 'Bits and binary', icon: 'pins',
    explainer: lazy(() => import('../explainers/scenes/computing/binary.js')),
    overview: {
      heading: 'Counting with switches',
      text: 'Computers store everything as bits: switches that are off (0) or on (1). Eight bits make a byte. Each switch is worth double the one on its right, so a byte can count from 0 to 255, and letters are just numbers too.',
      features: [['pins', 'Tap the switches to flip bits'], ['code', 'Decimal, hex and letters'], ['timer', 'Watch binary count up']],
    },
    pinout: [
      ['Bit', 'A single 0 or 1', 'Short for binary digit'],
      ['Byte', '8 bits', 'Values 0–255'],
      ['Place value', '1, 2, 4, 8, 16, 32, 64, 128', 'Each is double the last'],
      ['Hexadecimal', 'Base 16, digits 0–9 and A–F', 'One hex digit = 4 bits'],
      ['ASCII', 'A code for letters as numbers', 'A = 65, a = 97'],
    ],
    example: {
      text: 'Every photo, song and message on your phone is stored as billions of bits. An Arduino’s pins are bits you can see: HIGH is 1 and LOW is 0.',
      points: ['Find your initials as numbers in the ASCII table', 'Show 8 bits on LEDs in the Arduino lesson “8 LEDs from 3 pins”'],
    },
    specs: [['1 byte', '8 bits, 0–255'], ['1 KB', '1,024 bytes'], ['1 GB', '≈ 1 billion bytes'], ['Letter A', '65 = 01000001'], ['255', '11111111 = 0xFF'], ['Hex digit', '4 bits (a “nibble”)']],
    quiz: [
      { q: 'What is 00000101 in decimal?', options: ['3', '5', '6', '101'], answer: 1, explain: '4 + 1 = 5.' },
      { q: 'How many different values can one byte hold?', options: ['8', '128', '255', '256'], answer: 3, explain: 'From 0 to 255: 256 different values (2⁸).' },
      { q: 'Each bit to the left is worth…', options: ['one more', 'double', 'ten times', 'the same'], answer: 1, explain: 'Binary is base 2: 1, 2, 4, 8, 16…' },
    ],
    challenges: [
      'Set the switches to your age, then to 100.',
      'What is the biggest number 4 bits can hold?',
      'Spell “HI” with two bytes using the letter view (H = 72, I = 73).',
    ],
  }),
  // ------------------------------------------------------------------ 2
  L('cpu-gates', {
    title: 'Logic gates', icon: 'chip',
    explainer: lazy(() => import('../explainers/scenes/computing/gates.js')),
    overview: {
      heading: 'Decisions from switches',
      text: 'A transistor is a switch flipped by electricity. Wire switches in a row and you get AND; side by side, OR; one that shorts the output, NOT. Combine them and you can build any decision a computer makes.',
      features: [['chip', 'NOT, AND, OR, XOR'], ['button', 'Flip A and B yourself'], ['check', 'Fill in the truth tables']],
    },
    pinout: [
      ['NOT', 'Output is the opposite of the input', '1 → 0, 0 → 1'],
      ['AND', 'Output 1 only if both inputs are 1', 'Switches in series'],
      ['OR', 'Output 1 if either input is 1', 'Switches in parallel'],
      ['XOR', 'Output 1 if the inputs differ', 'Like two-way stair switches'],
      ['Truth table', 'Every input combination and its output', '2 inputs → 4 rows'],
    ],
    example: {
      text: 'A washing machine only starts if the door is shut AND the start button is pressed. A car beeps if a door is open OR a seatbelt is undone. Real chips build gates from CMOS transistor pairs.',
      points: ['Find an AND and an OR decision in your home', 'Write one with if (a && b) in the Arduino lesson “Toggle with a button”'],
    },
    specs: [['Transistors per NOT (CMOS)', '2'], ['Transistors per NAND/NOR', '4'], ['XOR (CMOS)', '≈ 8–12 transistors'], ['Universal gate', 'NAND alone can build every other gate'], ['A modern CPU', 'Billions of transistors']],
    quiz: [
      { q: 'AND outputs 1 when…', options: ['either input is 1', 'both inputs are 1', 'both inputs are 0', 'the inputs differ'], answer: 1, explain: 'Like two switches in a row: both must be closed.' },
      { q: 'XOR with inputs 1 and 1 gives…', options: ['0', '1', '2', '11'], answer: 0, explain: 'XOR is 1 only when the inputs are different.' },
      { q: 'Two switches side by side (in parallel) behave like…', options: ['AND', 'OR', 'NOT', 'XOR'], answer: 1, explain: 'Either switch alone completes the circuit.' },
    ],
    challenges: [
      'Fill in all four rows of the XOR table in the last step.',
      'Which gate gives 1 only when both inputs are 0? (Hint: NOT + OR.)',
      'Explain why stair-light switches behave like XOR.',
    ],
  }),
  // ------------------------------------------------------------------ 3
  L('cpu-adder', {
    title: 'Adding with gates', icon: 'chip',
    explainer: lazy(() => import('../explainers/scenes/computing/adder.js')),
    overview: {
      heading: 'Maths made of logic',
      text: 'In binary, 1 + 1 = 10: write 0, carry 1. A half adder is just an XOR (sum) and an AND (carry). Add a carry input and chain four of them, and you can add two 4-bit numbers as the carry ripples across.',
      features: [['chip', 'Half adder and full adder'], ['bolt', 'Ripple carry, right to left'], ['hand', 'Tap the bits of A and B']],
    },
    pinout: [
      ['Half adder', 'Adds two bits', 'Sum = A XOR B, carry = A AND B'],
      ['Full adder', 'Adds two bits and a carry in', 'Two half adders and an OR'],
      ['Carry', 'The overflow to the next column', 'Like carrying 1 in decimal'],
      ['Ripple carry', 'Carries pass from column to column', 'Simple but slower for wide numbers'],
      ['Overflow', 'A result too big for the bits', '4 bits hold 0–15'],
    ],
    example: {
      text: 'The ALU inside every processor adds numbers with circuits like this, just much wider (32 or 64 bits) and with faster carry tricks. Subtraction, multiplication and more are built on top of adding.',
      points: ['Add 15 + 1 in the animation: watch the carry run all the way', 'How many full adders would 8-bit numbers need?'],
    },
    specs: [['Bits in the animation', '4 (0–15 each)'], ['Largest sum', '15 + 15 = 30 (5 bits)'], ['Full adder', '2 XOR, 2 AND, 1 OR'], ['Modern CPU adders', '64-bit, carry-lookahead'], ['Binary 1 + 1', '10 (two)']],
    quiz: [
      { q: 'In binary, 1 + 1 = …', options: ['2', '11', '10', '0'], answer: 2, explain: 'Two is written 10 in binary: sum 0, carry 1.' },
      { q: 'Which gate makes the sum in a half adder?', options: ['AND', 'OR', 'XOR', 'NOT'], answer: 2, explain: 'The sum bit is 1 when exactly one input is 1: that is XOR.' },
      { q: 'What is 0101 + 0011?', options: ['0110', '1000', '1001', '0111'], answer: 1, explain: '5 + 3 = 8, which is 1000.' },
    ],
    challenges: [
      'Find two numbers whose sum needs the fifth bit.',
      'Explain why the carry “ripples” instead of appearing all at once.',
      'Design a 1-bit adder truth table with A, B and carry in (8 rows).',
    ],
  }),
  // ------------------------------------------------------------------ 4
  L('cpu-memory', {
    title: 'Memory and RAM', icon: 'chip',
    explainer: lazy(() => import('../explainers/scenes/computing/memory.js')),
    overview: {
      heading: 'Circuits that remember',
      text: 'A button forgets the moment you let go. Two NOR gates feeding each other make a latch that remembers one bit. Line up eight for a byte, give each byte an address, and you have RAM you can write to and read back.',
      features: [['chip', 'An SR latch from two NOR gates'], ['button', 'Press Set and Reset'], ['pins', 'Write and read bytes by address']],
    },
    pinout: [
      ['Latch', 'A circuit that holds one bit', 'Set → 1, Reset → 0'],
      ['Q', 'The stored value', 'Stays put after the button is released'],
      ['Address', 'The number of a memory slot', '8 addresses here; billions in a PC'],
      ['SRAM', 'Static RAM: latch-like cells', '6 transistors per bit, very fast'],
      ['DRAM', 'Dynamic RAM: a tiny capacitor per bit', 'Needs refreshing thousands of times a second'],
    ],
    example: {
      text: 'Your laptop’s RAM is DRAM: billions of tiny capacitors refreshed constantly. The cache inside the processor is SRAM, built from latch-like cells. Both forget everything when the power goes off; flash storage doesn’t.',
      points: ['An Arduino Uno has 2 KB of SRAM: how many latches is that?', 'Store a setting that survives power-off in the Arduino lesson “Remember settings”'],
    },
    specs: [['Arduino Uno SRAM', '2 KB (16,384 bits)'], ['SRAM cell', '6 transistors'], ['DRAM cell', '1 transistor + 1 capacitor'], ['DRAM refresh', 'Every ≈ 64 ms'], ['Volatile', 'Loses data without power'], ['Flash / EEPROM', 'Keeps data without power']],
    quiz: [
      { q: 'After pressing Set and letting go, Q is…', options: ['0', '1', 'random', 'flickering'], answer: 1, explain: 'The gates feed each other, so the 1 is held.' },
      { q: 'What does an address identify?', options: ['A colour', 'Which memory slot to use', 'The clock speed', 'The power supply'], answer: 1, explain: 'Each byte of memory has its own number, its address.' },
      { q: 'What happens to RAM when the power is switched off?', options: ['It keeps its data', 'It forgets everything', 'It doubles', 'It turns into flash'], answer: 1, explain: 'RAM is volatile: without power the latches and capacitors lose their state.' },
    ],
    challenges: [
      'What happens if you press Set and Reset together? Why do designers avoid it?',
      'Write the letter A (65) into address 3, then read it back.',
      'How many bits are in 8 GB of RAM?',
    ],
  }),
  // ------------------------------------------------------------------ 5
  L('cpu-clock', {
    title: 'The clock', icon: 'timer',
    explainer: lazy(() => import('../explainers/scenes/computing/clock.js')),
    overview: {
      heading: 'The heartbeat of a chip',
      text: 'A quartz crystal vibrates at an exact rate and makes a clock signal: high, low, high, low. On each rising edge every part of the processor takes one step together. An Uno ticks 16 million times a second; a laptop, billions.',
      features: [['timer', 'Crystal → square wave'], ['chip', 'Everything steps on the edge'], ['bolt', 'Faster means hotter']],
    },
    pinout: [
      ['Clock signal', 'A steady on-off square wave', 'Keeps every part in step'],
      ['Hertz (Hz)', 'Cycles per second', 'MHz = million, GHz = billion'],
      ['Rising edge', 'The moment it goes from low to high', 'When registers update'],
      ['Quartz crystal', 'Vibrates at a precise frequency', '16 MHz on an Uno'],
      ['Dynamic power', 'Power used by switching', 'Grows with clock speed and voltage²'],
    ],
    example: {
      text: 'Quartz watches use a crystal at 32,768 Hz: divide by two fifteen times and you get exactly one tick per second. Phones raise and lower their clock speed all the time to save battery.',
      points: ['Time something with millis() in the Arduino lesson “Multitask with millis()”', 'Why does 32,768 = 2¹⁵ make a good watch crystal?'],
    },
    specs: [['Arduino Uno', '16 MHz (62.5 ns per tick)'], ['Raspberry Pi 5', '2.4 GHz'], ['Laptop boost', '≈ 5–6 GHz'], ['Light in one 3 GHz tick', '≈ 10 cm'], ['Watch crystal', '32,768 Hz'], ['Dynamic power', 'P ≈ C × V² × f']],
    quiz: [
      { q: 'How many ticks per second is 16 MHz?', options: ['16,000', '16 million', '16 billion', '16'], answer: 1, explain: 'Mega means million: 16,000,000 ticks every second.' },
      { q: 'What happens on a rising clock edge?', options: ['Power turns off', 'Registers and counters take one step', 'The screen refreshes', 'Nothing'], answer: 1, explain: 'The edge tells every part to capture its next value at the same moment.' },
      { q: 'Why don’t chips just run at 100 GHz?', options: ['Clocks can’t go that fast and the heat would be enormous', 'It is illegal', 'Crystals are too big', 'Software forbids it'], answer: 0, explain: 'Power and heat rise steeply with speed, and signals must cross the chip within one tick.' },
    ],
    challenges: [
      'Count the ticks for 10 seconds at 1 Hz. Now imagine 16 million per second.',
      'How long is one tick at 2 GHz?',
      'Why do phones slow their clocks when they get hot?',
    ],
  }),
  // ------------------------------------------------------------------ 6
  L('cpu-fetch', {
    title: 'Fetch, decode, execute', icon: 'chip',
    explainer: lazy(() => import('../explainers/scenes/computing/fetch.js')),
    overview: {
      heading: 'Inside a tiny CPU',
      text: 'A processor repeats three steps forever: fetch the next instruction from memory, decode what it means, execute it. Step through a tiny 8-instruction CPU with a program counter, instruction register, control unit, ALU and A register.',
      features: [['chip', 'A real (tiny) instruction set'], ['play', 'Step one phase at a time'], ['code', 'Two programs to try']],
    },
    pinout: [
      ['Program counter (PC)', 'Address of the next instruction', 'Usually counts up by 1'],
      ['Instruction register (IR)', 'Holds the instruction being run', '3-bit opcode + 5-bit address here'],
      ['Control unit', 'Decodes and directs', 'Turns opcodes into actions'],
      ['ALU', 'Arithmetic logic unit', 'Adds, subtracts, compares'],
      ['A register', 'The accumulator', 'Holds the working number'],
      ['Opcodes', 'LDA ADD SUB STA LDI JMP JZ OUT', '8 instructions = 3 bits'],
    ],
    example: {
      text: 'Your phone’s processor does exactly this billions of times a second, with dozens of registers, many instructions in flight at once and wider numbers. Every app is ultimately a list of instructions like these.',
      points: ['Step the count-down program until the display shows 0', 'Which instruction makes the program loop?'],
    },
    specs: [['Instruction size', '8 bits'], ['Opcode', '3 bits (8 instructions)'], ['Address field', '5 bits (32 boxes)'], ['Memory shown', '10 boxes of 8 bits'], ['Program and data', 'Share one memory (von Neumann)'], ['Halt', 'JMP to itself']],
    quiz: [
      { q: 'What does the program counter hold?', options: ['The answer', 'The address of the next instruction', 'The clock speed', 'The number of programs'], answer: 1, explain: 'It points at the box the CPU will fetch next.' },
      { q: 'Which part does the actual adding?', options: ['The program counter', 'The ALU', 'The display', 'Memory'], answer: 1, explain: 'The arithmetic logic unit calculates; the A register keeps the result.' },
      { q: 'The three-step cycle is…', options: ['load, save, quit', 'fetch, decode, execute', 'read, write, erase', 'on, off, on'], answer: 1, explain: 'Fetch the instruction, work out what it means, then do it.' },
      { q: 'In 010 01000, the first three bits are…', options: ['the opcode (SUB)', 'the address', 'the answer', 'random'], answer: 0, explain: '010 is SUB; 01000 is box 8.' },
    ],
    challenges: [
      'Run “Add 12 + 30” and predict what the display will show.',
      'Change the count-down to start from 5: which memory box would you change?',
      'Why does JZ need to look at the A register?',
    ],
  }),
  // ------------------------------------------------------------------ 7
  L('cpu-mcu-mpu', {
    title: 'Microcontroller vs CPU', icon: 'chip',
    explainer: lazy(() => import('../explainers/scenes/computing/mcu-mpu.js')),
    overview: {
      heading: 'One chip, or a whole system',
      text: 'A microcontroller puts processor, memory and pins on one chip: it runs one program, starts instantly and sips power. A microprocessor is just the brain, with memory, storage and more outside, so it can run a full operating system.',
      features: [['chip', 'Everything on one chip'], ['gear', 'A processor plus RAM and storage'], ['bolt', 'Power, speed and memory compared']],
    },
    pinout: [
      ['Microcontroller (MCU)', 'CPU + flash + RAM + pins on one chip', 'Arduino, ESP32, Pico'],
      ['Microprocessor (MPU)', 'Just the processor cores', 'Needs external RAM and storage'],
      ['Flash', 'Memory that keeps your program', 'Survives power-off'],
      ['Operating system', 'Software that runs many programs', 'Linux, Windows, Android'],
      ['Peripherals', 'Timers, ADC, serial, PWM', 'Built into microcontrollers'],
    ],
    example: {
      text: 'Microwave ovens, TV remotes and car key fobs run on microcontrollers. Laptops and Raspberry Pis use microprocessors. The ESP32 and Jetson sit in between: powerful chips with lots built in.',
      points: ['Compare the Arduino and Raspberry Pi tracks in Tinker Lab', 'Which would you pick for a battery-powered plant sensor? Why?'],
    },
    specs: [['ATmega328P (Uno)', '16 MHz, 32 KB flash, 2 KB RAM'], ['Uno chip power', '≈ 0.05–0.1 W'], ['Raspberry Pi 5', '2.4 GHz 4-core, 2–16 GB RAM'], ['Pi 5 power', '≈ 3–12 W'], ['RAM ratio', '8 GB ÷ 2 KB ≈ 4 million'], ['Start-up', 'MCU: milliseconds · OS: seconds']],
    quiz: [
      { q: 'Which has its memory and pins on the same chip?', options: ['A microprocessor', 'A microcontroller', 'A graphics card', 'A hard drive'], answer: 1, explain: 'That’s what makes a microcontroller a complete tiny computer.' },
      { q: 'Which can run a full operating system like Linux?', options: ['An Arduino Uno', 'A Raspberry Pi', 'A potentiometer', 'A 555 timer'], answer: 1, explain: 'A Raspberry Pi has a microprocessor with gigabytes of RAM.' },
      { q: 'Best choice for a coin-cell sensor that wakes once a minute?', options: ['Microcontroller', 'Desktop CPU', 'GPU', 'Laptop'], answer: 0, explain: 'Microcontrollers start instantly and use tiny amounts of power.' },
    ],
    challenges: [
      'List three devices at home that probably contain a microcontroller.',
      'Why does a Raspberry Pi need an SD card but an Arduino doesn’t?',
      'Try a lesson from the MicroPython on Pico track: microcontroller or microprocessor?',
    ],
  }),
  // ------------------------------------------------------------------ 8
  L('cpu-x86-arm', {
    title: 'x86 vs ARM', icon: 'chip',
    explainer: lazy(() => import('../explainers/scenes/computing/x86-arm.js')),
    overview: {
      heading: 'Two instruction languages',
      text: 'Intel and AMD chips speak x86: many instructions, 1 to 15 bytes long. Phones speak ARM: simpler, fixed 4-byte instructions. Both pipeline work like a factory line. Phones add big and little cores and pack everything into one system-on-chip.',
      features: [['code', 'Real instruction encodings'], ['gear', 'Pipeline and micro-ops'], ['bolt', 'big.LITTLE and the SoC']],
    },
    pinout: [
      ['ISA', 'Instruction set architecture', 'The “language” a CPU understands'],
      ['CISC (x86)', 'Complex, variable-length instructions', 'Intel, AMD'],
      ['RISC (ARM)', 'Simpler, fixed-length instructions', 'Phones, Raspberry Pi, Apple M-series'],
      ['Pipeline', 'Overlapping instruction steps', 'Like a factory line'],
      ['Micro-ops', 'Simple internal steps', 'x86 decoders split instructions into them'],
      ['SoC', 'System-on-chip', 'CPU, GPU, NPU, modem on one die'],
    ],
    example: {
      text: 'Your phone, a Raspberry Pi and Apple’s laptops use ARM. Most Windows PCs and game consoles use x86. Software must be compiled for the right one, which is why some apps say “for Apple silicon” or “for x64”.',
      points: ['Find out whether your computer is x86 or ARM', 'The Jetson’s CPU cores are ARM: see the Jetson track'],
    },
    specs: [['x86 instruction length', '1–15 bytes'], ['ARM (AArch64) instruction', '4 bytes'], ['Example x86', 'add eax, ebx = 01 D8'], ['Example ARM', 'add w0, w0, w1 = 0x0B010000'], ['Phone SoC power', '≈ 3–8 W'], ['Desktop CPU power', '≈ 65–250 W']],
    quiz: [
      { q: 'How long is every ARM (AArch64) instruction?', options: ['1 byte', '4 bytes', 'Anywhere from 1 to 15 bytes', '64 bytes'], answer: 1, explain: 'Fixed 32-bit instructions are easy to fetch and decode.' },
      { q: 'What does a pipeline do?', options: ['Cools the chip', 'Overlaps the steps of several instructions', 'Stores files', 'Connects to Wi-Fi'], answer: 1, explain: 'While one instruction executes, the next is decoded and the one after is fetched.' },
      { q: 'Why do phones have big and little cores?', options: ['Decoration', 'Big for bursts of speed, little to save battery on light work', 'For two SIM cards', 'Because of the screen'], answer: 1, explain: 'Light tasks run on efficient cores; heavy ones wake the big cores.' },
    ],
    challenges: [
      'Count the bytes in the x86 instructions shown. Which is longest?',
      'Explain the factory-line pipeline to a friend using sandwiches.',
      'List the blocks of a phone SoC and what each one does.',
    ],
  }),
  // ------------------------------------------------------------------ 9
  L('cpu-gpu', {
    title: 'GPUs and parallelism', icon: 'palette',
    explainer: lazy(() => import('../explainers/scenes/computing/gpu.js')),
    overview: {
      heading: 'Many hands make light work',
      text: 'A CPU has a few fast, clever cores. A GPU has thousands of simpler ones that all do the same sum on different data at once. Race them colouring pixels, then meet the 1024 CUDA cores on a Jetson Orin Nano.',
      features: [['chip', 'Few big cores vs many small'], ['play', 'Race to colour 64 pixels'], ['radar', 'CUDA cores on a Jetson']],
    },
    pinout: [
      ['CPU core', 'Fast and flexible', 'Good at varied, step-by-step work'],
      ['GPU core', 'Simple and slower each', 'Great in huge numbers'],
      ['Parallelism', 'Doing many things at once', 'Same sum, different data'],
      ['CUDA core', 'NVIDIA’s name for a GPU core', 'Programmed with CUDA'],
      ['Tensor core', 'Matrix-maths unit in newer GPUs', 'Speeds up AI'],
    ],
    example: {
      text: 'Games draw millions of pixels sixty times a second on the GPU. AI models train and run on GPUs because they repeat the same multiply-add billions of times. A Jetson brings that power to robots.',
      points: ['Try object detection in the Jetson lesson “Object detection”', 'Why is a GPU poor at a task that must happen one step after another?'],
    },
    specs: [['Race: CPU', '4 cores × 0.25 s per pixel → 4 s'], ['Race: GPU', '64 cores × 0.75 s per pixel → 0.75 s'], ['Jetson Orin Nano', '1024 CUDA + 32 tensor cores, 6 Arm cores'], ['Jetson Nano (original)', '128 CUDA cores, 4 Arm cores'], ['Gaming GPUs', 'Thousands to 16,000+ cores']],
    quiz: [
      { q: 'Why did the GPU win the race?', options: ['Each core is faster', 'It has many cores working at the same time', 'It cheats', 'Its pixels are smaller'], answer: 1, explain: 'Its cores are slower individually, but 64 of them finish together.' },
      { q: 'Which job suits a GPU best?', options: ['Brightening every pixel of a photo', 'A long chain of steps that each depend on the last', 'Typing a letter', 'Blinking one LED'], answer: 0, explain: 'The same small sum on millions of pixels is perfect parallel work.' },
      { q: 'How many CUDA cores does a Jetson Orin Nano have?', options: ['6', '128', '1024', '1 million'], answer: 2, explain: '1024 CUDA cores (plus 32 tensor cores) alongside 6 Arm CPU cores.' },
    ],
    challenges: [
      'If the CPU had 8 cores, how long would its race take?',
      'Think of a classroom job that is fast with many people and one that isn’t.',
      'Run an AI model in the Jetson track and watch the GPU do the work.',
    ],
  }),
  // ------------------------------------------------------------------ 10
  L('cpu-ai-chip', {
    title: 'How AI chips think', icon: 'radar',
    explainer: lazy(() => import('../explainers/scenes/computing/ai-chip.js')),
    overview: {
      heading: 'Multiply, add, repeat',
      text: 'A neural network is layers of neurons that multiply inputs by weights, add them up and light up if the total is positive. A whole layer is one matrix multiply, and AI chips are grids of multiply-add units doing trillions a second.',
      features: [['radar', 'A real tiny network you can test'], ['chip', 'A layer as a matrix'], ['bolt', 'TOPS: trillions of operations']],
    },
    pinout: [
      ['Neuron', 'Adds up weighted inputs', 'Then applies an activation'],
      ['Weight', 'How much an input matters', 'Learned during training'],
      ['ReLU', 'Activation: keep positives, zero negatives', 'max(0, x)'],
      ['Matrix multiply', 'A whole layer at once', 'Rows of weights × the inputs'],
      ['NPU / tensor core', 'Hardware for multiply-adds', 'Measured in TOPS'],
    ],
    example: {
      text: 'Your phone’s NPU unlocks it with your face and blurs photo backgrounds. A Jetson runs networks with millions of weights to spot people and objects in a camera feed, all built from multiply-adds like these.',
      points: ['Run image classification in the Jetson lesson “Image classification”', 'Draw a plus sign: why is the network unsure?'],
    },
    specs: [['This network', '9 inputs → 6 neurons → 2 outputs'], ['Weights here', '+1 on the line, −0.5 elsewhere, bias −1.5'], ['Multiply-adds in layer 1', '54'], ['Jetson Orin Nano', 'up to 40 TOPS (67 with Super mode)'], ['Phone NPUs', 'Tens of TOPS'], ['1 TOPS', '10¹² operations per second']],
    quiz: [
      { q: 'What does a neuron do with its inputs?', options: ['Ignores them', 'Multiplies each by a weight and adds them up', 'Stores them on disk', 'Sends them to the internet'], answer: 1, explain: 'A weighted sum, then an activation such as ReLU.' },
      { q: 'Why are AI chips full of multiply-add units?', options: ['For graphics only', 'Neural networks are mostly multiply-adds', 'To make heat', 'For Wi-Fi'], answer: 1, explain: 'Matrix multiplies are nearly all of the work in a neural network.' },
      { q: 'With a vertical line drawn, which neurons light up?', options: ['The row detectors', 'The column detector for that column', 'All of them', 'None'], answer: 1, explain: 'Its weights are +1 on that column, so its sum is positive.' },
    ],
    challenges: [
      'Draw a diagonal line. What does the network think, and why?',
      'Work out by hand the sum for the middle column neuron with a full middle column.',
      'Find out how many TOPS your phone’s NPU has.',
    ],
  }),
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['chip', 'Logic gate', 'A circuit that makes a decision from its inputs (AND, OR, NOT…).', 'cpu-gates'],
  ['timer', 'Quartz crystal', 'Vibrates at an exact frequency to make a clock signal.', 'cpu-clock'],
  ['chip', 'ALU', 'Arithmetic logic unit: the calculator inside a processor.', 'cpu-fetch'],
];
