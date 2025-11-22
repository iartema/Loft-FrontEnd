import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = "https://www.loft-shop.pp.ua";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "User id is required" }, { status: 400 });
  }

  const jar = await cookies();
  const token = jar.get("auth_token")?.value;

  try {
    const res = await fetch(`${BASE}/api/users/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

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
  } catch (err) {
    console.error("[api/users/[id]] upstream error", err);
    return NextResponse.json(
      { message: "Failed to reach user service" },
      { status: 502 }
    );
  }
}
