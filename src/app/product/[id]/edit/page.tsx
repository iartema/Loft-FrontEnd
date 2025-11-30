"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "../../../components/organisms/ProductForm";
import { fetchProductById, type ProductDto } from "../../../components/lib/api";
import { getCurrentUserCached } from "../../../components/lib/userCache";

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getCurrentUserCached(true);
        if (cancelled) return;
        if (!me?.id) {
          router.replace("/login");
          return;
        }
        setCurrentUserId(me.id);
      } catch {
        if (!cancelled) router.replace("/login");
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchProductById(Number(id))
      .then((p) => {
        if (!active) return;
        setProduct(p);
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || "Failed to load product");
        setProduct(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product || currentUserId === null) return;
    if (product.idUser && product.idUser !== currentUserId) {
      router.replace(`/product/${product.id}`);
    }
  }, [product, currentUserId, router]);

  if (checkingAuth || loading) {
    return (
      <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-body)] text-white flex items-center justify-center">
        <div className="opacity-70">Loading product...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-body)] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-lg">{error}</div>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border)]"
            onClick={() => router.replace(`/product/${id}`)}
          >
            Back to product
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-body)] text-white">
      <div className="max-w-[1600px] mx-auto px-24 py-10 pb-36">
        <ProductForm
          mode="edit"
          productId={Number(id)}
          initialProduct={product}
          lockCategory
          onSaved={(pid) => router.push(`/product/${pid}`)}
        />
      </div>
    </div>
  );
}
