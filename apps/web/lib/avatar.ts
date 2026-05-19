import { useEffect, useState } from "react";

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const cache = new Map<string, string>();

export async function gravatarUrl(email: string, size = 80): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const cached = cache.get(normalized);
  if (cached) return `${cached}?d=identicon&s=${size}`;
  const hash = await sha256Hex(normalized);
  cache.set(normalized, `https://www.gravatar.com/avatar/${hash}`);
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=${size}`;
}

export function useGravatars(emails: Array<string | null | undefined>, size = 80) {
  const key = emails
    .filter((e): e is string => Boolean(e && e.trim()))
    .map((e) => e.trim().toLowerCase())
    .sort()
    .join("|");
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const unique = Array.from(new Set(key.split("|")));
    Promise.all(unique.map(async (e) => [e, await gravatarUrl(e, size)] as const)).then(
      (entries) => {
        if (!cancelled) setMap(Object.fromEntries(entries));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, size]);
  return map;
}
