"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../atoms/Button";
import {
  type CartDto,
  type CartItemDto,
  fetchCartByCustomer,
  updateCartItem,
  removeCartItem,
} from "../lib/api";
import { MEDIA_PUBLIC_BASE } from "../../lib/media";
import { getCurrentUserCached } from "../lib/userCache";
import { useLocale } from "../../i18n/LocaleProvider";

export default function CartView() {
  const { t } = useLocale();
  const [userId, setUserId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartDto | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<Record<number, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const me = await getCurrentUserCached();
        if (!me?.id) {
          setError(t("cart.signIn"));
          setLoading(false);
          return;
        }
        setUserId(me.id);
        await refreshCart(me.id);
      } catch (err: any) {
        setError(err?.message || t("cart.loadError"));
        setLoading(false);
      }
    })();
  }, []);

  const refreshCart = async (customerId: number) => {
    setLoading(true);
    try {
      const data = await fetchCartByCustomer(customerId);
      setCart(data);
      if (data) {
        const defaults: Record<number, boolean> = {};
        data.cartItems.forEach((item) => (defaults[item.id] = true));
        setSelected(defaults);
      } else {
        setSelected({});
      }
    } catch (err: any) {
      setError(err?.message || t("cart.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (itemId: number, value?: boolean) => {
    setSelected((prev) => ({
      ...prev,
      [itemId]: value ?? !prev[itemId],
    }));
  };

  const toggleAll = (checked: boolean) => {
    if (!cart) return;
    const next: Record<number, boolean> = {};
    cart.cartItems.forEach((item) => (next[item.id] = checked));
    setSelected(next);
  };

  const updateQuantity = async (item: CartItemDto, quantity: number) => {
    if (!userId) return;
    if (quantity <= 0) {
      await removeItem(item);
      return;
    }
    const prevQty = item.quantity;
    setCart((prev) =>
      prev
        ? {
            ...prev,
            cartItems: prev.cartItems.map((ci) =>
              ci.id === item.id ? { ...ci, quantity } : ci
            ),
          }
        : prev
    );
    setPendingItems((p) => ({ ...p, [item.id]: true }));
    try {
      await updateCartItem(userId, item.productId, quantity);
    } catch (err: any) {
      setError(err?.message || t("cart.updateError"));
      setCart((prev) =>
        prev
          ? {
              ...prev,
              cartItems: prev.cartItems.map((ci) =>
                ci.id === item.id ? { ...ci, quantity: prevQty } : ci
              ),
            }
          : prev
      );
    } finally {
      setPendingItems((p) => ({ ...p, [item.id]: false }));
    }
  };

  const removeItem = async (item: CartItemDto) => {
    if (!userId) return;
    setPendingItems((p) => ({ ...p, [item.id]: true }));
    try {
      await removeCartItem(userId, item.productId);
      setCart((prev) =>
        prev
          ? { ...prev, cartItems: prev.cartItems.filter((ci) => ci.id !== item.id) }
          : prev
      );
      setSelected((prev) => {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
    } catch (err: any) {
      setError(err?.message || t("cart.removeError"));
    } finally {
      setPendingItems((p) => ({ ...p, [item.id]: false }));
    }
  };

  const total = useMemo(() => {
    if (!cart) return 0;
    return cart.cartItems.reduce((sum, item) => {
      if (!selected[item.id]) return sum;
      const price = Number(item.price ?? 0);
      return sum + price * item.quantity;
    }, 0);
  }, [cart, selected]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white opacity-70">
        {t("common.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  if (!cart || cart.cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white gap-4">
        <div className="text-lg opacity-80">{t("cart.empty")}</div>
        <Button className="max-w-[220px]" onClick={() => router.push("/search")}>
          {t("cart.browse")}
        </Button>
      </div>
    );
  }

  const allSelected =
    cart.cartItems.length > 0 &&
    cart.cartItems.every((item) => selected[item.id]);

  return (
    <div className="text-white space-y-6">
      <div className="relative flex items-center justify-center">
        <div className="flex items-center gap-3 bg-[var(--bg-frame)] rounded-2xl px-6 py-3 absolute left-0">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
            className="accent-[var(--brand)]"
          />
          <span className="text-lg font-semibold">{t("cart.selectAll")}</span>
        </div>
        <div className="text-2xl font-semibold text-center">{t("cart.title")}</div>
      </div>

      <div className="divide-y divide-[var(--divider)] border-t border-[var(--divider)]">
        {cart.cartItems.map((item) => (
          <CartRow
            key={item.id}
            item={item}
            selected={!!selected[item.id]}
            onToggle={() => toggleSelect(item.id)}
            onQuantityChange={(qty) => updateQuantity(item, qty)}
            onRemove={() => removeItem(item)}
            disabled={!!pendingItems[item.id]}
          />
        ))}
      </div>

      <div className="flex justify-center">
        <div className="bg-[var(--bg-elev-2)]/60 rounded-2xl px-6 py-3 flex items-center gap-6"
        style={{boxShadow: "0 3px 3px 0px rgba(0, 0, 0, 0.25)"}}>
          <div className="text-xl font-semibold">{total.toFixed(2)}$</div>
          <button
            className="px-6 py-2 rounded-[12px] bg-white/80 text-black font-semibold hover:bg-white"
            onClick={() => router.push("/checkout")}
            style={{boxShadow: "0 3px 3px 0px rgba(0, 0, 0, 0.25)"}}
          >
            {t("cart.checkout")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartRow({
  item,
  selected,
  onToggle,
  onQuantityChange,
  onRemove,
  disabled,
}: {
  item: CartItemDto;
  selected: boolean;
  onToggle: () => void;
  onQuantityChange: (next: number) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const imgSrc =
    item.imageUrl && (item.imageUrl.startsWith("/media") || item.imageUrl.startsWith("media/"))
      ? `${MEDIA_PUBLIC_BASE}${item.imageUrl.startsWith("/") ? "" : "/"}${item.imageUrl}`
      : item.imageUrl || "/default-product.jpg";
  const priceLabel = `${item.price?.toFixed(2) ?? "0.00"}$`;
  return (
    <div className="px-1 py-4 flex items-center gap-4">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="flex accent-[var(--brand)]"
      />
      <div className="w-16 h-16 min-w-[64px] rounded-xl overflow-hidden bg-[var(--bg-elev-2)] relative aspect-square">
        <Image src={imgSrc} alt={item.productName ?? "Product"} fill sizes="64px" className="object-cover" />
      </div>
      <div className="flex flex-col md:flex-row md:justify-between w-full gap-4">
        <div className="flex-1">
          <div className="font-semibold">{item.productName ?? `Product ${item.productId}`}</div>
          <div className="opacity-70 text-sm">{priceLabel}</div>
          {item.attributeValues && item.attributeValues.length > 0 && (
            <div className="opacity-60 text-xs mt-1">
              {item.attributeValues.map((attr) => `${attr.attributeId}: ${attr.value}`).join(", ")}
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <QuantityControl
            quantity={item.quantity}
            onChange={onQuantityChange}
            disabled={disabled}
          />
          <button
            className="w-10 h-10 rounded-full border border-[var(--brand)] flex items-center justify-center text-[var(--brand)] hover:text-black hover:bg-[var(--brand)] transition"
            onClick={onRemove}
            disabled={disabled}
            title="Remove item"
            style={{boxShadow: "0 3px 10px 4px rgba(0, 0, 0, 0.15)"}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 7h12M9 7V5h6v2m-7 3v8m4-8v8m4-8v8M7 7h10l-1 13H8L7 7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function QuantityControl({
  quantity,
  onChange,
  disabled,
}: {
  quantity: number;
  onChange: (next: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-row items-center rounded-[12px] border border-[var(--sort-label)] overflow-hidden text-lg max-w-[110px]">
      <button
        type="button"
        className="px-3 py-2 hover:bg-white hover:text-black transition"
        onClick={() => onChange(quantity - 1)}
        disabled={disabled}
      >
        –
      </button>
      <div className="px-4 py-2">{quantity}</div>
      <button
        type="button"
        className="px-3 py-2 hover:bg-white hover:text-black transition"
        onClick={() => onChange(quantity + 1)}
        disabled={disabled}
      >
        +
      </button>
    </div>
  );
}
