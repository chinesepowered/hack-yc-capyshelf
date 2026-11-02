/**
 * Live YouCam scans spend shared units, so each server process allows only a few.
 * Set LIVE_SCAN_LIMIT to change it (default 5). Replay mode never calls the API.
 */
const g = globalThis as unknown as { __capyLiveScans?: number };

export function liveScanLimit(): number {
  const n = Number(process.env.LIVE_SCAN_LIMIT ?? 5);
  return Number.isFinite(n) && n >= 0 ? n : 5;
}

export function liveScansUsed(): number {
  return g.__capyLiveScans ?? 0;
}

export function liveScansLeft(): number {
  return Math.max(0, liveScanLimit() - liveScansUsed());
}

/** Reserve one scan before calling the API. Returns false when the cap is reached. */
export function reserveLiveScan(): boolean {
  if (liveScansLeft() <= 0) return false;
  g.__capyLiveScans = liveScansUsed() + 1;
  return true;
}

export function releaseLiveScan(): void {
  g.__capyLiveScans = Math.max(0, liveScansUsed() - 1);
}

/** Simple per-process caps for the LLM routes, so a public demo cannot drain the shared key. */
const counters = globalThis as unknown as { __capyLlmCalls?: Record<string, number> };

export function takeLlmCall(route: "label" | "explain"): boolean {
  const caps = { label: Number(process.env.LIVE_LABEL_LIMIT ?? 100), explain: Number(process.env.LIVE_EXPLAIN_LIMIT ?? 300) };
  counters.__capyLlmCalls ??= {};
  const used = counters.__capyLlmCalls[route] ?? 0;
  if (used >= caps[route]) return false;
  counters.__capyLlmCalls[route] = used + 1;
  return true;
}
