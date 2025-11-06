"use client";

import Image from "next/image";
import Input from "./atoms/Input";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isLogoOnly = pathname?.startsWith("/register") || pathname?.startsWith("/login");
  const isProfileArea = [
    "/profile",
    "/myproducts",
    "/myfavorites",
    "/orderhistory",
  ].some((p) => pathname?.startsWith(p));

  if (isLogoOnly) {
    return (
      <header className="w-full bg-[#111111]">
        <div className="flex items-center px-8 py-3">
          <Image src="/loft-logo.svg" alt="Loft Logo" width={120} height={48} className="h-9 w-auto" />
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-[#111111]">
      {/* Top row: logo, search, right icons */}
      <div className="flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-2">
          <Image src="/loft-logo.svg" alt="Loft Logo" width={120} height={48} className="h-9 w-auto" />
        </div>

        {/* Search bar with round green button */}
        <div className="flex-1 max-w-[900px] ml-6 mr-10">
          <form action="/search" method="GET" className="relative">
            <Input name="q" placeholder="Search" className="!rounded-[16px] bg-[#2a2a2d] pr-16" />
            <button aria-label="search" type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#7BFF88] text-black flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </form>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-5 text-white/90">
          {/* moon */}
          <span title="Theme" className="cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </span>
          {/* store */}
          <span title="Store" className="cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7h18l-2 12H5L3 7Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </span>
          {/* heart */}
          <span title="Favorites" className="cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21s-6.7-4.4-9.1-7.1A5.7 5.7 0 0 1 12 5a5.7 5.7 0 0 1 9.1 8.9C18.7 16.6 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </span>
          {/* bell */}
          <span title="Notifications" className="relative cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8a6 6 0 1 1 12 0v5l2 3H4l2-3V8Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
          </span>
          {/* cart */}
          <span title="Cart" className="cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6h15l-1.5 9h-12L6 3H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="21" r="1" fill="currentColor"/>
              <circle cx="18" cy="21" r="1" fill="currentColor"/>
            </svg>
          </span>
          {/* user */}
          <span title="Account" className="cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 20c2-3 5-4 8-4s6 1 8 4" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </span>
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
      <div className="w-full h-px bg-[#1f1f1f]" />
    </header>
  );
}
