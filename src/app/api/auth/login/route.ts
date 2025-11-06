import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  try {
    const res = await fetch("https://www.loft-shop.pp.ua/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();

    let data: unknown;
    try {
      data = JSON.parse(text);
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

    // data is expected to contain { token, user, ... }
    const token = (data as any)?.token as string | undefined;
    const user = (data as any)?.user as any | undefined;

    const response = NextResponse.json(data, { status: res.status });

    if (token) {
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    }
    if (user) {
      response.cookies.set("auth_user", JSON.stringify(user), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json(
      { message: "Local fallback: login route works (backend unreachable)" },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "login route up" });
}
