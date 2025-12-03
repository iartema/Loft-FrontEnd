"use client";

import Link from "next/link";
import { Almarai } from "next/font/google";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--bg-body)] text-white flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <div className={`${almarai.className} text-6xl font-bold`}>404</div>
        <p className="text-lg text-white/70">This page drifted off the loft. Let&rsquo;s get you back.</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2 rounded-full bg-[var(--success,#9ef1c7)] text-black font-semibold hover:opacity-90"
          >
            Go home
          </Link>
          <Link
            href="/search"
            className="px-5 py-2 rounded-full border border-[var(--divider)] text-white hover:bg-[var(--bg-elev-1)]"
          >
            Browse products
          </Link>
        </div>
      </div>
    </main>
  );
}
