"use client";

import { useEffect, useRef, useState } from "react";

type Screen = { id: string; width: number; height: number; default: boolean };
type ScreensResponse = { screens?: Screen[]; error?: string };
type ReadinessResponse = { ownerVerified?: boolean; identityVerified?: boolean; computerRunning?: boolean; readOnlyReady?: boolean; deploymentReady?: boolean; missingReadOnlyEvidence?: string[]; error?: string };

export function AttachedDesktopPreview({ botId }: { botId: string }) {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [selected, setSelected] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("Checking attached computer…");
  const [busy, setBusy] = useState(false);
  const requestSequence = useRef(0);
  const screenshotAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/computers/attached-screens?botId=" + encodeURIComponent(botId), { cache: "no-store", signal: controller.signal });
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
    async function checkReadiness() {
      try {
        const response = await fetch("/api/computers/attached-readiness?botId=" + encodeURIComponent(botId), { cache: "no-store", signal: controller.signal });
        const data = await response.json() as ReadinessResponse;
        if (active) setReadiness(response.ok ? data : { error: data.error ?? "Readiness unavailable" });
      } catch {
        if (active) setReadiness({ error: "Readiness unavailable" });
      }
    }
    void checkReadiness();
    return () => { active = false; controller.abort(); requestSequence.current++; screenshotAbort.current?.abort(); };
  }, [botId]);

  useEffect(() => {
    return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); };
  }, [imageUrl]);

  async function refresh() {
    if (!selected || busy) return;
    const sequence = ++requestSequence.current;
    const requestedScreen = selected;
    screenshotAbort.current?.abort();
    const controller = new AbortController();
    screenshotAbort.current = controller;
    setBusy(true);
    setStatus("Loading read-only screenshot…");
    try {
      const response = await fetch("/api/computers/attached-screenshot?botId=" + encodeURIComponent(botId) + "&screenId=" + encodeURIComponent(requestedScreen), { cache: "no-store", signal: controller.signal });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Screenshot unavailable");
      }
      if (!(response.headers.get("content-type") ?? "").startsWith("image/jpeg"))
        throw new Error("Unexpected screenshot response");
      const blob = await response.blob();
      if (blob.size > 8 * 1024 * 1024) throw new Error("Screenshot too large");
      if (sequence !== requestSequence.current) return;
      setImageUrl(URL.createObjectURL(blob));
      setStatus("Screenshot loaded. This is a still image, not live control.");
    } catch (error) {
      if (sequence === requestSequence.current) setStatus(error instanceof Error ? error.message : "Screenshot unavailable");
    } finally {
      if (sequence === requestSequence.current) setBusy(false);
      if (screenshotAbort.current === controller) screenshotAbort.current = null;
    }
  }

  return (
    <section aria-label="Attached Orgo desktop preview" style={{ maxWidth: 960, margin: "24px auto", padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Existing Orgo computer</h1>
      <p>Read-only desktop preview. No clicks, typing or autonomous actions are enabled here.</p>
      <p role="status">Verification: {readiness?.error ?? (readiness ? (readiness.ownerVerified && readiness.identityVerified && readiness.computerRunning ? "Computer identity and ownership verified; screenshot and deployment approval still require separate verification." : "Computer identity or ownership not verified.") : "Checking owner and computer identity…")}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, margin: "18px 0" }}>
        <label htmlFor="attached-screen">Screen</label>
        <select id="attached-screen" value={selected} onChange={(event) => { requestSequence.current++; screenshotAbort.current?.abort(); setBusy(false); setSelected(event.target.value); setImageUrl(null); }} disabled={busy || !screens.length}>
          {screens.map((screen) => <option key={screen.id} value={screen.id}>{screen.id} ({screen.width} × {screen.height})</option>)}
        </select>
        <button type="button" onClick={() => void refresh()} disabled={!selected || busy}>Refresh screenshot</button>
      </div>
      <p role="status" aria-live="polite">{status}</p>
      {imageUrl ? <img src={imageUrl} alt="Read-only screenshot of attached Orgo desktop" style={{ width: "100%", height: "auto", border: "1px solid #888", borderRadius: 8 }} /> : <div style={{ border: "1px dashed #888", borderRadius: 8, minHeight: 260, display: "grid", placeItems: "center" }}>No screenshot loaded</div>}
    </section>
  );
}
