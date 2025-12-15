"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "../../components/molecules/InputField";
import ButtonAuth from "../../components/atoms/ButtonAuth";
import OverlayPortal from "../../components/OverlayPortal";

export default function ModerationLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/bff/auth/login", {
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
    <main className="relative flex min-h-screen bg-[var(--bg-body)] text-white overflow-hidden">
      <script src="https://accounts.google.com/gsi/client" async defer></script>

      <OverlayPortal>
        <div className="pointer-events-none fixed inset-0 z-50 flex justify-end items-start select-none">
          <img
            src="/gradient.svg"
            alt="Decorative art"
            className="relative right-[-5%] top-[0%] w-[60%] max-w-none"
          />
        </div>
      </OverlayPortal>

      <section className="flex flex-col justify-start px-12 w-full md:w-1/2 mt-35 z-10">
        <div className="max-w-md ml-0 md:ml-12 w-full">
          <h2 className="text-5xl mb-8 text-center font-semibold">Let&apos;s work, buddy!</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Enter your email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <InputField
              label="Enter your password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <ButtonAuth
              type="submit"
              label={loading ? "Logging in..." : "Login"}
              disabled={loading}
            />
          </form>
        </div>
      </section>
    </main>
  );
}
