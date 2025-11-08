"use client";
import React from "react";
import Image from "next/image";
import Button from "../atoms/Button";
import { Almarai } from "next/font/google";

const almarai = Almarai({
  subsets: ["latin"],
  weight: "400",
});

interface ProductCardProps {
  id?: number;
  name: string;
  description: string;
  price: string;
  image: string;
  onClick?: () => void;
  buttonLabel?: string;
}

export default function ManagableProductCard({
  name,
  description,
  price,
  image,
  onClick,
  buttonLabel = "Details",
}: ProductCardProps) {
  return (
    <div
      className={`${almarai.className} bg-[var(--bg-elev-1)] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all flex flex-col`}
      style={{ height: "300px" }} // set stable height
    >
      {/* Image */}
      <div className="relative w-full h-[180px] flex-shrink-0">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 20vw"
        />
      </div>

      {/* Info */}
      <div className="p-2 flex flex-col justify-between flex-1">
        <div>
          <p className="text-sm text-gray-300 line-clamp-2">{description}</p>
          <p className="text-white">{price}</p>
        </div>
        <Button variant="card" label={buttonLabel} onClick={onClick} />
      </div>
    </div>
  );
}
