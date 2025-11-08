"use client";

import React, { useRef } from "react";
import Image from "next/image";

interface Props {
  photos: string[];
  onAdd: (urls: string[]) => void;
  onRemove: (index: number) => void;
  height?: number;
}

export default function ImageUploader({ photos, onAdd, onRemove, height = 420 }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    onAdd(urls);
  };

  const thumbs = photos.slice(0, 5);
  const thumbSize = height / 5 - 8; // leave a little gap between each thumb

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Main image area */}
      <div
        className="relative col-span-9 w-full bg-[var(--bg-elev-1)] rounded-2xl border border-[var(--border)] flex items-center justify-center cursor-pointer overflow-hidden"
        style={{ height }}
        onClick={() => fileRef.current?.click()}
      >
        {photos[0] ? (
          <Image src={photos[0]} alt="cover" fill className="object-cover" />
        ) : (
          <span className="text-[var(--fg-muted)]">Click to add photos</span>
        )}
      </div>

      {/* Thumbnails column (squares) */}
      <div className="col-span-3 flex flex-col gap-2" style={{ height }}>
        {thumbs.map((src, i) => (
          <div
            key={i}
            className="relative rounded-xl overflow-hidden group"
            style={{ width: thumbSize, height: thumbSize }}
          >
            <Image src={src} alt={`photo-${i}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 text-xs bg-black/60 px-2 py-1 rounded opacity-0 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 5 - thumbs.length) }).map((_, k) => (
          <button
            key={`add-slot-${k}`}
            type="button"
            className="rounded-xl bg-[var(--bg-elev-1)] border border-dashed border-[var(--border)] text-[var(--fg-muted)] hover:text-white hover:border-[var(--bg-hover)] flex items-center justify-center"
            style={{ width: thumbSize, height: thumbSize }}
            onClick={() => fileRef.current?.click()}
          >
            +
          </button>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}
