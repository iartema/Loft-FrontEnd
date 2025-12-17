"use client"

"use client"

import { Suspense } from "react";
// this is change
import SearchView from "../components/organisms/SearchView";
import { useLocale } from "../i18n/LocaleProvider";

export default function SearchPage() {
  const { t } = useLocale();
  return (
    <Suspense fallback={<div className="p-8 text-white/70">{t("search.loading")}</div>}>
      <SearchView />
    </Suspense>
  );
}
