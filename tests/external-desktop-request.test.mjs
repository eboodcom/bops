import assert from "node:assert/strict";
import test from "node:test";
import { parseDesktopJson } from "../lib/external-desktop-request.ts";
test("small JSON object is accepted", async () => {
  const req = new Request("https://example.com", { method: "POST", body: JSON.stringify({ text: "hi" }) });
  assert.deepEqual(await parseDesktopJson(req), { text: "hi" });
});
test("oversized payload without Content-Length is rejected", async () => {
  const bytes = new TextEncoder().encode(JSON.stringify({ text: "a".repeat(4000) }));
  const body = new ReadableStream({ start(controller) {
    controller.enqueue(bytes.subarray(0, 100));
    controller.enqueue(bytes.subarray(100));
    controller.close();
  } });
  const req = new Request("https://example.com", { method: "POST", body, duplex: "half" });
  assert.equal(await parseDesktopJson(req), null);
});
test("invalid JSON and array bodies are rejected", async () => {
  for (const body of ["[1]", "{", "null"]) {
    const req = new Request("https://example.com", { method: "POST", body });
    assert.equal(await parseDesktopJson(req), null);
  }
});
