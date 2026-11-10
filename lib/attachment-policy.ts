/**
 * Pure validation for attaching a computer that Bops does not own.
 * This module must never call Orgo or mutate a bot or a VM.
 */
export type AttachmentCandidate = {
  isMain?: boolean;
  computerId?: string;
  computerStatus?: string;
};

export function attachmentEligibility(
  target: AttachmentCandidate | undefined,
  computerId: string,
  assignedComputerIds: readonly (string | undefined)[],
): string | null {
  if (!target?.isMain) return "Choose a main bot.";
  if (target.computerId || target.computerStatus === "cloning")
    return "This bot already has a computer or is setting one up.";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(computerId))
    return "Invalid Orgo computer ID.";
  if (assignedComputerIds.some((assigned) => assigned?.toLowerCase() === computerId.toLowerCase()))
    return "Computer already assigned.";
  return null;
}
