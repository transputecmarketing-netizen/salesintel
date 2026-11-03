// Builds the symbol registry once.
import { Registry, AVR } from './registry.js';
import { addCore } from './core.js';
import { addHardware } from './hardware.js';
import { addNetwork } from './network.js';
import { addModules } from './modules.js';

let registry = null;

export function getRegistry() {
  if (registry) return registry;
  const R = new Registry();
  // headers that need nothing (the core is always available)
  for (const h of ['Arduino.h', 'math.h', 'stdlib.h', 'string.h', 'stdio.h', 'stdint.h', 'stdbool.h', 'ctype.h', 'limits.h', 'float.h', 'inttypes.h', 'WString.h', 'Print.h', 'Stream.h', 'binary.h', 'cmath', 'cstdint', 'cstring', 'cstdlib']) R.header(h, { lib: 'core' });
  for (const h of ['avr/pgmspace.h', 'avr/interrupt.h', 'avr/io.h', 'util/delay.h']) R.header(h, { boards: AVR, lib: 'core' });
  R.header('pgmspace.h', { lib: 'core' });
  addCore(R);
  addHardware(R);
  addNetwork(R);
  addModules(R);
  registry = R;
  return R;
}
