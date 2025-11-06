"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ViewProductCardSearch from "../molecules/ViewProductCardSearch";
import {
  searchProducts,
  type Product,
  currencySymbol,
  type ID,
} from "../lib/mockProduct";
import { mockCategories, mockFetchAttributesByCategory } from "../lib/mockCatalog";

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#1f1f1f] rounded-lg">
      <button
        className="w-full flex items-center justify-between px-3 py-2 bg-[#181818] hover:bg-[#1c1c1c] text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="opacity-80">{title}</span>
        <span className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`}>v</span>
      </button>
      {open && <div className="p-3 bg-[#161616]">{children}</div>}
    </div>
  );
}

export default function SearchView() {
  const params = useSearchParams();
  const qParam = params.get("q") ?? "";
  const router = useRouter();

  const [query, setQuery] = useState(qParam);
  const [categoryId, setCategoryId] = useState<ID | null>(null);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  const categoryAttrs = useMemo(
    () => mockFetchAttributesByCategory(categoryId ?? null),
    [categoryId]
  );
  const colorOptions = useMemo(() => {
    const colorAttr = categoryAttrs.find((a) => a.Name.toLowerCase() === "color");
    if (!colorAttr || !colorAttr.Value) return [] as string[];
    return colorAttr.Value.split("|");
  }, [categoryAttrs]);

  const doSearch = useCallback(async () => {
    const res = await searchProducts({
      query,
      categoryId: categoryId ?? undefined,
      priceMin: priceMin ?? undefined,
      priceMax: priceMax ?? undefined,
      color: color ?? undefined,
    });
    setItems(res);
    setPage(1);
  }, [query, categoryId, priceMin, priceMax, color]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  const clearFilters = () => {
    setCategoryId(null);
    setPriceMin(null);
    setPriceMax(null);
    setColor(null);
  };

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);

  const categoryName = useMemo(
    () => mockCategories.find((c) => c.ID === (categoryId ?? -1))?.Name,
    [categoryId]
  );

  return (
    <main className="min-h-screen w-full bg-[#111111] text-white px-8 py-6">
      <div className="grid grid-cols-[240px_1fr] gap-6">
        {/* Filters (no local search field here as per spec) */}
        <aside className="bg-[#161616] rounded-2xl p-2 space-y-2 h-fit sticky top-4">
          <FilterSection title="Category">
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-[#2d2d30] text-white rounded-md px-3 py-2 text-sm outline-none"
            >
              <option value="">All</option>
              {mockCategories
                .filter((c) => c.Status === "active")
                .map((c) => (
                  <option key={c.ID} value={c.ID}>
                    {c.Name}
                  </option>
                ))}
            </select>
          </FilterSection>
          <FilterSection title="Color">
            <select
              value={color ?? ""}
              onChange={(e) => setColor(e.target.value || null)}
              disabled={colorOptions.length === 0}
              className="w-full bg-[#2d2d30] text-white rounded-md px-3 py-2 text-sm outline-none"
            >
              <option value="">Any</option>
              {colorOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FilterSection>
          <FilterSection title="Price">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceMin ?? ""}
                onChange={(e) => setPriceMin(e.target.value === "" ? null : Number(e.target.value))}
                className="w-full bg-[#2d2d30] text-white rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:ring-0 focus:outline-none focus:border-[#3a3a3d]"
              />
              <span className="opacity-50">-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax ?? ""}
                onChange={(e) => setPriceMax(e.target.value === "" ? null : Number(e.target.value))}
                className="w-full bg-[#2d2d30] text-white rounded-md px-3 py-2 text-sm outline-none border border-transparent focus:ring-0 focus:outline-none focus:border-[#3a3a3d]"
              />
            </div>
          </FilterSection>
          <button
            onClick={clearFilters}
            className="w-full bg-[#2d2d30] hover:bg-[#3a3a3d] text-white rounded-md px-3 py-2 text-sm"
          >
            Clear filters
          </button>
        </aside>

        {/* Results */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
          </div>

          {/* Active filters chips */}
          <div className="flex flex-wrap gap-2 border-b border-[#1f1f1f] pb-2">
            {query && <span className="px-3 py-1 bg-[#1a1a1a] rounded-full text-sm">{query}</span>}
            {categoryName && (
              <span className="px-3 py-1 bg-[#1a1a1a] rounded-full text-sm">{categoryName}</span>
            )}
            {color && <span className="px-3 py-1 bg-[#1a1a1a] rounded-full text-sm">{color}</span>}
            {(priceMin != null || priceMax != null) && (
              <span className="px-3 py-1 bg-[#1a1a1a] rounded-full text-sm">
                {priceMin ?? 0} - {priceMax ?? "max"}
              </span>
            )}
          </div>

          {/* 5 columns per row to match spec */}
          <div className="grid grid-cols-5 gap-4">
            {paged.length === 0 && (
              <div className="opacity-70 col-span-full">No products match your filters.</div>
            )}
            {paged.map((p) => (
              <ViewProductCardSearch
                key={p.ID}
                name={p.Name}
                description={`${p.Views ?? 0} views`}
                price={`${currencySymbol[p.Currency]}${p.Price}`}
                image="/default-product.jpg"
                buttonLabel="View"
                onClick={() => router.push(`/product/${p.ID}`)}
              />
            ))}
          </div>

          {/* Pagination (ASCII arrows to avoid encoding issues) */}
          <div className="flex items-center justify-center gap-2 py-4 select-none">
            <button
              className="px-3 py-1 rounded bg-[#1a1a1a] hover:bg-[#202020] disabled:opacity-40"
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
                    page === n ? "bg-[#2d2d30]" : "bg-[#1a1a1a] hover:bg-[#202020]"
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
              className="px-3 py-1 rounded bg-[#1a1a1a] hover:bg-[#202020] disabled:opacity-40"
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
