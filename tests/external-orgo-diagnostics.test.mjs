import assert from "node:assert/strict";
import test from "node:test";
import { classifyExternalComputer } from "../lib/external-orgo-diagnostics.ts";
const id = "cc5f24e5-3e35-4ca2-ad4a-2ca8d8f82c39";
const computer = { id, name: "swift-prism", status: "running", cpu: 2, ram: 8, os: "linux" };
const workspaces = [{ id: "owned", name: "Personal", role: "owner", desktops: [{ id }] }];
test("only verified running computer can be inspected", () => {
  assert.deepEqual(classifyExternalComputer({ expectedId: id, computer, workspaces }), {
    ownerVerified: true, running: true, identityMatches: true, safeToInspect: true,
    reason: "Read-only inspection is permitted; runtime control remains disabled.",
  });
});
test("rejects accessible but unowned computer", () => {
  const result = classifyExternalComputer({ expectedId: id, computer, workspaces: [{ ...workspaces[0], role: "member" }] });
  assert.equal(result.ownerVerified, false);
  assert.equal(result.safeToInspect, false);
});
test("rejects mismatched identity and non-running computer", () => {
  assert.equal(classifyExternalComputer({ expectedId: id, computer: { ...computer, id: "other" }, workspaces }).safeToInspect, false);
  assert.equal(classifyExternalComputer({ expectedId: id, computer: { ...computer, status: "stopped" }, workspaces }).safeToInspect, false);
});
