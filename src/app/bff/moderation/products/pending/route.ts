import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const MOD_API_BASE =
  process.env.NEXT_PUBLIC_MODERATION_API_BASE ||
  "https://www.loft-shop.pp.ua/api/moderation";

export async function GET() {
  const jar = await cookies();   // MUST await once

  const token = jar.get("auth_token")?.value;
  const userRaw = jar.get("auth_user")?.value;

  if (!token || !userRaw) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = JSON.parse(userRaw);
    const role = parsed?.role ?? parsed?.Role;
    if (role !== 2) {
      return NextResponse.json(
        { message: "Access denied: moderator role required." },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { message: "Invalid auth cookie" },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${MOD_API_BASE}/products/pending`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const raw = await res.text();
    let data: any;

    try {
      data = raw ? JSON.parse(raw) : [];
    } catch {
      return NextResponse.json(
        { message: "Invalid backend JSON", raw },
        { status: 502 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { message: "Backend returned error", data },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Failed to load pending items" },
      { status: 500 }
    );
  }
}
