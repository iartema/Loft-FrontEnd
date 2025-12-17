"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";

type FooterItem = { label: string; href: string };
const HIDE_ON = [
  "/register",
  "/login",
  "/profile",
  "/myfavorites",
  "/orderhistory",
  "/myproducts",
  "/forgot-password",
];

export default function Footer() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [lastEdited, setLastEdited] = useState<string>("");

  useEffect(() => {
    try {
      setLastEdited(new Date().toLocaleString());
    } catch {
      setLastEdited("");
    }
  }, []);

  const infoItems = useMemo<FooterItem[]>(
    () => [
      { label: t("footer.info.about"), href: "/about" },
      { label: t("footer.info.terms"), href: "/terms" },
      { label: t("footer.info.cookies"), href: "/cookies" },
    ],
    [t]
  );

  const catalogItems = useMemo<FooterItem[]>(
    () => [
      { label: t("footer.catalog.material"), href: "/search?category=material" },
      { label: t("footer.catalog.digital"), href: "/search?category=digital" },
      { label: t("footer.catalog.popular"), href: "/search" },
      { label: t("footer.catalog.latest"), href: "/search" },
    ],
    [t]
  );

  const helpItems = useMemo<FooterItem[]>(
    () => [
      { label: t("footer.help.buy"), href: "/help#how-to-buy" },
      { label: t("footer.help.sell"), href: "/help#how-to-sell" },
      { label: t("footer.help.protection"), href: "/help#buyer-protection" },
      { label: t("footer.help.safety"), href: "/help#buyer-protection" },
    ],
    [t]
  );

  const shouldHide = useMemo(() => HIDE_ON.some((p) => pathname?.startsWith(p)), [pathname]);
  if (shouldHide) return null;

  return (
    <footer className="w-screen relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] bg-[var(--bg-body)] mt-8">
      <div className="w-full h-px bg-[var(--divider)]" />
      <div className="px-8 py-10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 md:col-span-3 flex items-start gap-3">
            <Image src="/loft-logo.svg" alt="Loft Logo" width={120} height={48} className="h-10 w-auto" />
            <div className="leading-tight">
              <div className="text-lg font-semibold">loft</div>
              <div className="text-xs text-white/60">{t("footer.brand")}</div>
            </div>
          </div>

          <FooterColumn title={t("footer.info.title")} items={infoItems} />
          <FooterColumn title={t("footer.catalog.title")} items={catalogItems} />
          <FooterColumn title={t("footer.help.title")} items={helpItems} />

          <div className="col-span-12 md:col-span-3 md:ml-auto">
            <div className="mt-8 text-[11px] text-white/60">
              {t("footer.lastEdited")}
              <br />
              {lastEdited}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: FooterItem[] }) {
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
