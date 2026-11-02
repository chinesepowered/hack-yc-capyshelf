/**
 * Renders the video title card, end card (1440x900) and demo/thumb.jpg (1280x720)
 * from a running server, reusing the real Capy SVG and recorded verdicts.
 *   BASE=http://localhost:3200 node scripts/render-cards.cjs
 */
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3200";
const WORK = "demo/.work";

const css = `
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Nunito Variable", "Nunito", system-ui, sans-serif; background: #faf6f0; color: #2b1c12; }
  .wrap { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  h1 { font-weight: 800; letter-spacing: -0.02em; }
  .muted { color: #66513f; }
  .badge { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; font-weight: 800; padding: 8px 18px; font-size: 26px; border: 2px solid; }
  .good { background: #e2f2e8; color: #1d6a42; border-color: #1d6a4266; }
  .skip { background: #fbe6e3; color: #a1281f; border-color: #a1281f66; }
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const capy = await page.$eval("svg.capy-bob", (el) => {
    const c = el.cloneNode(true);
    c.removeAttribute("class");
    c.setAttribute("width", "100%");
    c.setAttribute("height", "100%");
    return c.outerHTML;
  });
  const fontCss = await page.evaluate(() =>
    Array.from(document.styleSheets)
      .flatMap((s) => {
        try {
          return Array.from(s.cssRules).map((r) => r.cssText);
        } catch {
          return [];
        }
      })
      .filter((t) => t.startsWith("@font-face"))
      .join("\n"),
  );

  const render = async (html, w, h, out) => {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<!doctype html><html><head><base href="${BASE}/"><style>${fontCss}${css}</style></head><body style="width:${w}px;height:${h}px">${html}</body></html>`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: out });
  };

  fs.mkdirSync(WORK, { recursive: true });
  await render(
    `<div class="wrap" style="gap:64px">
       <div style="width:360px;height:360px">${capy}</div>
       <div>
         <h1 style="font-size:96px">Capy Shelf</h1>
         <p style="font-size:38px;margin-top:12px;font-weight:700">Is this right for <span style="color:#2f6b4f">your</span> skin?</p>
         <p class="muted" style="font-size:26px;margin-top:20px">A calm shopping buddy for the skincare aisle,<br>built on the YouCam AI Skin Analysis API.</p>
       </div>
     </div>`,
    1440, 900, `${WORK}/title.png`,
  );

  await render(
    `<div class="wrap" style="flex-direction:column;gap:22px;text-align:center">
       <div style="width:220px;height:220px">${capy}</div>
       <h1 style="font-size:80px">Capy Shelf</h1>
       <p style="font-size:34px;font-weight:700">Scan once. Snap the label. Get a calm, explained verdict.</p>
       <p class="muted" style="font-size:24px">YouCam AI Skin Analysis (SD): acne, pore, oiliness, moisture, redness, texture, skin type</p>
       <p class="muted" style="font-size:22px">Replay mode included: every result was recorded from the real APIs. Not medical advice; patch test new products.</p>
     </div>`,
    1440, 900, `${WORK}/end.png`,
  );

  await render(
    `<div class="wrap" style="gap:40px;padding:0 56px">
       <div style="flex:1">
         <div style="width:150px;height:150px">${capy}</div>
         <h1 style="font-size:64px;line-height:1.02;margin-top:6px">Same moisturizer.<br>Two skins.<br><span style="color:#2f6b4f">Two answers.</span></h1>
         <p class="muted" style="font-size:26px;margin-top:16px;font-weight:700">Capy Shelf, built on YouCam AI Skin Analysis</p>
       </div>
       <div style="display:grid;gap:22px">
         <div style="display:flex;gap:18px;align-items:center;background:#fff;border-radius:28px;padding:16px 22px 16px 16px;box-shadow:0 2px 10px #0001">
           <img src="demo/faces/face-a.jpg" style="width:150px;height:200px;object-fit:cover;border-radius:20px">
           <div><p style="font-size:28px;font-weight:800;margin-bottom:10px">Shopper A</p><span class="badge good">&#10003; Good match</span></div>
         </div>
         <div style="display:flex;gap:18px;align-items:center;background:#fff;border-radius:28px;padding:16px 22px 16px 16px;box-shadow:0 2px 10px #0001">
           <img src="demo/faces/face-b.jpg" style="width:150px;height:200px;object-fit:cover;border-radius:20px">
           <div><p style="font-size:28px;font-weight:800;margin-bottom:10px">Shopper B</p><span class="badge skip">&#215; Skip for you</span></div>
         </div>
       </div>
     </div>`,
    1280, 720, `${WORK}/thumb.png`,
  );
  await browser.close();
  execFileSync("convert", [`${WORK}/thumb.png`, "-quality", "90", "demo/thumb.jpg"]);
  console.log("wrote title.png, end.png, demo/thumb.jpg");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
