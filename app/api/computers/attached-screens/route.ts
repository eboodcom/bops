import { notReady } from "@/lib/server/ready";
import { fromBopsWindow } from "@/lib/server/ui-token";
import { bot, stateEpoch } from "@/lib/server/store";
import { orgo, ownedWorkspaces } from "@/lib/server/orgo";
import { classifyExternalComputer } from "@/lib/external-orgo-diagnostics";
import { publicAttachedScreens } from "@/lib/external-desktop-screens";

/** Read-only screen geometry. Does not create, resize, start or change a screen. */
export async function GET(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;
  if (!process.env.BOPS_UI_TOKEN || !fromBopsWindow(request))
    return Response.json({ error: "Authenticated Bops window required." }, { status: 403 });
  const botId = new URL(request.url).searchParams.get("botId") ?? "";
  const target = bot(botId);
  if (!target?.isMain || !target.attachedOrgoComputer || !target.computerId)
    return Response.json({ error: "No attached computer." }, { status: 404 });
  const epoch = stateEpoch();
  const computerId = target.computerId;
  const unchanged = () => epoch === stateEpoch() && bot(botId) === target &&
    target.attachedOrgoComputer && target.computerId === computerId;
  try {
    const [computer, workspaces] = await Promise.all([orgo.computer(computerId), ownedWorkspaces()]);
    if (!unchanged()) return Response.json({ error: "Attachment changed." }, { status: 409 });
    const diagnostics = classifyExternalComputer({ expectedId: computerId, computer, workspaces });
    if (!diagnostics.safeToInspect)
      return Response.json({ error: "Computer ownership or running status unverified." }, { status: 403 });
    const screens = publicAttachedScreens(await orgo.screens(computerId));
    if (!unchanged()) return Response.json({ error: "Attachment changed." }, { status: 409 });
    if (screens.length === 0) return Response.json({ error: "No valid screens." }, { status: 404 });
    return Response.json({ computerId, screens, readOnly: true, controlEnabled: false }, {
      headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return Response.json({ error: "Attached screens unavailable." }, { status: 502 });
  }
}
