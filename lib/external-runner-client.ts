/**
 * Read-only client for a future locally installed attached runner.
 * Never executes tasks or reaches a public host.
 */
export async function attachedRunnerHealth(token: string, port = 43211): Promise<{
  healthy: boolean;
  reason?: string;
}> {
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(token))
    return { healthy: false, reason: "Runner token missing or invalid." };
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    return { healthy: false, reason: "Invalid runner port." };
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!response.ok) return { healthy: false, reason: "Runner health request rejected." };
    const result: unknown = await response.json();
    if (!result || typeof result !== "object") return { healthy: false, reason: "Unexpected runner response." };
    const data = result as Record<string, unknown>;
    return {
      healthy: data.service === "bops-attached-runner" && data.status === "healthy" &&
        data.controlEnabled === false && data.tasksEnabled === false && data.version === 1,
      reason: "Health-only runner; remote task control is not enabled.",
    };
  } catch {
    return { healthy: false, reason: "Runner is unreachable or timed out." };
  }
}
