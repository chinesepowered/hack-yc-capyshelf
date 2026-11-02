"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useShelf } from "@/lib/store";
import type { Concern, SkinProfile } from "@/lib/types";
import { CONCERNS } from "@/lib/types";
import { profileSummary } from "@/lib/skin";
import { downscaleImage } from "@/lib/image";
import { captureWithCameraKit } from "@/lib/camera-kit";
import { SkinMap, type MapLayer } from "@/components/SkinMap";
import { ScoreList } from "@/components/ScoreList";
import { ApiStampView, CapySays, ModeBanner, NextLink, StepHeader } from "@/components/ui";

function defaultLayers(p: SkinProfile): MapLayer[] {
  return CONCERNS.filter((c) => p.scores[c] && p.scores[c].level !== "clear" && p.scores[c].maskUrl)
    .sort((a, b) => p.scores[a].rawScore - p.scores[b].rawScore)
    .slice(0, 2);
}

export default function ScanPage() {
  const { profile, profiles, set, mode } = useShelf();
  const [layers, setLayers] = useState<MapLayer[]>(() => defaultLayers(profile));
  const [shownFor, setShownFor] = useState(profile.id);
  if (shownFor !== profile.id) {
    setShownFor(profile.id);
    setLayers(defaultLayers(profile));
  }
  const toggle = (l: MapLayer) => setLayers((ls) => (ls.includes(l) ? ls.filter((x) => x !== l) : [...ls, l]));
  const summary = profileSummary(profile);
  const st = profile.skinType;

  return (
    <>
      <StepHeader n={1} title="Scan once">
        One front-facing selfie goes to <strong className="text-ink">YouCam AI Skin Analysis</strong>. Capy keeps the six
        concerns that decide what you buy, plus your skin type.
      </StepHeader>
      <ModeBanner />

      <section aria-labelledby="who" className="mt-6">
        <h2 id="who" className="sr-only">
          Choose a skin profile
        </h2>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Skin profile">
          {profiles.map((p) => {
            const on = p.id === profile.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={on}
                data-testid={`profile-${p.id}`}
                onClick={() => set({ profileId: p.id })}
                className={`flex items-center gap-3 rounded-2xl border p-2 pr-4 text-left transition-colors ${
                  on ? "border-ink bg-white shadow-sm" : "border-line bg-white/60 hover:bg-white"
                }`}
              >
                <img src={p.photoUrl} alt="" className="w-12 h-16 rounded-xl object-cover" />
                <span>
                  <span className="block font-extrabold">{p.label}</span>
                  <span className="block text-xs text-muted max-w-56">{profileSummary(p).text}</span>
                </span>
              </button>
            );
          })}
          {mode === "live" && <LiveScanButton />}
        </div>
      </section>

      <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-start" aria-label="Scan results">
        <div className="lg:sticky lg:top-24">
          <SkinMap profile={profile} layers={layers} onToggle={toggle} />
        </div>
        <div className="grid gap-4">
          <CapySays mood="calm" by="Summary computed from YouCam raw scores (no AI writing here)">
            {summary.text}{" "}
            {st.whole && (
              <>
                YouCam reads your skin type as <strong>{st.whole}</strong>
                {st.tZone && st.uZone ? ` (T-zone ${st.tZone}, U-zone ${st.uZone})` : ""}.
              </>
            )}
            {profile.scores.moisture?.level === "focus" && /oily/i.test(st.whole ?? "") && (
              <> Oil and water are different things: skin can make plenty of oil and still be low on water.</>
            )}
          </CapySays>
          <ScoreList
            profile={profile}
            active={layers.filter((l): l is Concern => l !== "skin_type")}
            onPick={(c) => toggle(c)}
          />
          <p className="text-xs text-muted">
            Raw score is YouCam&apos;s uncalibrated 1 to 100 score (higher is healthier); Capy decides with it. The UI score is
            YouCam&apos;s friendlier, calibrated version. Bands: 70 and up looks balanced, 50 to 69 worth watching, under 50
            main focus.
          </p>
          <ApiStampView stamp={profile.api} extra="SD concerns: acne, pore, oiliness, moisture, redness, texture, skin_type" />
          <div className="pt-2">
            <NextLink href="/label" testId="next-to-label">
              Next: snap a label
            </NextLink>
          </div>
        </div>
      </section>
    </>
  );
}

function describeQuality(q: { hasFace?: boolean; position?: string; frontal?: string; lighting?: string }): string {
  if (!q.hasFace) return "Looking for your face...";
  if (q.position === "toosmall") return "Move a little closer.";
  if (q.position === "outofboundary") return "Center your face in the frame.";
  if (q.frontal && q.frontal !== "good") return "Look straight at the camera.";
  if (q.lighting === "notgood") return "Find brighter, even light.";
  return "Hold still, capturing...";
}

function LiveScanButton() {
  const { addLiveProfile } = useShelf();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scansLeft, setScansLeft] = useState<number | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [quality, setQuality] = useState("Starting the YouCam camera guide...");

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((s) => setScansLeft(s.liveScansLeft ?? null))
      .catch(() => setScansLeft(null));
  }, []);

  async function analyze(blob: Blob, name: string) {
    const form = new FormData();
    form.append("image", blob, name);
    setBusy("YouCam is analyzing your skin (about 10 seconds)");
    const res = await fetch("/api/skin", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "The scan did not finish.");
    addLiveProfile(json.profile as SkinProfile);
    setScansLeft(json.liveScansLeft ?? null);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setBusy("Preparing your photo");
      const blob = await downscaleImage(file, 1600, 0.92);
      await analyze(blob, "selfie.jpg");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The scan did not finish.");
    } finally {
      setBusy(null);
    }
  }

  async function onCamera() {
    setError(null);
    setQuality("Starting the YouCam camera guide...");
    setCameraOpen(true);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    try {
      const width = Math.min(window.innerWidth - 48, 480);
      const height = Math.min(window.innerHeight - 220, Math.round((width * 4) / 3));
      const photo = await captureWithCameraKit({ width, height }, (q) => setQuality(describeQuality(q)));
      setCameraOpen(false);
      await analyze(photo, "camera.jpg");
    } catch (e) {
      setCameraOpen(false);
      const msg = e instanceof Error ? e.message : "";
      if (msg !== "closed") setError(msg || "The camera guide stopped. You can upload a photo instead.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-moss/50 bg-white/70 p-3 max-w-md grid gap-2">
      <p className="font-extrabold">Scan your own skin</p>
      <p className="text-xs text-muted">
        Front-facing, even light, face filling most of the width, no glasses. One scan uses 12 YouCam units
        {scansLeft !== null ? ` (${scansLeft} live scans left on this server)` : ""}.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCamera}
          disabled={Boolean(busy)}
          data-testid="live-camera"
          className="rounded-full bg-moss px-4 py-2 text-sm font-bold text-white hover:bg-moss-dark disabled:opacity-60 min-h-10"
        >
          Use the YouCam camera guide
        </button>
        <label
          className="rounded-full border border-ink px-4 py-2 text-sm font-bold cursor-pointer hover:bg-white min-h-10 inline-flex items-center"
          data-testid="live-selfie"
        >
          Upload a selfie
          <input
            type="file"
            accept="image/jpeg,image/png"
            capture="user"
            className="sr-only"
            disabled={Boolean(busy)}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
      </div>
      <p role="status" aria-live="polite" className="text-sm">
        {busy && <span className="font-semibold text-moss">{busy}...</span>}
        {error && <span className="font-semibold text-skip">{error}</span>}
      </p>
      {cameraOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="YouCam camera guide"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          data-testid="camera-dialog"
        >
          <div className="rounded-3xl bg-white p-3 grid gap-2 justify-items-center max-w-full">
            <div id="YMK-module" />
            <p aria-live="polite" className="text-sm font-semibold" data-testid="camera-quality">
              {quality}
            </p>
            <button
              type="button"
              onClick={() => window.YMK?.close()}
              className="rounded-full border border-ink px-4 py-2 text-sm font-bold min-h-10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
