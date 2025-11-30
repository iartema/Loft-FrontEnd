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

// --------- Shipping addresses ----------
export type ShippingAddressDto = {
  id: number;
  customerId: number;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  recipientName?: string | null;
  isDefault?: boolean;
  createdAt?: string | null;
};

export type ShippingAddressCreatePayload = {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  recipientName?: string | null;
  isDefault?: boolean;
};

export type ShippingAddressUpdatePayload = ShippingAddressCreatePayload & {
  isDefault?: boolean | null;
};

const normalizeShippingAddress = (data: any): ShippingAddressDto => ({
  id: Number(data?.id ?? data?.Id ?? 0),
  customerId: Number(data?.customerId ?? data?.CustomerId ?? 0),
  address: data?.address ?? data?.Address ?? "",
  city: data?.city ?? data?.City ?? "",
  postalCode: data?.postalCode ?? data?.PostalCode ?? "",
  country: data?.country ?? data?.Country ?? "",
  recipientName: data?.recipientName ?? data?.RecipientName ?? null,
  isDefault: data?.isDefault ?? data?.IsDefault ?? false,
  createdAt: data?.createdAt ?? data?.CreatedAt ?? null,
});

export async function fetchMyDefaultShippingAddress(): Promise<ShippingAddressDto | null> {
  const res = await fetch(`/api/shipping-addresses/default`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok) {
    throw new Error((await res.text()) || "Failed to load shipping address");
  }
  const data = await res.json();
  return normalizeShippingAddress(data);
}

export async function createShippingAddress(payload: ShippingAddressCreatePayload): Promise<ShippingAddressDto> {
  const res = await fetch(`/api/shipping-addresses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok) {
    throw new Error((await res.text()) || "Failed to create shipping address");
  }
  return normalizeShippingAddress(await res.json());
}

export async function updateShippingAddress(
  id: number,
  payload: ShippingAddressUpdatePayload
): Promise<ShippingAddressDto> {
  const res = await fetch(`/api/shipping-addresses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok) {
    throw new Error((await res.text()) || "Failed to update shipping address");
  }
  return normalizeShippingAddress(await res.json());
}

// --------- External Product API ---------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";
export const LOFT_PUBLIC_BASE = process.env.NEXT_PUBLIC_LOFT_PUBLIC_BASE || "https://www.loft-shop.pp.ua";
import { getFirstPublicImageUrl, resolveMediaUrl } from "../../lib/media";

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

export type CartItemMeta = {
  productName?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
};

export async function fetchCartByCustomer(customerId: number): Promise<CartDto | null> {
  const res = await fetch(`/api/cart/customer/${customerId}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addCartItem(
  customerId: number,
  productId: number,
  quantity: number,
  meta?: CartItemMeta
): Promise<CartDto> {
  let payload: any = {
    productId,
    quantity,
    productName: meta?.productName,
    price: meta?.price,
    imageUrl: meta?.imageUrl,
    categoryId: meta?.categoryId,
    categoryName: meta?.categoryName,
  };

  // If critical fields are missing, fetch product details to enrich
  if (!payload.productName || payload.price === undefined || payload.imageUrl === undefined || payload.categoryId === undefined) {
    try {
      const product = await fetchProductById(productId);
      payload = {
        ...payload,
        productName: payload.productName ?? product.name,
        price: payload.price ?? product.price,
        imageUrl: payload.imageUrl ?? resolveMediaUrl(getFirstPublicImageUrl(product.mediaFiles)),
        categoryId: payload.categoryId ?? product.categoryId,
      };
    } catch {
      // if fetch fails, proceed with what we have
    }
  }

  try {
    console.error("[lib/api addCartItem] request", {
      customerId,
      productId,
      quantity,
      meta,
      payload,
    });
  } catch {
    // ignore logging failures
  }

  const res = await fetch(`/api/cart/${customerId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  try {
    console.error("[lib/api addCartItem] response", {
      status: res.status,
      ok: res.ok,
    });
  } catch {
    // ignore logging failures
  }

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
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
};

// --------- Orders & Payments ----------

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | string;
export type PaymentMethod = { value: number; name: string };
export type OrderItemDto = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  productName?: string | null;
  imageUrl?: string | null;
};

export type OrderDto = {
  id: number;
  customerId: number;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  updatedDate?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  shippingAddressId?: number | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  shippingRecipientName?: string | null;
  orderItems?: OrderItemDto[] | null;
};

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await fetch(`/api/payments/methods`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createOrderFromCart(customerId: number): Promise<{ order: OrderDto; paymentMethods: PaymentMethod[] }> {
  const res = await fetch(`/api/orders/checkout/${customerId}`, { method: "POST" });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && data.message) || text || "Failed to create order");
  const order = data?.Order ?? data?.order ?? data;
  const methods = data?.PaymentMethods ?? data?.paymentMethods ?? [];
  return { order, paymentMethods: methods };
}

export async function fetchOrdersByCustomer(customerId: number): Promise<OrderDto[]> {
  const res = await fetch(`/api/orders/customer/${customerId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchOrderById(id: number): Promise<OrderDto> {
  const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type CreatePaymentPayload = {
  orderId: number;
  amount: number;
  method: number;
};

export async function createPayment(payload: CreatePaymentPayload) {
  const res = await fetch(`/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function confirmPayment(paymentId: number) {
  const res = await fetch(`/api/payments/${paymentId}/confirm`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchProductById(id: number): Promise<ProductDto> {
  const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch product ${id}`);
  return res.json();
}

export async function fetchMyProducts(): Promise<ProductDto[]> {
  const res = await fetch(`/api/products/myproducts`, { cache: "no-store" });
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok) throw new Error((await res.text()) || "Failed to load my products");
  return res.json();
}

export async function fetchPublicUserById(id: number): Promise<PublicUserDto> {
  const res = await fetch(`/api/users/${id}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
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
  search?: string;
  sellerId?: number;
  minPrice?: number;
  maxPrice?: number;
  attributeFilters?: ProductAttributeFilterDto[];
  page?: number;
  pageSize?: number;
};

export type SearchProductsResponse = {
  items: ProductDto[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

export async function searchProductsExternal(filter: ProductFilterDto): Promise<SearchProductsResponse> {
  // Backend expects PascalCase keys matching ProductFilterDto
  const payload: any = {
    CategoryId: filter.categoryId ?? undefined,
    // Search is kept for backward compatibility; ignored by newer backend if unsupported
    Search: filter.search ?? undefined,
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

  // Normalize different backend shapes (array fallback vs paged result)
  if (Array.isArray(data)) {
    return {
      items: data as ProductDto[],
      totalCount: data.length,
      totalPages: 1,
      page: payload.Page || 1,
      pageSize: payload.PageSize || 20,
    };
  }

  const items = (data?.items ?? data?.Items ?? []) as ProductDto[];
  const totalCount = Number(data?.totalCount ?? data?.TotalCount ?? items.length ?? 0);
  const totalPages = Number(data?.totalPages ?? data?.TotalPages ?? 1);
  const page = Number(data?.page ?? data?.Page ?? payload.Page ?? 1);
  const pageSize = Number(data?.pageSize ?? data?.PageSize ?? payload.PageSize ?? 20);

  return {
    items,
    totalCount,
    totalPages: Math.max(1, totalPages || Math.ceil(totalCount / Math.max(1, pageSize))),
    page,
    pageSize,
  };
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

// --------- Chat ----------

export type ChatMessageDto = {
  id: number;
  senderId: number;
  recipientId: number;
  messageText: string;
  fileUrl?: string | null;
  isRead: boolean;
  sentAt: string;
};

export type ChatDto = {
  chatId: number;
  user1Id: number;
  user2Id: number;
  createdAt: string;
  lastMessage?: ChatMessageDto | null;
};

export async function fetchMyChats(): Promise<ChatDto[]> {
  const res = await fetch(`/api/chat/my-chats`, { cache: "no-store" });
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok) {
    throw new ApiError((await res.text()) || "Failed to load chats", res.status);
  }
  return res.json();
}

export async function fetchConversationWith(userId: number): Promise<ChatMessageDto[]> {
  const res = await fetch(`/api/chat/conversation/${userId}`, { cache: "no-store" });
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok) {
    throw new ApiError((await res.text()) || "Failed to load conversation", res.status);
  }
  return res.json();
}

export async function sendChatMessage(recipientId: number, messageText: string, fileUrl?: string | null) {
  const res = await fetch(`/api/chat/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipientId, messageText, fileUrl }),
  });
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok) {
    throw new ApiError((await res.text()) || "Failed to send message", res.status);
  }
  return res.json() as Promise<ChatMessageDto>;
}

export async function markChatRead(otherUserId: number) {
  const res = await fetch(`/api/chat/mark-read/${otherUserId}`, { method: "POST" });
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok) {
    throw new ApiError((await res.text()) || "Failed to mark read", res.status);
  }
}

export async function deleteChat(chatId: number) {
  const res = await fetch(`/api/chat/${chatId}`, { method: "DELETE" });
  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!res.ok && res.status !== 204) {
    throw new ApiError((await res.text()) || "Failed to delete chat", res.status);
  }
}
