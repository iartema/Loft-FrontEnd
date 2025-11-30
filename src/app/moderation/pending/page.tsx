"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirstPublicImageUrl } from "../../lib/media";
import Button from "../../components/atoms/Button";
import Divider from "../../components/atoms/Divider";
import { Almarai } from "next/font/google";

const almarai = Almarai({ subsets: ["latin"], weight: ["400"] });

type ModerationProduct = {
  id: number;
  idUser?: number | null;
  name?: string;
  description?: string;
  sellerName?: string;
  createdAt?: string;
  mediaFiles?: { url?: string }[];
};

const REJECTION_REASONS = [
  "Inappropriate content",
  "Copyright concerns",
  "Insufficient description",
  "Misleading information",
  "Pricing issue",
  "Duplicate listing",
  "Prohibited item",
];

export default function ModerationPendingPage() {
  const router = useRouter();
  const [items, setItems] = useState<ModerationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reasonModal, setReasonModal] = useState<{ product: ModerationProduct | null; reason: string }>({
    product: null,
    reason: REJECTION_REASONS[0],
  });

  const loadPending = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/moderation/products/pending", {
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/");
        return;
      }

      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to load pending products");
      }

      const data = await res.json();
      const rawItems: ModerationProduct[] = Array.isArray(data) ? data : data?.items || [];

      const sellerMap = new Map<number, string>();
      const idsToFetch = Array.from(
        new Set(
          rawItems
            .filter((item) => !item.sellerName)
            .map((item) => item.idUser ?? (item as any)?.IdUser ?? null)
            .filter((val): val is number => typeof val === "number")
        )
      );

      await Promise.all(
        idsToFetch.map(async (userId) => {
          try {
            const userRes = await fetch(`/api/users/${userId}`, { cache: "no-store" });
            if (!userRes.ok) throw new Error();
            const user = await userRes.json();
            const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
            sellerMap.set(userId, name || user?.email || "Unknown");
          } catch {
            sellerMap.set(userId, "Unknown");
          }
        })
      );

      const withSellers = rawItems.map((item) => {
        if (item.sellerName) return item;
        const userId = item.idUser ?? (item as any)?.IdUser ?? null;
        if (!userId) return item;
        return {
          ...item,
          sellerName: sellerMap.get(userId) ?? "Unknown",
        };
      });

      setItems(withSellers);
    } catch (err: any) {
      setError(err?.message || "Failed to load pending products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const notifySeller = async (userId: number | null | undefined, message: string) => {
    if (!userId) return;
    try {
      await fetch("/api/moderation/notify-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: userId, messageText: message }),
      });
    } catch {
      // ignore notification errors
    }
  };

  const updateStatus = async (item: ModerationProduct, status: "Approved" | "Rejected", reason?: string) => {
    const { id } = item;
    setBusyId(id);
    setError(null);

    try {
      const res = await fetch(
        `/api/moderation/products/${id}/status?status=${status}`,
        { method: "PUT", credentials: "include" }
      );

      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to update status");
      }

      const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "https://www.loft-shop.pp.ua";
      const link = `${origin}/product/${id}`;
      const baseMsg =
        status === "Approved"
          ? `Your product was approved.`
          : `Your product was rejected${reason ? `: ${reason}` : ""}.`;
      await notifySeller(item.idUser ?? null, `${baseMsg} ${link}`);

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err?.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-body)] text-white px-6 py-10">
      <div className="w-[90%] mx-auto">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-semibold">Pending</h1>
          <Button
            type="button"
            className="!bg-[var(--bg-elev-2)] hover:opacity-80 max-w-[160px]"
            onClick={loadPending}
          >
            Refresh
          </Button>
        </div>

        <Divider text=""/>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-400/10 px-4 py-2 rounded-2xl border border-red-400/40">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center opacity-70">Loading pending products…</div>
        ) : items.length === 0 ? (
          <div className="text-center opacity-70">No products are waiting for moderation.</div>
        ) : (
          <div className="rounded-3xl ">

            <div
              className={`flex items-center px-6 py-4 text-sm uppercase text-white border-b border-[var(--border)] ${almarai.className}`}
            >
              <div className="w-[20%] text-center"></div>
              <div className="w-[30%] text-center">Product</div>
              <div className="w-[15%] text-center">Seller</div>
              <div className="w-[20%] text-center">Date</div>
              <div className="w-[15%] text-right pr-2"></div>
            </div>

            {items.map((item) => {
              const preview = getFirstPublicImageUrl(item.mediaFiles);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border)] last:border-b-0"
                >

                  {/* Image column */}
                  <div className="w-[20%] flex-shrink-0">
                    <div className="w-60 h-40 rounded-xl overflow-hidden bg-[var(--bg-elev-2)]">
                      {preview ? (
                        <img
                          src={preview}
                          alt={item.name ?? "Product image"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-xs opacity-60">
                          No image
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name + description */}
                  <div className="w-[30%] flex flex-col">
                    <p className="font-semibold">{item.name ?? "Untitled"}</p>
                    <p className="text-sm opacity-70 line-clamp-2">
                      {item.description ?? ""}
                    </p>
                  </div>

                  {/* Seller */}
                  <div className="w-[15%] text-center">
                    {item.sellerName ?? "Unknown"}
                  </div>

                  {/* Date */}
                  <div className="w-[20%] text-center">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "—"}
                  </div>

                  {/* Actions */}
                  <div className="w-[15%] flex flex-col items-end gap-2">
                    <button
                      className="rounded-full px-4 py-1 text-sm font-bold bg-red-400 text-black hover:opacity-90 disabled:opacity-50 w-full"
                      onClick={() => setReasonModal({ product: item, reason: REJECTION_REASONS[0] })}
                      disabled={busyId === item.id}
                    >
                      Reject
                    </button>

                    <button
                      className="rounded-full px-4 py-1 text-sm font-bold bg-green-400 text-black hover:opacity-90 disabled:opacity-50 w-full"
                      onClick={() => updateStatus(item, "Approved")}
                      disabled={busyId === item.id}
                    >
                      Approve
                    </button>

                    <button
                      className="rounded-full px-4 py-1 text-sm border border-[var(--border)] hover:bg-[var(--bg-elev-2)] w-full"
                      onClick={() => router.push(`/product/${item.id}`)}
                    >
                      Look
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {reasonModal.product && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--bg-body)] rounded-2xl p-6 max-w-md w-full border border-[var(--border)] space-y-4">
            <h3 className="text-lg font-semibold">Select rejection reason</h3>
            <div className="space-y-2">
              {REJECTION_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reject-reason"
                    value={r}
                    checked={reasonModal.reason === r}
                    onChange={() => setReasonModal((prev) => ({ ...prev, reason: r }))}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-elev-2)]"
                onClick={() => setReasonModal({ product: null, reason: REJECTION_REASONS[0] })}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-400 text-black font-semibold hover:opacity-90 disabled:opacity-50"
                disabled={busyId === reasonModal.product.id}
                onClick={() => {
                  const target = reasonModal.product;
                  setReasonModal({ product: null, reason: REJECTION_REASONS[0] });
                  if (target) updateStatus(target, "Rejected", reasonModal.reason);
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
