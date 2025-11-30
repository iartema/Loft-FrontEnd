"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "../../components/organisms/ProductForm";
import { getCurrentUserCached } from "../../components/lib/userCache";

export default function ProductNewPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getCurrentUserCached(true);
        if (!cancelled) setAuthorized(Boolean(me?.id));
        if (!me?.id && !cancelled) router.push("/login");
      } catch {
        if (!cancelled) router.push("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (authorized === null) {
    return (
      <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-body)] text-white flex items-center justify-center">
        <div className="opacity-70">Checking access…</div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-body)] text-white">
      <div className="max-w-[1600px] mx-auto px-24 py-10 pb-36">
        <ProductForm />
      </div>
    </div>
  );
}

