"use client";
import React, { useEffect, useRef, useState } from "react";
import Title from "../atoms/Title";
import InputField from "../molecules/InputField";
import ProfileHeader from "../molecules/ProfileHeader";
import { getMyProfile, updateMyProfile, uploadAvatar } from "../lib/api";
import { getCurrentUserCached, setCurrentUserCached } from "../lib/userCache";

export default function ProfileForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    postalcode: "",
    city: "",
    country: "",
    address: "",
    avatar: "/default-avatar.jpg",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await getCurrentUserCached();
        // me is expected to have firstName, lastName, email, phone, avatarUrl
        if (mounted) {
          const normalizeAvatar = (u?: string) => {
            if (!u) return undefined;
            if (u.startsWith('http://') || u.startsWith('https://')) return u;
            const withSlash = u.startsWith('/') ? u : `/${u}`;
            return `https://www.loft-shop.pp.ua${withSlash}`;
          };
          setFormData((prev) => ({
            ...prev,
            name: (me.firstName as string) || "",
            surname: (me.lastName as string) || "",
            email: (me.email as string) || "",
            phone: (me.phone as string) || "",
            avatar: normalizeAvatar(me.avatarUrl as string) || prev.avatar,
          }));
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData({ ...formData, [field]: e.target.value });

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData({ ...formData, avatar: previewUrl });
      // Upload immediately
      (async () => {
        try {
          const res = await uploadAvatar(file);
          const normalizeAvatar = (u?: string) => {
            if (!u) return undefined;
            if (u.startsWith('http://') || u.startsWith('https://')) return u;
            const withSlash = u.startsWith('/') ? u : `/${u}`;
            return `https://www.loft-shop.pp.ua${withSlash}`;
          };
          const remoteUrl = normalizeAvatar(res?.avatarUrl as string);

          if (!remoteUrl) return; // keep preview

          // Preload remote image; retry a few times in case file not yet served
          const tryLoad = (url: string, attempts = 4): Promise<boolean> =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              // cache-bust per attempt
              img.src = url + (url.includes("?") ? "&" : "?") + "ts=" + Date.now();
            }).then((ok) => {
              if (ok) return true;
              if (attempts <= 1) return false;
              return new Promise<boolean>((r) => setTimeout(async () => r(await tryLoad(url, attempts - 1)), 400));
            });

          const ok = await tryLoad(remoteUrl);
          if (ok) {
            setFormData((prev) => ({ ...prev, avatar: remoteUrl }));
            setCurrentUserCached((prev: any) => ({ ...(prev || {}), avatarUrl: remoteUrl }));
          } else {
            // keep preview; backend will serve soon or on next visit
            // optionally, surface a soft message
            // setError((e) => e || "Avatar will appear shortly");
          }
        } catch (err: any) {
          setError(err?.message || "Failed to upload avatar");
        }
      })();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateMyProfile({
        firstName: formData.name || null,
        lastName: formData.surname || null,
        phone: formData.phone || null,
      });
      setCurrentUserCached((prev: any) => ({
        ...(prev || {}),
        firstName: formData.name || null,
        lastName: formData.surname || null,
        phone: formData.phone || null,
      }));
    } catch (e: any) {
      setError(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <ProfileHeader
        name={formData.name}
        surname={formData.surname}
        email={formData.email}
        avatar={formData.avatar}
        onAvatarClick={handleAvatarClick}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <div className="border-t border-neutral-800" />

      {error && (
        <div className="text-red-500 text-sm ml-1">{error}</div>
      )}

      {/* Change Information */}
      <section>
        <Title color="text-green-400" className="mb-4">
          {loading ? "Loading profile..." : saving ? "Saving..." : "Change information"}
        </Title>
        <div className="grid grid-cols-2 gap-x-12 gap-y-1 ml-9 mt-8">
          <InputField label="Name" type="text" placeholder="Enter..." value={formData.name} onChange={handleChange("name")} required shape="office" />
          <InputField label="Surname" type="text" placeholder="Enter..." value={formData.surname} onChange={handleChange("surname")} shape="office" />
          <InputField label="Email" type="email" placeholder="Enter..." value={formData.email} onChange={handleChange("email")} required shape="office" />
          <InputField label="Phone Number" type="tel" placeholder="Enter..." value={formData.phone} onChange={handleChange("phone")} shape="office" />
        </div>
      </section>

      <div className="border-t border-neutral-800" />

      {/* Address Information */}
      <section>
        <Title color="text-green-400" className="mb-4">
          Shipping Address
        </Title>
        <div className="grid grid-cols-2 gap-x-12 gap-y-1 ml-9 mt-8">
          <InputField label="Postal Code" type="text" placeholder="Enter..." value={formData.postalcode} onChange={handleChange("postalcode")} shape="office" />
          <InputField label="City" type="text" placeholder="Enter..." value={formData.city} onChange={handleChange("city")} shape="office" />
          <InputField label="Country" type="text" placeholder="Enter..." value={formData.country} onChange={handleChange("country")} shape="office" />
          <InputField label="Address" type="text" placeholder="Enter..." value={formData.address} onChange={handleChange("address")} shape="office" />
        </div>
      </section>
    </form>
  );
}
