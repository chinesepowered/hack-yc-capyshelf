/**
 * Three FICTIONAL products for the demo. Brand names, product names and labels are
 * invented for Capy Shelf; any resemblance to real products is unintended.
 * The ingredient lists here are only used to RENDER the label images. The app never
 * reads them directly: the verdict uses what the vision model read off the label photo.
 */
import type { ProductType } from "@/lib/types";

export type DemoProductSpec = {
  id: string;
  brand: string;
  name: string;
  type: ProductType;
  size: string;
  tagline: string;
  directions: string;
  inci: string[];
  colors: { band: string; ink: string; paper: string };
};

export const DEMO_PRODUCTS: DemoProductSpec[] = [
  {
    id: "dew-drink-gel-cream",
    brand: "Mosslight",
    name: "Dew Drink Gel Cream",
    type: "moisturizer",
    size: "50 mL / 1.7 fl oz",
    tagline: "Lightweight daily hydration",
    directions: "Smooth over clean skin morning and night.",
    inci: [
      "Aqua (Water)",
      "Glycerin",
      "Isopropyl Myristate",
      "Dimethicone",
      "Butylene Glycol",
      "Niacinamide",
      "Squalane",
      "Myristyl Myristate",
      "Cetearyl Alcohol",
      "Sodium Hyaluronate",
      "Ceramide NP",
      "Panthenol",
      "Carbomer",
      "Sodium Hydroxide",
      "Phenoxyethanol",
      "Ethylhexylglycerin",
    ],
    colors: { band: "#2f6b4f", ink: "#173527", paper: "#f3f7f1" },
  },
  {
    id: "clear-morning-wash",
    brand: "Tidewhistle",
    name: "Clear Morning Foaming Wash",
    type: "cleanser",
    size: "150 mL / 5 fl oz",
    tagline: "Deep-clean foaming gel with salicylic acid",
    directions: "Massage onto damp skin for 30 seconds, then rinse well.",
    inci: [
      "Aqua (Water)",
      "Sodium Lauryl Sulfate",
      "Cocamidopropyl Betaine",
      "Glycerin",
      "Salicylic Acid",
      "Zinc PCA",
      "Sodium Chloride",
      "Menthol",
      "Citric Acid",
      "Disodium EDTA",
      "Sodium Benzoate",
      "Potassium Sorbate",
    ],
    colors: { band: "#1f5f8b", ink: "#0f2f45", paper: "#f2f6fa" },
  },
  {
    id: "calm-dew-serum",
    brand: "Reedwater Lab",
    name: "Calm Dew Niacinamide Serum",
    type: "treatment",
    size: "30 mL / 1 fl oz",
    tagline: "Niacinamide serum with centella",
    directions: "Apply 2 to 3 drops after cleansing, before moisturizer.",
    inci: [
      "Aqua (Water)",
      "Niacinamide",
      "Propanediol",
      "Glycerin",
      "Zinc PCA",
      "Alcohol Denat.",
      "Panthenol",
      "Centella Asiatica Extract",
      "Allantoin",
      "Sodium Hyaluronate",
      "Xanthan Gum",
      "Phenoxyethanol",
      "Parfum (Fragrance)",
      "Linalool",
      "Limonene",
    ],
    colors: { band: "#7a4b8c", ink: "#3a2144", paper: "#f8f4fa" },
  },
];
