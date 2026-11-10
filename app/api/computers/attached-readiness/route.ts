import { notReady } from "@/lib/server/ready";
import { fromBopsWindow } from "@/lib/server/ui-token";
import { bot, stateEpoch } from "@/lib/server/store";
import { orgo, ownedWorkspaces } from "@/lib/server/orgo";
import { classifyExternalComputer } from "@/lib/external-orgo-diagnostics";
import { attachedComputerReadiness } from "@/lib/external-orgo-readiness";

/** Read-only evidence only; never marks a screenshot or deployment as verified. */
export async function GET(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;
  if (!process.env.BOPS_UI_TOKEN || !fromBopsWindow(request))
    return Response.json({ error: "Authenticated Bops window required." }, { status: 403 });
  const botId = new URL(request.url).searchParams.get("botId") ?? "";
  const target = bot(botId);
  if (!target?.isMain || !target.attachedOrgoComputer || !target.computerId)
    return Response.json({ error: "No attached main computer." }, { status: 404 });
  const epoch = stateEpoch();
  const computerId = target.computerId;
  const unchanged = () => epoch === stateEpoch() && bot(botId) === target &&
    target.attachedOrgoComputer && target.computerId === computerId;
  try {
    const [computer, workspaces] = await Promise.all([orgo.computer(computerId), ownedWorkspaces()]);
    if (!unchanged()) return Response.json({ error: "Attachment changed." }, { status: 409 });
    const evidence = classifyExternalComputer({ expectedId: computerId, computer, workspaces });
    const readiness = attachedComputerReadiness({
      ownerVerified: evidence.ownerVerified,
      identityVerified: evidence.identityMatches,
      computerRunning: evidence.running,
      attachmentRecorded: true,
      screenshotVerified: false,
    });
    return Response.json({
      computerId, status: computer.status, readOnly: true,
      ownerVerified: evidence.ownerVerified, identityVerified: evidence.identityMatches,
      computerRunning: evidence.running,
      ...readiness,
    }, { headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return Response.json({ error: "Readiness evidence unavailable." }, { status: 502 });
  }
}
