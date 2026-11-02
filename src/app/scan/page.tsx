"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useShelf } from "@/lib/store";
import type { Concern, SkinProfile } from "@/lib/types";
import { CONCERNS } from "@/lib/types";
import { profileSummary } from "@/lib/skin";
import { downscaleImage } from "@/lib/image";
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

function LiveScanButton() {
  const { addLiveProfile } = useShelf();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scansLeft, setScansLeft] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((s) => setScansLeft(s.liveScansLeft ?? null))
      .catch(() => setScansLeft(null));
  }, []);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setBusy("Preparing your photo");
      const blob = await downscaleImage(file, 1600, 0.92);
      const form = new FormData();
      form.append("image", blob, "selfie.jpg");
      setBusy("YouCam is analyzing your skin (about 10 seconds)");
      const res = await fetch("/api/skin", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "The scan did not finish.");
      addLiveProfile(json.profile as SkinProfile);
      setScansLeft(json.liveScansLeft ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The scan did not finish.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-moss/50 bg-white/70 p-3 max-w-md">
      <label className="flex items-center gap-3 cursor-pointer" data-testid="live-selfie">
        <span className="grid place-items-center w-12 h-16 rounded-xl bg-good-bg text-good text-2xl font-black" aria-hidden>
          +
        </span>
        <span>
          <span className="block font-extrabold">Scan your own selfie</span>
          <span className="block text-xs text-muted">
            Front-facing, even light, face filling most of the width, no glasses. One scan uses 12 YouCam units
            {scansLeft !== null ? ` (${scansLeft} live scans left on this server)` : ""}.
          </span>
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          capture="user"
          className="sr-only"
          disabled={Boolean(busy)}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
      <p role="status" aria-live="polite" className="mt-2 text-sm">
        {busy && <span className="font-semibold text-moss">{busy}...</span>}
        {error && <span className="font-semibold text-skip">{error}</span>}
      </p>
    </div>
  );
}
