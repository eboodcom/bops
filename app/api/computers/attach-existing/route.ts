import { notReady } from "@/lib/server/ready";
import { fromBopsWindow } from "@/lib/server/ui-token";
import { authorizeExternalAttachment } from "@/lib/external-attach-authorization";
import { attachExistingOrgoComputer } from "@/lib/server/bots";

/**
 * Owner-triggered attachment only. Disabled unless explicitly configured.
 * This saves Bops assignment state; it never runs setup or Orgo mutations.
 */
export async function POST(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;
  let body: { botId?: unknown; computerId?: unknown; confirmation?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const denied = authorizeExternalAttachment({
    uiTokenConfigured: Boolean(process.env.BOPS_UI_TOKEN),
    authenticatedWindow: fromBopsWindow(request),
    featureEnabled: process.env.BOPS_EXTERNAL_ORGO_ATTACH_ENABLED === "true",
    confirmation: body.confirmation,
  });
  if (denied) return Response.json({ error: denied }, { status: 403 });
  if (typeof body.botId !== "string" || typeof body.computerId !== "string")
    return Response.json({ error: "Bot ID and computer ID are required." }, { status: 400 });
  const result = await attachExistingOrgoComputer(body.botId, body.computerId);
  if ("error" in result) return Response.json(result, { status: 409 });
  return Response.json({ ok: true, onboardingStarted: false, computerModified: false });
}
