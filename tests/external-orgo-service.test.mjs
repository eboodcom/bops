import assert from "node:assert/strict";
import test from "node:test";
import { externalRunnerSpec, isWithinExternalRunnerRoot, EXTERNAL_RUNNER_ROOT } from "../lib/external-orgo-service.ts";

test("external runner uses distinct service and isolated directories", () => {
  const spec = externalRunnerSpec();
  assert.equal(spec.root, EXTERNAL_RUNNER_ROOT);
  assert.equal(spec.service, "bops-attached-runner");
  assert.equal(spec.requiresOwnerApproval, true);
  for (const key of ["mayModifyExistingDesktop", "mayModifyExistingServices", "mayInstallSystemPackages", "mayDeleteComputer"]) {
    assert.equal(spec[key], false);
  }
  for (const path of [spec.artifactDirectory, spec.dataDirectory, spec.logDirectory]) {
    assert.equal(isWithinExternalRunnerRoot(path), true);
  }
});
test("path boundary denies root, sibling, traversal and ambiguous paths", () => {
  for (const path of [
    "/opt/bops-attached", "/opt/bops-attached-old/data",
    "/opt/bops-attached/../other", "/opt/bops-attached/./data",
    "/opt/bops-attached//data", "/opt/bops-attached/data\\outside",
    "/opt/bops-attached/data\0bad", "/opt/ib-bops-lab",
    "opt/bops-attached/data",
  ]) {
    assert.equal(isWithinExternalRunnerRoot(path), false, path);
  }
});
test("spec is immutable", () => {
  assert.equal(Object.isFrozen(externalRunnerSpec()), true);
});
