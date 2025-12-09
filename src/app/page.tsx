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

const CATEGORY_ICONS = [
  { src: "/categories/solar_confetti-bold.svg", label: "Events" },
  { src: "/categories/ri_shirt-fill.svg", label: "Apparel" },
  { src: "/categories/ph_dress-fill.svg", label: "Dresses" },
  { src: "/categories/mdi_teddy-bear.svg", label: "Toys" },
  { src: "/categories/streamline-ultimate_bicycle-bold.svg", label: "Cycling" },
  { src: "/categories/entypo_game-controller.svg", label: "Gaming" },
  { src: "/categories/oi_brush.svg", label: "Art" },
  { src: "/categories/solar_cosmetic-bold.svg", label: "Beauty" },
  { src: "/categories/fa7-solid_mobile-phone.svg", label: "Mobile" },
  { src: "/categories/fa-solid_car-alt.svg", label: "Auto" },
  { src: "/categories/map_clothing-store.svg", label: "Fashion" },
  { src: "/categories/ph_soccer-ball-fill.svg", label: "Sport" },
  { src: "/categories/solar_body-bold.svg", label: "Lifestyle" },
  { src: "/categories/fa-solid_tools.svg", label: "Tools" },
  { src: "/categories/fluent_sound-wave-circle-28-filled.svg", label: "Audio" },
  { src: "/categories/ic_baseline-child-friendly.svg", label: "Kids" },
  { src: "/categories/streamline-flex_dog-1-remix.svg", label: "Pets" },
  { src: "/categories/streamline-block_shopping-furniture.svg", label: "Home" },
];

type ProductCardItem = {
  id?: number;
  productId?: number;
  name: string;
  description: string;
  price: string;
  image?: string;
};

export default function HomePage() {
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
    const base =
      CATEGORY_ICONS.length > 0
        ? CATEGORY_ICONS
        : categories.map((cat) => ({
            src: "/categories/ri_shirt-fill.svg",
            label: cat.name,
          }));
    const icons = base.slice(0, 18);
    let idx = 0;
    while (icons.length < 18) {
      const fallback = CATEGORY_ICONS[idx % CATEGORY_ICONS.length] ?? {
        src: "/categories/ri_shirt-fill.svg",
        label: "Category",
      };
      icons.push(fallback);
      idx += 1;
    }
    return icons;
  }, [categories]);

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
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
        <section className="px-8 py-6 flex items-center gap-8 overflow-hidden">
          <div className="flex-shrink-0 w-full md:w-auto ml-30">
            <Image
              src="/start-selling.svg"
              alt="Start selling illustration"
              width={520}
              height={220}
              className="w-full max-w-[520px] h-auto object-contain"
              priority
            />
          </div>
          <div className="flex flex-col items-center md:items-end text-center md:text-left gap-4 w-full mr-30">
            <h2 className="text-3xl font-semibold">Start selling your products now!</h2>
            <p className="sort-label max-w-md">
              Join hundreds of creators showcasing their best work. Upload your products, manage inventory, and reach new buyers in minutes.
            </p>
            <button
              onClick={() => router.push("/product/new")}
              className="px-16 py-4 rounded-full border-[2px] border-yellow-400 text-white text-2xl font-semibold hover:bg-yellow-400 hover:text-black transition"
            >
              Start
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg text-[var(--success)]">This might interest you.</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-4">
            {interestIcons.map((icon, idx) => (
              <button
                key={`${icon.src}-${idx}`}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow hover:scale-105 transition mx-auto"
                title={icon.label}
              >
                <Image src={icon.src} alt={icon.label} width={32} height={32} />
              </button>
            ))}
          </div>
        </section>

        <ProductSection
          title="Recently viewed items"
          products={recentItems}
          loading={loading && !recent.length}
          wrapLink
          favoriteIds={favoriteIds}
          favoriteBusyIds={favoriteBusyIds}
          onToggleFavorite={handleToggleFavorite}
        />

        <ProductSection
          title="Trending picks"
          subtitle="Top categories right now"
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
            subtitle="Popular right now"
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
    <section className="space-y-4">
      <div className="flex items-baseline gap-3">
        <h3 className="text-xl font-semibold">{title}</h3>
        {subtitle && <span className="text-sm opacity-70">{subtitle}</span>}
      </div>
      {loading && !products.length ? (
        <div className="text-white/70 text-sm">Loading…</div>
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
                className="min-w-[220px] w-[220px] snap-start"
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
            View more
          </button>
        </div>
      )}
    </section>
  );
}
