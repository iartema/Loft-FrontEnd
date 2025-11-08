"use client";
import React from "react";
import Image from "next/image";
import { Almarai } from "next/font/google";

const almarai = Almarai({
  subsets: ["latin"],
  weight: "400",
});

interface ProductCardProps {
  id?: number;
  name: string;
  description: string;
  price: string;
  image?: string;
  onClick?: () => void;
  buttonLabel?: string;
}

export default function ViewProductCardSearch({
  name,
  description,
  price,
  image,
  onClick,
  buttonLabel = "View",
}: ProductCardProps) {
  const normalizeImageSrc = (src?: string) => {
    if (!src) return "/default-product.jpg";
    const s = src.trim();
    if (
      s.startsWith("http://") ||
      s.startsWith("https://") ||
      s.startsWith("data:") ||
      s.startsWith("blob:") ||
      s.startsWith("/")
    ) {
      return s;
    }
    return "/" + s;
  };
  const resolvedImage = normalizeImageSrc(image);
  return (
    <div
      className={`${almarai.className} bg-[var(--bg-input)] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all flex flex-col`}
      style={{ height: "300px" }}
    >
      <div className="relative w-full h-[180px] flex-shrink-0 cursor-pointer" onClick={onClick}>
        <Image
          src={resolvedImage}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 20vw"
          unoptimized
        />
      </div>

      <div className="p-2 flex flex-col justify-between flex-1">
        <div className="space-y-1">
          <p className="text-sm text-white line-clamp-1">{name}</p>
          <p className="text-xs text-gray-200 line-clamp-2">{description}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-white font-semibold">{price}</span>
          <div className="flex items-center gap-2 text-white/90">
            <button aria-label="favorite" className="p-1 hover:text-white" title="Favorite">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21s-6.716-4.405-9.09-7.09A5.727 5.727 0 0 1 12 5a5.727 5.727 0 0 1 9.09 8.91C18.716 16.595 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </button>
            <button aria-label="compare" className="p-1 hover:text-white" title="Compare">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h14M3 12h10M3 18h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button aria-label="add-to-cart" className="p-1 hover:text-white" title="Add to cart" onClick={onClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6h15l-1.5 9h-12L6 3H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="21" r="1" fill="currentColor"/>
                <circle cx="18" cy="21" r="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
