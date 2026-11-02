/**
 * Replay data: every YouCam and LLM result the demo uses, recorded once and kept in the repo.
 * Built against these, the app runs end to end with no keys and no units.
 */
import type { Concern, Product, RegionInfo, SkinProfile } from "@/lib/types";
import { profileFromYouCam } from "@/lib/skin";
import { DEMO_PRODUCTS } from "@/data/demo-products";
import skinA from "./skin-a.json";
import skinB from "./skin-b.json";
import regionsA from "./regions-a.json";
import regionsB from "./regions-b.json";
import labelCream from "./label-dew-drink-gel-cream.json";
import labelWash from "./label-clear-morning-wash.json";
import labelSerum from "./label-calm-dew-serum.json";
import explanations from "./explanations.json";

type SkinFixture = typeof skinA;

function demoProfile(id: string, label: string, fx: SkinFixture, regions: Record<string, unknown>): SkinProfile {
  return profileFromYouCam({
    id,
    label,
    photoUrl: fx.source_image,
    source: "replay",
    api: {
      name: "YouCam AI Skin Analysis (SD)",
      endpoint: fx.endpoint,
      taskId: fx.task_id,
      capturedAt: fx.captured_at,
      elapsedMs: fx.elapsed_ms,
      unitsUsed: fx.units_used,
    },
    output: fx.result.results.output as Array<Record<string, unknown>>,
    regions: regions as Partial<Record<Concern, RegionInfo>>,
  });
}

export const DEMO_PROFILES: SkinProfile[] = [
  demoProfile("demo-a", "Shopper A", skinA, regionsA),
  demoProfile("demo-b", "Shopper B", skinB as SkinFixture, regionsB),
];

type LabelFixture = typeof labelCream;

function demoProduct(id: string, fx: LabelFixture): Product {
  const spec = DEMO_PRODUCTS.find((p) => p.id === id)!;
  return {
    id,
    brand: fx.reading.brand || spec.brand,
    name: fx.reading.name || spec.name,
    type: (fx.reading.type as Product["type"]) || spec.type,
    size: fx.reading.size,
    labelImage: fx.label_image,
    ingredients: fx.reading.ingredients,
    source: "replay",
    api: {
      name: "Vision LLM label reader",
      endpoint: "POST /api/label",
      model: fx.model,
      capturedAt: fx.captured_at,
      elapsedMs: fx.elapsed_ms,
    },
  };
}

export const DEMO_SHELF: Product[] = [
  demoProduct("dew-drink-gel-cream", labelCream),
  demoProduct("clear-morning-wash", labelWash),
  demoProduct("calm-dew-serum", labelSerum),
];

export type RecordedExplanation = { text: string; model: string; capturedAt: string; elapsedMs: number };

export const RECORDED_EXPLANATIONS = explanations as Record<string, RecordedExplanation>;

export function explanationKey(profileId: string, productId: string): string {
  return `${profileId}|${productId}`;
}
