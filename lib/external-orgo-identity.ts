/** Verify the Orgo response identifies the exact computer requested. */
export function matchesAttachedComputerId(expected: string, actual: unknown): boolean {
  return typeof actual === "string" &&
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(expected) &&
    actual.toLowerCase() === expected.toLowerCase();
}
