"use client";

interface Props {
  query: string;
  categoryName?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  onClearQuery: () => void;
  onClearCategory: () => void;
  onClearMin: () => void;
  onClearMax: () => void;
  attributes?: { label: string; onClear: () => void }[];
  className?: string;
}

const Cross = () => (
  <svg className="text-[var(--danger)]" width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function ActiveFilterChips({
  query,
  categoryName,
  priceMin,
  priceMax,
  onClearQuery,
  onClearCategory,
  onClearMin,
  onClearMax,
  attributes = [],
  className = "",
}: Props) {
  return (
    <div className={`flex flex-wrap items-center gap-4 border-b border-[var(--divider)] pb-2 mb-4 ${className}`}>
      {query && (
        <button type="button" onClick={onClearQuery} className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100">
          <Cross />
          <span className="text-[var(--fg-muted)]">{query}</span>
        </button>
      )}
      {categoryName && (
        <button type="button" onClick={onClearCategory} className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100">
          <Cross />
          <span className="text-[var(--fg-muted)]">{categoryName}</span>
        </button>
      )}
      {priceMin != null && (
        <button type="button" onClick={onClearMin} className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100">
          <Cross />
          <span className="text-[var(--fg-muted)]">Min: {priceMin}</span>
        </button>
      )}
      {priceMax != null && (
        <button type="button" onClick={onClearMax} className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100">
          <Cross />
          <span className="text-[var(--fg-muted)]">Max: {priceMax}</span>
        </button>
      )}
      {attributes.map((c, i) => (
        <button key={i} type="button" onClick={c.onClear} className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100">
          <Cross />
          <span className="text-[var(--fg-muted)]">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
