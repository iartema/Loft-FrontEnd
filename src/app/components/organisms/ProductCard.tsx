"use client";

import Button from "../atoms/Button";
import Divider from "../atoms/Divider";
import { useEffect, useState } from "react";
import { fetchUserById, type User } from "../lib/mockProduct";
import { Almarai } from "next/font/google";
import { Ysabeau_Office } from "next/font/google";
const almarai = Almarai({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const ysabeau_office = Ysabeau_Office({
  subsets: ["latin"],
  weight: ["700", "800"],
});


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
    <div className="space-y-6">
      <div className="bg-[#222222] rounded-xl border border-[#222222] p-6 space-y-4">
        <h2 className={`${ysabeau_office.className} text-lg font-semibold`}>{name}</h2>
        <div className="text-xs opacity-70">Code: {sku}</div>
        <div className="text-xs">{views} views</div>
        <div className={`text-lg ${inStock ? "text-[#6EDE99]" : "text-red-400"}`}>
          {inStock ? "In stock" : "Out of stock"}
        </div>

        <Divider text=""></Divider>
        
        <div className="flex items-center gap-28">
          <div className="text-2xl font-bold">{price}</div>
          <Button variant="submit" className="max-w-[150px]">Buy</Button>
        </div>
      </div>
      <div className="bg-[#222222] rounded-lg p-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-15 h-15 rounded-full bg-[#2a2a2a]" />
            <div>
              <div className="text-sm">{seller?.Username ?? "Seller"}</div>
              <div className="text-xs opacity-70">★★★★★</div>
            </div>
          </div>
          <Button className="max-w-[120px] !bg-[#2D2D30] !hover:bg-[#2D2D30]">Message</Button>
        </div>
    </div>
  );
}
