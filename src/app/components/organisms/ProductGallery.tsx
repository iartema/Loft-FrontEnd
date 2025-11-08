"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  images: string[];
  height?: number;
}

export default function ProductGallery({ images, height = 420 }: Props) {
  const [active, setActive] = useState(0);
  const thumbs = images.slice(0, 5);
  const thumbSize = height / 5 - 8;

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* main image */}
      <div
        className="relative col-span-9 w-full bg-[var(--bg-elev-1)] rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ height }}
      >
        {images[active] ? (
          <Image src={images[active]} alt="product" fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--fg-muted)]">
            No image
          </div>
        )}
      </div>

      {/* thumbs (squares) */}
      <div className="col-span-3 flex flex-col gap-2" style={{ height }}>
        {thumbs.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`relative rounded-xl overflow-hidden border ${
              active === i ? "border-[var(--brand)]" : "border-[var(--border)]"
            }`}
            style={{ width: thumbSize, height: thumbSize }}
            aria-label={`thumb ${i + 1}`}
          >
            <Image src={src} alt={`thumb-${i}`} fill className="object-cover" />
          </button>
        ))}
        {Array.from({ length: Math.max(0, 5 - thumbs.length) }).map((_, k) => (
          <div
            key={k}
            style={{ width: thumbSize, height: thumbSize }}
            className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-elev-1)]"
          />
        ))}
      </div>
    </div>
  );
}
