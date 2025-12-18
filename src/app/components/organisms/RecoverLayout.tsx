"use client";

import OverlayPortal from "../OverlayPortal";
import FooterLinks from "../atoms/FooterLinks";
import { useLocale } from "../../i18n/LocaleProvider";

type RecoverLayoutProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function RecoverLayout({
  title,
  subtitle,
  children,
}: RecoverLayoutProps) {
  const { t } = useLocale();
  return (
    <main className="relative flex min-h-screen bg-[var(--bg-body)] text-white overflow-hidden mt-25">
      <OverlayPortal>
        <div className="pointer-events-none fixed inset-0 z-50 flex justify-end items-start select-none">
          <img
            src="/gradient.svg"
            alt="Decorative art"
            className="relative right-[-40%] top-[25%] w-[100%] max-w-none md:w-[60%] md:top-[0%] md:right-[-5%]"
          />
        </div>
      </OverlayPortal>

      <section className="flex flex-col justify-start px-5 w-full md:w-1/2 mt-25 z-10">
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-5xl mb-3 text-center font-semibold">{title || t("recover.title")}</h2>
          {subtitle && (
            <p className="text-[var(--fg-muted)] text-sm mb-4 mt-15 leading-relaxed">
              {subtitle}
            </p>
          )}

          {children}

          <FooterLinks />
        </div>
      </section>
    </main>
  );
}
