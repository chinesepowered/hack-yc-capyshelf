"use client";

import type { Concern, SkinProfile } from "@/lib/types";
import { CONCERNS } from "@/lib/types";
import { CONCERN_LABEL, LEVEL_LABEL, whereText, YOUCAM_FIELD } from "@/lib/skin";

const LEVEL_PILL = {
  focus: "bg-skip-bg text-skip",
  some: "bg-care-bg text-care",
  clear: "bg-good-bg text-good",
} as const;

const ORDER = { focus: 0, some: 1, clear: 2 } as const;

export function ScoreList({
  profile,
  active,
  onPick,
}: {
  profile: SkinProfile;
  active?: Concern[];
  onPick?: (c: Concern) => void;
}) {
  const list = CONCERNS.filter((c) => profile.scores[c]).sort(
    (a, b) =>
      ORDER[profile.scores[a].level] - ORDER[profile.scores[b].level] ||
      profile.scores[a].rawScore - profile.scores[b].rawScore,
  );
  return (
    <ul className="grid gap-2" data-testid="score-list">
      {list.map((c) => {
        const s = profile.scores[c];
        const on = active?.includes(c);
        return (
          <li key={c}>
            <button
              type="button"
              onClick={() => onPick?.(c)}
              aria-pressed={onPick ? Boolean(on) : undefined}
              data-testid={`score-${c}`}
              className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors ${
                on ? "border-ink bg-white shadow-sm" : "border-line bg-white/70 hover:bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-lg">{CONCERN_LABEL[c]}</span>
                <code className="text-xs text-muted font-mono">{YOUCAM_FIELD[c]}</code>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold ${LEVEL_PILL[s.level]}`}>
                  {LEVEL_LABEL[s.level]}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2.5 flex-1 rounded-full bg-sand-2 overflow-hidden" aria-hidden>
                  <div
                    className={`h-full rounded-full ${s.level === "focus" ? "bg-skip" : s.level === "some" ? "bg-care" : "bg-good"}`}
                    style={{ width: `${Math.max(4, s.rawScore)}%` }}
                  />
                </div>
                <span className="text-sm tabular-nums text-muted w-44 text-right">
                  raw <strong className="text-ink">{s.rawScore}</strong> / UI {s.uiScore}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {s.level === "clear" && !s.wholeFace ? "Little to note" : `Seen ${whereText(s)}`}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
