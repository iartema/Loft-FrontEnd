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
} from "../lib/api";
// import { mockCategories, mockFetchAttributesByCategory } from "../lib/mockCatalog";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

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
  const [items, setItems] = useState<ProductDto[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

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
    if (!categoryId) { setCategoryAttrs([]); return; }
    fetchCategoryAttributes(Number(categoryId))
      .then((full: CategoryAttributeFullDto[]) => {
        const mapped = full
          .sort((a,b)=>a.orderIndex-b.orderIndex)
          .map(a => {
            const opts = a.optionsJson ? safeParseOptions(a.optionsJson) : [];
            const lower = a.attributeName.toLowerCase();
            // Backend enum mapping (AttributeType): 0:String, 1:Number, 2:List
            let Type: "text"|"number"|"select"|"multiselect"|"boolean"|"color" = "text";
            const tval = a.type as unknown as number;
            if (typeof tval === "number") {
              if (tval === 0) Type = "text";      // String
              else if (tval === 1) Type = "number"; // Number
              else if (tval === 2) Type = "select"; // List
            } else {
              const ts = String(a.type).toLowerCase();
              if (ts === "string" || ts === "text") Type = "text";
              else if (ts === "number") Type = "number";
              else if (ts === "list") Type = "select";
            }
            if (lower === "color" || lower === "colour") Type = "color";
            return { ID: a.attributeId, Name: a.attributeName, Type, Value: opts.join("|") || undefined };
          });
        setCategoryAttrs(mapped);
      })
      .catch(()=> setCategoryAttrs([]));
  }, [categoryId]);

  function safeParseOptions(json: string): string[] {
    try { const arr = JSON.parse(json); return Array.isArray(arr) ? arr.map(String) : []; } catch { return []; }
  }
    // initialize attribute filters when category changes
  useEffect(() => {
    const next: Record<number, string | number | boolean | string[] | null> = {};
    for (const a of categoryAttrs) {
      if (a.Type === "multiselect" || a.Type === "color") next[a.ID] = [];
      else if (a.Type === "boolean") next[a.ID] = null;
      else next[a.ID] = "";
    }
    setAttrFilters(next);
  }, [categoryAttrs]);

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
      attributes: attrs.length ? attrs : undefined,
      page: 1,
      pageSize,
    });
    setItems(res || []);
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

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);

  const categoryName = useMemo(
    () => allCategories.find((c) => c.ID === (categoryId ?? -1))?.Name,
    [categoryId, allCategories]
  );

  return (
    <main className="min-h-screen w-full bg-[var(--bg-body)] text-white px-8 py-6">
      {/* Active filters chips spanning full width, above sidebar/results */}
      <ActiveFilterChips query={query} categoryName={categoryName} priceMin={priceMin} priceMax={priceMax} onClearQuery={() => setQuery("")} onClearCategory={() => setCategoryId(null)} onClearMin={() => setPriceMin(null)} onClearMax={() => setPriceMax(null)} />

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
          {categoryId && categoryAttrs.map((a) => (
            <FilterSection key={a.ID} title={a.Name}>
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
            </FilterSection>
          ))}
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
        <section className="space-y-4">
          <div className="flex items-center justify-between">
          </div>



          {/* 5 columns per row to match spec */}
          <div className="grid grid-cols-5 gap-4">
            {paged.length === 0 && (
              <div className="opacity-70 col-span-full">No products match your filters.</div>
            )}
            {paged.map((p) => (
              <ViewProductCardSearch
                key={p.id}
                name={p.name}
                description={`${p.viewCount ?? 0} views`}
                price={`${({ USD: "$", EUR: "€", UAH: "₴", GBP: "£" } as Record<string, string>)[p.currency] ?? ""}${p.price}`}
                image={(p.mediaFiles && p.mediaFiles[0]?.url) || "/default-product.jpg"}
                buttonLabel="View"
                onClick={() => router.push(`/product/${p.id}`)}
              />
            ))}
          </div>

          {/* Pagination (ASCII arrows to avoid encoding issues) */}
          <div className="flex items-center justify-center gap-2 py-4 select-none">
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

















