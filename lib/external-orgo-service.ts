/**
 * A declarative, inert service specification for a future owner-approved
 * external runner. No commands are executed and no files are written.
 */
export const EXTERNAL_RUNNER_ROOT = "/opt/bops-attached";
export const EXTERNAL_RUNNER_SERVICE = "bops-attached-runner";
export const EXTERNAL_RUNNER_PORT = 43211;

export type ExternalRunnerSpec = Readonly<{
  root: typeof EXTERNAL_RUNNER_ROOT;
  service: typeof EXTERNAL_RUNNER_SERVICE;
  port: typeof EXTERNAL_RUNNER_PORT;
  artifactDirectory: string;
  dataDirectory: string;
  logDirectory: string;
  mayModifyExistingDesktop: false;
  mayModifyExistingServices: false;
  mayInstallSystemPackages: false;
  mayDeleteComputer: false;
  requiresOwnerApproval: true;
}>;

export function externalRunnerSpec(): ExternalRunnerSpec {
  return Object.freeze({
    root: EXTERNAL_RUNNER_ROOT,
    service: EXTERNAL_RUNNER_SERVICE,
    port: EXTERNAL_RUNNER_PORT,
    artifactDirectory: EXTERNAL_RUNNER_ROOT + "/releases",
    dataDirectory: EXTERNAL_RUNNER_ROOT + "/data",
    logDirectory: EXTERNAL_RUNNER_ROOT + "/logs",
    mayModifyExistingDesktop: false,
    mayModifyExistingServices: false,
    mayInstallSystemPackages: false,
    mayDeleteComputer: false,
    requiresOwnerApproval: true,
  });
}

/**
 * Reject relative paths, traversal, sibling prefixes, and the root itself.
 * This validates a proposed path only; it is NOT sufficient against symlinks
 * or races. A future executor must use lstat/realpath and secure openat-style
 * operations on the VM before writing or removing anything.
 */
export function isWithinExternalRunnerRoot(path: string): boolean {
  if (!path.startsWith(EXTERNAL_RUNNER_ROOT + "/")) return false;
  if (path.includes("\\") || path.includes("\0")) return false;
  const parts = path.split("/");
  if (parts.some((part, index) => part === "." || part === ".." || (part === "" && index !== 0))) return false;
  return true;
}
