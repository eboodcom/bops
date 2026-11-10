import assert from "node:assert/strict";
import test from "node:test";
import { EXTERNAL_RELEASE_REQUIREMENTS, externalReleaseGate } from "../lib/external-orgo-release-gate.ts";

test("empty and partial release evidence always fail closed", () => {
  assert.equal(externalReleaseGate({}).ready, false);
  assert.deepEqual(externalReleaseGate({}).missing, [...EXTERNAL_RELEASE_REQUIREMENTS]);
  assert.equal(externalReleaseGate({ ownerVerified: true, ciPassed: true }).ready, false);
});
test("every required release condition independently blocks release", () => {
  const all = Object.fromEntries(EXTERNAL_RELEASE_REQUIREMENTS.map((key) => [key, true]));
  assert.equal(externalReleaseGate(all).ready, true);
  for (const key of EXTERNAL_RELEASE_REQUIREMENTS) {
    const denied = externalReleaseGate({ ...all, [key]: false });
    assert.equal(denied.ready, false, key);
    assert.deepEqual(denied.missing, [key]);
  }
});
test("only literal true counts as evidence", () => {
  const all = Object.fromEntries(EXTERNAL_RELEASE_REQUIREMENTS.map((key) => [key, true]));
  assert.deepEqual(externalReleaseGate({ ...all, explicitOwnerDeploymentApproval: "true" }).missing, ["explicitOwnerDeploymentApproval"]);
});
