"use client"

import { Suspense } from "react";
// this is change
import SearchView from "../components/organisms/SearchView";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/70">Loading search...</div>}>
      <SearchView />
    </Suspense>
  );
}
