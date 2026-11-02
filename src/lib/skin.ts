import type { ApiStamp, Concern, ConcernScore, Level, Region, RegionInfo, SkinProfile } from "./types";
import { CONCERNS } from "./types";

export const CONCERN_LABEL: Record<Concern, string> = {
  acne: "Breakouts",
  pore: "Pores",
  oiliness: "Oiliness",
  moisture: "Hydration",
  redness: "Redness",
  texture: "Texture",
};

/** YouCam's own concern names, shown next to ours so judges can see the API fields. */
export const YOUCAM_FIELD: Record<Concern, string> = {
  acne: "acne",
  pore: "pore",
  oiliness: "oiliness",
  moisture: "moisture",
  redness: "redness",
  texture: "texture",
};

export const LEVEL_LABEL: Record<Level, string> = {
  clear: "Looks balanced",
  some: "Worth watching",
  focus: "Main focus",
};

export function levelFor(raw: number): Level {
  if (raw >= 70) return "clear";
  if (raw >= 50) return "some";
  return "focus";
}

const REGION_WORD: Record<Region, string> = {
  forehead: "forehead",
  nose: "nose",
  cheeks: "cheeks",
  chin: "chin",
};

/** "mostly your cheeks and chin", from mask shares. */
export function whereText(score: ConcernScore | undefined): string {
  if (!score) return "";
  if (score.wholeFace) return "across your face";
  const info = score.regions;
  if (!info || !info.detected) return "not detected in the photo";
  const sorted = (Object.entries(info.shares) as Array<[Region, number]>)
    .filter(([, v]) => v > 0.05)
    .sort((a, b) => b[1] - a[1]);
  const picked: Region[] = [];
  let sum = 0;
  for (const [r, v] of sorted) {
    picked.push(r);
    sum += v;
    if (sum >= 0.75 || picked.length === 2) break;
  }
  if (picked.length === 0) return "in small spots";
  return `mostly on your ${picked.map((r) => REGION_WORD[r]).join(" and ")}`;
}

type RawOutput = Array<Record<string, unknown>>;

/** Turn a YouCam skin-analysis result (format: json) into a SkinProfile. */
export function profileFromYouCam(args: {
  id: string;
  label: string;
  photoUrl: string;
  source: "replay" | "live";
  api: ApiStamp;
  output: RawOutput;
  regions?: Partial<Record<Concern, RegionInfo>>;
}): SkinProfile {
  const scores = {} as Record<Concern, ConcernScore>;
  const skinType: SkinProfile["skinType"] = {};
  for (const item of args.output) {
    const type = String(item.type);
    const masks = (item.mask_urls as string[] | undefined) ?? [];
    if ((CONCERNS as string[]).includes(type)) {
      const c = type as Concern;
      const raw = Number(item.raw_score);
      scores[c] = {
        concern: c,
        uiScore: Number(item.ui_score),
        rawScore: Math.round(raw * 10) / 10,
        level: levelFor(raw),
        maskUrl: masks[0],
        regions: args.regions?.[c],
        wholeFace: c === "moisture" ? true : undefined,
      };
    } else if (type === "skin_type") {
      const region = String(item.region ?? "whole");
      const value = String(item.skin_type ?? "");
      if (region === "whole") skinType.whole = value;
      if (region === "t_zone") skinType.tZone = value;
      if (region === "u_zone") skinType.uZone = value;
      skinType.maskUrl = masks[0];
    }
  }
  // Skin type can raise a concern by one step when the two agree (never lowers it).
  const st = `${skinType.whole ?? ""} ${skinType.tZone ?? ""}`.toLowerCase();
  const bump = (c: Concern, word: string) => {
    if (scores[c] && st.includes(word) && scores[c].level === "clear") scores[c].level = "some";
  };
  bump("oiliness", "oily");
  bump("moisture", "dry");
  bump("redness", "redness");
  return {
    id: args.id,
    label: args.label,
    photoUrl: args.photoUrl,
    source: args.source,
    api: args.api,
    scores,
    skinType,
  };
}

/** One-line, kind summary of what the scan found. */
export function profileSummary(p: SkinProfile): { focus: Concern[]; watch: Concern[]; text: string } {
  const list = CONCERNS.filter((c) => p.scores[c]);
  const focus = list.filter((c) => p.scores[c].level === "focus").sort((a, b) => p.scores[a].rawScore - p.scores[b].rawScore);
  const watch = list.filter((c) => p.scores[c].level === "some").sort((a, b) => p.scores[a].rawScore - p.scores[b].rawScore);
  const names = (cs: Concern[]) => cs.map((c) => CONCERN_LABEL[c].toLowerCase()).join(", ");
  let text = "";
  if (focus.length) text += `Main focus: ${names(focus)}.`;
  if (watch.length) text += `${text ? " " : ""}Worth watching: ${names(watch)}.`;
  if (!text) text = "Everything Capy checks looks balanced.";
  return { focus, watch, text };
}
