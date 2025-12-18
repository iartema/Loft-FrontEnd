"use client";

import Image from "next/image";
import Input from "./atoms/Input";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import Link from "next/link";
import {
  fetchMyChats,
  ApiError,
  fetchCategories,
  type CategoryDto,
} from "./lib/api";
import { normalizeProductType, type ProductTypeKind } from "../lib/productTypes";
import CategoryModal, { type Category } from "./molecules/CategoryModal";
import { getCurrentUserCached } from "./lib/userCache";
import { useLocale } from "../i18n/LocaleProvider";

export default function Header() {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [hasUnread, setHasUnread] = React.useState(false);
  const [catModalOpen, setCatModalOpen] = React.useState(false);
  const [allCategories, setAllCategories] = React.useState<Category[]>([]);
  const [productType, setProductType] = React.useState<ProductTypeKind | null>("physical");
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null);

  const flattenCategories = React.useCallback((list: CategoryDto[], acc: Category[] = []) => {
    for (const c of list) {
      acc.push({
        ID: c.id,
        Name: c.name,
        ParentCategoryId: c.parentCategoryId ?? null,
        Status: c.status ?? undefined,
        Type: normalizeProductType(
          (c as any).type ??
            (c as any).Type ??
            (c as any).productType ??
            (c as any).ProductType ??
            null
        ),
      });
      if (c.subCategories && c.subCategories.length) flattenCategories(c.subCategories, acc);
    }
    return acc;
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((cats) => {
        if (!cancelled) setAllCategories(flattenCategories(cats));
      })
      .catch(() => {
        if (!cancelled) setAllCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [flattenCategories]);
  // theme: default dark; when toggled, set data-theme="light" on <html>
  React.useEffect(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("theme") || document.cookie.match(/(?:^|; )theme=([^;]+)/)?.[1]
          : null;
      const initial = saved === "light" ? "light" : (document.documentElement.getAttribute("data-theme") ?? "dark");
      document.documentElement.setAttribute("data-theme", initial);
      localStorage.setItem("theme", initial);
      document.cookie = `theme=${initial}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {}
  }, []);

  const toggleTheme = React.useCallback(() => {
    try {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      if (isLight) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "dark");
        document.cookie = `theme=dark; path=/; max-age=${60 * 60 * 24 * 365}`;
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
        document.cookie = `theme=light; path=/; max-age=${60 * 60 * 24 * 365}`;
      }
    } catch {}
  }, []);
  const isLogoOnly =
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/moderation/login") ||
    pathname?.startsWith("/forgot-password");
  const isProfileArea = [
    "/profile",
    "/myproducts",
    "/myfavorites",
    "/orderhistory",
    "/mycart",
    "/chat"
  ].some((p) => pathname?.startsWith(p));
  const iconClass = "header-icon h-7 w-7 object-contain";
  const iconStyle = { filter: "brightness(0) invert(1)" } as const;

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const me = await getCurrentUserCached();
        if (!me?.id) {
          if (!cancelled) setHasUnread(false);
          return;
        }
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

  const openCategories = () => {
    setCatModalOpen(true);
  };

  const handleSelectCategory = (id: number) => {
    setSelectedCategory(id);
    const match = allCategories.find((c) => c.ID === id);
    if (match?.Type) setProductType(match.Type);
    setCatModalOpen(false);
    const params = new URLSearchParams();
    params.set("categoryId", String(id));
    router.push(`/search?${params.toString()}`);
  };

  const handlePopular = () => {
    router.push("/search?sort=views");
  };

  const handleSeason = () => {
    router.push("/search?sort=season");
  };

  if (isLogoOnly) {
    return (
      <header className="w-screen relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] bg-[var(--bg-body)]">
        <div className="flex items-center justify-center md:justify-start px-8 py-3 md:mt-0">
          <Link href="/" className="flex items-center" aria-label="Go to home">
            <Image
              src="/loft-logo.svg"
              alt="Loft Logo"
              width={120}
              height={48}
              className="h-9 w-auto cursor-pointer"
            />
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="w-screen relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] bg-[var(--bg-body)]">
      {/* Top row: logo, search, right icons */}
      <div className="flex items-center justify-between px-3 md:px-6 lg:px-13 md:mt-4 pt-4 md:pt-0">
        <div className="flex items-center flex-1">
          <Link href="/" className="hidden md:flex items-center mt-2" aria-label="Go to home">
            <Image src="/loft-logo.svg" alt="Loft Logo" width={50} height={48} className="h-15 w-auto cursor-pointer" />
          </Link>
          {/* Search bar with round green button (hidden on small screens) */}
          <form action="/search" method="GET" className="relative flex-1 max-w-none mr-3 md:mr-23 md:block md:mt-3 mb-3">
            <Input
              name="q"
              placeholder={t("header.searchPlaceholder")}
              className="h-[10%] md:h-[100%] header-search-input !rounded-[12px] bg-[var(--bg-input)] pr-0 md:pr-20"
            />
            <button
              aria-label="search"
              type="submit"
              className="header-search-btn absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[var(--success)] text-black flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </form>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-3 md:gap-8 text-[var(--fg-primary)] md:mr-10 mb-3 md:mb-0">
          {/* theme toggle */}
          <button title={t("common.theme")} onClick={toggleTheme} className="cursor-pointer hidden md:flex">
            <Image src="/Component 29.svg" alt="Theme" width={32} height={32}  className={iconClass} style={iconStyle} />
          </button>
          {/* store -> /product */}
          <button title={t("header.store")} onClick={() => router.push("/myproducts")} className="cursor-pointer hidden md:flex">
            <Image src="/iconoir_shop.svg" alt="Store" width={32} height={32}  className={iconClass} style={iconStyle} />
          </button>
          {/* favorites -> /myfavorites */}
          <button title={t("header.favorites")} onClick={() => router.push("/myfavorites")} className="cursor-pointer hidden md:flex">
            <Image src="/icon-park-solid_like.svg" alt="Favorites" width={32} height={32}  className={iconClass} style={iconStyle} />
          </button>
          {/* notifications -> chat/all */}
          <button
            title={t("header.messages")}
            onClick={() => router.push("/chat/all")}
            className="relative cursor-pointer"
          >
            <Image
              src="/Group.svg"
              alt="Messages"
              width={25}
              height={25}
              className={`${iconClass} w-6 h-6`}
              style={iconStyle}
            />

            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
          {/* cart -> /mycart */}
          <button title={t("header.cart")} onClick={() => router.push("/mycart")} className="cursor-pointer hidden md:flex">
            <Image src="/mynaui_cart-solid.svg" alt="Cart" width={32} height={32}  className={iconClass} style={iconStyle} />
          </button>
          {/* account -> /profile */}
          <button title={t("header.account")} onClick={() => router.push("/profile")} className="cursor-pointer hidden md:flex">
            <Image src="/iconamoon_profile-circle-fill.svg" alt="Account" width={32} height={32}  className={iconClass} style={iconStyle} />
          </button>
        </div>
      </div>

      {/* Bottom row: categories / quick links (hidden for profile area) */}
      {!isProfileArea && (
        <div className="w-full bg-[var(--bg-body)] px-13 hidden md:flex">
          <div className="pt-2 px-8 pb-2 ml-5 flex items-center gap-10 text-[var(--fg-primary)] ml-4">
            <button
              type="button"
              onClick={openCategories}
              className="flex items-center gap-2 cursor-pointer opacity-90 hover:opacity-100"
            >
              <span className="text-xl">≡</span>
              <span className="font-semibold text-xl">{t("header.allCategories")}</span>
            </button>
            <button
              type="button"
              onClick={handlePopular}
              className="opacity-80 cursor-pointer hover:opacity-100"
            >
              {t("header.popular")}
            </button>
            <button
              type="button"
              onClick={handleSeason}
              className="opacity-80 cursor-pointer hover:opacity-100"
            >
              {t("header.season")}
            </button>
          </div>
        </div>
      )}
      <div className="w-full h-px bg-[var(--divider)]" />
      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#222222] border-t border-[var(--divider)] z-40">
        <div className="flex items-center justify-around py-3 px-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex flex-col items-center gap-1 text-xs opacity-90"
            aria-label="Home"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className={iconClass}
              style={{ filter: "none" }}
            >
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5 10v10h5v-6h4v6h5V10" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => router.push("/myfavorites")}
            className="flex flex-col items-center gap-1 text-xs opacity-90"
            aria-label={t("header.favorites")}
          >
            <Image src="/icon-park-solid_like.svg" alt={t("header.favorites")} width={28} height={28} className={iconClass} style={iconStyle} />
          </button>
          <button
            type="button"
            onClick={() => router.push("/mycart")}
            className="flex flex-col items-center gap-1 text-xs opacity-90"
            aria-label={t("header.cart")}
          >
            <Image src="/mynaui_cart-solid.svg" alt={t("header.cart")} width={28} height={28} className={iconClass} style={iconStyle} />
          </button>
          <button
            type="button"
            onClick={() => router.push("/myproducts")}
            className="flex flex-col items-center gap-1 text-xs opacity-90"
            aria-label={t("header.allCategories")}
          >
            <Image src="/iconoir_shop.svg" alt={t("header.allCategories")} width={28} height={28} className={iconClass} style={iconStyle} />
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center gap-1 text-xs opacity-90"
            aria-label={t("header.account")}
          >
            <Image src="/iconamoon_profile-circle-fill.svg" alt={t("header.account")} width={28} height={28} className={iconClass} style={iconStyle} />
          </button>
        </div>
      </div>
      <CategoryModal
        open={catModalOpen}
        categories={allCategories}
        selectedId={selectedCategory}
        productType={productType}
        onSelectType={(type) => setProductType(type)}
        onClose={() => setCatModalOpen(false)}
        onSelect={handleSelectCategory}
      />
    </header>
  );
}
