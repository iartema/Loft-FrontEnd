export type ID = number;

export interface Category {
  ID: ID;
  Name: string;
  Status: "active" | "archived";
  ParentCategoryId: ID | null;
}

export interface Product {
  ID: ID;
  Name: string;
  Type: "physical" | "digital";
  Price: number;
  Currency: "USD" | "EUR" | "GBP";
  Status: "active" | "draft" | "archived";
  DateAdded: string;
  ID_Category: ID;
  ID_User: ID;
  Views?: number;
}

export interface Image {
  ID: ID;
  Url: string;
  Status: "active" | "archived";
  ID_Product: ID;
}

export type AttributeType = "text" | "number" | "select" | "multiselect" | "boolean" | "color";

export interface Attribute {
  ID: ID;
  Name: string;
  Type: AttributeType;
  Value: string;       // For select/multiselect use pipe-separated values, e.g. "Red|Blue"
  Name_Value: string;  // Optional label for Value, can stay ""
  Status: "active" | "archived";
  ID_Category: ID | null;
  ID_Product: ID | null;
}

export interface User {
  ID: ID;
  Username: string;
  Email: string;
  PasswordHash: string;
  Role: "user" | "admin" | "seller";
}

export interface Comment {
  ID: ID;
  UserId: ID;
  ProductId: ID;
  Content: string;
  DatePosted: string;  // ISO datetime
  Status: "visible" | "hidden";
  Likes?: number;
  Dislikes?: number;
}

const categories: Category[] = [
  { ID: 1, Name: "Shoes", Status: "active", ParentCategoryId: null },
  { ID: 2, Name: "Sneakers", Status: "active", ParentCategoryId: 1 },
  { ID: 3, Name: "High Tops", Status: "active", ParentCategoryId: 2 },
  { ID: 10, Name: "Clothing", Status: "active", ParentCategoryId: null },
];

const users: User[] = [
  { ID: 1, Username: "lorem", Email: "lorem@example.com", PasswordHash: "x", Role: "seller" },
  { ID: 2, Username: "kiel",  Email: "kiel@example.com",  PasswordHash: "y", Role: "user"   },
];

const products: Product[] = [
  {
    ID: 101,
    Name: "Red High-Top Sneakers",
    Type: "physical",
    Price: 200,
    Currency: "USD",
    Status: "active",
    DateAdded: "2025-03-01T10:00:00Z",
    ID_Category: 3,
    ID_User: 1,
    Views: 122,
  },
  {
    ID: 102,
    Name: "Black High-Top Sneakers",
    Type: "physical",
    Price: 210,
    Currency: "USD",
    Status: "active",
    DateAdded: "2025-03-05T12:00:00Z",
    ID_Category: 3,
    ID_User: 1,
    Views: 85,
  },
];

const images: Image[] = [
  { ID: 1001, Url: "/mock/shoes-red-1.jpg", Status: "active", ID_Product: 101 },
  { ID: 1002, Url: "/mock/shoes-red-2.jpg", Status: "active", ID_Product: 101 },
  { ID: 1003, Url: "/mock/shoes-red-3.jpg", Status: "active", ID_Product: 101 },
  { ID: 1004, Url: "/mock/shoes-red-4.jpg", Status: "active", ID_Product: 101 },
  { ID: 1005, Url: "/mock/shoes-red-5.jpg", Status: "active", ID_Product: 101 },
  { ID: 1011, Url: "/mock/shoes-black-1.jpg", Status: "active", ID_Product: 102 },
  { ID: 1012, Url: "/mock/shoes-black-2.jpg", Status: "active", ID_Product: 102 },
];

const categoryAttributes: Attribute[] = [
  { ID: 301, Name: "Color",          Type: "select",      Value: "Red|Black|White", Name_Value: "", Status: "active", ID_Category: 3, ID_Product: null },
  { ID: 302, Name: "Size (EU)",      Type: "select",      Value: "38|39|40|41|42|43|44|45", Name_Value: "", Status: "active", ID_Category: 3, ID_Product: null },
  { ID: 303, Name: "Material",       Type: "text",        Value: "", Name_Value: "", Status: "active", ID_Category: 3, ID_Product: null },
  { ID: 304, Name: "Limited Edition",Type: "boolean",     Value: "", Name_Value: "", Status: "active", ID_Category: 3, ID_Product: null },
  { ID: 305, Name: "Accent Colors",  Type: "multiselect", Value: "Black|White|Grey|Red", Name_Value: "", Status: "active", ID_Category: 3, ID_Product: null },
];

const productAttributes: Attribute[] = [
  { ID: 401, Name: "Color",          Type: "select",      Value: "Red",    Name_Value: "", Status: "active", ID_Category: null, ID_Product: 101 },
  { ID: 402, Name: "Size (EU)",      Type: "select",      Value: "42",     Name_Value: "", Status: "active", ID_Category: null, ID_Product: 101 },
  { ID: 403, Name: "Material",       Type: "text",        Value: "Canvas", Name_Value: "", Status: "active", ID_Category: null, ID_Product: 101 },
  { ID: 404, Name: "Limited Edition",Type: "boolean",     Value: "false",  Name_Value: "", Status: "active", ID_Category: null, ID_Product: 101 },
  { ID: 405, Name: "Accent Colors",  Type: "multiselect", Value: "White|Black", Name_Value: "", Status: "active", ID_Category: null, ID_Product: 101 },
  { ID: 411, Name: "Color",          Type: "select",      Value: "Black",  Name_Value: "", Status: "active", ID_Category: null, ID_Product: 102 },
  { ID: 412, Name: "Size (EU)",      Type: "select",      Value: "43",     Name_Value: "", Status: "active", ID_Category: null, ID_Product: 102 },
  { ID: 413, Name: "Material",       Type: "text",        Value: "Leather",Name_Value: "", Status: "active", ID_Category: null, ID_Product: 102 },
  { ID: 414, Name: "Limited Edition",Type: "boolean",     Value: "true",   Name_Value: "", Status: "active", ID_Category: null, ID_Product: 102 },
];

const comments: Comment[] = [
  { ID: 1, UserId: 2, ProductId: 101, Content: "Arrived safely, looks great!", DatePosted: "2025-03-10T09:00:00Z", Status: "visible", Likes: 6, Dislikes: 0 },
  { ID: 2, UserId: 2, ProductId: 101, Content: "Comfortable and true to size.", DatePosted: "2025-03-12T12:45:00Z", Status: "visible", Likes: 5, Dislikes: 1 },
  { ID: 3, UserId: 2, ProductId: 101, Content: "Color is vibrant.", DatePosted: "2025-03-14T18:22:00Z", Status: "visible", Likes: 3, Dislikes: 0 },
];


const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

export const currencySymbol: Record<Product["Currency"], string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function getCategoryPath(id: ID): string[] {
  const path: string[] = [];
  let cur = categories.find((c) => c.ID === id) ?? null;
  while (cur) {
    path.unshift(cur.Name);
    cur = cur.ParentCategoryId ? categories.find((c) => c!.ID === cur!.ParentCategoryId) ?? null : null;
  }
  return path;
}


export async function fetchProductById(id: ID): Promise<Product | undefined> {
  await delay();
  return products.find((p) => p.ID === id);
}

export async function fetchImagesByProduct(id: ID): Promise<Image[]> {
  await delay();
  return images.filter((img) => img.ID_Product === id && img.Status === "active");
}

export async function fetchUserById(id: ID): Promise<User | undefined> {
  await delay();
  return users.find((u) => u.ID === id);
}

export async function fetchCategoryById(id: ID): Promise<Category | undefined> {
  await delay();
  return categories.find((c) => c.ID === id);
}

export async function fetchAttributesByCategory(categoryId: ID): Promise<Attribute[]> {
  await delay();
  return categoryAttributes.filter((a) => a.ID_Category === categoryId && a.Status === "active");
}

export async function fetchAttributesByProduct(productId: ID): Promise<Attribute[]> {
  await delay();
  return productAttributes.filter((a) => a.ID_Product === productId && a.Status === "active");
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function fetchCommentsByProduct(
  productId: ID,
  page = 1,
  pageSize = 5
): Promise<Paged<Comment>> {
  await delay();
  const all = comments.filter((c) => c.ProductId === productId && c.Status === "visible");
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);
  return {
    items,
    total: all.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
  };
}

export async function fetchSimilarProducts(productId: ID, limit = 4): Promise<Product[]> {
  await delay();
  const base = products.find((p) => p.ID === productId);
  if (!base) return [];
  return products
    .filter((p) => p.ID !== productId && p.ID_Category === base.ID_Category && p.Status === "active")
    .slice(0, limit);
}

export interface ProductFull {
  product: Product;
  seller: User | undefined;
  category: Category | undefined;
  categoryPath: string[];
  images: Image[];
  attributesRequired: Attribute[];
  attributesValues: Attribute[];
  comments: Paged<Comment>;
}

export async function getProductFull(id: ID): Promise<ProductFull | undefined> {
  const product = await fetchProductById(id);
  if (!product) return undefined;

  const [seller, category, imgs, attrsCat, attrsProd, cmts] = await Promise.all([
    fetchUserById(product.ID_User),
    fetchCategoryById(product.ID_Category),
    fetchImagesByProduct(product.ID),
    fetchAttributesByCategory(product.ID_Category),
    fetchAttributesByProduct(product.ID),
    fetchCommentsByProduct(product.ID, 1, 5),
  ]);

  return {
    product,
    seller,
    category,
    categoryPath: getCategoryPath(product.ID_Category),
    images: imgs,
    attributesRequired: attrsCat,
    attributesValues: attrsProd,
    comments: cmts,
  };
}


export async function incrementProductViews(productId: ID): Promise<void> {
  await delay(60);
  const p = products.find((x) => x.ID === productId);
  if (p) p.Views = (p.Views ?? 0) + 1;
}

export async function addComment(productId: ID, userId: ID, content: string): Promise<Comment> {
  await delay();
  const c: Comment = {
    ID: Math.max(0, ...comments.map((x) => x.ID)) + 1,
    UserId: userId,
    ProductId: productId,
    Content: content,
    DatePosted: "2025-01-01T00:00:00Z",
    Status: "visible",
    Likes: 0,
    Dislikes: 0,
  };
  comments.unshift(c);
  return c;
}

// Lightweight product search mock until backend is ready
export interface SearchFilters {
  query?: string;
  categoryId?: ID | null;
  priceMin?: number | null;
  priceMax?: number | null;
  color?: string | null;
}

export async function searchProducts(filters: SearchFilters = {}): Promise<Product[]> {
  await delay(80);
  const { query, categoryId, priceMin, priceMax, color } = filters;

  // Helper: map productId -> attribute map for quick lookup
  const attrByProduct = new Map<ID, Record<string, string>>();
  for (const a of productAttributes) {
    if (a.ID_Product == null) continue;
    if (!attrByProduct.has(a.ID_Product)) attrByProduct.set(a.ID_Product, {});
    attrByProduct.get(a.ID_Product)![a.Name.toLowerCase()] = a.Value;
  }

  let result = products.filter((p) => p.Status === "active");

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    result = result.filter((p) => p.Name.toLowerCase().includes(q));
  }

  if (categoryId) {
    result = result.filter((p) => p.ID_Category === categoryId);
  }

  if (priceMin != null) {
    result = result.filter((p) => p.Price >= priceMin);
  }
  if (priceMax != null) {
    result = result.filter((p) => p.Price <= priceMax);
  }

  if (color && color.trim()) {
    const c = color.trim().toLowerCase();
    result = result.filter((p) => (attrByProduct.get(p.ID)?.["color"] ?? "").toLowerCase() === c);
  }

  return result;
}
