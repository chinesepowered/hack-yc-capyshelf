/**
 * Records the Replay flow (headless Chromium, 1440x900) for the demo video.
 * Each scene lasts as long as its narration clip (demo/.work/durations.json) plus a short pause.
 * Writes demo/.work/raw.webm and demo/.work/timeline.json.
 *   BASE=http://localhost:3200 node scripts/record-demo.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE || "http://localhost:3200";
const WORK = "demo/.work";
const durations = JSON.parse(fs.readFileSync(path.join(WORK, "durations.json"), "utf8"));
const PAD = 900;

function cursorScript() {
  const install = () => {
    if (document.getElementById("__demo_cursor")) return;
    const c = document.createElement("div");
    c.id = "__demo_cursor";
    Object.assign(c.style, {
      position: "fixed", left: "-100px", top: "-100px", width: "26px", height: "26px", borderRadius: "50%",
      background: "rgba(31,95,139,0.28)", border: "3px solid rgba(31,95,139,0.95)", zIndex: "2147483647",
      pointerEvents: "none", transform: "translate(-50%,-50%)", transition: "transform 120ms ease-out",
      boxShadow: "0 0 0 4px rgba(255,255,255,0.6)",
    });
    document.body.appendChild(c);
    document.addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    document.addEventListener("mousedown", () => { c.style.transform = "translate(-50%,-50%) scale(0.65)"; }, true);
    document.addEventListener("mouseup", () => { c.style.transform = "translate(-50%,-50%) scale(1)"; }, true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
}

(async () => {
  const browser = await chromium.launch();

  // Warm the server and image caches so the recording has no loading flashes.
  const warm = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const p of ["/", "/scan", "/label", "/verdict", "/compare"]) {
    await warm.goto(BASE + p, { waitUntil: "networkidle" });
  }
  await warm.close();

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: path.join(WORK, "raw"), size: { width: 1440, height: 900 } },
  });
  await context.addInitScript(cursorScript);
  const page = await context.newPage();
  const created = Date.now();
  let mouse = { x: 720, y: 450 };

  await page.goto(BASE + "/?present=1", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.mouse.move(mouse.x, mouse.y);

  const t0 = Date.now();
  const timeline = { videoOffsetMs: t0 - created, scenes: [] };

  async function moveTo(x, y, steps = 28) {
    await page.mouse.move(x, y, { steps });
    mouse = { x, y };
  }
  async function click(selector) {
    const loc = page.locator(selector).first();
    await loc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const box = await loc.boundingBox();
    await moveTo(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(250);
    await page.mouse.down();
    await page.waitForTimeout(90);
    await page.mouse.up();
  }
  async function hover(selector) {
    const loc = page.locator(selector).first();
    const box = await loc.boundingBox();
    await moveTo(box.x + box.width / 2, box.y + Math.min(box.height / 2, 40));
  }
  async function scrollToEl(selector, offset = 90) {
    const y = await page.locator(selector).first().evaluate((el, off) => el.getBoundingClientRect().top + window.scrollY - off, offset);
    await page.evaluate((top) => window.scrollTo({ top, behavior: "smooth" }), y);
    await page.waitForTimeout(1100);
  }
  async function scrollTop() {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await page.waitForTimeout(900);
  }
  async function scene(id, fn) {
    const start = Date.now() - t0;
    timeline.scenes.push({ id, start });
    const end = Date.now() + durations[id] + PAD;
    await fn();
    const left = end - Date.now();
    if (left > 0) await page.waitForTimeout(left);
  }

  await scene("s1-intro", async () => {
    await page.waitForTimeout(3500);
    await hover('[data-testid="start-replay"]');
  });

  await scene("s2-aha", async () => {
    await scrollToEl('[data-testid="home-aha"]', 140);
    await page.waitForTimeout(1500);
    await hover('[data-testid="home-aha"] img[alt$="label"]');
  });

  await scene("s3-scan-a", async () => {
    await scrollTop();
    await click('[data-testid="start-replay"]');
    await page.waitForURL("**/scan");
    await page.waitForTimeout(6000);
    await hover('[data-testid="score-moisture"]');
    await page.waitForTimeout(4000);
    await click('[data-testid="mask-toggle-skin_type"]');
    await page.waitForTimeout(2500);
    await click('[data-testid="mask-toggle-skin_type"]');
  });

  await scene("s4-scan-b", async () => {
    await click('[data-testid="profile-demo-b"]');
    await page.waitForTimeout(2200);
    await hover('[data-testid="score-acne"]');
  });

  await scene("s5-label", async () => {
    await click('[data-testid="next-to-label"]');
    await page.waitForURL("**/label");
    await page.waitForTimeout(3500);
    await hover('[data-testid="ingredient-list"] li:nth-child(3)');
  });

  await scene("s6-verdict-b", async () => {
    await click('[data-testid="next-to-verdict"]');
    await page.waitForURL("**/verdict");
    await page.waitForTimeout(5200);
    await scrollToEl('[data-testid="verdict-card"]', 90);
    await hover('[data-testid="verdict-headline"]');
  });

  await scene("s7-verdict-a", async () => {
    await scrollTop();
    await click('[data-testid="verdict-profile-demo-a"]');
    await page.waitForTimeout(3200);
    await scrollToEl('[data-testid="two-skins"]', 120);
  });

  await scene("s8-compare", async () => {
    await scrollTop();
    await click('[data-testid="nav-step-4"]');
    await page.waitForURL("**/compare");
    await page.waitForTimeout(3000);
    await scrollToEl('[data-testid="routine"]', 160);
  });

  await scene("s9-close", async () => {
    await click('[data-testid="nav-home"]');
    await page.waitForURL(BASE + "/");
    await scrollTop();
    await page.waitForTimeout(1500);
  });

  timeline.totalMs = Date.now() - t0 + 1200;
  await page.waitForTimeout(1200);
  const video = page.video();
  await context.close();
  const raw = await video.path();
  fs.renameSync(raw, path.join(WORK, "raw.webm"));
  fs.writeFileSync(path.join(WORK, "timeline.json"), JSON.stringify(timeline, null, 2));
  await browser.close();
  console.log(JSON.stringify(timeline));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
