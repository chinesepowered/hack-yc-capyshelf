# Devpost answers (drafts)

## Name

Capy Shelf

## Tagline

Is this right for your skin? Scan once with YouCam, snap any label, and Capy gives a calm, explained verdict in the aisle.

## What it does (features, functionality, consumer and retail value)

Capy Shelf is for the moment people actually wonder about their skin: standing in a store aisle with a product in hand.

- **Scan once.** One selfie, captured with the YouCam JS Camera Kit (live checks for face position, pose and lighting,
  then automatic capture) or uploaded, goes to the YouCam AI Skin Analysis API (SD). Capy keeps the concerns that decide purchases:
  breakouts (`acne`), `pore`, `oiliness`, hydration (`moisture`), `redness`, `texture` and `skin_type` for the whole face,
  T-zone and U-zone. It shows the scores and overlays YouCam's detection masks on the photo, one toggle per concern.
- **Snap the label.** A photo of the ingredient list is read by a vision language model into an ordered INCI list.
  Every ingredient becomes a chip colored for this person's skin: helps, use with care, works against, flagged in
  general but not for you, or not judged.
- **Verdict.** A deterministic ingredient table with cited sources crosses the label with the person's own raw scores
  and returns **Good match**, **Use with care** or **Skip for you**, the exact ingredients that drove it (with their
  position on the list), and where on the face the related concern was seen, computed from the YouCam mask pixels.
  The language model only puts those facts into two or three calm sentences.
- **Same product, different skin.** One panel shows the same product judged for every profile. The same moisturizer is
  a Good match for a shopper whose main focus is hydration and a Skip for a shopper with breakouts on the cheeks,
  because it contains isopropyl myristate, which may clog pores.
- **Compare and routine.** Up to three products side by side, then a cleanse, treat, moisturize routine from the ones
  that did not get a Skip. Gaps say what to look for instead ("a gentle, low-foam cleanser without sodium lauryl
  sulfate").
- **Replay of a recorded run.** Every YouCam and LLM result in the demo was recorded from the real APIs and ships in the
  repo, so judges can click through without keys or units. Live mode runs your own selfie and label photos.
- **Honest by design.** Not medical advice; "may" wording where evidence is thin; unknown ingredients are listed as not
  judged; patch-test and see-a-dermatologist guidance on every verdict.

**Consumer value:** fewer products that break people out or dry them out, and an answer they can understand without
reading INCI. **Retail value:** a shelf-edge or in-app assistant that recommends with reasons instead of hype, which can
build trust and cut returns of products that did not suit someone's skin; the same engine can rank a whole shelf for one
shopper.

## Built with

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, YouCam AI Skin Analysis API and YouCam JS Camera Kit
(Perfect Corp.),
Qwen 3.8 27B (vision and text) on W&B Inference through the OpenAI SDK, pngjs (mask pixel analysis), Playwright
(screenshots and the demo recording), ffmpeg, AssemblyAI text to speech (demo narration), axe-core (accessibility
checks), pnpm.

## A moment the API surprised you (good or frustrating)

Our first scan, of a mature face, came back with `skin_type` **Oily** for the whole face, the T-zone and the U-zone, while
`moisture` was its lowest score of all (raw 39.7 of 100). At first it looked contradictory. It is not: skin can be oily
and dehydrated at the same time, and the API had just measured exactly that. Capy now says it in plain words ("oil and
water are different things"), which is the kind of insight shoppers rarely get. The other good surprise: re-running the
same photo through our live route gave identical scores, so recorded replays are faithful to what the API really returns.
A small frustration: the Camera Kit docs say to define `window.YMKAsyncInit`, but the SDK calls `window.ymkAsyncInit`,
so the kit silently never started until we read the SDK source. Also, the moisture result's `ui_score` (66) reads much kinder than its `raw_score` (39.7), so we decide on
raw scores and show both, and the JSON output includes extra items (`all`, `skin_age`, `resize_image`) that a parser has
to skip.

## Industries or use cases the API could serve that nobody is talking about

1. **Formulation pre-checks for cosmetic chemists.** Run a draft INCI list against a panel of anonymized YouCam skin
   profiles before launch and see which skin types it would likely suit or bother, ingredient by ingredient. It turns
   skin analysis into a product-development tool, not only a selling tool.
2. **Returns reduction in beauty e-commerce and pharmacies.** A product that does not suit someone's skin becomes a
   return or a wasted purchase. A pre-purchase check that explains a mismatch before checkout helps the shopper and the
   retailer at the same time.
3. **Gentle-care guidance where skin is temporarily fragile.** Places like pharmacies and clinics that advise people
   whose skin is sensitive for a while, for example during some medical treatments, could use skin scores plus an
   ingredient check to steer them away from fragrance and harsh foaming agents, always alongside professional care.
4. **Shelf curation.** Retailers could rank an entire aisle for a scanned shopper and show the three best matches with
   reasons, turning skin analysis into store navigation.

## Where you hit a wall technically, and how you worked around it

- **Where on the face, without landmarks.** We wanted the verdict to name the area ("breakouts mostly on your cheeks"),
  but the API returns masks, not facial landmarks. We noticed the moisture map covers the whole facial skin, so its
  bounding box became our face box, and we split every other mask's alpha into forehead, nose, cheeks and chin. The first
  split called jawline breakouts "chin"; we narrowed the chin zone to the lower center column, and the result (89 percent
  cheeks) matched the photo.
- **Keeping the AI honest.** The explanation model once claimed a niacinamide serum suited a shopper's pores because of
  the product name, although our table did not say that. We moved every decision into deterministic code, gave the model
  only a list of facts, added rules against new claims, and gave it explicit facts for the "nothing here targets your
  concerns" case. The re-recorded text is now accurate.
- **A shared unit budget.** 1,000 units were shared by two projects. We recorded each demo scan exactly once (capture
  scripts refuse to re-run), log the unit balance before and after, cap live scans per server, and built the whole UI
  against recorded fixtures with a visible Replay mode. Total spent: 48 units.
- **Narration.** The planned text-to-speech key turned out to be out of quota, so the video narration was generated with
  a different text-to-speech service; every clip is cached so re-rendering costs nothing.
