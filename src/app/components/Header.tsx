"use client";

import Image from "next/image";
import Input from "./atoms/Input";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import Link from "next/link";
import { fetchMyChats, ApiError } from "./lib/api";
import { getCurrentUserCached } from "./lib/userCache";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasUnread, setHasUnread] = React.useState(false);
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
  const isLogoOnly =
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/moderation/login");
  const isProfileArea = [
    "/profile",
    "/myproducts",
    "/myfavorites",
    "/orderhistory",
    "/mycart",
    "/chat"
  ].some((p) => pathname?.startsWith(p));
  const iconClass = "header-icon h-5 w-5 object-contain";

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const me = await getCurrentUserCached();
        const chats = await fetchMyChats();
        const unread = chats.some(
          (c) => c.lastMessage && c.lastMessage.recipientId === me?.id && !c.lastMessage.isRead
        );
        if (!cancelled) setHasUnread(unread);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          if (!cancelled) setHasUnread(false);
        }
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
      <div className="flex items-center justify-between px-8 py-3 gap-6">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/" className="flex items-center gap-2" aria-label="Go to home">
            <Image src="/loft-logo.svg" alt="Loft Logo" width={120} height={48} className="h-9 w-auto cursor-pointer" />
          </Link>
          {/* Search bar with round green button */}
          <form action="/search" method="GET" className="relative flex-1 max-w-none mr-45">
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
        <div className="flex items-center gap-5 text-[var(--fg-primary)]">
          {/* theme toggle */}
          <button title="Theme" onClick={toggleTheme} className="cursor-pointer">
            <Image src="/Component 29.svg" alt="Theme" width={20} height={20}  className={iconClass} />
          </button>
          {/* store -> /product */}
          <button title="My Products" onClick={() => router.push("/myproducts")} className="cursor-pointer">
            <Image src="/iconoir_shop.svg" alt="Store" width={20} height={20}  className={iconClass} />
          </button>
          {/* favorites -> /myfavorites */}
          <button title="Favorites" onClick={() => router.push("/myfavorites")} className="cursor-pointer">
            <Image src="/icon-park-solid_like.svg" alt="Favorites" width={20} height={20}  className={iconClass} />
          </button>
          {/* notifications -> chat/all */}
          <button
            title="Messages"
            onClick={() => router.push("/chat/all")}
            className="relative cursor-pointer"
          >
            <Image
              src="/Group.svg"
              alt="Messages"
              width={15}
              height={15}
              className={`${iconClass} w-3 h-3`} // shrinks it
            />

            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
          {/* cart -> /mycart */}
          <button title="Cart" onClick={() => router.push("/mycart")} className="cursor-pointer">
            <Image src="/mynaui_cart-solid.svg" alt="Cart" width={20} height={20}  className={iconClass} />
          </button>
          {/* account -> /profile */}
          <button title="Account" onClick={() => router.push("/profile")} className="cursor-pointer">
            <Image src="/iconamoon_profile-circle-fill.svg" alt="Account" width={20} height={20}  className={iconClass} />
          </button>
        </div>
      </div>

      {/* Bottom row: categories / quick links (hidden for profile area) */}
      {!isProfileArea && (
        <div className="px-8 pb-2 flex items-center gap-6 text-[var(--fg-primary)]">
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
