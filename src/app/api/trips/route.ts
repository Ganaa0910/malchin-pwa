import { NextResponse } from "next/server";
import { traccarFetch, traccarError, invalidRequest } from "@/lib/server/traccar";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!deviceId || !from || !to) {
    return invalidRequest("deviceId, from and to are required.");
  }

  try {
    const trips = await traccarFetch(`/api/reports/trips?deviceId=${encodeURIComponent(deviceId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    return NextResponse.json({ data: trips });
  } catch (error) {
    return traccarError(error);
  }
}
