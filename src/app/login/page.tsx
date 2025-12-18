/* eslint-disable @next/next/no-img-element */
"use client";

import LoginForm from "../components/organisms/LoginForm";
import OverlayPortal from "../components/OverlayPortal";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen bg-[var(--bg-body)] text-white overflow-hidden">

      <OverlayPortal>
        <div className="pointer-events-none fixed inset-0 z-50 flex justify-end items-start select-none">
          <img
            src="/gradient.svg"
            alt="Decorative art"
            className="relative right-[-40%] top-[25%] w-[100%] max-w-none md:w-[60%] md:top-[0%] md:right-[-5%]"
          />
        </div>
      </OverlayPortal>

      <section className="flex flex-col justify-start px-5 w-full md:w-1/2 mt-35 z-10">
        <LoginForm />
      </section>
    </main>
  );
}
