type Item = { value: unknown; expiresAt: number };

class TTLCache {
  private items = new Map<string, Item>();

  constructor() {
    if (typeof setInterval !== "undefined") {
      const timer = setInterval(() => this.sweep(), 5 * 60 * 1000);
      // Don't keep the Node process alive just for cache sweeps.
      (timer as unknown as { unref?: () => void }).unref?.();
    }
  }

  set(key: string, value: unknown, ttlMs: number) {
    this.items.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get<T = unknown>(key: string): T | undefined {
    const item = this.items.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.items.delete(key);
      return undefined;
    }
    return item.value as T;
  }

  delete(key: string) {
    this.items.delete(key);
  }

  deletePrefix(prefix: string) {
    for (const key of this.items.keys()) {
      if (key.startsWith(prefix)) this.items.delete(key);
    }
  }

  private sweep() {
    const now = Date.now();
    for (const [key, item] of this.items) {
      if (now > item.expiresAt) this.items.delete(key);
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __cache: TTLCache | undefined;
}

export const cache: TTLCache = global.__cache ?? new TTLCache();
if (process.env.NODE_ENV !== "production") global.__cache = cache;
