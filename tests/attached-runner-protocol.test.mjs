import assert from "node:assert/strict";
import test from "node:test";
import { signRunnerMessage, verifyRunnerMessage } from "../runner/attached/protocol.mjs";
const secret = "A".repeat(48);
const now = 1800000000000;
const message = { version: 1, action: "health", timestamp: now, nonce: "a".repeat(32) };
test("valid health message accepted once only", () => {
  const signature = signRunnerMessage(message, secret);
  const cache = new Set();
  assert.equal(verifyRunnerMessage(message, signature, secret, cache, now), true);
  assert.equal(verifyRunnerMessage(message, signature, secret, cache, now), false);
});
test("tampering, expired messages and unsafe actions are rejected", () => {
  const signature = signRunnerMessage(message, secret);
  const cache = new Set();
  for (const changed of [
    { ...message, action: "shell" }, { ...message, action: "desktop-control" },
    { ...message, timestamp: now - 31000 }, { ...message, timestamp: now + 31000 },
    { ...message, version: 2 }, { ...message, nonce: "../escape" },
  ]) assert.equal(verifyRunnerMessage(changed, signature, secret, cache, now), false);
  assert.equal(verifyRunnerMessage(message, "0".repeat(64), secret, cache, now), false);
  assert.equal(verifyRunnerMessage(message, signature, "short", cache, now), false);
  assert.equal(cache.size, 0);
});
