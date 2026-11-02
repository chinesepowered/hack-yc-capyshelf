/**
 * Records the LLM explanation for every demo profile x demo product pair, once.
 *   pnpm tsx scripts/capture-explanations.ts           # only missing pairs
 *   pnpm tsx scripts/capture-explanations.ts --force   # re-record all
 * The verdict itself is computed by the deterministic engine; the LLM only phrases its facts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { DEMO_PROFILES, DEMO_SHELF, explanationKey } from "../src/fixtures";
import { explainVerdict } from "../src/lib/llm";
import { computeVerdict, VERDICT_LABEL, verdictFacts } from "../src/lib/verdict";
import { loadEnv } from "./env";

const FILE = "src/fixtures/explanations.json";

async function main() {
  loadEnv();
  const force = process.argv.includes("--force");
  const store = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, unknown>;
  for (const profile of DEMO_PROFILES) {
    for (const product of DEMO_SHELF) {
      const key = explanationKey(profile.id, product.id);
      const verdict = computeVerdict(profile, product);
      const facts = verdictFacts(profile, product, verdict);
      if (store[key] && !force) {
        console.log(`skip ${key}`);
        continue;
      }
      const out = await explainVerdict({
        productName: product.name,
        productType: product.type,
        verdict: verdict.kind,
        verdictLabel: VERDICT_LABEL[verdict.kind],
        facts,
      });
      store[key] = {
        text: out.text.replace(/\s+-\s+/g, ", "),
        model: out.model,
        capturedAt: new Date().toISOString(),
        elapsedMs: out.elapsedMs,
        verdict: verdict.kind,
        facts,
      };
      writeFileSync(FILE, JSON.stringify(store, null, 2));
      console.log(`${key}: ${verdict.kind} (${out.elapsedMs} ms)\n   ${out.text}`);
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
