/** Live label reading: photo of an ingredient list -> vision LLM -> Product. */
import { llmConfigured, readLabel } from "@/lib/llm";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request) {
  if (!llmConfigured()) {
    return Response.json({ error: "Live label reading needs the LLM keys on the server. The replay works without them." }, { status: 503 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Send the photo as form data in a field named image." }, { status: 400 });
  }
  const file = form.get("image");
  if (!(file instanceof File)) return Response.json({ error: "No image was attached." }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Response.json({ error: "Use a JPEG, PNG or WebP photo." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: "That photo is over 8 MB." }, { status: 400 });

  try {
    const { reading, elapsedMs, model } = await readLabel(new Uint8Array(await file.arrayBuffer()), file.type);
    if (!reading.readable || reading.ingredients.length === 0) {
      return Response.json(
        { error: "Capy could not find an ingredient list in that photo. Try the back of the pack, close up and flat." },
        { status: 422 },
      );
    }
    const product: Product = {
      id: `live-${Date.now()}`,
      brand: reading.brand || "Unknown brand",
      name: reading.name || "Scanned product",
      type: reading.type,
      size: reading.size,
      labelImage: "",
      ingredients: reading.ingredients,
      source: "live",
      api: {
        name: "Vision LLM label reader",
        endpoint: "POST /api/label",
        model,
        capturedAt: new Date().toISOString(),
        elapsedMs,
      },
    };
    return Response.json({ product, note: reading.note });
  } catch {
    return Response.json({ error: "The label reader did not answer. Please try again." }, { status: 502 });
  }
}
