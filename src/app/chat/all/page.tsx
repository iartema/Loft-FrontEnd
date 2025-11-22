"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileSidebar from "../../components/molecules/ProfileSidebar";
import {
  fetchMyChats,
  fetchPublicUserById,
  type ChatDto,
  deleteChat,
} from "../../components/lib/api";
import { getCurrentUserCached } from "../../components/lib/userCache";
import { resolveMediaUrl } from "../../lib/media";
import { subscribeToChatMessages } from "../../components/lib/chatHubClient";

type EnrichedChat = ChatDto & {
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessageText: string;
  lastMessageDate: string;
  unread: boolean;
};

const FILTERS: string[] = [];

export default function ChatAllPage() {
  const router = useRouter();
  const [chats, setChats] = useState<EnrichedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const buildEnrichedChats = useCallback(
    async (meId: number | null) => {
      const rawChats = await fetchMyChats();
      return Promise.all(
        rawChats.map(async (chat) => {
          const otherUserId = chat.user1Id === meId ? chat.user2Id : chat.user1Id;
          let otherUserName = "Unknown";
          let otherUserAvatar: string | null = null;
          try {
            const u = await fetchPublicUserById(otherUserId);
            otherUserName =
              [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() ||
              u?.email ||
              otherUserName;
            otherUserAvatar = resolveMediaUrl(u?.avatarUrl ?? "") || null;
          } catch {
            // ignore user lookup errors
          }
          const lastMessage = chat.lastMessage;
          const lastMessageText = lastMessage?.messageText ?? "(no messages yet)";
          const lastMessageDate = lastMessage?.sentAt ?? chat.createdAt;
          const unread =
            Boolean(lastMessage) && lastMessage!.recipientId === meId && !lastMessage!.isRead;
          return {
            ...chat,
            otherUserId,
            otherUserName,
            otherUserAvatar,
            lastMessageText,
            lastMessageDate,
            unread,
          };
        })
      );
    },
    []
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await getCurrentUserCached();
        if (!active) return;
        const meId = me?.id ?? null;
        setCurrentUserId(meId);

        const enriched = await buildEnrichedChats(meId);
        if (active) setChats(enriched);
      } catch (err: any) {
        if (active) setError(err?.message || "Failed to load chats");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [buildEnrichedChats]);

  useEffect(() => {
    if (!currentUserId) return;
    let unsubscribe: (() => void) | undefined;
    subscribeToChatMessages((incoming) => {
      if (!incoming) return;
      if (
        incoming.senderId !== currentUserId &&
        incoming.recipientId !== currentUserId
      ) {
        return;
      }
      buildEnrichedChats(currentUserId)
        .then((updated) => setChats(updated))
        .catch((err) => setError(err?.message || "Failed to refresh chats"));
    })
      .then((stop) => {
        unsubscribe = stop;
      })
      .catch((err) => setError(err?.message || "Failed to connect to chat hub"));

    return () => {
      unsubscribe?.();
    };
  }, [currentUserId, buildEnrichedChats]);

  // Fallback polling to keep list fresh even if hub fails
  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    const interval = setInterval(() => {
      buildEnrichedChats(currentUserId)
        .then((updated) => {
          if (!cancelled) setChats(updated);
        })
        .catch(() => {});
    }, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUserId, buildEnrichedChats]);

  const filteredChats = useMemo(() => {
    if (filter === "All") return chats;
    return chats; // other filters not implemented yet
  }, [filter, chats]);

  const handleDelete = async (chatId: number) => {
    if (!chatId) return;
    setDeletingId(chatId);
    try {
      await deleteChat(chatId);
      setChats((prev) => prev.filter((chat) => chat.chatId !== chatId));
    } catch (err: any) {
      setError(err?.message || "Failed to delete chat");
    } finally {
      setDeletingId(null);
    };
  };

  const renderChatRow = (chat: EnrichedChat) => {
    return (
      <div
        key={chat.chatId}
        className="flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-2xl transition cursor-pointer"
        onClick={() => router.push(`/chat/${chat.otherUserId}`)}
      >
        <div className="flex items-center gap-3">
          {chat.otherUserAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={chat.otherUserAvatar}
              alt={chat.otherUserName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[var(--bg-elev-2)] grid place-items-center text-lg text-white/70">
              {chat.otherUserName?.charAt(0) ?? "?"}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold">{chat.otherUserName}</span>
            <span className="text-sm opacity-70 line-clamp-1">{chat.lastMessageText}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm opacity-70">
            {chat.lastMessageDate ? new Date(chat.lastMessageDate).toLocaleString() : ""}
          </div>
          {chat.unread && (
            <span className="w-3 h-3 rounded-full bg-[var(--success)] block" />
          )}
          <button
            className="text-white/60 hover:text-white"
            title="Delete chat"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(chat.chatId);
            }}
            disabled={deletingId === chat.chatId}
          >
            🗑
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="relative flex min-h-screen bg-[var(--bg-body)] text-white">
      <section className="flex flex-col flex-1 px-16 py-10">
        <header className="mb-6">
          <h1 className="text-4xl font-semibold">My chats</h1>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {FILTERS.map((entry) => (
              <button
                key={entry}
                className={`text-sm uppercase ${
                  filter === entry ? "text-[var(--success)] font-semibold" : "text-white/70"
                }`}
                onClick={() => setFilter(entry)}
              >
                {entry}
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-400/10 px-4 py-2 rounded-2xl border border-red-400/40">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center opacity-70">Loading chats…</div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center opacity-70 mt-20">You have no chats yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredChats.map(renderChatRow)}
          </div>
        )}
      </section>

      {/* Sidebar on right */}
            <aside className="w-[300px] px-4 py-10">
              <div className="sticky top-10">
                <div className="bg-[var(--bg-elev-1)] rounded-2xl p-6 w-[240px] shadow-lg">
                  <ProfileSidebar />
                </div>
              </div>
            </aside>
    </main>
  );
}
