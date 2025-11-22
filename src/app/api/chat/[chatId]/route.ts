import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = "https://www.loft-shop.pp.ua";

export async function DELETE(_req: NextRequest, context: { params?: { chatId?: string } }) {
  const chatId = context.params?.chatId;
  if (!chatId) {
    return NextResponse.json({ message: "Chat id is required" }, { status: 400 });
  }

  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${BASE}/api/chat/${encodeURIComponent(chatId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { message: text || "Failed to delete chat" },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true }, { status: 204 });
}
