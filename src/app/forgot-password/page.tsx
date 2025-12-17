"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RecoverLayout from "../components/organisms/RecoverLayout";
import InputField from "../components/molecules/InputField";
import ButtonAuth from "../components/atoms/ButtonAuth";
import { requestPasswordReset } from "../components/lib/api";
import { useLocale } from "../i18n/LocaleProvider";

export default function ForgotPasswordEmailPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("auth.emailRequired"));
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(trimmedEmail);
      router.push(`/forgot-password/code?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err: any) {
      setError(err?.message || t("auth.resetPassword"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecoverLayout subtitle={t("recover.subtitleEmail")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label={t("auth.emailLabel")}
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <ButtonAuth type="submit" label={loading ? t("auth.sending") : t("auth.next")} disabled={loading} />
      </form>
    </RecoverLayout>
  );
}
