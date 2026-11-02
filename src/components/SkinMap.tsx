"use client";

/* eslint-disable @next/next/no-img-element */
import type { Concern, SkinProfile } from "@/lib/types";
import { CONCERNS } from "@/lib/types";
import { CONCERN_LABEL } from "@/lib/skin";

export type MapLayer = Concern | "skin_type";

export function SkinMap({
  profile,
  layers,
  onToggle,
  compact = false,
}: {
  profile: SkinProfile;
  layers: MapLayer[];
  onToggle?: (l: MapLayer) => void;
  compact?: boolean;
}) {
  const available: MapLayer[] = [...CONCERNS.filter((c) => profile.scores[c]?.maskUrl), ...(profile.skinType.maskUrl ? (["skin_type"] as MapLayer[]) : [])];
  const urlFor = (l: MapLayer) => (l === "skin_type" ? profile.skinType.maskUrl : profile.scores[l]?.maskUrl);
  return (
    <div>
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-3xl bg-sand-2 shadow-sm" data-testid="skin-map">
        <img src={profile.photoUrl} alt={`${profile.label} selfie used for the skin scan`} className="absolute inset-0 w-full h-full object-cover" />
        {available.map((l) => (
          <img
            key={l}
            src={urlFor(l)}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: layers.includes(l) ? (l === "moisture" ? 0.75 : 1) : 0 }}
          />
        ))}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
          YouCam detection masks
        </span>
      </div>
      {onToggle && !compact && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Show detection masks">
          {available.map((l) => {
            const on = layers.includes(l);
            return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                data-testid={`mask-toggle-${l}`}
                onClick={() => onToggle(l)}
                className={`min-h-9 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  on ? "bg-ink text-white border-ink" : "bg-white text-ink border-line hover:bg-sand-2"
                }`}
              >
                {l === "skin_type" ? "Skin type zones" : CONCERN_LABEL[l]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
