/**
 * Capy Shelf ingredient table. Deterministic: the verdict comes from this table plus the
 * person's measured YouCam scores. Each tag's evidence lives in src/data/sources.ts.
 *
 * Effects are tendencies, not guarantees. Strength 2 = well-known, strong tendency;
 * strength 1 = milder or less certain tendency.
 */
import type { Concern, Tag } from "@/lib/types";

export type Effect = { concern: Concern; kind: "helps" | "risk"; strength: 1 | 2 };

export type TagInfo = {
  label: string;
  plain: string;
  effects: Effect[];
  /** contact time is short in rinse-off products, so halve these risks there */
  rinseOffSoftens?: boolean;
  /** allergy-type risks: a little can be enough, so position on the list matters less */
  positionMattersLess?: boolean;
};

export const TAGS: Record<Tag, TagInfo> = {
  drying_surfactant: {
    label: "Harsh foaming agent",
    plain: "A strong cleansing agent that can strip oil and water from skin and irritate dry or sensitive skin.",
    effects: [
      { concern: "moisture", kind: "risk", strength: 2 },
      { concern: "redness", kind: "risk", strength: 1 },
    ],
  },
  drying_alcohol: {
    label: "Drying alcohol",
    plain: "Simple alcohol helps products dry fast; in larger amounts it may dry out dry or sensitive skin.",
    effects: [
      { concern: "moisture", kind: "risk", strength: 2 },
      { concern: "redness", kind: "risk", strength: 1 },
    ],
  },
  fragrance: {
    label: "Fragrance",
    plain: "Fragrance is one of the most common causes of skin reactions to cosmetics.",
    effects: [{ concern: "redness", kind: "risk", strength: 2 }],
    positionMattersLess: true,
  },
  fragrance_allergen: {
    label: "Listed fragrance allergen",
    plain: "A scent ingredient that EU rules require on labels because some people react to it.",
    effects: [{ concern: "redness", kind: "risk", strength: 1 }],
    positionMattersLess: true,
  },
  essential_oil: {
    label: "Essential oil",
    plain: "A concentrated plant scent oil that can irritate or sensitize skin.",
    effects: [{ concern: "redness", kind: "risk", strength: 2 }],
    positionMattersLess: true,
  },
  comedogenic: {
    label: "May clog pores",
    plain: "Scored as pore-clogging in older comedogenicity tests, so it may mean more breakouts on acne-prone skin.",
    effects: [{ concern: "acne", kind: "risk", strength: 2 }],
    rinseOffSoftens: true,
  },
  humectant: {
    label: "Water magnet",
    plain: "Draws water into the top layer of skin.",
    effects: [{ concern: "moisture", kind: "helps", strength: 2 }],
  },
  barrier_lipid: {
    label: "Barrier support",
    plain: "A lipid like the ones your skin barrier is made of; helps skin hold on to water.",
    effects: [
      { concern: "moisture", kind: "helps", strength: 2 },
      { concern: "redness", kind: "helps", strength: 1 },
    ],
  },
  occlusive_emollient: {
    label: "Seals in water",
    plain: "Forms a light film that slows water loss and softens skin.",
    effects: [{ concern: "moisture", kind: "helps", strength: 1 }],
  },
  bha: {
    label: "Pore-clearing acid (BHA)",
    plain: "Salicylic acid works inside pores and is an approved acne ingredient. It can be drying.",
    effects: [
      { concern: "acne", kind: "helps", strength: 2 },
      { concern: "pore", kind: "helps", strength: 2 },
      { concern: "oiliness", kind: "helps", strength: 1 },
      { concern: "moisture", kind: "risk", strength: 1 },
    ],
    rinseOffSoftens: true,
  },
  aha: {
    label: "Smoothing acid (AHA)",
    plain: "Exfoliates the surface for smoother texture. Can sting, and makes skin more sensitive to sun.",
    effects: [
      { concern: "texture", kind: "helps", strength: 2 },
      { concern: "redness", kind: "risk", strength: 1 },
    ],
  },
  niacinamide: {
    label: "Niacinamide (vitamin B3)",
    plain: "Studied for less oil, a stronger barrier and less blotchy redness.",
    effects: [
      { concern: "oiliness", kind: "helps", strength: 1 },
      { concern: "redness", kind: "helps", strength: 1 },
      { concern: "moisture", kind: "helps", strength: 1 },
    ],
  },
  soothing: {
    label: "Soothing",
    plain: "A calming ingredient often used for irritated skin.",
    effects: [{ concern: "redness", kind: "helps", strength: 1 }],
  },
  benzoyl_peroxide: {
    label: "Acne fighter (benzoyl peroxide)",
    plain: "An approved acne ingredient. Often drying or irritating at first.",
    effects: [
      { concern: "acne", kind: "helps", strength: 2 },
      { concern: "moisture", kind: "risk", strength: 1 },
      { concern: "redness", kind: "risk", strength: 1 },
    ],
    rinseOffSoftens: true,
  },
  retinoid: {
    label: "Retinoid",
    plain: "Vitamin A family. Can help breakouts and fine lines over weeks, and is often irritating at first.",
    effects: [
      { concern: "texture", kind: "helps", strength: 1 },
      { concern: "acne", kind: "helps", strength: 1 },
      { concern: "redness", kind: "risk", strength: 1 },
      { concern: "moisture", kind: "risk", strength: 1 },
    ],
  },
  menthol: {
    label: "Menthol",
    plain: "A minty ingredient that can irritate sensitive skin.",
    effects: [{ concern: "redness", kind: "risk", strength: 1 }],
  },
  zinc: {
    label: "Zinc",
    plain: "May reduce oil, though the evidence is limited.",
    effects: [{ concern: "oiliness", kind: "helps", strength: 1 }],
  },
  fatty_alcohol: {
    label: "Fatty alcohol (not drying)",
    plain: "Despite the name, this is a waxy, softening ingredient, not a drying alcohol.",
    effects: [],
  },
};

export type IngredientEntry = { name: string; aliases?: string[]; tags: Tag[]; note?: string };

/** Known ingredients. Names are INCI; matching ignores case and punctuation. */
export const INGREDIENTS: IngredientEntry[] = [
  // cleansing agents
  { name: "Sodium Lauryl Sulfate", aliases: ["SLS"], tags: ["drying_surfactant"] },
  { name: "Ammonium Lauryl Sulfate", tags: ["drying_surfactant"] },
  { name: "Sodium Laureth Sulfate", tags: [], note: "A foaming agent that is milder than sodium lauryl sulfate." },
  { name: "Cocamidopropyl Betaine", tags: [], note: "A mild foaming agent." },
  { name: "Sodium Cocoyl Isethionate", tags: [], note: "A mild cleansing agent." },
  { name: "Decyl Glucoside", tags: [], note: "A mild cleansing agent." },
  { name: "Coco-Glucoside", tags: [], note: "A mild cleansing agent." },
  // alcohols
  { name: "Alcohol Denat", aliases: ["Alcohol Denat.", "SD Alcohol", "SD Alcohol 40", "SD Alcohol 40-B", "Denatured Alcohol"], tags: ["drying_alcohol"] },
  { name: "Alcohol", aliases: ["Ethanol", "Ethyl Alcohol"], tags: ["drying_alcohol"] },
  { name: "Isopropyl Alcohol", tags: ["drying_alcohol"] },
  { name: "Cetearyl Alcohol", tags: ["fatty_alcohol"] },
  { name: "Cetyl Alcohol", tags: ["fatty_alcohol"] },
  { name: "Stearyl Alcohol", tags: ["fatty_alcohol"] },
  { name: "Behenyl Alcohol", tags: ["fatty_alcohol"] },
  { name: "Benzyl Alcohol", tags: [], note: "Used as a preservative in small amounts." },
  // fragrance
  { name: "Parfum", aliases: ["Fragrance", "Parfum (Fragrance)", "Fragrance (Parfum)", "Aroma"], tags: ["fragrance"] },
  { name: "Linalool", tags: ["fragrance_allergen"] },
  { name: "Limonene", aliases: ["D-Limonene"], tags: ["fragrance_allergen"] },
  { name: "Citronellol", tags: ["fragrance_allergen"] },
  { name: "Geraniol", tags: ["fragrance_allergen"] },
  { name: "Citral", tags: ["fragrance_allergen"] },
  { name: "Eugenol", tags: ["fragrance_allergen"] },
  { name: "Coumarin", tags: ["fragrance_allergen"] },
  { name: "Hexyl Cinnamal", tags: ["fragrance_allergen"] },
  { name: "Benzyl Salicylate", tags: ["fragrance_allergen"] },
  { name: "Lavandula Angustifolia Oil", aliases: ["Lavender Oil", "Lavandula Angustifolia (Lavender) Oil"], tags: ["essential_oil"] },
  { name: "Citrus Limon Peel Oil", aliases: ["Lemon Peel Oil", "Citrus Limon (Lemon) Peel Oil"], tags: ["essential_oil"] },
  { name: "Citrus Aurantium Dulcis Peel Oil", aliases: ["Orange Peel Oil", "Citrus Aurantium Dulcis (Orange) Peel Oil"], tags: ["essential_oil"] },
  { name: "Mentha Piperita Oil", aliases: ["Peppermint Oil", "Mentha Piperita (Peppermint) Oil"], tags: ["essential_oil", "menthol"] },
  { name: "Eucalyptus Globulus Leaf Oil", aliases: ["Eucalyptus Oil"], tags: ["essential_oil"] },
  { name: "Melaleuca Alternifolia Leaf Oil", aliases: ["Tea Tree Oil", "Melaleuca Alternifolia (Tea Tree) Leaf Oil"], tags: ["essential_oil"] },
  { name: "Rosmarinus Officinalis Leaf Oil", aliases: ["Rosemary Oil"], tags: ["essential_oil"] },
  { name: "Menthol", tags: ["menthol"] },
  // often pore-clogging
  { name: "Isopropyl Myristate", aliases: ["IPM"], tags: ["comedogenic"] },
  { name: "Isopropyl Palmitate", tags: ["comedogenic"] },
  { name: "Isopropyl Isostearate", tags: ["comedogenic"] },
  { name: "Myristyl Myristate", tags: ["comedogenic"] },
  { name: "Cocos Nucifera Oil", aliases: ["Coconut Oil", "Coconut Butter", "Cocos Nucifera (Coconut) Oil"], tags: ["comedogenic"], note: "Rated as coconut butter in the 1989 comedogenicity tests." },
  { name: "Theobroma Cacao Seed Butter", aliases: ["Cocoa Butter", "Theobroma Cacao (Cocoa) Seed Butter"], tags: ["comedogenic"] },
  { name: "Laureth-4", tags: ["comedogenic"] },
  { name: "Acetylated Lanolin Alcohol", tags: ["comedogenic"] },
  { name: "Ethylhexyl Palmitate", tags: ["comedogenic"] },
  { name: "Triticum Vulgare Germ Oil", aliases: ["Wheat Germ Oil", "Triticum Vulgare (Wheat) Germ Oil"], tags: ["comedogenic"] },
  // hydration
  { name: "Glycerin", aliases: ["Glycerol"], tags: ["humectant"] },
  { name: "Sodium Hyaluronate", tags: ["humectant"] },
  { name: "Hyaluronic Acid", tags: ["humectant"] },
  { name: "Hydrolyzed Hyaluronic Acid", tags: ["humectant"] },
  { name: "Butylene Glycol", tags: ["humectant"] },
  { name: "Propanediol", tags: ["humectant"] },
  { name: "Pentylene Glycol", tags: ["humectant"] },
  { name: "Urea", tags: ["humectant"] },
  { name: "Sodium PCA", tags: ["humectant"] },
  { name: "Betaine", tags: ["humectant"] },
  { name: "Panthenol", aliases: ["D-Panthenol", "Provitamin B5"], tags: ["humectant", "soothing"] },
  { name: "Ceramide NP", aliases: ["Ceramide 3"], tags: ["barrier_lipid"] },
  { name: "Ceramide AP", aliases: ["Ceramide 6 II"], tags: ["barrier_lipid"] },
  { name: "Ceramide EOP", aliases: ["Ceramide 1"], tags: ["barrier_lipid"] },
  { name: "Cholesterol", tags: ["barrier_lipid"] },
  { name: "Phytosphingosine", tags: ["barrier_lipid"] },
  { name: "Squalane", tags: ["occlusive_emollient"], note: "A light, non-greasy moisturizing oil." },
  { name: "Dimethicone", tags: ["occlusive_emollient"] },
  { name: "Petrolatum", aliases: ["Petroleum Jelly"], tags: ["occlusive_emollient"] },
  { name: "Paraffinum Liquidum", aliases: ["Mineral Oil"], tags: ["occlusive_emollient"] },
  { name: "Butyrospermum Parkii Butter", aliases: ["Shea Butter", "Butyrospermum Parkii (Shea) Butter"], tags: ["occlusive_emollient"] },
  { name: "Caprylic/Capric Triglyceride", tags: ["occlusive_emollient"] },
  // actives
  { name: "Salicylic Acid", aliases: ["Beta Hydroxy Acid", "BHA"], tags: ["bha"] },
  { name: "Glycolic Acid", tags: ["aha"] },
  { name: "Lactic Acid", tags: ["aha"] },
    { name: "Niacinamide", aliases: ["Nicotinamide"], tags: ["niacinamide"] },
  { name: "Benzoyl Peroxide", tags: ["benzoyl_peroxide"] },
  { name: "Retinol", tags: ["retinoid"] },
  { name: "Retinal", aliases: ["Retinaldehyde"], tags: ["retinoid"] },
  { name: "Adapalene", tags: ["retinoid"] },
  { name: "Zinc PCA", tags: ["zinc"] },
  { name: "Zinc Gluconate", tags: ["zinc"] },
  // soothing
  { name: "Allantoin", tags: ["soothing"] },
  { name: "Centella Asiatica Extract", aliases: ["Centella Asiatica Leaf Extract", "Cica"], tags: [], note: "Often sold as calming; Capy found no strong source yet, so it is not counted." },
  { name: "Madecassoside", tags: [], note: "Often sold as calming; not counted without a strong source." },
  { name: "Bisabolol", tags: [], note: "Often sold as calming; not counted without a strong source." },
  { name: "Avena Sativa Kernel Flour", aliases: ["Colloidal Oatmeal", "Avena Sativa (Oat) Kernel Flour"], tags: ["soothing"] },
  // neutral helpers (known, no effect on these concerns)
  { name: "Aqua", aliases: ["Water", "Aqua (Water)", "Water (Aqua)", "Eau"], tags: [], note: "The base of most products." },
  { name: "Carbomer", tags: [], note: "A thickener." },
  { name: "Xanthan Gum", tags: [], note: "A thickener." },
  { name: "Sodium Hydroxide", tags: [], note: "Adjusts pH in small amounts." },
  { name: "Citric Acid", tags: [], note: "Adjusts pH in small amounts." },
  { name: "Sodium Chloride", tags: [], note: "Salt, used to thicken washes." },
  { name: "Disodium EDTA", tags: [], note: "Keeps the formula stable." },
  { name: "Phenoxyethanol", tags: [], note: "A common preservative." },
  { name: "Ethylhexylglycerin", tags: [], note: "Helps the preservative work." },
  { name: "Sodium Benzoate", tags: [], note: "A preservative." },
  { name: "Potassium Sorbate", tags: [], note: "A preservative." },
  { name: "Tocopherol", aliases: ["Vitamin E"], tags: [], note: "An antioxidant." },
  { name: "Sodium Lauroyl Lactylate", tags: [], note: "An emulsifier." },
  { name: "Glyceryl Stearate", tags: [], note: "An emulsifier." },
];

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s*\/\s*/g, "/")
    .replace(/[.,;:*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const INDEX = new Map<string, IngredientEntry>();
for (const e of INGREDIENTS) {
  for (const n of [e.name, ...(e.aliases ?? [])]) INDEX.set(normalizeName(n), e);
}

/** Pattern fallbacks for names the table does not list word for word. */
const PATTERNS: Array<{ re: RegExp; tags: Tag[] }> = [
  { re: /\b(lavandula|citrus|mentha|eucalyptus|melaleuca|rosmarinus|cymbopogon|pelargonium|santalum|cinnamomum)\b.*\boil\b/, tags: ["essential_oil"] },
  { re: /\bceramide\b/, tags: ["barrier_lipid"] },
  { re: /\bhyaluron/, tags: ["humectant"] },
  { re: /\bsalicyl/, tags: ["bha"] },
  { re: /\b(glycolic|lactic) acid\b/, tags: ["aha"] },
  { re: /\bretin(ol|al|yl)\b/, tags: ["retinoid"] },
  { re: /\b(fragrance|parfum)\b/, tags: ["fragrance"] },
];

export function lookupIngredient(raw: string): IngredientEntry | null {
  const n = normalizeName(raw);
  if (INDEX.has(n)) return INDEX.get(n)!;
  const noParen = normalizeName(raw.replace(/\([^)]*\)/g, " "));
  if (INDEX.has(noParen)) return INDEX.get(noParen)!;
  const inParen = raw.match(/\(([^)]*)\)/)?.[1];
  if (inParen && INDEX.has(normalizeName(inParen))) return INDEX.get(normalizeName(inParen))!;
  for (const p of PATTERNS) if (p.re.test(n)) return { name: raw.trim(), tags: p.tags };
  return null;
}
