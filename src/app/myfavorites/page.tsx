"use client";

import ProfileSidebar from "../components/molecules/ProfileSidebar";
import MyFavorites from "../components/organisms/MyFavorites";

export default function MyFavoritesPage() {
  return (
    <main className="relative flex min-h-screen bg-[var(--bg-body)] text-white">
      {/* Main section */}
      <section className="flex flex-col flex-1 px-16 py-10">
        <MyFavorites />
      </section>

      {/* Sidebar on right */}
      <aside className="hidden lg:block w-[300px] px-4 py-10">
        <div className="sticky top-10">
          <div className="bg-[var(--bg-elev-1)] rounded-2xl p-6 w-[240px] shadow-lg">
            <ProfileSidebar />
          </div>
        </div>
      </aside>
    </main>
  );
}
