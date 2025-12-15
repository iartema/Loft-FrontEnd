import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

const MEDIA_API_BASE =
  process.env.NEXT_PUBLIC_MEDIA_API_BASE ||
  process.env.MEDIA_API_BASE ||
  "https://www.loft-shop.pp.ua/api/media";

export async function POST(request: NextRequest, context: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await context.params;
  if (!mediaId) {
    return NextResponse.json({ message: "mediaId is required" }, { status: 400 });
  }

  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${MEDIA_API_BASE}/token/${encodeURIComponent(mediaId)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      return NextResponse.json(
        typeof data === "string" ? { message: data || "Failed to generate token" } : data || { message: "Failed to generate token" },
        { status: res.status }
      );
    }
    return NextResponse.json(data ?? {});
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Failed to generate token" },
      { status: 500 }
    );
  }
}
