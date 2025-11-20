"use client";

import React, { useEffect, useMemo, useState } from "react";
import Title from "../atoms/Title";
import ViewProductCardSearch from "../molecules/ViewProductCardSearch";
import Button from "../atoms/Button";
import { useRouter } from "next/navigation";
import { getCurrentUserCached } from "../lib/userCache";
import { getFirstPublicImageUrl } from "../../lib/media";
import { ApiError, searchProductsExternal, type ProductDto } from "../lib/api";

type StatusFilter = "All" | "Active" | "Rejected" | "Under review";

const STATUS_FILTERS: StatusFilter[] = ["All", "Active", "Rejected", "Under review"];

const statusMatchesFilter = (status: string | null | undefined, filter: StatusFilter) => {
  if (filter === "All") return true;
  const normalized = ["rejected", "active", "pending"][status];
  if (!normalized) return false;
  if (filter === "Active") {
    return normalized === "active";
  }
  if (filter === "Rejected") {
    return normalized === "rejected";
  }
  if (filter === "Under review") {
    return normalized === "pending";
  }
  return true;
};

const formatPrice = (price?: number | null, currency?: string | null) => {
  if (price === null || price === undefined) return "—";
  const curr = ['₴', '$'][currency];
  return `${price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${curr}`;
};

export default function MyProducts() {
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [items, setItems] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await getCurrentUserCached();
        if (!me?.id) {
          if (!cancelled) {
            setItems([]);
            setError("Please log in to view your products.");
          }
          return;
        }

        const products = await searchProductsExternal({
          sellerId: me.id,
          pageSize: 100,
        });
        if (!cancelled) {
          setItems(products ?? []);
        }
      } catch (err: any) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setError("Session expired. Please log in again.");
          setItems([]);
        } else {
          setError(err?.message || "Failed to load products.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!items.length) return [];
    return items.filter((item) => statusMatchesFilter(item.status, filter));
  }, [items, filter]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <Title className="font-semibold text-white" size="lg">
          My Products
        </Title>

        <div className="flex justify-end">
          <Button
            variant="submit"
            label="New listing"
            className="px-6 py-2 rounded-xl"
            onClick={() => router.push("/product/new")}
          />
        </div>
      </div>

      <div className="flex gap-6 text-gray-400 text-sm">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`${
              filter === f ? "text-green-400 underline" : "hover:text-white"
            } transition`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="border-t border-neutral-800" />

      {loading && <div className="text-sm text-gray-400">Loading your listings...</div>}
      {error && !loading && <div className="text-sm text-red-400">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-sm text-gray-500">No products found for this filter.</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filtered.map((product) => (
          <ViewProductCardSearch
            key={product.id}
            name={product.name}
            description={" "}
            price={formatPrice(product.price, product.currency)}
            image={getFirstPublicImageUrl(product.mediaFiles) || "/default-product.jpg"}
            buttonLabel="Details"
            productId={product.id}
            onClick={() => router.push(`/product/${product.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
