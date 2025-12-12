/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Almarai } from "next/font/google";
import { addCartItem, type CartItemMeta } from "../lib/api";
import { getCurrentUserCached } from "../lib/userCache";
import { useRouter } from "next/navigation";

const almarai = Almarai({
  subsets: ["latin"],
  weight: "400",
});

interface ProductCardProps {
  key?: React.Key;
  id?: number;
  name: string;
  description: string;
  price: string;
  image?: string;
  onClick?: () => void;
  buttonLabel?: string;
  className?: string;
  productId?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: number) => void;
  favoriteBusy?: boolean;
}

export default function ViewProductCardSearch({
  name,
  description,
  price,
  image,
  onClick,
  className = "",
  productId,
  isFavorite = false,
  onToggleFavorite,
  favoriteBusy = false,
}: ProductCardProps) {
  const router = useRouter();
  const normalizeImageSrc = (src?: string) => {
    if (!src) return "/default-product.jpg";
    const trimmed = src.trim();
    // Extract the first valid http/https URL even if the string is noisy
    const urlMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
    if (urlMatch?.[0]) return urlMatch[0];

    if (
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:") ||
      trimmed.startsWith("/")
    ) {
      return trimmed;
    }
    return "/" + trimmed;
  };
  const resolvedImage = normalizeImageSrc(image);
  const [imgSrc, setImgSrc] = useState<string>(resolvedImage);
  const [loading, setLoading] = useState<boolean>(true);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);


  const handleAddToCart = async () => {
    if (adding) return;
    console.log("productId:", productId);
    console.log("imgSrc:", imgSrc);
    console.log("adding:", adding);

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
      const meta: CartItemMeta = {
        productName: name,
        price: parseFloat(price) || undefined,
        imageUrl: imgSrc,
      };
      await addCartItem(user.id, productId, 1, meta);
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
      className={`${almarai.className} view-product-card-search bg-[var(--bg-input)] rounded-[10px] overflow-hidden 
      shadow-lg hover:shadow-xl transition-all flex flex-col ${className} mb-4 mr-5 max-w-60 min-w-50`}
      style={{ boxShadow: "0 5px 5px -2px rgba(0, 0, 0, 0.45)" }}
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

      <div className="p-2 flex flex-col justify-between flex-1">
        <div className="space-y-1">
          <p className="text-sm text-white line-clamp-1 mt-1 ml-[2px] mr-[2px]">{name}</p>
        </div>
        <p className="text-xs text-gray-200 line-clamp-2 opacity-[50%] mt-7">{description}</p>
        <div className="flex items-center justify-between relative mb-3">
          <span className="text-white text-lg">{price}</span>
          <div className="flex items-center gap-2 text-white/90">
            <button
              aria-label="favorite"
              className={`p-1 rounded-full transition ${
                isFavorite ? "text-[var(--success)] favorite-on" : "text-white/70 hover:text-white favorite-off"
              } ${favoriteBusy ? "opacity-60 pointer-events-none" : ""}`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={() => productId && onToggleFavorite?.(productId)}
              disabled={favoriteBusy}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isFavorite ? "var(--success)" : "none"}
                strokeWidth="2"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21s-6.716-4.405-9.09-7.09A5.727 5.727 0 0 1 12 5a5.727 5.727 0 0 1 9.09 8.91C18.716 16.595 12 21 12 21Z"
                  stroke="currentColor"
                />
              </svg>
            </button>
            <button
              aria-label="add-to-cart"
              className="p-1 rounded-full transition mb-[2px] hover:text-white"
              title="Add to cart"
              onClick={handleAddToCart}
              disabled={adding}
            >
              <img
                src="/mynaui_cart-solid.svg"
                alt="Cart"
                className="w-5 h-5"
                style={{
                  filter: added
                    ? "brightness(0) saturate(100%) invert(71%) sepia(73%) saturate(322%) hue-rotate(92deg) brightness(95%) contrast(96%)"
                    : "brightness(0) invert(1)",
                }}
              />
            </button>
          </div>
        </div>
     </div>
    </div>
  );
}
