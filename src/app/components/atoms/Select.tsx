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
        className="w-full bg-[#2d2d30] text-white rounded-md px-3 py-2 text-sm text-left flex items-center justify-between"
      >
        <span>{current?.label ?? placeholder}</span>
        <span className={`ml-2 transition-transform ${open ? "rotate-180" : "rotate-0"}`}>v</span>
      </button>

      {open && (
        <ul className="absolute z-50 mt-2 w-full max-h-64 overflow-auto bg-[#1f1f20] text-white border border-[#3a3a3d] rounded-md shadow-lg">
          {options.map((opt) => (
            <li
              key={opt.value + "_opt"}
              className={`px-3 py-2 cursor-pointer hover:bg-[#2a2a2d] ${
                value === opt.value ? "bg-[#262628]" : ""
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
