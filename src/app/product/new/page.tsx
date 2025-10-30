"use client";

import ProductForm from "../../components/organisms/ProductForm";

export default function ProductNewPage() {
  return (
    <div className="h-[calc(100dvh-80px)] overflow-y-auto bg-[#111111] text-white">
      <div className="max-w-[1600px] mx-auto px-24 py-10 pb-36">
        <ProductForm />
      </div>
    </div>
  );
}
