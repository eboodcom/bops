import "server-only";
import { execFile, spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { onRunner } from "./persist";
import { stateUser } from "./store";

/**
 * Secrets in the Mac's Keychain, under "Bops Vault". Values go to `security` on stdin, hex-encoded,
 * so they never show up in the process list; reading one back only names the item. A computer's runner
 * has no Keychain: nothing is there to read (a saved login, a Telegram token), and nothing is kept.
 */
const SERVICE = "Bops Vault";
const q = (s: string) => `"${s.replace(/["\\]/g, "")}"`;
const NOT_HERE = "Secrets cannot be stored on a bot runner.";

/**
 * Linux-only lab storage. Unlike macOS Keychain this is NOT encrypted at rest.
 * Run Bops under a dedicated service account; protect server backups.
 */
const linuxRoot = () => process.env.BOPS_LINUX_SECRET_DIR || join(homedir(), ".local", "share", "bops", "secrets");
const linuxPath = (account: string) => join(linuxRoot(), createHash("sha256").update(account).digest("hex") + ".secret");

async function privateDir() {
  const root = linuxRoot();
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const st = await fs.lstat(root);
  if (!st.isDirectory() || st.isSymbolicLink() || (st.mode & 0o077))
    throw new Error("Bops Linux secret directory must be private (0700) and not a symlink");
  return root;
}

async function linuxSet(account: string, value: string) {
  const root = await privateDir();
  const temp = join(root, ".tmp-" + randomBytes(16).toString("hex"));
  try {
    await fs.writeFile(temp, value, { encoding: "utf8", mode: 0o600, flag: "wx" });
    await fs.rename(temp, linuxPath(account));
  } finally {
    await fs.rm(temp, { force: true }).catch(() => {});
  }
}

async function linuxGet(account: string): Promise<string | null> {
  await privateDir();
  const path = linuxPath(account);
  try {
    const st = await fs.lstat(path);
    if (!st.isFile() || st.isSymbolicLink() || (st.mode & 0o077))
      throw new Error("Unsafe Bops Linux secret file permissions");
    return await fs.readFile(path, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

async function linuxDelete(account: string) {
  await privateDir();
  const path = linuxPath(account);
  try {
    const st = await fs.lstat(path);
    if (!st.isFile() || st.isSymbolicLink()) throw new Error("Unsafe Bops Linux secret file");
    await fs.unlink(path);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
}


export function setSecret(account: string, value: string) {
  if (onRunner()) return Promise.reject(new Error(NOT_HERE));
  if (process.platform === "linux") return linuxSet(account, value);
  if (process.platform !== "darwin") return Promise.reject(new Error("Unsupported secret storage platform"));
  return new Promise<void>((resolve, reject) => {
    const p = spawn("security", ["-i"], { stdio: ["pipe", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 && !err.trim() ? resolve() : reject(new Error(`Keychain refused it: ${err.trim() || code}`))));
    p.stdin.end(`add-generic-password -U -s ${q(SERVICE)} -a ${q(account)} -X ${Buffer.from(value, "utf8").toString("hex")}\n`);
  });
}

export function getSecret(account: string) {
  if (onRunner()) return Promise.resolve(null);
  if (process.platform === "linux") return linuxGet(account);
  if (process.platform !== "darwin") return Promise.reject(new Error("Unsupported secret storage platform"));
  return new Promise<string | null>((resolve) =>
    execFile("security", ["find-generic-password", "-s", SERVICE, "-a", account, "-w"], (e, out) => resolve(e ? null : out.replace(/\n$/, ""))),
  );
}

export function deleteSecret(account: string) {
  if (onRunner()) return Promise.resolve();
  if (process.platform === "linux") return linuxDelete(account);
  if (process.platform !== "darwin") return Promise.reject(new Error("Unsupported secret storage platform"));
  return new Promise<void>((resolve) => execFile("security", ["delete-generic-password", "-s", SERVICE, "-a", account], () => resolve()));
}

/*
 * A user's own secrets (a vault login's password and 2FA key, a channel's token): named for the
 * signed-in Orgo user, so another account signed in on this Mac never reaches them. Their state
 * lists them (the vault, the channels), and each user's state is their own. A secret saved before
 * names had a user is still read for the user whose state names it, and moved to their name.
 */
const forUser = (name: string) => {
  const user = stateUser();
  return user ? `${user}:${name}` : name;
};

export async function getUserSecret(name: string) {
  const named = forUser(name);
  const value = await getSecret(named);
  if (value !== null || named === name) return value;
  const old = await getSecret(name);
  if (old !== null)
    await setSecret(named, old)
      .then(() => deleteSecret(name))
      .catch(() => {});
  return old;
}

export const setUserSecret = (name: string, value: string) => setSecret(forUser(name), value);

export async function deleteUserSecret(name: string) {
  const named = forUser(name);
  await deleteSecret(named);
  if (named !== name) await deleteSecret(name);
}
