"use client";

const COOKIE_NAME = "recent_products";
const MAX_RECENT = 12;

export type RecentProduct = {
  id: number;
  name: string;
  price?: number;
  currency?: string;
  image?: string | null;
  timestamp: number;
};

const getCookie = () => {
  if (typeof document === "undefined") return "";
  return document.cookie || "";
};

export function loadRecentProducts(): RecentProduct[] {
  try {
    const cookies = getCookie();
    const match = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (!match) return [];
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded);
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentProduct[];
  } catch {
    return [];
  }
}

export function saveRecentProduct(product: Omit<RecentProduct, "timestamp">) {
  if (typeof document === "undefined") return;
  const existing = loadRecentProducts().filter((p) => p.id !== product.id);
  const updated: RecentProduct[] = [{ ...product, timestamp: Date.now() }, ...existing].slice(0, MAX_RECENT);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(updated))}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}
