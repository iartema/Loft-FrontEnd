import { NextResponse } from "next/server";

const BASE = "https://www.loft-shop.pp.ua";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const directUrl = searchParams.get("url");
  const path = searchParams.get("path");

  let target: string | null = null;
  if (directUrl) {
    try {
      const u = new URL(directUrl);
      target = u.toString();
    } catch {
      return NextResponse.json({ message: "Invalid url" }, { status: 400 });
    }
  } else if (path) {
    const p = path.startsWith("/") ? path : `/${path}`;
    target = `${BASE}${p}`;
  }

  if (!target) {
    return NextResponse.json({ message: "Missing url or path" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target, { cache: "no-store" });
    const body = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "image/jpeg";

    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=300",
      },
    });
  } catch (err) {
    return NextResponse.json({ message: "Failed to fetch image" }, { status: 502 });
  }
}

