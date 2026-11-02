"use client";

import Link from "next/link";
import type { ApiStamp as Stamp, VerdictKind } from "@/lib/types";
import { useShelf } from "@/lib/store";
import { Capy } from "./Capy";

export function StepHeader({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="pt-8 pb-4">
      <p className="text-sm font-bold uppercase tracking-widest text-moss">Step {n} of 4</p>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">{title}</h1>
      {children && <div className="mt-2 text-muted text-lg max-w-3xl">{children}</div>}
    </div>
  );
}

export function ModeBanner() {
  const { mode, set } = useShelf();
  if (mode === "live") {
    return (
      <div className="rounded-2xl border border-good/30 bg-good-bg px-4 py-3 text-sm flex flex-wrap items-center gap-3" data-testid="mode-banner">
        <span className="font-bold text-good">Live mode.</span>
        <span>New scans and labels call the real APIs from the server. Recorded demo data stays available.</span>
        <button
          type="button"
          onClick={() => set({ mode: "replay" })}
          className="ml-auto rounded-full border border-good/40 px-3 py-1 font-semibold hover:bg-white"
        >
          Back to replay
        </button>
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl border border-water/25 bg-water/5 px-4 py-3 text-sm flex flex-wrap items-center gap-x-3 gap-y-1"
      data-testid="mode-banner"
    >
      <span className="font-bold text-water">Replay of a recorded run.</span>
      <span>
        Every result here came from the real YouCam and Qwen APIs and was saved in the repo, so you can click through with
        no keys.
      </span>
    </div>
  );
}

export function ApiStampView({ stamp, extra }: { stamp: Stamp; extra?: string }) {
  const when = stamp.capturedAt ? new Date(stamp.capturedAt) : null;
  return (
    <div className="rounded-xl border border-line bg-white/70 px-3 py-2 text-xs text-muted flex flex-wrap gap-x-3 gap-y-1" data-testid="api-stamp">
      <span className="font-bold text-ink">{stamp.name}</span>
      <code className="font-mono">{stamp.endpoint}</code>
      {stamp.model && <span>model {stamp.model}</span>}
      {stamp.taskId && <span title={stamp.taskId}>task {stamp.taskId.slice(0, 10)}...</span>}
      {typeof stamp.unitsUsed === "number" && <span>{stamp.unitsUsed} units</span>}
      {typeof stamp.elapsedMs === "number" && <span>{(stamp.elapsedMs / 1000).toFixed(1)} s</span>}
      {when && (
        <span>
          {stamp.taskId || stamp.model ? "recorded " : ""}
          {when.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" })} UTC
        </span>
      )}
      {extra && <span>{extra}</span>}
    </div>
  );
}

export const VERDICT_STYLE: Record<VerdictKind, { bg: string; text: string; ring: string; mood: "happy" | "thinking" | "skip" }> = {
  good: { bg: "bg-good-bg", text: "text-good", ring: "border-good/40", mood: "happy" },
  care: { bg: "bg-care-bg", text: "text-care", ring: "border-care/40", mood: "thinking" },
  skip: { bg: "bg-skip-bg", text: "text-skip", ring: "border-skip/40", mood: "skip" },
};

const VERDICT_ICON: Record<VerdictKind, string> = { good: "✓", care: "!", skip: "×" };

export function VerdictBadge({ kind, label, size = "md" }: { kind: VerdictKind; label: string; size?: "sm" | "md" | "lg" }) {
  const s = VERDICT_STYLE[kind];
  const pad = size === "lg" ? "px-4 py-2 text-xl" : size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border font-extrabold ${s.bg} ${s.text} ${s.ring} ${pad}`} data-testid={`verdict-${kind}`}>
      <span aria-hidden className="font-black">{VERDICT_ICON[kind]}</span>
      {label}
    </span>
  );
}

export function NextLink({ href, children, testId }: { href: string; children: React.ReactNode; testId?: string }) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-3 font-bold text-white shadow-sm hover:bg-moss-dark min-h-11"
    >
      {children}
      <span aria-hidden>{"→"}</span>
    </Link>
  );
}

export function CapySays({ children, mood = "calm", by }: { children: React.ReactNode; mood?: "calm" | "happy" | "thinking" | "skip"; by?: string }) {
  return (
    <figure className="flex gap-3 items-start" data-testid="capy-says">
      <Capy mood={mood} size={64} title="Capy" className="shrink-0" />
      <div className="relative rounded-2xl rounded-tl-sm bg-white border border-line px-4 py-3 shadow-sm">
        <blockquote className="text-base leading-relaxed">{children}</blockquote>
        {by && <figcaption className="mt-2 text-xs text-muted">{by}</figcaption>}
      </div>
    </figure>
  );
}
