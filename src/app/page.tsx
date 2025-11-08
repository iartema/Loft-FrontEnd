"use client";
import { useEffect, useState } from "react";
import { getMyProfile } from "./components/lib/api";

export default function HomePage() {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getMyProfile();
        if (mounted) setUser(me);
      } catch {
        // not logged in or fetch failed; ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-body)] text-white">
      <h1 className="text-5xl font-bold mb-4">
        {user?.email ? `Welcome, ${user.email}` : "Welcome!"}
      </h1>
      {!user?.email && <p>Please log in to continue.</p>}
    </main>
  );
}
