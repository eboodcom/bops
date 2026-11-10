import assert from "node:assert/strict";
import test from "node:test";
import { createAttachedHealthServer, HOST } from "../runner/attached/health-server.mjs";
import { signedRunnerHealth } from "../runner/attached/signed-client.mjs";
test("signed client validates healthy runner and refuses wrong token", async (t) => {
  const token = "Q".repeat(48);
  const server = createAttachedHealthServer(token);
  await new Promise((resolve) => server.listen(0, HOST, resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  assert.deepEqual(await signedRunnerHealth(token, port), { healthy: true });
  assert.deepEqual(await signedRunnerHealth("W".repeat(48), port), { healthy: false });
  assert.deepEqual(await signedRunnerHealth("short", port), { healthy: false });
});
