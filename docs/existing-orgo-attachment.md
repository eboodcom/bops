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
