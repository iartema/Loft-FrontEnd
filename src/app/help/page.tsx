"use client";

import { useMemo } from "react";
import { Almarai } from "next/font/google";
import { useLocale } from "../i18n/LocaleProvider";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

type HelpBlock = { title: string; items: string[] };

export default function HelpPage() {
  const { t } = useLocale();

  const blocks: HelpBlock[] = useMemo(
    () => [
      {
        title: t("help.blocks.buy.title"),
        items: [
          t("help.blocks.buy.items.0"),
          t("help.blocks.buy.items.1"),
          t("help.blocks.buy.items.2"),
        ],
      },
      {
        title: t("help.blocks.sell.title"),
        items: [
          t("help.blocks.sell.items.0"),
          t("help.blocks.sell.items.1"),
          t("help.blocks.sell.items.2"),
        ],
      },
      {
        title: t("help.blocks.protection.title"),
        items: [
          t("help.blocks.protection.items.0"),
          t("help.blocks.protection.items.1"),
          t("help.blocks.protection.items.2"),
        ],
      },
      {
        title: t("help.blocks.support.title"),
        items: [
          t("help.blocks.support.items.0"),
          t("help.blocks.support.items.1"),
          t("help.blocks.support.items.2"),
        ],
      },
    ],
    [t]
  );

  return (
    <main className="min-h-screen bg-[var(--bg-body)] sort-label">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 space-y-8">
        <header className="space-y-3 !bg-[var(--bg-body)]">
          <p className={`${almarai.className} uppercase tracking-wide text-[var(--fg-muted)] text-sm sort-label`}>
            {t("help.hero.badge")}
          </p>
          <h1 className="text-4xl font-semibold sort-label">{t("help.hero.title")}</h1>
          <p className="max-w-3xl sort-label opacity-80">
            {t("help.hero.subtitle")}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {blocks.map((block) => (
            <section
              key={block.title}
              className="bg-[var(--bg-elev-1)]/80 border border-[var(--divider)] rounded-2xl p-5 space-y-2"
            >
              <h2 className="text-xl font-semibold sort-label">{block.title}</h2>
              <ul className="list-disc list-inside space-y-1 text-sm sort-label opacity-80">
                {block.items.map((item, idx) => (
                  <li key={idx} className="sort-label">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
