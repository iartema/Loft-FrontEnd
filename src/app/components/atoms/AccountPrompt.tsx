import { Almarai } from "next/font/google";
import { useLocale } from "../../i18n/LocaleProvider";
const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

interface AccountPromptProps {
  message?: string;
  linkText: string;
  linkHref: string;
}

export default function AccountPrompt({
  message,
  linkText,
  linkHref,
}: AccountPromptProps) {
  const { t } = useLocale();
  return (
    <p
      className={`${almarai.className} text-center mt-6 sort-label text-sm`}
    >
      {message || t("auth.haveAccount")}{" "}
      <a
        href={linkHref}
        className="text-white hover:underline font-medium"
      >
        {linkText}
      </a>
    </p>
  );
}
