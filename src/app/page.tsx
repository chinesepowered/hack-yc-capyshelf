"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Capy } from "@/components/Capy";
import { VerdictBadge } from "@/components/ui";
import { useShelf } from "@/lib/store";
import { computeVerdict, VERDICT_LABEL } from "@/lib/verdict";

export default function Home() {
  const router = useRouter();
  const { set, profiles, products } = useShelf();
  const [live, setLive] = useState<{ youcam: boolean; llm: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((s) => setLive({ youcam: Boolean(s.youcam), llm: Boolean(s.llm) }))
      .catch(() => setLive({ youcam: false, llm: false }));
  }, []);

  const cream = products.find((p) => p.id === "dew-drink-gel-cream") ?? products[0];
  const demo = profiles.filter((p) => p.source === "replay").slice(0, 2);

  return (
    <>
      <section className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-center pt-10 sm:pt-14">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-moss">For the moment you are holding a product in the aisle</p>
          <h1 className="mt-3 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Is this right for <span className="text-moss">your</span> skin?
          </h1>
          <p className="mt-5 text-xl text-muted max-w-2xl leading-relaxed">
            Scan your face once with <strong className="text-ink">YouCam AI Skin Analysis</strong>. Snap any ingredient label.
            Capy, your calm shopping buddy, crosses the two and tells you <em>Good match</em>, <em>Use with care</em> or{" "}
            <em>Skip for you</em>, and exactly why.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              data-testid="start-replay"
              onClick={() => {
                set({ mode: "replay", profileId: "demo-a", productId: "dew-drink-gel-cream" });
                router.push("/scan");
              }}
              className="rounded-full bg-moss px-6 py-3.5 text-lg font-bold text-white shadow-sm hover:bg-moss-dark min-h-12"
            >
              Start the replay
            </button>
            <button
              type="button"
              data-testid="start-live"
              disabled={!live?.youcam}
              onClick={() => {
                set({ mode: "live" });
                router.push("/scan");
              }}
              className="rounded-full border-2 border-ink px-6 py-3.5 text-lg font-bold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed min-h-12"
            >
              Try it live
            </button>
          </div>
          <p className="mt-3 text-sm text-muted max-w-xl">
            The replay walks through a recorded run (real API results saved in the repo), so it needs no keys.{" "}
            {live && !live.youcam && "Live mode is off on this server because no YouCam key is set."}
            {live?.youcam && "Live mode runs your own selfie and label photos through the real APIs."}
          </p>
        </div>
        <div className="justify-self-center">
          <div className="relative">
            <div className="absolute inset-6 rounded-full bg-sand-2" aria-hidden />
            <Capy size={320} mood="calm" className="relative capy-bob" />
          </div>
        </div>
      </section>

      <section aria-labelledby="aha" className="mt-14 rounded-[32px] bg-white border border-line p-6 sm:p-8 shadow-sm" data-testid="home-aha">
        <h2 id="aha" className="text-2xl sm:text-3xl font-extrabold">
          One moisturizer. Two skins. Two different answers.
        </h2>
        <p className="mt-1 text-muted">
          Same label, same ingredient table. The only thing that changes is what YouCam measured on each face.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] items-center">
          {demo.map((p, i) => {
            const v = computeVerdict(p, cream);
            return (
              <div key={p.id} className={`flex gap-4 items-center ${i === 1 ? "md:order-3" : ""}`}>
                <img src={p.photoUrl} alt={`${p.label}, demo face`} className="w-24 h-32 rounded-2xl object-cover" />
                <div className="grid gap-2">
                  <p className="font-extrabold">{p.label}</p>
                  <div>
                    <VerdictBadge kind={v.kind} label={VERDICT_LABEL[v.kind]} />
                  </div>
                  <p className="text-sm text-muted leading-snug">{v.headline}</p>
                </div>
              </div>
            );
          })}
          <div className="md:order-2 justify-self-center text-center">
            <img src={cream.labelImage} alt={`${cream.name} label`} className="w-28 rounded-xl shadow mx-auto" />
            <p className="mt-2 text-xs font-bold text-muted">{cream.name}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="mt-14">
        <h2 id="how" className="text-2xl sm:text-3xl font-extrabold">
          How it works
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: "Scan once",
              d: "A selfie goes to YouCam AI Skin Analysis: scores and detection masks for breakouts, pores, oiliness, hydration, redness, texture and skin type.",
              href: "/scan",
            },
            {
              t: "Snap the label",
              d: "A vision model reads the ingredient list off the photo, in order, into plain text.",
              href: "/label",
            },
            {
              t: "Get a verdict",
              d: "A fixed ingredient table, with sources, meets your own scores. The model only words the explanation.",
              href: "/verdict",
            },
            {
              t: "Compare",
              d: "Line up two or three products and get a tiny cleanse, treat, moisturize routine from the ones that fit.",
              href: "/compare",
            },
          ].map((s, i) => (
            <li key={s.t} className="rounded-3xl border border-line bg-white/80 p-5">
              <p className="grid place-items-center w-9 h-9 rounded-full bg-ink text-white font-extrabold">{i + 1}</p>
              <h3 className="mt-3 font-extrabold text-lg">
                <Link href={s.href} className="hover:underline underline-offset-4">
                  {s.t}
                </Link>
              </h3>
              <p className="mt-1 text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3" aria-label="Who it is for">
        {[
          ["For anyone who got burned before", "Bought a cream that broke you out or dried you out? Capy checks the label against your own skin first."],
          ["For sensitive and breakout-prone skin", "Fragrance, harsh foaming agents and often pore-clogging oils get flagged only when your scan says they matter."],
          ["For people who cannot read INCI", "Forty Latin names become three plain sentences and a clear answer. No shaming, no 'flaws'."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-3xl bg-sand-2 p-5">
            <h3 className="font-extrabold">{t}</h3>
            <p className="mt-1 text-muted">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
