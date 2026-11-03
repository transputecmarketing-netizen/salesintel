// Ready-made virtual I²C devices that lesson HALs can return from devices.i2c(addr).

/**
 * MPU-6050 accelerometer / gyro registers. `get()` returns { pitch, roll } in degrees, or
 * { ax, ay, az } in g, plus optional { temp } in °C and { noise } in g. Accelerometer at ±2 g: 16384 LSB per g.
 */
export function mpu6050Device(get) {
  let awake = false;
  return {
    write(bytes) {
      if (bytes[0] === 0x6b && bytes.length > 1) awake = (bytes[1] & 0x40) === 0;
    },
    read(reg, n) {
      const g = get() ?? {};
      const { pitch = 0, roll = 0, temp = 24, noise = 0 } = g;
      const p = (pitch * Math.PI) / 180, r = (roll * Math.PI) / 180;
      // gravity vector in the sensor frame (matches atan2(-ax, √(ay²+az²)) and atan2(ay, az)),
      // or the caller's own { ax, ay, az } in g
      const jitter = () => (noise ? (Math.random() - 0.5) * 2 * noise : 0);
      const ax = (g.ax ?? -Math.sin(p)) + jitter(), ay = (g.ay ?? Math.cos(p) * Math.sin(r)) + jitter(), az = (g.az ?? Math.cos(p) * Math.cos(r)) + jitter();
      const s16 = (v) => { const x = Math.max(-32768, Math.min(32767, Math.round(v))); return [(x >> 8) & 255, x & 255]; };
      const regs = new Array(128).fill(0);
      if (awake) {
        [ax, ay, az].forEach((g, i) => { const [h, l] = s16(g * 16384); regs[0x3b + i * 2] = h; regs[0x3c + i * 2] = l; });
        const [th, tl] = s16((temp - 36.53) * 340);
        regs[0x41] = th; regs[0x42] = tl;
      }
      regs[0x75] = 0x68; // WHO_AM_I
      regs[0x6b] = awake ? 0 : 0x40;
      return regs.slice(reg, reg + n);
    },
  };
}

/**
 * A serialWrite() for lesson HALs that feeds the Serial Plotter format to a panel:
 * each line of numbers ("12 34", "12,34", "a:12 b:34") becomes push(...values).
 */
export function serialPlotter(push) {
  let buf = '';
  return (text) => {
    buf += text;
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      const vals = line.trim().split(/[\s,]+/).filter(Boolean).map((tok) => Number(tok.includes(':') ? tok.split(':').pop() : tok));
      if (vals.length && vals.every((v) => Number.isFinite(v))) push(...vals);
    }
  };
}
