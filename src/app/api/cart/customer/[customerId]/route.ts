import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const jar = await cookies();
    const token = jar.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${API_BASE}/carts/customer/${params.customerId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (res.status === 404) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ message: text || `Upstream error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "Unexpected error" }, { status: 500 });
  }
}
