/**
 * Server-side client for the YouCam AI Skin Analysis API (Perfect Corp).
 *
 * Every AI call is async and follows four steps:
 *   1. POST /s2s/v2.0/file            register the upload, get a pre-signed PUT url (free)
 *   2. PUT  <pre-signed url>          upload the image bytes with the returned headers
 *   3. POST /s2s/v2.0/task/skin-analysis   start the task, get a task_id
 *   4. GET  /s2s/v2.0/task/skin-analysis/<task_id>   poll until success or error
 * Units are charged only when a task succeeds.
 *
 * This module never logs the API key and never retries task creation:
 * one call to analyzeSkin() creates exactly one paid task.
 */

export const YOUCAM_BASE = "https://yce-api-01.makeupar.com";

/**
 * SD concerns we request. SD and HD can't be mixed in one call.
 * Seven SD concerns fall in the 5 to 8 tier: 12 units per scan (HD would be 16).
 */
export const SKIN_ACTIONS = [
  "acne",
  "pore",
  "oiliness",
  "moisture",
  "redness",
  "texture",
  "skin_type",
] as const;

export const SKIN_UNITS_PER_SCAN = 12;

export class YouCamError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "YouCamError";
  }
}

function apiKey(): string {
  const key = process.env.YOUCAM_API_KEY;
  if (!key) throw new YouCamError("YOUCAM_API_KEY is not set on the server", "missing_key", 500);
  return key;
}

async function youcamFetch(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const res = await fetch(`${YOUCAM_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new YouCamError(`YouCam returned non-JSON (HTTP ${res.status})`, "bad_response", res.status);
  }
  if (!res.ok || (typeof json.status === "number" && json.status !== 200)) {
    const msg = (json.error as string) || `HTTP ${res.status}`;
    throw new YouCamError(`YouCam: ${msg}`, (json.error_code as string) || undefined, res.status);
  }
  return json;
}

/** Remaining units, for logging usage before and after a capture. */
export async function getUnitBalance(): Promise<number> {
  const json = await youcamFetch("/s2s/v1.0/client/credit");
  const results = (json.results as Array<{ amount_dec?: number; amount?: number }>) ?? [];
  return results.reduce((sum, r) => sum + (r.amount_dec ?? r.amount ?? 0), 0);
}

/** Steps 1 and 2: register the file and PUT the bytes. Returns the file_id. */
export async function uploadImage(
  bytes: Uint8Array,
  contentType: "image/jpeg" | "image/png",
  fileName: string,
): Promise<string> {
  const ct = contentType === "image/jpeg" ? "image/jpg" : "image/png";
  const json = await youcamFetch("/s2s/v2.0/file", {
    method: "POST",
    body: JSON.stringify({
      files: [{ content_type: ct, file_name: fileName, file_size: bytes.byteLength }],
    }),
  });
  const data = json.data as {
    files: Array<{
      file_id: string;
      requests: Array<{ method: string; url: string; headers: Record<string, string> }>;
    }>;
  };
  const file = data?.files?.[0];
  const req = file?.requests?.[0];
  if (!file?.file_id || !req?.url) throw new YouCamError("File API returned no upload url", "bad_response");

  const put = await fetch(req.url, {
    method: req.method || "PUT",
    headers: req.headers,
    body: Buffer.from(bytes),
  });
  if (!put.ok) throw new YouCamError(`Upload PUT failed (HTTP ${put.status})`, "upload_failed", put.status);
  return file.file_id;
}

/** Step 3: start one skin analysis task. This is the only paid step. */
export async function createSkinTask(fileId: string): Promise<string> {
  const json = await youcamFetch("/s2s/v2.0/task/skin-analysis", {
    method: "POST",
    body: JSON.stringify({
      src_file_id: fileId,
      dst_actions: SKIN_ACTIONS,
      format: "json",
    }),
  });
  const taskId = (json.data as { task_id?: string })?.task_id;
  if (!taskId) throw new YouCamError("Task API returned no task_id", "bad_response");
  return taskId;
}

export type RawSkinTask = {
  task_status: string;
  results?: { output?: Array<Record<string, unknown>> } & Record<string, unknown>;
  error?: string;
  error_message?: string;
} & Record<string, unknown>;

/** Step 4: poll (free) until the task finishes. */
export async function pollSkinTask(
  taskId: string,
  { intervalMs = 2500, timeoutMs = 120_000 } = {},
): Promise<RawSkinTask> {
  const started = Date.now();
  for (;;) {
    const json = await youcamFetch(`/s2s/v2.0/task/skin-analysis/${encodeURIComponent(taskId)}`, {
      method: "GET",
    });
    const data = json.data as RawSkinTask;
    if (data?.task_status === "success") return data;
    if (data?.task_status === "error") {
      const code = (data.error as string) || "task_error";
      throw new YouCamError(explainYouCamError(code), code);
    }
    if (Date.now() - started > timeoutMs) throw new YouCamError("Skin analysis timed out", "timeout");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/** Plain-language messages for the documented photo errors. */
export function explainYouCamError(code: string): string {
  const map: Record<string, string> = {
    error_below_min_image_size: "The photo is too small. Use a selfie at least 480 pixels on the short side.",
    error_exceed_max_image_size: "The photo is too large. Try a smaller image.",
    error_src_face_too_small: "Your face is too small in the frame. Move closer so your face fills most of the width.",
    error_src_face_out_of_bound: "Part of your face is out of the frame. Center your face and try again.",
    error_lighting_dark: "The photo is too dark. Face a window or a bright light and try again.",
  };
  return map[code] ?? `Skin analysis could not finish (${code}).`;
}

/** Full flow for one image: upload, one paid task, poll. */
export async function analyzeSkin(
  bytes: Uint8Array,
  contentType: "image/jpeg" | "image/png",
  fileName = "selfie.jpg",
): Promise<{ taskId: string; data: RawSkinTask }> {
  const fileId = await uploadImage(bytes, contentType, fileName);
  const taskId = await createSkinTask(fileId);
  const data = await pollSkinTask(taskId);
  return { taskId, data };
}
