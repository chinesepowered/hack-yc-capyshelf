/**
 * Turns YouCam detection masks into "which part of the face" facts.
 *
 * YouCam returns one RGBA PNG per concern, the same size as the photo, where
 * alpha marks detected pixels. The moisture map covers the whole facial skin, so
 * its bounding box is our face box. Each concern's alpha is then split into four
 * zones measured relative to that box. Pure arithmetic, no AI.
 */
import { PNG } from "pngjs";
import type { Region, RegionInfo } from "./types";

type Png = { width: number; height: number; data: Buffer };
export type Box = { x0: number; y0: number; x1: number; y1: number };

export function decodePng(buf: Buffer): Png {
  return PNG.sync.read(buf) as Png;
}

function percentile(sorted: Int32Array, p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))));
  return sorted[i];
}

/** Robust bounding box of pixels with alpha above a threshold (2nd to 98th percentile). */
export function alphaBox(png: Png, minAlpha = 25): Box | null {
  const xs: number[] = [];
  const ys: number[] = [];
  const { width, height, data } = png;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (data[(y * width + x) * 4 + 3] > minAlpha) {
        xs.push(x);
        ys.push(y);
      }
    }
  }
  if (xs.length < 200) return null;
  const sx = Int32Array.from(xs).sort();
  const sy = Int32Array.from(ys).sort();
  return {
    x0: percentile(sx, 0.02),
    x1: percentile(sx, 0.98),
    y0: percentile(sy, 0.02),
    y1: percentile(sy, 0.98),
  };
}

/**
 * Zones in face-box coordinates (u across, v down, both 0 to 1):
 * forehead above the brows, nose in the center column, chin in the lower center,
 * cheeks (including the jawline sides) everywhere else.
 */
export function classify(u: number, v: number): Region {
  if (v < 0.27) return "forehead";
  if (v < 0.72 && u >= 0.36 && u < 0.64) return "nose";
  if (v >= 0.72 && u >= 0.3 && u < 0.7) return "chin";
  return "cheeks";
}

/** Alpha-weighted share of a mask that falls in each zone of the face box. */
export function regionInfo(png: Png, box: Box): RegionInfo {
  const acc: Record<Region, number> = { forehead: 0, nose: 0, cheeks: 0, chin: 0 };
  const { width, height, data } = png;
  const bw = Math.max(1, box.x1 - box.x0);
  const bh = Math.max(1, box.y1 - box.y0);
  let total = 0;
  let covered = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a <= 12) continue;
      const u = (x - box.x0) / bw;
      const v = (y - box.y0) / bh;
      if (u < -0.08 || u > 1.08 || v < -0.08 || v > 1.08) continue;
      const w = a / 255;
      acc[classify(Math.min(0.999, Math.max(0, u)), Math.min(0.999, Math.max(0, v)))] += w;
      total += w;
      if (a > 25) covered++;
    }
  }
  const coverage = covered / (bw * bh);
  if (total < 1) return { detected: false, coverage: 0, shares: {} };
  const shares: Partial<Record<Region, number>> = {};
  for (const r of Object.keys(acc) as Region[]) {
    shares[r] = Math.round((acc[r] / total) * 1000) / 1000;
  }
  return { detected: true, coverage: Math.round(coverage * 10000) / 10000, shares };
}
