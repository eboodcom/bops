import { createHmac, timingSafeEqual } from "node:crypto";

export const PROTOCOL_VERSION = 1;
export const MAX_CLOCK_SKEW_MS = 30_000;
const NONCE_PATTERN = /^[a-f0-9]{32}$/;
const ACTIONS = new Set(["health"]);

export function canonicalMessage(message) {
  return [message.version, message.action, message.timestamp, message.nonce].join("\n");
}

export function signRunnerMessage(message, secret) {
  if (typeof secret !== "string" || !/^[A-Za-z0-9_-]{32,256}$/.test(secret))
    throw new Error("Strong shared secret required");
  return createHmac("sha256", secret).update(canonicalMessage(message)).digest("hex");
}

/**
 * replayCache is owned by the caller and should be bounded/expired in a
 * future deployed transport. This function makes no network requests.
 */
export function verifyRunnerMessage(message, signature, secret, replayCache, now = Date.now()) {
  if (!message || typeof message !== "object" || Array.isArray(message)) return false;
  if (message.version !== PROTOCOL_VERSION || !ACTIONS.has(message.action)) return false;
  if (!Number.isSafeInteger(message.timestamp) || Math.abs(now - message.timestamp) > MAX_CLOCK_SKEW_MS) return false;
  if (typeof message.nonce !== "string" || !NONCE_PATTERN.test(message.nonce)) return false;
  if (typeof signature !== "string" || !/^[a-f0-9]{64}$/.test(signature)) return false;
  if (!(replayCache instanceof Set) || replayCache.has(message.nonce)) return false;
  let expected;
  try { expected = signRunnerMessage(message, secret); } catch { return false; }
  if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"))) return false;
  replayCache.add(message.nonce);
  return true;
}
