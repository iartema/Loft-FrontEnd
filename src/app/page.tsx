"use client";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [user, setUser] = useState<{ name?: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#111] text-white">
      <h1 className="text-5xl font-bold mb-4">Welcome{user ? `, ${user.name}` : "!"}</h1>
      {!user && <p>Please log in to continue.</p>}
    </main>
  );
}
