"use client";

import Button from "../atoms/Button";
import { useEffect, useState } from "react";
import { fetchUserById, type User } from "../lib/mockProduct";

export default function ProductCard({
  name,
  sku,
  views,
  inStock,
  price,
  sellerId,
}: {
  name: string;
  sku: string;
  views: number;
  inStock: boolean;
  price: string;
  sellerId: number;
}) {
  const [seller, setSeller] = useState<User | undefined>(undefined);

  useEffect(() => {
    fetchUserById(sellerId).then(setSeller);
  }, [sellerId]);

  return (
    <div className="bg-[#161616] rounded-2xl p-5 border border-[#2a2a2a] space-y-4">
      <h2 className="text-xl font-semibold">{name}</h2>
      <div className="text-xs opacity-75 -mt-1">{sku}</div>
      <div className="text-xs opacity-75">{views} views</div>
      <div className={`text-sm ${inStock ? "text-green-400" : "text-red-400"}`}>
        {inStock ? "In stock" : "Out of stock"}
      </div>

      <div className="bg-[#111111] rounded-xl p-4 flex items-center justify-between">
        <div className="text-2xl font-bold">{price}</div>
        <Button variant="submit" className="max-w-[160px]">Buy</Button>
      </div>

      {/* seller card */}
      <div className="bg-[#1b1b1b] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#2a2a2a]" />
          <div className="flex flex-col">
            <span className="text-sm">{seller?.Username ?? "Seller"}</span>
            <span className="text-xs opacity-70">★★★★★</span>
          </div>
        </div>
        <Button className="max-w-[140px] bg-[#2a2a2a] hover:bg-[#343434]">Message</Button>
      </div>
    </div>
  );
}
