/**
 * Strict read-only ownership evidence for external Orgo computers.
 * An accessible computer or a missing workspace role does not prove ownership.
 */
export type WorkspaceEvidence = {
  id: string;
  name: string;
  role?: string;
  desktops?: { id: string }[];
};

export function ownerWorkspaceForComputer(
  workspaces: readonly WorkspaceEvidence[],
  computerId: string,
): WorkspaceEvidence | undefined {
  return workspaces.find((workspace) =>
    workspace.role?.toLowerCase() === "owner" &&
    workspace.desktops?.some((desktop) => desktop.id.toLowerCase() === computerId.toLowerCase()),
  );
}
