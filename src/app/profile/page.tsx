"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileSidebar from "../components/molecules/ProfileSidebar";
import ProfileForm from "../components/organisms/ProfileForm";
import { getCurrentUserCached } from "../components/lib/userCache";

export default function ProfilePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await getCurrentUserCached();
        if (!mounted) return;
        if (user?.id) {
          setAuthorized(true);
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-body)] text-white">
        <span className="opacity-70">Redirecting…</span>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen bg-[var(--bg-body)] text-white">
      {/* Main Section */}
      <section className="flex flex-col flex-1 px-16 py-10">
        <ProfileForm />
      </section>

      {/* Sidebar (floating box, centered vertically) */}
      <aside className="flex items-center justify-center w-[300px] h-[700px]">
        <div className="bg-[var(--bg-elev-1)] rounded-2xl p-6 w-[240px]">
          <ProfileSidebar />
        </div>
      </aside>
    </main>
  );
}
