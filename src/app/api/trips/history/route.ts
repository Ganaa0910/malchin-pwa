import { NextResponse } from "next/server";
import { traccarFetch, traccarError, invalidRequest } from "@/lib/server/traccar";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");
  const limit = Number(searchParams.get("limit") ?? "50");

  if (!deviceId) {
    return invalidRequest("deviceId is required.");
  }

  try {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const trips = await traccarFetch(`/api/reports/trips?deviceId=${encodeURIComponent(deviceId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    return NextResponse.json({ data: Array.isArray(trips) ? trips.slice(0, limit) : [] });
  } catch (error) {
    return traccarError(error);
  }
}
