"use client";
import { Almarai } from "next/font/google";
import { Ysabeau_Office } from "next/font/google";

const almarai = Almarai({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const ysabeau_office = Ysabeau_Office({
  subsets: ["latin"],
  weight: ["700", "800"],
});

// Added google + primary
type ButtonVariant = "default" | "submit" | "card" | "primary" | "google";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  variant?: ButtonVariant;
}

export default function Button({
  label,
  variant = "default",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles = `
    w-full rounded-lg
    transition-all duration-200
  `;

  const variantStyles =
    variant === "submit"
      ? `${ysabeau_office.className} font-extrabold bg-[var(--brand)] hover:bg-[#ffde7a] text-black text-lg px-5 py-3`
      : variant === "card"
      ? `${almarai.className} bg-white text-black rounded-[25px] hover:bg-gray-300 text-base font-semibold py-2`
      : variant === "primary"
      ? `${almarai.className} font-semibold bg-[var(--brand)] hover:bg-[#ffde7a] text-black px-5 py-3`
      : variant === "google"
      ? `${almarai.className} bg-white border border-gray-300 text-black font-semibold px-5 py-3 hover:bg-gray-200`
      : `${almarai.className} font-semibold bg-[var(--bg-elev-3)] hover:bg-[var(--bg-hover)] text-white px-5 py-3`;

  return (
    <button
      {...props}
      className={`${baseStyles} ${variantStyles} active:scale-[0.98] ${className}`}
    >
      {label ?? props.children}
    </button>
  );
}
