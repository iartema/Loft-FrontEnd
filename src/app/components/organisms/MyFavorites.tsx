"use client";
import React from "react";
import Title from "../atoms/Title";
import ManagableProductCard from "../molecules/ManagableProductCard";

const orders = [
  {
    id: 1,
    name: "Lorem Ipsum",
    description: "Lorem Ipsum is simply dummy and typesetting industry",
    price: "$200",
    image: "/default-product.jpg",
  },
  // ...more
];

export default function MyFavorites() {
  return (
    <div className="flex flex-col gap-8">
      <Title className="font-semibold text-white" size="lg">
        My favorites
      </Title>
      <div className="border-t border-neutral-800" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {orders.map((order) => (
          <ManagableProductCard
            key={order.id}
            name={order.name}
            description={order.description}
            price={order.price}
            image={order.image}
            buttonLabel="Details"
            onClick={() => console.log("View details for", order.name)}
          />
        ))}
      </div>
    </div>
  );
}
