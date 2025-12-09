"use client";

import CartView from "../components/organisms/CartView";

export default function MyCartPage() {
  return (
    <div className="min-h-[calc(100dvh-80px)] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <CartView />
      </div>
    </div>
  );
}
