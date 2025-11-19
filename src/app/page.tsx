"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchCategories,
  searchProductsExternal,
  type CategoryDto,
  type ProductDto,
} from "./components/lib/api";
import { loadRecentProducts, type RecentProduct } from "./components/lib/recentlyViewed";
import ViewProductCardSearch from "./components/molecules/ViewProductCardSearch";

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
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [recent, setRecent] = useState<RecentProduct[]>([]);
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
          setProducts(prods);
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
            let items = await searchProductsExternal({ categoryId: catId, page: 1, pageSize: 12 });
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

  const formatPrice = (value?: number | null, currency?: string | null) => {
    if (value == null) return "";
    const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", UAH: "₴" };
    const symbol = currency ? symbols[String(currency).toUpperCase()] ?? currency : "";
    return `${symbol}${value}`;
  };

  const kvProduct = (p: ProductDto): ProductCardItem => ({
    id: p.id,
    productId: p.id,
    name: p.name,
    description: p.description ?? "",
    price: formatPrice(p.price, p.currency),
    image: p.mediaFiles?.[0]?.url,
  });

  const recentItems: ProductCardItem[] = recent.length
    ? recent.map((item) => ({
        id: item.id,
        productId: item.id,
        name: item.name,
        description: "",
        price: formatPrice(item.price, item.currency),
        image: item.image ?? undefined,
      }))
    : products.slice(0, 6).map(kvProduct);

  const trendingItems = useMemo(() => {
    if (!products.length) return [];
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 12).map(kvProduct);
  }, [products]);

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

  return (
    <main className="bg-[var(--bg-body)] text-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
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
        />

        <ProductSection
          title="Trending picks"
          subtitle="Top categories right now"
          products={trendingItems}
          loading={loading}
          wrapLink
        />

        {categoryHighlights.map((highlight) => (
          <ProductSection
            key={highlight.category.id}
            title={highlight.category.name}
            subtitle="Popular right now"
            products={highlight.products.map(kvProduct)}
            loading={false}
            wrapLink
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
}: {
  title: string;
  subtitle?: string;
  products: ProductCardItem[];
  loading: boolean;
  wrapLink?: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
  if (!rowRef.current) return;

  // Always block vertical page scroll while hovering
  event.preventDefault();
  event.stopPropagation();

  // Use vertical wheel movement to scroll horizontally
  const scrollAmount =
    Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

  rowRef.current.scrollBy({
    left: scrollAmount,
    behavior: "smooth",
  });
};

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
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory overscroll-x-contain"
        >
          {products.map((product, idx) => (
            <ViewProductCardSearch
              key={`${product.id ?? idx}-${product.name}`}
              productId={product.productId ?? product.id}
              name={product.name}
              description={product.description ?? " "}
              price={product.price}
              image={product.image}
              onClick={() => product.id && (window.location.href = `/product/${product.id}`)}
              className="min-w-[220px] w-[220px] snap-start"
            />
          ))}
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
