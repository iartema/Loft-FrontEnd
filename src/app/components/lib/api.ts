export async function registerUser(email: string, password: string) {
  const res = await fetch(`/api/auth/register`, { // ✅ internal proxy route
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Registration failed");
  }

  return await res.json();
}
