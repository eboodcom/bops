import assert from "node:assert/strict";
import test from "node:test";
import { authorizeAttachedClick, validAttachedClick, CLICK_CONFIRMATION } from "../lib/external-desktop-action.ts";
const good = { authenticated: true, featureEnabled: true, attached: true, ownerVerified: true, identityVerified: true, running: true, confirmation: CLICK_CONFIRMATION };
test("one-click authorization fails closed for every missing condition", () => {
  assert.equal(authorizeAttachedClick(good), null);
  for (const field of ["authenticated", "featureEnabled", "attached", "ownerVerified", "identityVerified", "running"])
    assert.notEqual(authorizeAttachedClick({ ...good, [field]: false }), null, field);
  assert.notEqual(authorizeAttachedClick({ ...good, confirmation: "yes" }), null);
});
test("click coordinates must be integer and inside screen bounds", () => {
  const screen = { width: 1920, height: 1080 };
  assert.equal(validAttachedClick({ ...screen, x: 1919, y: 1079 }), true);
  for (const [x, y] of [[1920, 2], [-1, 2], [1.5, 2], [2, 1080], [2, NaN], [Infinity, 2]])
    assert.equal(validAttachedClick({ ...screen, x, y }), false);
  assert.equal(validAttachedClick({ ...screen, width: 0, x: 1, y: 1 }), false);
});
