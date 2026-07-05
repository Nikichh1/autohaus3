// Best-effort in-memory sliding-window rate limiter. Fine for single-instance dev
// and low-traffic deployments; swap for Upstash Redis in a multi-instance setup.

type Hit = number[];
const store = new Map<string, Hit>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    store.set(key, hits);
    return false; // blocked
  }
  hits.push(now);
  store.set(key, hits);
  return true; // allowed
}

// Opportunistic cleanup so the map doesn't grow unbounded.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, hits] of store) {
      const live = hits.filter((t) => now - t < 60 * 60 * 1000);
      if (live.length === 0) store.delete(k);
      else store.set(k, live);
    }
  }, 10 * 60 * 1000).unref?.();
}
