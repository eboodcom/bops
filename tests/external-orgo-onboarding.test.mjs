import assert from "node:assert/strict";
import test from "node:test";
import { planExternalOnboarding } from "../lib/external-orgo-onboarding.ts";

const id = "cc5f24e5-3e35-4ca2-ad4a-2ca8d8f82c39";
test("isolated onboarding plan is inert and requires explicit approval", () => {
  const plan = planExternalOnboarding(id);
  assert.equal(plan.computerId, id);
  assert.equal(plan.root, "/opt/bops-attached");
  assert.equal(plan.executable, false);
  assert.equal(plan.requiresOwnerApproval, true);
  assert.ok(plan.readOnlyChecks.length >= 3);
});
test("plan excludes destructive operations and default Bops setup", () => {
  const plan = planExternalOnboarding(id);
  const steps = [...plan.readOnlyChecks, ...plan.proposedChanges].join(" ").toLowerCase();
  for (const forbidden of ["rm -rf", "mkfs", "growdisk", "wipe", "delete computer", "reset computer", "replace desktop"]) {
    assert.equal(steps.includes(forbidden), false, forbidden);
  }
});
test("plan rejects invalid computer IDs", () => {
  assert.throws(() => planExternalOnboarding("invalid"), /Invalid Orgo computer ID/);
});
