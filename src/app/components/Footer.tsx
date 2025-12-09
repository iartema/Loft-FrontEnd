"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Footer() {
  const pathname = usePathname();
  const [lastEdited, setLastEdited] = useState<string>("");
  useEffect(() => {
    // Compute only on client after mount to avoid SSR hydration mismatch
    try {
      setLastEdited(new Date().toLocaleString());
    } catch {
      setLastEdited("");
    }
  }, []);
  const hideOn = [
    "/register",
    "/login",
    "/profile",
    "/myfavorites",
    "/orderhistory",
    "/myproducts",
    "/forgot-password"
  ];
  if (hideOn.some((p) => pathname?.startsWith(p))) return null;

  return (
    <footer className="w-screen relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] bg-[var(--bg-body)] mt-8">
      <div className="w-full h-px bg-[var(--divider)]" />
      <div className="px-8 py-10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-8 items-start">
          {/* Brand */}
          <div className="col-span-12 md:col-span-3 flex items-start gap-3">
            <Image src="/loft-logo.svg" alt="Loft Logo" width={120} height={48} className="h-10 w-auto" />
            <div className="leading-tight">
              <div className="text-lg font-semibold">loft</div>
              <div className="text-xs text-white/60">Online store</div>
            </div>
          </div>

          {/* Columns */}
          <FooterColumn
            title="Information"
            items={[
              { label: "About us", href: "/about" },
              { label: "Terms of use", href: "/terms" },
              { label: "Cookie policy", href: "/cookies" },
            ]}
          />
          <FooterColumn
            title="Catalog"
            items={[
              { label: "Material goods", href: "/search?category=material" },
              { label: "Digital products", href: "/search?category=digital" },
              { label: "Popular categories", href: "/search" },
              { label: "Latest listings", href: "/search" },
            ]}
          />
          <FooterColumn
            title="Help"
            items={[
              { label: "How to buy", href: "/help#how-to-buy" },
              { label: "How to sell", href: "/help#how-to-sell" },
              { label: "Buyer protection", href: "/help#buyer-protection" },
              { label: "Safety rules", href: "/help#buyer-protection" },
            ]}
          />

          {/* Contact */}
          <div className="col-span-12 md:col-span-3 md:ml-auto">
            <div className="mt-8 text-[11px] text-white/60">
              This page was last edited
              <br />
              {lastEdited}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div className="col-span-12 md:col-span-2">
      <div className="text-lg font-semibold mb-4">{title}</div>
      <ul className="space-y-2 text-white/70">
        {items.map((item, i) => (
          <li key={i} className="text-sm">
            <a href={item.href} className="hover:text-white">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IconCircle({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span title={label} className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-[var(--bg-elev-1)] text-white/90">
      {children}
    </span>
  );
}
