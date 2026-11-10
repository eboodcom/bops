/**
 * Minimal isolated runner process. No desktop access, shell execution, Orgo
 * credentials, installation, filesystem writes or task execution.
 * Not started automatically. An owner-approved installation is required.
 */
import { createServer } from "node:http";
import { authenticatedRunnerRequest, validRunnerToken } from "./auth.mjs";

export const HOST = "127.0.0.1";
export const DEFAULT_PORT = 43211;

export function createAttachedHealthServer(token) {
  if (!validRunnerToken(token)) throw new Error("A strong runner token is required.");
  return createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (request.method !== "GET" || request.url !== "/health") {
      response.writeHead(404);
      response.end(JSON.stringify({ error: "Not found" }));
      return;
    }
    if (!authenticatedRunnerRequest(request.headers.authorization, token)) {
      response.writeHead(401);
      response.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
    response.writeHead(200);
    response.end(JSON.stringify({
      service: "bops-attached-runner",
      status: "healthy",
      controlEnabled: false,
      tasksEnabled: false,
      version: 1,
    }));
  });
}

export function parseRunnerPort(value) {
  if (value === undefined) return DEFAULT_PORT;
  if (typeof value !== "string" || !/^[0-9]{1,5}$/.test(value)) throw new Error("Invalid runner port");
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid runner port");
  return port;
}

if (process.argv[1] && import.meta.url === new URL("file://" + process.argv[1]).href) {
  const server = createAttachedHealthServer(process.env.BOPS_ATTACHED_RUNNER_TOKEN);
  server.listen(parseRunnerPort(process.env.BOPS_ATTACHED_PORT), HOST);
}
