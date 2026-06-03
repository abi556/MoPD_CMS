import type { ComplaintFormOptions } from "@/lib/public-complaints";

const STORAGE_KEY = "mopd:complaint-form-options";
const TTL_MS = 30 * 60 * 1000;

interface CachedEntry {
  fetchedAt: number;
  data: ComplaintFormOptions;
}

let memoryCache: CachedEntry | null = null;

function readStorage(): CachedEntry | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CachedEntry;
    if (
      !parsed ||
      typeof parsed.fetchedAt !== "number" ||
      !parsed.data?.categories ||
      !parsed.data?.orgUnits
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(entry: CachedEntry): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Quota or private mode — in-memory cache still works.
  }
}

function isFresh(entry: CachedEntry): boolean {
  return Date.now() - entry.fetchedAt < TTL_MS;
}

export function getCachedComplaintFormOptions(): ComplaintFormOptions | null {
  if (memoryCache && isFresh(memoryCache)) {
    return memoryCache.data;
  }
  const stored = readStorage();
  if (stored && isFresh(stored)) {
    memoryCache = stored;
    return stored.data;
  }
  return null;
}

export function setCachedComplaintFormOptions(data: ComplaintFormOptions): void {
  const entry: CachedEntry = { fetchedAt: Date.now(), data };
  memoryCache = entry;
  writeStorage(entry);
}

export function clearCachedComplaintFormOptions(): void {
  memoryCache = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
