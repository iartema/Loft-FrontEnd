"use client";

interface Option { value: string; label: string }

export default function SimpleSelect({
  value,
  onChange,
  options,
  placeholder = "Any",
  disabled = false,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full bg-[var(--bg-filter-inner)] text-white rounded-[12px] px-3 py-2 text-sm outline-none ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

