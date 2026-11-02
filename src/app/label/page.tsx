"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { useShelf } from "@/lib/store";
import { computeVerdict } from "@/lib/verdict";
import { downscaleImage } from "@/lib/image";
import type { Product } from "@/lib/types";
import { IngredientList } from "@/components/IngredientList";
import { ApiStampView, ModeBanner, NextLink, StepHeader } from "@/components/ui";

const TYPE_LABEL: Record<Product["type"], string> = {
  cleanser: "Cleanser (rinse-off)",
  treatment: "Treatment (leave-on)",
  moisturizer: "Moisturizer (leave-on)",
  sunscreen: "Sunscreen",
  other: "Other",
};

export default function LabelPage() {
  const { product, products, profile, set, mode } = useShelf();
  const verdict = computeVerdict(profile, product);

  return (
    <>
      <StepHeader n={2} title="Snap the label">
        A photo of the ingredient list goes to a <strong className="text-ink">vision model</strong> that reads it into
        text. Capy then checks every ingredient against its own table.
      </StepHeader>
      <ModeBanner />

      <section className="mt-6" aria-label="Choose a product">
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Product">
          {products.map((p) => {
            const on = p.id === product.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={on}
                data-testid={`product-${p.id}`}
                onClick={() => set({ productId: p.id })}
                className={`flex items-center gap-3 rounded-2xl border p-2 pr-4 text-left transition-colors ${
                  on ? "border-ink bg-white shadow-sm" : "border-line bg-white/60 hover:bg-white"
                }`}
              >
                {p.labelImage ? (
                  <img src={p.labelImage} alt="" className="w-12 h-16 rounded-xl object-cover" />
                ) : (
                  <span className="grid place-items-center w-12 h-16 rounded-xl bg-sand-2 text-xs font-bold" aria-hidden>
                    You
                  </span>
                )}
                <span>
                  <span className="block text-xs font-bold uppercase tracking-wider text-muted">{p.brand}</span>
                  <span className="block font-extrabold">{p.name}</span>
                </span>
              </button>
            );
          })}
          {mode === "live" && <LiveLabelButton />}
        </div>
      </section>

      <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] items-start">
        <div className="lg:sticky lg:top-24">
          {product.labelImage ? (
            <img
              src={product.labelImage}
              alt={`Photo of the ${product.name} label with its ingredient list`}
              className="w-full rounded-3xl shadow-sm"
              data-testid="label-photo"
            />
          ) : (
            <div className="rounded-3xl bg-sand-2 p-8 text-muted">Your label photo was read live and not stored.</div>
          )}
        </div>
        <div className="grid gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted">{product.brand}</p>
            <h2 className="text-2xl font-extrabold">{product.name}</h2>
            <p className="text-muted">
              {TYPE_LABEL[product.type]}
              {product.size ? ` · ${product.size}` : ""} · {product.ingredients.length} ingredients read,{" "}
              {verdict.matched} found in Capy&apos;s table
            </p>
          </div>
          <ApiStampView stamp={product.api} />
          <div className="rounded-3xl border border-line bg-white/80 p-4">
            <h3 className="font-extrabold">
              Read off the label, colored for <span className="underline decoration-moss decoration-2 underline-offset-4">{profile.label}</span>
            </h3>
            <p className="text-sm text-muted mb-3">
              Hover or focus a chip for what it does. Order matters: ingredients are listed from most to least, down to
              about 1 percent.{" "}
              <Link href="/scan" className="underline underline-offset-4">
                Change skin profile
              </Link>
            </p>
            <IngredientList ingredients={product.ingredients} verdict={verdict} />
          </div>
          <div className="pt-2">
            <NextLink href="/verdict" testId="next-to-verdict">
              See Capy&apos;s verdict
            </NextLink>
          </div>
        </div>
      </section>
    </>
  );
}

function LiveLabelButton() {
  const { addLiveProduct } = useShelf();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const blob = await downscaleImage(file, 1800, 0.9);
      const form = new FormData();
      form.append("image", blob, "label.jpg");
      const res = await fetch("/api/label", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "The label could not be read.");
      addLiveProduct(json.product as Product);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The label could not be read.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-moss/50 bg-white/70 p-3 max-w-sm">
      <label className="flex items-center gap-3 cursor-pointer" data-testid="live-label">
        <span className="grid place-items-center w-12 h-16 rounded-xl bg-good-bg text-good text-2xl font-black" aria-hidden>
          +
        </span>
        <span>
          <span className="block font-extrabold">Snap a real label</span>
          <span className="block text-xs text-muted">Back of the pack, close up, ingredient list in focus.</span>
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
      <p role="status" aria-live="polite" className="mt-2 text-sm">
        {busy && <span className="font-semibold text-moss">Reading the ingredient list (about 10 seconds)...</span>}
        {error && <span className="font-semibold text-skip">{error}</span>}
      </p>
    </div>
  );
}
