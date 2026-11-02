/**
 * Reads each demo label photo ONCE with the vision LLM and stores the result as a fixture.
 *   pnpm tsx scripts/capture-labels.ts            # skips labels that already have a fixture
 *   pnpm tsx scripts/capture-labels.ts --force
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEMO_PRODUCTS } from "../src/data/demo-products";
import { readLabel } from "../src/lib/llm";
import { loadEnv } from "./env";

async function main() {
  loadEnv();
  const force = process.argv.includes("--force");
  mkdirSync("src/fixtures", { recursive: true });
  for (const p of DEMO_PRODUCTS) {
    const out = path.join("src/fixtures", `label-${p.id}.json`);
    if (existsSync(out) && !force) {
      console.log(`skip ${p.id} (fixture exists)`);
      continue;
    }
    const img = path.join("public/demo/labels", `${p.id}.jpg`);
    const { reading, elapsedMs, model } = await readLabel(new Uint8Array(readFileSync(img)), "image/jpeg");
    const printed = p.inci.map((s) => s.toLowerCase());
    const read = reading.ingredients.map((s) => s.toLowerCase());
    const exact = printed.length === read.length && printed.every((s, i) => s === read[i]);
    writeFileSync(
      out,
      JSON.stringify(
        {
          api: "Vision LLM label reader",
          model,
          label_image: `/demo/labels/${p.id}.jpg`,
          captured_at: new Date().toISOString(),
          elapsed_ms: elapsedMs,
          matches_printed_list: exact,
          reading,
        },
        null,
        2,
      ),
    );
    console.log(`${p.id}: ${reading.ingredients.length} ingredients in ${elapsedMs} ms, exact match: ${exact}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
