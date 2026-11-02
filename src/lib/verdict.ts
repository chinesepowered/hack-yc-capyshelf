/**
 * The deterministic verdict. Inputs: the ingredient list as read from the label, the product
 * type, and the person's measured YouCam scores. Output: Good match / Use with care / Skip for you,
 * with the ingredients that drove it. No AI involved here.
 *
 * Scoring of each risk = strength (1 or 2) x level factor (some 1, focus 1.5)
 *                        x position factor (1 to 5: 1, 6 to 10: 0.45, later: 0.2)
 *                        x 0.5 when a rinse-off product softens that tag.
 * Allergy-type tags (fragrance, essential oils) use a position factor of at least 0.6.
 *   major    (score 1.8 or more)  -> Skip for you
 *   moderate (0.6 to 1.8)         -> Use with care
 *   minor    (under 0.6)          -> noted only
 */
import { lookupIngredient, TAGS } from "@/data/ingredients";
import { CONCERN_LABEL, profileSummary, whereText } from "./skin";
import type { Concern, Driver, Level, Product, ProductType, SkinProfile, Tag, Verdict, VerdictKind } from "./types";

export const VERDICT_LABEL: Record<VerdictKind, string> = {
  good: "Good match",
  care: "Use with care",
  skip: "Skip for you",
};

const LEVEL_FACTOR: Record<Level, number> = { clear: 0, some: 1, focus: 1.5 };

export function positionFactor(pos: number): number {
  if (pos <= 5) return 1;
  if (pos <= 10) return 0.45;
  return 0.2;
}

export function isRinseOff(type: ProductType): boolean {
  return type === "cleanser";
}

type Scored = Driver & { score: number };

export function computeVerdict(profile: SkinProfile, product: Pick<Product, "ingredients" | "type" | "name">): Verdict {
  const risks: Scored[] = [];
  const helps: Scored[] = [];
  const notForYou: Verdict["notForYou"] = [];
  const unknown: string[] = [];
  let matched = 0;
  const rinseOff = isRinseOff(product.type);

  product.ingredients.forEach((ingredient, i) => {
    const pos = i + 1;
    const entry = lookupIngredient(ingredient);
    if (!entry) {
      unknown.push(ingredient);
      return;
    }
    matched++;
    for (const tag of entry.tags) {
      const info = TAGS[tag];
      for (const eff of info.effects) {
        const s = profile.scores[eff.concern];
        if (!s) continue;
        const level = s.level;
        if (level === "clear") {
          if (eff.kind === "risk" && !notForYou.some((n) => n.ingredient === ingredient && n.concern === eff.concern)) {
            notForYou.push({ ingredient, tag, concern: eff.concern, rawScore: s.rawScore });
          }
          continue;
        }
        let pf = positionFactor(pos);
        if (info.positionMattersLess) pf = Math.max(pf, 0.6);
        let score = eff.strength * LEVEL_FACTOR[level] * pf;
        if (eff.kind === "risk" && rinseOff && info.rinseOffSoftens) score *= 0.5;
        const base = { ingredient, position: pos, tag, concern: eff.concern, kind: eff.kind, strength: eff.strength, level };
        if (eff.kind === "risk") {
          const severity = score >= 1.8 ? "major" : score >= 0.6 ? "moderate" : "minor";
          risks.push({ ...base, severity, score });
        } else {
          helps.push({ ...base, severity: "benefit", score });
        }
      }
    }
  });

  risks.sort((a, b) => b.score - a.score);
  helps.sort((a, b) => b.score - a.score);

  const kind: VerdictKind = risks.some((r) => r.severity === "major")
    ? "skip"
    : risks.some((r) => r.severity === "moderate")
      ? "care"
      : "good";

  const concernsInPlay: Concern[] = [];
  const pushConcern = (c: Concern) => {
    if (!concernsInPlay.includes(c)) concernsInPlay.push(c);
  };
  if (kind === "good") helps.slice(0, 4).forEach((h) => pushConcern(h.concern));
  else risks.filter((r) => r.severity !== "minor").forEach((r) => pushConcern(r.concern));
  const areas = concernsInPlay.map((c) => ({ concern: c, where: whereText(profile.scores[c]) }));

  return {
    kind,
    headline: headline(kind, risks, helps, profile),
    risks: risks.map(strip),
    helps: helps.map(strip),
    notForYou,
    areas,
    matched,
    unknown,
    patchTest: kind !== "skip",
  };
}

function strip(d: Scored): Driver {
  const { score: _score, ...rest } = d;
  void _score;
  return rest;
}

function listWords(xs: string[]): string {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

/** Risk predicates that read right after one or several ingredient names. */
const RISK_PHRASE: Partial<Record<Tag, string>> = {
  drying_surfactant: "can strip oil and water from skin",
  drying_alcohol: "may dry skin out",
  fragrance: "can trigger skin reactions",
  fragrance_allergen: "can trigger skin reactions",
  essential_oil: "can irritate skin",
  comedogenic: "may clog pores",
  bha: "can be drying",
  aha: "can sting",
  benzoyl_peroxide: "can dry and irritate skin",
  retinoid: "can irritate skin at first",
  menthol: "can irritate sensitive skin",
};

const HELP_PHRASE: Record<Concern, string> = {
  acne: "can help with breakouts",
  pore: "can help keep pores clear",
  oiliness: "can help with oil",
  moisture: "can help skin hold water",
  redness: "can help calm redness",
  texture: "can help smooth texture",
};

const CONCERN_IS: Record<Concern, string> = {
  acne: "breakouts are",
  pore: "pores are",
  oiliness: "oiliness is",
  moisture: "hydration is",
  redness: "redness is",
  texture: "texture is",
};

function headline(kind: VerdictKind, risks: Driver[], helps: Driver[], profile: SkinProfile): string {
  if (kind !== "good") {
    const top = risks[0];
    const same = risks.filter((r) => r.concern === top.concern && r.severity !== "minor");
    const groups: Array<{ tag: Tag; names: string[] }> = [];
    for (const r of same) {
      const g = groups.find((x) => x.tag === r.tag);
      if (g) {
        if (!g.names.includes(r.ingredient)) g.names.push(r.ingredient);
      } else groups.push({ tag: r.tag, names: [r.ingredient] });
    }
    const parts = groups
      .slice(0, 2)
      .map((g) => `${listWords(g.names.slice(0, 2))} ${RISK_PHRASE[g.tag] ?? "can work against your skin"}`);
    const where = whereText(profile.scores[top.concern]);
    const stake = top.level === "focus" ? "your main focus" : "worth watching for you";
    return `${parts.join(" and ")}, and ${CONCERN_IS[top.concern]} ${stake} (${where}).`;
  }
  const focus = profileSummary(profile).focus;
  const forFocus = helps.filter((h) => focus.includes(h.concern));
  const best = forFocus.length ? forFocus : helps;
  if (best.length === 0) return "Nothing on the label works against what YouCam measured.";
  const c = best[0].concern;
  const names: string[] = [];
  const seenTags: Tag[] = [];
  for (const h of best.filter((x) => x.concern === c)) {
    if (seenTags.includes(h.tag) || names.includes(h.ingredient)) continue;
    seenTags.push(h.tag);
    names.push(h.ingredient);
    if (names.length === 3) break;
  }
  const stake = best[0].level === "focus" ? "your main focus" : "worth watching for you";
  return `${listWords(names)} ${HELP_PHRASE[c]}, and ${CONCERN_IS[c]} ${stake}. Nothing on the label works against your scan.`;
}

/** Plain facts handed to the LLM so it can only rephrase, never decide. */
export function verdictFacts(
  profile: SkinProfile,
  product: Pick<Product, "name" | "type"> & Partial<Pick<Product, "ingredients">>,
  v: Verdict,
): string[] {
  const facts: string[] = [];
  const summary = profileSummary(profile);
  facts.push(`YouCam AI Skin Analysis: ${summary.text}`);
  facts.push(`Verdict reason from the ingredient table: ${v.headline}`);
  for (const r of v.risks.filter((x) => x.severity !== "minor").slice(0, 3)) {
    facts.push(
      `${r.ingredient} (number ${r.position} on the list): ${TAGS[r.tag].plain} ${CONCERN_LABEL[r.concern]} raw score ${profile.scores[r.concern].rawScore} of 100, higher is healthier, ${whereText(profile.scores[r.concern])}.`,
    );
  }
  for (const h of v.helps.slice(0, 3)) {
    facts.push(`${h.ingredient} helps: ${TAGS[h.tag].plain}`);
  }
  if (v.kind === "good" && v.helps.length === 0) {
    facts.push(
      "No ingredient on this label targets the concerns YouCam flagged. It is a good match only because nothing on it works against them.",
    );
    const said = new Set<string>();
    for (const ing of product.ingredients ?? []) {
      const entry = lookupIngredient(ing);
      if (!entry || said.size >= 2) continue;
      const helped = entry.tags.flatMap((t) => TAGS[t].effects.filter((e) => e.kind === "helps").map((e) => e.concern));
      const clear = [...new Set(helped)].filter((c) => profile.scores[c]?.level === "clear");
      if (clear.length && clear.length === new Set(helped).size) {
        said.add(ing);
        facts.push(
          `${ing} is counted in Capy's table for ${clear.map((c) => CONCERN_LABEL[c].toLowerCase()).join(", ")}, which already read balanced for this person.`,
        );
      }
    }
  }
  if (v.kind === "care") facts.push("Suggest a patch test before using it all over.");
  if (product.type === "cleanser") facts.push("It is a rinse-off cleanser, so contact time is short.");
  return facts;
}
