import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

export async function GET() {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const res = await fetch(`${API_BASE}/payments/methods`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const text = await res.text();
    let data: any = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // keep text
    }
    if (!res.ok) {
      return NextResponse.json(
        typeof data === "string" ? { message: data || "Failed to load payment methods" } : data,
        { status: res.status }
      );
    }
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "Failed to load payment methods" }, { status: 500 });
  }
}
