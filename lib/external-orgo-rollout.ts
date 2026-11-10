import { externalReleaseGate, type ExternalReleaseEvidence } from "./external-orgo-release-gate.ts";

export type ExternalRolloutStage = "blocked" | "read-only" | "approved-install" | "runtime-tested";

export function externalRolloutStage(input: {
  attached: boolean;
  ownerVerified: boolean;
  diagnosticsHealthy: boolean;
  releaseEvidence: Partial<ExternalReleaseEvidence>;
  runtimeSmokeTestPassed: boolean;
}): ExternalRolloutStage {
  if (!input.attached || !input.ownerVerified || !input.diagnosticsHealthy) return "blocked";
  if (!externalReleaseGate(input.releaseEvidence).ready) return "read-only";
  // This is a classification only. No installation or activation is performed.
  return input.runtimeSmokeTestPassed ? "runtime-tested" : "approved-install";
}
