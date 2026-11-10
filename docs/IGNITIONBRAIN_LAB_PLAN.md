# IgnitionBrain Bops Lab — Contabo / PC / Android

Status: planning and isolated experimentation only. No live deployment.

## Goals
- Preserve upstream Bops and its FSL licence. This branch is for private/internal testing, not a competing hosted product.
- Use Contabo as a remote Linux execution host if its actual OS, RAM, disk, Node runtime and security posture meet requirements.
- Access a responsive browser control panel from Android and PC. The current upstream Mac/Electron shell is not a Windows/Android application.
- Keep IgnitionBrain production separate; do not expose the Bops server directly to the public internet.

## First engineering checks
1. Inspect Contabo host: OS/version, CPU/RAM/disk, Docker/Node 22+, existing services and occupied ports. Back up existing services first.
2. Validate Linux server-only mode (Next.js on localhost port 3210) and audit Mac-specific assumptions, auth, Keychain storage, local browser tasks and callbacks. Do not claim parity with Mac.
3. Restrict to localhost; access via authenticated VPN/reverse proxy with HTTPS and rate limiting; no public unprotected port 3210.
4. Create separate secrets, limited provider API keys and spending caps; never commit .env files. Use separate state and database storage.
5. Test one read-only research task; inspect cost, logs, approval gates, mobile viewport and persistence.
6. Implement a narrow IB-to-lab task adapter only after the above tests. Keep human approval for outreach, publication, financial actions and account changes.

## Pilot acceptance
- CEO can log in securely from Android browser and desktop browser.
- Agent receives one bounded task, delegates if necessary, cites sources, logs cost and returns a reviewable result.
- No unauthorised sends, purchases, account changes or access to production IB data.
- A restart recovers task state and no secret appears in logs.
- Monthly spend ceiling and kill switch verified.

## First assignment
IB-001: research three narrowly defined audiences for an original £9–£29 PDF, validate actual pain points and competitor offers, propose a demand test. No unsolicited outreach, purchases or publishing.

## Commercial boundary
Bops FSL-1.1-ALv2 permits internal use but restricts competing commercial services. Do not merge Bops source into commercial IgnitionBrain. Build an independently implemented commercial agent layer or obtain legal clearance/licence.

## Pending input
Contabo OS/version, available RAM, whether Docker is installed, and which applications already run on the server. Do not share passwords or API secrets in chat.
