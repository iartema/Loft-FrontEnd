import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const USER_API_BASE = process.env.NEXT_PUBLIC_USER_API_BASE || "https://loft-shop.pp.ua/api";

function safeJsonParse(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function GET() {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${USER_API_BASE}/Favorites`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const text = await res.text();
    const data = safeJsonParse(text);

    if (!res.ok) {
      return NextResponse.json(
        data ?? { message: text || "Failed to fetch favorites" },
        { status: res.status }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}
