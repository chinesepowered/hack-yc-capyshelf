/**
 * Captures the judge screenshots (1440x900 viewport PNGs) from a running server.
 *   BASE=http://localhost:3200 node scripts/screenshots.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3200";
const OUT = "docs/screenshots";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const go = async (p) => {
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
  };
  const scrollTo = async (sel, off = 90) => {
    await page.locator(sel).first().evaluate((el, o) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - o), off);
    await page.waitForTimeout(500);
  };
  const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

  await go("/?present=1");
  await shot("01-home");
  await scrollTo('[data-testid="home-aha"]', 120);
  await shot("02-same-product-two-skins");

  await go("/");
  await page.click('[data-testid="start-replay"]');
  await page.waitForURL("**/scan");
  await page.waitForTimeout(900);
  await shot("03-scan-youcam-masks");

  await page.click('[data-testid="profile-demo-b"]');
  await page.waitForTimeout(600);
  await go("/label");
  await shot("04-label-read");

  await go("/verdict");
  await shot("05-verdict-skip");
  await page.click('[data-testid="verdict-profile-demo-a"]');
  await page.waitForTimeout(600);
  await shot("06-verdict-good");

  await go("/compare");
  await scrollTo('[data-testid="compare-grid"]', 230);
  await shot("07-compare-routine");

  await go("/how");
  await shot("08-how-it-works");
  await browser.close();
  console.log(fs.readdirSync(OUT).join("\n"));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
