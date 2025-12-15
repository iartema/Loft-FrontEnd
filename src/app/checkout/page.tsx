"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "../components/molecules/InputField";
import Button from "../components/atoms/Button";
import {
  fetchCartByCustomer,
  fetchMyDefaultShippingAddress,
  type CartItemDto,
  fetchPaymentMethods,
  createOrderFromCart,
  createPayment,
  confirmPayment,
} from "../components/lib/api";
import { getCurrentUserCached } from "../components/lib/userCache";
import { getFirstPublicImageUrl, resolveMediaUrl } from "../lib/media";
import { Almarai, Ysabeau_Office } from "next/font/google";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });
const ysabeau = Ysabeau_Office({ subsets: ["latin"], weight: ["600", "700"] });

type OrderFormState = {
  customerName: string;
  customerEmail: string;
  phone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingRecipientName: string;
};

const EMPTY_FORM: OrderFormState = {
  customerName: "",
  customerEmail: "",
  phone: "",
  shippingAddress: "",
  shippingCity: "",
  shippingPostalCode: "",
  shippingCountry: "",
  shippingRecipientName: "",
};

const DEFAULT_PAYMENT_METHODS = [
  { value: 0, name: "CREDIT_CARD" },
  { value: 1, name: "CASH_ON_DELIVERY" },
  { value: 2, name: "STRIPE" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [form, setForm] = useState<OrderFormState>(EMPTY_FORM);
  const [cartItems, setCartItems] = useState<CartItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<{ value: number; name: string }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState({ number: "", exp: "", cvc: "", zip: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await getCurrentUserCached();
        if (!me?.id) {
          router.push("/login");
          return;
        }
        setUserId(me.id);
        setForm((prev) => ({
          ...prev,
          customerName: [me.firstName, me.lastName].filter(Boolean).join(" ").trim(),
          customerEmail: me.email ?? prev.customerEmail,
          phone: me.phone ?? prev.phone,
          shippingRecipientName: [me.firstName, me.lastName].filter(Boolean).join(" ").trim(),
        }));

        try {
          const shipping = await fetchMyDefaultShippingAddress();
          if (shipping && !cancelled) {
            setForm((prev) => ({
              ...prev,
              shippingAddress: shipping.address ?? prev.shippingAddress,
              shippingCity: shipping.city ?? prev.shippingCity,
              shippingPostalCode: shipping.postalCode ?? prev.shippingPostalCode,
              shippingCountry: shipping.country ?? prev.shippingCountry,
              shippingRecipientName: shipping.recipientName ?? prev.shippingRecipientName,
            }));
          }
        } catch {
          // ignore shipping load failure
        }

        try {
          const cart = await fetchCartByCustomer(me.id);
          if (!cancelled && cart?.cartItems) {
            setCartItems(cart.cartItems);
          }
        } catch {
          if (!cancelled) setCartItems([]);
        }

        try {
          const methods = await fetchPaymentMethods();
          const normalized =
            Array.isArray(methods) && methods.length ? methods : DEFAULT_PAYMENT_METHODS;
          if (!cancelled) {
            setPaymentMethods(normalized);
            setPaymentMethod(normalized.length ? normalized[0].value : null);
            if (!methods?.length) {
              setError((prev) => prev ?? "Using default payment methods.");
            }
          }
        } catch {
          if (!cancelled) {
            setPaymentMethods(DEFAULT_PAYMENT_METHODS);
            setPaymentMethod(DEFAULT_PAYMENT_METHODS[0].value);
            setError((prev) => prev ?? "Failed to load payment methods. Showing defaults.");
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load checkout data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (Number(item.price ?? 0) * item.quantity), 0);
  }, [cartItems]);

  const selectedPaymentName = useMemo(
    () => paymentMethods.find((m) => m.value === paymentMethod)?.name ?? null,
    [paymentMethod, paymentMethods]
  );
  const isStripeSelected = selectedPaymentName?.toUpperCase() === "STRIPE";
  const isCardSelected =
    !isStripeSelected && (selectedPaymentName?.toUpperCase().includes("CARD") ?? false);

  const handleChange = (field: keyof OrderFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const completeCheckout = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    if (paymentMethod === null || paymentMethod === undefined) {
      setError("Select a payment method.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { order } = await createOrderFromCart(userId);
      const payment = await createPayment({
        orderId: order.id,
        amount: total,
        method: paymentMethod,
      });
      await confirmPayment(payment.id ?? payment.Id ?? payment.paymentId ?? payment.PaymentId);
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "https://www.loft-shop.pp.ua";
      const link = `${origin}/orders/${order.id}`;
      try {
        await fetch("/bff/notify/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: userId,
            messageText: `Your order #${order.id} has been created and paid. ${link}`,
          }),
        });
      } catch {
        // ignore notification failures
      }
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      router.push("/login");
      return;
    }
    if (paymentMethod === null || paymentMethod === undefined) {
      setError("Select a payment method.");
      return;
    }
    if (isStripeSelected) {
      startStripeCheckout();
      return;
    }
    if (isCardSelected) {
      setCardError(null);
      setCardOpen(true);
      return;
    }
    completeCheckout();
  };

  const handleCardPay = () => {
    const digits = cardForm.number.replace(/\D/g, "");
    if (digits.length < 12 || !cardForm.exp || cardForm.cvc.trim().length < 3) {
      setCardError("Enter a valid card number, expiry, and CVC.");
      return;
    }
    setCardError(null);
    setCardOpen(false);
    completeCheckout();
  };

  const startStripeCheckout = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { order } = await createOrderFromCart(userId);
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "https://www.loft-shop.pp.ua";

      const payload = {
        orderId: order.id,
        amount: total,
        successUrl: `${origin}/orders/${order.id}?payment=stripe-success`,
        cancelUrl: `${origin}/checkout?payment=stripe-cancel`,
      };

      const res = await fetch("/bff/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[checkout] stripe create session failed", {
          status: res.status,
          data,
        });
        throw new Error(
          (data && (data.message || data.error)) || "Failed to start Stripe checkout"
        );
      }

      const url = data.url || data.sessionUrl;
      if (!url) {
        throw new Error("Stripe checkout URL was not returned from the server.");
      }

      window.location.href = url;
    } catch (err: any) {
      console.error("[checkout] stripe redirect error", err);
      setError(err?.message || "Stripe checkout failed");
      setSubmitting(false);
    }
  };

  const resolveImage = (url?: string | null, mediaFiles?: any) => {
    if (url) {
      if (url.startsWith("/media")) return resolveMediaUrl(url);
      return url;
    }
    if (Array.isArray(mediaFiles)) {
      const first = getFirstPublicImageUrl(mediaFiles);
      if (first) return first;
    }
    return "/default-product.jpg";
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-80px)] bg-[var(--bg-body)] text-white flex items-center justify-center">
        <div className="opacity-70">Loading checkout…</div>
      </div>
    );
  }

  return (
    <main className={`${almarai.className} bg-[var(--bg-body)] text-white min-h-screen px-6 py-10`}>
      <div className="max-w-[1400px] mx-auto">
        <h1 className={`${ysabeau.className} text-3xl font-semibold mb-6 text-center`}>Checkout</h1>
        {error && <div className="mb-4 text-sm text-red-400 bg-red-400/10 px-4 py-3 rounded-2xl">{error}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-6">
            <section className="bg-[var(--bg-elev-2)]/60 border border-[var(--border)] rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-semibold">Contact</h2>
              <InputField
                label="Phone number"
                type="tel"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={handleChange("phone")}
                shape="office"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Name"
                  type="text"
                  placeholder="Enter name"
                  value={form.customerName}
                  onChange={handleChange("customerName")}
                  shape="office"
                />
                <InputField
                  label="Email"
                  type="email"
                  placeholder="Enter email"
                  value={form.customerEmail}
                  onChange={handleChange("customerEmail")}
                  shape="office"
                />
              </div>
            </section>

            <section className="bg-[var(--bg-elev-2)]/60 border border-[var(--border)] rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-semibold">Shipping</h2>
              <InputField
                label="Recipient name"
                type="text"
                placeholder="Enter recipient name"
                value={form.shippingRecipientName}
                onChange={handleChange("shippingRecipientName")}
                shape="office"
              />
              <InputField
                label="Country / Region"
                type="text"
                placeholder="Enter country or region"
                value={form.shippingCountry}
                onChange={handleChange("shippingCountry")}
                shape="office"
              />
              <InputField
                label="City"
                type="text"
                placeholder="Enter city"
                value={form.shippingCity}
                onChange={handleChange("shippingCity")}
                shape="office"
              />
              <InputField
                label="Postal code"
                type="text"
                placeholder="Enter postal code"
                value={form.shippingPostalCode}
                onChange={handleChange("shippingPostalCode")}
                shape="office"
              />
              <InputField
                label="Address"
                type="text"
                placeholder="Street, house, apartment"
                value={form.shippingAddress}
                onChange={handleChange("shippingAddress")}
                shape="office"
              />
            </section>
          </div>

          <aside className="space-y-4">
            <div className="bg-[var(--bg-elev-2)]/60 border border-[var(--border)] rounded-2xl p-4 space-y-3">
              <h3 className="text-lg font-semibold">Order items</h3>
              {cartItems.length === 0 ? (
                <div className="text-sm opacity-70">Your cart is empty.</div>
              ) : (
                cartItems.map((item) => {
                  const display = resolveImage(item.imageUrl, (item as any)?.mediaFiles);
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-[var(--bg-elev-3)] px-3 py-2">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--bg-elev-1)] flex-shrink-0">
                        <img src={display} alt={item.productName ?? "Product"} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold line-clamp-2">{item.productName ?? `Product ${item.productId}`}</div>
                        <div className="text-xs opacity-70">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-sm font-semibold">
                        {(item.price ?? 0).toFixed(2)}$
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-[var(--bg-elev-2)]/60 border border-[var(--border)] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between text-sm opacity-80">
                <span>Items total</span>
                <span>{total.toFixed(2)}$</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{total.toFixed(2)}$</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-xs uppercase opacity-70">Payment method</div>
                {paymentMethods.length > 0 ? (
                  <select
                    value={paymentMethod ?? ""}
                    onChange={(e) => setPaymentMethod(Number(e.target.value))}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2 outline-none"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-red-400">No payment methods available.</div>
                )}
                {isStripeSelected && (
                  <div className="text-xs text-[var(--success)] mt-1">
                    You&apos;ll be redirected to Stripe Checkout to complete payment.
                  </div>
                )}
              </div>
              <Button
                type="submit"
                variant="submit"
                className="w-full"
                onClick={handleSubmit}
                disabled={paymentMethods.length === 0 || submitting}
              >
                {submitting ? "Processing..." : "Order and Pay"}
              </Button>
            </div>
          </aside>
        </form>

        {cardOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-[var(--bg-elev-2)] text-white border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Pay with card</h3>
                <button
                  type="button"
                  className="text-sm opacity-70 hover:opacity-100"
                  onClick={() => setCardOpen(false)}
                  disabled={submitting}
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <input
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2 outline-none"
                  placeholder="Card number"
                  value={cardForm.number}
                  onChange={(e) => setCardForm((prev) => ({ ...prev, number: e.target.value }))}
                  inputMode="numeric"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2 outline-none"
                    placeholder="MM/YY"
                    value={cardForm.exp}
                    onChange={(e) => setCardForm((prev) => ({ ...prev, exp: e.target.value }))}
                  />
                  <input
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2 outline-none"
                    placeholder="CVC"
                    value={cardForm.cvc}
                    onChange={(e) => setCardForm((prev) => ({ ...prev, cvc: e.target.value }))}
                    inputMode="numeric"
                  />
                </div>
                <input
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2 outline-none"
                  placeholder="ZIP / Postal code"
                  value={cardForm.zip}
                  onChange={(e) => setCardForm((prev) => ({ ...prev, zip: e.target.value }))}
                />
              </div>
              {cardError && <div className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-xl">{cardError}</div>}
              <Button type="button" className="w-full" variant="submit" onClick={handleCardPay} disabled={submitting}>
                {submitting ? "Processing..." : "Pay and Place Order"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
