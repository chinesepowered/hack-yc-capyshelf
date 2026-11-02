/**
 * One-shot capture of a YouCam skin analysis for ONE demo face.
 *
 *   pnpm tsx scripts/capture-skin.ts a        # analyze public/demo/faces/face-a.jpg once
 *
 * It refuses to run when the fixture already exists (pass --force to overwrite),
 * so it can never burn units in a loop. It stores the raw task result, downloads
 * every mask into public/fixtures/<face>/ (mask urls expire), and logs the unit
 * balance before and after.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { analyzeSkin, getUnitBalance, SKIN_ACTIONS } from "../src/lib/youcam";

function loadEnv() {
  const file = path.join(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

async function main() {
  loadEnv();
  const face = process.argv[2];
  const force = process.argv.includes("--force");
  if (!face || !/^[a-z]$/.test(face)) throw new Error("usage: capture-skin.ts <a|b> [--force]");

  const src = path.join("public/demo/faces", `face-${face}.jpg`);
  const outJson = path.join("src/fixtures", `skin-${face}.json`);
  const maskDir = path.join("public/fixtures", `skin-${face}`);
  if (existsSync(outJson) && !force) {
    console.log(`fixture ${outJson} exists; not calling YouCam (use --force to re-run).`);
    return;
  }

  const before = await getUnitBalance();
  console.log(`units before: ${before}`);
  const bytes = new Uint8Array(readFileSync(src));
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const { taskId, data } = await analyzeSkin(bytes, "image/jpeg", `face-${face}.jpg`);
  const elapsedMs = Date.now() - t0;
  const after = await getUnitBalance();
  console.log(`units after: ${after} (used ${before - after}) in ${elapsedMs} ms`);

  // Download masks (urls are pre-signed and expire) and rewrite them to local paths.
  mkdirSync(maskDir, { recursive: true });
  const output = (data.results?.output ?? []) as Array<Record<string, unknown>>;
  for (const item of output) {
    const urls = (item.mask_urls as string[] | undefined) ?? [];
    const local: string[] = [];
    for (let i = 0; i < urls.length; i++) {
      const u = urls[i];
      const ext = path.extname(new URL(u).pathname) || ".png";
      const name = `${String(item.type)}${urls.length > 1 ? `-${i}` : ""}${ext}`;
      const res = await fetch(u);
      if (!res.ok) throw new Error(`mask download failed ${res.status} for ${item.type}`);
      writeFileSync(path.join(maskDir, name), Buffer.from(await res.arrayBuffer()));
      local.push(`/fixtures/skin-${face}/${name}`);
    }
    item.mask_urls = local;
  }

  mkdirSync(path.dirname(outJson), { recursive: true });
  writeFileSync(
    outJson,
    JSON.stringify(
      {
        api: "YouCam AI Skin Analysis (SD)",
        endpoint: "POST /s2s/v2.0/task/skin-analysis",
        dst_actions: SKIN_ACTIONS,
        source_image: `/demo/faces/face-${face}.jpg`,
        task_id: taskId,
        captured_at: startedAt,
        elapsed_ms: elapsedMs,
        units_used: Math.round((before - after) * 100) / 100,
        result: data,
      },
      null,
      2,
    ),
  );
  console.log(`wrote ${outJson} with ${output.length} concerns`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
