import assert from "node:assert/strict";
import test from "node:test";
import { createAttachedHealthServer, HOST } from "../runner/attached/health-server.mjs";
import { attachedRunnerHealth } from "../lib/external-runner-client.ts";
test("client validates real authenticated health response", async (t) => {
  const token = "Z".repeat(48);
  const server = createAttachedHealthServer(token);
  await new Promise((resolve) => server.listen(0, HOST, resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  assert.equal((await attachedRunnerHealth(token, port)).healthy, true);
  assert.equal((await attachedRunnerHealth("Y".repeat(48), port)).healthy, false);
  assert.equal((await attachedRunnerHealth("short", port)).healthy, false);
  assert.equal((await attachedRunnerHealth(token, 80)).healthy, false);
});
