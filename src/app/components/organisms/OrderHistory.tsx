"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Title from "../atoms/Title";
import ManagableProductCard from "../molecules/ManagableProductCard";
import { fetchOrdersByCustomer, type OrderDto } from "../lib/api";
import { getCurrentUserCached } from "../lib/userCache";
import { getFirstPublicImageUrl, resolveMediaUrl } from "../../lib/media";

export default function OrderHistory() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await getCurrentUserCached();
        if (!me?.id) {
          router.push("/login");
          return;
        }
        const list = await fetchOrdersByCustomer(me.id);
        if (!cancelled) setOrders(list ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex flex-col gap-8">
      <Title className="font-semibold text-white" size="lg">
        Order history
      </Title>
      <div className="border-t border-neutral-800" />

      {error && <div className="text-sm text-red-400">{error}</div>}
      {loading ? (
        <div className="text-sm opacity-70">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="text-sm opacity-70">You have no orders yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {orders.map((order) => {
            const firstItem = order.orderItems?.[0];
            const image =
              firstItem?.imageUrl
                ? resolveMediaUrl(firstItem.imageUrl)
                : firstItem
                ? getFirstPublicImageUrl((firstItem as any)?.mediaFiles) || "/default-product.jpg"
                : "/default-product.jpg";
            const name = firstItem?.productName ?? `Order #${order.id}`;
            const desc = `Placed on ${new Date(order.orderDate).toLocaleDateString()} · ${order.status}`;
            const price = `${order.totalAmount?.toFixed?.(2) ?? order.totalAmount ?? 0}$`;
            return (
              <ManagableProductCard
                key={order.id}
                name={name}
                description={desc}
                price={price}
                image={image}
                buttonLabel="Details"
                onClick={() => router.push(`/orders/${order.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
