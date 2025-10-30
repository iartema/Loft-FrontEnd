"use client";
import React, { useRef, useState } from "react";
import Title from "../atoms/Title";
import InputField from "../molecules/InputField";
import ProfileHeader from "../molecules/ProfileHeader";

export default function ProfileForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "Reed",
    surname: "Anthony",
    email: "lorem@gmail.com",
    phone: "",
    postalcode: "",
    city: "",
    country: "",
    address: "",
    avatar: "/default-avatar.jpg",
  });

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData({ ...formData, [field]: e.target.value });

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData({ ...formData, avatar: imageUrl });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updated profile:", formData);
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

      {/* Change Information */}
      <section>
        <Title color="text-green-400" className="mb-4">
          Change information
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
