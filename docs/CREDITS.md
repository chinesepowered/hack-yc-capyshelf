# Credits

## Demo faces (licensed stock photos)

Both are free-to-use photos under the [Pexels license](https://www.pexels.com/license/). They were cropped so the face
fills more than 60 percent of the image width (a YouCam requirement) and resized to 1080 x 1440. They are used only as
demo inputs, and the app describes measured skin with neutral, non-judgmental wording. Their names in the app
("Shopper A", "Shopper B") are labels, not identities.

| In the app | Photo | Photographer |
| --- | --- | --- |
| Shopper A (`public/demo/faces/face-a.jpg`) | [pexels.com/photo/woman-with-8727557](https://www.pexels.com/photo/woman-with-8727557/) | Tima Miroshnichenko ([pexels.com/@tima-miroshnichenko](https://www.pexels.com/@tima-miroshnichenko/)) |
| Shopper B (`public/demo/faces/face-b.jpg`) | [pexels.com/photo/a-woman-wearing-a-tank-top-6475984](https://www.pexels.com/photo/a-woman-wearing-a-tank-top-6475984/) | Anna Nekrashevich ([pexels.com/@anna-nekrashevich](https://www.pexels.com/@anna-nekrashevich/)) |

## Everything else

- **Products and labels**: fictional, written and rendered for this project (`scripts/render-labels.ts`).
- **Capy the capybara**: original SVG artwork made for this project (`src/components/Capy.tsx`).
- **Skin analysis**: YouCam API by Perfect Corp. (AI Skin Analysis, SD).
- **Label reading and explanations**: Qwen 3.8 (27B) served by W&B Inference through an OpenAI-compatible API.
- **Demo video narration**: AssemblyAI text to speech, voice "Sara" (`aai-sara`). No music is used.
- **Font**: Nunito (SIL Open Font License), self-hosted through `@fontsource-variable/nunito`.
- **Ingredient evidence**: see the sources listed per effect in `src/data/sources.ts` and on the app's How it works page.
