"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PRODUCT_TYPE_OPTIONS,
  type ProductTypeKind,
  productTypeLabel,
} from "../../lib/productTypes";
import { useLocale } from "../../i18n/LocaleProvider";

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
  const { t } = useLocale();
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
  const currentMobileItems = useMemo(() => {
    if (!productType) return [];
    if (path.length === 0) return level1;
    const parentId = path[path.length - 1];
    return childrenOf(parentId);
  }, [level1, path, productType]);

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
      onClose();
    }
  };

  const handleMobileClick = (catId: number) => {
    const hasChildren = childrenOf(catId).length > 0;
    if (hasChildren) {
      setPath((p) => [...p, catId]);
    } else {
      onSelect(catId);
      setPath([]);
      onClose();
    }
  };

  const handleBackMobile = () => {
    setPath((p) => p.slice(0, -1));
  };

  if (!open) return null;

  const renderTypeSelector = () => (
    <div className="mb-6">
      <p className="text-sm sort-label mb-3">
        {t("product.categoryModal.typePrompt")}
      </p>
      <div className="flex gap-4">
        {PRODUCT_TYPE_OPTIONS.map((option) => {
          const localizedLabel =
            option.value === "physical"
              ? t("product.categoryModal.physical")
              : t("product.categoryModal.digital");
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
              <div className="text-sm uppercase tracking-wide opacity-70 sort-label">
                {option.value}
              </div>
              <div className="text-lg font-semibold sort-label">{localizedLabel}</div>
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

      {/* Desktop modal */}
      <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-2xl p-6 w-[900px] max-w-[95vw]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold sort-label">{t("product.categoryModal.title")}</h3>
            <p className="text-sm sort-label">
              {productTypeLabel(productType, t)}
            </p>
          </div>
          <button
            className="opacity-70 hover:opacity-100 sort-label"
            onClick={() => {
              setPath([]);
              onClose();
            }}
            aria-label={t("product.categoryModal.close")}
          >
            x
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
            t={t}
          />
          {/* show level 2 only after a level1 click */}
          <Column
            items={level2}
            activeId={path[1]}
            selectedId={selectedId}
            onClick={(id) => handleClick(1, id)}
            t={t}
            hidden={!path[0]}
          />
          {/* show level 3 only after a level2 click */}
          <Column
            items={level3}
            activeId={path[2]}
            selectedId={selectedId}
            onClick={(id) => handleClick(2, id)}
            t={t}
            hidden={!path[1]}
          />

          {!productType && (
            <div className="absolute inset-0 rounded-2xl bg-[var(--bg-elev-1)]/90 backdrop-blur-[2px] flex items-center justify-center text-center px-8">
              <div className="text-base text-[var(--fg-muted)]">
                {t("product.categoryModal.typeOverlay")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile full-screen flow */}
      <div className="md:hidden absolute inset-0 bg-[var(--bg-elev-1)] border-t border-[var(--border)] rounded-t-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--divider)]">
          <div className="flex items-center gap-2">
            {path.length > 0 ? (
              <button
                type="button"
                onClick={handleBackMobile}
                className="p-2 -ml-2 rounded-full hover:bg-[var(--bg-hover)]"
                aria-label={t("common.back")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            ) : null}
            <div className="flex flex-col">
              <span className="text-lg font-semibold sort-label">{t("product.categoryModal.title")}</span>
              <span className="text-xs text-[var(--fg-muted)] sort-label">{productTypeLabel(productType, t)}</span>
            </div>
          </div>
          <button
            className="text-sm text-[var(--fg-muted)]"
            onClick={() => {
              setPath([]);
              onClose();
            }}
            aria-label={t("product.categoryModal.close")}
          >
            {t("common.close") ?? "Close"}
          </button>
        </div>

        <div className="px-4 py-3 overflow-y-auto flex-1">
          {renderTypeSelector()}

          <div className="relative">
            {!productType && (
              <div className="absolute inset-0 z-10 rounded-2xl bg-[var(--bg-elev-1)]/90 backdrop-blur-[2px] flex items-center justify-center text-center px-6">
                <div className="text-base text-[var(--fg-muted)]">
                  {t("product.categoryModal.typeOverlay")}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {currentMobileItems.length === 0 && (
                <div className="text-[var(--fg-muted)] text-sm">{t("product.categoryModal.empty")}</div>
              )}
              {currentMobileItems.map((c) => (
                <button
                  key={c.ID}
                  type="button"
                  onClick={() => handleMobileClick(c.ID)}
                  className="w-full text-left px-3 py-3 rounded-2xl bg-[var(--bg-elev-2)] hover:bg-[var(--bg-hover)] flex items-center justify-between"
                >
                  <span className="text-sm sort-label">{c.Name}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
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
  t,
}: {
  items: Category[];
  activeId?: number;
  selectedId: number | null;
  onClick: (id: number) => void;
  hidden?: boolean;
  t: (k: string) => string;
}) {
  if (hidden) return <div className="space-y-2 opacity-40 pointer-events-none" />;
  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-[var(--fg-muted)] text-sm">{t("product.categoryModal.empty")}</div>}
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
            <span className="sort-label">{c.Name}</span>
            <span className="opacity-70 sort-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
}
