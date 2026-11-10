import assert from "node:assert/strict";
import test from "node:test";
import { externalActionAllowed } from "../lib/external-orgo-runtime-policy.ts";

const allowed = { attached: true, ownerVerified: true, explicitlyApproved: false };
test("read-only actions require verified external attachment", () => {
  assert.equal(externalActionAllowed(allowed, "inspect"), true);
  assert.equal(externalActionAllowed(allowed, "screenshot"), true);
  for (const permission of [
    { ...allowed, attached: false },
    { ...allowed, ownerVerified: false },
    { attached: false, ownerVerified: false, explicitlyApproved: true },
  ]) {
    assert.equal(externalActionAllowed(permission, "inspect"), false);
    assert.equal(externalActionAllowed(permission, "screenshot"), false);
  }
});
test("mutating and interactive actions remain blocked even with approval", () => {
  const permission = { ...allowed, explicitlyApproved: true };
  for (const action of [
    "provision", "grow-disk", "reset", "delete", "install-runner",
    "desktop-control", "execute-task", "rename-desktop", "unknown",
  ]) {
    assert.equal(externalActionAllowed(permission, action), false, action);
  }
});
