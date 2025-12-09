"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Almarai, Ysabeau_Office } from "next/font/google";
import { fetchOrderById, fetchProductById, type OrderDto } from "../../components/lib/api";
import { resolveMediaUrl, getFirstPublicImageUrl, MEDIA_API_BASE } from "../../lib/media";
import { getCurrentUserCached } from "../../components/lib/userCache";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });
const ysabeau = Ysabeau_Office({ subsets: ["latin"], weight: ["600", "700"] });

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [digitalMediaIds, setDigitalMediaIds] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserCached()
      .then((user) => {
        if (!cancelled) setCurrentUserId(user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setCurrentUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrderById(Number(id));
        if (!cancelled) setOrder(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load order");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const loadDigital = async () => {
      if (!order?.orderItems?.length) return;
      const ids: string[] = [];
      for (const item of order.orderItems) {
        const productId = item.productId;
        if (!productId) continue;
        try {
          const product = await fetchProductById(productId);
          const privateIds =
            product.mediaFiles
              ?.map((m) => m.url)
              .filter(
                (url): url is string =>
                  typeof url === "string" &&
                  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
                    url.trim()
                  )
              ) || [];
          ids.push(...privateIds);
        } catch {
          // ignore failed product fetches
        }
      }
      if (!cancelled) {
        const unique = Array.from(new Set(ids));
        setDigitalMediaIds(unique);
      }
    };
    loadDigital();
    return () => {
      cancelled = true;
    };
  }, [order]);

  const total = useMemo(() => {
    if (!order?.orderItems) return 0;
    return order.orderItems.reduce((sum, item) => sum + Number(item.price ?? 0) * (item.quantity ?? 0), 0);
  }, [order]);

  const resolveImage = (url?: string | null, mediaFiles?: any) => {
    if (url) {
      if (url.startsWith("/media")) return resolveMediaUrl(url);
      return url;
    }
    if (Array.isArray(mediaFiles)) {
      const first = getFirstPublicImageUrl(mediaFiles);
      if (first) return first;
    }
    return "/default-product.jpg";
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-body)] text-white flex items-center justify-center">
        <div className="opacity-70">Loading order…</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-body)] text-white flex items-center justify-center">
        <div className="opacity-70">{error || "Order not found"}</div>
      </div>
    );
  }

  const isBuyer = currentUserId !== null && order.customerId === currentUserId;

  const handleDownloadAll = async () => {
    if (!digitalMediaIds.length || !isBuyer) return;
    setDownloading(true);
    try {
      const responses = await Promise.all(
        digitalMediaIds.map(async (mediaId) => {
          const res = await fetch(`/api/media/token/${mediaId}`, { method: "POST" });
          if (!res.ok) {
            throw new Error(await res.text());
          }
          const data = await res.json();
          return data?.downloadUrl || data?.downloadURL || data?.url || null;
        })
      );

      const root = MEDIA_API_BASE.replace(/\/api\/media$/, "");
      responses
        .filter((u): u is string => typeof u === "string" && !!u)
        .forEach((url) => {
          const href = url.startsWith("http")
            ? url
            : `${root}${url.startsWith("/") ? "" : "/"}${url}`;
          const a = document.createElement("a");
          a.href = href;
          a.download = "";
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
    } catch (err) {
      console.error("Failed to download files", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className={`${almarai.className} bg-[var(--bg-body)] text-white min-h-screen px-6 py-10`}>
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className={`${ysabeau.className} text-3xl font-semibold`}>Order #{order.id}</h1>
          <button
            className="text-sm text-[var(--success)] hover:underline"
            onClick={() => router.push("/orderhistory")}
          >
            Back to orders
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-elev-2)]/60 border border-[var(--border)] rounded-2xl p-4 space-y-2 md:col-span-2">
            <div className="flex justify-between text-sm opacity-80">
              <span>Status</span>
              <span className="font-semibold text-white">{order.status}</span>
            </div>
            <div className="flex justify-between text-sm opacity-80">
              <span>Placed</span>
              <span>{new Date(order.orderDate).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm opacity-80">
              <span>Total</span>
              <span className="font-semibold">{total.toFixed(2)}$</span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Shipping</h3>
              <div className="text-sm opacity-80">
                <div>{order.shippingRecipientName || order.customerName || "Recipient"}</div>
                <div>{order.shippingAddress}</div>
                <div>{order.shippingCity}</div>
                <div>{order.shippingPostalCode}</div>
                <div>{order.shippingCountry}</div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-elev-2)]/60 border border-[var(--border)] rounded-2xl p-4 space-y-2">
            <div className="text-sm opacity-80 flex justify-between">
              <span>Items total</span>
              <span>{total.toFixed(2)}$</span>
            </div>
            <div className="text-base font-semibold flex justify-between">
              <span>Total</span>
              <span>{total.toFixed(2)}$</span>
            </div>
            {isBuyer && digitalMediaIds.length > 0 && (
              <div className="pt-4 border-t border-[var(--border)] mt-2 space-y-2">
                <div className="text-sm opacity-80">Digital items available</div>
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  disabled={downloading}
                  className="w-full rounded-lg px-4 py-2 bg-[var(--bg-input)] hover:border-[var(--success)] border border-[var(--border)] disabled:opacity-50 text-sm font-semibold"
                >
                  {downloading ? "Preparing…" : "Download all files"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[var(--bg-elev-2)]/60 border border-[var(--border)] rounded-2xl p-4 space-y-3">
          <h3 className="text-lg font-semibold">Items</h3>
          {order.orderItems?.length ? (
            order.orderItems.map((item) => {
              const img = resolveImage(item.imageUrl, (item as any)?.mediaFiles);
              return (
                <div key={item.id} className="flex items-center gap-3 border-b border-[var(--border)] last:border-b-0 pb-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--bg-elev-1)]">
                    <img src={img} alt={item.productName ?? "Product"} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{item.productName ?? `Product ${item.productId}`}</div>
                    <div className="text-xs opacity-70">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold">{Number(item.price ?? 0).toFixed(2)}$</div>
                </div>
              );
            })
          ) : (
            <div className="text-sm opacity-70">No items found.</div>
          )}
        </div>
      </div>
    </main>
  );
}
