import { externalReleaseGate, type ExternalReleaseEvidence } from "./external-orgo-release-gate.ts";

export type ReadinessInput = Partial<ExternalReleaseEvidence> & Readonly<{
  attachmentRecorded?: boolean;
  screenshotVerified?: boolean;
}>;

/** A status summary, not permission to install, modify or operate a computer. */
export function attachedComputerReadiness(input: ReadinessInput) {
  const release = externalReleaseGate(input);
  const readOnlyReady = input.ownerVerified === true &&
    input.identityVerified === true &&
    input.computerRunning === true &&
    input.attachmentRecorded === true &&
    input.screenshotVerified === true;
  return {
    readOnlyReady,
    deploymentReady: release.ready,
    missingReleaseEvidence: release.missing,
    missingReadOnlyEvidence: ([
      "ownerVerified", "identityVerified", "computerRunning",
      "attachmentRecorded", "screenshotVerified",
    ] as const).filter((key) => input[key] !== true),
    mutatingActionsAuthorized: false as const,
  };
}
