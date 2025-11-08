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
  ];
  if (hideOn.some((p) => pathname?.startsWith(p))) return null;

  return (
    <footer className="w-full mt-8">
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
          <FooterColumn title="Information" />
          <FooterColumn title="Partners" />
          <FooterColumn title="Help" />

          {/* Contact */}
          <div className="col-span-12 md:col-span-3 md:ml-auto">
            <div className="text-lg font-semibold mb-4">Contact us</div>
            <div className="flex items-center gap-4">
              {/* phone */}
              <IconCircle label="Phone">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19 19 0 0 1-8.26-3.07 18.5 18.5 0 0 1-5.69-5.69A19 19 0 0 1 2.08 4.18 2 2 0 0 1 4 2h2a2 2 0 0 1 2 1.72c.12.9.31 1.78.57 2.63a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 7 7l1.45-1.03a2 2 0 0 1 2.11-.45c.85.26 1.73.45 2.63.57A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </IconCircle>
              {/* instagram */}
              <IconCircle label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="17" cy="7" r="1" fill="currentColor"/>
                </svg>
              </IconCircle>
              {/* telegram */}
              <IconCircle label="Telegram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 3 10 14" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="m21 3-7 18-4-8-8-4 18-6Z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </IconCircle>
              {/* facebook */}
              <IconCircle label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 8h-2a2 2 0 0 0-2 2v3H9v3h2v5h3v-5h2.5l.5-3H14v-2a1 1 0 0 1 1-1h2V8Z" fill="currentColor"/>
                </svg>
              </IconCircle>
            </div>

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

function FooterColumn({ title }: { title: string }) {
  const items = ["Lorem ipsum dolor", "Lorem ipsum dolor", "Lorem ipsum dolor", "Lorem ipsum dolor"];
  return (
    <div className="col-span-12 md:col-span-2">
      <div className="text-lg font-semibold mb-4">{title}</div>
      <ul className="space-y-2 text-white/70">
        {items.map((t, i) => (
          <li key={i} className="text-sm">{t}</li>
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
