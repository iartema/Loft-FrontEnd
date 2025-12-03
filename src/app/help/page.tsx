"use client";

import { useState, useMemo } from "react";

type StepCard = {
  id: string;
  title: string;
  steps: string[];
};

const stepCards: StepCard[] = [
  {
    id: "digital-file",
    title: "I didn't receive the digital file after purchase.",
    steps: [
      "Go to Orders → Downloads and check if the file is available there.",
      "Refresh the page — sometimes delivery takes 1–2 minutes.",
      "Disable ad blockers if they may block downloads or pop‑ups.",
      "Contact the seller via chat and request a re-upload of the file.",
      "If the seller does not respond within 24 hours, open a Not Delivered dispute.",
      "Provide screenshots of the empty download section.",
      "Support will either force-deliver the file or issue a refund.",
    ],
  },
  {
    id: "payment",
    title: "I can't complete payment. What can I do?",
    steps: [
      "Check your card balance and ensure international payments are allowed.",
      "Make sure the card supports online payments (some prepaid cards don't).",
      "Confirm your billing address matches what your bank has on file.",
      "Try another payment method through Stripe.",
      "Clear browser cache or use incognito mode.",
      "If error persists, screenshot the error and contact support.",
      "Support will check if this issue is your card or the payment gateway.",
    ],
  },
  {
    id: "seller-not-responding",
    title: "I paid for the item, but the seller isn't responding. What should I do?",
    steps: [
      "Wait 24–48 hours — sellers may need time to respond.",
      "Go to Orders → View Details and check the seller message history.",
      "Send a second message through the platform chat (avoid external contact).",
      "If no reply after 48 hours, click Report issue / Open Dispute.",
      "Provide proof of payment and contact screenshots.",
      "The support team will contact the seller and update you.",
      "If the seller remains inactive, the platform will issue a refund according to policy.",
    ],
  },
  {
    id: "damaged",
    title: "The item I received is damaged or not as described.",
    steps: [
      "Take clear photos and videos of the item immediately.",
      "Go to Orders → Open Dispute.",
      "Upload a description showing damage or mismatch.",
      "Describe the problem clearly (wrong model, broken part, missing accessory).",
      "Wait for seller's reply — they may offer a replacement or refund.",
      "If the seller resolves, escalate the dispute for platform confirmation.",
      "If no response, the support team will mediate and make a final decision.",
      "Refunds or partial refunds are issued according to buyer protection rules.",
    ],
  },
  {
    id: "how-to-buy",
    title: "How to buy — step by step",
    steps: [
      "Create an account or log in.",
      "Use the search bar or categories to find the item you want.",
      "Apply filters (price, location, condition, and view results).",
      "Open the product page — read the description, photos, price, shipping info, and seller rating.",
      "Ask the seller questions via chat if needed.",
      "Click Add to Cart / Buy Now for immediate purchase.",
      "Pick your quantity, check guarantees, shipping, and taxes.",
      "Proceed to checkout, enter shipping address and payment method (e.g., Stripe).",
      "Confirm the order and save the order confirmation number.",
      "Track the order in your account and mark the item received when delivered; leave feedback.",
    ],
  },
  {
    id: "how-to-sell",
    title: "How to sell — step by step",
    steps: [
      "Create a seller account or switch your profile to “Seller” and complete verification.",
      "Prepare clear photos and a detailed description: condition, version, specs, price.",
      "Select the right category and tags to improve search visibility.",
      "Set shipping options and return policy (or pick local pickup).",
      "Add secure payment and buyer-managed digital files if listing digital goods.",
      "Post the product and verify any required details.",
      "Respond promptly to messages and negotiate if needed.",
      "When you ship, pack the item securely and ship within the promised time frame (provide tracking).",
      "After delivery, check the item status; the buyer confirms receipt.",
      "Resolve disputes politely and follow platform rules for refunds/reviews.",
    ],
  },
];

const quickFaq = [
  "Read this short communication/safety section and the FAQ page.",
  "If your question is about account setup, follow the “Registration” or “Login” steps.",
  "For payments or orders, check the “Payments & Orders” section first.",
  "If you need help with a specific product, open the product page and click “Contact seller.”",
  "If the FAQ doesn’t solve your problem, use the “Contact support” form or live chat and include your order ID and screenshots.",
];

const safety = [
  "Secure messaging — communicate safely via platform chat; never share personal contact details unless you trust the buyer/seller.",
  "Data protection — your personal info is stored securely and never shared without your consent.",
  "Report scams — see something suspicious? Report the user or ad — our team will review it quickly.",
  "Avoid prepayments — never send money in advance. Use secure payment when possible.",
  "Your control — you can edit or delete your personal data anytime in your profile settings.",
];

export default function HelpPage() {
  const [query, setQuery] = useState("");

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stepCards;
    return stepCards.filter(
      (card) =>
        card.title.toLowerCase().includes(q) ||
        card.steps.some((step) => step.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <main className="min-h-screen bg-[var(--bg-body)] text-white">
      <div className="max-w-[1300px] mx-auto px-6 md:px-10 py-10 space-y-8">
        <header className="text-center space-y-4">
          <div className="text-3xl md:text-4xl font-semibold">Do you have a question?</div>
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search help topics..."
                className="w-full rounded-2xl bg-[var(--bg-input)] px-4 py-3 pr-12 text-sm outline-none border border-[var(--divider)] focus:border-[var(--brand)]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--brand)]">🔍</span>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              className="px-5 py-2 rounded-[12px] bg-[var(--success,#9ef1c7)] text-black font-semibold hover:opacity-90"
              onClick={() => setQuery("")}
            >
              Contact support
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="space-y-4">
            {filteredCards.map((card) => (

                <article
                  key={card.id}
                  id={card.id}
                  className="bg-[var(--bg-elev-1)]/80 border border-[var(--divider)] rounded-2xl px-5 py-4"
                >
                  <div className="text-lg font-semibold mb-3">{card.title}</div>
                  <ol className="list-decimal list-outside space-y-1 pl-5 text-sm text-white/80">
                    {card.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </article>
            ))}
          </div>

          <div className="space-y-4">
            <section id="faq" className="bg-[var(--bg-elev-1)]/80 border border-[var(--divider)] rounded-2xl px-5 py-4">
              <div className="text-lg font-semibold mb-3">FAQ — Quick steps</div>
              <ul className="list-decimal list-outside space-y-2 pl-5 text-sm text-white/80">
                {quickFaq.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            <section
              id="buyer-protection"
              className="bg-[var(--bg-elev-1)]/80 border border-[var(--divider)] rounded-2xl px-5 py-4"
            >
              <div className="text-lg font-semibold mb-3">Security and privacy</div>
              <ol className="list-decimal list-outside space-y-2 pl-5 text-sm text-white/80">
                {safety.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ol>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
