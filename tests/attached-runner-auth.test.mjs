import assert from "node:assert/strict";
import test from "node:test";
import { authenticatedRunnerRequest, validRunnerToken } from "../runner/attached/auth.mjs";
const secret = "S".repeat(48);
test("only exact strong bearer token authenticates", () => {
  assert.equal(authenticatedRunnerRequest("Bearer " + secret, secret), true);
  for (const header of [undefined, "", "Bearer ", secret, "Basic " + secret, "Bearer " + "x".repeat(48), "Bearer " + secret + "x"]) {
    assert.equal(authenticatedRunnerRequest(header, secret), false);
  }
});
test("missing, short and malformed secrets fail closed", () => {
  for (const value of [undefined, null, "", "short", "a".repeat(257), "a".repeat(31), "a".repeat(40) + "\n"]) {
    assert.equal(validRunnerToken(value), false);
    assert.equal(authenticatedRunnerRequest("Bearer " + secret, value), false);
  }
});
