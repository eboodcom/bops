import assert from "node:assert/strict";
import test from "node:test";
import { validAttachedJpeg } from "../lib/external-desktop-image.ts";
const jpeg = new Uint8Array([255,216,1,2,255,217]);
test("accepts bounded JPEG marker envelope", () => {
  assert.equal(validAttachedJpeg(jpeg), true);
  assert.equal(validAttachedJpeg(jpeg, 6), true);
  assert.equal(validAttachedJpeg(jpeg, 5), false);
});
test("rejects non-JPEG, truncation and oversized payloads", () => {
  assert.equal(validAttachedJpeg(new Uint8Array([137,80,78,71,13,10])), false);
  assert.equal(validAttachedJpeg(new Uint8Array([255,216,1,2])), false);
  assert.equal(validAttachedJpeg(new Uint8Array([255,216,255,217,1])), false);
  assert.equal(validAttachedJpeg("jpeg"), false);
  assert.equal(validAttachedJpeg(new Uint8Array(0)), false);
});
