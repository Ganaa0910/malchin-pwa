import { NextResponse } from "next/server";
import { traccarFetch, traccarError, invalidRequest } from "@/lib/server/traccar";

export const runtime = "nodejs";

export async function GET() {
  try {
    const geofences = await traccarFetch("/api/geofences");
    return NextResponse.json({ data: geofences });
  } catch (error) {
    return traccarError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.area) {
      return invalidRequest("Geofence name and area are required.");
    }

    const payload = {
      name: body.name,
      description: body.description,
      type: "polygon",
      area: body.area,
      attributes: body.attributes,
    };

    const geofence = await traccarFetch("/api/geofences", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(geofence);
  } catch (error) {
    return traccarError(error);
  }
}
