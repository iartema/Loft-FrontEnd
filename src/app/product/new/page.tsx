"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "../../components/organisms/ProductForm";
import { getCurrentUserCached } from "../../components/lib/userCache";
import { useLocale } from "../../i18n/LocaleProvider";

export default function ProductNewPage() {
  const { t } = useLocale();
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
        <div className="opacity-70">{t("auth.loading") ?? "Loading..."}</div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-body)] text-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-24 py-8 md:py-10 pb-24 md:pb-36">
        <div className="md:hidden flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="p-2 -ml-2 rounded-full bg-[var(--bg-elev-2)] border border-[var(--divider)]"
            aria-label={t("common.back")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">{t("products.newListing") ?? "New listing"}</h1>
        </div>
        <ProductForm />
      </div>
    </div>
  );
}
