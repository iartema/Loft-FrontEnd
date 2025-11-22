import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Ensure server (Node) runtime so console logs surface in dev/SSR logs
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

async function forward(
  req: NextRequest,
  customerId: string,
  method: "POST" | "PUT"
) {
  try {
    const jar = await cookies();
    const token = jar.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.text();
    // Best-effort: ensure ProductId/Quantity keys exist for backend binding
    let parsed: any;
    try {
      parsed = body ? JSON.parse(body) : null;
    } catch {
      parsed = null;
    }
    const normalized =
      parsed && typeof parsed === "object"
        ? {
            ProductId: parsed.ProductId ?? parsed.productId ?? parsed.id ?? parsed.ProductID,
            Quantity: parsed.Quantity ?? parsed.quantity ?? parsed.Qty ?? 1,
            Price: parsed.Price ?? parsed.price ?? parsed.Cost ?? parsed.cost,
            ProductName: parsed.ProductName ?? parsed.productName ?? parsed.Name ?? parsed.name,
            ImageUrl: parsed.ImageUrl ?? parsed.imageUrl ?? parsed.imageURL ?? parsed.ImageURL,
            CategoryId: parsed.CategoryId ?? parsed.categoryId ?? parsed.CategoryID,
            CategoryName: parsed.CategoryName ?? parsed.categoryName ?? parsed.Name ?? parsed.name,
          }
        : undefined;
    const upstreamBody = normalized ? JSON.stringify(normalized) : body;
    const debugRequest = {
      customerId,
      method,
      rawBody: body,
      parsedBody: parsed,
      normalizedBody: normalized,
      upstreamUrl: `${API_BASE}/carts/${customerId}/items`,
    };
    try {
      console.error("[api/cart/[customerId]/items] request payload", JSON.stringify(debugRequest));
    } catch {
      console.error("[api/cart/[customerId]/items] request payload (stringify failed)", debugRequest);
    }
    const res = await fetch(`${API_BASE}/carts/${customerId}/items`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: upstreamBody,
    });
    const resText = await res.text();
    const debugResponse = { status: res.status, ok: res.ok, body: resText };
    try {
      console.error("[api/cart/[customerId]/items] upstream response", JSON.stringify(debugResponse));
    } catch {
      console.error("[api/cart/[customerId]/items] upstream response (stringify failed)", debugResponse);
    }
    if (!res.ok) {
      return NextResponse.json({ message: resText || `Upstream error ${res.status}` }, { status: 502 });
    }

    let data: any = resText;
    try {
      data = resText ? JSON.parse(resText) : {};
    } catch {
      // keep text as-is
    }

    const normalizeItem = (item: any) => {
      const productId = item?.productId ?? item?.ProductId;
      return {
        ...item,
        productId,
        productName: item?.productName ?? item?.ProductName ?? null,
        price: item?.price ?? item?.Price ?? null,
        imageUrl: item?.imageUrl ?? item?.ImageUrl ?? item?.imageURL ?? null,
        categoryId: item?.categoryId ?? item?.CategoryId ?? item?.CategoryID ?? null,
        categoryName: item?.categoryName ?? item?.CategoryName ?? item?.category?.name ?? null,
      };
    };

    const hintByProductId =
      normalized && normalized.ProductId
        ? { [Number(normalized.ProductId)]: normalized }
        : {};

    const hydrateMissingMeta = async (items: any[]) =>
      Promise.all(
        items.map(async (raw) => {
          const normalizedItem = normalizeItem(raw);
          const hint = hintByProductId[normalizedItem.productId ?? -1];
          const hintedName = hint
            ? hint.ProductName ?? hint.productName ?? hint.Name ?? hint.name ?? null
            : null;
          const hintedPrice = hint ? hint.Price ?? hint.price ?? hint.Cost ?? hint.cost ?? null : null;
          const hintedImage =
            hint ? hint.ImageUrl ?? hint.imageUrl ?? hint.ImageURL ?? hint.imageURL ?? null : null;
          const hintedCategoryId = hint
            ? hint.CategoryId ?? hint.categoryId ?? hint.CategoryID ?? null
            : null;
          const hintedCategoryName = hint
            ? hint.CategoryName ?? hint.categoryName ?? hint.Name ?? hint.name ?? null
            : null;

          const merged = {
            ...normalizedItem,
            productName: hintedName ?? normalizedItem.productName ?? null,
            price: hintedPrice ?? normalizedItem.price ?? null,
            imageUrl: hintedImage ?? normalizedItem.imageUrl ?? null,
            categoryId: hintedCategoryId ?? normalizedItem.categoryId ?? null,
            categoryName: hintedCategoryName ?? normalizedItem.categoryName ?? null,
          };

          const hasMeta =
            merged.productName &&
            merged.price !== null &&
            merged.price !== undefined &&
            merged.imageUrl !== null &&
            merged.imageUrl !== undefined &&
            merged.categoryId !== null &&
            merged.categoryId !== undefined;

          if (!merged.productId || hasMeta) {
            return merged;
          }

          try {
            const productRes = await fetch(`${API_BASE}/products/${merged.productId}`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            });
            if (productRes.ok) {
              const product = await productRes.json();
              return {
                ...merged,
                productName: merged.productName ?? product?.name ?? null,
                price: merged.price ?? product?.price ?? null,
                imageUrl:
                  merged.imageUrl ??
                  product?.imageUrl ??
                  (Array.isArray(product?.mediaFiles) && product.mediaFiles.length
                    ? product.mediaFiles[0]?.url ?? null
                    : null),
                categoryId: merged.categoryId ?? product?.categoryId ?? null,
                categoryName:
                  merged.categoryName ?? product?.categoryName ?? product?.category?.name ?? null,
              };
            }
          } catch (err) {
            console.error("[api/cart/[customerId]/items] hydrate meta failed", err);
          }
          return merged;
        })
      );

    if (data?.cartItems && Array.isArray(data.cartItems)) {
      const hydrated = await hydrateMissingMeta(data.cartItems);
      return NextResponse.json({ ...data, cartItems: hydrated });
    }

    if (Array.isArray(data)) {
      // Upstream returned a list of items
      const hydrated = await hydrateMissingMeta(data);
      return NextResponse.json(hydrated);
    }

    if (data && typeof data === "object") {
      // Upstream returned a single cart item object
      const hydrated = await hydrateMissingMeta([data]);
      return NextResponse.json(hydrated[0]);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  return forward(req, params.customerId, "POST");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  return forward(req, params.customerId, "PUT");
}
