# Capy Shelf (working name)

**YouCam API Skin AI & eCommerce VTO Hackathon, topic: Skin AI.** Built in Claude Code web from this repo. Read
`YOUCAM_NOTES.md` (verified API facts) before the first call.

## The idea

The brief says people wonder about their skin "right before a purchase". Capy Shelf is for that moment, standing in a
store aisle with a product in hand:

1. **Scan once.** A selfie goes to YouCam **AI Skin Analysis**. Show the scores and the detection mask overlay for the
   concerns that decide purchases: acne, moisture, oiliness, redness, pores, skin type (check the docs for exact
   `dst_actions` names; SD and HD can't be mixed in one call; choose one set and say why in the README).
2. **Snap the label.** A photo of a product's ingredient list (INCI). A vision LLM reads the ingredient list into text.
3. **Verdict.** A deterministic ingredient table (in the repo, with sources) maps ingredients to effects (for example:
   drying surfactants, fragrance and essential oils as irritants, commonly comedogenic oils, niacinamide, salicylic acid,
   ceramides, glycerin) and crosses them with **this person's measured scores**. The card says **Good match / Use with
   care / Skip for you**, which ingredients drove it, and which skin area (from the mask) it concerns. The LLM only writes
   the plain-language explanation; the decision comes from the table and the scores.
4. **Compare.** Two or three products side by side, then a tiny routine (cleanser, treatment, moisturizer) from the ones
   that matched.

The aha within 30 seconds of the video: the same moisturizer gets "Good match" for one skin profile and "Skip for you"
for another, and the app shows exactly why, using the person's own skin scores.

**Mascot:** Capy, a calm capybara shopping buddy riding in the shopping basket. Capybaras are famously unbothered, which
is the tone: no shaming, no "flaws", plain words. Draw Capy as an original SVG (no third-party art).

**Who it's for:** anyone who has bought a product that broke them out or dried them out; people with sensitive or
acne-prone skin; shoppers who can't read INCI lists.

**Honesty:** not medical advice; ingredient effects are tendencies, not guarantees; suggest a patch test; say when to see
a dermatologist (persistent or painful acne). Put the limits in the UI and README.

## Demo data

- Faces: two licensed stock portraits (for example Pexels, front-facing, good light), one with drier skin and one with
  oilier or acne-prone skin; record photo URL and photographer in `docs/CREDITS.md`. Never use real customers.
- Products: three **fictional** products with fictional brand names and realistic ingredient lists, rendered as label
  images in the repo. **No real brands or trademarks anywhere** (the rules forbid third-party trademarks in the video).
- Cache every YouCam and LLM result as JSON fixtures in the repo, and build the UI against the cache so development and
  the video don't burn units.

---

## Shared rules (both YouCam builds)

### Deadline and split
- Submissions close **Mon Nov 2 2026, 11:45 AM ET = 8:45 AM PT**. Push everything by **3:00 AM PT Nov 2**.
- You build the app, README, screenshots, Devpost answer drafts and, if you can, the video (see below). The main session
  (local) uploads the video to YouTube, makes the repo public and submits on Devpost in the morning.

### Requirements from the rules
- Integrate at least one YouCam API **functionally** (not a mockup) in a web or mobile prototype with clear consumer or
  retail value; "fresh, unexpected solutions, not surface-level wrappers"; a first-time user must get it instantly.
- Repo with all source, assets and run instructions. License: **AGPL-3.0** `LICENSE` at the root plus `TRADEMARKS.md`
  reserving the name and mascot.
- Screenshots: at least 4 PNGs in `docs/screenshots/` (1440x900).
- A 1 to 3 minute video (aim 2:00 to 2:30) that explains the YouCam API used, shows the app working end to end, and
  contains **no third-party trademarks and no copyrighted music**.
- Judging (equal weight): Technological Implementation (how thoroughly YouCam is integrated, real value, non-trivial
  code), Design (complete product, not a proof of concept), Potential Impact (credible real problem, real audience,
  shown working), Quality of the Idea (creative, non-obvious YouCam use, understanding of the problem space).

### Keys (environment variables, never in the repo)
- `YOUCAM_API_KEY`: server-side only (Next.js API routes). YouCam units are free (no card), but **1,000 units are shared
  by two builds**: stay under ~350 units. Skin analysis costs 9 to 22 units per call; try-on about 2.
- LLM (free W&B inference, OpenAI-compatible): `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`
  (`Qwen/Qwen3.8-27B`), `OPENAI_VISION_MODEL` (`google/gemma-4-31B-it`, for reading images). Server-side only. Use
  `maxRetries: 4` and a 60 s timeout (the endpoint fails about 1 call in 20 without retries).
- `.env*` git-ignored; scan history before the last push:
  `git grep -nE "sk-[A-Za-z0-9_-]{30,}|wandb_v1_|sk_[a-f0-9]{40}" $(git rev-list --all)` must print nothing.

### Stack and writing
- Next.js (App Router) + TypeScript, **pnpm**; mobile-first, accessible (WCAG 2.2 AA; say so in the README).
- `.env.example` with variable names only. `pnpm build` must pass.
- **No em dashes** anywhere (UI, README, docs, commits). **No Co-Authored-By or AI attribution lines** in commits.
  Statistics only with a fetched, cited source. All people and products fictional or licensed.
- Show which YouCam API produced each result in the UI (judges want to see the API at work), and keep a visible
  "Replay of a recorded run" mode that loads the cached fixtures so a judge without a key can click through.

### Deliverables
1. The working app; README for judges (what, who, the aha, how it works, which YouCam APIs and endpoints, how to run,
   limitations, credits).
2. `docs/screenshots/*.png` (4 or more).
3. `docs/devpost-answers.md`: name, tagline, a description of features, functionality and consumer or retail value, the
   built-with list, and draft answers to the form's three questions: "a moment the API surprised you, good or
   frustrating"; "industries or use cases the API could serve that nobody is talking about"; "where you hit a wall
   technically and how you worked around it". Keep a dated log of API surprises and walls in `docs/api-log.md` as you go.
4. **The video, if you can** (preferred, saves the morning): record the Replay flow with Playwright (headless, 1440x900),
   narrate with ElevenLabs (`ELEVENLABS_API_KEY`, voice `nPczCjzI2devNBz1zQrb`) if that key is in the environment,
   compose with ffmpeg, and commit `demo/video.mp4` (under 50 MB) plus `demo/thumb.jpg`. Narration: the problem and who
   it's for, the aha, the YouCam API by name and what it measured, one honest limitation. If you can't produce the video,
   write `docs/demo-script.md` instead: scenes, exact clicks, narration per scene, with stable `data-testid` attributes on
   everything the script touches.
5. A final summary as your last message: what works, what doesn't, units used, where the video or script is.
