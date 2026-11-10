import { notReady } from "@/lib/server/ready";
import { parseDesktopJson } from "@/lib/external-desktop-request";
import { fromBopsWindow } from "@/lib/server/ui-token";
import { bot, stateEpoch } from "@/lib/server/store";
import { orgo, ownedWorkspaces } from "@/lib/server/orgo";
import { classifyExternalComputer } from "@/lib/external-orgo-diagnostics";
import { publicAttachedScreens } from "@/lib/external-desktop-screens";
import { authorizeAttachedClick, validAttachedClick } from "@/lib/external-desktop-action";
import { sameOriginWrite } from "@/lib/external-desktop-keyboard";

/**
 * One explicit owner-confirmed click through Orgo's authenticated API.
 * Disabled by default. Never called by an autonomous agent.
 */
export async function POST(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;
  const authenticated = Boolean(process.env.BOPS_UI_TOKEN) && fromBopsWindow(request) && sameOriginWrite(request);
  if (!authenticated || process.env.BOPS_EXTERNAL_ORGO_DESKTOP_CLICK_ENABLED !== "true")
    return Response.json({ error: "Attached desktop control is disabled or unauthorized." }, { status: 403 });
  const payload = await parseDesktopJson(request);
  if (!payload) return Response.json({ error: "Invalid or oversized JSON request." }, { status: 400 });
  if (Object.keys(payload).sort().join(",") !== "botId,confirmation,screenId,x,y")
    return Response.json({ error: "Unexpected request fields." }, { status: 400 });
  if (typeof payload.botId !== "string" || typeof payload.screenId !== "string")
    return Response.json({ error: "Bot and screen required." }, { status: 400 });
  const target = bot(payload.botId);
  if (!target?.isMain || !target.attachedOrgoComputer || !target.computerId)
    return Response.json({ error: "No attached main computer." }, { status: 404 });
  const epoch = stateEpoch();
  const computerId = target.computerId;
  const unchanged = () => epoch === stateEpoch() && bot(payload.botId as string) === target &&
    target.attachedOrgoComputer && target.computerId === computerId;
  try {
    const [computer, workspaces] = await Promise.all([orgo.computer(computerId), ownedWorkspaces()]);
    if (!unchanged()) return Response.json({ error: "Attachment changed." }, { status: 409 });
    const diagnostics = classifyExternalComputer({ expectedId: computerId, computer, workspaces });
    const denied = authorizeAttachedClick({
      authenticated, featureEnabled: process.env.BOPS_EXTERNAL_ORGO_DESKTOP_CLICK_ENABLED === "true",
      attached: true, ownerVerified: diagnostics.ownerVerified,
      identityVerified: diagnostics.identityMatches, running: diagnostics.running,
      confirmation: payload.confirmation,
    });
    if (denied) return Response.json({ error: denied }, { status: 403 });
    const screens = publicAttachedScreens(await orgo.screens(computerId));
    if (!unchanged()) return Response.json({ error: "Attachment changed." }, { status: 409 });
    const screen = screens.find((item) => item.id === payload.screenId);
    if (!screen || !validAttachedClick({ x: payload.x, y: payload.y, width: screen.width, height: screen.height }))
      return Response.json({ error: "Invalid screen or coordinates." }, { status: 400 });
    if (!unchanged()) return Response.json({ error: "Attachment changed." }, { status: 409 });
    await orgo.click(computerId, screen.id, payload.x as number, payload.y as number);
    return Response.json({ ok: true, action: "single-click", computerId, screenId: screen.id });
  } catch {
    return Response.json({ error: "Desktop click failed or status unknown." }, { status: 502 });
  }
}
