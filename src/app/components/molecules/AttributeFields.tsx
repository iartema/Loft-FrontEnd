"use client";

import React, { useMemo, useRef, useState } from "react";
import InputField from "../molecules/InputField";
import { Akatab } from "next/font/google";

export interface AttributeDef {
  ID: number;
  Name: string;
  Type: "text" | "number" | "select" | "multiselect" | "boolean";
  Value?: string; // For select/multiselect: "A|B|C"
}

const akatab = Akatab({
  subsets: ["latin"],
  weight: ["400", "500"],
});

type AttributeValue = string | number | boolean | string[] | null;

interface Props {
  attributes: AttributeDef[];
  values: Record<number, AttributeValue>;
  onChange: (id: number, value: AttributeValue) => void;
}

export default function AttributeFields({ attributes, values, onChange }: Props) {
  if (!attributes.length) {
    return (
      <div
        className={`${akatab.className} text-[var(--fg-muted)] ml-0 md:ml-9`}
      >
        Choose a category to see attributes.
      </div>
    );
  }

  return (
    <div className={`${akatab.className} flex flex-col gap-1 gap-y-6 ml-0 mt-2 w-[80%]`}>
      {attributes.map((a) => {
        const v =
          values[a.ID] ??
          (a.Type === "multiselect" ? [] : "");

        // Dropdown (single)
        if (a.Type === "select") {
          const options = (a.Value || "").split("|").filter(Boolean);
          return (
            <div key={a.ID} className="mb-4">
              <label className="block mb-2">{a.Name}</label>
              <div className="relative">
                <select
                  value={String(v || "")}
                  onChange={(e) => onChange(a.ID, e.target.value)}
                  className={`appearance-none w-full bg-[var(--bg-input)] rounded-[15px] px-4 pr-12 py-2 text-[20px] text-white outline-none ${akatab.className}`}
                  style={{boxShadow: "0 3px 3px 0px rgba(0, 0, 0, 0.25)"}}
                >
                  <option value="">Choose…</option>
                  {options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white opacity-70">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          );
        }

        // Compact multiselect dropdown
        if (a.Type === "multiselect") {
          return (
            <CompactMultiSelect
              key={a.ID}
              label={a.Name}
              options={(a.Value || "").split("|").filter(Boolean)}
              value={(v as string[]) || []}
              onChange={(arr) => onChange(a.ID, arr)}
            />
          );
        }

        // Boolean: just buttons, no box
        if (a.Type === "boolean") {
          const boolVal =
            v === true ? true : v === false ? false : null; // 👈 explicit 3-state
          return (
            <div key={a.ID} className="mb-4">
              <label className="block mb-2">{a.Name}</label>
              <div className="flex gap-3">
                {[{ label: "Yes", val: true }, { label: "No", val: false }].map(
                  ({ label, val }) => {
                    const active = boolVal === val;
                    return (
                      <button
                        key={label}
                        type="button"
                        className={`${akatab.className} px-4 py-2 rounded-lg transition ${
                          active
                            ? "bg-[var(--brand)] text-black"
                            : "bg-[var(--bg-elev-3)] hover:bg-[var(--bg-hover)]"
                        }`}
                        onClick={() => onChange(a.ID, val)}
                      >
                        {label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          );
        }

        // Text / Number
        return (
          <InputField
            key={a.ID}
            label={a.Name}
            type={a.Type === "number" ? "number" : "text"}
            placeholder="Enter..."
            value={String(v ?? "")}
            onChange={(e) =>
              onChange(
                a.ID,
                a.Type === "number"
                  ? Number(e.target.value)
                  : e.target.value
              )
            }
            shape="office"
          />
        );
      })}
    </div>
  );
}

/* ---------- Compact multi-select dropdown (checkbox menu) ---------- */
function CompactMultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const labelText = useMemo(() => {
    if (!value.length) return "Choose…";
    if (value.length <= 3) return value.join(", ");
    return `${value.length} selected`;
  }, [value]);

  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };

  return (
    <div className={`${akatab.className} mb-4 relative`} ref={ref}>
      <label className="block mb-2">{label}</label>
      <button
        type="button"
        className="w-full bg-[var(--bg-input)] rounded-[15px] px-4 py-2 text-left text-[20px]"
        onClick={() => setOpen((o) => !o)}
      >
        {labelText}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-xl p-2 max-h-64 overflow-auto">
          {options.map((o) => {
            const checked = value.includes(o);
            return (
              <label
                key={o}
                className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[var(--bg-hover)]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(o)}
                  className="accent-[var(--brand)]"
                  style={{boxShadow: "0 3px 3px 0px rgba(0, 0, 0, 0.25)"}}
                />
                <span>{o}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}