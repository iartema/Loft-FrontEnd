import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { customerId: string; productId: string } }
) {
  try {
    const jar = await cookies();
    const token = jar.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const res = await fetch(`${API_BASE}/carts/${params.customerId}/items/${params.productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      return NextResponse.json({ message: text || `Upstream error ${res.status}` }, { status: 502 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "Unexpected error" }, { status: 500 });
  }
}
