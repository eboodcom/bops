/**
 * This pure release gate is a prerequisite for any future attached-VM
 * deployment. It does not perform a deployment or authorize one by itself.
 */
export type ExternalReleaseEvidence = Readonly<{
  ownerVerified: boolean;
  identityVerified: boolean;
  computerRunning: boolean;
  ciPassed: boolean;
  isolatedRuntimeBuilt: boolean;
  isolatedRuntimeTestsPassed: boolean;
  securityReviewPassed: boolean;
  explicitOwnerDeploymentApproval: boolean;
  portAvailable: boolean;
  existingServicesUnchanged: boolean;
  rollbackVerified: boolean;
}>;

export const EXTERNAL_RELEASE_REQUIREMENTS = [
  "ownerVerified", "identityVerified", "computerRunning", "ciPassed",
  "isolatedRuntimeBuilt", "isolatedRuntimeTestsPassed", "securityReviewPassed",
  "explicitOwnerDeploymentApproval", "portAvailable",
  "existingServicesUnchanged", "rollbackVerified",
] as const satisfies readonly (keyof ExternalReleaseEvidence)[];

export function externalReleaseGate(evidence: Partial<ExternalReleaseEvidence>): {
  ready: boolean;
  missing: readonly (keyof ExternalReleaseEvidence)[];
} {
  const missing = EXTERNAL_RELEASE_REQUIREMENTS.filter((key) => evidence[key] !== true);
  return { ready: missing.length === 0, missing };
}
