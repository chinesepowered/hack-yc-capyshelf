"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useShelf } from "@/lib/store";
import { computeVerdict, VERDICT_LABEL } from "@/lib/verdict";
import { explanationKey, RECORDED_EXPLANATIONS } from "@/fixtures";
import type { Product, SkinProfile } from "@/lib/types";
import { VerdictCard } from "@/components/VerdictCard";
import { CapySays, ModeBanner, NextLink, StepHeader, VERDICT_STYLE, VerdictBadge } from "@/components/ui";

function useExplanation(profile: SkinProfile, product: Product) {
  const { liveExplanations, saveExplanation } = useShelf();
  const key = explanationKey(profile.id, product.id);
  const recorded = RECORDED_EXPLANATIONS[key];
  const live = liveExplanations[key];
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const needsLive = !recorded && !live;

  useEffect(() => {
    if (!needsLive) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");
    fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, product }),
    })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        if (!cancelled) {
          saveExplanation(key, { text: j.text, model: j.model, elapsedMs: j.elapsedMs });
          setStatus("idle");
        }
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, needsLive]);

  if (recorded) return { text: recorded.text, by: `Written by ${recorded.model} from the facts on this card (recorded run).`, status };
  if (live) return { text: live.text, by: `Written live by ${live.model} from the facts on this card.`, status };
  return { text: null, by: "", status };
}

export default function VerdictPage() {
  const { profile, product, profiles, products, set } = useShelf();
  const verdict = computeVerdict(profile, product);
  const explanation = useExplanation(profile, product);

  return (
    <>
      <StepHeader n={3} title="Capy's verdict">
        The decision comes from Capy&apos;s ingredient table and <strong className="text-ink">your measured YouCam scores</strong>.
        The language model only puts it into plain words.
      </StepHeader>
      <ModeBanner />

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm" aria-label="Switch product or profile">
        <span className="font-bold text-muted mr-1">Product:</span>
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.id === product.id}
            data-testid={`verdict-product-${p.id}`}
            onClick={() => set({ productId: p.id })}
            className={`min-h-9 rounded-full border px-3 py-1.5 font-semibold ${
              p.id === product.id ? "bg-ink text-white border-ink" : "bg-white border-line hover:bg-sand-2"
            }`}
          >
            {p.name}
          </button>
        ))}
        <span className="font-bold text-muted ml-3 mr-1">Skin:</span>
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.id === profile.id}
            data-testid={`verdict-profile-${p.id}`}
            onClick={() => set({ profileId: p.id })}
            className={`min-h-9 rounded-full border px-3 py-1.5 font-semibold ${
              p.id === profile.id ? "bg-ink text-white border-ink" : "bg-white border-line hover:bg-sand-2"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6">
        <VerdictCard verdict={verdict} profile={profile} product={product} />

        <CapySays mood={VERDICT_STYLE[verdict.kind].mood} by={explanation.by || "Deterministic summary"}>
          <span data-testid="capy-explanation">
            {explanation.text ??
              (explanation.status === "loading"
                ? "Capy is putting this into plain words..."
                : verdict.headline)}
          </span>
        </CapySays>

        <TwoSkins product={product} profiles={profiles} activeId={profile.id} onPick={(id) => set({ profileId: id })} />

        <section className="rounded-3xl border border-line bg-white/70 p-4 text-sm grid gap-1" aria-label="Before you buy">
          {verdict.kind !== "skip" && (
            <p>
              <strong>Patch test first:</strong> dab a little behind the ear or on the inner arm for a few days before using it
              on your face.
            </p>
          )}
          <p>
            <strong>Tendencies, not guarantees:</strong> the same ingredient can suit one person and not another, and the
            amount matters.
          </p>
          <p>
            <strong>See a dermatologist</strong> if breakouts are painful, leave marks or scars, or do not settle with
            gentle care.
          </p>
        </section>

        <div>
          <NextLink href="/compare" testId="next-to-compare">
            Compare products and build a routine
          </NextLink>
        </div>
      </div>
    </>
  );
}

function TwoSkins({
  product,
  profiles,
  activeId,
  onPick,
}: {
  product: Product;
  profiles: SkinProfile[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <section aria-labelledby="two-skins" className="rounded-[28px] bg-sand-2 p-5 sm:p-6" data-testid="two-skins">
      <h2 id="two-skins" className="text-2xl font-extrabold">
        Same product, different skin
      </h2>
      <p className="text-muted">
        Capy reads the same label for every profile. Only the measured skin changes, and so does the answer.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => {
          const v = computeVerdict(p, product);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onPick(p.id)}
              aria-pressed={p.id === activeId}
              data-testid={`two-skins-${p.id}`}
              className={`text-left rounded-3xl border-2 bg-white p-4 flex gap-4 items-start transition-shadow ${
                p.id === activeId ? `${VERDICT_STYLE[v.kind].ring} shadow-md` : "border-transparent hover:shadow-sm"
              }`}
            >
              <img src={p.photoUrl} alt={`${p.label}`} className="w-20 h-28 rounded-2xl object-cover shrink-0" />
              <span className="grid gap-2">
                <span className="font-extrabold">{p.label}</span>
                <span>
                  <VerdictBadge kind={v.kind} label={VERDICT_LABEL[v.kind]} />
                </span>
                <span className="text-sm text-muted leading-snug">{v.headline}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
