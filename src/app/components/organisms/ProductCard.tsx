/* eslint-disable @next/next/no-img-element */
"use client";

import Button from "../atoms/Button";
import Divider from "../atoms/Divider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addCartItem,
  fetchPublicUserById,
  type PublicUserDto,
  fetchFavoriteItems,
  addFavoriteProduct,
  removeFavoriteProduct,
  ApiError,
  sendChatMessage,
  type CartItemMeta,
} from "../lib/api";
import { getCurrentUserCached } from "../lib/userCache";
import { Almarai } from "next/font/google";

const almarai = Almarai({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

export default function ProductCard({
  name,
  sku,
  views,
  inStock,
  price,
  productId,
  sellerId,
  stockQuantity,
}: {
  name: string;
  sku: string;
  views: number;
  inStock: boolean;
  price: string;
  productId: number;
  sellerId: number;
  stockQuantity?: number | null;
}) {
  const [seller, setSeller] = useState<PublicUserDto | null>(null);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    if (!sellerId) {
      setSeller(null);
      return;
    }

    (async () => {
      try {
        const user = await fetchPublicUserById(sellerId);
        if (!cancelled) setSeller(user);
      } catch {
        if (!cancelled) setSeller(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ids = await fetchFavoriteItems();
        if (!cancelled) setIsFavorite(ids.includes(productId));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          if (!cancelled) setIsFavorite(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getCurrentUserCached();
        if (!cancelled) setCurrentUserId(me?.id ?? null);
      } catch {
        if (!cancelled) setCurrentUserId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isOwner = currentUserId != null && sellerId === currentUserId;
  const sellerName =
    [seller?.firstName, seller?.lastName].filter(Boolean).join(" ").trim() ||
    "Seller";

  const avatarSrc =
    (seller?.avatarUrl && seller.avatarUrl.trim().length
      ? seller.avatarUrl
      : "/default-avatar.jpg");

  const handleAddToCart = async () => {
    if (!inStock || !productId) return;

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
      };
      await addCartItem(user.id, productId, 1, meta);
      setFeedback("Added to cart");
      setTimeout(() => setFeedback(null), 2500);
    } catch (err: any) {
      setFeedback(err?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!productId || favoriteBusy) return;
    setFavoriteBusy(true);
    try {
      if (isFavorite) {
        await removeFavoriteProduct(productId);
        setIsFavorite(false);
      } else {
        await addFavoriteProduct(productId);
        setIsFavorite(true);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
      } else {
        console.error("Failed to toggle favorite", err);
      }
    } finally {
      setFavoriteBusy(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!sellerId || messaging) return;
    setMessaging(true);
    try {
      const me = await getCurrentUserCached();
      if (!me?.id) {
        router.push("/login");
        return;
      }
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "https://loft-shop.pp.ua";
      const link = `${origin}/product/${productId}`;
      await sendChatMessage(sellerId, `Hello, I'm interested in this product. ${link}`);
      router.push(`/chat/${sellerId}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
      } else {
        console.error("Failed to start chat", err);
      }
    } finally {
      setMessaging(false);
    }
  };

  return (
    <div className={`${almarai.className} space-y-6`}>
      {/* PRODUCT CARD */}
      <div className="bg-[var(--bg-frame)] rounded-xl border border-[var(--bg-frame)] p-6 space-y-4 relative">
        <button
          type="button"
          className={`absolute top-4 right-4 p-2 rounded-full transition ${
            isFavorite ? "text-[var(--success)]" : "text-white/70 hover:text-white"
          } ${favoriteBusy ? "opacity-60 pointer-events-none" : ""}`}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={handleToggleFavorite}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 21s-6.716-4.405-9.09-7.09A5.727 5.727 0 0 1 12 5a5.727 5.727 0 0 1 9.09 8.91C18.716 16.595 12 21 12 21Z" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold">{name}</h2>
        <div className="text-xs opacity-70">Code: {sku}</div>
        <div className="text-xs">{views} views</div>

        <div className={`text-lg ${inStock ? "text-[var(--success)]" : "text-red-400"}`}>
          {inStock ? `In stock${stockQuantity != null ? ` (${stockQuantity})` : ""}` : "Out of stock"}
        </div>

        <Divider text="" className="[&>div]:bg-white" />

        <div className="flex items-center justify-between gap-3">
          <div className="text-2xl font-bold">{price}</div>
          {isOwner ? (
            <Button
              variant="submit"
              className="ml-55 w-[120px]"
              onClick={() => router.push(`/product/${productId}/edit`)}
            >
              Edit product
            </Button>
          ) : (
            <Button
              variant="submit"
              className="max-w-[150px] min-w-[150px]"
              disabled={!inStock || adding}
              onClick={handleAddToCart}
            >
              {adding ? "Adding..." : "Add to Cart"}
            </Button>
          )}
        </div>

        {feedback && (
          <div className="text-sm opacity-80 text-center">{feedback}</div>
        )}
      </div>

      {/* SELLER CARD */}
      <div className="bg-[var(--bg-frame)] rounded-lg p-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-15 h-15 rounded-full bg-[var(--border)] overflow-hidden">
            <img
              src={avatarSrc}
              alt={sellerName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-sm">{sellerName}</div>
            <div className="text-xs opacity-70">Seller</div>
          </div>
        </div>

        {!(currentUserId && sellerId === currentUserId) && (
          <Button
            className="max-w-[120px] !bg-[var(--bg-input)] !hover:bg-[var(--bg-input)]"
            disabled={messaging}
            onClick={handleMessageSeller}
          >
            {messaging ? "Opening..." : "Message"}
          </Button>
        )}
      </div>
    </div>
  );
}
