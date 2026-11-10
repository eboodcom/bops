/**
 * Attachment is an owner-initiated state change. Never treat a preflight,
 * computer access, or an absent desktop token as permission to attach.
 */
export const ATTACH_CONFIRMATION = "ATTACH EXISTING COMPUTER";

export function authorizeExternalAttachment(input: {
  uiTokenConfigured: boolean;
  authenticatedWindow: boolean;
  featureEnabled: boolean;
  confirmation: unknown;
}): string | null {
  if (!input.uiTokenConfigured || !input.authenticatedWindow)
    return "An authenticated Bops window is required.";
  if (!input.featureEnabled)
    return "Existing computer attachment is not enabled on this server.";
  if (input.confirmation !== ATTACH_CONFIRMATION)
    return "Explicit attachment confirmation is required.";
  return null;
}
