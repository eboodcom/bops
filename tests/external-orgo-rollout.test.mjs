import assert from "node:assert/strict";
import test from "node:test";
import { EXTERNAL_RELEASE_REQUIREMENTS } from "../lib/external-orgo-release-gate.ts";
import { externalRolloutStage } from "../lib/external-orgo-rollout.ts";
const all = Object.fromEntries(EXTERNAL_RELEASE_REQUIREMENTS.map((key) => [key, true]));
const base = { attached: true, ownerVerified: true, diagnosticsHealthy: true, releaseEvidence: all, runtimeSmokeTestPassed: false };
test("rollout blocks unverified and unhealthy attachments", () => {
  for (const key of ["attached", "ownerVerified", "diagnosticsHealthy"])
    assert.equal(externalRolloutStage({ ...base, [key]: false }), "blocked");
});
test("approval alone never skips runtime verification", () => {
  assert.equal(externalRolloutStage({ ...base, releaseEvidence: {} }), "read-only");
  assert.equal(externalRolloutStage(base), "approved-install");
  assert.equal(externalRolloutStage({ ...base, runtimeSmokeTestPassed: true }), "runtime-tested");
  assert.equal(externalRolloutStage({ ...base, releaseEvidence: {}, runtimeSmokeTestPassed: true }), "read-only");
});
