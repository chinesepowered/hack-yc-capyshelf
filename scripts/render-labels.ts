/**
 * Renders the three fictional product labels to PNG with headless Chromium, then
 * turns each into a phone-photo style JPEG (tilt, shadow, shelf backdrop, slight blur)
 * so the label reader works on something like a real in-aisle snap.
 *   pnpm tsx scripts/render-labels.ts
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { DEMO_PRODUCTS } from "../src/data/demo-products";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

function labelHtml(p: (typeof DEMO_PRODUCTS)[number]): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 900px; height: 1200px; background: ${p.colors.paper}; color: ${p.colors.ink};
         font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif; }
  .band { background: ${p.colors.band}; color: #fff; padding: 44px 56px 36px; }
  .brand { font-size: 30px; letter-spacing: 8px; text-transform: uppercase; opacity: .92; }
  .name { font-size: 56px; font-weight: 700; line-height: 1.08; margin-top: 18px; }
  .tag { font-size: 26px; margin-top: 14px; opacity: .9; }
  .body { padding: 36px 56px; }
  h2 { font-size: 24px; letter-spacing: 3px; text-transform: uppercase; margin: 26px 0 10px; }
  p { font-size: 25px; line-height: 1.45; }
  .inci { font-size: 25px; line-height: 1.5; text-transform: uppercase; letter-spacing: .4px; }
  .foot { position: absolute; bottom: 36px; left: 56px; right: 56px; display: flex; justify-content: space-between;
          font-size: 20px; border-top: 2px solid ${p.colors.ink}33; padding-top: 16px; }
  </style></head><body>
  <div class="band"><div class="brand">${p.brand}</div><div class="name">${p.name}</div><div class="tag">${p.tagline}</div></div>
  <div class="body">
    <h2>Directions</h2><p>${p.directions}</p>
    <h2>Ingredients</h2><p class="inci">${p.inci.join(", ")}.</p>
    <h2>Caution</h2><p>For external use only. Avoid the eye area. Stop use if irritation occurs.</p>
  </div>
  <div class="foot"><span>${p.size}</span><span>Fictional product for a demo. Not for sale.</span></div>
  </body></html>`;
}

async function main() {
  const outDir = "public/demo/labels";
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  for (const p of DEMO_PRODUCTS) {
    await page.setContent(labelHtml(p));
    const flat = path.join(os.tmpdir(), `${p.id}-flat.png`);
    await page.screenshot({ path: flat });
    const photo = path.join(outDir, `${p.id}.jpg`);
    // Phone-photo look: rotate a little, soft shadow, warm shelf backdrop, tiny blur and noise.
    execFileSync("convert", [
      flat,
      "-bordercolor", "#ffffff", "-border", "6",
      "(", "+clone", "-background", "black", "-shadow", "60x18+14+18", ")",
      "+swap", "-background", "none", "-layers", "merge", "+repage",
      "-background", "none", "-rotate", p.id === "clear-morning-wash" ? "2.2" : p.id === "calm-dew-serum" ? "-1.6" : "-2.8",
      "(", "-size", "1080x1440", "gradient:#d9cbb5-#a8957a", ")",
      "+swap", "-gravity", "center", "-composite",
      "-blur", "0x0.6", "-attenuate", "0.35", "+noise", "Gaussian",
      "-quality", "86", photo,
    ]);
    console.log("wrote", photo);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
