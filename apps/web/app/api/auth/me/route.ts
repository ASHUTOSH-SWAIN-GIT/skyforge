import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache";
import { UnauthorizedError, getUserIdFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const USER_CACHE_TTL = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  let userId: string;
  try {
    userId = await getUserIdFromRequest(req);
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }

  const cacheKey = `user:${userId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  cache.set(cacheKey, user, USER_CACHE_TTL);
  return NextResponse.json(user, { headers: { "X-Cache": "MISS" } });
}
