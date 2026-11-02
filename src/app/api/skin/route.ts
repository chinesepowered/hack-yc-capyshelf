/**
 * Live skin scan: selfie -> YouCam AI Skin Analysis (SD) -> normalized profile with
 * mask-region facts. One request creates exactly one paid YouCam task.
 */
import { analyzeSkin, explainYouCamError, YouCamError } from "@/lib/youcam";
import { alphaBox, decodePng, regionInfo } from "@/lib/regions";
import { profileFromYouCam } from "@/lib/skin";
import { releaseLiveScan, reserveLiveScan, liveScansLeft } from "@/lib/live-limit";
import type { Concern, RegionInfo } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 10 * 1024 * 1024;

async function fetchPng(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mask download failed (${res.status})`);
  return decodePng(Buffer.from(await res.arrayBuffer()));
}

export async function POST(req: Request) {
  if (!process.env.YOUCAM_API_KEY) {
    return Response.json(
      { error: "Live scans need YOUCAM_API_KEY on the server. The replay works without it." },
      { status: 503 },
    );
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Send the selfie as form data in a field named image." }, { status: 400 });
  }
  const file = form.get("image");
  if (!(file instanceof File)) return Response.json({ error: "No image was attached." }, { status: 400 });
  const type = file.type === "image/png" ? "image/png" : file.type === "image/jpeg" ? "image/jpeg" : null;
  if (!type) return Response.json({ error: "Use a JPEG or PNG photo." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "That photo is over 10 MB." }, { status: 400 });

  if (!reserveLiveScan()) {
    return Response.json(
      { error: "This server has used its live scans for now (YouCam units are shared). Try the replay." },
      { status: 429 },
    );
  }

  const t0 = Date.now();
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { taskId, data } = await analyzeSkin(bytes, type, type === "image/png" ? "selfie.png" : "selfie.jpg");
    const output = (data.results?.output ?? []) as Array<Record<string, unknown>>;
    const maskOf = (t: string) => ((output.find((o) => o.type === t)?.mask_urls as string[] | undefined) ?? [])[0];

    // Region facts from the masks (pure arithmetic on the PNG alpha channel).
    const regions: Partial<Record<Concern, RegionInfo>> = {};
    try {
      const moistureUrl = maskOf("moisture");
      const box = moistureUrl ? alphaBox(await fetchPng(moistureUrl)) : null;
      if (box) {
        await Promise.all(
          (["acne", "pore", "oiliness", "redness", "texture"] as Concern[]).map(async (c) => {
            const u = maskOf(c);
            if (u) regions[c] = regionInfo(await fetchPng(u), box);
          }),
        );
      }
    } catch {
      /* region facts are a bonus; the scores still stand without them */
    }

    const photo = maskOf("resize_image");
    const profile = profileFromYouCam({
      id: `live-${Date.now()}`,
      label: "You",
      photoUrl: photo ?? "",
      source: "live",
      api: {
        name: "YouCam AI Skin Analysis (SD)",
        endpoint: "POST /s2s/v2.0/task/skin-analysis",
        taskId,
        capturedAt: new Date().toISOString(),
        elapsedMs: Date.now() - t0,
        unitsUsed: 12,
      },
      output,
      regions,
    });
    return Response.json({ profile, liveScansLeft: liveScansLeft() });
  } catch (e) {
    // A task that ends in error is not charged, so give the scan back.
    releaseLiveScan();
    const message =
      e instanceof YouCamError ? (e.code ? explainYouCamError(e.code) : e.message) : "The scan did not finish. Please try again.";
    return Response.json({ error: message }, { status: 502 });
  }
}
