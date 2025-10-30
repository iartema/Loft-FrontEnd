"use client";

import React, { useMemo, useState } from "react";

export interface Category {
  ID: number;
  Name: string;
  ParentCategoryId: number | null;
  Status?: string;
}

interface Props {
  open: boolean;
  categories: Category[];
  selectedId: number | null;
  onClose: () => void;
  onSelect: (id: number) => void;
}

export default function CategoryModal({ open, categories, selectedId, onClose, onSelect }: Props) {
  // path holds the clicked chain: [level1Id, level2Id, ...]
  const [path, setPath] = useState<number[]>([]);

  const roots = useMemo(() => categories.filter((c) => c.ParentCategoryId === null), [categories]);
  const childrenOf = (id: number | null) => categories.filter((c) => c.ParentCategoryId === id);

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

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          setPath([]);
          onClose();
        }}
      />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 w-[900px] max-w-[95vw]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Choose category</h3>
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

        <div className="grid grid-cols-3 gap-6">
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
      {items.length === 0 && <div className="text-[#A9A9B7] text-sm">—</div>}
      {items.map((c) => {
        const isActive = activeId === c.ID;
        const isSelected = selectedId === c.ID;
        return (
          <button
            key={c.ID}
            type="button"
            className={`w-full text-left px-3 py-2 rounded-xl hover:bg-[#2b2b2b] flex items-center justify-between ${
              isActive || isSelected ? "bg-[#2b2b2b] border border-[#FFC107]" : ""
            }`}
            onClick={() => onClick(c.ID)}
          >
            <span>{c.Name}</span>
            <span className="opacity-70">›</span>
          </button>
        );
      })}
    </div>
  );
}
