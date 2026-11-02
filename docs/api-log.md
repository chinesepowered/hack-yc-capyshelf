# API log: surprises and walls

A dated log kept while building. Times are UTC.

## 2026-11-01

- YouCam key verified against the File API (HTTP 200). 1,000 units shared by two builds, so this build budgets
  under 350.

## 2026-11-02

- **02:40** ElevenLabs (planned narration) answered `quota_exceeded`: the key had 0 of 10,000 characters left until
  Nov 26. Switched the demo narration to AssemblyAI text to speech (voice `aai-sara`), which worked on the first try
  and reports billed characters in a response header.
- **02:45** Found the unit balance endpoint `GET /s2s/v1.0/client/credit` in the docs. It made it easy to log the exact
  cost of every capture: 1,000 units at the start.
- **02:47** Stock photo sites: Pexels returns 403 to scripted requests and Unsplash sits behind a proof-of-work
  browser check. Photo pages were read with a fetch tool, and the images come from the Pexels image CDN.
- **02:52** First SD skin analysis (Shopper A): 6.0 s from upload to result, **12 units** for 7 SD concerns
  (acne, pore, oiliness, moisture, redness, texture, skin_type), as documented.
  - Surprise: `skin_type` came back **Oily** for the whole face, the T-zone and the U-zone, while `moisture` was the
    lowest score of all (raw 39.7). Oily and dehydrated at once is real, and the UI now says so in plain words
    ("oil and water are different things").
  - Surprise: the JSON output also contains `all`, `skin_age` and `resize_image` items we did not ask for, and
    `skin_type` arrives as three items (`region`: whole, t_zone, u_zone) that share one mask.
  - Masks are full-size RGBA PNGs aligned to the upload. The moisture map covers the entire face, which gave us a
    reliable face box for free. A concern with nothing detected (redness, raw 100) returns a fully transparent mask.
  - `ui_score` is calibrated to read kindly (moisture: raw 39.7 shows as UI 66). Capy decides on `raw_score` and
    shows both.
- **02:53** Second scan (Shopper B): 6.0 s, **12 units**. Total so far: **24 units** (976 left).
- **02:58** Wall: the first face-zone split put most of Shopper B's breakouts on the "chin", but the photo shows them on
  the cheeks and jawline. The chin zone was a full-width band. Narrowed it to the lower center column; result:
  89 percent cheeks, matching the photo.
- **03:00** Qwen 3.8 replies start with blank lines and put reasoning in a separate field that still counts toward
  `max_tokens`; a small `max_tokens` returned empty content. Raised the budget and trim leading whitespace.
- **03:01** Qwen 3.8 read all three label photos (tilted, slightly blurred) with every ingredient in the right order.
  Only casing differed ("Ceramide Np", "Zinc Pca") and one trailing period was dropped ("Alcohol Denat"), so the
  ingredient matcher ignores case and punctuation.
- **03:20** Explainer quality fix: the first explanation for "Shopper B + serum" said the serum suited her
  pores because of the product name, which was not in the facts. Added two rules: never claim a benefit that is not
  in the facts, and when nothing targets the flagged concerns, say so and list what the table does count. The
  re-recorded text is now accurate.
- **03:26** Live path test through the app's own `POST /api/skin` route: HTTP 200 in 7.2 s, **12 units**.
  Surprise (good): the scores were identical to the recorded scan of the same photo, so YouCam is deterministic for a
  given image, which makes recorded replays trustworthy. The unit balance showed the other build had used 20 units
  in the meantime. Capy Shelf total: **36 units**.
- **03:30** Demo video recorded with Playwright (headless, 1440x900) against the production build in Replay mode and
  narrated with AssemblyAI text to speech: 1,720 characters for nine scenes, plus 390 characters to re-voice two lines
  after the evidence review changed "can clog" to "may clog". Final cut 2:10 with silent title and end cards.
- **03:40** Accessibility pass with axe-core (WCAG 2.0, 2.1, 2.2 A and AA rules) on every page and every profile and
  product combination at 1440 px and 390 px: one contrast issue (faded position numbers in ingredient chips), fixed,
  then 0 violations. Ingredient chips became tappable buttons with a detail panel, since hover does not exist on phones.
