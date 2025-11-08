"use client";

import Image from "next/image";
import Input from "./atoms/Input";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  // theme: default dark; when toggled, set data-theme="light" on <html>
  React.useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
      if (saved === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      }
    } catch {}
  }, []);

  const toggleTheme = React.useCallback(() => {
    try {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      if (isLight) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
      }
    } catch {}
  }, []);
  const isLogoOnly = pathname?.startsWith("/register") || pathname?.startsWith("/login");
  const isProfileArea = [
    "/profile",
    "/myproducts",
    "/myfavorites",
    "/orderhistory",
  ].some((p) => pathname?.startsWith(p));

  if (isLogoOnly) {
    return (
      <header className="w-full bg-[var(--bg-body)]">
        <div className="flex items-center px-8 py-3">
          <Link href="/" className="flex items-center" aria-label="Go to home">
            <Image src="/loft-logo.svg" alt="Loft Logo" width={120} height={48} className="h-9 w-auto cursor-pointer" />
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-[var(--bg-body)]">
      {/* Top row: logo, search, right icons */}
      <div className="flex items-center justify-between px-8 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="Go to home">
          <Image src="/loft-logo.svg" alt="Loft Logo" width={120} height={48} className="h-9 w-auto cursor-pointer" />
        </Link>

        {/* Search bar with round green button */}
        <div className="flex-1 max-w-[900px] ml-6 mr-10">
          <form action="/search" method="GET" className="relative">
            <Input name="q" placeholder="Search" className="!rounded-[16px] bg-[var(--bg-input)] pr-16" />
            <button aria-label="search" type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[var(--success)] text-black flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </form>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-5 text-white/90">
          {/* theme toggle */}
          <button title="Theme" onClick={toggleTheme} className="cursor-pointer">
            <Image src="/Component 29.svg" alt="Theme" width={20} height={20}  className="h-5 w-5 object-contain" />
          </button>
          {/* store -> /product */}
          <button title="Store" onClick={() => router.push("/product")} className="cursor-pointer">
            <Image src="/iconoir_shop.svg" alt="Store" width={20} height={20}  className="h-5 w-5 object-contain" />
          </button>
          {/* favorites -> /myfavorites */}
          <button title="Favorites" onClick={() => router.push("/myfavorites")} className="cursor-pointer">
            <Image src="/icon-park-solid_like.svg" alt="Favorites" width={20} height={20}  className="h-5 w-5 object-contain" />
          </button>
          {/* notifications -> /orderhistory (placeholder) */}
          <button title="Notifications" onClick={() => router.push("/orderhistory")} className="relative cursor-pointer">
            <Image src="/Group.svg" alt="Notifications" width={20} height={20}  className="h-5 w-5 object-contain" />
          </button>
          {/* cart -> /myproducts (placeholder) */}
          <button title="Cart" onClick={() => router.push("/myproducts")} className="cursor-pointer">
            <Image src="/mynaui_cart-solid.svg" alt="Cart" width={20} height={20}  className="h-5 w-5 object-contain" />
          </button>
          {/* account -> /profile */}
          <button title="Account" onClick={() => router.push("/profile")} className="cursor-pointer">
            <Image src="/iconamoon_profile-circle-fill.svg" alt="Account" width={20} height={20}  className="h-5 w-5 object-contain" />
          </button>
        </div>
      </div>

      {/* Bottom row: categories / quick links (hidden for profile area) */}
      {!isProfileArea && (
        <div className="px-8 pb-2 flex items-center gap-6 text-white">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-lg">≡</span>
            <span className="font-semibold">All categories</span>
          </div>
          <div className="opacity-80 cursor-pointer">Popular</div>
          <div className="opacity-80 cursor-pointer">Season</div>
        </div>
      )}
      <div className="w-full h-px bg-[var(--divider)]" />
    </header>
  );
}

