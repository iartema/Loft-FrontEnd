"use client";

import { Almarai } from "next/font/google";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

const cookieBlocks = [
  {
    title: "What are cookies?",
    text: "Small text files stored on your device to keep you signed in, remember preferences, and help us secure and improve Loft.",
  },
  {
    title: "Types we use",
    list: [
      "Essential: keep sessions, cart, and security features working.",
      "Performance: measure site speed and errors to improve reliability.",
      "Analytics: understand feature usage; we aggregate where possible.",
      "Marketing: only if you opt in; used to show relevant Loft campaigns.",
    ],
  },
  {
    title: "How we use them",
    list: [
      "Authenticate you safely while you navigate.",
      "Remember language, theme, and recent filters.",
      "Detect fraud and unusual activity.",
      "Analyze what features are popular to guide improvements.",
    ],
  },
  {
    title: "Your control",
    list: [
      "Browser settings let you block or delete cookies; essential cookies are required for login and checkout.",
      "Where required, we request consent for non-essential cookies; you can update choices in your browser or via the cookie banner (when shown).",
    ],
  },
  {
    title: "Retention",
    text: "Session cookies expire when you close the browser. Others may persist (e.g., remember-me) but are cycled regularly or when you clear them.",
  },
  {
    title: "Third parties",
    text: "Some cookies come from trusted providers (e.g., payments, analytics). They follow their own policies and may change; we review them for security and privacy alignment.",
  },
];

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-body)] text-white">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 space-y-8">
        <header className="space-y-3">
          <p className={`${almarai.className} uppercase tracking-wide text-[var(--fg-muted)] text-sm`}>
            Loft Marketplace
          </p>
          <h1 className="text-4xl font-semibold">Cookies & Tracking</h1>
          <p className="text-white/70 max-w-3xl">
            How we use cookies and similar tech to keep your account secure, improve performance, and personalize your experience.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {cookieBlocks.map((block) => (
            <section
              key={block.title}
              className="bg-[var(--bg-elev-1)]/80 border border-[var(--divider)] rounded-2xl p-5 space-y-2"
            >
              <h2 className="text-xl font-semibold">{block.title}</h2>
              {block.text && <p className="text-sm text-white/80">{block.text}</p>}
              {block.list && (
                <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
                  {block.list.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
