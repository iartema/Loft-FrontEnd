import Button from "../atoms/ButtonAuth";
import { useRouter } from "next/navigation";
import Divider from "../atoms/Divider";
import { useLocale } from "../../i18n/LocaleProvider";

export default function LoginButtonGroup() {
  const router = useRouter();
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-3 w-full mt-3">
      <Button label={t("auth.register")} is_gradient={false} onClick={() => router.push("/register")} />
      <Divider text={t("auth.or")} />
      <Button variant="google" label={t("auth.signInGoogle")} />
    </div>
  );
}
