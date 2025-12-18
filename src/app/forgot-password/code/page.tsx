"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Almarai } from "next/font/google";
import RecoverLayout from "../../components/organisms/RecoverLayout";
import ButtonAuth from "../../components/atoms/ButtonAuth";
import OtpInput from "../../components/molecules/OtpInput";
import { useLocale } from "../../i18n/LocaleProvider";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

function ForgotPasswordCodeContent() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, [email, router]);

  const isValidCode = /^\d{6}$/.test(code.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError(t("recover.codeError"));
      setSubmitting(false);
      return;
    }

    router.push(
      `/forgot-password/new-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(trimmed)}`
    );
    setSubmitting(false);
  };

  return (
    <RecoverLayout subtitle={t("recover.codeSubtitle")}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className={`${almarai.className} mb-3 text-lg`}>{t("recover.enterCode")}</p>
        <div className="flex flex-col items-center">
          <OtpInput
            length={6}
            onChange={(val) => {
              setCode(val);
              if (error) setError("");
            }}
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <ButtonAuth type="submit" label={t("auth.next")} disabled={!isValidCode || submitting} />
      </form>
    </RecoverLayout>
  );
}

export default function ForgotPasswordCodePage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordCodeContent />
    </Suspense>
  );
}
