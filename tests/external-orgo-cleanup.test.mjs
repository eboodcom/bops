import assert from "node:assert/strict";
import test from "node:test";
import { externalCleanupTargets } from "../lib/external-orgo-cleanup.ts";

const base = { attached: true, ownerApproved: true, service: "bops-attached-runner", paths: ["/opt/bops-attached/releases/v1"] };
test("cleanup planner allows only explicitly approved isolated paths", () => {
  assert.deepEqual(externalCleanupTargets(base), { allowed: true, paths: base.paths });
});
test("cleanup refuses unapproved, unrelated service, or outside paths", () => {
  for (const change of [
    { attached: false }, { ownerApproved: false }, { service: "bops-runner" },
    { paths: ["/opt/bops-attached/releases/v1", "/opt/ib-bops-lab"] },
    { paths: ["/opt/bops-attached/../home"] },
    { paths: ["/opt/bops-attached/data"] },
    { paths: [] },
  ]) {
    const result = externalCleanupTargets({ ...base, ...change });
    assert.equal(result.allowed, false);
    assert.deepEqual(result.paths, []);
  }
});
