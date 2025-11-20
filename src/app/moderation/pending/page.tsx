"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirstPublicImageUrl } from "../../lib/media";
import Button from "../../components/atoms/Button";

type ModerationProduct = {
  id: number;
  name?: string;
  description?: string;
  sellerName?: string;
  createdAt?: string;
  mediaFiles?: { url?: string }[];
};

export default function ModerationPendingPage() {
  const router = useRouter();
  const [items, setItems] = useState<ModerationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/moderation/products/pending", {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.push("/moderation/login");
        return;
      }
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to load pending products");
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load pending products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const updateStatus = async (id: number, status: "Approved" | "Rejected") => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(
        `/api/moderation/products/${id}/status?status=${status}`,
        { method: "PUT" }
      );
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to update status");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err?.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-body)] text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
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
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-400/10 px-4 py-2 rounded-2xl border border-red-400/40">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center opacity-70">Loading pending products…</div>
        ) : items.length === 0 ? (
          <div className="text-center opacity-70">
            No products are waiting for moderation.
          </div>
        ) : (
          <div className="bg-[var(--bg-elev-1)] rounded-3xl border border-[var(--border)]">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm uppercase text-[var(--fg-muted)] border-b border-[var(--border)]">
              <div className="col-span-4">Product</div>
              <div className="col-span-3">Seller</div>
              <div className="col-span-3">Date</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {items.map((item) => {
              const preview = getFirstPublicImageUrl(item.mediaFiles);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-b-0"
                >
                  <div className="col-span-4 flex gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--bg-elev-2)]">
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
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
                    <div>
                      <p className="font-semibold">{item.name ?? "Untitled"}</p>
                      <p className="text-sm opacity-70 line-clamp-2">
                        {item.description ?? ""}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center">
                    {item.sellerName ?? "Unknown"}
                  </div>
                  <div className="col-span-3 flex items-center">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                  </div>
                  <div className="col-span-2 flex flex-col gap-2 items-stretch">
                    <button
                      className="rounded-full py-1 text-sm bg-red-400 text-black hover:opacity-90 disabled:opacity-50"
                      onClick={() => updateStatus(item.id, "Rejected")}
                      disabled={busyId === item.id}
                    >
                      Reject
                    </button>
                    <button
                      className="rounded-full py-1 text-sm bg-green-400 text-black hover:opacity-90 disabled:opacity-50"
                      onClick={() => updateStatus(item.id, "Approved")}
                      disabled={busyId === item.id}
                    >
                      Approve
                    </button>
                    <button
                      className="rounded-full py-1 text-sm border border-[var(--border)] hover:bg-[var(--bg-elev-2)]"
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
    </div>
  );
}

