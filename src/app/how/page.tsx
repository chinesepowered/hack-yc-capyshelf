import Link from "next/link";
import type { Metadata } from "next";
import { TAGS } from "@/data/ingredients";
import { SOURCES, TAG_SOURCES } from "@/data/sources";
import { CONCERN_LABEL } from "@/lib/skin";
import type { Tag } from "@/lib/types";
import { Capy } from "@/components/Capy";

export const metadata: Metadata = { title: "How Capy Shelf works" };

const ENDPOINTS = [
  ["POST", "/s2s/v2.0/file", "Register the selfie upload and get a pre-signed URL (free)."],
  ["PUT", "pre-signed URL", "Upload the image bytes with the headers YouCam returned."],
  ["POST", "/s2s/v2.0/task/skin-analysis", "Start one SD analysis: acne, pore, oiliness, moisture, redness, texture, skin_type (12 units)."],
  ["GET", "/s2s/v2.0/task/skin-analysis/{task_id}", "Poll until success; returns ui_score, raw_score and a detection mask per concern."],
];

export default function HowPage() {
  const tags = Object.keys(TAGS) as Tag[];
  return (
    <div className="max-w-4xl">
      <div className="pt-10 flex items-center gap-4">
        <Capy size={88} mood="calm" />
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How Capy decides</h1>
          <p className="text-muted text-lg">Measured skin in, label in, a plain verdict out. Here is every step.</p>
        </div>
      </div>

      <section className="mt-8 grid gap-3" aria-labelledby="pipeline">
        <h2 id="pipeline" className="text-2xl font-extrabold">
          The pipeline
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          <li className="rounded-2xl bg-white border border-line p-4">
            <strong>1. YouCam AI Skin Analysis</strong> measures the face: a score per concern and a detection mask that
            shows where on the face it was seen.
          </li>
          <li className="rounded-2xl bg-white border border-line p-4">
            <strong>2. Mask geometry</strong> (plain arithmetic): the moisture map gives the face box, then each mask&apos;s
            pixels are split into forehead, nose, cheeks and chin.
          </li>
          <li className="rounded-2xl bg-white border border-line p-4">
            <strong>3. Label reading</strong>: a vision model (Qwen 3.8) copies the ingredient list from the photo, in order.
          </li>
          <li className="rounded-2xl bg-white border border-line p-4">
            <strong>4. Verdict</strong>: Capy&apos;s ingredient table meets your raw scores. The model only writes the
            friendly explanation from the resulting facts.
          </li>
        </ol>
      </section>

      <section className="mt-10" aria-labelledby="endpoints">
        <h2 id="endpoints" className="text-2xl font-extrabold">
          YouCam API calls
        </h2>
        <p className="text-muted">
          Server-side only (the key never reaches the browser). Base URL <code>https://yce-api-01.makeupar.com</code>.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-line">
                <th className="py-2 pr-3">Method</th>
                <th className="py-2 pr-3">Path</th>
                <th className="py-2">What it does</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map(([m, p, d]) => (
                <tr key={p} className="border-b border-line/60 align-top">
                  <td className="py-2 pr-3 font-bold">{m}</td>
                  <td className="py-2 pr-3">
                    <code>{p}</code>
                  </td>
                  <td className="py-2">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">
          Why SD and not HD: SD covers every concern that decides a purchase, accepts any phone or laptop selfie from 480
          pixels (HD needs 1080), and costs 12 units per scan instead of 16. HD would add regional pore scores; that is the
          upgrade path.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="rules">
        <h2 id="rules" className="text-2xl font-extrabold">
          The scoring rules
        </h2>
        <ul className="mt-2 grid gap-2 list-disc pl-5">
          <li>
            Each concern gets a band from YouCam&apos;s raw score (higher is healthier): 70 and up looks balanced, 50 to 69 worth
            watching, under 50 main focus. A matching skin type can raise a band by one step, never lower it.
          </li>
          <li>
            Each ingredient on the label is matched to the table below. Risks only count for concerns that are not balanced
            for you, so the same label gives different answers for different skin.
          </li>
          <li>
            Risk weight = strength (1 or 2) x band (1 or 1.5) x position on the list (first five 1, six to ten 0.45, later
            0.2). Rinse-off cleansers halve pore-clogging and acid risks. Fragrance and essential oils use at least 0.6,
            because a small amount can be enough to react.
          </li>
          <li>
            Any risk of 1.8 or more: <strong>Skip for you</strong>. Any risk of 0.6 or more: <strong>Use with care</strong>.
            Otherwise: <strong>Good match</strong>.
          </li>
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="table">
        <h2 id="table" className="text-2xl font-extrabold">
          The ingredient table and its sources
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-line">
                <th className="py-2 pr-3">Effect</th>
                <th className="py-2 pr-3">Tendency</th>
                <th className="py-2">Sources</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr key={t} className="border-b border-line/60 align-top">
                  <td className="py-2 pr-3 font-bold">{TAGS[t].label}</td>
                  <td className="py-2 pr-3">
                    {TAGS[t].plain}
                    {TAGS[t].effects.length > 0 && (
                      <span className="block text-xs text-muted mt-1">
                        {TAGS[t].effects
                          .map((e) => `${e.kind === "helps" ? "helps" : "risk for"} ${CONCERN_LABEL[e.concern].toLowerCase()} (${e.strength})`)
                          .join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    <ul className="grid gap-1">
                      {(TAG_SOURCES[t] ?? []).map((id) => {
                        const s = SOURCES[id];
                        if (!s) return null;
                        return (
                          <li key={id}>
                            <a href={s.url} className="underline underline-offset-2" target="_blank" rel="noreferrer">
                              {s.publisher}
                              {s.year ? ` ${s.year}` : ""}
                            </a>
                            <span className="block text-xs text-muted">{s.supports}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="limits">
        <h2 id="limits" className="text-2xl font-extrabold">
          Honest limits
        </h2>
        <ul className="mt-2 grid gap-2 list-disc pl-5">
          <li>Not medical advice and not a diagnosis. Ingredient effects are tendencies, not guarantees.</li>
          <li>Labels list ingredients by amount only down to about 1 percent, and never give exact percentages.</li>
          <li>Comedogenicity ratings come from older animal and patch models; real-world effects vary with the full formula.</li>
          <li>A single photo depends on light, camera and makeup. Rescan in similar light before comparing over time.</li>
          <li>
            Patch test anything new (
            <a href={SOURCES["aad-test-products"]?.url} className="underline underline-offset-2" target="_blank" rel="noreferrer">
              how to test a product
            </a>
            ). See a dermatologist if breakouts are painful, leave marks or scars, or do not settle (
            <a href={SOURCES["aad-acne-wont-clear"]?.url} className="underline underline-offset-2" target="_blank" rel="noreferrer">
              when acne needs a dermatologist
            </a>
            ).
          </li>
          <li>Ingredients that are not in the table are listed as not judged, never guessed.</li>
        </ul>
      </section>

      <section id="credits" className="mt-10 mb-6" aria-labelledby="credits-h">
        <h2 id="credits-h" className="text-2xl font-extrabold">
          Credits
        </h2>
        <ul className="mt-2 grid gap-2 list-disc pl-5">
          <li>
            Demo faces: licensed stock photos from Pexels by Tima Miroshnichenko (Shopper A) and Anna Nekrashevich (Shopper B),
            cropped for the skin scan. See <code>docs/CREDITS.md</code>.
          </li>
          <li>All products, brands and labels are fictional and drawn for this demo.</li>
          <li>Capy the capybara is original artwork made for Capy Shelf.</li>
          <li>
            Skin analysis by the YouCam API (Perfect Corp.). Label reading and explanations by Qwen 3.8 on W&amp;B Inference.
          </li>
        </ul>
        <p className="mt-6">
          <Link href="/scan" className="underline underline-offset-4 font-bold">
            Back to the demo
          </Link>
        </p>
      </section>
    </div>
  );
}
