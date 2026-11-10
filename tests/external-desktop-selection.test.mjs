import assert from "node:assert/strict";
import test from "node:test";
import { selectAttachedScreen } from "../lib/external-desktop-selection.ts";

const screens = [
  { id: "screen-1", width: 1024, height: 768, default: false },
  { id: "screen-2", width: 1920, height: 1080, default: true },
];

test("omitted ID selects the advertised default screen", () => {
  assert.equal(selectAttachedScreen(screens, null)?.id, "screen-2");
});
test("explicit ID selects only a matching screen", () => {
  assert.equal(selectAttachedScreen(screens, "screen-1")?.id, "screen-1");
  assert.equal(selectAttachedScreen(screens, "screen-3"), null);
  assert.equal(selectAttachedScreen(screens, "../screen-1"), null);
  assert.equal(selectAttachedScreen(screens, ""), null);
});
test("empty geometry fails closed and first screen is fallback without a default", () => {
  assert.equal(selectAttachedScreen([], null), null);
  assert.equal(selectAttachedScreen([{ ...screens[0] }], null)?.id, "screen-1");
});
