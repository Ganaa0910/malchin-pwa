import { NextResponse } from "next/server";
import { traccarFetch, traccarError, invalidRequest } from "@/lib/server/traccar";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return invalidRequest("Invalid device id");
  }

  try {
    const device = await traccarFetch(`/api/devices/${id}`);
    return NextResponse.json(device);
  } catch (error) {
    return traccarError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return invalidRequest("Invalid device id");
  }

  try {
    const body = await request.json();
    const payload = {
      name: body.name,
      category: body.category,
      phone: body.phone,
      attributes: body.attributes,
    };
    const device = await traccarFetch(`/api/devices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(device);
  } catch (error) {
    return traccarError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return invalidRequest("Invalid device id");
  }

  try {
    await traccarFetch(`/api/devices/${id}`, { method: "DELETE" });
    return NextResponse.json({ message: "deleted" });
  } catch (error) {
    return traccarError(error);
  }
}
