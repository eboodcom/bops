import assert from "node:assert/strict";
import test from "node:test";
import { createAttachedHealthServer, HOST } from "../runner/attached/health-server.mjs";
import { signRunnerMessage } from "../runner/attached/protocol.mjs";
const token = "T".repeat(48);
test("signed HTTP health message works once and refuses replay or control", async (t) => {
  const server = createAttachedHealthServer(token);
  await new Promise((resolve) => server.listen(0, HOST, resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = "http://" + HOST + ":" + server.address().port + "/v1/message";
  const post = (body, auth = token) => fetch(url, {
    method: "POST", headers: { Authorization: "Bearer " + auth, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const message = { version: 1, action: "health", timestamp: Date.now(), nonce: "c".repeat(32) };
  const payload = { message, signature: signRunnerMessage(message, token) };
  assert.equal((await post(payload, "X".repeat(48))).status, 401);
  const accepted = await post(payload);
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).tasksEnabled, false);
  assert.equal((await post(payload)).status, 403);
  const unsafe = { ...message, action: "shell", nonce: "d".repeat(32) };
  assert.equal((await post({ message: unsafe, signature: signRunnerMessage(unsafe, token) })).status, 403);
  assert.equal((await post({ ...payload, extra: true })).status, 403);
  assert.equal((await post({ message: { ...message, extra: true }, signature: payload.signature })).status, 403);
});
