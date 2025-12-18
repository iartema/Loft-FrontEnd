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
  const [errored, setErrored] = useState<Record<number, boolean>>({});
  const [mainLoading, setMainLoading] = useState(true);

  return (
    <>
      {/* ===== MOBILE (< md): horizontal scroll ===== */}
      <div className="md:hidden -mx-4 px-4">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory">
          {images.map((src, i) => (
            <div
              key={i}
              className="relative min-w-[80%] h-[320px] snap-center rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--bg-elev-1)]"
            >
              <Image
                src={errored[i] ? "/default-product.jpg" : src}
                alt={`product-${i}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority={i === 0}
                quality={70}
                onError={() => setErrored((s) => ({ ...s, [i]: true }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ===== DESKTOP (md+): your original layout ===== */}
      <div className="hidden md:grid grid-cols-12 gap-3">
        {/* main image */}
        <div
          className="relative col-span-9 w-full bg-[var(--bg-elev-1)] rounded-2xl border border-[var(--border)] overflow-hidden"
          style={{ height }}
        >
          {images[active] ? (
            <Image
              src={errored[active] ? "/default-product.jpg" : images[active]}
              alt="product"
              fill
              className="object-cover"
              sizes="50vw"
              loading="eager"
              quality={70}
              onError={() => {
                setErrored((s) => ({ ...s, [active]: true }));
                setMainLoading(false);
              }}
              onLoadingComplete={() => setMainLoading(false)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--fg-muted)]">
              No image
            </div>
          )}

          {mainLoading && (
            <div className="absolute inset-0 grid place-items-center bg-black/10">
              <span className="block h-7 w-7 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            </div>
          )}
        </div>

        {/* thumbs */}
        <div className="col-span-3 flex flex-col gap-2" style={{ height }}>
          {thumbs.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative rounded-xl overflow-hidden border ${
                active === i
                  ? "border-[var(--brand)]"
                  : "border-[var(--border)]"
              }`}
              style={{ width: thumbSize, height: thumbSize }}
            >
              <Image
                src={errored[i] ? "/default-product.jpg" : src}
                alt={`thumb-${i}`}
                fill
                className="object-cover"
                sizes="80px"
                loading="lazy"
                quality={60}
                onError={() => setErrored((s) => ({ ...s, [i]: true }))}
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
