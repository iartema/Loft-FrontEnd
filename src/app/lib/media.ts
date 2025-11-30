const DEFAULT_MEDIA_BASE = "https://www.loft-shop.pp.ua/api/media";
const DEFAULT_MEDIA_PUBLIC_BASE = "https://www.loft-shop.pp.ua";

export const MEDIA_API_BASE =
  process.env.NEXT_PUBLIC_MEDIA_API_BASE ||
  process.env.MEDIA_API_BASE ||
  DEFAULT_MEDIA_BASE;
export const MEDIA_PUBLIC_BASE =
  process.env.NEXT_PUBLIC_MEDIA_PUBLIC_BASE ||
  process.env.MEDIA_PUBLIC_BASE ||
  DEFAULT_MEDIA_PUBLIC_BASE;

const stripLeadingSlashes = (value: string) => value.replace(/^\/+/, "");
const MEDIA_ROOT = MEDIA_API_BASE.replace(/\/api\/media$/, "");

const extractFileName = (value: string) => {
  const clean = stripLeadingSlashes(value);
  if (!clean) return clean;
  const parts = clean.split("/");
  return parts[parts.length - 1] || clean;
};

const isGuid = (value: string) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );

export const IMAGE_MEDIA_TYPES = new Set(["image", "photo", "0", 0]);

export function isImageMediaType(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return value === 0;
  const normalized = String(value).toLowerCase();
  if (IMAGE_MEDIA_TYPES.has(normalized)) return true;
  return normalized.includes("image") || normalized.includes("photo");
}

type MediaEntry = {
  url?: string | null;
  Url?: string | null;
  mediaId?: string | null;
  MediaId?: string | null;
  mediaTyp?: unknown;
  MediaTyp?: unknown;
};

export function getFirstPublicImageUrl(mediaFiles?: MediaEntry[] | null): string {
  return getPublicImageUrls(mediaFiles)[0] ?? "";
}

export function getPublicImageUrls(mediaFiles?: MediaEntry[] | null): string[] {
  if (!mediaFiles) return [];
  const urls: string[] = [];
  for (const entry of mediaFiles) {
    const raw = entry?.url ?? entry?.Url;
    if (typeof raw === "string" && isGuid(raw)) continue;
    if (!isImageMediaType(entry?.mediaTyp ?? entry?.MediaTyp)) continue;
    const url = resolveMediaUrl(raw);
    if (url) urls.push(url);
  }
  return urls;
}

export function resolveMediaUploadUrl(category?: string | null) {
  const normalized = (category ?? "").toString().trim();
  const segment = normalized ? normalized : "general";
  return `${MEDIA_API_BASE}/upload/${encodeURIComponent(segment)}`;
}

export function buildMediaViewUrl(raw: string): string {
  const stripped = stripLeadingSlashes(raw);
  if (!stripped) return "";
  if (/^(https?:|data:|blob:)/i.test(stripped)) return stripped;

  if (stripped.startsWith("api/")) {
    const root = MEDIA_API_BASE.replace(/\/api\/media$/, "");
    return `${root}/${stripped}`;
  }

  if (stripped.startsWith("view/") || stripped.startsWith("upload/") || stripped.startsWith("files/")) {
    return `${MEDIA_API_BASE}/${stripped}`;
  }

  const fileName = extractFileName(stripped);
  return `${MEDIA_API_BASE}/view/${fileName}`;
}

export function resolveMediaUrl(url?: string | null): string {
  let resolved = "";
  if (!url) {
    resolved = "";
  } else {
    const trimmed = url.trim();
    if (!trimmed || isGuid(trimmed)) {
      resolved = "";
    } else if (/^(https?:|data:|blob:)/i.test(trimmed)) {
      if (/^https?:/i.test(trimmed)) {
        try {
          const parsed = new URL(trimmed);
          if (parsed.hostname.endsWith("loft-shop.pp.ua")) {
            const normalizedPath = parsed.pathname || "";
            const strippedPath = stripLeadingSlashes(normalizedPath);
            // If the upstream already points into /api/media/*, keep it as-is
            if (strippedPath.startsWith("api/media/")) {
              resolved = trimmed;
            } else if (strippedPath.startsWith("media/")) {
              resolved = `${parsed.origin}/${strippedPath}`;
            } else {
              const fileName = extractFileName(strippedPath);
              resolved = `${parsed.origin}/api/media/view/${fileName}`;
            }
          } else {
            resolved = trimmed;
          }
        } catch {
          resolved = trimmed;
        }
      } else {
        resolved = trimmed;
      }
    } else if (trimmed.startsWith("/media") || trimmed.startsWith("media/")) {
      const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
      resolved = `${MEDIA_PUBLIC_BASE || MEDIA_ROOT}${path}`;
    } else if (trimmed.startsWith("/")) {
      const withoutSlash = stripLeadingSlashes(trimmed);
      resolved = `${MEDIA_ROOT}/${withoutSlash}`;
    } else {
      resolved = buildMediaViewUrl(trimmed);
    }
  }

  if (typeof console !== "undefined") {
    console.log("[media] resolved url", { input: url ?? null, resolved });
  }
  return resolved;
}

export function extractMediaUrl(payload: any): string | undefined {
  if (!payload) return undefined;
  if (typeof payload === "string") {
    const resolved = resolveMediaUrl(payload);
    return resolved || payload;
  }
  if (typeof payload !== "object") return undefined;
  const candidates = [
    payload.url,
    payload.Url,
    payload.fileUrl,
    payload.FileUrl,
    payload.fullUrl,
    payload.FullUrl,
    payload.path,
    payload.Path,
  ].filter((val): val is string => typeof val === "string" && val.trim().length > 0);
  if (candidates.length) {
    return resolveMediaUrl(candidates[0]);
  }
  const fileName =
    (typeof payload.fileName === "string" && payload.fileName) ||
    (typeof payload.FileName === "string" && payload.FileName) ||
    undefined;
  if (fileName) return buildMediaViewUrl(fileName);
  if (payload.data && typeof payload.data === "object" && payload.data !== payload) {
    const nested = extractMediaUrl(payload.data);
    if (nested) return nested;
  }
  return undefined;
}
