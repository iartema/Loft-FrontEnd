"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "../molecules/InputField";
import Checkbox from "../atoms/Checkbox";
import ButtonAuth from "../atoms/ButtonAuth";
import FooterLinks from "../atoms/FooterLinks";
import LoginButtonGroup from "../molecules/LoginButtonGroup";
import { loginUser } from "../lib/api";

export default function LoginForm() {
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
      <h2 className="text-5xl mb-8 text-center font-semibold">Welcome back!</h2>

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

        <Checkbox showForgotPassword />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <ButtonAuth
          type="submit"
          label={loading ? "Logging in..." : "Login"}
          disabled={loading}
        />
      </form>

      <LoginButtonGroup/>

      <FooterLinks />
    </div>
  );
}
