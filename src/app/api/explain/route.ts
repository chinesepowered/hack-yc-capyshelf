/**
 * Plain-language explanation of a verdict. The server recomputes the deterministic verdict
 * from the profile and the ingredient list, then asks the LLM only to phrase those facts.
 */
import { explainVerdict, llmConfigured } from "@/lib/llm";
import { computeVerdict, VERDICT_LABEL, verdictFacts } from "@/lib/verdict";
import type { Product, SkinProfile } from "@/lib/types";
import { takeLlmCall } from "@/lib/live-limit";

export const runtime = "nodejs";
export const maxDuration = 90;

const cache = new Map<string, { text: string; model: string; elapsedMs: number }>();

export async function POST(req: Request) {
  if (!llmConfigured()) return Response.json({ error: "The explainer is not configured on this server." }, { status: 503 });
  let body: { profile?: SkinProfile; product?: Product };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }
  const { profile, product } = body;
  if (!profile?.scores || !Array.isArray(product?.ingredients)) {
    return Response.json({ error: "Missing profile or product." }, { status: 400 });
  }
  const verdict = computeVerdict(profile, product);
  const facts = verdictFacts(profile, product, verdict);
  const key = JSON.stringify([product.name, verdict.kind, facts]);
  const hit = cache.get(key);
  if (hit) return Response.json({ ...hit, cached: true });
  if (!takeLlmCall("explain")) return Response.json({ error: "The explainer is resting for now." }, { status: 429 });
  try {
    const out = await explainVerdict({
      productName: product.name,
      productType: product.type,
      verdict: verdict.kind,
      verdictLabel: VERDICT_LABEL[verdict.kind],
      facts,
    });
    cache.set(key, out);
    return Response.json(out);
  } catch {
    return Response.json({ error: "The explainer did not answer." }, { status: 502 });
  }
}
