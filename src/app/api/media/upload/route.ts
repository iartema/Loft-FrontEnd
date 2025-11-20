import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveMediaUploadUrl } from "../../../lib/media";

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") ?? form.get("File");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File is required" }, { status: 400 });
  }

  const category =
    (typeof form.get("category") === "string" && (form.get("category") as string)) ||
    (typeof form.get("Category") === "string" && (form.get("Category") as string)) ||
    req.nextUrl.searchParams.get("category") ||
    "products";
  const isPrivateRaw =
    form.get("isPrivate") ?? form.get("IsPrivate") ?? req.nextUrl.searchParams.get("isPrivate");
  const isPrivate =
    typeof isPrivateRaw === "string"
      ? isPrivateRaw.toLowerCase() === "true"
      : Boolean(isPrivateRaw);

  const upstreamUrl = resolveMediaUploadUrl(category);

  const forward = new FormData();
  forward.append("File", file, file.name || "upload");
  forward.append("Category", category);
  forward.append("IsPrivate", String(isPrivate));

  const upstream = await fetch(upstreamUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: forward,
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json(
      { message: raw || `Media upload failed (${upstream.status})` },
      { status: upstream.status }
    );
  }

  let payload: any = raw;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = raw;
  }

  let responseBody: any;
  if (typeof payload === "string") {
    responseBody = isPrivate ? { mediaId: payload } : { url: payload };
  } else if (payload && typeof payload === "object") {
    responseBody = payload;
  } else {
    responseBody = { raw };
  }

  return NextResponse.json(responseBody, { status: upstream.status });
}
