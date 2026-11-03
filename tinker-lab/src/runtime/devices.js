// Ready-made virtual I²C devices that lesson HALs can return from devices.i2c(addr).

/**
 * MPU-6050 accelerometer / gyro registers. `get()` returns { pitch, roll } in degrees
 * (and optional { temp } in °C). Accelerometer at ±2 g: 16384 LSB per g.
 */
export function mpu6050Device(get) {
  let awake = false;
  return {
    write(bytes) {
      if (bytes[0] === 0x6b && bytes.length > 1) awake = (bytes[1] & 0x40) === 0;
    },
    read(reg, n) {
      const { pitch = 0, roll = 0, temp = 24 } = get() ?? {};
      const p = (pitch * Math.PI) / 180, r = (roll * Math.PI) / 180;
      // gravity vector in the sensor frame (matches atan2(-ax, √(ay²+az²)) and atan2(ay, az))
      const ax = -Math.sin(p), ay = Math.cos(p) * Math.sin(r), az = Math.cos(p) * Math.cos(r);
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
