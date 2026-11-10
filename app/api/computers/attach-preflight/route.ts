import { fromBopsWindow } from "@/lib/server/ui-token";
import { notReady } from "@/lib/server/ready";
import { orgo } from "@/lib/server/orgo";
import { bot, getState, stateEpoch } from "@/lib/server/store";
import { attachmentEligibility } from "@/lib/attachment-policy";

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

  let body: { botId?: unknown; computerId?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }

  const botId = typeof body.botId === "string" ? body.botId : "";
  const computerId = typeof body.computerId === "string" ? body.computerId : "";
  const target = bot(botId);
  const reason = attachmentEligibility(target, computerId, getState().bots.map((b) => b.computerId));
  if (reason) return Response.json({ error: reason }, { status: reason === "Computer already assigned." || reason.includes("already has") ? 409 : 400 });

  const epoch = stateEpoch();
  try {
    const computer = await orgo.computer(computerId);
    // Do not return details from an old account after a hosted state swap.
    if (epoch !== stateEpoch() || bot(botId) !== target)
      return Response.json({ error: "Account state changed. Retry the check." }, { status: 409 });
    return Response.json({
      accessible: true,
      running: computer.status === "running",
      name: computer.name,
      status: computer.status,
      computerId,
      canAttachNow: false,
      reason: "Existing-computer onboarding is not yet verified; no changes were made.",
    });
  } catch {
    return Response.json({ accessible: false, canAttachNow: false, error: "Orgo access could not be verified." }, { status: 403 });
  }
}
