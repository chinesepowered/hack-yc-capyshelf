# Demo script

The committed video (`demo/video.mp4`, 2:24) was made from this script. Everything after the Camera Kit scene runs in
**Replay** mode, and the whole recording uses `?present=1` (presentation mode shows the model as a generic "vision
language model", so the video carries no third-party names besides the YouCam API). A 3.5 s silent title card opens
the video and a 4.5 s end card closes it. No music.

## Re-make the video

The Camera Kit scene needs a camera. The recorder feeds Chromium a still of demo face A as a test camera. Name the
file neutrally: the YouCam SDK ignores cameras whose label contains words such as "fake" or "virtual".

```bash
mkdir -p demo/.work/cam && ffmpeg -loop 1 -i public/demo/faces/face-a.jpg -t 4 -r 10 -vf "scale=-2:560,pad=1280:720:(ow-iw)/2:(oh-ih)/2+40:color=0x2a3a4a" -q:v 3 -f mjpeg demo/.work/cam/webcam.mjpeg
```

```bash
pnpm build && pnpm start -p 3200
```

```bash
pnpm tsx scripts/make-narration.ts
```

```bash
BASE=http://localhost:3200 node scripts/render-cards.cjs
```

```bash
BASE=http://localhost:3200 node scripts/record-demo.cjs
```

```bash
python3 scripts/compose_video.py
```

Narration clips are cached in `demo/.work/narration/` (git-ignored), so only edited scenes are re-synthesized
(AssemblyAI text to speech, voice `aai-sara`, 1,867 characters in total). Each scene lasts as long as its clip plus
a short pause (longer if the Camera Kit needs more time to capture); the recorder writes the scene start times and
the composer places each clip at its scene.

## Scenes

| # | Scene | What happens on screen (clicks use `data-testid`) | Narration |
| --- | --- | --- | --- |
| 1 | `s1-intro` | Open `/?present=1` (Home). Rest on the hero; hover **Start the replay** (`start-replay`). | You're in the skincare aisle with a moisturizer in your hand. Will it break you out, or dry you out? Capy Shelf answers that for your skin, not for skin in general. It's for anyone who has been burned by a product, and anyone who can't read an ingredient list. |
| 2 | `s2-aha` | Scroll to the aha card (`home-aha`): Shopper A Good match, Shopper B Skip for you, same label in the middle. | Here's the idea. The same moisturizer is a good match for Shopper A, and a skip for Shopper B. Same label, same rules. Only their measured skin is different. |
| 3 | `s3a-camera` | Click **Try it live** (`start-live`), then **Use the YouCam camera guide** (`live-camera`). The Camera Kit checks lighting, pose and position, counts down and captures; the scan request is held by the recorder so no units are spent. | Step one: scan once. In the aisle, the YouCam Camera Kit guides the selfie. It checks light, pose and face position, then takes the photo by itself. |
| 4 | `s3-scan-a` | Click **Back to replay** (`back-to-replay`) and **Shopper A** (`profile-demo-a`). Hover the Hydration row (`score-moisture`). Toggle **Skin type zones** on and off (`mask-toggle-skin_type`). | The photo goes to the YouCam AI Skin Analysis API. We use the SD model with seven concerns, from acne and pores to moisture, redness and skin type, for twelve units per scan. Each concern comes back with a raw score and a detection mask. In this recorded scan, hydration is Shopper A's main focus. |
| 5 | `s4-scan-b` | Click **Shopper B** (`profile-demo-b`); pores and breakouts masks appear. Hover the Breakouts row (`score-acne`). | Shopper B is different: pores and breakouts. Capy reads the mask pixels to find where they are. Here, mostly on the cheeks. |
| 6 | `s5-label` | Click **Next: snap a label** (`next-to-label`). Dew Drink Gel Cream label, chips colored for Shopper B. Hover chip 3, Isopropyl Myristate (`ingredient-list`). | Step two: snap the label. A vision language model copies the ingredient list off the photo, in order. Then Capy colors each ingredient for this skin. |
| 7 | `s6-verdict-b` | Click **See Capy's verdict** (`next-to-verdict`): Skip for you. Scroll to the card (`verdict-card`) and hover the headline (`verdict-headline`). | Step three: the verdict. It's deterministic: an ingredient table with cited sources meets the person's own YouCam scores. Isopropyl myristate is third on the list and may clog pores, so for Shopper B, this cream is a skip. |
| 8 | `s7-verdict-a` | Scroll to top, click **Shopper A** (`verdict-profile-demo-a`): Good match. Scroll to **Same product, different skin** (`two-skins`). | Switch to Shopper A, and the same cream is a good match, because glycerin and dimethicone help skin hold water. The language model only writes the friendly explanation. |
| 9 | `s8-compare` | Click step **4 Compare** in the header (`nav-step-4`). Scroll to the routine (`routine`): keep looking for a cleanser, serum with care, cream good. | Step four: compare products and get a tiny routine from the ones that fit. When nothing fits, Capy says what to look for instead. |
| 10 | `s9-close` | Click the logo (`nav-home`) to return to the hero. | One honest limit: ingredient effects are tendencies, not guarantees, and this is not medical advice. So Capy suggests a patch test, and a dermatologist for painful or lasting acne. Calm answers, right in the aisle. |

## What the narration covers

- The problem and who it is for: scene 1.
- The aha (same moisturizer, two skins, two answers): scenes 2, 7 and 8.
- The YouCam APIs by name and what they measured: scenes 3 and 4 (Camera Kit guided capture; SD skin analysis, seven concerns, 12 units, raw scores and detection masks), and scene 5 (mask-based location).
- One honest limitation: scene 10 (tendencies, not guarantees; not medical advice; patch test; dermatologist).
