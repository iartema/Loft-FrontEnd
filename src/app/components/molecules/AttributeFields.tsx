"use client";

import React, { useMemo, useRef, useState } from "react";
import InputField from "../molecules/InputField";
import { Akatab } from "next/font/google";

export interface AttributeDef {
  ID: number;
  Name: string;
  Type: "text" | "number" | "select" | "multiselect" | "boolean" | "color";
  Value?: string; // For select/multiselect: "A|B|C"
}

const akatab = Akatab({
  subsets: ["latin"],
  weight: ["400", "500"],
});

type AttributeValue = string | number | boolean | string[];

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
          (a.Type === "multiselect" || a.Type === "color" ? [] : "");

        // Dropdown (single)
        if (a.Type === "select") {
          const options = (a.Value || "").split("|").filter(Boolean);
          return (
            <div key={a.ID} className="mb-4">
              <label className="block mb-2">{a.Name}</label>
              <select
                value={String(v || "")}
                onChange={(e) => onChange(a.ID, e.target.value)}
                className={`w-full bg-[var(--bg-input)] rounded-[15px] px-4 py-2 text-[20px] text-white outline-none ${akatab.className}`}
              >
                <option value="">Choose…</option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
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

        // Color: swatch list + Add color with gradient picker (native)
        if (a.Type === "color") {
          return (
            <ColorPickerList
              key={a.ID}
              label={a.Name}
              value={Array.isArray(v) ? (v as string[]) : v ? [String(v)] : []}
              onChange={(arr) => onChange(a.ID, arr)}
            />
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
            className={akatab.className}
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

/* ---------- Color picker list with swatches + Add Color ---------- */
function ColorPickerList({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[]; // hex colors
  onChange: (val: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("#ff0000");
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const add = () => {
    if (!draft) return;
    if (!value.includes(draft)) onChange([...value, draft]);
    setOpen(false);
  };

  const remove = (hex: string) => onChange(value.filter((c) => c !== hex));

  return (
    <div className={`${akatab.className} mb-4`} ref={ref}>
      <label className="block mb-2">{label}</label>
      <div className="flex items-center gap-3 flex-wrap">
        {value.map((hex) => (
          <button
            key={hex}
            type="button"
            title={hex}
            onClick={() => remove(hex)}
            className="w-8 h-8 rounded-full border border-[var(--border)] relative"
            style={{ backgroundColor: hex }}
          >
            <span className="sr-only">{hex}</span>
            <span className="absolute -top-2 -right-2 text-xs bg-black/70 rounded px-1">
              ×
            </span>
          </button>
        ))}

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="px-3 py-2 rounded-lg bg-[var(--bg-elev-3)] hover:bg-[var(--bg-hover)]"
          >
            + Add color
          </button>
          {open && (
            <div className="absolute z-20 mt-2 p-3 bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-xl">
              <input
                type="color"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-40 h-10 rounded"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-[var(--brand)] text-black"
                  onClick={add}
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

