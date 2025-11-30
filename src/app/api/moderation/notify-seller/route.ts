import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";
const LOFT_SHOP_TOKEN = process.env.LOFT_SHOP_TOKEN;

export async function POST(req: Request) {
  if (!LOFT_SHOP_TOKEN) {
    return NextResponse.json(
      { message: "LOFT_SHOP_TOKEN is not configured" },
      { status: 500 }
    );
  }

  const { recipientId, messageText } = await req.json();
  if (!recipientId || !messageText) {
    return NextResponse.json(
      { message: "recipientId and messageText are required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BASE}/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOFT_SHOP_TOKEN}`,
      },
      body: JSON.stringify({ recipientId, messageText }),
    });

    const text = await res.text();
    let data: any = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // keep raw text
    }

    if (!res.ok) {
      return NextResponse.json(
        typeof data === "string" ? { message: data || "Failed to send message" } : data,
        { status: res.status }
      );
    }

    return NextResponse.json(data ?? {}, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
