import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SHIPPING_API_BASE =
  process.env.NEXT_PUBLIC_SHIPPING_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://www.loft-shop.pp.ua/api";

async function getAuthHeaders() {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

function buildUrl(path: string) {
  return `${SHIPPING_API_BASE}${path}`;
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function GET() {
  const authHeaders = await getAuthHeaders();
  if (!authHeaders) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(buildUrl("/shipping-addresses/default"), {
      headers: { ...authHeaders },
      cache: "no-store",
    });
    const data = await parseJsonSafe(res);
    if (res.status === 404) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json(
        typeof data === "string" ? { message: data || "Failed to load address" } : data,
        { status: res.status }
      );
    }
    return NextResponse.json(data ?? {});
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Failed to load address" },
      { status: 500 }
    );
  }
}
