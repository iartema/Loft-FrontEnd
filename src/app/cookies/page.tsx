"use client";

import { useMemo } from "react";
import { Almarai } from "next/font/google";
import { useLocale } from "../i18n/LocaleProvider";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

type Block = { title: string; text?: string; list?: string[] };

export default function CookiesPage() {
  const { t } = useLocale();

  const blocks: Block[] = useMemo(
    () => [
      {
        title: t("cookies.blocks.what.title"),
        text: t("cookies.blocks.what.text"),
      },
      {
        title: t("cookies.blocks.types.title"),
        list: [
          t("cookies.blocks.types.list.0"),
          t("cookies.blocks.types.list.1"),
          t("cookies.blocks.types.list.2"),
          t("cookies.blocks.types.list.3"),
        ],
      },
      {
        title: t("cookies.blocks.use.title"),
        list: [
          t("cookies.blocks.use.list.0"),
          t("cookies.blocks.use.list.1"),
          t("cookies.blocks.use.list.2"),
          t("cookies.blocks.use.list.3"),
        ],
      },
      {
        title: t("cookies.blocks.control.title"),
        list: [
          t("cookies.blocks.control.list.0"),
          t("cookies.blocks.control.list.1"),
        ],
      },
      {
        title: t("cookies.blocks.retention.title"),
        text: t("cookies.blocks.retention.text"),
      },
      {
        title: t("cookies.blocks.third.title"),
        text: t("cookies.blocks.third.text"),
      },
    ],
    [t]
  );

  return (
    <main className="min-h-screen bg-[var(--bg-body)] sort-label">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 space-y-8">
        <header className="space-y-3 !bg-[var(--bg-body)]">
          <p className={`${almarai.className} uppercase tracking-wide text-[var(--fg-muted)] text-sm sort-label`}>
            {t("cookies.hero.badge")}
          </p>
          <h1 className="text-4xl font-semibold sort-label">{t("cookies.hero.title")}</h1>
          <p className="max-w-3xl sort-label opacity-80">
            {t("cookies.hero.subtitle")}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {blocks.map((block) => (
            <section
              key={block.title}
              className="bg-[var(--bg-elev-1)]/80 border border-[var(--divider)] rounded-2xl p-5 space-y-2"
            >
              <h2 className="text-xl font-semibold sort-label">{block.title}</h2>
              {block.text && <p className="text-sm sort-label opacity-80">{block.text}</p>}
              {block.list && (
                <ul className="list-disc list-inside space-y-1 text-sm sort-label opacity-80">
                  {block.list.map((item, idx) => (
                    <li key={idx} className="sort-label">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
