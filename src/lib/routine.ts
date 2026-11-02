import type { Product, ProductType, SkinProfile, Verdict } from "./types";

export type Row = { p: Product; v: Verdict };
export type Slot = {
  type: ProductType;
  label: string;
  pick?: Row;
  lookFor?: string;
  skipped: Row[];
};

const RANK = { good: 0, care: 1, skip: 2 } as const;

function flagged(profile: SkinProfile, c: keyof SkinProfile["scores"]): boolean {
  return Boolean(profile.scores[c] && profile.scores[c].level !== "clear");
}

/** What to look for when nothing scanned fits a slot. Deterministic, from the profile. */
export function lookFor(profile: SkinProfile, type: ProductType): string {
  if (type === "cleanser") {
    if (flagged(profile, "moisture")) return "a gentle, low-foam cleanser without sodium lauryl sulfate";
    if (flagged(profile, "acne") || flagged(profile, "pore")) return "a gentle cleanser; one with salicylic acid can help pores";
    return "a gentle, fragrance-free cleanser";
  }
  if (type === "treatment") {
    if (flagged(profile, "acne") || flagged(profile, "pore")) return "a serum with salicylic acid or niacinamide";
    if (flagged(profile, "redness")) return "a fragrance-free soothing serum";
    if (flagged(profile, "moisture")) return "a hydrating serum with glycerin or hyaluronic acid";
    return "nothing extra; a simple routine is fine";
  }
  if (flagged(profile, "acne")) return "a non-comedogenic, oil-free moisturizer";
  if (flagged(profile, "moisture")) return "a fragrance-free cream with ceramides and glycerin";
  return "a light, fragrance-free moisturizer";
}

export function buildRoutine(profile: SkinProfile, rows: Row[]): Slot[] {
  const slots: Array<{ type: ProductType; label: string }> = [
    { type: "cleanser", label: "Cleanse" },
    { type: "treatment", label: "Treat" },
    { type: "moisturizer", label: "Moisturize" },
  ];
  return slots.map((s) => {
    const ofType = rows.filter((r) => r.p.type === s.type);
    const ok = ofType.filter((r) => r.v.kind !== "skip").sort((a, b) => RANK[a.v.kind] - RANK[b.v.kind]);
    const skipped = ofType.filter((r) => r.v.kind === "skip");
    return ok.length
      ? { ...s, pick: ok[0], skipped }
      : { ...s, lookFor: lookFor(profile, s.type), skipped };
  });
}
