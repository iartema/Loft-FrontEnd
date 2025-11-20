/* eslint-disable @next/next/no-img-element */
"use client";

import { Ysabeau_Office } from "next/font/google";

type GoogleCredentialResponse = {
  credential: string;
};

declare const google: {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      prompt: () => void;
    };
  };
};

const ysabeau_office = Ysabeau_Office({
  subsets: ["latin"],
  weight: ["700", "800"],
});

type ButtonVariant = "primary" | "google" | "google small";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  is_gradient?: boolean;
  variant?: ButtonVariant;
}

export default function ButtonAuth({
  label,
  is_gradient = true,
  variant = "primary",
  ...props
}: ButtonProps) {

  const handleGoogleLogin = () => {
    const clientId = "1031648550234-v296d5d0efagr4mlmpigha8kb1ufmouo.apps.googleusercontent.com";

    if (!clientId) {
      console.error("Google Client ID is not configured.");
      return;
    }

    if (typeof window === "undefined" || typeof google === "undefined") {
      console.error("Google Identity Services script has not loaded yet.");
      return;
    }

    try {
      /* global google */
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          const idToken = response.credential;

          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });

            const data = await res.json();

            if (data.token) {
              window.location.href = "/";
            } else {
              console.error("Google login failed:", data);
            }
          } catch (error) {
            console.error("Google login failed:", error);
          }
        },
      });

      google.accounts.id.prompt();
    } catch (err) {
      console.error("Google login initialization failed:", err);
    }
  };

  if (variant === "google") {
    return (
      <button
        type="button"
        onClick={handleGoogleLogin}
        {...props}
        className={`${ysabeau_office.className} 
          w-full flex items-center justify-center gap-3
          bg-[var(--bg-hover)] rounded-full px-6 py-3
          border border-[var(--icon-dim-2)] text-white text-lg font-semibold
          hover:opacity-90 transition`}
      >
        <img
          src="/google-logo.svg"
          alt="Google"
          className="w-6 h-6"
        />
        {label ?? "Sign in with Google"}
      </button>
    );
  }

  if (variant === "google small") {
    return (
      <button
        type="button"
        onClick={handleGoogleLogin}
        {...props}
        className="bg-[var(--bg-hover)] rounded-full px-8 py-2 flex items-center justify-center border border-[var(--muted-1)] hover:opacity-90 transition"
      >
        <img
          src="/google-logo.svg"
          alt="Google"
          className="w-8 h-8"
        />
      </button>
    );
  }

  if (is_gradient) {
    return (
      <button
        {...props}
        className={`${ysabeau_office.className}
          w-full
          bg-[linear-gradient(120deg,_#a0f0c0_0%,_#f8e98a_25%,_#f7b8d4_50%,_#bda0ff_75%,_#a0f0c0_100%)]
          text-black font-bold text-2xl px-10 py-2 rounded-full
          transition hover:opacity-90`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      {...props}
      className={`${ysabeau_office.className}
        w-full
        bg-transparent text-white font-bold text-2xl px-10 py-2 rounded-full
        border border-[var(--muted-2)]
        hover:bg-[var(--bg-elev-1)] transition`}
    >
      {label}
    </button>
  );
}
