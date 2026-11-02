export type Concern = "acne" | "pore" | "oiliness" | "moisture" | "redness" | "texture";
export const CONCERNS: Concern[] = ["acne", "pore", "oiliness", "moisture", "redness", "texture"];

/** clear: raw score 70 or more; some: 50 to 69; focus: under 50 (YouCam raw scores: higher is healthier). */
export type Level = "clear" | "some" | "focus";

export type Region = "forehead" | "nose" | "cheeks" | "chin";
export const REGIONS: Region[] = ["forehead", "nose", "cheeks", "chin"];

export type RegionInfo = {
  detected: boolean;
  /** share of the face box with visible detections, 0 to 1 */
  coverage: number;
  /** alpha-weighted share of detections per zone, sums to 1 */
  shares: Partial<Record<Region, number>>;
};

export type ConcernScore = {
  concern: Concern;
  uiScore: number;
  rawScore: number;
  level: Level;
  maskUrl?: string;
  regions?: RegionInfo;
  /** true for maps that cover the whole face (moisture) */
  wholeFace?: boolean;
};

export type ApiStamp = {
  name: string;
  endpoint: string;
  taskId?: string;
  capturedAt?: string;
  elapsedMs?: number;
  unitsUsed?: number;
  model?: string;
};

export type SkinProfile = {
  id: string;
  label: string;
  photoUrl: string;
  source: "replay" | "live";
  api: ApiStamp;
  scores: Record<Concern, ConcernScore>;
  skinType: { whole?: string; tZone?: string; uZone?: string; maskUrl?: string };
};

export type ProductType = "cleanser" | "treatment" | "moisturizer" | "sunscreen" | "other";

export type Product = {
  id: string;
  brand: string;
  name: string;
  type: ProductType;
  size?: string;
  labelImage: string;
  ingredients: string[];
  source: "replay" | "live";
  api: ApiStamp;
};

export type Tag =
  | "drying_surfactant"
  | "drying_alcohol"
  | "fragrance"
  | "fragrance_allergen"
  | "essential_oil"
  | "comedogenic"
  | "humectant"
  | "barrier_lipid"
  | "occlusive_emollient"
  | "bha"
  | "aha"
  | "niacinamide"
  | "soothing"
  | "benzoyl_peroxide"
  | "retinoid"
  | "menthol"
  | "zinc"
  | "fatty_alcohol";

export type VerdictKind = "good" | "care" | "skip";

export type Driver = {
  ingredient: string;
  position: number;
  tag: Tag;
  concern: Concern;
  kind: "helps" | "risk";
  strength: 1 | 2;
  level: Level;
  severity: "major" | "moderate" | "minor" | "benefit";
};

export type Verdict = {
  kind: VerdictKind;
  headline: string;
  risks: Driver[];
  helps: Driver[];
  /** flagged ingredients that do not matter for this person because the concern reads clear */
  notForYou: Array<{ ingredient: string; tag: Tag; concern: Concern; rawScore: number }>;
  /** concerns this verdict is about, with where the mask shows them */
  areas: Array<{ concern: Concern; where: string }>;
  matched: number;
  unknown: string[];
  patchTest: boolean;
};
