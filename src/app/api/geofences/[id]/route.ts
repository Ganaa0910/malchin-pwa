import { NextResponse } from "next/server";
import { traccarFetch, traccarError, invalidRequest } from "@/lib/server/traccar";

export const runtime = "nodejs";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return invalidRequest("Invalid geofence id");
  }

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

    const geofence = await traccarFetch(`/api/geofences/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(geofence);
  } catch (error) {
    return traccarError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return invalidRequest("Invalid geofence id");
  }

  try {
    await traccarFetch(`/api/geofences/${id}`, { method: "DELETE" });
    return NextResponse.json({ message: "deleted" });
  } catch (error) {
    return traccarError(error);
  }
}
