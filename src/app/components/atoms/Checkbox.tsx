import Link from "next/link";
import { Almarai } from "next/font/google";
import { useLocale } from "../../i18n/LocaleProvider";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

interface CheckboxProps {
  showForgotPassword?: boolean;
}

export default function Checkbox({ showForgotPassword = false }: CheckboxProps) {
  const { t } = useLocale();
  return (
    <div className="flex items-center mb-6 w-full">

      {showForgotPassword && (
        <Link
          href="/forgot-password"
          className={`${almarai.className} text-sm text-[var(--fg-muted)] hover:text-white transition`}
        >
          {t("auth.forgotPassword")}
        </Link>
      )}
    </div>
  );
}
