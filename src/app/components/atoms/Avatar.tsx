"use client";
"use client";
import Image from "next/image";
import { useState } from "react";
import { resolvePublicAssetUrl } from "../lib/api";
import { resolveMediaUrl } from "../../lib/media";

interface AvatarProps {
  src: string;
  size?: number;
  onClick?: () => void;
}

export default function Avatar({ src, size = 124, onClick }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const trimmed = src?.trim() ?? "";
  const mediaResolved = trimmed ? resolveMediaUrl(trimmed) : "";
  let displaySrc =
    failed
      ? "/default-avatar.jpg"
      : mediaResolved ||
        (trimmed.startsWith("http://") || trimmed.startsWith("https://")
          ? trimmed
          : trimmed.startsWith("/default")
          ? trimmed
          : resolvePublicAssetUrl(trimmed));
  if (!displaySrc) displaySrc = "/default-avatar.jpg";
  if (typeof window !== "undefined") {
    console.log("[avatar] resolved source", { input: src, displaySrc });
  }
  return (
    <div
      className={`relative rounded-full overflow-hidden group cursor-pointer`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <Image
        src={displaySrc}
        alt="User avatar"
        fill
        className="object-cover transition-opacity duration-300 group-hover:opacity-50"
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm text-white transition">
        Change
      </div>
    </div>
  );
}
