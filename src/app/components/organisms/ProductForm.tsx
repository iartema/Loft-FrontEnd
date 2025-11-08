"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "../molecules/InputField";
import Button from "../atoms/Button";
import Textarea from "../atoms/TextArea";
import ProgressBar from "../molecules/ProgressBar";
import CategoryModal from "../molecules/CategoryModal";
import AttributeFields from "../molecules/AttributeFields";
import ImageUploader from "../molecules/ImageUploader";
import { fetchCategories, fetchCategoryAttributes } from "../lib/api";
import type { CategoryDto, CategoryAttributeFullDto } from "../lib/api";
import type { AttributeDef } from "../molecules/AttributeFields";

type Currency = "USD" | "EUR" | "GBP";
type AttributeValue = string | number | boolean | string[];

interface ProductFormState {
  name: string;
  categoryId: number | null;
  attributes: Record<number, AttributeValue>;
  description: string;
  price: string;
  currency: Currency;
  photos: string[];
}

export default function ProductForm() {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState>({
    name: "",
    categoryId: null,
    attributes: {},
    description: "",
    price: "",
    currency: "USD",
    photos: [],
  });

  const [attributeDefs, setAttributeDefs] = useState<AttributeDef[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<
    { ID: number; Name: string; ParentCategoryId: number | null }[]
  >([]);
  const [requiredAttrIds, setRequiredAttrIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const flatten = (
      list: CategoryDto[],
      acc: { ID: number; Name: string; ParentCategoryId: number | null }[] = []
    ) => {
      for (const c of list) {
        acc.push({
          ID: c.id,
          Name: c.name,
          ParentCategoryId: c.parentCategoryId ?? null,
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

  const onSelectCategory = async (id: number) => {
    try {
      const full: CategoryAttributeFullDto[] = await fetchCategoryAttributes(id);

      const mapped: AttributeDef[] = full
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((a) => {
          const opts = a.optionsJson ? safeParseOptions(a.optionsJson) : [];

          // FIX: convert "2" -> 2 (type may come as string)
          const tNum = parseInt(a.type as unknown as string, 10);
          let Type: AttributeDef["Type"] = "text";

          if (opts.length > 0) {
            // if it has options and type 2 → multiselect
            Type = tNum === 2 ? "multiselect" : "select";
          } else {
            if (tNum === 1) Type = "number"; // numeric type
            else if (tNum === 2) Type = "multiselect"; // list type, no options
            else Type = "text"; // fallback string
          }

          return {
            ID: a.attributeId,
            Name: a.attributeName,
            Type,
            Value: opts.join("|") || undefined,
          } as AttributeDef;
        });

      setAttributeDefs(mapped);
      setRequiredAttrIds(full.filter((f) => f.isRequired).map((f) => f.attributeId));
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

  function safeParseOptions(json: string): string[] {
    try {
      const arr = JSON.parse(json);
      return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
    } catch {
      return [];
    }
  }

  const onAttrChange = (attrId: number, value: AttributeValue) => {
    setForm((f) => ({ ...f, attributes: { ...f.attributes, [attrId]: value } }));
  };

  const onAddPhotos = (urls: string[]) => {
    setForm((f) => ({ ...f, photos: [...f.photos, ...urls].slice(0, 10) }));
  };

  const onRemovePhoto = (idx: number) =>
    setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));

  const canPublish = useMemo(
    () =>
      form.name.trim() &&
      form.categoryId &&
      form.price !== "" &&
      Number(form.price) >= 0,
    [form.name, form.categoryId, form.price]
  );

  const categoryLabel = useMemo(() => {
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
    if (!form.categoryId) return "Please choose a category.";
    if (form.price === "" || isNaN(Number(form.price))) return "Please enter a valid price.";
    if (Number(form.price) < 0) return "Price cannot be negative.";
    if (form.photos.length === 0) return "Please add at least one image.";
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

      const res = await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          categoryId: Number(form.categoryId),
          description: form.description || "",
          price: Number(form.price),
          currency: form.currency,
          quantity: 1,
          attributeValues,
          mediaFiles: form.photos.map((url) => ({ url })),
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
    if (!attributeDefs.length) return 0;

    const total = attributeDefs.length;
    const filled = attributeDefs.filter((a) => {
      const val = form.attributes[a.ID];
      if (a.Type === "boolean") return val === true || val === false;
      if (Array.isArray(val)) return val.length > 0;
      return val !== "" && val !== undefined && val !== null;
    }).length;

    return Math.round((filled / total) * 100);
  };

  return (
    <>
      <form onSubmit={handleCreateSubmit} className="flex flex-col gap-8">
        <section className="grid grid-cols-12 gap-x-12 gap-y-8 w-full">
          <div className="col-span-12 md:col-span-7">
            <ImageUploader
              photos={form.photos}
              onAdd={onAddPhotos}
              onRemove={onRemovePhoto}
            />
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

        <ProgressBar value={calculateProgress()} />

        {error && (
          <div className="mt-3 text-[var(--danger,#ff6b6b)]">{error}</div>
        )}

        <section className="ml-0">
          <div className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-2xl p-6 max-w-xl">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-7">
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
              <div className="col-span-5">
                <label className="block mb-2">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      currency: e.target.value as Currency,
                    }))
                  }
                  className="w-full bg-[var(--bg-input)] rounded-[15px] px-4 py-2 text-[20px] text-white outline-none"
                >
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                  <option value="GBP">GBP £</option>
                </select>
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
              onClick={() =>
                setForm({
                  name: "",
                  categoryId: null,
                  attributes: {},
                  description: "",
                  price: "",
                  currency: "USD",
                  photos: [],
                })
              }
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
        onClose={() => setCatOpen(false)}
        onSelect={onSelectCategory}
      />
    </>
  );
}
