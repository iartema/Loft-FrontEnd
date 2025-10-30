"use client";

import ProfileSidebar from "../components/molecules/ProfileSidebar";
import OrderHistory from "../components/organisms/OrderHistory";

export default function OrderHistoryPage() {
  return (
    <main className="relative flex min-h-screen bg-[#111111] text-white">
      {/* Main section */}
      <section className="flex flex-col flex-1 px-16 py-10">
        <OrderHistory />
      </section>

      {/* Sidebar on right */}
      <aside className="flex items-center justify-center w-[300px] h-[700px]">
            <div className="bg-[#161616] rounded-2xl p-6 w-[240px]">
            <ProfileSidebar />
            </div>
      </aside>
    </main>
  );
}
