import { notReady } from "@/lib/server/ready";
import { fromBopsWindow } from "@/lib/server/ui-token";
import { authorizeExternalAttachment } from "@/lib/external-attach-authorization";
import { sameOriginWrite } from "@/lib/external-desktop-keyboard";
import { parseDesktopJson } from "@/lib/external-desktop-request";
import { attachExistingOrgoComputer } from "@/lib/server/bots";

/**
 * Owner-triggered attachment only. Disabled unless explicitly configured.
 * This saves Bops assignment state; it never runs setup or Orgo mutations.
 */
export async function POST(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;
  if (!sameOriginWrite(request))
    return Response.json({ error: "Same-origin confirmation required." }, { status: 403 });
  const body = await parseDesktopJson(request);
  if (!body) return Response.json({ error: "Invalid or oversized JSON." }, { status: 400 });
  if (Object.keys(body).sort().join(",") !== "botId,computerId,confirmation")
    return Response.json({ error: "Unexpected attachment fields." }, { status: 400 });
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
