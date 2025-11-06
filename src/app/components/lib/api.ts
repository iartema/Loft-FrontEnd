export async function registerUser(email: string, password: string) {
  const res = await fetch(`/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, confirmPassword: password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Registration failed");
  }

  return await res.json();
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Login failed");
  }

  return await res.json();
}

// Client cannot read httpOnly cookies; rely on internal API routes

export async function getMyProfile() {
  const res = await fetch(`/api/users/me`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch profile");
  }

  return await res.json();
}

export type UpdateProfilePayload = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export async function updateMyProfile(payload: UpdateProfilePayload) {
  const res = await fetch(`/api/users/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update profile");
  }

  return await res.json();
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("avatar", file, file.name);
  const res = await fetch(`/api/users/me/avatar`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to upload avatar");
  }
  return await res.json();
}
