import Button from "../atoms/Button";
import { useLocale } from "../../i18n/LocaleProvider";

export default function RegisterButtonGroup() {
  const { t } = useLocale();
  return (
    <div className="flex gap-3 items-center">
      <Button label={t("auth.register")} variant="primary" type="submit" />
    </div>
  );
}
