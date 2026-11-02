/** Prints the verdict matrix for the recorded demo data (no API calls). */
import { DEMO_PROFILES, DEMO_SHELF } from "../src/fixtures";
import { computeVerdict } from "../src/lib/verdict";
import { profileSummary } from "../src/lib/skin";

for (const p of DEMO_PROFILES) {
  console.log(`\n${p.label}: ${profileSummary(p).text} skin type ${p.skinType.whole}`);
  for (const prod of DEMO_SHELF) {
    const v = computeVerdict(p, prod);
    console.log(`  ${prod.name}: ${v.kind.toUpperCase()}  ${v.headline}`);
    console.log(`     risks: ${v.risks.map((r) => `${r.ingredient}#${r.position}/${r.concern}/${r.severity}`).join("; ")}`);
    console.log(`     helps: ${v.helps.slice(0, 5).map((r) => `${r.ingredient}/${r.concern}`).join("; ")}`);
    console.log(`     areas: ${v.areas.map((a) => `${a.concern}: ${a.where}`).join("; ")} | unknown: ${v.unknown.join(", ") || "none"}`);
  }
}
