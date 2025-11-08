/* eslint-disable @next/next/no-img-element */
"use client";

import RegisterForm from "../components/organisms/RegisterForm";
import OverlayPortal from "../components/OverlayPortal";


export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen bg-[var(--bg-body)] text-white overflow-hidden">
    <OverlayPortal>
        <div className="pointer-events-none fixed inset-0 z-50 flex justify-end items-start select-none">
                    <img
                    src="/gradient.svg"
                    alt="Decorative art"
                    className="relative right-[-5%] top-[0%] w-[60%] max-w-none"
                    />
                </div>
    </OverlayPortal>
      <section className="flex flex-col justify-start px-12 w-full md:w-1/2 mt-54 z-10">
        <RegisterForm />
      </section>
    </main>
  );
}
