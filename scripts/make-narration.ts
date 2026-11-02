/**
 * Narration for the demo video with AssemblyAI text to speech (voice from demo/narration.json).
 * Each scene is synthesized once and cached in demo/.work/narration/<id>.wav, so re-running costs nothing.
 *   pnpm tsx scripts/make-narration.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "./env";

type Narration = { voice: string; scenes: Array<{ id: string; text: string }> };

function wavDurationMs(buf: Buffer): number {
  // PCM WAV: find the "data" chunk and the byte rate in "fmt ".
  const byteRate = buf.readUInt32LE(28);
  let off = 12;
  while (off < buf.length - 8) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "data") return Math.round(((Math.min(size, buf.length - off - 8)) / byteRate) * 1000);
    off += 8 + size;
  }
  return 0;
}

async function main() {
  loadEnv();
  const key = process.env.ASSEMBLYAI_API_KEY;
  const spec = JSON.parse(readFileSync("demo/narration.json", "utf8")) as Narration;
  const dir = "demo/.work/narration";
  mkdirSync(dir, { recursive: true });
  const durations: Record<string, number> = {};
  let billed = 0;
  for (const s of spec.scenes) {
    const file = path.join(dir, `${s.id}.wav`);
    if (!existsSync(file)) {
      if (!key) throw new Error("ASSEMBLYAI_API_KEY is not set");
      const res = await fetch("https://tts.us.assemblyai.com/v1/speech", {
        method: "POST",
        headers: { Authorization: key, "Content-Type": "application/json" },
        body: JSON.stringify({ text: s.text, voice_id: spec.voice, container: "wav", stream: false }),
      });
      if (!res.ok) throw new Error(`TTS failed for ${s.id}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      billed += Number(res.headers.get("x-tts-billed-characters") ?? 0);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      console.log(`synthesized ${s.id}`);
    }
    durations[s.id] = wavDurationMs(readFileSync(file));
  }
  writeFileSync("demo/.work/durations.json", JSON.stringify(durations, null, 2));
  const total = Object.values(durations).reduce((a, b) => a + b, 0);
  console.log(JSON.stringify(durations));
  console.log(`total narration ${(total / 1000).toFixed(1)} s; characters billed this run: ${billed}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
