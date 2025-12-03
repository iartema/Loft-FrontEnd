"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RecoverLayout from "../../components/organisms/RecoverLayout";
import InputField from "../../components/molecules/InputField";
import ButtonAuth from "../../components/atoms/ButtonAuth";
import { confirmPasswordReset } from "../../components/lib/api";

export default function ForgotPasswordNewPasswordPage() {
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
      setError("New password is required");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(email, code, password);
      setSuccess("Password updated. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecoverLayout subtitle="Enter a new password to secure your account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Enter new password"
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <InputField
          label="Confirm new password"
          type="password"
          placeholder="Repeat password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}

        <ButtonAuth type="submit" label={loading ? "Saving..." : "Reset password"} disabled={loading} />
      </form>
    </RecoverLayout>
  );
}
