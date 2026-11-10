import assert from "node:assert/strict";
import test from "node:test";
import { attachedComputerReadiness } from "../lib/external-orgo-readiness.ts";

test("read-only readiness requires actual attachment and screenshot verification", () => {
  const evidence = { ownerVerified: true, identityVerified: true, computerRunning: true };
  assert.equal(attachedComputerReadiness(evidence).readOnlyReady, false);
  assert.deepEqual(attachedComputerReadiness(evidence).missingReadOnlyEvidence, ["attachmentRecorded", "screenshotVerified"]);
  const verified = attachedComputerReadiness({ ...evidence, attachmentRecorded: true, screenshotVerified: true });
  assert.equal(verified.readOnlyReady, true);
  assert.equal(verified.deploymentReady, false);
  assert.equal(verified.mutatingActionsAuthorized, false);
});
test("even complete deployment evidence never grants mutating action permission", () => {
  const evidence = {
    ownerVerified: true, identityVerified: true, computerRunning: true, ciPassed: true,
    isolatedRuntimeBuilt: true, isolatedRuntimeTestsPassed: true, securityReviewPassed: true,
    explicitOwnerDeploymentApproval: true, portAvailable: true,
    existingServicesUnchanged: true, rollbackVerified: true,
    attachmentRecorded: true, screenshotVerified: true,
  };
  const result = attachedComputerReadiness(evidence);
  assert.equal(result.deploymentReady, true);
  assert.equal(result.mutatingActionsAuthorized, false);
});

test("unknown, missing or false evidence fails closed", () => {
  for (const evidence of [
    {}, { ownerVerified: false }, { ownerVerified: "true" },
    { ownerVerified: true, identityVerified: true, computerRunning: true,
      attachmentRecorded: true, screenshotVerified: "true" },
  ]) {
    const result = attachedComputerReadiness(evidence);
    assert.equal(result.readOnlyReady, false);
    assert.equal(result.deploymentReady, false);
    assert.equal(result.mutatingActionsAuthorized, false);
    assert.ok(result.missingReadOnlyEvidence.length > 0);
    assert.ok(result.missingReleaseEvidence.length > 0);
  }
});
