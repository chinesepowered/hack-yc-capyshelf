"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useShelf } from "@/lib/store";
import { computeVerdict, VERDICT_LABEL } from "@/lib/verdict";
import { buildRoutine } from "@/lib/routine";
import { TAGS } from "@/data/ingredients";
import { CONCERN_LABEL, profileSummary } from "@/lib/skin";
import { Capy } from "@/components/Capy";
import { ModeBanner, StepHeader, VERDICT_STYLE, VerdictBadge } from "@/components/ui";

const TYPE_WORD = { cleanser: "Cleanser", treatment: "Treatment", moisturizer: "Moisturizer", sunscreen: "Sunscreen", other: "Other" };

export default function ComparePage() {
  const { profile, profiles, products, compareIds, set } = useShelf();
  const chosen = products.filter((p) => compareIds.includes(p.id)).slice(0, 3);
  const rows = chosen.map((p) => ({ p, v: computeVerdict(profile, p) }));
  const routine = buildRoutine(profile, rows);

  const toggleCompare = (id: string) => {
    const on = compareIds.includes(id);
    if (on) set({ compareIds: compareIds.filter((x) => x !== id) });
    else set({ compareIds: [...compareIds, id].slice(-3) });
  };

  return (
    <>
      <StepHeader n={4} title="Compare and build a tiny routine">
        Up to three products side by side for one skin, then a three-step routine from the ones that matched.
      </StepHeader>
      <ModeBanner />

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-bold text-muted mr-1">Skin:</span>
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.id === profile.id}
            data-testid={`compare-profile-${p.id}`}
            onClick={() => set({ profileId: p.id })}
            className={`min-h-9 rounded-full border px-3 py-1.5 font-semibold ${
              p.id === profile.id ? "bg-ink text-white border-ink" : "bg-white border-line hover:bg-sand-2"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-muted ml-2">{profileSummary(profile).text}</span>
      </div>
      {products.length > 3 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Products to compare">
          <span className="font-bold text-muted mr-1">Compare:</span>
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={compareIds.includes(p.id)}
              onClick={() => toggleCompare(p.id)}
              className={`min-h-9 rounded-full border px-3 py-1.5 font-semibold ${
                compareIds.includes(p.id) ? "bg-ink text-white border-ink" : "bg-white border-line"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Products side by side" data-testid="compare-grid">
        {rows.map(({ p, v }) => {
          const top = v.kind === "good" ? v.helps[0] : v.risks[0];
          return (
            <article key={p.id} className={`rounded-3xl border-2 ${VERDICT_STYLE[v.kind].ring} bg-white overflow-hidden flex flex-col`}>
              <div className="flex gap-3 p-4 items-center">
                {p.labelImage && <img src={p.labelImage} alt="" className="w-14 h-20 rounded-xl object-cover" />}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    {TYPE_WORD[p.type]} · {p.brand}
                  </p>
                  <h2 className="font-extrabold leading-tight">{p.name}</h2>
                </div>
              </div>
              <div className={`${VERDICT_STYLE[v.kind].bg} px-4 py-3`}>
                <VerdictBadge kind={v.kind} label={VERDICT_LABEL[v.kind]} />
              </div>
              <div className="p-4 text-sm grid gap-2 flex-1">
                <p>{v.headline}</p>
                {top && (
                  <p className="text-muted">
                    Key ingredient: <strong className="text-ink">{top.ingredient}</strong> ({TAGS[top.tag].label.toLowerCase()},{" "}
                    {CONCERN_LABEL[top.concern].toLowerCase()})
                  </p>
                )}
                <p className="text-muted">
                  {v.risks.filter((r) => r.severity !== "minor").length} watch-outs · {new Set(v.helps.map((h) => h.ingredient)).size} helpers
                  · {v.unknown.length} not in table
                </p>
              </div>
              <div className="px-4 pb-4">
                <Link
                  href="/verdict"
                  onClick={() => set({ productId: p.id })}
                  className="text-sm font-bold underline underline-offset-4"
                  data-testid={`compare-open-${p.id}`}
                >
                  Open full verdict
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-10" aria-labelledby="routine" data-testid="routine">
        <div className="flex items-center gap-3">
          <Capy mood="happy" size={56} title="Capy" />
          <div>
            <h2 id="routine" className="text-2xl font-extrabold">
              {profile.label}&apos;s tiny routine
            </h2>
            <p className="text-muted">Built only from products that did not get a Skip. Gaps say what to look for instead.</p>
          </div>
        </div>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {routine.map((s, i) => (
            <li key={s.type} className="rounded-3xl border border-line bg-white p-4 grid gap-2 content-start">
              <p className="text-xs font-bold uppercase tracking-widest text-moss">
                Step {i + 1}: {s.label}
              </p>
              {s.pick ? (
                <>
                  <p className="font-extrabold text-lg leading-tight">{s.pick.p.name}</p>
                  <div>
                    <VerdictBadge kind={s.pick.v.kind} label={VERDICT_LABEL[s.pick.v.kind]} size="sm" />
                  </div>
                  {s.pick.v.kind === "care" && (
                    <p className="text-sm text-care font-semibold">Patch test first, then start every other day.</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-extrabold text-lg leading-tight">Keep looking</p>
                  <p className="text-sm">
                    Look for <strong>{s.lookFor}</strong>.
                  </p>
                  {s.skipped.length > 0 && (
                    <p className="text-xs text-muted">
                      {s.skipped.map((r) => r.p.name).join(", ")} got a Skip for this skin.
                    </p>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted">
          Switch the skin above: the same three products build a different routine for each profile.
        </p>
      </section>
    </>
  );
}
