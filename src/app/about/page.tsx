"use client";

import { Almarai } from "next/font/google";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

type Pillar = { title: string; items: string[] };

const roles: Pillar[] = [
  {
    title: "Leadership & Frontend",
    items: [
      "Artem Knysh — frontend lead: Next.js UI, API integration, performance, responsive UX, team cadence.",
    ],
  },
  {
    title: "Backend & Architecture",
    items: [
      "Platon Reshetnikov — backend: ASP.NET Web API architecture, business logic, Stripe + OAuth2 integrations, hosting & CI/CD.",
      "Klym Zaika — backend: REST API optimization, DB design, moderation/search algorithms, microservice performance.",
    ],
  },
  {
    title: "Security & DevOps",
    items: [
      "Mykola Nazarenko — security/DevOps: CI/CD pipelines, Docker/K8s, monitoring, secure configs, protection vs SQLi/XSS.",
    ],
  },
  {
    title: "Design",
    items: [
      "Ulyana Koflanovych — art director: brand concept, visual system, UX research, design system.",
      "Daria Holik — product designer: wireframes → mocks → production assets, motion and presentation materials.",
    ],
  },
];

const goals: Pillar = {
  title: "Mission & Product",
  items: [
    "Build a secure marketplace for physical and digital goods.",
    "Two profiles: users (buyers/sellers) and moderators.",
    "Fast search with filters, cart + checkout, reviews, and digital downloads.",
    "Light/dark themes and responsive layouts for ages 18–60.",
  ],
};

const tech: Pillar = {
  title: "Stack & Tools",
  items: [
    "Backend: ASP.NET Web API; Frontend: React + Next.js; Hosting: Azure (or SmarterASP/GoDaddy/TheHost alternatives).",
    "Payments: Stripe; Planning: Trello; Design: Figma + AE + PS + Illustrator; Version control: GitHub.",
  ],
};

const craft: Pillar = {
  title: "How we build",
  items: [
    "CI/CD-first: automated checks, containerized deploys, blue/green when possible.",
    "Quality gates: code review, unit/API tests, security scans, and perf smoke runs.",
    "Design ops: shared tokens, component libraries, and motion specs to keep UI sharp.",
  ],
};

const acceptance: Pillar = {
  title: "What success looks like",
  items: [
    "Auth works (including OAuth2), products can be added and found via search.",
    "Cart and payments run end-to-end; light/dark themes and responsive views ship.",
    "Disputes, moderation, and downloads for digital goods function as expected.",
  ],
};

export default function AboutPage() {
  return (
    <main className="relative min-h-screen sort-label text-[var(--fg-primary)]">
      {/* ambient glows */}
      <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-14 space-y-10">
        {/* hero */}
        <header className="space-y-6 !bg-[var(--bg-body)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
            <span className={`${almarai.className} uppercase tracking-[0.2em] text-[10px] text-[var(--fg-muted)]`}>
              Loft Marketplace
            </span>
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            <span className="text-[11px] sort-label">In active development</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight sort-label">
                About the Loft team
              </h1>
              <p className="sort-label">
                A lean crew of engineers, DevOps, and designers building a secure, fast marketplace
                for physical and digital goods, combining solid engineering, design craft, and
                safety-first operations.
              </p>
            </div>

            {/* quick stats */}
            <div className="grid grid-cols-3 gap-3 text-xs md:text-sm sort-label">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-wide text-white/50 sort-label">
                  Focus
                </div>
                <div className="mt-1 font-medium">Secure marketplace</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-wide text-white/50 sort-label">
                  Stack
                </div>
                <div className="mt-1 font-medium text-xs">
                  ASP.NET · Next.js · Azure
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-wide text-white/50 sort-label">
                  Disciplines
                </div>
                <div className="mt-1 font-medium text-xs">
                  FE · BE · DevOps · Design
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* product & delivery pillars */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sort-label">
          {[goals, tech, craft, acceptance].map((pillar) => (
            <article
              key={pillar.title}
              className="relative group overflow-hidden rounded-2xl border border-[var(--divider)]/60 bg-[var(--bg-elev-1)]/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-transform transition-shadow hover:-translate-y-1 hover:border-fuchsia-500/70 hover:shadow-[0_22px_80px_rgba(0,0,0,0.7)]"
            >
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/60 to-cyan-400/0 opacity-70" />
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-500/5 blur-2xl transition-opacity group-hover:opacity-100" />

              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(244,63,94,0.6)] sort-label" />
                {pillar.title}
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm text-white/80 sort-label">
                {pillar.items.map((item, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1 h-1 w-3 rounded-full bg-white/25" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        {/* team roles as timeline */}
        <section className="mt-4 space-y-4 sort-label">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="sort-label">Team & ownership</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 md:gap-10">
            {/* timeline line */}
            <div className="absolute left-[10px] top-3 bottom-3 hidden md:block border-l border-white/10" />

            <div className="space-y-4">
              {roles.map((pillar, pillarIdx) => (
                <div key={pillar.title} className="relative pl-6 md:pl-8">
                  {/* bullet on timeline (desktop) */}
                  <div className="absolute left-1 md:-left-[7px] top-1.5 flex h-4 w-4 items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.75)]" />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm hover:border-cyan-400/50 transition-colors">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-white/75 sort-label">
                      {pillar.title}
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-sm text-white/80 sort-label">
                      {pillar.items.map((item, idx) => {
                        const [namePart, rest] = item.split(" — ");
                        const [rolePart, description] = (rest ?? "").split(":");

                        return (
                          <li key={idx} className="leading-relaxed">
                            <span className="font-semibold sort-label">{namePart}</span>
                            {rolePart && (
                              <span className="text-white/60 sort-label">
                                {" "}
                                · {rolePart.trim()}
                              </span>
                            )}
                            {description && (
                              <span className="block text-xs text-white/60 mt-0.5 sort-label">
                                {description.trim()}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* subtle step label */}
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-white/30 sort-label">
                    {String(pillarIdx + 1).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>

            {/* side summary */}
            <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/75 sort-label">
                Operating model
              </h3>
              <p className="text-sm text-white/70 sort-label">
                Each track has clear ownership: frontend, backend, security, and design. The team
                works as a single product squad, shipping vertical slices of the marketplace instead
                of isolated features.
              </p>
              <ul className="space-y-1.5 text-xs text-white/65 sort-label">
                <li>• Shared rituals: planning, design reviews, and release retros.</li>
                <li>• Engineers collaborate directly with designers on interaction details.</li>
                <li>• DevOps and security are integrated in every stage, not a final gate.</li>
              </ul>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
