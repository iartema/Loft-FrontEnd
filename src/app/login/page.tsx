/* eslint-disable @next/next/no-img-element */
"use client";

import LoginForm from "../components/organisms/LoginForm";
import OverlayPortal from "../components/OverlayPortal";

export default function LoginPage() {
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
        <LoginForm />
      </section>
    </main>
  );
}
