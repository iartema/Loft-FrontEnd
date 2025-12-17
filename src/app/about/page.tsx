"use client";

import { useMemo } from "react";
import { Almarai } from "next/font/google";
import { useLocale } from "../i18n/LocaleProvider";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

type Person = { name: string; role: string; description: string };
type RoleGroup = { title: string; people: Person[] };
type Pillar = { title: string; items: string[] };

export default function AboutPage() {
  const { t } = useLocale();

  const roles: RoleGroup[] = useMemo(
    () => [
      {
        title: t("about.roles.lead.title"),
        people: [
          {
            name: t("about.roles.lead.people.0.name"),
            role: t("about.roles.lead.people.0.role"),
            description: t("about.roles.lead.people.0.desc"),
          },
        ],
      },
      {
        title: t("about.roles.backend.title"),
        people: [
          {
            name: t("about.roles.backend.people.0.name"),
            role: t("about.roles.backend.people.0.role"),
            description: t("about.roles.backend.people.0.desc"),
          },
          {
            name: t("about.roles.backend.people.1.name"),
            role: t("about.roles.backend.people.1.role"),
            description: t("about.roles.backend.people.1.desc"),
          },
        ],
      },
      {
        title: t("about.roles.security.title"),
        people: [
          {
            name: t("about.roles.security.people.0.name"),
            role: t("about.roles.security.people.0.role"),
            description: t("about.roles.security.people.0.desc"),
          },
        ],
      },
      {
        title: t("about.roles.design.title"),
        people: [
          {
            name: t("about.roles.design.people.0.name"),
            role: t("about.roles.design.people.0.role"),
            description: t("about.roles.design.people.0.desc"),
          },
          {
            name: t("about.roles.design.people.1.name"),
            role: t("about.roles.design.people.1.role"),
            description: t("about.roles.design.people.1.desc"),
          },
        ],
      },
    ],
    [t]
  );

  const goals: Pillar = useMemo(
    () => ({
      title: t("about.pillars.goals.title"),
      items: [
        t("about.pillars.goals.items.0"),
        t("about.pillars.goals.items.1"),
        t("about.pillars.goals.items.2"),
        t("about.pillars.goals.items.3"),
      ],
    }),
    [t]
  );

  const tech: Pillar = useMemo(
    () => ({
      title: t("about.pillars.tech.title"),
      items: [t("about.pillars.tech.items.0"), t("about.pillars.tech.items.1")],
    }),
    [t]
  );

  const craft: Pillar = useMemo(
    () => ({
      title: t("about.pillars.craft.title"),
      items: [
        t("about.pillars.craft.items.0"),
        t("about.pillars.craft.items.1"),
        t("about.pillars.craft.items.2"),
      ],
    }),
    [t]
  );

  const acceptance: Pillar = useMemo(
    () => ({
      title: t("about.pillars.acceptance.title"),
      items: [
        t("about.pillars.acceptance.items.0"),
        t("about.pillars.acceptance.items.1"),
        t("about.pillars.acceptance.items.2"),
      ],
    }),
    [t]
  );

  const operatingModel = useMemo(
    () => ({
      title: t("about.operating.title"),
      description: t("about.operating.description"),
      bullets: [
        t("about.operating.bullets.0"),
        t("about.operating.bullets.1"),
        t("about.operating.bullets.2"),
      ],
    }),
    [t]
  );

  const stats = useMemo(
    () => [
      { label: t("about.stats.focus.label"), value: t("about.stats.focus.value") },
      { label: t("about.stats.stack.label"), value: t("about.stats.stack.value") },
      { label: t("about.stats.disciplines.label"), value: t("about.stats.disciplines.value") },
    ],
    [t]
  );

  const heroPillars = [goals, tech, craft, acceptance];

  return (
    <main className="relative min-h-screen sort-label text-[var(--fg-primary)]">
      <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-14 space-y-10">
        {/* hero */}
        <header className="space-y-6 !bg-[var(--bg-body)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
            <span className={`${almarai.className} uppercase tracking-[0.2em] text-[10px] text-[var(--fg-muted)]`}>
              {t("about.hero.badge")}
            </span>
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            <span className="text-[11px] sort-label">{t("about.hero.status")}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight sort-label">
                {t("about.hero.title")}
              </h1>
              <p className="sort-label">
                {t("about.hero.subtitle")}
              </p>
            </div>

            {/* quick stats */}
            <div className="grid grid-cols-3 gap-3 text-xs md:text-sm sort-label">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
                >
                  <div className="text-[10px] uppercase tracking-wide text-white/50 sort-label">
                    {stat.label}
                  </div>
                  <div className="mt-1 font-medium text-xs md:text-sm">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* product & delivery pillars */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sort-label">
          {heroPillars.map((pillar) => (
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
            <span className="sort-label">{t("about.teamLabel")}</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 md:gap-10">
            <div className="absolute left-[10px] top-3 bottom-3 hidden md:block border-l border-white/10" />

            <div className="space-y-4">
              {roles.map((pillar, pillarIdx) => (
                <div key={pillar.title} className="relative pl-6 md:pl-8">
                  <div className="absolute left-1 md:-left-[7px] top-1.5 flex h-4 w-4 items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.75)]" />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm hover:border-cyan-400/50 transition-colors">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-white/75 sort-label">
                      {pillar.title}
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-sm text-white/80 sort-label">
                      {pillar.people.map((person, idx) => (
                        <li key={idx} className="leading-relaxed">
                          <span className="font-semibold sort-label">{person.name}</span>
                          <span className="text-white/60 sort-label"> — {person.role}</span>
                          <span className="block text-xs text-white/60 mt-0.5 sort-label">
                            {person.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-1 text-[11px] uppercase tracking-wide text-white/30 sort-label">
                    {String(pillarIdx + 1).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>

            <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/75 sort-label">
                {operatingModel.title}
              </h3>
              <p className="text-sm text-white/70 sort-label">
                {operatingModel.description}
              </p>
              <ul className="space-y-1.5 text-xs text-white/65 sort-label">
                {operatingModel.bullets.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
