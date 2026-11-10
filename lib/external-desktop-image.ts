/** Reject non-JPEG responses and malformed/oversized screenshot payloads. */
export function validAttachedJpeg(value: unknown, maxBytes = 8 * 1024 * 1024): value is Uint8Array {
  if (!(value instanceof Uint8Array) || !Number.isSafeInteger(maxBytes) || maxBytes < 4) return false;
  if (value.byteLength < 4 || value.byteLength > maxBytes) return false;
  return value[0] === 0xff && value[1] === 0xd8 &&
    value[value.byteLength - 2] === 0xff && value[value.byteLength - 1] === 0xd9;
}
