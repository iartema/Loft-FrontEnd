import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = "https://www.loft-shop.pp.ua";

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const bodyText = await req.text();

  const res = await fetch(`${BASE}/api/chat/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: bodyText,
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    return NextResponse.json(
      { message: "Backend returned error", data },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
