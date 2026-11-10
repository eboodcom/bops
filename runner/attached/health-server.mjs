/**
 * Minimal isolated runner process. No desktop access, shell execution, Orgo
 * credentials, installation, filesystem writes or task execution.
 * Not started automatically. An owner-approved installation is required.
 */
import { createServer } from "node:http";
import { authenticatedRunnerRequest, validRunnerToken } from "./auth.mjs";
import { verifyRunnerMessage } from "./protocol.mjs";
import { RunnerReplayCache } from "./replay-cache.mjs";

export const HOST = "127.0.0.1";
export const DEFAULT_PORT = 43211;

export function createAttachedHealthServer(token) {
  if (!validRunnerToken(token)) throw new Error("A strong runner token is required.");
  const replayCache = new RunnerReplayCache();
  return createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (request.method === "POST" && request.url === "/v1/message") {
      if (!authenticatedRunnerRequest(request.headers.authorization, token)) {
        response.writeHead(401);
        response.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
      const chunks = [];
      let bytes = 0;
      try {
        for await (const chunk of request) {
          bytes += chunk.length;
          if (bytes > 2048) {
            response.writeHead(413);
            response.end(JSON.stringify({ error: "Message too large" }));
            return;
          }
          chunks.push(chunk);
        }
        const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
            Object.keys(payload).sort().join(",") !== "message,signature" ||
            !payload.message || typeof payload.message !== "object" || Array.isArray(payload.message) ||
            Object.keys(payload.message).sort().join(",") !== "action,nonce,timestamp,version" ||
            !verifyRunnerMessage(payload.message, payload.signature, token, replayCache)) {
          response.writeHead(403);
          response.end(JSON.stringify({ error: "Invalid signed message" }));
          return;
        }
        response.writeHead(200);
        response.end(JSON.stringify({ service: "bops-attached-runner", status: "healthy", controlEnabled: false, tasksEnabled: false, version: 1 }));
      } catch {
        if (!response.headersSent) {
          response.writeHead(400);
          response.end(JSON.stringify({ error: "Invalid message body" }));
        }
      }
      return;
    }
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
