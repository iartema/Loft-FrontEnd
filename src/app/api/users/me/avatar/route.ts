import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = "https://www.loft-shop.pp.ua";

export async function POST(req: Request) {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    // Expecting the field name to be 'avatar'
    const avatar = form.get("avatar");
    if (!(avatar instanceof Blob)) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const forward = new FormData();
    forward.set("avatar", avatar, (avatar as any).name ?? "avatar.jpg");

    const res = await fetch(`${BASE}/api/users/me/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: forward,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { message: "Backend returned invalid JSON", raw: text },
        { status: 502 }
      );
    }

    if (!res.ok) {
      console.error("[users/me/avatar] upstream error", res.status, data);
      return NextResponse.json(
        { message: "Backend returned error", data, status: res.status },
        { status: res.status }
      );
    }

    // If backend returns updated user and avatarUrl, refresh cookie cache
    const response = NextResponse.json(data, { status: res.status });
    const updatedUser = (data as any)?.user ?? data;
    if (updatedUser) {
      response.cookies.set("auth_user", JSON.stringify(updatedUser), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: "Local fallback: users/me/avatar POST (backend unreachable)" },
      { status: 200 }
    );
  }
}
