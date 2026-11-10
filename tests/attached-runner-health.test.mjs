import assert from "node:assert/strict";
import test from "node:test";
import { createAttachedHealthServer, DEFAULT_PORT, HOST, parseRunnerPort } from "../runner/attached/health-server.mjs";

test("runner defaults to loopback and an unprivileged port", () => {
  assert.equal(HOST, "127.0.0.1");
  assert.equal(DEFAULT_PORT, 43211);
  assert.equal(parseRunnerPort(undefined), 43211);
  assert.equal(parseRunnerPort("43212"), 43212);
  for (const value of ["0", "80", "-1", "65536", "abc", "43211abc", ""]) {
    assert.throws(() => parseRunnerPort(value));
  }
});
test("runner responds to authenticated health without exposing computer control", async (t) => {
  const token = "a".repeat(48);
  assert.throws(() => createAttachedHealthServer(undefined));
  const server = createAttachedHealthServer(token);
  await new Promise((resolve) => server.listen(0, HOST, resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const base = "http://" + HOST + ":" + address.port;
  const unauthorized = await fetch(base + "/health");
  assert.equal(unauthorized.status, 401);
  const health = await fetch(base + "/health", { headers: { Authorization: "Bearer " + token } });
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), {
    service: "bops-attached-runner", status: "healthy",
    controlEnabled: false, tasksEnabled: false, version: 1,
  });
  assert.equal(health.headers.get("cache-control"), "no-store");
  assert.equal((await fetch(base + "/tasks", { method: "POST" })).status, 404);
  assert.equal((await fetch(base + "/health", { method: "POST" })).status, 404);
  assert.equal((await fetch(base + "/unknown")).status, 404);
});
