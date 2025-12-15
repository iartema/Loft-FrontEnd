import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

function buildUrl(path: string) {
  return `${API_BASE}${path}`;
}

async function getAuthHeaders() {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export async function GET() {
  const authHeaders = await getAuthHeaders();
  if (!authHeaders) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(buildUrl("/products/myproducts"), {
      headers: {
        ...authHeaders,
      },
      cache: "no-store",
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : [];
    if (!res.ok) {
      return NextResponse.json(
        typeof data === "string" ? { message: data || "Failed to load products" } : data,
        { status: res.status }
      );
    }
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Failed to load products" },
      { status: 500 }
    );
  }
}
