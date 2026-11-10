import assert from "node:assert/strict";
import test from "node:test";
import { matchesAttachedComputerId } from "../lib/external-orgo-identity.ts";
const id = "cc5f24e5-3e35-4ca2-ad4a-2ca8d8f82c39";
test("accepts only the same complete computer UUID", () => {
  assert.equal(matchesAttachedComputerId(id, id), true);
  assert.equal(matchesAttachedComputerId(id.toUpperCase(), id), true);
  assert.equal(matchesAttachedComputerId(id, "cc5f24e5-3e35-4ca2-ad4a-2ca8d8f82c30"), false);
  assert.equal(matchesAttachedComputerId(id, null), false);
  assert.equal(matchesAttachedComputerId(id, { id }), false);
  assert.equal(matchesAttachedComputerId("swift-prism", "swift-prism"), false);
  assert.equal(matchesAttachedComputerId(id, id + " "), false);
});
