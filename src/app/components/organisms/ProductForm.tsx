"use client";

import React, { useEffect, useMemo, useState } from "react";
// import Divider from "../atoms/Divider";
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
  const [allCategories, setAllCategories] = useState<{ ID: number; Name: string; ParentCategoryId: number | null }[]>([]);

  
    useEffect(() => {
    const flatten = (list: CategoryDto[], acc: { ID: number; Name: string; ParentCategoryId: number | null }[] = []) => {
      for (const c of list) {
        acc.push({ ID: c.id, Name: c.name, ParentCategoryId: c.parentCategoryId ?? null });
        if (c.subCategories && c.subCategories.length) flatten(c.subCategories, acc);
      }
      return acc;
    };
    fetchCategories().then((cats) => setAllCategories(flatten(cats))).catch(() => setAllCategories([]));
  }, []);

  const onSelectCategory = async (id: number) => {
    try {
      const full: CategoryAttributeFullDto[] = await fetchCategoryAttributes(id);
      const mapped: AttributeDef[] = full
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((a) => {
          const opts = a.optionsJson ? safeParseOptions(a.optionsJson) : [];
          const lower = a.attributeName.toLowerCase();
          let Type: AttributeDef["Type"] = "text";
          const t: unknown = a.type as unknown;
          if (typeof t === "number") {
            // Backend enum AttributeType: 0=String, 1=Number, 2=List
            if (t === 1) Type = "number";
            else if (t === 2) Type = "select";
            else Type = "text";
          } else {
            const ts = String(a.type).toLowerCase();
            if (ts === "number") Type = "number";
            else if (ts === "list") Type = "select";
          }
          if (lower === "color" || lower === "colour") Type = "color";
          return { ID: a.attributeId, Name: a.attributeName, Type, Value: opts.join("|") || undefined } as AttributeDef;
        });
      setAttributeDefs(mapped);
      setForm((prev) => ({
        ...prev,
        categoryId: id,
        attributes: Object.fromEntries(
          mapped.map((a) => {
            if (a.Type === "multiselect" || a.Type === "color") return [a.ID, []];
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
    () => form.name.trim() && form.categoryId && form.price !== "" && Number(form.price) >= 0,
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
  }, [form.categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      Name: form.name,
      Price: Number(form.price),
      Currency: form.currency,
      ID_Category: form.categoryId,
      Attributes: attributeDefs.map((def) => ({
        ID: def.ID,
        Name: def.Name,
        Type: def.Type,
        Value: form.attributes[def.ID],
      })),
      Photos: form.photos,
      Description: form.description,
    };
    console.log("Create product payload:", payload);
    alert("Check console for payload 👍");
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <section className="grid grid-cols-12 gap-x-12 gap-y-8 w-full">
          <div className="col-span-12 md:col-span-7">
            <ImageUploader photos={form.photos} onAdd={onAddPhotos} onRemove={onRemovePhoto} />
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

        {/* <Divider text="Attributes" /> */}

        <section>
          <AttributeFields attributes={attributeDefs} values={form.attributes} onChange={onAttrChange} />
        </section>

        <section>
          <label className="block mb-2 ml-0">Description</label>
          <div className="ml-0">
            <Textarea
              placeholder="Tell buyers about the product…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </section>

        {/* <Divider text="Pricing" /> */}

        <ProgressBar value={calculateProgress()} />

        <section className="ml-0">
          <div className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-2xl p-6 max-w-xl">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-7">
                <InputField
                  label="Price"
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                  shape="office"
                />
              </div>
              <div className="col-span-5">
                <label className="block mb-2">Currency</label>
                <select
                  value={form.currency}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as any }))}
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
            <Button type="submit" variant="submit" disabled={!canPublish} className="max-w-[240px]">
              Publish
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





