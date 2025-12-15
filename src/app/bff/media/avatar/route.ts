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
  const candidate = form.get("file") ?? form.get("avatar") ?? form.get("File");
  if (!(candidate instanceof File)) {
    return NextResponse.json({ message: "File is required" }, { status: 400 });
  }

  const forward = new FormData();
  forward.append("File", candidate, candidate.name || "avatar");
  forward.append("Category", "avatars");
  forward.append("IsPrivate", "false");

  const res = await fetch(resolveMediaUploadUrl("avatars"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: forward,
  });

  const raw = await res.text();
  if (!res.ok) {
    return NextResponse.json(
      { message: raw || `Avatar upload failed (${res.status})` },
      { status: res.status }
    );
  }

  let payload: any = raw;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = raw;
  }

  let avatarUrl: string | null = null;
  if (typeof payload === "string") avatarUrl = payload;
  else if (payload && typeof payload === "object") {
    avatarUrl =
      payload.url ??
      payload.Url ??
      payload.avatarUrl ??
      payload.AvatarUrl ??
      null;
  }

  return NextResponse.json(
    { avatarUrl, raw: payload },
    { status: res.status }
  );
}
