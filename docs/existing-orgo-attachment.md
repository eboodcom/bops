# Existing Orgo computer attachment (development only)

Target: user-owned Orgo computer `swift-prism`, ID `cc5f24e5-3e35-4ca2-ad4a-2ca8d8f82c39`.

## Current status
- The read-only Orgo computer endpoint was verified by the owner using their own API key.
- `attachExistingOrgoComputer` is a **server-side service only**. No authenticated owner-facing endpoint/UI invokes it yet.
- `attachedOrgoComputer` distinguishes a user's existing computer from Bops-created computers.
- Reset and failed-setup cleanup do not delete attached computers.
- Automatic Bops setup is intentionally blocked on attached computers. **Do not mark them ready or use the service in production until an explicit non-destructive onboarding path is designed and tested.**
- If an attached computer becomes unreachable, healing does not create a replacement.

## Remaining blockers before deployment
1. Audit **all** Orgo destructive operations and lifecycle paths (including bot removal, workspace removal, and sign-out), not only `resetComputer`.
2. Add an owner-authenticated, CSRF-protected attach/detach action; never accept a computer ID from a bot-generated instruction or unauthenticated request.
3. Verify the computer's owner/workspace association, not merely its accessibility using the API key.
4. Implement explicit, consented, non-destructive Bops provisioning on an existing machine. Check and preserve existing files, services, browser profiles, credentials, disk and running processes; avoid `growDisk`, `applyDesktop`, `ensureTailnet` until effects are reviewed.
5. Ensure Bops setup can complete and `computerStatus` becomes `ready` only after verified successful provisioning.
6. Add automated tests for attachment, access denied, reset, failed setup, healing, account switch, and two bots racing to attach.
7. Run TypeScript, lint, production build, and staging tests against a disposable computer before touching `swift-prism`.
8. Only then deploy the reviewed branch to the Contabo lab and attach the existing computer through the owner UI.

## Operational safety
Never commit an Orgo API key. Never delete, stop, suspend, resize or reconfigure `swift-prism` as part of testing. Existing computer usage can continue to incur Orgo charges independently of Bops.

## Preparation batch — 10 November 2026
- Added an authenticated-window-only, **read-only** Orgo preflight route. It returns `canAttachNow: false` by design; it does not write to Orgo or change Bops assignment.
- The preflight fails closed if `BOPS_UI_TOKEN` is unset. A self-hosted server must establish an owner-authenticated control path before exposing attachment controls.
- Added a central `orgo.remove` guard for currently assigned externally attached computers, plus a desktop rename guard and state-epoch checks around the asynchronous attachment service.
- Added `.github/workflows/existing-orgo-attachment.yml` to request TypeScript and targeted ESLint checks. **No successful CI run has yet been observed.**
- Draft PR #1 opened for review. **Do not merge or deploy.**

## Explicit stop point before retrying swift-prism
Do not run the attachment service, call any computer mutation API, or try a live Boppy task until (1) owner authentication is valid on the hosted deployment, (2) owner/workspace is independently confirmed, (3) an isolated non-destructive onboarding plan is implemented, (4) lifecycle operations are audited, and (5) build/integration tests pass. Recheck consent immediately before the first live computer operation. The owner's personal Orgo workspace must remain independently usable.

## Required acceptance tests before live retry

| Scenario | Required outcome |
| --- | --- |
| Valid owner + existing running computer | Read-only preflight reports it is accessible; no VM mutation |
| Missing BOPS_UI_TOKEN | Preflight returns 403 |
| Invalid computer UUID | Preflight returns 400 |
| Existing bot already assigned a computer | Preflight returns 409 |
| Computer already assigned to another bot | Preflight returns 409 |
| Unreachable/unauthorized computer | Preflight fails without storing an assignment |
| Account changes during Orgo request | Attachment is rejected |
| Attached computer fails setup | Never delete or replace it |
| Attached computer is reset or bot is removed | Detach locally; do not call Orgo DELETE |
| Attached computer is renamed in Bops | Do not apply desktop changes to the external machine |
| Orgo DELETE requested through any lifecycle path | Central guard refuses attached computer |
| Owner independently opens swift-prism outside Bops | Existing access and data remain intact |
| Safe onboarding trial | Only explicitly approved, isolated Bops files/services created; existing data preserved |

Do not interpret successful typechecking as evidence that these integration scenarios passed. The live retry requires separate owner approval and verified integration tests.

## Verified CI checkpoint
- Commit `ba13d80d5778caf8d7a4388bac7e6307dc1fe5fd`: dedicated **Existing Orgo attachment checks** workflow run `42860969803` completed successfully (Next.js route-type generation, TypeScript check, targeted lint).
- Broader repository CI and live integration testing are separate gates; a green static check does not authorize computer mutation or deployment.

## Next implementation gate: isolated owner-approved onboarding
1. Implement a hosted owner-authenticated attach action; the current read-only preflight is not an attach action and `fromBopsWindow` alone is not sufficient when its token is unset.
2. Before enabling tasks, verify the Orgo computer's ownership/workspace and current running state without writing to it. Do not rely on a matching UUID alone.
3. Introduce an explicit attached-computer execution path that does not invoke `ensureComputer`, disk growth, desktop customization, tailnet changes, scrubbing, runner replacement, or creation of another computer.
4. Define and approve the precise Bops-owned installation directory and services; test read-only first, then narrowly scoped installation only after owner approval.
5. Exercise lifecycle and authorization acceptance tests against mocks before any live operation. The passing CI static checks are not substitutes for those tests.
6. Only then prepare a Contabo deployment and request explicit approval for the live `swift-prism` retry.

## Progress reporting (engineering estimate, not a test result)
Estimated overall readiness **55%** as of this checkpoint, with the following weighted gates:
- 20/20: basic Orgo access verification and external computer identification (previously demonstrated with owner key; must be reverified at retry).
- 15/20: ownership/lifecycle safety guards (implemented; integration audit outstanding).
- 10/15: preflight and attachment service (read-only route and internal service exist; owner-authorized attach UI/API missing).
- 10/15: automated validation (prior static CI passed; new executable policy tests pending).
- 0/20: isolated non-destructive runtime onboarding and actual Boppy control.
- 0/10: Contabo deployment and live owner-approved retry.
This is a **planning estimate**, not a verified percentage of functional completeness. The remaining runtime integration is the highest-risk part; no live computer operations are authorized.

## Read-only ownership evidence (new)
The preflight now requests the computer and the signed-in account's owner-role workspace list, then checks whether a listed workspace's `desktops` contains the exact computer UUID (case-insensitive). It returns `ownerWorkspaceVerified` and optionally the matching workspace name. If Orgo omits desktop membership from that listing, the check remains unverified; **do not infer ownership** merely because GET /computers/{id} succeeded. No computer mutation occurs. This is an inspection step, not a live attachment authorization or an isolated runtime.

## Strict owner-role verification
The preflight now uses `ownerWorkspaceForComputer`, which requires **both** an explicit `role: owner` from Orgo and a matching computer ID in the workspace `desktops` list. An omitted role, shared/admin/member role, or missing desktops list returns `ownerWorkspaceVerified: false`. The ownership evidence logic is independently tested in `tests/existing-orgo-ownership.test.mjs`. This remains read-only and does not grant attachment permission.

## Attachment service ownership gate
The internal `attachExistingOrgoComputer` service now checks `ownedWorkspaces()` and `ownerWorkspaceForComputer()` as well as the Orgo computer GET **before any Bops assignment is stored**. If owner-role workspace membership cannot be confirmed, the service refuses attachment. The preflight and internal service now enforce the same evidence rule. This is not a public authenticated attach route, and it still does not enable computer control or onboarding.

## Isolated runtime planning checkpoint
`lib/external-orgo-onboarding.ts` now provides an inert, non-executable onboarding plan with the proposed dedicated root `/opt/bops-attached`, read-only inspection steps, and a list of possible later changes. Its return value explicitly declares `requiresOwnerApproval: true` and `executable: false`. Tests enforce that it cannot approve itself or become an implicit live action. **No runtime installer or command executor exists for attached machines yet.** Before any implementation, review how runner credentials, service names, ports, desktop sessions, upgrades, and uninstall work without touching existing user data.

## Runtime action permission groundwork
`lib/external-orgo-runtime-policy.ts` defines a fail-closed permission policy: even with a verified owner and explicit approval, it permits only inspection and screenshots and rejects provisioning, disk growth, reset, deletion, runner installation, desktop control, task execution, and unknown actions. Its tests run in dedicated CI. **This policy is not yet wired to every runtime action; do not mistake it for full lifecycle enforcement.** The read-only preflight returns the inert onboarding plan only after owner workspace verification. The production Bops runner is still deliberately blocked for attached machines.

## Owner-authorised attach API (development only)
A new `POST /api/computers/attach-existing` endpoint calls the internal attachment service only when `BOPS_UI_TOKEN` is configured, the request matches that authenticated Bops window, `BOPS_EXTERNAL_ORGO_ATTACH_ENABLED=true` is deliberately set, and the request includes exact confirmation `ATTACH EXISTING COMPUTER`. Default is disabled. It validates IDs, live Orgo running status, explicit owner-role desktop membership, and state races. On success it **only records an attached assignment** and explicitly reports `onboardingStarted: false` and `computerModified: false`. Do not enable on a publicly reachable hosted instance without auditing authentication, CSRF protections, workspace isolation and the full lifecycle. There is still no approved attached-computer runtime, so this API is not a working Boppy connection.

## Phase 2 isolated service and cleanup specifications
The isolated runner now has an inert, typed service specification in `lib/external-orgo-service.ts`: dedicated root `/opt/bops-attached`, distinct service `bops-attached-runner`, proposed port 43211, and separated release/data/log directories. This is a **proposed** port; collision checks are required on the actual VM. The path boundary validator rejects traversal and sibling-prefix paths but does not defend against symlinks, mount points or TOCTOU races; any future executor must validate those on the VM. `lib/external-orgo-cleanup.ts` adds a non-executable cleanup scope planner that requires explicit approval and refuses unrelated services, paths outside the isolated directory, and persistent data directory deletion. Neither module installs, starts, stops or deletes anything. Tests cover the declared boundaries. The full runtime executor, service credentials, port checks, user-approved installation and integration remain outstanding.

## Phase 3 read-only diagnostic integration
An authenticated `GET /api/computers/attached-diagnostics?botId=...` now reads an attached bot's Orgo computer metadata and owner workspace listing, verifies computer identity and ownership, and reports running status. It returns `runtimeReady: false` and `controlEnabled: false` intentionally. It performs **no shell commands, screenshots, desktop input or mutations**. This is a functional API integration in source, but is not yet deployed or exercised against the user's live VM. Tests cover valid ownership, unowned access, mismatched identity and stopped computer. The service and cleanup specifications remain inert; installation, runtime control and full integration tests are still required.

## Phase 4 release safety gate (not deployed)
`lib/external-orgo-release-gate.ts` now requires affirmative evidence for ownership, identity, running state, CI, a built and tested isolated runtime, security review, **explicit owner deployment approval**, port availability, no changes to existing services, and verified rollback. Missing or non-boolean evidence fails closed. `lib/external-orgo-rollout.ts` classifies blocked/read-only/approved-install/runtime-tested stages, but **does not execute deployment**. Tests exercise every gate independently. None of the runtime build, live security review, VM port check, rollback verification, or explicit approval evidence has yet been established. Do not infer the gate has passed from the existence of the module. Phase 4 remains incomplete and no live rollout is authorized.

## Phase 5: first executable isolated runner (not installed)
`runner/attached/health-server.mjs` is a real standalone Node HTTP process with a single `GET /health` endpoint, bound to `127.0.0.1` by default on port 43211. It does not import the main Bops server, require Orgo credentials, access the desktop, run tasks, or write files. Unknown routes and non-GET methods return 404. `tests/attached-runner-health.test.mjs` starts the process in CI on an ephemeral loopback port and verifies health and blocked task requests. `runner/attached/bops-attached-runner.service.example` is a hardened **example only**, not an installed or enabled service. Before any live installation: review host-specific systemd sandbox compatibility, dedicated user, artifact verification, port collision, ownership and explicit owner approval. This milestone demonstrates an executable health-only runtime, **not remote computer control or completed Boppy integration**.

## Phase 6 authenticated health protocol (local test only)
The standalone runner now refuses startup without a strong bearer token and requires that token for `GET /health`. The comparison is constant-time for equal-length tokens. `lib/external-runner-client.ts` is a timeout-bounded, loopback-only client that verifies the runner's health-only identity and rejects unexpected responses. CI tests start an actual local server and test both authorized and unauthorized requests. **Critical architecture limitation:** the client connects to `127.0.0.1` of the process executing it. Bops on Contabo cannot use this directly to reach the runner on the separate Orgo VM; a separately designed and audited authenticated transport is still required. No secrets are stored in GitHub, no remote networking or task execution is enabled, and nothing has been deployed. A secure remote transport, VM credential provisioning, desktop integration, full service lifecycle and owner-approved live tests remain blockers.

## Phase 7 remote transport boundary
The existing Orgo REST client already supports cross-host computer metadata requests. `lib/external-orgo-remote-transport.ts` explicitly permits that channel only for verified attached identity and owner workspace, and rejects runner health, desktop input, shell, installation, deletion and task execution until a separate audited remote transport exists. The authenticated attached-diagnostics endpoint now enforces that policy and labels its channel `orgo-read-only-api`. This is real read-only cross-host API integration **in source only**, not a remote runner connection or deployment. The runner's loopback-only health client must never be mistaken for a Contabo-to-Orgo connection. No Orgo VM has been modified.

## Phase 8 signed message protocol (not network-wired)
`runner/attached/protocol.mjs` defines an HMAC-SHA256 signed message envelope with version, strictly allowlisted `health` action, timestamp tolerance of 30 seconds, a 128-bit hex nonce, constant-time signature verification, and replay rejection. `runner/attached/replay-cache.mjs` adds bounded in-process replay tracking, expiration and fail-closed capacity behavior; tests cover valid signatures, tampering, stale timestamps, unsafe actions and replay. **This protocol is not wired into the HTTP server or a remote Contabo-to-Orgo transport.** No desktop or task execution is enabled. Before production: authenticated transport with endpoint identity, shared atomic replay state if multiple processes, rate limiting, key provisioning/rotation, clock synchronization, and security review. No live VM changes or deployment.
