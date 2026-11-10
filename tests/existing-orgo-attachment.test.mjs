import assert from "node:assert/strict";
import test from "node:test";
import { attachmentEligibility } from "../lib/attachment-policy.ts";

const id = "cc5f24e5-3e35-4ca2-ad4a-2ca8d8f82c39";
const main = { isMain: true, computerStatus: "none" };

test("running main bot without assignment is eligible for read-only preflight", () => {
  assert.equal(attachmentEligibility(main, id, []), null);
});
test("rejects a non-main or missing bot", () => {
  assert.equal(attachmentEligibility(undefined, id, []), "Choose a main bot.");
  assert.equal(attachmentEligibility({ isMain: false }, id, []), "Choose a main bot.");
});
test("rejects an already assigned or cloning bot", () => {
  assert.match(attachmentEligibility({ ...main, computerId: id }, id, []) ?? "", /already has/);
  assert.match(attachmentEligibility({ ...main, computerStatus: "cloning" }, id, []) ?? "", /already has/);
});
test("rejects malformed identifiers and duplicate assignments", () => {
  assert.equal(attachmentEligibility(main, "not-a-uuid", []), "Invalid Orgo computer ID.");
  assert.equal(attachmentEligibility(main, id, [undefined, id]), "Computer already assigned.");
});
