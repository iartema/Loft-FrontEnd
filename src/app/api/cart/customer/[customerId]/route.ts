import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params;

    const jar = await cookies();
    const token = jar.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${API_BASE}/carts/customer/${customerId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (res.status === 404) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { message: text || `Upstream error ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    const normalizeItem = (item: any) => {
      const productId = item?.productId ?? item?.ProductId;
      return {
        ...item,
        productId,
        productName: item?.productName ?? item?.ProductName ?? null,
        price: item?.price ?? item?.Price ?? null,
        imageUrl:
          item?.imageUrl ??
          item?.ImageUrl ??
          item?.imageURL ??
          null,
        categoryId:
          item?.categoryId ??
          item?.CategoryId ??
          item?.CategoryID ??
          null,
        categoryName:
          item?.categoryName ??
          item?.CategoryName ??
          item?.category?.name ??
          null,
      };
    };

    const hydrateMissingMeta = async (items: any[]) => {
      const enriched = await Promise.all(
        items.map(async (raw) => {
          const normalized = normalizeItem(raw);

          const hasProductId =
            normalized.productId !== undefined &&
            normalized.productId !== null;

          const hasMeta =
            normalized.productName &&
            normalized.price != null &&
            normalized.imageUrl &&
            normalized.categoryId != null;

          if (!hasProductId || hasMeta) {
            return normalized;
          }

          try {
            const productRes = await fetch(
              `${API_BASE}/products/${normalized.productId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
              }
            );
            if (productRes.ok) {
              const product = await productRes.json();
              return {
                ...normalized,
                productName:
                  normalized.productName ??
                  product?.name ??
                  null,
                price:
                  normalized.price ??
                  product?.price ??
                  null,
                imageUrl:
                  normalized.imageUrl ??
                  product?.imageUrl ??
                  (Array.isArray(product?.mediaFiles) &&
                  product.mediaFiles.length
                    ? product.mediaFiles[0]?.url ?? null
                    : null),
                categoryId:
                  normalized.categoryId ??
                  product?.categoryId ??
                  null,
                categoryName:
                  normalized.categoryName ??
                  product?.categoryName ??
                  product?.category?.name ??
                  null,
              };
            }
          } catch (err) {
            console.error(
              "[api/cart/customer/[customerId]] hydrate meta failed",
              err
            );
          }

          return normalized;
        })
      );

      return enriched;
    };

    if (data?.cartItems && Array.isArray(data.cartItems)) {
      data.cartItems = await hydrateMissingMeta(data.cartItems);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
