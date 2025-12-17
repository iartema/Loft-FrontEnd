"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Title from "../atoms/Title";
import ViewProductCardSearch from "../molecules/ViewProductCardSearch";
import {
  ApiError,
  addFavoriteProduct,
  fetchFavoriteItems,
  fetchProductById,
  removeFavoriteProduct,
  type ProductDto,
} from "../lib/api";
import { getFirstPublicImageUrl } from "../../lib/media";
import { useRouter } from "next/navigation";
import { useLocale } from "../../i18n/LocaleProvider";

type FavoriteCard = {
  id: number;
  name: string;
  description: string;
  price: string;
  image?: string;
};

const formatPrice = (value?: number | null, currency?: string | number | null) => {
  if (value == null) return "";
  const symbolMap: Record<string, string> = {
    USD: "$",
    UAH: "₴",
    0: "₴",
    1: "$",
  };
  const codeMap: Record<string, string> = {
    0: "UAH",
    1: "USD",
  };
  const key =
    currency == null ? "" : typeof currency === "number" ? String(currency) : currency.toString().toUpperCase();
  const symbol = key ? symbolMap[key] : "";
  const code = key ? codeMap[key] ?? key : "";
  if (symbol) return `${symbol} ${value}`;
  if (code) return `${value} ${code}`;
  return `${value}`;
};

export default function MyFavorites() {
  const { t } = useLocale();
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteBusyIds, setFavoriteBusyIds] = useState<Set<number>>(new Set());
  const [items, setItems] = useState<FavoriteCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadFavorites = async () => {
      setLoading(true);
      setError(null);
      try {
        const ids = await fetchFavoriteItems();
        if (!active) return;
        const next = new Set<number>();
        for (const id of ids) {
          if (Number.isFinite(id)) next.add(Number(id));
        }
        setFavoriteIds(next);

        const products: FavoriteCard[] = [];
        for (const id of next) {
          try {
            const product = await fetchProductById(id);
            products.push(transformProduct(product));
          } catch (err) {
            console.error("Failed to load product", id, err);
          }
        }
        if (active) setItems(products);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          if (active) {
            router.push("/login");
            setFavoriteIds(new Set());
            setItems([]);
          }
        } else {
          console.error("Failed to load favorites", err);
          if (active) setError(t("favorites.error"));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadFavorites();
    return () => {
      active = false;
    };
  }, [router, t]);

  const handleToggleFavorite = useCallback(
    async (productId: number) => {
      if (!productId) return;
      setFavoriteBusyIds((prev) => new Set(prev).add(productId));
      const currentlyFavorite = favoriteIds.has(productId);
      try {
        if (currentlyFavorite) {
          await removeFavoriteProduct(productId);
        } else {
          await addFavoriteProduct(productId);
        }
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (currentlyFavorite) next.delete(productId);
          else next.add(productId);
          return next;
        });
        setItems((prev) =>
          currentlyFavorite ? prev.filter((item) => item.id !== productId) : prev
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError(t("favorites.login"));
          router.push("/login");
        } else {
          console.error("Failed to toggle favorite", err);
          setError(currentlyFavorite ? t("favorites.removeError") : t("favorites.addError"));
        }
      } finally {
        setFavoriteBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    [favoriteIds, router, t]
  );

  const content = useMemo(() => {
    if (loading) {
      return <div className="text-white/70 text-sm">{t("favorites.loading")}</div>;
    }
    if (error) {
      return <div className="text-red-400 text-sm">{error}</div>;
    }
    if (!items.length) {
      return <div className="text-white/60 text-sm">{t("favorites.empty")}</div>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
        {items.map((item, idx) => (
          <ViewProductCardSearch
            key={`${item.id}-${idx}`}
            productId={item.id}
            name={item.name}
            description={" "}
            price={item.price}
            image={item.image}
            onClick={() => router.push(`/product/${item.id}`)}
            isFavorite={favoriteIds.has(item.id)}
            favoriteBusy={favoriteBusyIds.has(item.id)}
            onToggleFavorite={handleToggleFavorite}
            className="w-full"
          />
        ))}
      </div>
    );
  }, [items, loading, error, favoriteIds, favoriteBusyIds, handleToggleFavorite, router, t]);

  return (
    <div className="flex flex-col gap-8">
      <Title className="font-semibold text-white" size="lg">
        {t("favorites.title")}
      </Title>
      <div className="border-t border-[var(--divider)]" />
      {content}
    </div>
  );
}

function transformProduct(product: ProductDto): FavoriteCard {
  return {
    id: product.id ?? 0,
    name: product.name,
    description: product.description ?? "",
    price: formatPrice(product.price, product.currency),
    image: getFirstPublicImageUrl(product.mediaFiles) || "/default-product.jpg",
  };
}
