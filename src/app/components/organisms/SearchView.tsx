"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Almarai } from "next/font/google";
import { useRouter, useSearchParams } from "next/navigation";
import SimpleSelect from "../molecules/SimpleSelect";
import FilterSection from "../molecules/FilterSection";
import ActiveFilterChips from "../molecules/ActiveFilterChips";
import ViewProductCardSearch from "../molecules/ViewProductCardSearch";
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
} from "../lib/api";
import { getFirstPublicImageUrl } from "../../lib/media";
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

export default function SearchView() {
  const params = useSearchParams();
  const qParam = params.get("q") ?? "";
  const router = useRouter();

  const [query, setQuery] = useState(qParam);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [attrFilters, setAttrFilters] = useState<Record<number, string | number | boolean | string[] | null>>({});
  const [allCategories, setAllCategories] = useState<{ ID: number; Name: string; ParentCategoryId: number | null; Status?: string }[]>([]);
  const [categoryAttrs, setCategoryAttrs] = useState<{ ID: number; Name: string; Type: "text" | "number" | "select" | "multiselect" | "boolean" | "color"; Value?: string }[]>([]);
  const [attributeSuggestions, setAttributeSuggestions] = useState<Record<number, string[]>>({});
  type ProductWithFavorite = ProductDto & { isFavorite?: boolean };
  const [items, setItems] = useState<ProductWithFavorite[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteBusyIds, setFavoriteBusyIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

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
    const flatten = (list: CategoryDto[], acc: { ID: number; Name: string; ParentCategoryId: number | null; Status?: string }[] = []) => {
      for (const c of list) {
        acc.push({ ID: c.id, Name: c.name, ParentCategoryId: c.parentCategoryId ?? null, Status: c.status ?? undefined });
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

  const doSearch = useCallback(async () => {
    const attrs: ProductAttributeFilterDto[] = Object.entries(attrFilters).flatMap(([id, value]) => {
      if (value == null) return [];
      if (typeof value === "string" && value.trim() === "") return [];
      if (Array.isArray(value)) {
        if (value.length === 0) return [];
        return [{ attributeId: Number(id), values: value.map(String) }];
      }
      if (typeof value === "boolean") {
        return [{ attributeId: Number(id), value: String(value) }];
      }
      return [{ attributeId: Number(id), value: String(value) }];
    });

    const res = await searchProductsExternal({
      search: query || undefined,
      categoryId: categoryId ?? undefined,
      priceMin: priceMin ?? undefined,
      priceMax: priceMax ?? undefined,
      attributeFilters: attrs.length ? attrs : undefined,
    });
    setItems(res || []);
    collectAttributeSuggestions(res || []);
    setPage(1);
  }, [query, categoryId, priceMin, priceMax, attrFilters]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  const clearFilters = () => {
    setCategoryId(null);
    setPriceMin(null);
    setPriceMax(null);
    setAttrFilters({});
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

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);

  const categoryName = useMemo(
    () => allCategories.find((c) => c.ID === (categoryId ?? -1))?.Name,
    [categoryId, allCategories]
  );

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

  return (
    <main className="min-h-screen w-full bg-[var(--bg-body)] text-white px-8 py-6 ml-5">
      {/* Active filters chips spanning full width, above sidebar/results */}
      <ActiveFilterChips
        query={query}
        categoryName={categoryName}
        priceMin={priceMin}
        priceMax={priceMax}
        onClearQuery={() => setQuery("")}
        onClearCategory={() => setCategoryId(null)}
        onClearMin={() => setPriceMin(null)}
        onClearMax={() => setPriceMax(null)}
        attributes={attributeChips}
      />

      <div className="grid grid-cols-[240px_1fr] gap-6">
        {/* Filters (no local search field here as per spec) */}
        <aside className={`rounded-2xl p-0 space-y-0 h-fit sticky top-4 ${almarai.className}` }>
          <FilterSection title="Category">
            <SimpleSelect
              value={categoryId != null ? String(categoryId) : ""}
              onChange={(val) => setCategoryId(val ? Number(val) : null)}
              options={allCategories
                .filter((c) => (c.Status ?? "approved") !== "rejected")
                .map((c) => ({ value: String(c.ID), label: c.Name }))}
              placeholder="All"
              className={`${almarai.className}`}
            />
          </FilterSection>
          {categoryId &&
            categoryAttrs.length > 0 &&
            categoryAttrs.map((a) => {
              const suggestions = attributeSuggestions[a.ID] ?? [];
              return (
                <FilterSection key={a.ID} title={a.Name} defaultOpen>
              {a.Type === "text" && (
                <input
                  type="text"
                  placeholder={`Type the ${a.Name.toLowerCase()}...`}
                  value={(attrFilters[a.ID] as string) ?? ""}
                  onChange={(e) => setAttrFilters((s) => ({ ...s, [a.ID]: e.target.value }))}
                  className={`w-full bg-[var(--bg-filter-inner)] text-white px-3 py-2 text-sm rounded-[12px] outline-none border border-transparent focus:outline-none focus:border-[var(--divider)] ${almarai.className}`}
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
            <FilterSection title="Attributes" defaultOpen>
              <p className="text-xs opacity-70">This category has no filters.</p>
            </FilterSection>
          )}
          {categoryId && ( <FilterSection title="Price">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceMin ?? ""}
                onChange={(e) => setPriceMin(e.target.value === "" ? null : Number(e.target.value))}
                className={`w-full bg-[var(--bg-filter-inner)] text-white px-3 py-2 text-sm rounded-[12px] outline-none border border-transparent focus:ring-0 focus:outline-none focus:border-[var(--divider)] ${almarai.className}` }
              />
              <span className="opacity-50">-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax ?? ""}
                onChange={(e) => setPriceMax(e.target.value === "" ? null : Number(e.target.value))}
                className={`w-full bg-[var(--bg-filter-inner)] text-white px-3 py-2 text-sm rounded-[12px] outline-none border border-transparent focus:ring-0 focus:outline-none focus:border-[var(--divider)] ${almarai.className}` }
              />
            </div>
          </FilterSection> )}
          <button
            onClick={clearFilters}
            className={`w-full bg-[var(--bg-filter)] text-white px-3 py-2 text-sm border-b border-[var(--divider)] ${almarai.className}` }
          >
            Clear filters
          </button>
        </aside>

        {/* Results */}
        <section className="space-y-4 flex flex-col min-h-[100vh]">
          <div className="flex items-center justify-between">
          </div>



          {/* 5 columns per row to match spec */}
          <div className="grid grid-cols-5 gap-y-3 w-[98%]">
            {paged.length === 0 && (
              <div className="opacity-70 col-span-full">No products match your filters.</div>
            )}
            {paged.map((p) => (
              <ViewProductCardSearch
                key={p.id}
                name={p.name}
                productId={p.id}
                description={`${p.viewCount ?? 0} views`}
                price={`${['₴', '$'][p.currency]} ${p.price}`}
                image={getFirstPublicImageUrl(p.mediaFiles) || "/default-product.jpg"}
                buttonLabel="View"
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
            {Array.from({ length: totalPages }).slice(0, 9).map((_, i) => {
              const n = i + 1;
              return (
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
            })}
            {totalPages > 9 && (
              <span className="px-2 opacity-60">... {totalPages}</span>
            )}
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
    </main>
  );
}
