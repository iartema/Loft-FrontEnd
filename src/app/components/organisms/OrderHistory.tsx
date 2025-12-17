"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Title from "../atoms/Title";
import ManagableProductCard from "../molecules/ManagableProductCard";
import { fetchOrdersByCustomer, type OrderDto } from "../lib/api";
import { getCurrentUserCached } from "../lib/userCache";
import { getFirstPublicImageUrl, resolveMediaUrl } from "../../lib/media";
import { useLocale } from "../../i18n/LocaleProvider";

export default function OrderHistory() {
  const { t } = useLocale();
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
        if (!cancelled) setError(err?.message || t("orders.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, t]);

  return (
    <div className="flex flex-col gap-8">
      <Title className="font-semibold text-white" size="lg">
        {t("orders.title")}
      </Title>
      <div className="border-t border-[var(--divider)]" />

      {error && <div className="text-sm text-red-400">{error}</div>}
      {loading ? (
        <div className="text-sm opacity-70">{t("orders.loading")}</div>
      ) : orders.length === 0 ? (
        <div className="text-sm opacity-70">{t("orders.empty")}</div>
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
            const name = firstItem?.productName ?? `${t("orders.orderNumber")} #${order.id}`;
            const desc = `${t("orders.placedOn")} ${new Date(order.orderDate).toLocaleDateString()} - ${t("orders.status")} ${order.status}`;
            const price = `${order.totalAmount?.toFixed?.(2) ?? order.totalAmount ?? 0}$`;
            return (
              <ManagableProductCard
                key={order.id}
                name={name}
                description={desc}
                price={price}
                image={image}
                buttonLabel={t("common.details")}
                onClick={() => router.push(`/orders/${order.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
