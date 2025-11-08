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

export async function logout() {
  // Clear auth cookies via internal API and ignore response shape
  await fetch(`/api/auth/logout`, { method: "POST" });
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

// --------- External Product API ---------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

export type CategoryDto = {
  id: number;
  parentCategoryId?: number | null;
  name: string;
  imageUrl?: string | null;
  status?: string | null;
  subCategories?: CategoryDto[] | null;
};

export type CategoryAttributeFullDto = {
  attributeId: number;
  attributeName: string;
  type: string; // AttributeType enum numeric
  typeDisplayName: string;
  optionsJson?: string | null;
  isRequired: boolean;
  orderIndex: number;
};

export async function fetchCategories(): Promise<CategoryDto[]> {
  const res = await fetch(`${API_BASE}/category`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  return res.json();
}

export async function fetchCategoryAttributes(categoryId: number): Promise<CategoryAttributeFullDto[]> {
  const res = await fetch(`${API_BASE}/category/${categoryId}/attributes`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch attributes for category ${categoryId}`);
  return res.json();
}

export type CreateProductPayload = {
  categoryId: number;
  name: string;
  description?: string;
  type: string; // ProductType
  price: number;
  currency: string; // CurrencyType
  quantity: number;
  attributeValues?: { attributeId: number; value: string }[];
  mediaFiles?: { url: string; mediaTyp: string }[];
};

export async function createProductExternal(payload: CreateProductPayload) {
  const res = await fetch(`${API_BASE}/products/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type MediaFileDto = { url: string; mediaTyp: string };
export type ProductAttributeValueDto = { attributeId: number; value: string };
export type ProductDto = {
  id: number;
  idUser?: number | null;
  categoryId: number;
  name: string;
  description?: string | null;
  type: string;
  price: number;
  currency: string;
  quantity: number;
  viewCount?: number | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  attributeValues?: ProductAttributeValueDto[];
  mediaFiles?: MediaFileDto[];
};

export async function fetchProductById(id: number): Promise<ProductDto> {
  const res = await fetch(`${API_BASE}/products/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch product ${id}`);
  return res.json();
}

// --------- Product search/filter ---------

export type ProductAttributeFilterDto = {
  attributeId: number;
  value: string;
};

export type ProductFilterDto = {
  categoryId?: number;
  sellerId?: number;
  minPrice?: number;
  maxPrice?: number;
  attributeFilters?: ProductAttributeFilterDto[];
  page?: number;
  pageSize?: number;
};

export async function searchProductsExternal(filter: ProductFilterDto): Promise<ProductDto[]> {
  // Backend expects PascalCase keys matching ProductFilterDto
  const payload: any = {
    CategoryId: filter.categoryId ?? undefined,
    SellerId: filter.sellerId ?? undefined,
    MinPrice: filter.minPrice ?? undefined,
    MaxPrice: filter.maxPrice ?? undefined,
    Page: filter.page ?? 1,
    PageSize: filter.pageSize ?? 20,
  };
  if (filter.attributeFilters && filter.attributeFilters.length) {
    payload.AttributeFilters = filter.attributeFilters.map((a) => ({
      AttributeId: a.attributeId,
      Value: a.value,
    }));
  }

  const res = await fetch(`${API_BASE}/products/filter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  if (Array.isArray(data)) return data as ProductDto[];
  if (data && Array.isArray(data.items)) return data.items as ProductDto[];
  return [];
}
