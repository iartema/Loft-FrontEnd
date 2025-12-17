"use client";
import React, { useEffect, useRef, useState } from "react";
import Title from "../atoms/Title";
import InputField from "../molecules/InputField";
import ProfileHeader from "../molecules/ProfileHeader";
import {
  updateMyProfile,
  uploadAvatar,
  fetchMyDefaultShippingAddress,
  createShippingAddress,
  updateShippingAddress,
} from "../lib/api";
import { getCurrentUserCached, setCurrentUserCached } from "../lib/userCache";
import { resolveMediaUrl } from "../../lib/media";
import { useLocale } from "../../i18n/LocaleProvider";

const pickMediaPath = (payload: any): string | null => {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object") return null;
  const candidate =
    (typeof payload.avatarUrl === "string" && payload.avatarUrl) ||
    (typeof payload.AvatarUrl === "string" && payload.AvatarUrl) ||
    (typeof payload.url === "string" && payload.url) ||
    (typeof payload.Url === "string" && payload.Url) ||
    (typeof payload.path === "string" && payload.path) ||
    (typeof payload.Path === "string" && payload.Path) ||
    (typeof payload.fileUrl === "string" && payload.fileUrl) ||
    (typeof payload.FileUrl === "string" && payload.FileUrl) ||
    null;
  return candidate ?? null;
};

const extractAvatarSources = (payload: any): { raw: string | null; resolved: string } => {
  const sources = [payload, payload?.raw];
  for (const source of sources) {
    const rawCandidate = pickMediaPath(source);
    if (rawCandidate && typeof rawCandidate === "string") {
      const resolvedCandidate = resolveMediaUrl(rawCandidate);
      return {
        raw: rawCandidate,
        resolved: resolvedCandidate || rawCandidate,
      };
    }
    if (typeof source === "string" && source.trim().length > 0) {
      const resolvedCandidate = resolveMediaUrl(source);
      return {
        raw: source,
        resolved: resolvedCandidate || source,
      };
    }
  }
  return { raw: null, resolved: "" };
};

export default function ProfileForm() {
  const { t } = useLocale();
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
  const [avatarValue, setAvatarValue] = useState<string | null>(null);
  const [avatarRemoteUrl, setAvatarRemoteUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [shippingAddressId, setShippingAddressId] = useState<number | null>(null);
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
          const rawAvatar = typeof me.avatarUrl === "string" ? me.avatarUrl : null;
          const resolvedAvatar = resolveMediaUrl(rawAvatar ?? "");
          setAvatarValue(rawAvatar ?? resolvedAvatar ?? null);
          setAvatarRemoteUrl(resolvedAvatar || null);
          setFormData((prev) => ({
            ...prev,
            name: (me.firstName as string) || "",
            surname: (me.lastName as string) || "",
            email: (me.email as string) || "",
            phone: (me.phone as string) || "",
            avatar: resolvedAvatar || prev.avatar,
          }));
        }
        try {
          const address = await fetchMyDefaultShippingAddress();
          if (address && mounted) {
            setShippingAddressId(address.id);
            setFormData((prev) => ({
              ...prev,
              postalcode: address.postalCode || "",
              city: address.city || "",
              country: address.country || "",
              address: address.address || "",
            }));
          }
        } catch (addrErr: any) {
          if (mounted && addrErr?.status !== 401) {
            setError(addrErr?.message || t("profile.addressLoadError"));
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || t("profile.loadError"));
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
      setAvatarUploading(true);
      setError(null);
      const previousRemote = avatarRemoteUrl || (avatarValue ? resolveMediaUrl(avatarValue) : null);
      const fallbackAvatar = previousRemote || formData.avatar;
      const uploadTask = async () => {
        try {
          const res = await uploadAvatar(file);
          const { raw, resolved } = extractAvatarSources(res);
          if (!raw && !resolved) return;
          const remote = resolved || (raw ? resolveMediaUrl(raw) : null);
          if (remote) {
            setFormData((prev) => ({ ...prev, avatar: remote }));
          }
          setAvatarValue(raw ?? resolved ?? null);
          setAvatarRemoteUrl(remote || null);
          setCurrentUserCached((prev: any) => ({
            ...(prev || {}),
            avatarUrl: remote || null,
          }));
        } catch (err: any) {
          console.error("avatar upload failed", err);
          setError(err?.message || t("profile.uploadError"));
          setFormData((prev) => ({ ...prev, avatar: fallbackAvatar }));
          setAvatarRemoteUrl(previousRemote || null);
        } finally {
          setAvatarUploading(false);
        }
      };

      void uploadTask();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (avatarUploading) {
      setError(t("profile.waitingAvatar"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateMyProfile({
        firstName: formData.name || null,
        lastName: formData.surname || null,
        phone: formData.phone || null,
        avatarUrl: avatarRemoteUrl || null,
      });
      setCurrentUserCached((prev: any) => ({
        ...(prev || {}),
        firstName: formData.name || null,
        lastName: formData.surname || null,
        phone: formData.phone || null,
        avatarUrl: avatarRemoteUrl || null,
      }));
      const trimmedAddress = {
        address: (formData.address || "").trim(),
        city: (formData.city || "").trim(),
        postalCode: (formData.postalcode || "").trim(),
        country: (formData.country || "").trim(),
      };
      const hasAddressInput = Object.values(trimmedAddress).some((val) => val.length > 0);
      if (hasAddressInput) {
        const payload = {
          ...trimmedAddress,
          recipientName: [formData.name, formData.surname].filter(Boolean).join(" ").trim() || null,
          isDefault: true,
        };
        if (shippingAddressId) {
          const updated = await updateShippingAddress(shippingAddressId, payload);
          setShippingAddressId(updated.id);
        } else {
          const created = await createShippingAddress(payload);
          setShippingAddressId(created.id);
        }
      }
    } catch (e: any) {
      setError(e?.message || t("profile.updateError"));
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
        saveDisabled={saving || avatarUploading}
        saveLabel={
          avatarUploading ? t("profile.uploadingAvatar") : saving ? t("profile.saving") : undefined
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <div className="border-t border-[var(--divider)]" />

      {error && (
        <div className="text-red-500 text-sm ml-1">{error}</div>
      )}

      {/* Change Information */}
      <section>
        <Title color="title-color" className="mb-4">
          {loading ? t("profile.loadingProfile") : saving ? t("profile.saving") : t("profile.changeInfo")}
        </Title>
        <div className="grid grid-cols-2 gap-x-12 gap-y-1 ml-9 mt-8">
          <InputField label={t("profile.name")} type="text" placeholder={t("profile.enter")} value={formData.name} onChange={handleChange("name")} required shape="office" />
          <InputField label={t("profile.surname")} type="text" placeholder={t("profile.enter")} value={formData.surname} onChange={handleChange("surname")} shape="office" />
          <InputField label={t("profile.email")} type="email" placeholder={t("profile.enter")} value={formData.email} onChange={handleChange("email")} required shape="office" />
          <InputField label={t("profile.phone")} type="tel" placeholder={t("profile.enter")} value={formData.phone} onChange={handleChange("phone")} shape="office" />
        </div>
      </section>

      <div className="border-t border-[var(--divider)]" />

      {/* Address Information */}
      <section>
        <Title color="title-color" className="mb-4">
          {t("profile.shippingAddress")}
        </Title>
        <div className="grid grid-cols-2 gap-x-12 gap-y-1 ml-9 mt-8">
          <InputField label={t("profile.postalCode")} type="text" placeholder={t("profile.enter")} value={formData.postalcode} onChange={handleChange("postalcode")} shape="office" />
          <InputField label={t("profile.city")} type="text" placeholder={t("profile.enter")} value={formData.city} onChange={handleChange("city")} shape="office" />
          <InputField label={t("profile.country")} type="text" placeholder={t("profile.enter")} value={formData.country} onChange={handleChange("country")} shape="office" />
          <InputField label={t("profile.address")} type="text" placeholder={t("profile.enter")} value={formData.address} onChange={handleChange("address")} shape="office" />
        </div>
      </section>
    </form>
  );
}
