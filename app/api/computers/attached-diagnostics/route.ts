import { notReady } from "@/lib/server/ready";
import { fromBopsWindow } from "@/lib/server/ui-token";
import { bot, stateEpoch } from "@/lib/server/store";
import { orgo, ownedWorkspaces } from "@/lib/server/orgo";
import { classifyExternalComputer } from "@/lib/external-orgo-diagnostics";

/**
 * GET only: Orgo computer metadata and owner-workspace listing.
 * Never calls bash, desktop input, provisioning, or setup.
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
    return Response.json({ error: "Bot has no attached external computer." }, { status: 404 });
  const epoch = stateEpoch();
  const computerId = target.computerId;
  try {
    const [computer, workspaces] = await Promise.all([orgo.computer(computerId), ownedWorkspaces()]);
    if (epoch !== stateEpoch() || bot(botId) !== target || !target.attachedOrgoComputer || target.computerId !== computerId)
      return Response.json({ error: "Account or attachment changed. Retry." }, { status: 409 });
    const diagnostics = classifyExternalComputer({ expectedId: computerId, computer, workspaces });
    return Response.json({
      computerId,
      name: computer.name,
      status: computer.status,
      cpu: computer.cpu,
      ram: computer.ram,
      os: computer.os,
      ...diagnostics,
      runtimeReady: false,
      controlEnabled: false,
      modifiedComputer: false,
    });
  } catch {
    return Response.json({ error: "Read-only Orgo diagnostics unavailable." }, { status: 502 });
  }
}
