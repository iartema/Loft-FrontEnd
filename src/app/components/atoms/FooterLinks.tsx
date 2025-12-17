import { Almarai } from "next/font/google";
import TextLink from "./TextLink";
import { useLocale } from "../../i18n/LocaleProvider";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

export default function FooterLinks() {
  const { t } = useLocale();
  return (
    <div
      className={`${almarai.className} flex justify-center gap-6 mt-6 text-sm`}
    >
      <TextLink href="/help">{t("sidebar.help")}</TextLink>
      <TextLink href="/cookies">{t("sidebar.privacy")}</TextLink>
    </div>
  );
}
