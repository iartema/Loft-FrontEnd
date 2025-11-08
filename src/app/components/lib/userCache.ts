import { getMyProfile } from "./api";

// Lightweight client-side cache for the authenticated user
let cachedUser: any | null = null;
let inflight: Promise<any> | null = null;

export async function getCurrentUserCached(force = false): Promise<any> {
  if (!force && cachedUser) return cachedUser;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const u = await getMyProfile();
      cachedUser = u;
      return u;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function setCurrentUserCached(update: any | ((prev: any) => any)) {
  if (typeof update === "function") {
    cachedUser = (update as (prev: any) => any)(cachedUser);
  } else {
    cachedUser = update;
  }
  return cachedUser;
}

export function clearCurrentUserCache() {
  cachedUser = null;
}

