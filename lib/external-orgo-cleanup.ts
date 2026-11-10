import { EXTERNAL_RUNNER_ROOT, isWithinExternalRunnerRoot } from "./external-orgo-service.ts";

/**
 * Cleanup planner only. A future executor must additionally verify ownership,
 * explicit approval, real paths and symlink safety before touching disk.
 */
export function externalCleanupTargets(input: {
  attached: boolean;
  ownerApproved: boolean;
  service: string;
  paths: readonly string[];
}): { allowed: boolean; reason?: string; paths: readonly string[] } {
  if (!input.attached || !input.ownerApproved)
    return { allowed: false, reason: "External cleanup requires attachment and explicit owner approval.", paths: [] };
  if (input.service !== "bops-attached-runner")
    return { allowed: false, reason: "Service is not owned by the isolated runner.", paths: [] };
  if (!input.paths.every(isWithinExternalRunnerRoot))
    return { allowed: false, reason: "Cleanup target is outside the isolated runner directory.", paths: [] };
  if (input.paths.some((path) => path === EXTERNAL_RUNNER_ROOT + "/data"))
    return { allowed: false, reason: "Persistent runner data requires a separate explicit removal decision.", paths: [] };
  return { allowed: true, paths: [...input.paths] };
}
