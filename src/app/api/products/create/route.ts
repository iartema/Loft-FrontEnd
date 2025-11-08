import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.loft-shop.pp.ua/api";

type Incoming = {
  name: string;
  categoryId: number;
  description?: string;
  price: number;
  currency: string; // USD/EUR/UAH/GBP
  quantity?: number;
  attributeValues?: { attributeId: number; value: string | number | boolean | string[] | null }[];
  mediaFiles?: { url: string; mediaTyp?: string }[]; // image urls
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Incoming;
    if (!body || !body.name || !body.categoryId || body.price == null) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const currencyMap: Record<string, number> = { USD: 0, EUR: 1, UAH: 2, GBP: 3 };
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
        let v: string = "";
        if (Array.isArray(a.value)) v = a.value.map(String).join("|");
        else if (typeof a.value === "boolean") v = String(a.value);
        else if (a.value == null) v = "";
        else v = String(a.value);
        return { AttributeId: Number(a.attributeId), Value: v };
      });
    }

    if (Array.isArray(body.mediaFiles) && body.mediaFiles.length) {
      dto.MediaFiles = body.mediaFiles.map((m) => ({ Url: m.url, MediaTyp: 0 })); // 0 = Image
    }

    const res = await fetch(`${API_BASE}/products/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") || "" },
      credentials: "include",
      body: JSON.stringify({ productDto: dto }),
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

