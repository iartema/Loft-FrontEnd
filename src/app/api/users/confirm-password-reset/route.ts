import { NextResponse } from "next/server";

const BASE = "https://www.loft-shop.pp.ua";

export async function POST(req: Request) {
  const body = await req.text();

  try {
    const res = await fetch(`${BASE}/api/users/confirm-password-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { message: "Backend returned invalid JSON", raw: text },
        { status: 502 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { message: "Backend returned error", data },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { message: "Local fallback: confirm-password-reset (backend unreachable)" },
      { status: 200 }
    );
  }
}
