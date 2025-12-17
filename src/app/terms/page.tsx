"use client";

import { useMemo } from "react";
import { Almarai } from "next/font/google";
import { useLocale } from "../i18n/LocaleProvider";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

type Section = { title: string; items: string[] };

export default function TermsPage() {
  const { t } = useLocale();

  const sections: Section[] = useMemo(
    () => [
      {
        title: t("terms.sections.agree.title"),
        items: [
          t("terms.sections.agree.items.0"),
          t("terms.sections.agree.items.1"),
          t("terms.sections.agree.items.2"),
        ],
      },
      {
        title: t("terms.sections.listings.title"),
        items: [
          t("terms.sections.listings.items.0"),
          t("terms.sections.listings.items.1"),
          t("terms.sections.listings.items.2"),
        ],
      },
      {
        title: t("terms.sections.moderation.title"),
        items: [
          t("terms.sections.moderation.items.0"),
          t("terms.sections.moderation.items.1"),
        ],
      },
      {
        title: t("terms.sections.disputes.title"),
        items: [
          t("terms.sections.disputes.items.0"),
          t("terms.sections.disputes.items.1"),
          t("terms.sections.disputes.items.2"),
        ],
      },
      {
        title: t("terms.sections.privacy.title"),
        items: [
          t("terms.sections.privacy.items.0"),
          t("terms.sections.privacy.items.1"),
        ],
      },
      {
        title: t("terms.sections.account.title"),
        items: [
          t("terms.sections.account.items.0"),
          t("terms.sections.account.items.1"),
        ],
      },
      {
        title: t("terms.sections.updates.title"),
        items: [
          t("terms.sections.updates.items.0"),
          t("terms.sections.updates.items.1"),
        ],
      },
      {
        title: t("terms.sections.contact.title"),
        items: [t("terms.sections.contact.items.0")],
      },
    ],
    [t]
  );

  return (
    <main className="min-h-screen bg-[var(--bg-body)] sort-label">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 space-y-8">
        <header className="space-y-3 !bg-[var(--bg-body)]">
          <p className={`${almarai.className} uppercase tracking-wide text-[var(--fg-muted)] text-sm sort-label`}>
            {t("terms.hero.badge")}
          </p>
          <h1 className="text-4xl font-semibold sort-label">{t("terms.hero.title")}</h1>
          <p className="max-w-3xl sort-label opacity-80">
            {t("terms.hero.subtitle")}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="bg-[var(--bg-elev-1)]/80 border border-[var(--divider)] rounded-2xl p-5 space-y-2"
            >
              <h2 className="text-xl font-semibold sort-label">{section.title}</h2>
              <ul className="list-disc list-inside space-y-1 text-sm sort-label opacity-80">
                {section.items.map((item, idx) => (
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
