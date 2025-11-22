"use client";

import { useEffect, useMemo, useState } from "react";
import { Almarai, Ysabeau_Office } from "next/font/google";
import {
  fetchProductById,
  fetchCategoryAttributes,
  type ProductDto,
  type CategoryAttributeFullDto,
  searchProductsExternal,
} from "../../components/lib/api";
import ProductGallery from "../../components/organisms/ProductGallery";
import ProductCard from "../../components/organisms/ProductCard";
import ProductInfo from "../../components/organisms/ProductInfo";
import ProductComments from "../../components/organisms/ProductComments";
import Divider from "../../components/atoms/Divider";
import { useParams, useRouter } from "next/navigation";
import { saveRecentProduct } from "../../components/lib/recentlyViewed";
import { getFirstPublicImageUrl, getPublicImageUrls } from "../../lib/media";
import ViewProductCardSearch from "../../components/molecules/ViewProductCardSearch";

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
    if (!data) {
      setSellerProducts([]);
      setSimilarProducts([]);
      return;
    }
    let active = true;
    const loadRelated = async () => {
      try {
        if (data.idUser) {
          const items = await searchProductsExternal({ sellerId: data.idUser, pageSize: 12 });
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
          const items = await searchProductsExternal({ categoryId: data.categoryId, pageSize: 12 });
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

  const renderCarousel = (title: string, items: ProductDto[]) => {
    if (!items?.length) return null;
    return (
      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${ysabeau.className} text-lg font-semibold text-[var(--success,#9ef1c7)]`}>
            {title}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-full pb-2">
            {items.map((item) => (
              <ViewProductCardSearch
                key={item.id}
                productId={item.id}
                name={item.name}
                description={item.description ?? ""}
                price={formatProductPrice(item)}
                image={getFirstPublicImageUrl(item.mediaFiles) || "/default-product.jpg"}
                onClick={() => router.push(`/product/${item.id}`)}
                className="min-w-[240px]"
              />
            ))}
          </div>
        </div>
      </section>
    );
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
            />
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

        {renderCarousel("Products of this seller", sellerProducts)}
        {renderCarousel("Similar products", similarProducts)}
      </div>
    </div>
  );
}
