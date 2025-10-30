export type AttributeType = "text" | "number" | "select" | "multiselect" | "boolean" | "color";

export interface Attribute {
  ID: number;
  Name: string;
  Type: AttributeType;
  Value: string;       // for select/multiselect, pipe-separated: "Red|Blue"
  Name_Value: string;
  Status: string;
  ID_Category: number | null;
  ID_Product?: number | null;
}

export interface Category {
  ID: number;
  Name: string;
  Status: string;
  ParentCategoryId: number | null;
}

export const mockCategories: Category[] = [
  { ID: 1, Name: "Shoes", Status: "active", ParentCategoryId: null },
  { ID: 2, Name: "Sneakers", Status: "active", ParentCategoryId: 1 },
  { ID: 3, Name: "High Tops", Status: "active", ParentCategoryId: 2 },
  { ID: 4, Name: "Boots", Status: "active", ParentCategoryId: 1 },
  { ID: 10, Name: "Clothing", Status: "active", ParentCategoryId: null },
  { ID: 11, Name: "T-Shirts", Status: "active", ParentCategoryId: 10 },
  { ID: 12, Name: "Hoodies", Status: "active", ParentCategoryId: 10 },
];

const attrsByCategory: Record<number, Attribute[]> = {
  3: [
    { ID: 101, Name: "Color", Type: "select", Value: "Red|Blue|Black|White", Name_Value: "", Status: "active", ID_Category: 3 },
    { ID: 102, Name: "Size (EU)", Type: "select", Value: "38|39|40|41|42|43|44|45", Name_Value: "", Status: "active", ID_Category: 3 },
    { ID: 103, Name: "Material", Type: "text", Value: "", Name_Value: "", Status: "active", ID_Category: 3 },
    { ID: 104, Name: "Limited Edition", Type: "boolean", Value: "", Name_Value: "", Status: "active", ID_Category: 3 },
  ],
  11: [
    { ID: 201, Name: "Size", Type: "select", Value: "XS|S|M|L|XL|XXL", Name_Value: "", Status: "active", ID_Category: 11 },
    { ID: 202, Name: "Color", Type: "multiselect", Value: "Black|White|Blue|Red|Green", Name_Value: "", Status: "active", ID_Category: 11 },
    { ID: 203, Name: "Fabric", Type: "text", Value: "", Name_Value: "", Status: "active", ID_Category: 11 },
  ],
  12: [
    { ID: 301, Name: "Size", Type: "select", Value: "S|M|L|XL", Name_Value: "", Status: "active", ID_Category: 12 },
    { ID: 302, Name: "Color", Type: "select", Value: "Black|Grey|Navy", Name_Value: "", Status: "active", ID_Category: 12 },
    { ID: 303, Name: "Has zipper", Type: "boolean", Value: "", Name_Value: "", Status: "active", ID_Category: 12 },
  ],
};

export function mockFetchAttributesByCategory(categoryId: number | null) {
  if (!categoryId) return [];
  return attrsByCategory[categoryId] ?? [];
}
