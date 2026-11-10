/**
 * External computers must not inherit Bops' normal provision, reset, or teardown
 * actions. Only narrowly enumerated read-only actions are eligible for a future
 * approved runner. This policy does not execute commands.
 */
export type ExternalComputerAction =
  | "inspect"
  | "screenshot"
  | "provision"
  | "grow-disk"
  | "reset"
  | "delete"
  | "install-runner"
  | "desktop-control"
  | "execute-task"
  | "rename-desktop"
  | "unknown";

export type ExternalRuntimePermission = {
  attached: boolean;
  ownerVerified: boolean;
  explicitlyApproved: boolean;
};

export function externalActionAllowed(
  permission: ExternalRuntimePermission,
  action: ExternalComputerAction,
): boolean {
  if (!permission.attached) return false;
  if (!permission.ownerVerified) return false;
  if (action === "inspect" || action === "screenshot") return true;
  // Approval is necessary but not sufficient: there is no isolated executor
  // yet, so no mutating or interactive operation is enabled.
  return false;
}
