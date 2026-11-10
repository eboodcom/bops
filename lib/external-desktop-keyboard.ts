export const TYPE_CONFIRMATION = "ALLOW ONE DESKTOP TYPE";
export function authorizeAttachedType(input: {
  authenticated: boolean; featureEnabled: boolean; ownerVerified: boolean;
  identityVerified: boolean; attached: boolean; running: boolean; confirmation: unknown;
}): string | null {
  if (!input.authenticated) return "Authenticated window required.";
  if (!input.featureEnabled) return "Attached keyboard disabled.";
  if (!input.attached || !input.ownerVerified || !input.identityVerified || !input.running)
    return "Owner, identity and running state must be verified.";
  if (input.confirmation !== TYPE_CONFIRMATION) return "Confirm this typing action explicitly.";
  return null;
}
/** No newlines, terminal control characters, or large pasted payloads. */
export function validAttachedText(value: unknown): value is string {
  return typeof value === "string" && value.length >= 1 && value.length <= 200 &&
    !/[\u0000-\u001f\u007f]/.test(value);
}
/** Origin required for cookie-authenticated write operations. */
export function sameOriginWrite(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}
