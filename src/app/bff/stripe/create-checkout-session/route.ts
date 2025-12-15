import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

export async function POST(req: Request) {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  const body = await req.text();

  try {
    const res = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Failed to create Stripe checkout session" },
      { status: 500 }
    );
  }
}
