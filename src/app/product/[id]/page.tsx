"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getProductFull,
  incrementProductViews,
  currencySymbol,
  type ProductFull,
} from "../../components/lib/mockProduct";
import ProductGallery from "../../components/organisms/ProductGallery";
import ProductCard from "../../components/organisms/ProductCard";
import ProductInfo from "../../components/organisms/ProductInfo";
import ProductComments from "../../components/organisms/ProductComments";
import Divider from "../../components/atoms/Divider";
import { useParams } from "next/navigation";

export default function ProductViewPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProductFull | undefined>(undefined);

  useEffect(() => {
    const run = async () => {
      const full = await getProductFull(Number(id));
      setData(full);
      if (full) incrementProductViews(full.product.ID);
    };
    run();
  }, [id]);

  const priceLabel = useMemo(() => {
    if (!data) return "";
    return `${currencySymbol[data.product.Currency]}${data.product.Price}`;
  }, [data]);

  if (!data) {
    return (
      <div className="h-[calc(100dvh-80px)] overflow-y-auto bg-[#111111] text-white flex items-center justify-center">
        <div className="opacity-70">Loading product…</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-80px)] overflow-y-auto bg-[#111111] text-white">
      <div className="max-w-[1600px] mx-auto px-24 py-10 pb-24">
        {/* top grid */}
        <section className="grid grid-cols-12 gap-10">
          <div className="col-span-12 md:col-span-7">
            <ProductGallery images={data.images.map(i => i.Url)} />
          </div>
          <div className="col-span-12 md:col-span-5">
            <ProductCard
              name={data.product.Name}
              sku={`SKU ${data.product.ID}`}
              views={data.product.Views ?? 0}
              inStock={data.product.Status === "active"}
              price={priceLabel}
              sellerId={data.product.ID_User}
            />
          </div>
        </section>

        {/* information */}
        <section className="mt-8">
          <ProductInfo
            description={data.product ? data.product.Name + " — " + (data.product?.Type ?? "") : ""}
            longDescription={
              "Lorem ipsum is simply dummy text of the printing and typesetting industry. " +
              "Use backend value here when available."
            }
            specs={data.attributesValues.map(a => ({
              label: a.Name,
              value:
                a.Type === "multiselect"
                  ? a.Value.split("|").join(", ")
                  : a.Type === "boolean"
                  ? (a.Value === "true" ? "Yes" : "No")
                  : a.Value,
            }))}
          />
        </section>

        <Divider text="Comments" className="mt-12" />

        {/* comments */}
        <ProductComments productId={data.product.ID} />
      </div>
    </div>
  );
}
