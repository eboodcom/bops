import assert from "node:assert/strict";
import test from "node:test";
import { RunnerReplayCache } from "../runner/attached/replay-cache.mjs";
import { signRunnerMessage, verifyRunnerMessage } from "../runner/attached/protocol.mjs";
test("replay cache enforces capacity and explicit expiry", () => {
  const cache = new RunnerReplayCache({ maxEntries: 1, ttlMs: 60000 });
  cache.add("a");
  assert.equal(cache.has("a"), true);
  assert.throws(() => cache.add("b"), /full/);
  cache.prune(Date.now() + 61000);
  assert.equal(cache.size, 0);
  cache.add("b");
  assert.equal(cache.has("b"), true);
});
test("protocol denies requests when replay cache is full", () => {
  const cache = new RunnerReplayCache({ maxEntries: 1 });
  cache.add("occupied");
  const message = { version: 1, action: "health", timestamp: Date.now(), nonce: "b".repeat(32) };
  const secret = "A".repeat(48);
  assert.equal(verifyRunnerMessage(message, signRunnerMessage(message, secret), secret, cache), false);
});
