# Existing Orgo computer — controlled first verification

**Status:** preparation only. This document is not approval to attach, install, click, type, restart or deploy anything.

## Scope and stop conditions

- Existing user-owned computer: `swift-prism`, ID `cc5f24e5-3e35-4ca2-ad4a-2ca8d8f82c39`.
- Do not create a second Orgo VM or change the existing computer's name, workspace, power state, display, applications or services.
- Do not use Orgo bash, click, type, key, install, resize, delete, restart, or screen creation during the first read-only verification.
- Keep `BOPS_EXTERNAL_ORGO_ATTACH_ENABLED`, `BOPS_EXTERNAL_ORGO_DESKTOP_CLICK_ENABLED`, and `BOPS_EXTERNAL_ORGO_DESKTOP_TYPE_ENABLED` **unset/false** until the owner separately approves the appropriate stage.
- Do not copy API keys, UI tokens, cookies or other secrets into chat, screenshots, PRs or logs.
- Stop immediately if computer ID, workspace owner role, running state or screen identity cannot be verified.

## Stage A — repository evidence (no VM access)

1. Confirm **both** CI workflows succeeded on the *same current branch HEAD*. An older green commit does not count.
2. Review the diff for the attach, preflight, screens, screenshot, click and type endpoints. Confirm no mutating route is reachable without the disabled-by-default flag.
3. Check that deployment and rollback instructions refer only to Bops app files and its isolated runner, never the existing Orgo desktop or unrelated services.
4. Record the commit SHA and workflow run IDs. If any check is red, do not deploy.

## Stage B — owner-approved read-only connection test

**Requires separate owner approval before performing.** The owner keeps the Orgo API key private in their existing environment.

1. Verify the configured Bops window authentication token is present and working. Do not expose it.
2. With owner approval, run only the read-only attachment preflight for the exact computer ID and intended main bot. Confirm Orgo GET identifies the expected computer and the owner workspace contains the same computer.
3. Record `ownerWorkspaceVerified`, `running`, and exact identity; do not infer ownership from the computer name alone.
4. Attachment is a separate state change. Request explicit owner approval before enabling the attachment flag or saving the assignment.
5. After owner-approved attachment, open Computers (Orgo) → View desktop (read-only). Verify screen geometry and request **one** still screenshot; confirm it matches the existing VM. No auto-refresh or desktop input.
6. Confirm the user's existing independent Orgo access still works. If not, stop; do not attempt automated repair.

## Stage C — deployment gate (not part of first test)

Only consider isolated runner deployment after all release-gate evidence is independently verified: CI, isolated build and tests, security review, port availability, existing services unchanged, rollback verified, and explicit owner deployment approval. The runner is designed for `/opt/bops-attached`, service `bops-attached-runner`, loopback port `43211`; none is installed by this branch.

A successful read-only screenshot **does not** authorize keyboard, mouse, bash, autonomous control, or deployment.

## Rollback boundaries

- The first read-only verification must not install anything on the Orgo VM, so no Orgo-side rollback should be necessary.
- If an owner-approved attachment must be undone, remove only Bops' local attachment assignment using the application's supported detach/reset path after confirming it cannot issue an Orgo DELETE. Do not delete the underlying computer.
- Never delete `swift-prism` or replace it with a new paid VM as a recovery action.
- If identity or ownership evidence changes, stop and re-run preflight; do not retry mutating operations automatically.

## Evidence record (fill only from actual checks)

| Evidence | Result | Verified by / time |
| --- | --- | --- |
| Branch HEAD and both CI runs green | Pending | |
| Owner and computer identity verified | Pending | |
| Computer running | Pending | |
| Owner approved attachment | Pending | |
| Attachment recorded | Pending | |
| One real screenshot matches computer | Pending | |
| Independent Orgo access unchanged | Pending | |
| Owner approved isolated runner deployment | Not requested | |

Do not mark a pending item complete from a simulated response, unit test, or estimated percentage.
