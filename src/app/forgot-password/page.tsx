"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RecoverLayout from "../components/organisms/RecoverLayout";
import InputField from "../components/molecules/InputField";
import ButtonAuth from "../components/atoms/ButtonAuth";
import { requestPasswordReset } from "../components/lib/api";

export default function ForgotPasswordEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(trimmedEmail);
      router.push(`/forgot-password/code?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecoverLayout subtitle="Enter your email address and we’ll send you a link to reset your password.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Enter your email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <ButtonAuth type="submit" label={loading ? "Sending..." : "Next"} disabled={loading} />
      </form>
    </RecoverLayout>
  );
}
