"use client";

import React, { useEffect, useState } from "react";
import Button from "../atoms/Button";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUserCached, clearCurrentUserCache } from "../lib/userCache";
import { logout as logoutApi } from "../lib/api";
import { resolveMediaUrl } from "../../lib/media";

export default function ProfileSidebar() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("/default-avatar.jpg");

  useEffect(() => {
    let mounted = true;
    getCurrentUserCached()
      .then((me: any) => {
        if (!mounted) return;
        setEmail((me?.email as string) || "");
        const resolvedAvatar = resolveMediaUrl(me?.avatarUrl as string);
        if (resolvedAvatar) {
          setAvatar(resolvedAvatar);
        } else {
          setAvatar("/default-avatar.jpg");
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      mounted = false;
    };
  }, []);
  const pathname = usePathname(); // 👈 gives us current URL path (e.g. "/profile")

  const menuItems = [
    { label: "Profile settings", path: "/profile" },
    { label: "Order history", path: "/orderhistory" },
    { label: "My favorites", path: "/myfavorites" },
    { label: "My products", path: "/myproducts" },
    { label: "My chats", path: "/chat/all" },
  ];

  const accItems = [
    { label: "Help", path: "/help" },
    { label: "Log out", path: "/logout" },
  ];

  return (
    <div className="flex flex-col justify-between h-full w-full bg-[var(--bg-elev-1)] rounded-2xl py-6">
      {/* User info */}
      <div className="flex items-center gap-1 mb-8 w-full">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
          <Image
            src={avatar || "/default-avatar.jpg"}
            alt="User avatar"
            width={96}
            height={96}
            className="w-full h-full object-cover"
            unoptimized={avatar?.startsWith("blob:") || avatar?.startsWith("data:") || false}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate">{email || ""}</p>
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex-1 flex flex-col gap-3">
        {menuItems.map((item, i) => {
          const isActive = pathname === item.path; // 👈 check current path
          return (
            <Button
              key={i}
              label={item.label}
              className={`text-sm py-2 ${
                isActive ? "text-[var(--success)]" : "text-white"
              }`}
              onClick={() => item.path && router.push(item.path)}
            />
          );
        })}
      </div>

      {/* Bottom section */}
      <div className="mt-8 flex flex-col gap-3">
        {accItems.map((item, i) => {
          const isActive = pathname === item.path;
          return (
            <Button
              key={i}
              label={item.label}
              className={`text-sm py-2 ${
                isActive ? "text-[var(--success)]" : "text-white"
              }`}
              onClick={async () => {
                if (item.label === "Log out") {
                  try {
                    await logoutApi();
                  } catch {}
                  clearCurrentUserCache();
                  router.push("/login");
                } else if (item.path) {
                  router.push(item.path);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
