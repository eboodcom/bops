import { timingSafeEqual } from "node:crypto";

export function validRunnerToken(value) {
  return typeof value === "string" && value.length >= 32 && value.length <= 256 && /^[A-Za-z0-9_-]+$/.test(value);
}

export function authenticatedRunnerRequest(header, expectedToken) {
  if (!validRunnerToken(expectedToken)) return false;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return false;
  const candidate = header.slice(7);
  if (!validRunnerToken(candidate)) return false;
  const expected = Buffer.from(expectedToken);
  const actual = Buffer.from(candidate);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
