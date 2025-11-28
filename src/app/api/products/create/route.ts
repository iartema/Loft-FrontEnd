import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

type Incoming = {
  name: string;
  categoryId: number;
  description?: string;
  price: number;
  currency: string; // USD/EUR/UAH/GBP
  quantity?: number;
  attributeValues?: { attributeId: number; value: string | number | boolean | string[] | null }[];
  mediaFiles?: { url: string; mediaTyp?: string }[];
};

export async function POST(req: NextRequest) {
  try {
    const jar = await cookies();
    const token = jar.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Incoming;
    if (!body || !body.name || !body.categoryId || body.price == null) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const currencyMap: Record<string, number> = { USD: 0, EUR: 1, UAH: 2, GBP: 3 };

    // Build DTO in the format the backend expects
    const dto: any = {
      Id: 0,
      CategoryId: Number(body.categoryId),
      Name: String(body.name),
      Description: body.description ?? "",
      Type: 0, // Physical
      Price: Number(body.price),
      Currency: currencyMap[(body.currency || "USD").toUpperCase()] ?? 0,
      Quantity: Number(body.quantity ?? 1),
    };

    if (Array.isArray(body.attributeValues) && body.attributeValues.length) {
      dto.AttributeValues = body.attributeValues.map((a) => {
        let v = "";
        if (Array.isArray(a.value)) v = a.value.map(String).join("|");
        else if (typeof a.value === "boolean") v = String(a.value);
        else if (a.value == null) v = "";
        else v = String(a.value);

        return { AttributeId: Number(a.attributeId), Value: v };
      });
    }

    if (Array.isArray(body.mediaFiles) && body.mediaFiles.length) {
      dto.MediaFiles = body.mediaFiles.map((m) => ({
        Url: m.url,
        MediaTyp: 0, // 0 = Image
      }));
    }

    // ✅ FIXED: send dto directly, not wrapped in { productDto: dto }
    const res = await fetch(`${API_BASE}/products/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ message: text || `Upstream error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Unexpected error" }, { status: 500 });
  }
}
