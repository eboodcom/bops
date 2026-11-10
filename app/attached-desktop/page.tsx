import { headers } from "next/headers";
import { fromBopsWindow } from "@/lib/server/ui-token";
import { AttachedDesktopPreview } from "@/components/app/attached-desktop-preview";

export default async function AttachedDesktopPage({ searchParams }: {
  searchParams: Promise<{ botId?: string }>;
}) {
  const incoming = await headers();
  const authenticated = Boolean(process.env.BOPS_UI_TOKEN) &&
    fromBopsWindow(new Request("http://localhost/attached-desktop", { headers: incoming }));
  if (!authenticated) return <main style={{ padding: 24 }}>Authenticated Bops window required.</main>;
  const { botId } = await searchParams;
  if (!botId || botId.length > 128) return <main style={{ padding: 24 }}>Choose an attached main bot using its botId.</main>;
  return <main><AttachedDesktopPreview key={botId} botId={botId} /></main>;
}
