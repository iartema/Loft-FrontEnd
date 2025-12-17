import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { idToken } = await req.json();

  console.log(JSON.parse(atob(idToken.split('.')[1])));

  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json(
      { message: "Google client ID is not configured." },
      { status: 500 }
    );
  }

  const res = await fetch("https://www.loft-shop.pp.ua/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const raw = await res.text();

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { message: "Invalid backend JSON", raw },
      { status: 502 }
    );
  }

  const response = NextResponse.json(data, { status: res.status });

  if (data.token) {
    response.cookies.set("auth_token", data.token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  }

  if (data.user) {
    response.cookies.set("auth_user", JSON.stringify(data.user), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
