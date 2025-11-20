export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

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
  avatarUrl?: string | null;
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
  form.append("file", file, file.name);
  const res = await fetch(`/api/media/avatar`, {
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
const USER_API_BASE = process.env.NEXT_PUBLIC_USER_API_BASE || "https://loft-shop.pp.ua/api";
export const LOFT_PUBLIC_BASE = process.env.NEXT_PUBLIC_LOFT_PUBLIC_BASE || "https://www.loft-shop.pp.ua";

export type CategoryDto = {
  id: number;
  parentCategoryId?: number | null;
  name: string;
  imageUrl?: string | null;
  status?: string | null;
  type?: number | string | null;
  Type?: number | string | null;
  productType?: number | string | null;
  ProductType?: number | string | null;
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

export type AttributeDetailDto = {
  id: number;
  name: string;
  type?: number | string;
  typeDisplayName?: string | null;
  optionsJson?: string | null;
  status?: number | string | null;
};

export async function fetchCategories(): Promise<CategoryDto[]> {
  const res = await fetch(`${API_BASE}/category`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  return res.json();
}

export async function fetchCategoryAttributes(categoryId: number): Promise<CategoryAttributeFullDto[]> {
  const urls = [
    `${API_BASE}/categories/${categoryId}/attributes`,
    `${API_BASE}/category/${categoryId}/attributes`,
  ];
  let lastError: string | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        return res.json();
      }
      lastError = await res.text();
    } catch (err: any) {
      lastError = err?.message || null;
    }
  }
  throw new Error(lastError || `Failed to fetch attributes for category ${categoryId}`);
}

export async function fetchAttributeDetail(attributeId: number): Promise<AttributeDetailDto> {
  const res = await fetch(`${API_BASE}/attribute/${attributeId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch attribute ${attributeId}`);
  return res.json();
}

export type CartItemDto = {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  price?: number;
  productName?: string | null;
  imageUrl?: string | null;
  categoryId?: number | null;
  category?: CategoryDto | null;
  categoryName?: string | null;
  attributeValues?: ProductAttributeValueDto[] | null;
  addedAt?: string | null;
};

export type CartDto = {
  id: number;
  customerId: number;
  createdAt: string;
  cartItems: CartItemDto[];
};

export async function fetchCartByCustomer(customerId: number): Promise<CartDto | null> {
  const res = await fetch(`/api/cart/customer/${customerId}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addCartItem(customerId: number, productId: number, quantity: number): Promise<CartDto> {
  const res = await fetch(`/api/cart/${customerId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCartItem(customerId: number, productId: number, quantity: number): Promise<CartItemDto> {
  const res = await fetch(`/api/cart/${customerId}/items`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function removeCartItem(customerId: number, productId: number): Promise<void> {
  const res = await fetch(`/api/cart/${customerId}/items/${productId}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 404) throw new Error(await res.text());
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

export type PublicUserDto = {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl: string;
};

export async function fetchProductById(id: number): Promise<ProductDto> {
  const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch product ${id}`);
  return res.json();
}

export async function fetchPublicUserById(id: number): Promise<PublicUserDto> {
  const res = await fetch(`${USER_API_BASE}/users/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch user ${id}`);
  return res.json();
}

export function resolvePublicAssetUrl(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return `${LOFT_PUBLIC_BASE}${normalized}`;
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

// --------- Favorites ----------

export type FavoriteItemDto = {
  id?: number;
  productId?: number;
  product?: ProductDto | null;
};

export async function fetchFavoriteItems(): Promise<number[]> {
  const res = await fetch(`/api/favorite`, { cache: "no-store" });
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok) {
    throw new ApiError((await res.text()) || "Failed to load favorites", res.status);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data.map((entry) => Number(entry)).filter((id) => Number.isFinite(id));
  if (data && Array.isArray((data as any).productIds)) {
    return (data as any).productIds.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id));
  }
  return [];
}

async function mutateFavorite(productId: number, method: "POST" | "DELETE"): Promise<void> {
  if (!productId) {
    throw new Error("productId is required");
  }
  const res = await fetch(`/api/favorite/${productId}`, { method });
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok) {
    throw new ApiError((await res.text()) || "Favorite request failed", res.status);
  }
}

export async function addFavoriteProduct(productId: number) {
  return mutateFavorite(productId, "POST");
}

export async function removeFavoriteProduct(productId: number) {
  return mutateFavorite(productId, "DELETE");
}
