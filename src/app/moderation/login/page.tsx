"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "../../components/molecules/InputField";
import Button from "../../components/atoms/Button";

export default function ModerationLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Login failed");
      }
      const data = await res.json();
      const role = data?.user?.role ?? data?.user?.Role;
      if (role !== 2) {
        throw new Error("Access denied: moderator role required.");
      }
      router.push("/moderation/pending");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-80px)] flex items-center justify-center bg-[var(--bg-body)] text-white px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[var(--bg-elev-1)] rounded-3xl border border-[var(--border)] p-8 space-y-6"
      >
        <h1 className="text-3xl font-semibold text-center">Moderation Login</h1>
        <InputField
          label="Email"
          type="email"
          placeholder="moderator@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          shape="office"
        />
        <InputField
          label="Password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          shape="office"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button
          type="submit"
          variant="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
