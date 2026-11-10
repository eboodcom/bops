/**
 * Proposed non-destructive onboarding plan for an existing, user-owned Orgo VM.
 * Planning only: no command in this module is executed.
 * A separate, owner-approved execution path is required before touching a VM.
 */
export type ExternalOnboardingPlan = {
  computerId: string;
  root: string;
  readOnlyChecks: readonly string[];
  proposedChanges: readonly string[];
  requiresOwnerApproval: true;
  executable: false;
};

export function planExternalOnboarding(computerId: string): ExternalOnboardingPlan {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(computerId))
    throw new Error("Invalid Orgo computer ID.");
  return {
    computerId,
    root: "/opt/bops-attached",
    readOnlyChecks: [
      "Verify identity, OS, available disk space, and existing services",
      "Check whether /opt/bops-attached already exists without modifying it",
      "Inspect ports and runtime dependencies without installing packages",
    ],
    proposedChanges: [
      "Create an isolated Bops-owned directory only after explicit approval",
      "Install version-pinned Bops runner artifacts only inside the approved directory",
      "Start a separately named service without modifying existing desktop or login services",
    ],
    requiresOwnerApproval: true,
    executable: false,
  };
}
