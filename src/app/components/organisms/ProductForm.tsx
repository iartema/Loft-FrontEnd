/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "../molecules/InputField";
import Button from "../atoms/Button";
import Textarea from "../atoms/TextArea";
import ProgressBar from "../molecules/ProgressBar";
import CategoryModal from "../molecules/CategoryModal";
import AttributeFields from "../molecules/AttributeFields";
import ImageUploader, { type UploadPreview } from "../molecules/ImageUploader";
import DigitalFileUploader from "../molecules/DigitalFileUploader";
import { fetchCategories, fetchCategoryAttributes, fetchAttributeDetail } from "../lib/api";
import type { CategoryDto, CategoryAttributeFullDto } from "../lib/api";
import type { AttributeDef } from "../molecules/AttributeFields";
import {
  normalizeProductType,
  productTypeLabel,
  type ProductTypeKind,
} from "../../lib/productTypes";
import { extractMediaUrl } from "../../lib/media";

type Currency = "0" | "1"; // 0 -> UAH, 1 -> USD
type AttributeValue = string | number | boolean | string[];

type FlatCategory = {
  ID: number;
  Name: string;
  ParentCategoryId: number | null;
  Type?: ProductTypeKind;
};

type ProductPhoto = UploadPreview & {
  file?: File;
};

type DigitalAttachment = {
  id: string;
  name: string;
  size?: number;
  type?: string;
  file?: File;
  mediaId?: string;
};

interface ProductFormState {
  name: string;
  categoryId: number | null;
  productType: ProductTypeKind | null;
  attributes: Record<number, AttributeValue>;
  description: string;
  price: string;
  currency: Currency;
  quantity: string;
  photos: ProductPhoto[];
  digitalFiles: DigitalAttachment[];
}

export default function ProductForm() {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState>({
    name: "",
    categoryId: null,
    productType: null,
    attributes: {},
    description: "",
    price: "",
    currency: "0",
    quantity: "",
    photos: [],
    digitalFiles: [],
  });

  const [attributeDefs, setAttributeDefs] = useState<AttributeDef[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<FlatCategory[]>([]);
  const [requiredAttrIds, setRequiredAttrIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photosRef = useRef<ProductPhoto[]>([]);
  useEffect(() => {
    photosRef.current = form.photos;
  }, [form.photos]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => {
        if (photo.previewUrl && photo.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
    };
  }, []);

  const revokePhotoPreview = (photo?: ProductPhoto) => {
    if (!photo?.previewUrl) return;
    if (photo.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photo.previewUrl);
    }
  };

  useEffect(() => {
    const flatten = (
      list: CategoryDto[],
      acc: FlatCategory[] = []
    ) => {
      for (const c of list) {
        const normalizedType = normalizeProductType(
          (c as any).type ??
            (c as any).Type ??
            (c as any).productType ??
            (c as any).ProductType
        );
        acc.push({
          ID: c.id,
          Name: c.name,
          ParentCategoryId: c.parentCategoryId ?? null,
          Type: normalizedType,
        });
        if (c.subCategories && c.subCategories.length)
          flatten(c.subCategories, acc);
      }
      return acc;
    };
    fetchCategories()
      .then((cats) => setAllCategories(flatten(cats)))
      .catch(() => setAllCategories([]));
  }, []);

  const pickField = <T,>(source: CategoryAttributeFullDto | Record<string, any>, ...keys: string[]): T | undefined => {
    const record = source as Record<string, any>;
    for (const key of keys) {
      const value = record?.[key];
      if (value !== undefined && value !== null) return value as T;
    }
    return undefined;
  };

  const extractOptions = (raw: unknown): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((x) => String(x)).filter(Boolean);
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) return [];
      if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.map((x) => String(x)).filter(Boolean);
          if (parsed && typeof parsed === "object") return Object.values(parsed).map((x) => String(x)).filter(Boolean);
        } catch {
          // fall through to pipe split
        }
      }
      return trimmed.split("|").map((part) => part.trim()).filter(Boolean);
    }
    return [];
  };

  const detectAttributeType = (
    rawType: unknown,
    rawTypeDisplay: unknown,
    hasOptions: boolean
  ): AttributeDef["Type"] => {
    let Type: AttributeDef["Type"] = "text";
    const numeric = typeof rawType === "number" ? rawType : Number.parseInt(String(rawType ?? ""), 10);
    if (!Number.isNaN(numeric)) {
      if (numeric === 0) Type = "text";
      else if (numeric === 1) Type = "number";
      else if (numeric === 2) Type = "select";
    } else {
      const merged = `${String(rawType ?? "").toLowerCase()} ${String(rawTypeDisplay ?? "").toLowerCase()}`.trim();
      if (merged.includes("multi")) Type = "multiselect";
      else if (merged.includes("bool")) Type = "boolean";
      else if (merged.includes("number") || merged.includes("digit")) Type = "number";
      else if (merged.includes("list") || merged.includes("select")) Type = "select";
    }

    if (hasOptions) {
      if (Type === "text" || Type === "number") Type = "select";
    } else if (Type === "multiselect" || Type === "select") {
      Type = "text";
    }

    return Type;
  };

  const onSelectCategory = async (id: number) => {
    try {
      const full: CategoryAttributeFullDto[] = await fetchCategoryAttributes(id);

      const requiredIds: number[] = [];
      const mapped: AttributeDef[] = [];
      const sorted = [...full].sort(
        (a, b) =>
          (pickField<number>(a, "orderIndex", "OrderIndex") ?? 0) -
          (pickField<number>(b, "orderIndex", "OrderIndex") ?? 0)
      );

      for (const raw of sorted) {
        let enriched: Record<string, any> = { ...raw };
        const missingType = enriched.type === undefined || enriched.type === null || enriched.type === "";
        const missingOptions =
          enriched.optionsJson === undefined ||
          enriched.optionsJson === null ||
          String(enriched.optionsJson).trim() === "";
        if (missingType || missingOptions) {
          try {
            const fallback = await fetchAttributeDetail(raw.attributeId);
            enriched = {
              ...fallback,
              ...enriched,
              attributeId:
                pickField<number>(raw, "attributeId", "AttributeId", "id", "Id") ??
                fallback?.id,
              attributeName:
                pickField<string>(raw, "attributeName", "AttributeName", "name", "Name") ??
                fallback?.name,
              type: enriched.type ?? fallback?.type ?? "",
              typeDisplayName: enriched.typeDisplayName ?? fallback?.typeDisplayName ?? "",
              optionsJson: enriched.optionsJson ?? fallback?.optionsJson ?? null,
            };
          } catch {
            // ignore fallback failure
          }
        }

        const attributeId = pickField<number>(enriched, "attributeId", "AttributeId", "id", "Id");
        if (attributeId == null) continue;
        const attributeName =
          pickField<string>(enriched, "attributeName", "AttributeName", "name", "Name") ?? `Attribute ${attributeId}`;
        const rawOptions = pickField(enriched, "optionsJson", "OptionsJson", "value", "Value", "options", "Options");
        const opts = extractOptions(rawOptions);
        const rawType = pickField(enriched, "type", "Type", "attributeType", "AttributeType");
        const rawTypeDisplay = pickField(
          enriched,
          "typeDisplayName",
          "TypeDisplayName",
          "attributeTypeDisplayName",
          "AttributeTypeDisplayName"
        );
        const Type = detectAttributeType(rawType, rawTypeDisplay, opts.length > 0);
        const required = Boolean(pickField(enriched, "isRequired", "IsRequired"));
        if (required) requiredIds.push(attributeId);

        mapped.push({
          ID: attributeId,
          Name: attributeName,
          Type,
          Value: opts.join("|") || undefined,
        });
      }

      setAttributeDefs(mapped);
      setRequiredAttrIds(requiredIds);
      setForm((prev) => ({
        ...prev,
        categoryId: id,
        attributes: Object.fromEntries(
          mapped.map((a) => {
            if (a.Type === "multiselect") return [a.ID, []];
            if (a.Type === "boolean") return [a.ID, null];
            return [a.ID, ""];
          })
        ),
      }));
    } finally {
      setCatOpen(false);
    }
  };

  const handleSelectProductType = (type: ProductTypeKind) => {
    setForm((prev) => {
      if (prev.productType === type) return prev;
      return {
        ...prev,
        productType: type,
        categoryId: null,
        attributes: {},
        digitalFiles: type === "digital" ? prev.digitalFiles : [],
      };
    });
    setAttributeDefs([]);
    setRequiredAttrIds([]);
  };

  const onAttrChange = (attrId: number, value: AttributeValue) => {
    setForm((f) => ({ ...f, attributes: { ...f.attributes, [attrId]: value } }));
  };

  const onAddPhotos = (files: File[]) => {
    if (!files.length) return;
    const mapped: ProductPhoto[] = files.map((file) => ({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      previewUrl: file.type?.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setForm((f) => ({
      ...f,
      photos: [...f.photos, ...mapped].slice(0, 10),
    }));
  };

  const onRemovePhoto = (id: string) => {
    setForm((f) => {
      const target = f.photos.find((photo) => photo.id === id);
      revokePhotoPreview(target);
      return { ...f, photos: f.photos.filter((photo) => photo.id !== id) };
    });
  };

  const onAddDigitalFiles = (files: File[]) => {
    if (!files.length) return;
    const mapped: DigitalAttachment[] = files.map((file) => ({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }));
    setForm((f) => ({
      ...f,
      digitalFiles: [...f.digitalFiles, ...mapped],
    }));
  };

  const onRemoveDigitalFile = (id: string) => {
    setForm((f) => ({
      ...f,
      digitalFiles: f.digitalFiles.filter((file) => file.id !== id),
    }));
  };

  const uploadMediaFile = async (file: File) => {
    const payload = new FormData();
    payload.append("file", file, file.name || "upload");
    payload.append("category", "products");
    payload.append("isPrivate", "false");
    const res = await fetch("/api/media/upload", {
      method: "POST",
      body: payload,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to upload file.");
    }
    const data = await res.json();
    const url = data?.url ?? extractMediaUrl(data);
    if (!url) {
      throw new Error("Upload succeeded but no URL returned.");
    }
    return url;
  };

  const uploadPrivateFile = async (file: File) => {
    const payload = new FormData();
    payload.append("file", file, file.name || "upload");
    payload.append("category", "digital");
    payload.append("isPrivate", "true");
    const res = await fetch("/api/media/upload", {
      method: "POST",
      body: payload,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to upload secure file.");
    }
    const data = await res.json();
    const mediaId = data?.mediaId || data?.id || data?.Id;
    if (!mediaId) {
      throw new Error("Upload succeeded but no media id returned.");
    }
    return String(mediaId);
  };

  const ensurePhotosUploaded = async (): Promise<ProductPhoto[]> => {
    const uploaded = await Promise.all(
      form.photos.map(async (photo) => {
        if (photo.remoteUrl || !photo.file) return photo;
        const url = await uploadMediaFile(photo.file);
        return { ...photo, remoteUrl: url, file: undefined };
      })
    );
    return uploaded;
  };

  const ensureDigitalFilesUploaded = async (): Promise<DigitalAttachment[]> => {
    if (!form.digitalFiles.length) return [];
    const uploaded = await Promise.all(
      form.digitalFiles.map(async (item) => {
        if (item.mediaId || !item.file) return item;
        const mediaId = await uploadPrivateFile(item.file);
        return { ...item, mediaId, file: undefined };
      })
    );
    return uploaded;
  };

  const canPublish = useMemo(
    () =>
      form.name.trim() &&
      form.categoryId &&
      form.productType &&
      form.price !== "" &&
      Number(form.price) >= 0 &&
      form.quantity !== "" &&
      Number(form.quantity) > 0,
    [form.name, form.categoryId, form.productType, form.price, form.quantity]
  );

  const categoryLabel = useMemo(() => {
    if (!form.productType) return "Select product type to continue";
    if (!form.categoryId) return "Choose a category";
    const path: string[] = [];
    let cur = allCategories.find((c) => c.ID === form.categoryId);
    while (cur) {
      path.unshift(cur.Name);
      cur = cur.ParentCategoryId
        ? allCategories.find((c) => c.ID === cur!.ParentCategoryId)
        : undefined;
    }
    return path.join(" › ");
  }, [form.categoryId, allCategories]);

  const validate = (): string | null => {
    if (!form.name.trim()) return "Please enter product name.";
    if (!form.productType) return "Please choose whether your product is physical or digital.";
    if (!form.categoryId) return "Please choose a category.";
    if (form.price === "" || isNaN(Number(form.price))) return "Please enter a valid price.";
    if (Number(form.price) < 0) return "Price cannot be negative.";
    if (form.quantity === "" || isNaN(Number(form.quantity))) return "Please enter a valid quantity.";
    if (Number(form.quantity) <= 0) return "Quantity must be greater than zero.";
    if (form.photos.length === 0) return "Please add at least one file.";
    if (form.productType === "digital" && form.digitalFiles.length === 0) {
      return "Please attach at least one secure file for digital products.";
    }
    for (const id of requiredAttrIds) {
      const val = form.attributes[id];
      if (val === undefined || val === null) return "Please fill all required attributes.";
      if (Array.isArray(val)) {
        if (val.length === 0) return "Please fill all required attributes.";
      } else {
        if (String(val).trim() === "") return "Please fill all required attributes.";
      }
    }
    return null;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    try {
      const attributeValues = Object.entries(form.attributes)
        .map(([k, v]) => ({ attributeId: Number(k), value: v as any }))
        .filter(({ attributeId, value }) => {
          const isReq = requiredAttrIds.includes(attributeId);
          if (isReq) return true;
          if (value == null) return false;
          if (Array.isArray(value)) return value.length > 0;
          return String(value).trim() !== "";
        });

      const [uploadedPhotos, uploadedDigital] = await Promise.all([
        ensurePhotosUploaded(),
        ensureDigitalFilesUploaded(),
      ]);
      const missingUploads = uploadedPhotos.filter((photo) => !photo.remoteUrl);
      if (missingUploads.length) {
        throw new Error("Failed to upload one or more files. Please try again.");
      }
      const missingProtected = uploadedDigital.filter((file) => !file.mediaId);
      if (missingProtected.length) {
        throw new Error("Failed to upload one or more secure files. Please try again.");
      }
      setForm((prev) => ({ ...prev, photos: uploadedPhotos, digitalFiles: uploadedDigital }));

      const resolvedCurrency = form.currency === "1" ? "USD" : "UAH";

      const res = await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          categoryId: Number(form.categoryId),
          productType: form.productType,
          description: form.description || "",
          price: Number(form.price),
          currency: resolvedCurrency,
          quantity: Number(form.quantity),
          attributeValues,
          mediaFiles: [
            ...uploadedPhotos.map((photo) => ({
              url: photo.remoteUrl ?? "",
              mediaTyp: "image",
            })),
            ...uploadedDigital.map((file) => ({
              url: file.mediaId ?? "",
              mediaTyp: "digital",
            })),
          ],
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create product");
      }
      router.push("/myproducts");
    } catch (e) {
      const anyErr: any = e;
      setError(anyErr?.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateProgress = () => {
    const sections: { filled: boolean }[] = [
      { filled: Boolean(form.photos.length) },
      { filled: Boolean(form.name.trim()) },
      { filled: form.price !== "" && !isNaN(Number(form.price)) && Number(form.price) >= 0 },
      { filled: form.quantity !== "" && !isNaN(Number(form.quantity)) && Number(form.quantity) > 0 },
      { filled: Boolean(form.description.trim()) },
    ];

    if (form.productType === "digital") {
      sections.push({ filled: form.digitalFiles.length > 0 });
    }

    const attributeFilled = attributeDefs.filter((a) => {
      const val = form.attributes[a.ID];
      if (a.Type === "boolean") return val === true || val === false;
      if (Array.isArray(val)) return val.length > 0;
      return val !== "" && val !== undefined && val !== null;
    }).length;

    const attrTotal = attributeDefs.length;
    const attrPercent = attrTotal ? attributeFilled / attrTotal : 1;

    const corePercent = sections.reduce((acc, section) => acc + (section.filled ? 1 : 0), 0) / sections.length;

    const overall = (attrPercent + corePercent) / 2;
    return Math.round(overall * 100);
  };

  return (
    <>
      <form onSubmit={handleCreateSubmit} className="flex flex-col gap-8">
        <div className="sticky top-4 md:top-6 lg:top-10 z-30">
          <ProgressBar value={calculateProgress()} />
        </div>
        <section className="grid grid-cols-12 gap-x-12 gap-y-8 w-full">
          <div className="col-span-12 md:col-span-7">
            <ImageUploader
              files={form.photos}
              onAdd={onAddPhotos}
              onRemove={onRemovePhoto}
            />
            {form.productType === "digital" && (
              <div className="mt-8">
                <label className="block mb-2 text-white text-lg">Digital files</label>
                <p className="text-sm text-white/60 mb-3">
                  Upload the files buyers will receive after purchase. They remain private.
                </p>
                <DigitalFileUploader
                  files={form.digitalFiles}
                  onAdd={onAddDigitalFiles}
                  onRemove={onRemoveDigitalFile}
                />
              </div>
            )}
          </div>

          <div className="col-span-12 md:col-span-5 flex flex-col w-[100%]">
            <InputField
              label="Name"
              type="text"
              placeholder="Enter..."
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              shape="office"
            />

            <div className="mb-4 w-full">
              <label className="block mb-2">Category</label>
              <div className="text-sm text-[var(--fg-muted)] mb-2">
                Product type:{" "}
                <span className="text-white">{productTypeLabel(form.productType)}</span>
              </div>
              <button
                type="button"
                className="w-full bg-[var(--bg-input)] rounded-[15px] px-4 py-2 text-left text-[20px]"
                onClick={() => setCatOpen(true)}
              >
                {categoryLabel}
              </button>
            </div>
          </div>
        </section>

        <section>
          <AttributeFields
            attributes={attributeDefs}
            values={form.attributes}
            onChange={onAttrChange}
          />
        </section>

        <section>
          <label className="block mb-2 ml-0">Description</label>
          <div className="ml-0">
            <Textarea
              placeholder="Tell buyers about the product…"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
        </section>

        {error && (
          <div className="mt-3 text-[var(--danger,#ff6b6b)]">{error}</div>
        )}

        <section className="ml-0">
          <div className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-2xl p-6 max-w-xl">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-5">
                <InputField
                  label="Price"
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  required
                  shape="office"
                />
              </div>
              <div className="col-span-4">
                <label className="block mb-2">Currency</label>
                <div className="relative">
                  <select
                    value={form.currency}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        currency: (e.target.value as Currency) || "0",
                      }))
                    }
                    className="appearance-none w-full bg-[var(--bg-input)] rounded-[15px] px-4 pr-12 py-2 text-[20px] text-white outline-none"
                  >
                    <option value="0">UAH ₴</option>
                    <option value="1">USD $</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white opacity-70">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="col-span-3">
                <InputField
                  label="Quantity"
                  type="number"
                  placeholder="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  required
                  shape="office"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-4 pt-6">
          <div className="flex-1" />
          <div className="flex-1 flex justify-center">
            <Button
              type="submit"
              variant="submit"
              disabled={!canPublish || submitting}
              className="max-w-[240px]"
            >
              {submitting ? "Publishing..." : "Publish"}
            </Button>
          </div>
          <div className="flex-1 flex justify-end">
            <Button
              type="button"
              className="max-w-[160px] bg-[var(--bg-elev-2)] hover:bg-[var(--bg-elev-3)]"
              onClick={() => {
                form.photos.forEach((photo) => revokePhotoPreview(photo));
                setForm({
                  name: "",
                  categoryId: null,
                  productType: null,
                  attributes: {},
                  description: "",
                  price: "",
                  currency: "0",
                  quantity: "",
                  photos: [],
                  digitalFiles: [],
                });
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </form>

      <CategoryModal
        open={catOpen}
        categories={allCategories}
        selectedId={form.categoryId}
        productType={form.productType}
        onSelectType={handleSelectProductType}
        onClose={() => setCatOpen(false)}
        onSelect={onSelectCategory}
      />
    </>
  );
}
