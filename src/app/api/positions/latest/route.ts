import { NextResponse } from "next/server";
import { traccarFetch, traccarError } from "@/lib/server/traccar";

export const runtime = "nodejs";

export async function GET() {
  try {
    const positions = await traccarFetch("/api/positions?limit=200");
    return NextResponse.json({ data: positions });
  } catch (error) {
    return traccarError(error);
  }
}
