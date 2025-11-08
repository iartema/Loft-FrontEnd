"use client";

import React, { useEffect, useState } from "react";
import Button from "../atoms/Button";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUserCached, clearCurrentUserCache } from "../lib/userCache";
import { logout as logoutApi } from "../lib/api";

export default function ProfileSidebar() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    getCurrentUserCached()
      .then((me: any) => {
        if (mounted) setEmail((me?.email as string) || "");
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
    { label: "Notifications", path: "/notifications" },
    { label: "Ukrainian", path: null },
  ];

  const accItems = [
    { label: "Help", path: "/help" },
    { label: "Log out", path: "/logout" },
  ];

  return (
    <div className="flex flex-col justify-between h-full w-full bg-[var(--bg-elev-1)] rounded-2xl px-3 py-6 shadow-lg">
      {/* User info */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src="/default-avatar.jpg"
            alt="User avatar"
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
        <div>
          <p className="font-semibold text-base text-center">{email || ""}</p>
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
