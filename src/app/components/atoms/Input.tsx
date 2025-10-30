import { Akatab } from "next/font/google";
import React, { useState, useEffect } from "react";

const akatab = Akatab({ subsets: ["latin"], weight: ["400", "500"] });

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  shape?: "rounded" | "office";
}

export default function Input({
  shape = "rounded",
  className = "",
  value: propValue,
  onChange,
  ...props
}: InputProps) {
  const [value, setValue] = useState(propValue ?? "");

  useEffect(() => {
    if (propValue !== undefined) setValue(propValue);
  }, [propValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(e);
  };

  const shapeClass = shape === "office" ? "rounded-[15px]" : "rounded-full";
  const size = shape === "office" ? "px-4 py-2" : "px-5 py-3";
  const bgColor = value ? "bg-[#3a3a3d]" : "bg-[#2d2d30]";

  return (
    <input
      {...props}
      value={value}
      onChange={handleChange}
      className={`${akatab.className} w-full ${bgColor} ${shapeClass} ${size} outline-none text-[20px] text-white placeholder-[#666666] ${className}`}
      style={{
        WebkitAppearance: "none",
        WebkitBoxShadow: "0 0 0px 1000px transparent inset",
        backgroundClip: "padding-box",
      }}
    />
  );
}
