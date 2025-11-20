"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PRODUCT_TYPE_OPTIONS,
  type ProductTypeKind,
  productTypeLabel,
} from "../../lib/productTypes";

export interface Category {
  ID: number;
  Name: string;
  ParentCategoryId: number | null;
  Status?: string;
  Type?: ProductTypeKind;
}

interface Props {
  open: boolean;
  categories: Category[];
  selectedId: number | null;
  productType: ProductTypeKind | null;
  onSelectType: (type: ProductTypeKind) => void;
  onClose: () => void;
  onSelect: (id: number) => void;
}

export default function CategoryModal({
  open,
  categories,
  selectedId,
  productType,
  onSelectType,
  onClose,
  onSelect,
}: Props) {
  // path holds the clicked chain: [level1Id, level2Id, ...]
  const [path, setPath] = useState<number[]>([]);

  useEffect(() => {
    setPath([]);
  }, [open, productType]);

  const filtered = useMemo(() => {
    if (!productType) return categories;
    return categories.filter((c) => c.Type === productType);
  }, [categories, productType]);

  const roots = useMemo(
    () => filtered.filter((c) => c.ParentCategoryId === null),
    [filtered]
  );
  const childrenOf = (id: number | null) =>
    filtered.filter((c) => c.ParentCategoryId === id);

  const level1 = roots;
  const level2 = path[0] ? childrenOf(path[0]) : [];
  const level3 = path[1] ? childrenOf(path[1]) : [];

  const handleClick = (levelIndex: number, catId: number) => {
    const nextPath = [...path];
    nextPath[levelIndex] = catId;
    // trim any deeper levels if we go back
    nextPath.splice(levelIndex + 1);
    setPath(nextPath);

    // if this category has no children, select & close
    const hasChildren = childrenOf(catId).length > 0;
    if (!hasChildren) {
      onSelect(catId);
      setPath([]); // reset for next open
    }
  };

  if (!open) return null;

  const renderTypeSelector = () => (
    <div className="mb-6">
      <p className="text-sm text-[var(--fg-muted)] mb-3">
        Select product type to filter categories
      </p>
      <div className="flex gap-4">
        {PRODUCT_TYPE_OPTIONS.map((option) => {
          const active = productType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex-1 rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? "border-[var(--brand,#9ef1c7)] bg-[var(--bg-hover)]"
                  : "border-[var(--border)] hover:border-[var(--fg-muted)]"
              }`}
              onClick={() => onSelectType(option.value)}
            >
              <div className="text-sm uppercase tracking-wide opacity-70">
                {option.value}
              </div>
              <div className="text-lg font-semibold">{option.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          setPath([]);
          onClose();
        }}
      />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-2xl p-6 w-[900px] max-w-[95vw]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold">Choose category</h3>
            <p className="text-sm text-[var(--fg-muted)]">
              {productTypeLabel(productType)}
            </p>
          </div>
          <button
            className="opacity-70 hover:opacity-100"
            onClick={() => {
              setPath([]);
              onClose();
            }}
          >
            ✕
          </button>
        </div>

        {renderTypeSelector()}

        <div className="relative grid grid-cols-3 gap-6">
          {/* level 1 */}
          <Column
            items={level1}
            activeId={path[0]}
            selectedId={selectedId}
            onClick={(id) => handleClick(0, id)}
          />
          {/* show level 2 only after a level1 click */}
          <Column
            items={level2}
            activeId={path[1]}
            selectedId={selectedId}
            onClick={(id) => handleClick(1, id)}
            hidden={!path[0]}
          />
          {/* show level 3 only after a level2 click */}
          <Column
            items={level3}
            activeId={path[2]}
            selectedId={selectedId}
            onClick={(id) => handleClick(2, id)}
            hidden={!path[1]}
          />

          {!productType && (
            <div className="absolute inset-0 rounded-2xl bg-[var(--bg-elev-1)]/90 backdrop-blur-[2px] flex items-center justify-center text-center px-8">
              <div className="text-base text-[var(--fg-muted)]">
                Choose a product type above to browse matching categories.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({
  items,
  activeId,
  selectedId,
  onClick,
  hidden,
}: {
  items: Category[];
  activeId?: number;
  selectedId: number | null;
  onClick: (id: number) => void;
  hidden?: boolean;
}) {
  if (hidden) return <div className="space-y-2 opacity-40 pointer-events-none" />;
  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-[var(--fg-muted)] text-sm">No items</div>}
      {items.map((c) => {
        const isActive = activeId === c.ID;
        const isSelected = selectedId === c.ID;
        return (
          <button
            key={c.ID}
            type="button"
            className={`w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-hover)] flex items-center justify-between ${
              isActive || isSelected ? "bg-[var(--bg-hover)] border border-[var(--brand)]" : ""
            }`}
            onClick={() => onClick(c.ID)}
          >
            <span>{c.Name}</span>
            <span className="opacity-70"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
          </button>
        );
      })}
    </div>
  );
}


