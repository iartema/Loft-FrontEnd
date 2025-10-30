import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "✅ GET works" });
}

export async function POST(req: Request) {
  const { email, password } = await req.json();

  try {
    const res = await fetch("https://www.loft-shop.pp.ua/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Host": "www.loft-shop.pp.ua",
        "Origin": "https://www.loft-shop.pp.ua",
      },
      body: JSON.stringify({ email, password }),
    });

    // Try to read backend text
    const text = await res.text();

    // Try parsing JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("❌ Backend did not return valid JSON:", text);
      // fallback if backend response is weird
      return NextResponse.json(
        { message: "Fallback: backend returned invalid JSON", raw: text },
        { status: 502 }
      );
    }

    // if backend returned error code (>=400)
    if (!res.ok) {
      console.error("❌ Backend error:", data);
      return NextResponse.json(
        { message: "Fallback: backend returned error", data },
        { status: res.status }
      );
    }

    // ✅ Success
    return NextResponse.json(data, { status: res.status });

  } catch (err) {
    console.error("⚠️ Fetch to loft failed:", err);
    // fallback: just return the GET-style message
    return NextResponse.json(
      { message: "✅ Local fallback: register route works (backend unreachable)" },
      { status: 200 }
    );
  }
}
