import { NextResponse } from "next/server";
import { traccarFetch, traccarError } from "@/lib/server/traccar";

export const runtime = "nodejs";

export async function GET() {
  try {
    const devices = await traccarFetch("/api/devices");
    return NextResponse.json({ data: devices });
  } catch (error) {
    return traccarError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = {
      name: body.name,
      uniqueId: body.uniqueId,
      category: body.category,
      phone: body.phone,
      attributes: body.attributes,
    };
    const device = await traccarFetch("/api/devices", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(device);
  } catch (error) {
    return traccarError(error);
  }
}
