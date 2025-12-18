"use client";
import { useState } from "react";
import Divider from "../atoms/Divider";
import Button from "../atoms/Button";
import { useLocale } from "../../i18n/LocaleProvider";

export default function ProductInfo({
  longDescription,
  specs,
  forceExpanded = false,
  hideToggle = false,
}: {
  description: string;
  longDescription: string;
  specs: { label: string; value: string }[];
  forceExpanded?: boolean;
  hideToggle?: boolean;
}) {
  const { t } = useLocale();
  const [showAll, setShowAll] = useState(false);
  const expanded = forceExpanded || showAll;

  return (
    <div className="bg-[var(--bg-frame)] rounded-2xl border border-[var(--bg-frame)] md:w-[70%] mx-auto border-[1px] border-[var(--divider)]"
    style={{boxShadow: "0 3px 3px 0px rgba(0, 0, 0, 0.25)"}}>
      <div className="px-6 py-4 text-center font-semibold">{t("product.info.title")}</div>

      <div className="md:px-6 py-6 space-y-6">
        <section>
          <div className="text-md opacity-80 ps-6 mb-2">{t("product.info.description")}</div>
          <p className="text-sm opacity-90 ps-6">{longDescription}</p>
        </section>

        <Divider text="" />

        <section>
          <div className="text-md opacity-80 mb-4 ps-6">{t("product.info.specs")}</div>

          {/* show only when "More" is pressed */}
          {expanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-20 gap-y-4 ps-6 mr-6">
              {specs.map((s, i) => (
                <div key={i} className="flex justify-between items-center gap-3">
                  <div className="opacity-70 text-sm">{s.label}:</div>
                  <div className="text-sm">{s.value || t("product.info.notProvided")}</div>
                </div>
              ))}
            </div>
          )}

          {!hideToggle && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="card"
                className="toggle-more-btn bg-white text-black hover:bg-gray-300 !w-[15%]"
                onClick={() => setShowAll(!showAll)}
              >
                {expanded ? t("product.info.less") : t("product.info.more")}
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
