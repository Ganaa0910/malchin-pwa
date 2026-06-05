import { NextResponse } from "next/server";

const TRACCAR_API_URL = process.env.TRACCAR_API_URL;
const TRACCAR_USERNAME = process.env.TRACCAR_USERNAME;
const TRACCAR_PASSWORD = process.env.TRACCAR_PASSWORD;
const TRACCAR_TOKEN = process.env.TRACCAR_TOKEN;

if (!TRACCAR_API_URL) {
  throw new Error("Missing TRACCAR_API_URL environment variable.");
}

const authHeaders: Record<string, string> = {};
if (TRACCAR_TOKEN) {
  authHeaders.Authorization = `Bearer ${TRACCAR_TOKEN}`;
} else if (TRACCAR_USERNAME && TRACCAR_PASSWORD) {
  authHeaders.Authorization = `Basic ${Buffer.from(`${TRACCAR_USERNAME}:${TRACCAR_PASSWORD}`).toString("base64")}`;
}

export async function traccarFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = new URL(path, TRACCAR_API_URL).toString();
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders,
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Traccar request failed ${response.status}: ${text || response.statusText}`);
  }

  return response.json();
}

export function invalidRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function traccarError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown Traccar error";
  return NextResponse.json({ error: message }, { status: 502 });
}
