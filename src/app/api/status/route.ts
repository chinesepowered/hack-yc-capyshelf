import { connection } from "next/server";
import { llmConfigured, llmModel } from "@/lib/llm";
import { liveScansLeft } from "@/lib/live-limit";

export async function GET() {
  await connection();
  return Response.json({
    youcam: Boolean(process.env.YOUCAM_API_KEY),
    llm: llmConfigured(),
    model: llmConfigured() ? llmModel() : null,
    liveScansLeft: process.env.YOUCAM_API_KEY ? liveScansLeft() : 0,
  });
}
