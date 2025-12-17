"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RecoverLayout from "../../components/organisms/RecoverLayout";
import InputField from "../../components/molecules/InputField";
import ButtonAuth from "../../components/atoms/ButtonAuth";
import { confirmPasswordReset } from "../../components/lib/api";
import { useLocale } from "../../i18n/LocaleProvider";

function ForgotPasswordNewPasswordContent() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const code = searchParams.get("code") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!email || !code) {
      router.replace("/forgot-password");
    }
  }, [email, code, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!password) {
      setError(t("auth.passwordRequired"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(email, code, password);
      setSuccess(t("auth.passwordResetSuccess"));
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: any) {
      setError(err?.message || t("auth.resetPassword"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecoverLayout subtitle={t("recover.subtitleNewPassword")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label={t("auth.newPasswordLabel")}
          type="password"
          placeholder={t("auth.newPasswordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <InputField
          label={t("auth.confirmPasswordLabel")}
          type="password"
          placeholder={t("auth.repeatPasswordPlaceholder")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}

        <ButtonAuth type="submit" label={loading ? t("profile.saving") : t("auth.resetPassword")} disabled={loading} />
      </form>
    </RecoverLayout>
  );
}

export default function ForgotPasswordNewPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordNewPasswordContent />
    </Suspense>
  );
}
