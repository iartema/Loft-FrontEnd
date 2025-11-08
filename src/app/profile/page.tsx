"use client";

import ProfileSidebar from "../components/molecules/ProfileSidebar";
import ProfileForm from "../components/organisms/ProfileForm";

export default function ProfilePage() {
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
