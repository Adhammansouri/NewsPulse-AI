import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "NewsPlus",
    version: "0.1.0",
    phase: "foundation",
    openai: Boolean(process.env.OPENAI_API_KEY),
  });
}
