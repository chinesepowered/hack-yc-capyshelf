/**
 * Precompute mask region shares for the recorded demo scans (no API calls).
 *   pnpm tsx scripts/compute-regions.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { alphaBox, decodePng, regionInfo } from "../src/lib/regions";

for (const face of ["a", "b"]) {
  const dir = path.join("public/fixtures", `skin-${face}`);
  const moisture = decodePng(readFileSync(path.join(dir, "moisture.png")));
  const box = alphaBox(moisture);
  if (!box) throw new Error(`no face box for ${face}`);
  const out: Record<string, unknown> = { faceBox: box };
  for (const c of ["acne", "pore", "oiliness", "redness", "texture"]) {
    out[c] = regionInfo(decodePng(readFileSync(path.join(dir, `${c}.png`))), box);
  }
  writeFileSync(path.join("src/fixtures", `regions-${face}.json`), JSON.stringify(out, null, 2));
  console.log(face, JSON.stringify(out));
}
