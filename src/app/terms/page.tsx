"use client";

import { Almarai } from "next/font/google";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

const sections = [
  {
    title: "What you agree to",
    items: [
      "Use Loft only for lawful buying and selling; keep listings accurate, and no counterfeits or harmful content.",
      "Respect others: no harassment, hate speech, spam, or attempts to bypass moderation.",
      "Keep your credentials safe and notify us if you suspect unauthorized access.",
    ],
  },
  {
    title: "Listings, payments, and digital items",
    items: [
      "Physical and digital products must include clear descriptions, pricing, and applicable delivery terms.",
      "Payments are processed via integrated providers (e.g., Stripe); their terms and fees may apply.",
      "For digital products, delivery is typically instant. If a download fails, the seller must re‑provide the files or issue a refund per dispute rules.",
    ],
  },
  {
    title: "Moderation and removals",
    items: [
      "Loft may review, hide, or remove listings or accounts that violate policies or legal requirements.",
      "We may pause or limit functionality to investigate fraud, abuse, or security issues.",
    ],
  },
  {
    title: "Disputes and refunds",
    items: [
      "Order issues (not delivered, not as described, damaged) should be raised through the dispute flow with evidence.",
      "Platform decisions on refunds or reversals are made after reviewing seller and buyer submissions.",
      "Chargebacks initiated outside the platform may affect your account standing.",
    ],
  },
  {
    title: "Privacy and security",
    items: [
      "We collect and process data as described in the Privacy & Cookies pages; we use encryption and access controls to protect it.",
      "We log activity for fraud prevention and to improve the service; do not attempt to bypass security controls.",
    ],
  },
  {
    title: "Account changes and termination",
    items: [
      "You can update or delete your account data in Profile where permitted by law and platform policy.",
      "We may suspend or terminate accounts for policy violations or unpaid fees.",
    ],
  },
  {
    title: "Updates",
    items: [
      "We may update these Terms from time to time; continued use means you accept the latest version.",
      "Material changes will be highlighted in-app or via email when feasible.",
    ],
  },
  {
    title: "Contact",
    items: [
      "Need help or see a violation? Use Help → Contact support or report the listing/user directly.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-body)] sort-label">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 space-y-8">
        <header className="space-y-3 !bg-[var(--bg-body)]">
          <p className={`${almarai.className} uppercase tracking-wide text-[var(--fg-muted)] text-sm sort-label`}>
            Loft Marketplace
          </p>
          <h1 className="text-4xl font-semibold sort-label">Terms of Use</h1>
          <p className="max-w-3xl sort-label opacity-80">
            These terms explain how you can use Loft to buy and sell physical and digital products, how disputes work,
            and what we expect from everyone on the platform.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="bg-[var(--bg-elev-1)]/80 border border-[var(--divider)] rounded-2xl p-5 space-y-2"
            >
              <h2 className="text-xl font-semibold sort-label">{section.title}</h2>
              <ul className="list-disc list-inside space-y-1 text-sm sort-label opacity-80">
                {section.items.map((item, idx) => (
                  <li key={idx} className="sort-label">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
