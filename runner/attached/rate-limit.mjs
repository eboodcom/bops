/** Single-process defensive limiter. Not a distributed abuse control. */
export class RunnerRateLimiter {
  constructor({ capacity = 60, windowMs = 60_000 } = {}) {
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 10_000) throw new Error("Invalid capacity");
    if (!Number.isSafeInteger(windowMs) || windowMs < 1_000 || windowMs > 3_600_000) throw new Error("Invalid window");
    this.capacity = capacity;
    this.windowMs = windowMs;
    this.count = 0;
    this.started = Date.now();
  }
  allow(now = Date.now()) {
    if (now - this.started >= this.windowMs) {
      this.started = now;
      this.count = 0;
    }
    if (this.count >= this.capacity) return false;
    this.count++;
    return true;
  }
}
