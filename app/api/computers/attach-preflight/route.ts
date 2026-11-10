import { fromBopsWindow } from "@/lib/server/ui-token";
import { notReady } from "@/lib/server/ready";
import { orgo } from "@/lib/server/orgo";
import { bot, getState } from "@/lib/server/store";

/**
 * Read-only preflight for attaching an existing Orgo computer.
 * Deliberately does not attach, provision, resize, wake, or modify the VM.
 * Restricted to the authenticated Bops window, like other bot settings.
 */
export async function POST(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;
  // Hosted/dev Bops accepts any request when BOPS_UI_TOKEN is unset.\n  // This sensitive account inspection must fail closed instead.\n  if (!process.env.BOPS_UI_TOKEN || !fromBopsWindow(request))
    return Response.json({ error: "Only the Bops app can inspect an attachment." }, { status: 403 });

  let body: { botId?: unknown; computerId?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }

  const botId = typeof body.botId === "string" ? body.botId : "";
  const computerId = typeof body.computerId === "string" ? body.computerId : "";
  const target = bot(botId);
  if (!target?.isMain) return Response.json({ error: "Choose a main bot." }, { status: 400 });
  if (target.computerId || target.computerStatus === "cloning")
    return Response.json({ error: "This bot already has a computer or is setting one up." }, { status: 409 });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(computerId))
    return Response.json({ error: "Invalid Orgo computer ID." }, { status: 400 });
  if (getState().bots.some((b) => b.computerId === computerId))
    return Response.json({ error: "Computer already assigned." }, { status: 409 });

  try {
    const computer = await orgo.computer(computerId);
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
