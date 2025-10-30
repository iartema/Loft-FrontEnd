"use client";

import React from "react";
import Button from "../atoms/Button";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

export default function ProfileSidebar() {
  const router = useRouter();
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
    <div className="flex flex-col justify-between h-full w-full bg-[#161616] rounded-2xl px-3 py-6 shadow-lg">
      {/* User info */}
      <div className="flex items-center gap-4 mb-8">
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
          <p className="font-semibold text-base">Reed Anthony</p>
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
                isActive ? "text-[#78FF7E]" : "text-white"
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
                isActive ? "text-[#78FF7E]" : "text-white"
              }`}
              onClick={() => item.path && router.push(item.path)}
            />
          );
        })}
      </div>
    </div>
  );
}
