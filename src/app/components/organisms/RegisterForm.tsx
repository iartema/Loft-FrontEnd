"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "../molecules/InputField";
import Checkbox from "../atoms/Checkbox";
import ButtonAuth from "../atoms/ButtonAuth";
import AccountPrompt from "../atoms/AccountPrompt";
import FooterLinks from "../atoms/FooterLinks";
import { registerUser } from "../lib/api";

export default function RegisterForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  // const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerUser(email, password); // cookies set server-side
      router.push("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <h2 className="text-5xl mb-8 text-center font-semibold">Register</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Enter your email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/*
        <InputField
          label="Enter your name"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        */}

        <InputField
          label="Enter your password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Checkbox />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <ButtonAuth
          type="submit"
          label="Register"
        >
          {loading ? "Registering..." : "Register"}
        </ButtonAuth>
      </form>

      <AccountPrompt message="Do you have an account?" linkText="Login" linkHref="/login" />
      <FooterLinks />
    </div>
  );
}
