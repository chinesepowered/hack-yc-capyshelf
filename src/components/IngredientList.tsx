"use client";

import { lookupIngredient, TAGS } from "@/data/ingredients";
import { CONCERN_LABEL } from "@/lib/skin";
import type { Verdict } from "@/lib/types";

type Status = "major" | "moderate" | "minor" | "helps" | "notForYou" | "neutral" | "unknown";

const STYLE: Record<Status, string> = {
  major: "bg-skip-bg text-skip border-skip/40",
  moderate: "bg-care-bg text-care border-care/40",
  minor: "bg-care-bg/50 text-care border-care/20",
  helps: "bg-good-bg text-good border-good/40",
  notForYou: "bg-white text-muted border-line",
  neutral: "bg-white text-ink border-line",
  unknown: "bg-white text-muted border-dashed border-muted/50",
};

const NOTE: Record<Status, string> = {
  major: "Works against your scan",
  moderate: "Use with care",
  minor: "Small amount, noted",
  helps: "Helps your scan",
  notForYou: "Flagged in general, not for you",
  neutral: "Known, no effect on these concerns",
  unknown: "Not in Capy's table yet",
};

export function IngredientList({ ingredients, verdict }: { ingredients: string[]; verdict: Verdict }) {
  return (
    <div>
      <ol className="flex flex-wrap gap-2" data-testid="ingredient-list" aria-label="Ingredients in label order">
        {ingredients.map((ing, i) => {
          const status = statusFor(ing, verdict);
          const entry = lookupIngredient(ing);
          const tagText = entry?.tags.map((t) => TAGS[t].label).join(", ");
          const concerns = [
            ...verdict.risks.filter((r) => r.ingredient === ing).map((r) => CONCERN_LABEL[r.concern]),
            ...verdict.helps.filter((h) => h.ingredient === ing).map((h) => CONCERN_LABEL[h.concern]),
          ];
          const detail = [tagText || entry?.note, concerns.length ? `for ${[...new Set(concerns)].join(", ").toLowerCase()}` : "", NOTE[status]]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={`${ing}-${i}`}>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${STYLE[status]}`}
                title={detail}
                data-testid={`ing-${status}`}
              >
                <span className="text-xs opacity-70 tabular-nums">{i + 1}</span>
                {ing}
                <span className="sr-only">: {detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted" aria-label="Legend">
        {(["major", "moderate", "helps", "notForYou", "neutral", "unknown"] as Status[]).map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span className={`inline-block w-3.5 h-3.5 rounded-full border ${STYLE[s]}`} aria-hidden />
            {NOTE[s]}
          </li>
        ))}
      </ul>
    </div>
  );
}

function statusFor(ing: string, v: Verdict): Status {
  const risks = v.risks.filter((r) => r.ingredient === ing);
  if (risks.some((r) => r.severity === "major")) return "major";
  if (risks.some((r) => r.severity === "moderate")) return "moderate";
  if (v.helps.some((h) => h.ingredient === ing)) return "helps";
  if (risks.length) return "minor";
  if (v.notForYou.some((n) => n.ingredient === ing)) return "notForYou";
  if (v.unknown.includes(ing)) return "unknown";
  return "neutral";
}
