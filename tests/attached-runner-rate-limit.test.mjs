import assert from "node:assert/strict";
import test from "node:test";
import { RunnerRateLimiter } from "../runner/attached/rate-limit.mjs";
import { createAttachedHealthServer } from "../runner/attached/health-server.mjs";
test("rate limiter fails closed at capacity and resets on window", () => {
  const limiter = new RunnerRateLimiter({ capacity: 2, windowMs: 1000 });
  const start = limiter.started;
  assert.equal(limiter.allow(start), true);
  assert.equal(limiter.allow(start + 1), true);
  assert.equal(limiter.allow(start + 2), false);
  assert.equal(limiter.allow(start + 1000), true);
});
test("runner has bounded request and header timeouts", () => {
  const server = createAttachedHealthServer("R".repeat(48));
  assert.equal(server.requestTimeout, 5000);
  assert.equal(server.headersTimeout, 5000);
  assert.equal(server.keepAliveTimeout, 2000);
});
test("invalid rate limits are rejected", () => {
  assert.throws(() => new RunnerRateLimiter({ capacity: 0 }));
  assert.throws(() => new RunnerRateLimiter({ windowMs: 0 }));
});
