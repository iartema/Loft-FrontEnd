/* eslint-disable @next/next/no-img-element */
"use client";

import { Ysabeau_Office } from "next/font/google";

const ysabeau_office = Ysabeau_Office({
  subsets: ["latin"],
  weight: ["700", "800"],
});

type ButtonVariant = "primary" | "google" | "google small";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  is_gradient?: boolean;
  variant?: ButtonVariant;
}

export default function ButtonAuth({
  label,
  is_gradient = true,
  variant = "primary",
  ...props
}: ButtonProps) {

  const handleGoogleLogin = async () => {
    try {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  if (variant === "google") {
    return (
      <button
        type="button"
        onClick={handleGoogleLogin}
        {...props}
        className={`${ysabeau_office.className} 
          w-full flex items-center justify-center gap-3
          bg-[#2b2b2b] rounded-full px-6 py-3
          border border-[#555] text-white text-lg font-semibold
          hover:opacity-90 transition`}
      >
        <img
          src="/google-logo.svg"
          alt="Google"
          className="w-6 h-6"
        />
        {label ?? "Sign in with Google"}
      </button>
    );
  }

  if (variant === "google small") {
    return (
      <button
        type="button"
        onClick={handleGoogleLogin}
        {...props}
        className="bg-[#2b2b2b] rounded-full px-8 py-2 flex items-center justify-center border border-[#7C7C7C] hover:opacity-90 transition"
      >
        <img
          src="/google-logo.svg"
          alt="Google"
          className="w-8 h-8"
        />
      </button>
    );
  }

  if (is_gradient) {
    return (
      <button
        {...props}
        className={`${ysabeau_office.className}
          w-full
          bg-[linear-gradient(120deg,_#a0f0c0_0%,_#f8e98a_25%,_#f7b8d4_50%,_#bda0ff_75%,_#a0f0c0_100%)]
          text-black font-bold text-2xl px-10 py-2 rounded-full
          transition hover:opacity-90`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      {...props}
      className={`${ysabeau_office.className}
        w-full
        bg-transparent text-white font-bold text-2xl px-10 py-2 rounded-full
        border border-[#888]
        hover:bg-[#1a1a1a] transition`}
    >
      {label}
    </button>
  );
}
