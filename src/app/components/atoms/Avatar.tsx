"use client";
import Image from "next/image";

interface AvatarProps {
  src: string;
  size?: number;
  onClick?: () => void;
}

export default function Avatar({ src, size = 124, onClick }: AvatarProps) {
  return (
    <div
      className={`relative rounded-full overflow-hidden group cursor-pointer`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <Image
        src={src}
        alt="User avatar"
        fill
        className="object-cover transition-opacity duration-300 group-hover:opacity-50"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm text-white transition">
        Change
      </div>
    </div>
  );
}
