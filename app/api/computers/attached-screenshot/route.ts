import { notReady } from "@/lib/server/ready";
import { fromBopsWindow } from "@/lib/server/ui-token";
import { bot, stateEpoch } from "@/lib/server/store";
import { orgo, ownedWorkspaces } from "@/lib/server/orgo";
import { classifyExternalComputer } from "@/lib/external-orgo-diagnostics";
import { selectExternalTransport } from "@/lib/external-orgo-remote-transport";
import { publicAttachedScreens } from "@/lib/external-desktop-screens";

/**
 * Read-only Orgo REST screenshot; no runner, shell, installation or input.
 * Only the main bot's verified owner may view its existing attached computer.
 */
export async function GET(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;
  if (!process.env.BOPS_UI_TOKEN || !fromBopsWindow(request))
    return Response.json({ error: "Authenticated Bops window required." }, { status: 403 });
  const url = new URL(request.url);
  const botId = url.searchParams.get("botId") ?? "";
  const target = bot(botId);
  if (!target?.isMain || !target.attachedOrgoComputer || !target.computerId)
    return Response.json({ error: "No attached computer." }, { status: 404 });
  const epoch = stateEpoch();
  const computerId = target.computerId;
  const stillAttached = () => epoch === stateEpoch() && bot(botId) === target &&
    target.attachedOrgoComputer && target.computerId === computerId;
  try {
    const [computer, workspaces] = await Promise.all([orgo.computer(computerId), ownedWorkspaces()]);
    if (!stillAttached()) return Response.json({ error: "Attachment changed." }, { status: 409 });
    const diagnostics = classifyExternalComputer({ expectedId: computerId, computer, workspaces });
    const transport = selectExternalTransport({
      operation: "screenshot", attached: true,
      ownerVerified: diagnostics.ownerVerified, identityVerified: diagnostics.identityMatches,
    });
    if (!transport.permitted || !diagnostics.running)
      return Response.json({ error: "Computer is not verified and running." }, { status: 403 });
    const screens = publicAttachedScreens(await orgo.screens(computerId));
    if (!stillAttached()) return Response.json({ error: "Attachment changed." }, { status: 409 });
    const screen = screens[0];
    if (!screen || typeof screen.id !== "string")
      return Response.json({ error: "No available screen." }, { status: 404 });
    const bytes = await orgo.screenshot(computerId, screen.id, 0.5, "jpeg");
    if (!stillAttached()) return Response.json({ error: "Attachment changed." }, { status: 409 });
    if (bytes.byteLength > 8 * 1024 * 1024)
      return Response.json({ error: "Screenshot too large." }, { status: 502 });
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return Response.json({ error: "Read-only screenshot unavailable." }, { status: 502 });
  }
}
