import React from "react";
import { Ysabeau_Office } from "next/font/google";

// You can safely load both weights; Ysabeau_Office supports them.
const ysabeau_office = Ysabeau_Office({
  subsets: ["latin"],
  weight: ["700", "800"],
});

interface TitleProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export default function Title({
  children,
  size = "md",
  color = "text-green-400",
  className = "",
}: TitleProps) {
  const sizeClasses =
    size === "sm"
      ? "text-sm font-medium"
      : size === "lg"
      ? "text-2xl font-bold"
      : "text-base font-semibold";

  return (
    <h2
      className={`${ysabeau_office.className} ${color} ${sizeClasses} ${className}`}
    >
      {children}
    </h2>
  );
}
