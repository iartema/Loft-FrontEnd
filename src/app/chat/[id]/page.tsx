/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Almarai } from "next/font/google";
import ProfileSidebar from "../../components/molecules/ProfileSidebar";
import {
  fetchConversationWith,
  sendChatMessage,
  markChatRead,
  fetchPublicUserById,
  fetchProductById,
  fetchOrderById,
  type ProductDto,
  type OrderDto,
  type ChatMessageDto,
} from "../../components/lib/api";
import Divider from "../../components/atoms/Divider";
import { subscribeToChatMessages } from "../../components/lib/chatHubClient";
import { getCurrentUserCached } from "../../components/lib/userCache";
import { getFirstPublicImageUrl, resolveMediaUrl } from "../../lib/media";
import { useLocale } from "../../i18n/LocaleProvider";

const almarai = Almarai({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

export default function ChatConversationPage() {
  const { t } = useLocale();
  const params = useParams<{ id: string }>();
  const otherUserId = Number(params.id);
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState(t("chats.title"));
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isOfficialAccount, setIsOfficialAccount] = useState(false);
  const [productPreviews, setProductPreviews] = useState<Record<number, ProductDto>>({});
  const [orderPreviews, setOrderPreviews] = useState<Record<number, OrderDto>>({});
  const messagesRef = useRef<HTMLDivElement>(null);

  const normalizeMessage = (message: any): ChatMessageDto => ({
    ...message,
    isMod: Boolean(message?.isMod ?? message?.is_mod ?? message?.IsMod ?? false),
  });

  useEffect(() => {
    getCurrentUserCached().then((user) => setCurrentUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!otherUserId || Number.isNaN(otherUserId)) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [msgs, user] = await Promise.all([
          fetchConversationWith(otherUserId),
          fetchPublicUserById(otherUserId).catch(() => null),
        ]);
        if (!active) return;
        const normalizedMsgs = msgs
          .map(normalizeMessage)
          .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
        setMessages(normalizedMsgs);

        if (user) {
          const resolvedName =
            [user.firstName, user.lastName]
              .map((part) => (part || "").trim())
              .filter(Boolean)
              .join(" ") || user.email || "Chat";
          setOtherUserName(resolvedName);
          const avatar = resolveMediaUrl(user.avatarUrl ?? "");
          setOtherUserAvatar(avatar || null);
        } else {
          setOtherUserName("Chat");
          setOtherUserAvatar(null);
        }
        await markChatRead(otherUserId);
      } catch (err: any) {
        if (active) setError(err?.message || "Failed to load conversation");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [otherUserId]);

  const scrollMessagesToBottom = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;
    let unsubscribe: (() => void) | undefined;
    subscribeToChatMessages((incoming) => {
      if (!incoming) return;
      const isForThisChat =
        (incoming.senderId === otherUserId && incoming.recipientId === currentUserId) ||
        (incoming.senderId === currentUserId && incoming.recipientId === otherUserId);
      if (!isForThisChat) return;

      const normalizedIncoming = normalizeMessage(incoming);
      setMessages((prev) => {
        if (prev.some((m) => m.id === normalizedIncoming.id)) return prev;
        return [...prev, normalizedIncoming].sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
      });

      if (incoming.senderId === otherUserId) {
        markChatRead(otherUserId).catch(() => {});
      }
    })
      .then((stop) => {
        unsubscribe = stop;
      })
      .catch((err) => {
        setError(err?.message || "Failed to connect to chat hub");
      });

    return () => {
      unsubscribe?.();
    };
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    if (!otherUserId) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const msgs = await fetchConversationWith(otherUserId);
        if (cancelled) return;
        const normalizedMsgs = msgs
          .map(normalizeMessage)
          .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
        setMessages(normalizedMsgs);
      } catch {
        // swallow polling errors
      }
    }, 6000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [otherUserId]);

  // Preload product previews referenced in messages
  useEffect(() => {
    const ids = new Set<number>();
    messages.forEach((m) => {
      const id = extractProductId(m.messageText);
      if (id) ids.add(id);
    });
    const toLoad = Array.from(ids).filter((id) => !productPreviews[id]);
    toLoad.forEach(async (id) => {
      try {
        const product = await fetchProductById(id);
        setProductPreviews((prev) => ({ ...prev, [id]: product }));
      } catch {
        // ignore failed preview fetch
      }
    });
  }, [messages, productPreviews]);

  useEffect(() => {
    const ids = new Set<number>();
    messages.forEach((m) => {
      const id = extractOrderId(m.messageText);
      if (id) ids.add(id);
    });
    const toLoad = Array.from(ids).filter((id) => !orderPreviews[id]);
    toLoad.forEach(async (id) => {
      try {
        const order = await fetchOrderById(id);
        setOrderPreviews((prev) => ({ ...prev, [id]: order }));
      } catch {
        // ignore failed order preview fetch
      }
    });
  }, [messages, orderPreviews]);

  useLayoutEffect(() => {
    scrollMessagesToBottom();
  }, [messages.length, scrollMessagesToBottom]);

  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(scrollMessagesToBottom, 0);
    return () => clearTimeout(timeout);
  }, [loading, scrollMessagesToBottom]);

  useEffect(() => {
    setIsOfficialAccount(messages.some((m) => m.isMod));
  }, [messages]);

  const extractProductId = (text: string): number | null => {
    if (!text) return null;
    const match = text.match(/product\/(\d+)/i);
    if (match && match[1]) {
      const id = Number(match[1]);
      return Number.isFinite(id) ? id : null;
    }
    return null;
  };

  const extractOrderId = (text: string): number | null => {
    if (!text) return null;
    const match = text.match(/orders\/(\d+)/i);
    if (match && match[1]) {
      const id = Number(match[1]);
      return Number.isFinite(id) ? id : null;
    }
    return null;
  };

  const stripProductLink = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/https?:\/\/\S*\/product\/\d+/gi, "")
      .replace(/\/product\/\d+/gi, "")
      .replace(/https?:\/\/\S*\/orders\/\d+/gi, "")
      .replace(/\/orders\/\d+/gi, "")
      .trim();
  };

  const handleSend = async () => {
    if (!input.trim() || sending || Number.isNaN(otherUserId)) return;
    setSending(true);
    try {
      const message = await sendChatMessage(otherUserId, input.trim());
      const normalized = normalizeMessage(message);
      setMessages((prev) => [...prev, normalized]);
      setInput("");
    } catch (err: any) {
      setError(err?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const uploadAndSendFile = async (file: File, category = "chat") => {
    if (!file || uploading || Number.isNaN(otherUserId)) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      form.append("isPrivate", "false");
      const res = await fetch("/bff/media/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }
      const payload = await res.json();
      const rawUrl = payload?.url || payload?.fileUrl || payload?.fullUrl || payload?.path;
      const resolved = resolveMediaUrl(rawUrl);
      const sent = await sendChatMessage(otherUserId, input.trim() || file.name, resolved);
      const normalized = normalizeMessage(sent);
      setMessages((prev) => [...prev, normalized]);
      setInput("");
    } catch (err: any) {
      setError(err?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const isLikelyImage = (url?: string | null) => {
    if (!url) return false;
    return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url.split("?")[0]);
  };

  const renderMessage = (message: ChatMessageDto) => {
    const isMine = message.senderId === currentUserId;
    const productId = extractProductId(message.messageText);
    const product = productId ? productPreviews[productId] : undefined;
    const imageUrl = product ? getFirstPublicImageUrl(product.mediaFiles) : "";
    const orderId = extractOrderId(message.messageText);
    const order = orderId ? orderPreviews[orderId] : undefined;
    const messageTextWithoutLink = stripProductLink(message.messageText);
    const attachedUrl = resolveMediaUrl((message as any).fileUrl);
    const isImage = isLikelyImage(attachedUrl);
    const orderPreviewImage = order?.orderItems?.[0]
      ? resolveMediaUrl(
          order.orderItems[0].imageUrl ||
            getFirstPublicImageUrl((order.orderItems[0] as any)?.mediaFiles) ||
            ""
        )
      : "";

    return (
      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[70%] rounded-3xl md:px-4 py-2 text-sm pt-3 pb-3 pl-4 pr-4 md:ml-3 mb-1 mt-1 ${
            isMine ? "bg-[var(--bg-elev-3)] text-white" : "bg-[var(--bg-elev-2)]"
          }`}
          style={{boxShadow: "0 2px 3px 2px rgba(0, 0, 0, 0.25)"}}
        >
          {attachedUrl && (
            <div className="mb-3">
              {isImage ? (
                <a href={attachedUrl} target="_blank" rel="noreferrer">
                  <img
                    src={attachedUrl}
                    alt="Attachment"
                    className="w-full max-h-72 object-contain rounded-2xl"
                    onLoad={scrollMessagesToBottom}
                  />
                </a>
              ) : (
                <a
                  href={attachedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="14 3 14 9 20 9" />
                  </svg>
                  <span className="text-sm">Document</span>
                </a>
              )}
            </div>
          )}
          {product && (
            <a
              href={`/product/${product.id}`}
              className="block mb-3 overflow-hidden rounded-2xl relative group"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-32 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  onLoad={scrollMessagesToBottom}
                />
              ) : (
                <div className="w-full h-32 bg-black/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 text-sm font-semibold text-[#ffffff]">
                {product.name}
              </div>
            </a>
          )}
          {order && (
            <a
              href={`/orders/${order.id}`}
              className="block mb-3 overflow-hidden rounded-2xl relative group border border-[var(--bg-elev-1)]"
            >
              {orderPreviewImage ? (
                <img
                  src={orderPreviewImage}
                  alt={`Order ${order.id}`}
                  className="w-full h-32 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  onLoad={scrollMessagesToBottom}
                />
              ) : (
                <div className="w-full h-32 bg-black/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 text-sm font-semibold space-y-1 text-[#ffffff]">
                <div>Order #{order.id}</div>
                <div className="text-xs opacity-80 flex items-center gap-2 text-[#ffffff]">
                  <span>{order.status}</span>
                  {order.orderItems?.[0]?.productName && (
                    <span className="truncate">{order.orderItems[0].productName}</span>
                  )}
                </div>
              </div>
            </a>
          )}
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1 text-[15px]">
              {messageTextWithoutLink || message.messageText}
            </div>
            <div className="text-xs opacity-70 whitespace-nowrap">
              {new Date(message.sentAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="relative flex min-h-screen !bg-[var(--bg-body)] text-white overflow-y-hidden overflow-x-hidden">
      <section className="flex flex-col flex-1 px-3 md:px-12 py-2 md:py-6 gap-2 md:gap-4">
        <header className="hidden md:flex items-center gap-4 !bg-[var(--bg-body)]">
          <button
            className="sort-label"
            onClick={() => router.push("/chat/all")}
            aria-label="Back"
          >
            {t("common.back")}
          </button>
          
          
        </header>

        <Divider text=""/>

        <header className="flex items-center gap-4 !bg-[var(--bg-body)]">
        {otherUserAvatar ? (
            <img
              src={otherUserAvatar}
              alt={otherUserName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[var(--bg-elev-2)] grid place-items-center text-lg !sort-label">
              {otherUserName?.charAt(0) ?? "?"}
            </div>
          )}
          <div>
            <div className="text-xl font-semibold sort-label flex items-center gap-2">
              <span>{otherUserName}</span>
              {isOfficialAccount && (
                <span
                  className="text-[var(--brand)]"
                  style={{ textShadow: "0 0 8px rgba(255, 193, 7, 0.55)" }}
                  title={t("chats.official")}
                  aria-label={t("chats.official")}
                >
                  ★
                </span>
              )}
            </div>
          </div>
        </header>

        <Divider text=""/>

        <div
          className={`${almarai.className} flex-1 overflow-y-auto space-y-2 pr-2 mt-4 overflow-x-hidden max-h-[63vh] md:max-h-[60vh]`}
          ref={messagesRef}
        >
          {loading ? (
            <div className="text-center opacity-70 mt-10">{t("chats.loadingThread")}</div>
          ) : messages.length === 0 ? (
            <div className="text-center opacity-70 mt-10">{t("chats.emptyThread")}</div>
          ) : (
            messages.map(renderMessage)
          )}
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}

        <div className="bg-[var(--bg-frame)] rounded-[5px] flex items-center gap-3 px-4 py-2"
        style={{boxShadow: "0 2px 3px 2px rgba(0, 0, 0, 0.25)"}}>
          <input
            type="text"
            className={`${almarai.className} flex-1 outline-none`}
            placeholder={t("chats.typeMessage")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending || uploading}
          />
          <div className="flex items-center gap-1">
            <label className="cursor-pointer p-2 rounded-lg hover:bg-white/5 chat-attach">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAndSendFile(file, "chat-images");
                  e.target.value = "";
                }}
                disabled={uploading}
              />
              <img src="/photo.svg" alt="Add photo" className="w-[22px] h-[22px] chat-attach-icon" />
            </label>
            <label className="cursor-pointer p-2 rounded-lg hover:bg-white/5 chat-attach">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAndSendFile(file, "chat-files");
                  e.target.value = "";
                }}
                disabled={uploading}
              />
              <img src="/paper-clip.svg" alt="Attach file" className="w-[22px] h-[22px] chat-attach-icon" />
            </label>
          </div>
        </div>
      </section>

      {/* Sidebar on right */}
            <aside className="hidden lg:block w-[300px] px-4 py-10">
              <div className="sticky top-10">
                <div className="bg-[var(--bg-elev-1)] rounded-2xl p-6 w-[240px] shadow-lg border-[1px] border-[var(--divider)]">
                  <ProfileSidebar />
                </div>
              </div>
            </aside>
    </main>
  );
}
