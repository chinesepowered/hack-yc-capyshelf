/**
 * Server-side LLM helpers (OpenAI-compatible endpoint, Qwen 3.8 on W&B Inference).
 * The LLM has two narrow jobs:
 *   1. read the ingredient list off a label photo (vision)
 *   2. write a short plain-language explanation of a verdict that was ALREADY decided
 *      by the deterministic table (src/lib/verdict.ts). It never decides anything.
 */
import OpenAI from "openai";
import type { ProductType } from "./types";

export function llmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_BASE_URL);
}

export function llmModel(): string {
  return process.env.OPENAI_MODEL || "Qwen/Qwen3.8-27B";
}

function client(): OpenAI {
  if (!llmConfigured()) throw new Error("The label reader is not configured on this server.");
  return new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 4,
    timeout: 60_000,
  });
}

/** Qwen puts its reasoning in a separate field; content may start with blank lines or a think block. */
export function cleanReply(text: string | null | undefined): string {
  return (text ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trimStart().trim();
}

function extractJson(text: string): unknown {
  const cleaned = cleanReply(text).replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The label reader did not return JSON.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export type LabelReading = {
  brand: string;
  name: string;
  type: ProductType;
  size: string;
  ingredients: string[];
  readable: boolean;
  note: string;
};

const LABEL_PROMPT = `You are reading a photo of a skincare product label taken in a store aisle.
Return JSON only, no prose, with exactly these keys:
{"brand": string, "name": string, "type": "cleanser" | "treatment" | "moisturizer" | "sunscreen" | "other",
 "size": string, "ingredients": string[], "readable": boolean, "note": string}
Rules:
- "ingredients": every item of the INGREDIENTS (INCI) list, in the printed order, one item per array entry,
  copied as printed but in normal Title Case (for example "Sodium Lauryl Sulfate", "Aqua (Water)").
- Do not add, guess, merge or reorder ingredients. If part of the list is unreadable, include what you can read
  and say which part was unreadable in "note".
- "type": cleanser for washes and cleansers, treatment for serums, toners and spot treatments,
  moisturizer for creams, gels and lotions, sunscreen for SPF products.
- If there is no ingredient list in the photo, return "readable": false and an empty array.`;

export async function readLabel(
  bytes: Uint8Array,
  mime: string,
): Promise<{ reading: LabelReading; elapsedMs: number; model: string }> {
  const model = llmModel();
  const dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
  const t0 = Date.now();
  const res = await client().chat.completions.create({
    model,
    temperature: 0,
    max_tokens: 6000,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: LABEL_PROMPT },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });
  const elapsedMs = Date.now() - t0;
  const raw = extractJson(res.choices[0]?.message?.content ?? "") as Partial<LabelReading>;
  const types: ProductType[] = ["cleanser", "treatment", "moisturizer", "sunscreen", "other"];
  const reading: LabelReading = {
    brand: String(raw.brand ?? "").trim(),
    name: String(raw.name ?? "").trim(),
    type: types.includes(raw.type as ProductType) ? (raw.type as ProductType) : "other",
    size: String(raw.size ?? "").trim(),
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map((s) => String(s).trim().replace(/\.$/, "")).filter(Boolean)
      : [],
    readable: raw.readable !== false,
    note: String(raw.note ?? "").trim(),
  };
  return { reading, elapsedMs, model };
}

export type ExplainInput = {
  productName: string;
  productType: string;
  verdict: "good" | "care" | "skip";
  verdictLabel: string;
  facts: string[];
};

const EXPLAIN_RULES = `You are Capy, a calm capybara shopping buddy. Write 2 or 3 short sentences (under 70 words total)
explaining a skincare verdict that has ALREADY been decided. Use only the facts given. Plain words, warm and unbothered.
Never shame, never say "flaws" or "problem skin", never promise results, never diagnose, never give medical advice.
Mention the specific ingredients and the skin area named in the facts. Do not use dashes of any kind as punctuation.
Do not change or question the verdict. Reply with the sentences only.`;

export async function explainVerdict(
  input: ExplainInput,
): Promise<{ text: string; elapsedMs: number; model: string }> {
  const model = llmModel();
  const t0 = Date.now();
  const res = await client().chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      { role: "system", content: EXPLAIN_RULES },
      {
        role: "user",
        content: `Product: ${input.productName} (${input.productType})\nVerdict: ${input.verdictLabel}\nFacts:\n${input.facts
          .map((f) => `- ${f}`)
          .join("\n")}`,
      },
    ],
  });
  const text = cleanReply(res.choices[0]?.message?.content)
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) throw new Error("The explainer returned no text.");
  return { text, elapsedMs: Date.now() - t0, model };
}
