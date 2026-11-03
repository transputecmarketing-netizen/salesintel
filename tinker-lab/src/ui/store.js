// Best-effort localStorage wrapper (works in private mode / blocked storage).
export const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(`tinkerlab:${k}`);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(`tinkerlab:${k}`, JSON.stringify(v));
    } catch {
      /* storage unavailable */
    }
  },
};
