"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchProductById, type ProductDto } from "../../components/lib/api";
import ProductGallery from "../../components/organisms/ProductGallery";
import ProductCard from "../../components/organisms/ProductCard";
import ProductInfo from "../../components/organisms/ProductInfo";
import ProductComments from "../../components/organisms/ProductComments";
import Divider from "../../components/atoms/Divider";
import { useParams } from "next/navigation";

export default function ProductViewPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProductDto | undefined>(undefined);

  useEffect(() => {
    const run = async () => {
      try {
        const p = await fetchProductById(Number(id));
        setData(p);
      } catch {
        setData(undefined);
      }
    };
    run();
  }, [id]);

  const priceLabel = useMemo(() => {
    if (!data) return "";
    const symbol: Record<string, string> = { USD: "$", EUR: "€", UAH: "₴", GBP: "£" };
    return `${symbol[data.currency] ?? ""}${data.price}`;
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-subtle)] text-white flex items-center justify-center">
        <div className="opacity-70">Loading product…</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-subtle)] text-white">
      <div className="max-w-[1400px] mx-auto px-10 py-10">
        {/* top grid */}
        <section className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-7">
            <ProductGallery images={(data.mediaFiles ?? []).map(m => m.url)} />
          </div>
          <div className="col-span-12 md:col-span-5">
            <ProductCard
              name={data.name}
              sku={`SKU ${data.id}`}
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
              label: String(a.attributeId),
              value: a.value,
            }))}
          />
        </section>

        <Divider text="Comments" className="mt-12" />
        <ProductComments productId={data.id} />
      </div>
    </div>
  );
}

