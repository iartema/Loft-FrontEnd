"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Almarai } from "next/font/google";
import { addCartItem } from "../lib/api";
import { getCurrentUserCached } from "../lib/userCache";
import { useRouter } from "next/navigation";

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
  className?: string;
  productId?: number;
}

export default function ViewProductCardSearch({
  name,
  description,
  price,
  image,
  onClick,
  buttonLabel = "View",
  className = "",
  productId,
}: ProductCardProps) {
  const router = useRouter();
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
  const [imgSrc, setImgSrc] = useState<string>(resolvedImage);
  const [loading, setLoading] = useState<boolean>(true);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);


  const handleAddToCart = async () => {
    if (adding) return;
    if (!productId) {
      onClick?.();
      return;
    }
    try {
      setAdding(true);
      const user = await getCurrentUserCached();
      if (!user?.id) {
        router.push("/login");
        return;
      }
      await addCartItem(user.id, productId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className={`${almarai.className} bg-[var(--bg-input)] rounded-[10px] overflow-hidden shadow-md hover:shadow-lg transition-all flex flex-col ${className} mb-3`}
      style={{ height: "330px", width: "245px" }}
    >
      <div className="relative w-full h-[200px] flex-shrink-0 cursor-pointer" onClick={onClick}>
        <Image
          src={imgSrc}
          alt={name}
          fill
          className="object-cover rounded-[10px]"
          // Keep requested sizes small to avoid heavy downloads
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
          priority={false}
          quality={60}
          onError={() => {
            setImgSrc("/default-product.jpg");
            setLoading(false);
          }}
          onLoadingComplete={() => setLoading(false)}
        />
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-black/10">
            <span className="block h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
        )}
      </div>

      <div className="p-2 flex flex-col justify-between flex-1 mt-1">
        <div className="space-y-1">
          <p className="text-sm text-white line-clamp-1">{name}</p>
        </div>
        <p className="text-xs text-gray-200 line-clamp-2 mt-5 opacity-[50%]">{description}</p>
        <div className="flex items-center justify-between relative mb-3">
          <span className="text-white font-semibold">{price}</span>
          <div className="flex items-center gap-2 text-white/90">
            <button aria-label="favorite" className="p-1 hover:text-white" title="Favorite">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21s-6.716-4.405-9.09-7.09A5.727 5.727 0 0 1 12 5a5.727 5.727 0 0 1 9.09 8.91C18.716 16.595 12 21 12 21Z" stroke="currentColor" fill="none"/>
              </svg>
            </button>
            <button
              aria-label="add-to-cart"
              className={`p-1 rounded-full transition ${added ? "bg-[var(--success)] text-black" : "hover:text-white"}`}
              title="Add to cart"
              onClick={handleAddToCart}
              disabled={adding}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6h15l-1.5 9h-12L6 3H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
