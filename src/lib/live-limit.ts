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
