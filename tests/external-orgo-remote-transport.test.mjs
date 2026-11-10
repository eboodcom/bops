import assert from "node:assert/strict";
import test from "node:test";
import { selectExternalTransport } from "../lib/external-orgo-remote-transport.ts";
const verified = { attached: true, ownerVerified: true, identityVerified: true };
test("only verified metadata can use existing Orgo REST transport", () => {
  assert.deepEqual(selectExternalTransport({ ...verified, operation: "computer-metadata" }),
    { permitted: true, channel: "orgo-read-only-api" });
  for (const key of ["attached", "ownerVerified", "identityVerified"]) {
    assert.equal(selectExternalTransport({ ...verified, [key]: false, operation: "computer-metadata" }).permitted, false);
  }
});
test("verified owner can select read-only screenshot over Orgo REST", () => {
  assert.deepEqual(selectExternalTransport({ ...verified, operation: "screenshot" }),
    { permitted: true, channel: "orgo-read-only-api" });
  for (const key of ["attached", "ownerVerified", "identityVerified"])
    assert.equal(selectExternalTransport({ ...verified, [key]: false, operation: "screenshot" }).permitted, false);
});
test("no cross-host runner health or computer mutation without audited transport", () => {
  for (const operation of ["runner-health", "desktop-input", "task-execution", "shell", "install", "delete"]) {
    assert.equal(selectExternalTransport({ ...verified, operation }).permitted, false, operation);
  }
});
