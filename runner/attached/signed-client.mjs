import { randomBytes } from "node:crypto";
import { signRunnerMessage } from "./protocol.mjs";
import { validRunnerToken } from "./auth.mjs";

/** Only works on the SAME HOST as the runner; no cross-host transport. */
export async function signedRunnerHealth(token, port = 43211) {
  if (!validRunnerToken(token) || !Number.isInteger(port) || port < 1024 || port > 65535)
    return { healthy: false };
  const message = {
    version: 1, action: "health", timestamp: Date.now(), nonce: randomBytes(16).toString("hex"),
  };
  try {
    const response = await fetch("http://127.0.0.1:" + port + "/v1/message", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ message, signature: signRunnerMessage(message, token) }),
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!response.ok) return { healthy: false };
    const data = await response.json();
    return { healthy: data?.service === "bops-attached-runner" && data?.status === "healthy" &&
      data?.controlEnabled === false && data?.tasksEnabled === false && data?.version === 1 };
  } catch { return { healthy: false }; }
}
