type CacheEntry = {
  data: any[];
  timestamp: number;
  ttl: number;
};

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 60 * 1000; // 1 minute

export function getCached(key: string): any[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key: string, data: any[], ttl: number = DEFAULT_TTL) {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

export function invalidateCache(key: string) {
  cache.delete(key);
}