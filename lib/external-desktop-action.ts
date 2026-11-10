/** A single deliberate desktop click, never arbitrary task or shell execution. */
export const CLICK_CONFIRMATION = "ALLOW ONE DESKTOP CLICK";
export function authorizeAttachedClick(input: {
  authenticated: boolean;
  featureEnabled: boolean;
  attached: boolean;
  ownerVerified: boolean;
  identityVerified: boolean;
  running: boolean;
  confirmation: unknown;
}): string | null {
  if (!input.authenticated) return "Authenticated Bops window required.";
  if (!input.featureEnabled) return "Attached desktop control is disabled.";
  if (!input.attached || !input.ownerVerified || !input.identityVerified || !input.running)
    return "Computer identity, ownership and running state must be verified.";
  if (input.confirmation !== CLICK_CONFIRMATION) return "Explicit confirmation required for each click.";
  return null;
}
export function validAttachedClick(input: {
  x: unknown; y: unknown; width: unknown; height: unknown;
}): input is { x: number; y: number; width: number; height: number } {
  const { x, y, width, height } = input;
  return typeof width === "number" && Number.isSafeInteger(width) && width > 0 && width <= 16384 &&
    typeof height === "number" && Number.isSafeInteger(height) && height > 0 && height <= 16384 &&
    typeof x === "number" && Number.isSafeInteger(x) && x >= 0 && x < width &&
    typeof y === "number" && Number.isSafeInteger(y) && y >= 0 && y < height;
}
