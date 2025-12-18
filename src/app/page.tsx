"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchCategories,
  searchProductsExternal,
  fetchFavoriteItems,
  addFavoriteProduct,
  removeFavoriteProduct,
  ApiError,
  type CategoryDto,
  type ProductDto,
} from "./components/lib/api";
import { loadRecentProducts, type RecentProduct } from "./components/lib/recentlyViewed";
import ViewProductCardSearch from "./components/molecules/ViewProductCardSearch";
import { getFirstPublicImageUrl, resolveMediaUrl } from "./lib/media";
import { useRouter } from "next/navigation";
import { useLocale } from "./i18n/LocaleProvider";

const CATEGORY_ICONS = [
  { src: "/categories/solar_confetti-bold.svg", key: "events" },
  { src: "/categories/ri_shirt-fill.svg", key: "apparel" },
  { src: "/categories/ph_dress-fill.svg", key: "dresses" },
  { src: "/categories/mdi_teddy-bear.svg", key: "toys" },
  { src: "/categories/streamline-ultimate_bicycle-bold.svg", key: "cycling" },
  { src: "/categories/entypo_game-controller.svg", key: "gaming" },
  { src: "/categories/oi_brush.svg", key: "art" },
  { src: "/categories/solar_cosmetic-bold.svg", key: "beauty" },
  { src: "/categories/fa7-solid_mobile-phone.svg", key: "mobile" },
  { src: "/categories/fa-solid_car-alt.svg", key: "auto" },
  { src: "/categories/map_clothing-store.svg", key: "fashion" },
  { src: "/categories/ph_soccer-ball-fill.svg", key: "sport" },
  { src: "/categories/solar_body-bold.svg", key: "lifestyle" },
  { src: "/categories/fa-solid_tools.svg", key: "tools" },
  { src: "/categories/fluent_sound-wave-circle-28-filled.svg", key: "audio" },
  { src: "/categories/ic_baseline-child-friendly.svg", key: "kids" },
  { src: "/categories/streamline-flex_dog-1-remix.svg", key: "pets" },
  { src: "/categories/streamline-block_shopping-furniture.svg", key: "home" },
];

const INTEREST_QUERY_MAP: Record<string, string> = {
  auto: "car",
  apparel: "clothes",
  dresses: "dress",
  toys: "toy",
  cycling: "bike",
  gaming: "gaming",
  art: "art",
  beauty: "beauty",
  mobile: "phone",
  fashion: "fashion",
  sport: "sport",
  lifestyle: "lifestyle",
  tools: "tools",
  audio: "audio",
  kids: "kids",
  pets: "pet",
  home: "home",
  events: "event",
};

type ProductCardItem = {
  id?: number;
  productId?: number;
  name: string;
  description: string;
  price: string;
  image?: string;
};

export default function HomePage() {
  const { t } = useLocale();
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteBusyIds, setFavoriteBusyIds] = useState<Set<number>>(new Set());
  const [categoryHighlights, setCategoryHighlights] = useState<
    { category: CategoryDto; products: ProductDto[] }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, prods] = await Promise.all([
          fetchCategories(),
          searchProductsExternal({ page: 1, pageSize: 32 }),
        ]);
        if (!cancelled) {
          setCategories(cats);
          setProducts(prods.items ?? []);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    setRecent(loadRecentProducts());
    (async () => {
      try {
        const list = await fetchFavoriteItems();
        const next = new Set<number>();
        for (const id of list) {
          if (Number.isFinite(id)) next.add(Number(id));
        }
        setFavoriteIds(next);
      } catch {
        setFavoriteIds(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!categories.length || !products.length) return;
    const counts = new Map<number, number>();
    products.forEach((p) => {
      if (!p.categoryId) return;
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    });
    const leafCategories = categories.filter((c) => !c.subCategories || c.subCategories.length === 0);
    const sortedCounts = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
    const topIds: number[] = [];
    for (const id of sortedCounts) {
      if (topIds.length >= 4) break;
      topIds.push(id);
    }
    const fallbackLeafs = leafCategories
      .filter((cat) => !topIds.includes(cat.id))
      .slice(0, Math.max(0, 4 - topIds.length));
    topIds.push(...fallbackLeafs.map((c) => c.id));
    if (!topIds.length) return;
    const categoryById = new Map(categories.map((c) => [c.id, c]));
    (async () => {
      try {
        const result = await Promise.all(
          topIds.map(async (catId) => {
            const category = categoryById.get(catId);
            if (!category) return null;
            const resp = await searchProductsExternal({ categoryId: catId, page: 1, pageSize: 12 });
            let items = resp.items ?? [];
            if (!items.length) {
              items = products.filter((p) => p.categoryId === catId).slice(0, 12);
            }
            return { category, products: items };
          })
        );
        if (!cancelled) {
          setCategoryHighlights(result.filter((r): r is { category: CategoryDto; products: ProductDto[] } => !!r));
        }
      } catch {
        if (!cancelled) setCategoryHighlights([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categories, products]);

  const formatPrice = (value?: number | null, currency?: string | number | null) => {
    if (value == null) return "";
    const symbolMap: Record<string, string> = {
      USD: "$",
      UAH: "₴",
      0: "₴",
      1: "$",
    };
    const codeMap: Record<string, string> = {
      0: "UAH",
      1: "USD",
    };
    const key =
      currency == null ? "" : typeof currency === "number" ? String(currency) : currency.toString().toUpperCase();
    const symbol = key ? symbolMap[key] : "";
    const code = key ? codeMap[key] ?? key : "";
    if (symbol) return `${symbol} ${value}`;
    if (code) return `${value} ${code}`;
    return `${value}`;
  };

  const kvProduct = (p: ProductDto): ProductCardItem => ({
    id: p.id,
    productId: p.id,
    name: p.name,
    description: p.description ?? "",
    price: formatPrice(p.price, p.currency),
    image: getFirstPublicImageUrl(p.mediaFiles) || "/default-product.jpg",
  });

  const recentItems: ProductCardItem[] = recent.length
    ? recent.map((item) => ({
        id: item.id,
        productId: item.id,
        name: item.name,
        description: "",
        price: formatPrice(item.price, item.currency),
        image: resolveMediaUrl(item.image ?? undefined) || "/default-product.jpg",
      }))
    : products.slice(0, 6).map(kvProduct);

  const trendingItems = useMemo(() => {
    if (!products.length) return [];
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 12).map(kvProduct);
  }, [products, kvProduct]);

  const interestIcons = useMemo(() => {
    type IconEntry = { src: string; key?: string; label?: string };
    const base: IconEntry[] =
      CATEGORY_ICONS.length > 0
        ? CATEGORY_ICONS
        : categories.map((cat) => ({
            src: "/categories/ri_shirt-fill.svg",
            label: cat.name,
          }));
    const icons = base.slice(0, 18);
    let idx = 0;
    while (icons.length < 18) {
      const fallback: IconEntry =
        CATEGORY_ICONS[idx % CATEGORY_ICONS.length] ?? {
          src: "/categories/ri_shirt-fill.svg",
          label: t("home.categoryFallback"),
        };
      icons.push(fallback);
      idx += 1;
    }
    return icons.map((icon) => ({
      ...icon,
      label: icon.key ? t(`home.categories.${icon.key}`) : icon.label ?? t("home.categoryFallback"),
    }));
  }, [categories, t]);

  const handleInterestClick = (icon: { key?: string; label?: string }) => {
    const query =
      (icon.key && INTEREST_QUERY_MAP[icon.key]) ||
      icon.label ||
      t("home.categoryFallback");
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleToggleFavorite = useCallback(
    async (productId: number) => {
      if (!productId) return;
      setFavoriteBusyIds((prev) => {
        const next = new Set(prev);
        next.add(productId);
        return next;
      });
      const currentlyFavorite = favoriteIds.has(productId);
      try {
        if (currentlyFavorite) {
          await removeFavoriteProduct(productId);
        } else {
          await addFavoriteProduct(productId);
        }
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (currentlyFavorite) next.delete(productId);
          else next.add(productId);
          return next;
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
        } else {
          console.error("Failed to toggle favorite", err);
        }
      } finally {
        setFavoriteBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    [favoriteIds, router]
  );

  return (
    <main className="bg-[var(--bg-body)] text-white min-h-screen">
      <div className="max-w-[1400px] mx-auto md:px-8 md:py-10 space-y-10">
        <section className="py-6 flex flex-col md:flex-row items-center md:justify-between w-full px-3 md:px-40">
          <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-start">
            <Image
              src="/start-selling.svg"
              alt={t("home.heroTitle")}
              width={520}
              height={220}
              className="w-full max-w-[200px] md:max-w-[520px] h-auto object-contain"
              priority
            />
          </div>

          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-4 w-full md:w-auto">
            <h2 className="text-3xl font-semibold">
              {t("home.heroTitle")}
            </h2>

            <p className="sort-label max-w-md">
              {t("home.heroSubtitle")}
            </p>

            <button
              onClick={() => router.push("/product/new")}
              className="px-16 py-4 rounded-full border-[2px] border-yellow-400 text-white text-2xl font-semibold hover:bg-yellow-400 hover:text-black transition"
            >
              {t("home.heroCta")}
            </button>
          </div>
        </section>

        <section className="space-y-4 md:px-0 px-3">
          <h2 className="text-lg text-[var(--success)]">{t("home.interestTitle")}</h2>
          <div
            className="flex gap-3 overflow-x-auto sm:overflow-visible sm:grid sm:grid-cols-6 lg:grid-cols-9 sm:gap-4"
            style={{ scrollbarWidth: "none" }}
          >
            {interestIcons.map((icon, idx) => (
              <button
                key={`${icon.src}-${idx}`}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow hover:scale-105 transition mx-auto flex-shrink-0"
                title={icon.label}
                onClick={() => handleInterestClick(icon)}
              >
                <Image src={icon.src} alt={icon.label} width={32} height={32} />
              </button>
            ))}
          </div>
        </section>

        <ProductSection
          title={t("home.recent")}
          products={recentItems}
          loading={loading && !recent.length}
          wrapLink
          favoriteIds={favoriteIds}
          favoriteBusyIds={favoriteBusyIds}
          onToggleFavorite={handleToggleFavorite}
        />

        <ProductSection
          title={t("home.trending")}
          subtitle={t("home.trendingSubtitle")}
          products={trendingItems}
          loading={loading}
          wrapLink
          favoriteIds={favoriteIds}
          favoriteBusyIds={favoriteBusyIds}
          onToggleFavorite={handleToggleFavorite}
        />

        {categoryHighlights.map((highlight) => (
          <ProductSection
            key={highlight.category.id}
            title={highlight.category.name}
            subtitle={t("home.popularNow")}
            products={highlight.products.map(kvProduct)}
            loading={false}
            wrapLink
            favoriteIds={favoriteIds}
            favoriteBusyIds={favoriteBusyIds}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>
    </main>
  );
}

function ProductSection({
  title,
  subtitle,
  products,
  loading,
  wrapLink,
  favoriteIds,
  favoriteBusyIds,
  onToggleFavorite,
}: {
  title: string;
  subtitle?: string;
  products: ProductCardItem[];
  loading: boolean;
  wrapLink?: boolean;
  favoriteIds: Set<number>;
  favoriteBusyIds: Set<number>;
  onToggleFavorite: (productId: number) => void;
}) {
  const { t } = useLocale();
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      // Always block vertical page scroll
      e.preventDefault();

      // Scroll horizontally using wheel input
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      el.scrollBy({
        left: delta,
        behavior: "smooth",
      });
    };

    // Add non-passive listener
    el.addEventListener("wheel", handler, { passive: false });

    return () => {
      el.removeEventListener("wheel", handler);
    };
  }, []);


  return (
    <section className="space-y-4 md:px-0 px-3">
      <div className="flex items-baseline gap-3">
        <h3 className="text-xl font-semibold">{title}</h3>
        {subtitle && <span className="text-sm opacity-70">{subtitle}</span>}
      </div>
      {loading && !products.length ? (
        <div className="text-white/70 text-sm">{t("home.loading")}</div>
      ) : (
        <div
          ref={rowRef}
          className="flex overflow-x-auto pb-2 snap-x snap-mandatory overscroll-x-contain"
        >
          {products.map((product, idx) => {
            const pid = product.productId ?? product.id ?? 0;
            return (
              <ViewProductCardSearch
                key={`${product.id ?? idx}-${product.name}`}
                productId={pid}
                name={product.name}
                description={" "}
                price={product.price}
                image={product.image}
                onClick={() => product.id && (window.location.href = `/product/${product.id}`)}
                className="min-w-[200px] w-[200px] snap-start md:mr-0 mr-2"
                isFavorite={favoriteIds.has(pid)}
                favoriteBusy={favoriteBusyIds.has(pid)}
                onToggleFavorite={onToggleFavorite}
              />
            );
          })}
        </div>
      )}
      {wrapLink && products.length >= 8 && (
        <div className="text-right">
          <button
            className="text-sm text-[var(--success)] hover:underline"
            onClick={() => (window.location.href = "/search")}
          >
            {t("home.viewMore")}
          </button>
        </div>
      )}
    </section>
  );
}
