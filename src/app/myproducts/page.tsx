"use client";

import ProfileSidebar from "../components/molecules/ProfileSidebar";
import MyProducts from "../components/organisms/MyProducts";

export default function MyProductsPage() {
  return (
    <main className="relative flex min-h-screen bg-[var(--bg-body)] text-white">
      {/* Main section */}
      <section className="flex flex-col flex-1 px-16 py-10">
        <MyProducts />
      </section>

      {/* Sidebar on right */}
      <aside className="flex items-center justify-center w-[300px] h-[700px]">
        <div className="bg-[var(--bg-elev-1)] rounded-2xl p-6 w-[240px]">
          <ProfileSidebar />
        </div>
      </aside>
    </main>
  );
}
