"use client";

import React, { useState } from "react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function FilterSection({ title, defaultOpen = false, className = "", children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={className}>
      <button
        type="button"
        className={`w-full flex items-center justify-between px-3 py-3 bg-[var(--bg-filter)] text-sm border-b border-[var(--divider)]`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="opacity-80">{title}</span>
        <span className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`} aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      {open && (
        <div className={`p-3 bg-[var(--bg-filter)] border-b border-[var(--divider)] max-h-64 overflow-auto`}>{children}</div>
      )}
    </div>
  );
}

