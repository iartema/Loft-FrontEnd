import { NextResponse } from "next/server";

export async function POST() {
  // Clear auth cookies set during login/register
  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  res.cookies.set("auth_user", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return res;
}

export async function GET() {
  return POST();
}

