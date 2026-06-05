import { NextResponse } from "next/server";
import { traccarFetch, traccarError } from "@/lib/server/traccar";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");
    const query = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}&limit=1` : "";
    const positions = await traccarFetch(`/api/positions${query}`);
    return NextResponse.json({ data: positions });
  } catch (error) {
    return traccarError(error);
  }
}
