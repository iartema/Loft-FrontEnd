export type ProductTypeKind = "physical" | "digital";

export const PRODUCT_TYPE_OPTIONS: { value: ProductTypeKind; label: string }[] = [
  { value: "physical", label: "Physical product" },
  { value: "digital", label: "Digital product" },
];

export function normalizeProductType(value: unknown): ProductTypeKind | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    if (value === 0) return "physical";
    if (value === 1) return "digital";
    return undefined;
  }
  const str = String(value).trim().toLowerCase();
  if (!str) return undefined;
  if (str === "0" || str.startsWith("phys")) return "physical";
  if (str === "1" || str.startsWith("dig")) return "digital";
  return undefined;
}

export function productTypeLabel(
  type: ProductTypeKind | null | undefined,
  t?: (key: string) => string
): string {
  if (!type) return t ? t("product.categoryModal.notSelected") : "Not selected";
  if (type === "physical") return t ? t("product.categoryModal.physical") : "Physical product";
  return t ? t("product.categoryModal.digital") : "Digital product";
}

export function productTypeToEnumValue(type: ProductTypeKind | null | undefined): number {
  if (!type) return 0;
  return type === "digital" ? 1 : 0;
}
