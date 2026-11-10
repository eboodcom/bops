import { ownerWorkspaceForComputer, type WorkspaceEvidence } from "./attachment-ownership.ts";

export type ExternalComputerSnapshot = {
  id: string;
  name: string;
  status: string;
  cpu: number;
  ram: number;
  os: string;
};

export function classifyExternalComputer(input: {
  expectedId: string;
  computer: ExternalComputerSnapshot;
  workspaces: readonly WorkspaceEvidence[];
}): {
  ownerVerified: boolean;
  running: boolean;
  identityMatches: boolean;
  safeToInspect: boolean;
  reason: string;
} {
  const identityMatches = input.expectedId.toLowerCase() === input.computer.id.toLowerCase();
  const ownerVerified = identityMatches && Boolean(ownerWorkspaceForComputer(input.workspaces, input.expectedId));
  const running = input.computer.status === "running";
  return {
    ownerVerified,
    running,
    identityMatches,
    safeToInspect: ownerVerified && running,
    reason: !identityMatches ? "Computer identity mismatch."
      : !ownerVerified ? "Owner workspace membership was not verified."
      : !running ? "Computer is not running."
      : "Read-only inspection is permitted; runtime control remains disabled.",
  };
}
