import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = "https://www.loft-shop.pp.ua";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { message: "Conversation id is required" },
      { status: 400 }
    );
  }

  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    `${BASE}/api/chat/conversation/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const text = await res.text();
  let data: unknown;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    return NextResponse.json(
      { message: "Backend returned error", data },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
