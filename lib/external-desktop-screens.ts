export type AttachedScreen = { id: string; width: number; height: number; default: boolean };
/** Never expose VNC ports, passwords, or internal stream details. */
export function publicAttachedScreens(value: unknown): AttachedScreen[] {
  if (!Array.isArray(value) || value.length > 16) return [];
  const ids = new Set<string>();
  const out: AttachedScreen[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return [];
    const screen = item as Record<string, unknown>;
    if (typeof screen.id !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(screen.id) || ids.has(screen.id)) return [];
    if (typeof screen.width !== "number" || !Number.isSafeInteger(screen.width) || screen.width < 1 || screen.width > 16384) return [];
    if (typeof screen.height !== "number" || !Number.isSafeInteger(screen.height) || screen.height < 1 || screen.height > 16384) return [];
    ids.add(screen.id);
    out.push({ id: screen.id, width: screen.width, height: screen.height, default: screen.default === true });
  }
  return out;
}
