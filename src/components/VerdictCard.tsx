"use client";

import { TAGS } from "@/data/ingredients";
import { CONCERN_LABEL, whereText } from "@/lib/skin";
import { VERDICT_LABEL } from "@/lib/verdict";
import type { Driver, Product, SkinProfile, Verdict } from "@/lib/types";
import { Capy } from "./Capy";
import { SkinMap } from "./SkinMap";
import { VERDICT_STYLE, VerdictBadge } from "./ui";

const SEVERITY_TEXT: Record<Driver["severity"], string> = {
  major: "Deal-breaker for you",
  moderate: "Go gently",
  minor: "Small amount",
  benefit: "Helps",
};

function DriverRow({ d, profile }: { d: Driver; profile: SkinProfile }) {
  const s = profile.scores[d.concern];
  const tone =
    d.severity === "major" ? "text-skip" : d.severity === "moderate" || d.severity === "minor" ? "text-care" : "text-good";
  return (
    <li className="rounded-2xl border border-line bg-white px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-extrabold">{d.ingredient}</span>
        <span className="text-xs text-muted">number {d.position} on the list</span>
        <span className={`ml-auto text-xs font-bold uppercase tracking-wide ${tone}`}>{SEVERITY_TEXT[d.severity]}</span>
      </div>
      <p className="text-sm mt-1">
        <strong>{TAGS[d.tag].label}.</strong> {TAGS[d.tag].plain}
      </p>
      <p className="text-sm text-muted mt-1">
        Your {CONCERN_LABEL[d.concern].toLowerCase()}: raw {s.rawScore} of 100, {whereText(s)}.
      </p>
    </li>
  );
}

export function VerdictCard({ verdict, profile, product }: { verdict: Verdict; profile: SkinProfile; product: Product }) {
  const style = VERDICT_STYLE[verdict.kind];
  const shownRisks = verdict.risks.filter((r) => r.severity !== "minor").slice(0, 4);
  const minorRisks = verdict.risks.filter((r) => r.severity === "minor");
  // Show helpers with different roles first (one per tag), then fill.
  const byTag: Driver[] = [];
  const rest: Driver[] = [];
  const seenIng = new Set<string>();
  const seenTag = new Set<string>();
  for (const h of verdict.helps) {
    if (seenIng.has(h.ingredient)) continue;
    seenIng.add(h.ingredient);
    if (!seenTag.has(h.tag)) {
      seenTag.add(h.tag);
      byTag.push(h);
    } else rest.push(h);
  }
  const shownHelps = [...byTag, ...rest].slice(0, verdict.kind === "good" ? 4 : 2);
  const mapLayers = verdict.areas
    .map((a) => a.concern)
    .filter((c) => profile.scores[c]?.maskUrl);

  return (
    <article className={`rounded-[28px] border-2 ${style.ring} bg-white shadow-sm overflow-hidden fade-up`} data-testid="verdict-card">
      <div className={`${style.bg} px-5 sm:px-7 py-6 flex flex-wrap items-center gap-5`}>
        <Capy mood={style.mood} size={104} title={`Capy says: ${VERDICT_LABEL[verdict.kind]}`} />
        <div className="flex-1 min-w-64">
          <p className="text-sm font-bold uppercase tracking-widest text-muted">
            {product.brand} {product.name} for {profile.label}
          </p>
          <div className="mt-2">
            <VerdictBadge kind={verdict.kind} label={VERDICT_LABEL[verdict.kind]} size="lg" />
          </div>
          <p className="mt-3 text-lg font-semibold leading-snug" data-testid="verdict-headline">
            {verdict.headline}
          </p>
        </div>
      </div>
      <div className="grid gap-6 px-5 sm:px-7 py-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid gap-5 content-start">
          {shownRisks.length > 0 && (
            <section aria-labelledby="why-risk">
              <h3 id="why-risk" className="font-extrabold text-lg mb-2">
                What drove it
              </h3>
              <ul className="grid gap-2">
                {shownRisks.map((d) => (
                  <DriverRow key={`${d.ingredient}-${d.concern}`} d={d} profile={profile} />
                ))}
              </ul>
            </section>
          )}
          {shownHelps.length > 0 && (
            <section aria-labelledby="why-help">
              <h3 id="why-help" className="font-extrabold text-lg mb-2">
                {verdict.kind === "good" ? "What drove it" : "What still helps"}
              </h3>
              <ul className="grid gap-2">
                {shownHelps.map((d) => (
                  <DriverRow key={`${d.ingredient}-${d.concern}`} d={d} profile={profile} />
                ))}
              </ul>
            </section>
          )}
          {(verdict.notForYou.length > 0 || minorRisks.length > 0 || verdict.unknown.length > 0) && (
            <details className="rounded-2xl border border-line bg-sand/60 px-4 py-3" data-testid="not-for-you">
              <summary className="cursor-pointer font-bold">
                Also checked ({verdict.notForYou.length + minorRisks.length + verdict.unknown.length})
              </summary>
              <ul className="mt-2 grid gap-1 text-sm">
                {verdict.notForYou.map((n) => (
                  <li key={`${n.ingredient}-${n.concern}`}>
                    <strong>{n.ingredient}</strong> is {TAGS[n.tag].label.toLowerCase()}, but your{" "}
                    {CONCERN_LABEL[n.concern].toLowerCase()} reads balanced (raw {n.rawScore}), so it does not count against
                    this product for you.
                  </li>
                ))}
                {minorRisks.map((r) => (
                  <li key={`m-${r.ingredient}-${r.concern}`}>
                    <strong>{r.ingredient}</strong> ({TAGS[r.tag].label.toLowerCase()}) is low on the list or rinsed off, so
                    Capy only notes it.
                  </li>
                ))}
                {verdict.unknown.map((u) => (
                  <li key={`u-${u}`}>
                    <strong>{u}</strong> is not in Capy&apos;s table yet, so it was not judged.
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
        <aside className="grid gap-3 content-start">
          <h3 className="font-extrabold text-lg">Where on your face</h3>
          {mapLayers.length > 0 ? (
            <SkinMap profile={profile} layers={mapLayers} compact />
          ) : null}
          <ul className="grid gap-1 text-sm" data-testid="verdict-areas">
            {verdict.areas.length === 0 && <li className="text-muted">Nothing on this label touches what YouCam flagged.</li>}
            {verdict.areas.map((a) => (
              <li key={a.concern}>
                <strong>{CONCERN_LABEL[a.concern]}:</strong> {a.where}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">From the YouCam detection masks for those concerns.</p>
        </aside>
      </div>
    </article>
  );
}
