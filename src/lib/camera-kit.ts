"use client";

/**
 * YouCam JS Camera Kit (v2.5): guided selfie capture in the browser. It checks face size, head pose and
 * lighting live and captures automatically once the photo is good enough for AI Skin Analysis, so fewer
 * scans fail with error_src_face_too_small or error_lighting_dark. Client-side only; it costs no units.
 * Docs: https://docs.perfectcorp.com/reference/description/ai_skin_analysis.md (JS Camera Kit section)
 */

type Listener = (payload: unknown) => void;
type YMKApi = {
  init: (args: Record<string, unknown>) => void;
  openCameraKit: () => void;
  close: () => void;
  addEventListener: (event: string, cb: Listener) => unknown;
  removeEventListener: (id: unknown) => void;
};

declare global {
  interface Window {
    YMK?: YMKApi;
    YMKAsyncInit?: () => void;
    /** The v2.5 SDK actually calls this lowercase name (the docs show YMKAsyncInit), so we set both. */
    ymkAsyncInit?: () => void;
  }
}

const SDK_URL = "https://plugins-media.makeupar.com/v2.5-camera-kit/sdk.js";
let loading: Promise<YMKApi> | null = null;

export function loadCameraKit(): Promise<YMKApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("No browser"));
  if (window.YMK) return Promise.resolve(window.YMK);
  if (loading) return loading;
  loading = new Promise<YMKApi>((resolve, reject) => {
    const timer = setTimeout(() => {
      loading = null;
      reject(new Error("The YouCam camera guide did not load. You can still upload a photo."));
    }, 25_000);
    let settled = false;
    const ready = () => {
      if (settled || !window.YMK) return;
      settled = true;
      clearTimeout(timer);
      resolve(window.YMK);
    };
    window.YMKAsyncInit = ready;
    window.ymkAsyncInit = ready;
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => {
      // Fallback: poll for the global in case neither init hook fires.
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (window.YMK) {
          clearInterval(poll);
          ready();
        } else if (tries > 100) clearInterval(poll);
      }, 100);
    };
    s.onerror = () => {
      clearTimeout(timer);
      loading = null;
      reject(new Error("The YouCam camera guide could not be reached. You can still upload a photo."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

const CAMERA_ERRORS: Record<string, string> = {
  error_permission_denied: "Camera permission was denied. Allow the camera, or upload a photo instead.",
  error_resolution_unsupported: "This camera's resolution is too low for the skin scan. Upload a photo instead.",
  error_access_failed: "The camera could not be opened. Upload a photo instead.",
};

/**
 * Opens the Camera Kit inside the element with id "YMK-module" (must be in the DOM) and resolves with the
 * captured photo once the kit's quality checks pass.
 */
export async function captureWithCameraKit(
  size: { width: number; height: number },
  onQuality?: (q: { hasFace?: boolean; position?: string; frontal?: string; lighting?: string }) => void,
): Promise<Blob> {
  const YMK = await loadCameraKit();
  return new Promise<Blob>((resolve, reject) => {
    const ids: unknown[] = [];
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      ids.forEach((id) => {
        try {
          YMK.removeEventListener(id);
        } catch {
          /* ignore */
        }
      });
      fn();
    };
    ids.push(
      YMK.addEventListener("faceDetectionCaptured", (payload) => {
        const images = (payload as { images?: Array<{ image: string | Blob }> })?.images ?? [];
        const first = images[0]?.image;
        finish(async () => {
          try {
            const blob = typeof first === "string" ? await (await fetch(first)).blob() : (first as Blob);
            YMK.close();
            if (!blob) throw new Error("The camera guide returned no photo.");
            resolve(blob);
          } catch (e) {
            reject(e instanceof Error ? e : new Error("The camera guide returned no photo."));
          }
        });
      }),
    );
    ids.push(
      YMK.addEventListener("cameraFailed", (code) => {
        finish(() => {
          try {
            YMK.close();
          } catch {
            /* ignore */
          }
          reject(new Error(CAMERA_ERRORS[String(code)] ?? "The camera could not be used. Upload a photo instead."));
        });
      }),
    );
    ids.push(YMK.addEventListener("closed", () => finish(() => reject(new Error("closed")))));
    if (onQuality) ids.push(YMK.addEventListener("faceQualityChanged", (q) => onQuality(q as Record<string, string>)));
    YMK.init({
      faceDetectionMode: "skincare",
      imageFormat: "base64",
      language: "enu",
      width: size.width,
      height: size.height,
      qualityLevel: "relaxed",
    });
    YMK.openCameraKit();
  });
}
