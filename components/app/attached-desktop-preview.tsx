"use client";

import { useEffect, useState } from "react";

type Screen = { id: string; width: number; height: number; default: boolean };
type ScreensResponse = { screens?: Screen[]; error?: string };

export function AttachedDesktopPreview({ botId }: { botId: string }) {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selected, setSelected] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("Checking attached computer…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/computers/attached-screens?botId=" + encodeURIComponent(botId), { cache: "no-store" });
        const data = await response.json() as ScreensResponse;
        if (!active) return;
        if (!response.ok || !data.screens?.length) throw new Error(data.error ?? "No screens available");
        setScreens(data.screens);
        setSelected(data.screens.find((screen) => screen.default)?.id ?? data.screens[0].id);
        setStatus("Screen ready. Choose Refresh screenshot to view it.");
      } catch (error) {
        if (active) setStatus(error instanceof Error ? error.message : "Screen discovery unavailable");
      }
    }
    void load();
    return () => { active = false; };
  }, [botId]);

  useEffect(() => {
    return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); };
  }, [imageUrl]);

  async function refresh() {
    if (!selected || busy) return;
    setBusy(true);
    setStatus("Loading read-only screenshot…");
    try {
      const response = await fetch("/api/computers/attached-screenshot?botId=" + encodeURIComponent(botId) + "&screenId=" + encodeURIComponent(selected), { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Screenshot unavailable");
      }
      if (!(response.headers.get("content-type") ?? "").startsWith("image/jpeg"))
        throw new Error("Unexpected screenshot response");
      const blob = await response.blob();
      if (blob.size > 8 * 1024 * 1024) throw new Error("Screenshot too large");
      setImageUrl(URL.createObjectURL(blob));
      setStatus("Screenshot loaded. This is a still image, not live control.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Screenshot unavailable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Attached Orgo desktop preview" style={{ maxWidth: 960, margin: "24px auto", padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Existing Orgo computer</h1>
      <p>Read-only desktop preview. No clicks, typing or autonomous actions are enabled here.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, margin: "18px 0" }}>
        <label htmlFor="attached-screen">Screen</label>
        <select id="attached-screen" value={selected} onChange={(event) => { setSelected(event.target.value); setImageUrl(null); }} disabled={busy || !screens.length}>
          {screens.map((screen) => <option key={screen.id} value={screen.id}>{screen.id} ({screen.width} × {screen.height})</option>)}
        </select>
        <button type="button" onClick={() => void refresh()} disabled={!selected || busy}>Refresh screenshot</button>
      </div>
      <p role="status" aria-live="polite">{status}</p>
      {imageUrl ? <img src={imageUrl} alt="Read-only screenshot of attached Orgo desktop" style={{ width: "100%", height: "auto", border: "1px solid #888", borderRadius: 8 }} /> : <div style={{ border: "1px dashed #888", borderRadius: 8, minHeight: 260, display: "grid", placeItems: "center" }}>No screenshot loaded</div>}
    </section>
  );
}
