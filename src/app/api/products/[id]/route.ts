import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = "https://www.loft-shop.pp.ua";

export async function GET(_req: Request, context: { params?: { id?: string } }) {
  const id = context.params?.id;
  if (!id) {
    return NextResponse.json({ message: "Product id is required" }, { status: 400 });
  }

  const jar = await cookies();
  const token = jar.get("auth_token")?.value;

  try {
    const res = await fetch(`${BASE}/api/products/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      if (res.ok) {
        data = text;
      }
    }

    if (!res.ok) {
      return NextResponse.json(
        { message: "Backend returned error", data },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[api/products/[id]] upstream error", err);
    return NextResponse.json(
      { message: "Failed to reach backend for product details" },
      { status: 502 }
    );
  }
}
