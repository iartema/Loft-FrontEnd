import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

async function forward(
  req: NextRequest,
  customerId: string,
  method: "POST" | "PUT"
) {
  try {
    const jar = await cookies();
    const token = jar.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.text();
    const res = await fetch(`${API_BASE}/carts/${customerId}/items`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });
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

export async function POST(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  return forward(req, params.customerId, "POST");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  return forward(req, params.customerId, "PUT");
}
