"use client";

import Button from "../atoms/Button";
import Divider from "../atoms/Divider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addCartItem,
  fetchPublicUserById,
  type PublicUserDto,
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
}: {
  name: string;
  sku: string;
  views: number;
  inStock: boolean;
  price: string;
  productId: number;
  sellerId: number;
}) {
  const [seller, setSeller] = useState<PublicUserDto | null>(null);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
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

      await addCartItem(user.id, productId, 1);
      setFeedback("Added to cart");
      setTimeout(() => setFeedback(null), 2500);
    } catch (err: any) {
      setFeedback(err?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={`${almarai.className} space-y-6`}>
      {/* PRODUCT CARD */}
      <div className="bg-[var(--bg-frame)] rounded-xl border border-[var(--bg-frame)] p-6 space-y-4">
        <h2 className="text-lg font-semibold">{name}</h2>
        <div className="text-xs opacity-70">Code: {sku}</div>
        <div className="text-xs">{views} views</div>

        <div
          className={`text-lg ${
            inStock ? "text-[var(--success)]" : "text-red-400"
          }`}
        >
          {inStock ? "In stock" : "Out of stock"}
        </div>

        <Divider text="" />

        <div className="flex items-center justify-between gap-3">
          <div className="text-2xl font-bold">{price}</div>
          <Button
            variant="submit"
            className="ml-55 w-[50px]"
            disabled={!inStock || adding}
            onClick={handleAddToCart}
          >
            {adding ? "Adding..." : "Add to Cart"}
          </Button>
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

        <Button className="max-w-[120px] !bg-[var(--bg-input)] !hover:bg-[var(--bg-input)]">
          Message
        </Button>
      </div>
    </div>
  );
}
