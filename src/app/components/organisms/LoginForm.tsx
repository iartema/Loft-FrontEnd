"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "../molecules/InputField";
import Checkbox from "../atoms/Checkbox";
import ButtonAuth from "../atoms/ButtonAuth";
import FooterLinks from "../atoms/FooterLinks";
import LoginButtonGroup from "../molecules/LoginButtonGroup";
import { loginUser } from "../lib/api";
import { useLocale } from "../../i18n/LocaleProvider";

export default function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await loginUser(email, password); // cookies set server-side
      router.push("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <h2 className="text-5xl mb-8 text-center font-semibold">{t("auth.loginTitle")}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label={t("auth.emailLabel")}
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <InputField
          label={t("auth.passwordLabel")}
          type="password"
          placeholder={t("auth.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Checkbox showForgotPassword />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <ButtonAuth
          type="submit"
          label={loading ? t("auth.loggingIn") : t("auth.login")}
          disabled={loading}
        />
      </form>

      <LoginButtonGroup/>

      <FooterLinks />
    </div>
  );
}
