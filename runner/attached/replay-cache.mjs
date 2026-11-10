/**
 * Process-local replay protection. A deployed multi-instance transport would
 * require a shared atomic nonce store; this module does not provide one.
 */
export class RunnerReplayCache extends Set {
  constructor({ maxEntries = 2048, ttlMs = 60_000 } = {}) {
    super();
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1 || maxEntries > 100_000)
      throw new Error("Invalid replay cache capacity");
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 30_000 || ttlMs > 300_000)
      throw new Error("Invalid replay cache TTL");
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.expiry = new Map();
  }
  prune(now = Date.now()) {
    for (const [nonce, expires] of this.expiry) {
      if (expires <= now) {
        this.expiry.delete(nonce);
        super.delete(nonce);
      }
    }
  }
  add(nonce) {
    this.prune();
    if (this.has(nonce)) return this;
    if (this.size >= this.maxEntries) throw new Error("Replay cache full; deny request");
    super.add(nonce);
    this.expiry.set(nonce, Date.now() + this.ttlMs);
    return this;
  }
  delete(nonce) {
    this.expiry.delete(nonce);
    return super.delete(nonce);
  }
  clear() {
    this.expiry.clear();
    super.clear();
  }
}
