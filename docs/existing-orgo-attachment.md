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
