"use client";

import { useEffect, useMemo, useState } from "react";
import Title from "../atoms/Title";
import ViewProductCardSearch from "../molecules/ViewProductCardSearch";
import Button from "../atoms/Button";
import { useRouter } from "next/navigation";
import { getCurrentUserCached } from "../lib/userCache";
import { getFirstPublicImageUrl } from "../../lib/media";
import { ApiError, fetchMyProducts, type ProductDto } from "../lib/api";
import { useLocale } from "../../i18n/LocaleProvider";

type StatusFilter = "All" | "Active" | "Rejected" | "Under review";

const STATUS_FILTERS: StatusFilter[] = ["All", "Active", "Rejected", "Under review"];

const normalizeStatus = (status: string | number | null | undefined) => {
  if (status === null || status === undefined) return "";
  if (typeof status === "number") {
    if (status === 1) return "active";
    if (status === 0) return "pending";
    if (status === 2) return "rejected";
  }
  const normalized = String(status).toLowerCase();
  if (normalized === "approved" || normalized === "active") return "active";
  if (normalized === "pending") return "pending";
  if (normalized === "rejected") return "rejected";
  return normalized;
};

const statusMatchesFilter = (status: string | number | null | undefined, filter: StatusFilter) => {
  if (filter === "All") return true;
  const normalized = normalizeStatus(status);
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

const formatPrice = (value?: number | null, currency?: string | number | null) => {
  if (value == null) return "-";
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
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (symbol) return `${symbol} ${formatted}`;
  if (code) return `${formatted} ${code}`;
  return formatted;
};

export default function MyProducts() {
  const { t } = useLocale();
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
            setError(t("products.errorAuth"));
          }
          return;
        }

        const products = await fetchMyProducts();
        if (!cancelled) {
          setItems(products ?? []);
        }
      } catch (err: any) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setError(t("products.errorExpired"));
          setItems([]);
        } else {
          setError(err?.message || t("products.errorGeneric"));
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
  }, [t]);

  const filtered = useMemo(() => {
    if (!items.length) return [];
    return items.filter((item) => statusMatchesFilter(item.status, filter));
  }, [items, filter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Title className="font-semibold text-white" size="lg">
          {t("products.myTitle")}
        </Title>

        <div className="flex justify-end">
          <Button
            variant="submit"
            label={t("products.newListing")}
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
            className={`${filter === f ? "text-[var(--success)] underline" : "sort-label"} transition`}
          >
            {f === "All"
              ? t("products.filterAll")
              : f === "Active"
              ? t("products.filterActive")
              : f === "Rejected"
              ? t("products.filterRejected")
              : t("products.filterPending")}
          </button>
        ))}
      </div>

      <div className="border-t border-[var(--divider)]" />

      {loading && <div className="text-sm text-gray-400">{t("products.loading")}</div>}
      {error && !loading && <div className="text-sm text-red-400">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-sm text-gray-500">{t("products.empty")}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
        {filtered.map((product) => (
          <ViewProductCardSearch
            key={product.id}
            name={product.name}
            description={" "}
            price={formatPrice(product.price, product.currency)}
            image={getFirstPublicImageUrl(product.mediaFiles) || "/default-product.jpg"}
            buttonLabel={t("common.details")}
            productId={product.id}
            onClick={() => router.push(`/product/${product.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
