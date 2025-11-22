import { NextRequest, NextResponse } from "next/server";
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

async function forwardFavorite(productId: string, method: "POST" | "DELETE") {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${USER_API_BASE}/Favorites/${productId}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await res.text();
    const data = safeJsonParse(text);

    if (!res.ok) {
      return NextResponse.json(
        data ?? { message: text || "Favorite request failed" },
        { status: res.status }
      );
    }

    return NextResponse.json(data ?? { success: true });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Favorite request failed" },
      { status: 500 }
    );
  }
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;
  return forwardFavorite(productId, "POST");
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params;
  return forwardFavorite(productId, "DELETE");
}
