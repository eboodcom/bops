import type { AttachedScreen } from "./external-desktop-screens.ts";

/** Resolve a requested screen from already sanitized geometry, never guessing IDs. */
export function selectAttachedScreen(
  screens: readonly AttachedScreen[],
  requestedId: string | null,
): AttachedScreen | null {
  if (requestedId !== null) {
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(requestedId)) return null;
    return screens.find((screen) => screen.id === requestedId) ?? null;
  }
  return screens.find((screen) => screen.default) ?? screens[0] ?? null;
}
