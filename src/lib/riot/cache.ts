// In-memory response cache. Finished matches never change, so they're cached
// with no expiry. This will move to a database once we store match history.
type Entry = { value: unknown; expires: number };

const MAX_ENTRIES = 5_000;

const g = globalThis as unknown as { __riotCache?: Map<string, Entry> };
const cache = (g.__riotCache ??= new Map());

export function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

// ttlMs = null means keep forever (until evicted).
export function cacheSet(key: string, value: unknown, ttlMs: number | null) {
  if (cache.size >= MAX_ENTRIES) {
    // Map iterates in insertion order, so this drops the oldest entry.
    cache.delete(cache.keys().next().value!);
  }
  cache.set(key, { value, expires: ttlMs === null ? Infinity : Date.now() + ttlMs });
}
