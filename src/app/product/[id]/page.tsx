"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Almarai, Ysabeau_Office } from "next/font/google";
import {
  fetchProductById,
  fetchCategoryAttributes,
  type ProductDto,
  type CategoryAttributeFullDto,
  searchProductsExternal,
  fetchFavoriteItems,
  addFavoriteProduct,
  removeFavoriteProduct,
  ApiError,
} from "../../components/lib/api";
import ProductGallery from "../../components/organisms/ProductGallery";
import ProductCard from "../../components/organisms/ProductCard";
import ProductInfo from "../../components/organisms/ProductInfo";
import ProductComments from "../../components/organisms/ProductComments";
import Divider from "../../components/atoms/Divider";
import { useParams, useRouter } from "next/navigation";
import { saveRecentProduct } from "../../components/lib/recentlyViewed";
import { getFirstPublicImageUrl, getPublicImageUrls, MEDIA_API_BASE } from "../../lib/media";
import ViewProductCardSearch from "../../components/molecules/ViewProductCardSearch";
import { getCurrentUserCached } from "../../components/lib/userCache";

type CurrencyInfo = { symbol: string };
const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  "0": { symbol: "₴" },
  "1": { symbol: "$" },
};

function resolveCurrency(value: unknown): CurrencyInfo {
  if (value === null || value === undefined) return { symbol: "" };
  const key = typeof value === "number" ? String(value) : String(value).toUpperCase();
  return CURRENCY_MAP[key] ?? { code: key, symbol: "" };
}

const almarai = Almarai({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const ysabeau = Ysabeau_Office({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default function ProductViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ProductDto | undefined>(undefined);
  const [attrNames, setAttrNames] = useState<Record<number, string>>({});
  const [sellerProducts, setSellerProducts] = useState<ProductDto[]>([]);
  const [similarProducts, setSimilarProducts] = useState<ProductDto[]>([]);
  const [isModerator, setIsModerator] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteBusyIds, setFavoriteBusyIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const run = async () => {
      try {
        const p = await fetchProductById(Number(id));
        setData(p);
        saveRecentProduct({
          id: p.id,
          name: p.name,
          price: p.price,
          currency: p.currency,
          image: getFirstPublicImageUrl(p.mediaFiles) || null,
        });
        // fetch attribute metadata for names
        try {
          const meta: CategoryAttributeFullDto[] = await fetchCategoryAttributes(p.categoryId);
          const map: Record<number, string> = {};
          for (const a of meta) map[a.attributeId] = a.attributeName;
          setAttrNames(map);
        } catch {
          setAttrNames({});
        }
      } catch {
        setData(undefined);
      }
    };
    run();
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getCurrentUserCached();
        const role = me?.role ?? me?.Role;
        if (!cancelled) setIsModerator(role === 2 || role === "moderator" || role === "Moderator");
      } catch {
        if (!cancelled) setIsModerator(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ids = await fetchFavoriteItems();
        if (!active) return;
        const next = new Set<number>();
        for (const id of ids) {
          if (Number.isFinite(id)) next.add(Number(id));
        }
        setFavoriteIds(next);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          if (active) setFavoriteIds(new Set());
        } else {
          console.error("Failed to load favorites", err);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!data) {
      setSellerProducts([]);
      setSimilarProducts([]);
      return;
    }
    let active = true;
    const loadRelated = async () => {
      try {
        if (data.idUser) {
          const resp = await searchProductsExternal({ sellerId: data.idUser, pageSize: 12 });
          const items = resp.items ?? [];
          if (active) {
            setSellerProducts(items.filter((p) => p.id !== data.id));
          }
        } else if (active) {
          setSellerProducts([]);
        }
      } catch {
        if (active) setSellerProducts([]);
      }
      try {
        if (data.categoryId) {
          const resp = await searchProductsExternal({ categoryId: data.categoryId, pageSize: 12 });
          const items = resp.items ?? [];
          if (active) {
            setSimilarProducts(items.filter((p) => p.id !== data.id));
          }
        } else if (active) {
          setSimilarProducts([]);
        }
      } catch {
        if (active) setSimilarProducts([]);
      }
    };
    loadRelated();
    return () => {
      active = false;
    };
  }, [data]);

  const formatProductPrice = (product: ProductDto | undefined) => {
    if (!product) return "";
    const { symbol } = resolveCurrency(product.currency);
    return `${symbol}${product.price}`;
  };

  const priceLabel = useMemo(() => {
    if (!data) return "";
    return formatProductPrice(data);
  }, [data]);

  const goToSellerListing = useCallback(() => {
    if (!data?.idUser) return;
    const qs = new URLSearchParams({ sellerId: String(data.idUser) }).toString();
    router.push(`/search?${qs}`);
  }, [data?.idUser, router]);

  const goToSimilarListing = useCallback(() => {
    if (!data?.categoryId) return;
    const qs = new URLSearchParams({ categoryId: String(data.categoryId) }).toString();
    router.push(`/search?${qs}`);
  }, [data?.categoryId, router]);

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

  const renderCarousel = (
    title: string,
    items: ProductDto[],
    action?: { label: string; onClick: () => void }
  ) => {
    if (!items?.length) return null;
    return (
      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${ysabeau.className} text-lg font-semibold text-[var(--success,#9ef1c7)]`}>
            {title}
          </h3>
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="text-sm text-[var(--success,#9ef1c7)] hover:underline"
            >
              {action.label}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-full pb-2">
            {items.map((item) => (
              <ViewProductCardSearch
                key={item.id}
                productId={item.id}
                name={item.name}
                description=""
                price={formatProductPrice(item)}
                image={getFirstPublicImageUrl(item.mediaFiles) || "/default-product.jpg"}
                onClick={() => router.push(`/product/${item.id}`)}
                className="min-w-[220px]"
                isFavorite={favoriteIds.has(item.id)}
                favoriteBusy={favoriteBusyIds.has(item.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  const isGuid = (val: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
  const privateMediaIds =
    data?.mediaFiles
      ?.map((m) => m.url)
      .filter((url): url is string => typeof url === "string" && !!url && isGuid(url.trim())) || [];

  const handleDownloadAll = async () => {
    if (!privateMediaIds.length) return;
    setDownloading(true);
    try {
      const responses = await Promise.all(
        privateMediaIds.map(async (id) => {
          const res = await fetch(`/api/media/token/${id}`, { method: "POST" });
          if (!res.ok) {
            throw new Error(await res.text());
          }
          const data = await res.json();
          const url = data?.downloadUrl || data?.downloadURL || data?.url;
          return url as string | null;
        })
      );

      const root = MEDIA_API_BASE.replace(/\/api\/media$/, "");
      responses
        .filter((u): u is string => typeof u === "string" && !!u)
        .forEach((url) => {
          const href = url.startsWith("http")
            ? url
            : `${root}${url.startsWith("/") ? "" : "/"}${url}`;
          const a = document.createElement("a");
          a.href = href;
          a.download = "";
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
    } catch (err) {
      console.error("Failed to download files", err);
    } finally {
      setDownloading(false);
    }
  };

  if (!data) {
    return (
      <div className={[almarai.className, "min-h-[calc(100dvh-80px)] bg-[var(--bg-subtle)] text-[var(--fg-primary)] flex items-center justify-center"].join(" ")}>
        <div className="opacity-70">Loading product…</div>
      </div>
    );
  }

  return (
    <div className={[almarai.className, "min-h-[calc(100dvh-80px)] bg-[var(--bg-subtle)] text-[var(--fg-primary)]"].join(" ")}>
      <div className="max-w-[1400px] mx-auto px-10 py-10">
        {/* top grid */}
        <section className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-7">
            <ProductGallery images={getPublicImageUrls(data.mediaFiles)} />
          </div>
          <div className="col-span-12 md:col-span-5">
            <ProductCard
              productId={data.id}
              name={data.name}
              sku={`${data.id}`}
              views={data.viewCount ?? 0}
              inStock={(data.quantity ?? 0) > 0}
              price={priceLabel}
              sellerId={data.idUser ?? 0}
              stockQuantity={data.quantity ?? null}
            />
            {isModerator && privateMediaIds.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-input)] text-white border border-[var(--divider)] hover:border-[var(--success)] disabled:opacity-50"
                  disabled={downloading}
                >
                  {downloading ? "Preparing…" : "Download all attached files"}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <ProductInfo
            description={data.name}
            longDescription={data.description ?? ""}
            specs={(data.attributeValues ?? []).map(a => ({
              label: attrNames[a.attributeId] ?? String(a.attributeId),
              value: a.value,
            }))}
          />
        </section>

        <div className="hidden">
          <Divider text="Comments" className="mt-12" />
          <ProductComments productId={data.id} />
        </div>

        {renderCarousel("Products of this seller", sellerProducts, data.idUser
          ? { label: "View more", onClick: goToSellerListing }
          : undefined)}
        {renderCarousel("Similar products", similarProducts, data.categoryId
          ? { label: "View more", onClick: goToSimilarListing }
          : undefined)}
      </div>
    </div>
  );
}
