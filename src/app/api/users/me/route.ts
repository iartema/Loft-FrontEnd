import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = "https://www.loft-shop.pp.ua";

export async function GET() {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  const cached = jar.get("auth_user")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // If we already cached the user in cookie, return it
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return NextResponse.json(parsed, { status: 200 });
    } catch {
      // ignore parsing error, fall through to fetch from backend
    }
  }

  try {
    const res = await fetch(`${BASE}/api/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
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
      return NextResponse.json(
        { message: "Backend returned error", data },
        { status: res.status }
      );
    }

    const response = NextResponse.json(data, { status: 200 });
    // Cache user JSON in httpOnly cookie
    response.cookies.set("auth_user", JSON.stringify(data), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: "Local fallback: users/me GET (backend unreachable)" },
      { status: 200 }
    );
  }
}

export async function PUT(req: Request) {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await req.text();

  try {
    const res = await fetch(`${BASE}/api/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
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
      return NextResponse.json(
        { message: "Backend returned error", data },
        { status: res.status }
      );
    }

    const response = NextResponse.json(data, { status: res.status });
    // Update cached user cookie if user object is returned
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
      { message: "Local fallback: users/me PUT (backend unreachable)" },
      { status: 200 }
    );
  }
}
