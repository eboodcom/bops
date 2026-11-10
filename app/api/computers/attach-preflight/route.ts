import { fromBopsWindow } from "@/lib/server/ui-token";
import { notReady } from "@/lib/server/ready";
import { orgo, ownedWorkspaces } from "@/lib/server/orgo";
import { bot, getState, stateEpoch } from "@/lib/server/store";
import { attachmentEligibility } from "@/lib/attachment-policy";
import { ownerWorkspaceForComputer } from "@/lib/attachment-ownership";
import { planExternalOnboarding } from "@/lib/external-orgo-onboarding";
import { matchesAttachedComputerId } from "@/lib/external-orgo-identity";
import { parseDesktopJson } from "@/lib/external-desktop-request";
import { sameOriginWrite } from "@/lib/external-desktop-keyboard";

/**
 * Read-only preflight for attaching an existing Orgo computer.
 * Deliberately does not attach, provision, resize, wake, or modify the VM.
 * Restricted to the authenticated Bops window, like other bot settings.
 */
export async function POST(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;
  // Hosted/dev Bops accepts any request when BOPS_UI_TOKEN is unset.
  // This sensitive account inspection must fail closed instead.
  if (!process.env.BOPS_UI_TOKEN || !fromBopsWindow(request))
    return Response.json({ error: "Only the Bops app can inspect an attachment." }, { status: 403 });

  if (!sameOriginWrite(request))
    return Response.json({ error: "Same-origin request required." }, { status: 403 });
  const body = await parseDesktopJson(request);
  if (!body) return Response.json({ error: "Invalid or oversized JSON." }, { status: 400 });
  if (Object.keys(body).sort().join(",") !== "botId,computerId")
    return Response.json({ error: "Unexpected preflight fields." }, { status: 400 });

  const botId = typeof body.botId === "string" ? body.botId : "";
  const computerId = typeof body.computerId === "string" ? body.computerId : "";
  const target = bot(botId);
  const reason = attachmentEligibility(target, computerId, getState().bots.map((b) => b.computerId));
  if (reason) return Response.json({ error: reason }, { status: reason === "Computer already assigned." || reason.includes("already has") ? 409 : 400 });

  const epoch = stateEpoch();
  try {
    const [computer, workspaces] = await Promise.all([orgo.computer(computerId), ownedWorkspaces()]);
    const identityVerified = matchesAttachedComputerId(computerId, computer.id);
    const ownerWorkspace = identityVerified ? ownerWorkspaceForComputer(workspaces, computerId) : undefined;
    // Do not return details from an old account after a hosted state swap.
    if (epoch !== stateEpoch() || bot(botId) !== target ||
        attachmentEligibility(bot(botId), computerId, getState().bots.map((b) => b.computerId)))
      return Response.json({ error: "Account state changed. Retry the check." }, { status: 409 });
    return Response.json({
      accessible: true,
      ownerWorkspaceVerified: Boolean(ownerWorkspace),
      identityVerified,
      ownerWorkspaceName: ownerWorkspace?.name,
      running: computer.status === "running",
      name: computer.name,
      status: computer.status,
      computerId,
      canAttachNow: false,
      onboardingPlan: ownerWorkspace ? planExternalOnboarding(computerId) : undefined,
      reason: !identityVerified
        ? "Orgo returned a different computer identity. No changes were made."
        : ownerWorkspace
        ? "Owner workspace found; isolated onboarding is not yet verified. No changes were made."
        : "Computer ownership could not be independently verified from the owner workspace list. No changes were made.",
    }, { headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return Response.json({ accessible: false, canAttachNow: false, error: "Orgo access could not be verified." }, { status: 403 });
  }
}
