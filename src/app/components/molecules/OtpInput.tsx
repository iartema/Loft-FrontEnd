"use client";

import { useEffect, useRef, useState } from "react";

type OtpInputProps = {
  length?: number;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export default function OtpInput({ length = 6, onChange, disabled = false }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array.from({ length }, () => ""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    onChange?.(values.join(""));
  }, [values, onChange]);

  const focusInput = (index: number) => {
    const el = inputsRef.current[index];
    if (el) el.focus();
  };

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/\\D/g, "").slice(0, 1);
    const nextValues = [...values];
    nextValues[index] = clean;
    setValues(nextValues);
    if (clean && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\\D/g, "");
    if (!pasted) return;
    const nextValues = [...values];
    for (let offset = 0; offset < pasted.length && index + offset < length; offset++) {
      nextValues[index + offset] = pasted[offset];
    }
    setValues(nextValues);
    const nextIndex = Math.min(index + pasted.length, length - 1);
    focusInput(nextIndex);
  };

  return (
    <div className="flex items-center gap-5">
      {values.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={(e) => handlePaste(idx, e)}
          className="w-15 h-15 text-center text-2xl bg-[var(--bg-input)] rounded-2xl border border-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--fg-muted)] disabled:opacity-60"
        />
      ))}
    </div>
  );
}
