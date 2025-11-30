import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

// Backend only expects 0 = UAH, 1 = USD
const currencyMap: Record<string, number> = { UAH: 0, USD: 1 };
const normalizeCurrency = (value: unknown) => {
  const key = String(value ?? "").toUpperCase();
  return currencyMap[key] ?? currencyMap.UAH;
};

const normalizeType = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value === 1 ? 1 : 0;
  const str = String(value).toLowerCase();
  if (str === "1" || str.startsWith("dig")) return 1;
  return 0;
};

const normalizeMediaType = (value: unknown) => {
  if (typeof value === "number") return value;
  const str = String(value ?? "").toLowerCase();
  if (str === "1" || str.includes("digital")) return 1;
  return 0;
};

const getAuthHeader = (req: NextRequest) => {
  const jar = cookies();
  const cookieToken = jar.get("auth_token")?.value;
  const headerToken = req.headers.get("authorization");
  return headerToken || (cookieToken ? `Bearer ${cookieToken}` : undefined);
};

const buildProductDto = (id: number, body: any) => {
  const dto: any = {
    Id: Number(id),
    CategoryId: Number(body?.categoryId ?? body?.CategoryId ?? 0),
    Name: body?.name ?? body?.Name ?? "",
    Description: body?.description ?? body?.Description ?? "",
    Type: normalizeType(body?.type ?? body?.productType ?? body?.ProductType),
    Price: Number(body?.price ?? body?.Price ?? 0),
    Currency: normalizeCurrency(body?.currency ?? body?.Currency),
    Quantity: Number(body?.quantity ?? body?.Quantity ?? 0),
  };

  const attrs = body?.attributeValues ?? body?.AttributeValues;
  if (Array.isArray(attrs) && attrs.length) {
    dto.AttributeValues = attrs
      .map((entry: any) => {
        const attributeId =
          Number(entry?.attributeId ?? entry?.AttributeId ?? entry?.id ?? entry?.Id);
        if (!Number.isFinite(attributeId)) return null;

        let value = entry?.value ?? entry?.Value ?? "";
        if (Array.isArray(value)) value = value.map(String).join("|");
        else if (typeof value === "boolean") value = String(value);
        else if (value === null || value === undefined) value = "";

        return { AttributeId: attributeId, Value: String(value) };
      })
      .filter(Boolean);
  }

  const mediaFiles = body?.mediaFiles ?? body?.MediaFiles;
  if (Array.isArray(mediaFiles) && mediaFiles.length) {
    dto.MediaFiles = mediaFiles.map((m: any) => ({
      Url: m?.url ?? m?.Url ?? "",
      MediaTyp: normalizeMediaType(m?.mediaTyp ?? m?.MediaTyp ?? 0),
    }));
  }

  return dto;
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: "Product id is required" }, { status: 400 });
  }

  const authHeader = getAuthHeader(req);

  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      if (res.ok) {
        data = text;
      }
    }

    if (!res.ok) {
      return NextResponse.json(
        { message: "Backend returned error", data },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[api/products/[id]] upstream error", err);
    return NextResponse.json(
      { message: "Failed to reach backend for product details" },
      { status: 502 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: "Product id is required" }, { status: 400 });
  }

  const token = cookies().get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const dto = buildProductDto(Number(id), body);

    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(dto),
    });

    const text = await res.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      if (res.ok) data = text;
    }

    if (!res.ok) {
      return NextResponse.json(
        typeof data === "string" ? { message: data || "Failed to update product" } : data,
        { status: res.status || 502 }
      );
    }

    return NextResponse.json(data ?? { success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}
