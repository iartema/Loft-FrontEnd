"use client";
import React, { useState } from "react";
import Title from "../atoms/Title";
import ManagableProductCard from "../molecules/ManagableProductCard";
import Button from "../atoms/Button";
import { useRouter } from "next/navigation";

const products = [
  {
    id: 1,
    name: "Lorem Ipsum",
    description: "Lorem Ipsum is simply dummy and typesetting industry",
    price: "$200",
    image: "/default-product.jpg",
    status: "Under review",
  },
  {
    id: 2,
    name: "Another Product",
    description: "Active product example",
    price: "$150",
    image: "/default-product.jpg",
    status: "Active",
  },
  {
    id: 3,
    name: "Rejected One",
    description: "Rejected product example",
    price: "$220",
    image: "/default-product.jpg",
    status: "Rejected",
  },
];

export default function MyProducts() {
  const [filter, setFilter] = useState("All");
  const router = useRouter();

  const filtered = filter === "All" ? products : products.filter(p => p.status === filter);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <Title className="font-semibold text-white" size="lg">
          My Products
        </Title>

        <div className="flex justify-end">
        <Button
            variant="submit"
            label="New listing"
            className="px-6 py-2 rounded-xl"
            onClick={() => router.push("/product/new")}
        />
        </div>
      </div>

      <div className="flex gap-6 text-gray-400 text-sm">
        {["All", "Active", "Rejected", "Under review"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`${
              filter === f ? "text-green-400 underline" : "hover:text-white"
            } transition`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="border-t border-neutral-800" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filtered.map((product) => (
          <ManagableProductCard
            key={product.id}
            name={product.name}
            description={product.description}
            price={product.price}
            image={product.image}
            buttonLabel="Details"
            onClick={() => console.log("Details product", product.name)}
          />
        ))}
      </div>
    </div>
  );
}
