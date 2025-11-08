"use client";

import { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled = false,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-[var(--bg-filter-inner)] text-white rounded-[12px] px-3 py-2 text-sm text-left flex items-center justify-between"
      >
        <span>{current?.label ?? placeholder}</span>
        <span className={`ml-2 transition-transform ${open ? "rotate-180" : "rotate-0"}`} aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {open && (
        <ul className="absolute z-50 mt-2 w-full max-h-64 overflow-auto bg-[var(--bg-filter-inner)] text-white border border-[var(--divider)] rounded-[12px] overflow-auto shadow-lg">
          {options.map((opt) => (
            <li
              key={opt.value + "_opt"}
              className={`px-3 py-2 cursor-pointer hover:bg-[var(--bg-filter)] ${
                value === opt.value ? "bg-[var(--bg-elev-3)]" : ""
              }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
