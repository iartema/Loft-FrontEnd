"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Almarai } from "next/font/google";
import { useRouter, useSearchParams } from "next/navigation";
import SimpleSelect from "../molecules/SimpleSelect";
import FilterSection from "../molecules/FilterSection";
import ActiveFilterChips from "../molecules/ActiveFilterChips";
import ViewProductCardSearch from "../molecules/ViewProductCardSearch";
import CategoryModal from "../molecules/CategoryModal";
import {
  fetchCategories,
  fetchCategoryAttributes,
  type CategoryDto,
  type CategoryAttributeFullDto,
  type ProductDto,
  searchProductsExternal,
  type ProductAttributeFilterDto,
  fetchFavoriteItems,
  addFavoriteProduct,
  removeFavoriteProduct,
  ApiError,
  fetchPublicUserById,
  type PublicUserDto,
} from "../lib/api";
import { getFirstPublicImageUrl } from "../../lib/media";
import {
  normalizeProductType,
  type ProductTypeKind,
  productTypeLabel,
} from "../../lib/productTypes";
import { useLocale } from "../../i18n/LocaleProvider";
// import { mockCategories, mockFetchAttributesByCategory } from "../lib/mockCatalog";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

function resolveFavoriteProductId(entry: any): number | null {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === "number" && Number.isFinite(entry)) return entry;

  if (typeof entry === "string") {
    const parsed = Number(entry);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof entry === "object") {
    if (typeof entry.productId === "number") return entry.productId;
    if (typeof entry.ProductId === "number") return entry.ProductId;
    if (entry.product && typeof entry.product.id === "number") return entry.product.id;
    if (entry.Product && typeof entry.Product.Id === "number") return entry.Product.Id;
    if (typeof entry.id === "number" && !("productId" in entry) && !("ProductId" in entry)) return entry.id;
  }
  return null;
}

type SortOption = "views" | "price_desc" | "price_asc" | "season";
type FlatCategory = { ID: number; Name: string; ParentCategoryId: number | null; Status?: string; Type?: ProductTypeKind };

const formatPrice = (value?: number | null, currency?: string | number | null) => {
  if (value == null) return "";
  const symbolMap: Record<string, string> = { USD: "$", UAH: "₴", 0: "₴", 1: "$" };
  const codeMap: Record<string, string> = { 0: "UAH", 1: "USD" };
  const key =
    currency == null ? "" : typeof currency === "number" ? String(currency) : currency.toString().toUpperCase();
  const symbol = key ? symbolMap[key] : "";
  const code = key ? codeMap[key] ?? key : "";
  const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  if (symbol) return `${symbol} ${formatted}`;
  if (code) return `${formatted} ${code}`;
  return formatted;
};

export default function SearchView() {
  const { t } = useLocale();
  const params = useSearchParams();
  const qParam = params.get("q") ?? "";
  const categoryParam = params.get("categoryId") ?? params.get("category");
  const sellerParam = params.get("sellerId") ?? params.get("seller");
  const sortParam = params.get("sort");
  const router = useRouter();

  const [query, setQuery] = useState(qParam);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [attrFilters, setAttrFilters] = useState<Record<number, string | number | boolean | string[] | null>>({});
  const [allCategories, setAllCategories] = useState<FlatCategory[]>([]);
  const [categoryAttrs, setCategoryAttrs] = useState<{ ID: number; Name: string; Type: "text" | "number" | "select" | "multiselect" | "boolean" | "color"; Value?: string }[]>([]);
  const [attributeSuggestions, setAttributeSuggestions] = useState<Record<number, string[]>>({});
  type ProductWithFavorite = ProductDto & { isFavorite?: boolean };
  const [items, setItems] = useState<ProductWithFavorite[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteBusyIds, setFavoriteBusyIds] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("views");
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [sellerInfo, setSellerInfo] = useState<PublicUserDto | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [productType, setProductType] = useState<ProductTypeKind | null>("physical");
  const [catModalOpen, setCatModalOpen] = useState(false);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    const normalized = (sortParam || "").toLowerCase();
    if (normalized === "price_desc" || normalized === "price_asc" || normalized === "views" || normalized === "season") {
      setSortBy(normalized as SortOption);
    }
  }, [sortParam]);

  useEffect(() => {
    const parsed = categoryParam ? Number(categoryParam) : null;
    setCategoryId(Number.isFinite(parsed) ? parsed : null);
  }, [categoryParam]);

  useEffect(() => {
    if (!categoryId || !allCategories.length) return;
    const found = allCategories.find((c) => c.ID === categoryId);
    if (found?.Type) setProductType(found.Type);
  }, [categoryId, allCategories]);

  useEffect(() => {
    const parsed = sellerParam ? Number(sellerParam) : null;
    setSellerId(Number.isFinite(parsed) ? parsed : null);
  }, [sellerParam]);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(1, totalPages)));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [sortBy]);

  useEffect(() => {
    let active = true;
    const loadFavorites = async () => {
      try {
        const list = await fetchFavoriteItems();
        if (!active) return;
        const next = new Set<number>();
        for (const id of list) {
          if (Number.isFinite(id)) next.add(Number(id));
        }
        setFavoriteIds(next);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          if (active) setFavoriteIds(new Set());
        } else {
          console.error("Failed to load favorites", err);
        }
      }
    };
    loadFavorites();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setItems((prev) => prev.map((item) => ({ ...item, isFavorite: favoriteIds.has(item.id) })));
  }, [favoriteIds]);

  useEffect(() => {
    const flatten = (list: CategoryDto[], acc: FlatCategory[] = []) => {
      for (const c of list) {
        const typeVal = normalizeProductType(
          (c as any).type ?? (c as any).Type ?? (c as any).productType ?? (c as any).ProductType
        );
        acc.push({
          ID: c.id,
          Name: c.name,
          ParentCategoryId: c.parentCategoryId ?? null,
          Status: c.status ?? undefined,
          Type: typeVal ?? undefined,
        });
        if (c.subCategories && c.subCategories.length) flatten(c.subCategories, acc);
      }
      return acc;
    };
    fetchCategories().then((cats) => setAllCategories(flatten(cats))).catch(() => setAllCategories([]));
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setCategoryAttrs([]);
      setAttributeSuggestions({});
      return;
    }
    setAttributeSuggestions({});

    const buildType = (attr: CategoryAttributeFullDto, opts: string[]) => {
      const lowerName = attr.attributeName?.toLowerCase() ?? "";
      const typeVal = String(attr.type ?? "").toLowerCase();
      const display = String(attr.typeDisplayName ?? "").toLowerCase();
      if (typeVal.includes("multi") || display.includes("multi")) return "multiselect";
      if (typeVal.includes("bool") || display.includes("bool")) return "boolean";
      if (typeVal.includes("number") || display.includes("number")) return "number";
      if (opts.length) return "select";
      return "text";
    };

    const convertAttribute = (attr: CategoryAttributeFullDto) => {
      const opts = attr.optionsJson ? safeParseOptions(attr.optionsJson) : [];
      return {
        ID: attr.attributeId,
        Name: attr.attributeName,
        Type: buildType(attr, opts) as "text" | "number" | "select" | "multiselect" | "boolean",
        Value: opts.join("|") || undefined,
      };
    };

    const collectCategoryChain = (id: number): number[] => {
      const chain: number[] = [];
      let current = allCategories.find((c) => c.ID === id);
      while (current) {
        chain.push(current.ID);
        current = current.ParentCategoryId
          ? allCategories.find((c) => c.ID === current!.ParentCategoryId)
          : undefined;
      }
      // ensure unique order (closest category first)
      return Array.from(new Set(chain));
    };

    let cancelled = false;
    const loadAttributes = async () => {
      const chain = collectCategoryChain(categoryId);
      if (!chain.length) {
        setCategoryAttrs([]);
        return;
      }
      try {
        const batches = await Promise.all(
          chain.map(async (id) => {
            try {
              return await fetchCategoryAttributes(id);
            } catch {
              return [];
            }
          })
        );
        if (cancelled) return;
        const merged = new Map<number, { ID: number; Name: string; Type: "text" | "number" | "select" | "multiselect" | "boolean" | "color"; Value?: string }>();
        for (const batch of batches) {
          for (const attr of batch) {
            if (!merged.has(attr.attributeId)) {
              merged.set(attr.attributeId, convertAttribute(attr));
            }
          }
        }
        const result = Array.from(merged.values()).sort((a, b) => String(a.Name).localeCompare(String(b.Name)));
        setCategoryAttrs(result);
      } catch {
        if (!cancelled) setCategoryAttrs([]);
      }
    };

    loadAttributes();
    return () => {
      cancelled = true;
    };
  }, [categoryId, allCategories]);

  function safeParseOptions(json: string): string[] {
    try { const arr = JSON.parse(json); return Array.isArray(arr) ? arr.map(String) : []; } catch { return []; }
  }
    // initialize attribute filters when category changes
  useEffect(() => {
    const next: Record<number, string | number | boolean | string[] | null> = {};
    for (const a of categoryAttrs) {
      next[a.ID] = getInitialAttributeValue(a.Type);
    }
    setAttrFilters(next);
  }, [categoryAttrs]);

  const getInitialAttributeValue = (type: "text" | "number" | "select" | "multiselect" | "boolean" | "color") => {
    if (type === "multiselect" || type === "color") return [];
    if (type === "boolean") return null;
    return "";
  };

  useEffect(() => {
    let cancelled = false;
    const runSearch = async () => {
      const attrs: ProductAttributeFilterDto[] = Object.entries(attrFilters).flatMap(([id, value]) => {
        if (value == null) return [];
        if (typeof value === "string" && value.trim() === "") return [];
        if (Array.isArray(value)) {
          const values = value.map(String).filter(Boolean);
          if (values.length === 0) return [];
          return [{ attributeId: Number(id), value: values.join("|") }];
        }
        if (typeof value === "boolean") {
          return [{ attributeId: Number(id), value: String(value) }];
        }
        return [{ attributeId: Number(id), value: String(value) }];
      });

      const res = await searchProductsExternal({
        search: query || undefined,
        categoryId: categoryId ?? undefined,
        sellerId: sellerId ?? undefined,
        minPrice: priceMin ?? undefined,
        maxPrice: priceMax ?? undefined,
        attributeFilters: attrs.length ? attrs : undefined,
        page,
        pageSize,
      });
      if (cancelled) return;
      let filtered = res.items || [];

      const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
      const toDate = (value: any): number | null => {
        if (!value) return null;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d.getTime();
      };

      const sortViews = (list: ProductDto[]) =>
        [...list].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

      if (sortBy === "price_desc") {
        filtered = [...filtered].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      } else if (sortBy === "price_asc") {
        filtered = [...filtered].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      } else if (sortBy === "season") {
        const seasonal = filtered.filter((item) => {
          const created = toDate((item as any).createdAt ?? (item as any).CreatedAt);
          return created !== null && created >= cutoff;
        });
        filtered = seasonal.length ? sortViews(seasonal) : sortViews(filtered);
      } else {
        filtered = sortViews(filtered);
      }

      setItems(
        filtered.map((product) => ({
          ...product,
          isFavorite: favoriteIds.has(product.id),
        }))
      );
      collectAttributeSuggestions(filtered);
      setTotalPages(Math.max(1, res.totalPages || 1));
    };
    runSearch();
    return () => {
      cancelled = true;
    };
  }, [query, categoryId, priceMin, priceMax, attrFilters, sortBy, page, sellerId]);

  useEffect(() => {
    setPage(1);
  }, [query, categoryId, priceMin, priceMax, attrFilters, sellerId]);

  const clearFilters = () => {
    setCategoryId(null);
    setPriceMin(null);
    setPriceMax(null);
    setAttrFilters({});
    setSellerId(null);
    setProductType("physical");
  };

  const applySuggestionValue = useCallback(
    (attr: { ID: number; Type: "text" | "number" | "select" | "multiselect" | "boolean" | "color" }, value: string) => {
      const normalized = value.trim();
      if (!normalized) return;
      setAttrFilters((prev) => {
        const next = { ...prev };
        if (attr.Type === "multiselect" || attr.Type === "color") {
          const current = Array.isArray(next[attr.ID]) ? [...(next[attr.ID] as string[])] : [];
          if (!current.includes(normalized)) current.push(normalized);
          next[attr.ID] = current;
        } else if (attr.Type === "boolean") {
          const boolVal = normalized.toLowerCase() === "true" || normalized === "1" || normalized.toLowerCase() === "yes";
          next[attr.ID] = boolVal;
        } else {
          next[attr.ID] = normalized;
        }
        return next;
      });
    },
    []
  );

  const collectAttributeSuggestions = (products: ProductDto[]) => {
    if (!categoryId) return;
    const map = new Map<number, Set<string>>();
    for (const product of products) {
      for (const attr of product.attributeValues ?? []) {
        const id = attr.attributeId;
        if (id == null) continue;
        const parts = String(attr.value ?? "")
          .split("|")
          .map((part) => part.trim())
          .filter(Boolean);
        if (!parts.length) continue;
        if (!map.has(id)) map.set(id, new Set());
        const bucket = map.get(id)!;
        parts.forEach((val) => bucket.add(val));
      }
    }
    const suggestions: Record<number, string[]> = {};
    map.forEach((set, id) => {
      suggestions[id] = Array.from(set).slice(0, 8);
    });
    setAttributeSuggestions((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        const id = Number(key);
        if (!categoryAttrs.some((attr) => attr.ID === id)) {
          delete next[id];
        }
      });
      Object.entries(suggestions).forEach(([id, values]) => {
        if (!next[Number(id)] || (next[Number(id)]?.length === 0 && values.length)) {
          next[Number(id)] = values;
        }
      });
      return next;
    });
  };

  const handleToggleFavorite = useCallback(
    async (productId: number) => {
      if (!productId) return;
      setFavoriteBusyIds((prev) => {
        const next = new Set(prev);
        next.add(productId);
        return next;
      });
      const currentlyFavorite = favoriteIds.has(productId);
      try {
        if (currentlyFavorite) {
          await removeFavoriteProduct(productId);
        } else {
          await addFavoriteProduct(productId);
        }
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (currentlyFavorite) {
            next.delete(productId);
          } else {
            next.add(productId);
          }
          return next;
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
        } else {
          console.error("Failed to toggle favorite", err);
        }
      } finally {
        setFavoriteBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    [favoriteIds, router]
  );

  const paged = items;

  const categoryName = useMemo(() => {
    if (!categoryId) return undefined;
    const path: string[] = [];
    let current = allCategories.find((c) => c.ID === categoryId);
    while (current) {
      path.unshift(current.Name);
      current = current.ParentCategoryId
        ? allCategories.find((c) => c.ID === current!.ParentCategoryId)
        : undefined;
    }
    return path.join(" > ") || allCategories.find((c) => c.ID === categoryId)?.Name;
  }, [categoryId, allCategories]);

  const attributeChips = useMemo(
    () =>
      categoryAttrs
        .map((attr) => {
          const val = attrFilters[attr.ID];
          if (val == null) return null;
          if (typeof val === "string" && val.trim() === "") return null;
          if (Array.isArray(val) && val.length === 0) return null;
          const display =
            Array.isArray(val) ? val.join(", ") : typeof val === "boolean" ? (val ? "Yes" : "No") : String(val);
          return {
            label: `${attr.Name}: ${display}`,
            onClear: () => setAttrFilters((prev) => ({ ...prev, [attr.ID]: getInitialAttributeValue(attr.Type) })),
          };
        })
        .filter(Boolean) as { label: string; onClear: () => void }[],
    [categoryAttrs, attrFilters]
  );

  useEffect(() => {
    if (!sellerId) {
      setSellerInfo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setSellerLoading(true);
        const user = await fetchPublicUserById(sellerId);
        if (!cancelled) setSellerInfo(user);
      } catch {
        if (!cancelled) setSellerInfo(null);
      } finally {
        if (!cancelled) setSellerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  const sellerCard = sellerId ? (
    <div className={`${almarai.className} flex items-center gap-3 px-6 py-3 rounded-2xl pt-4 pb-4 justify-center min-w-[280px]`}>
      {sellerLoading ? (
        <span className="text-white/70 text-sm sort-label">Loading seller…</span>
      ) : sellerInfo ? (
        <>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-elev-3)] flex-shrink-0">
            <img
              src={sellerInfo.avatarUrl && sellerInfo.avatarUrl.trim().length ? sellerInfo.avatarUrl : "/default-avatar.jpg"}
              alt={`${sellerInfo.firstName ?? ""} ${sellerInfo.lastName ?? ""}`.trim() || "Seller"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-sm">
            <div className="text-white font-semibold sort-label">
              {[sellerInfo.firstName, sellerInfo.lastName].filter(Boolean).join(" ").trim() || "Seller"}
            </div>
            <span className="text-white/60 text-sm sort-label">Seller</span>
          </div>
        </>
      ) : (
        <span className="text-white/60 text-sm sort-label">Seller filter active</span>
      )}
    </div>
  ) : null;

  const availableCategories = useMemo(
    () => allCategories.filter((c) => (c.Status ?? "approved") !== "rejected"),
    [allCategories]
  );

  const handleSelectCategory = useCallback(
    (id: number) => {
      setCategoryId(id);
      const found = allCategories.find((c) => c.ID === id);
      if (found?.Type) setProductType(found.Type);
      setCatModalOpen(false);
    },
    [allCategories]
  );

  return (
    <main className="min-h-screen w-[97.5%] bg-[var(--bg-body)] text-white ml-12">
      {/* Active filters chips spanning full width, above sidebar/results */}
      <div className="flex flex-row items-center justify-between gap-4 w-full border-b border-[var(--divider)]">
        <ActiveFilterChips
          query={query}
          categoryName={categoryName}
          priceMin={priceMin}
          priceMax={priceMax}
          onClearQuery={() => setQuery("")}
          onClearCategory={() => {
            setCategoryId(null);
            setProductType("physical");
          }}
          onClearMin={() => setPriceMin(null)}
          onClearMax={() => setPriceMax(null)}
          attributes={attributeChips}
          className={`w-full ${almarai.className}`}
        />
        <div className="relative w-full flex items-center min-h-[56px] pr-[280px]">
          <div className="flex-1 flex justify-center">{sellerCard}</div>
          <div className={`${almarai.className} flex items-center gap-2 absolute right-0 mr-12`}>
            <span className="text-sm sort-label">{t("search.sortBy")}</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-[var(--bg-filter-inner)] text-white px-3 pr-14 py-2 rounded-[12px] border border-transparent focus:outline-none focus:border-[var(--divider)] text-md"
                style={{ boxShadow: "0 2px 4px 0px rgba(0, 0, 0, 0.45)" }}
              >
                <option value="views">{t("search.sortViews")}</option>
                <option value="season">{t("search.sortSeason")}</option>
                <option value="price_desc">{t("search.sortPriceHigh")}</option>
                <option value="price_asc">{t("search.sortPriceLow")}</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/80 text-xs sort-label">
                ▼
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-6">
        {/* Filters (no local search field here as per spec) */}
        <aside className={`search-sidebar rounded-2xl p-0 space-y-0 h-fit sticky top-4 ${almarai.className}` }>
          <FilterSection title={t("search.category")}>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setCatModalOpen(true)}
                className="w-full bg-[var(--bg-filter-inner)] text-white px-3 py-2 text-sm rounded-[12px] border border-[var(--divider)] hover:border-[var(--brand)] text-left"
                style={{ boxShadow: "0 2px 6px -2px rgba(0, 0, 0, 0.45)" }}
              >
                {categoryName || t("search.all")}
              </button>
              {productType && (
                <div className="text-xs text-white/60 sort-label">
                  {t("search.typeLabel")}: {productTypeLabel(productType)}
                </div>
              )}
            </div>
          </FilterSection>
          {categoryId &&
            categoryAttrs.length > 0 &&
            categoryAttrs.map((a) => {
              const suggestions = attributeSuggestions[a.ID] ?? [];
              return (
                <FilterSection key={a.ID} title={a.Name}>
              {a.Type === "text" && (
                <input
                  type="text"
                  placeholder={t("search.attributePlaceholder")}
                  value={(attrFilters[a.ID] as string) ?? ""}
                  onChange={(e) => setAttrFilters((s) => ({ ...s, [a.ID]: e.target.value }))}
                  className={`w-full bg-[var(--bg-filter-inner)] text-white px-3 py-2 text-sm rounded-[12px] outline-none border border-transparent focus:outline-none focus:border-[var(--divider)] ${almarai.className}`}
                  style={{ boxShadow: "0 2px 6px -2px rgba(0, 0, 0, 0.45)" }}
                />
              )}
              {a.Type === "number" && (
                <input
                  type="number"
                  placeholder={`Type the ${a.Name.toLowerCase()}...`}
                  value={String((attrFilters[a.ID] as number) ?? "")}
                  onChange={(e) => setAttrFilters((s) => ({ ...s, [a.ID]: e.target.value }))}
                  className={`w-full bg-[var(--bg-filter-inner)] text-white px-3 py-2 text-sm rounded-[12px] outline-none border border-transparent focus:outline-none focus:border-[var(--divider)] ${almarai.className}`}
                />
              )}
              {a.Type === "select" && (
                <SimpleSelect
                  value={String((attrFilters[a.ID] as string) ?? "")}
                  onChange={(val) => setAttrFilters((s) => ({ ...s, [a.ID]: val }))}
                  options={(a.Value || "").split("|").filter(Boolean).map((opt) => ({ value: opt, label: opt }))}
                  placeholder="Any"
                  className={`${almarai.className}`}
                />
              )}
              {a.Type === "multiselect" && (
                <div className="space-y-1">
                  {(a.Value || "").split("|").filter(Boolean).map((opt) => {
                    const arr = (attrFilters[a.ID] as string[]) || [];
                    const checked = arr.includes(opt);
                    return (
                      <label key={opt} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setAttrFilters((s) => {
                              const cur = (s[a.ID] as string[]) || [];
                              const next = checked ? cur.filter((v) => v !== opt) : [...cur, opt];
                              return { ...s, [a.ID]: next };
                            });
                          }}
                        />
                        <span className="opacity-80">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {a.Type === "boolean" && (
                <div className="flex gap-2">
                  {[{ label: "Yes", val: true }, { label: "No", val: false }].map(({ label, val }) => (
                    <button
                      key={String(val)}
                      type="button"
                      className={`px-3 py-1 rounded ${attrFilters[a.ID] === val ? "bg-[var(--brand)] text-black" : "bg-[var(--bg-elev-3)]"}`}
                      onClick={() => setAttrFilters((s) => ({ ...s, [a.ID]: val }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {a.Type === "color" && (
                <div className="flex flex-wrap gap-2">
                  {(a.Value || "").split("|").filter(Boolean).map((opt) => {
                    const arr = (attrFilters[a.ID] as string[]) || [];
                    const active = arr.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() =>
                          setAttrFilters((s) => {
                            const cur = (s[a.ID] as string[]) || [];
                            const next = active ? cur.filter((v) => v !== opt) : [...cur, opt];
                            return { ...s, [a.ID]: next };
                          })
                        }
                        className={`px-2 py-1 rounded ${active ? "bg-[var(--brand)] text-black" : "bg-[var(--bg-elev-3)]"}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {a.Type !== "boolean" && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => applySuggestionValue(a, opt)}
                      className="px-3 py-1 text-xs rounded-full bg-[var(--bg-filter-inner)] border border-[var(--divider)] hover:border-[var(--brand)]"
                      style={{ boxShadow: "0 2px 6px -2px rgba(0, 0, 0, 0.45)" }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
                </FilterSection>
              );
            })}
          {categoryId && categoryAttrs.length === 0 && (
            <FilterSection title={t("search.attributes")} defaultOpen>
              <p className="text-xs opacity-70">{t("search.noFilters")}</p>
            </FilterSection>
          )}
          <FilterSection title={t("search.price")}>
        <div className={`flex items-center gap-2 ${almarai.className}`}>
              <input
                type="number"
                placeholder={t("search.min")}
                value={priceMin ?? ""}
                onChange={(e) => setPriceMin(e.target.value === "" ? null : Number(e.target.value))}
                className={`w-full bg-[var(--bg-filter-inner)] text-white px-3 py-2 text-sm rounded-[12px] outline-none border border-transparent focus:ring-0 focus:outline-none focus:border-[var(--divider)] ${almarai.className}` }
                style={{ boxShadow: "0 2px 6px -2px rgba(0, 0, 0, 0.45)" }}
              />
              <span className="opacity-50">-</span>
              <input
                type="number"
                placeholder={t("search.max")}
                value={priceMax ?? ""}
                onChange={(e) => setPriceMax(e.target.value === "" ? null : Number(e.target.value))}
                className={`w-full bg-[var(--bg-filter-inner)] text-white px-3 py-2 text-sm rounded-[12px] outline-none border border-transparent focus:ring-0 focus:outline-none focus:border-[var(--divider)] ${almarai.className}` }
                style={{ boxShadow: "0 2px 6px -2px rgba(0, 0, 0, 0.45)" }}
              />
            </div>
          </FilterSection>
          <button
            onClick={clearFilters}
            className={`w-full bg-[var(--bg-filter)] text-white px-3 py-2 text-sm border-b border-[var(--divider)] ${almarai.className}` }
          >
            {t("search.clearFilters")}
          </button>
        </aside>

        {/* Results */}
        <section className="space-y-4 flex flex-col min-h-[100vh]">
          <div className="flex items-center justify-between">
          </div>



          {/* Responsive product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-3 w-[98%]">
            {paged.length === 0 && (
              <div className="opacity-70 col-span-full">{t("search.noResults")}</div>
            )}
            {paged.map((p) => (
              <ViewProductCardSearch
                key={p.id}
                name={p.name}
                productId={p.id}
                description={`${p.viewCount ?? 0} ${t("search.viewsSuffix")}`}
                price={formatPrice(p.price, p.currency)}
                image={getFirstPublicImageUrl(p.mediaFiles) || "/default-product.jpg"}
                buttonLabel={t("search.viewButton")}
                onClick={() => router.push(`/product/${p.id}`)}
                isFavorite={Boolean(p.isFavorite)}
                favoriteBusy={favoriteBusyIds.has(p.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

          {/* Pagination (ASCII arrows to avoid encoding issues) */}
          <div className="flex items-center justify-center gap-2 py-4 select-none mt-auto">
            <button
              className="px-3 py-1 rounded bg-[var(--bg-elev-1)] hover:bg-[var(--bg-elev-1)] disabled:opacity-40"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {"<"}
            </button>
            {(() => {
              const windowSize = 9;
              const start = Math.max(1, Math.min(page - Math.floor(windowSize / 2), totalPages - windowSize + 1));
              const end = Math.min(totalPages, start + windowSize - 1);
              const buttons = [];
              if (start > 1) {
                buttons.push(
                  <button
                    key={1}
                    onClick={() => setPage(1)}
                    className={`px-3 py-1 rounded ${
                      page === 1 ? "bg-[var(--bg-input)]" : "bg-[var(--bg-elev-1)] hover:bg-[var(--bg-elev-1)]"
                    }`}
                  >
                    1
                  </button>
                );
                if (start > 2) buttons.push(<span key="start-ellipsis" className="px-2 opacity-60">...</span>);
              }
              for (let n = start; n <= end; n++) {
                buttons.push(
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3 py-1 rounded ${
                      page === n ? "bg-[var(--bg-input)]" : "bg-[var(--bg-elev-1)] hover:bg-[var(--bg-elev-1)]"
                    }`}
                  >
                    {n}
                  </button>
                );
              }
              if (end < totalPages) {
                if (end < totalPages - 1) buttons.push(<span key="end-ellipsis" className="px-2 opacity-60">...</span>);
                buttons.push(
                  <button
                    key={totalPages}
                    onClick={() => setPage(totalPages)}
                    className={`px-3 py-1 rounded ${
                      page === totalPages ? "bg-[var(--bg-input)]" : "bg-[var(--bg-elev-1)] hover:bg-[var(--bg-elev-1)]"
                    }`}
                  >
                    {totalPages}
                  </button>
                );
              }
              return buttons;
            })()}
            <button
              className="px-3 py-1 rounded bg-[var(--bg-elev-1)] hover:bg-[var(--bg-elev-1)] disabled:opacity-40"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {">"}
            </button>
          </div>
        </section>
      </div>
      <CategoryModal
        open={catModalOpen}
        categories={availableCategories}
        selectedId={categoryId}
        productType={productType}
        onSelectType={(type) => setProductType(type)}
        onClose={() => setCatModalOpen(false)}
        onSelect={handleSelectCategory}
      />
    </main>
  );
}
