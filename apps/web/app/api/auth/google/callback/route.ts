import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, fetchGoogleUserInfo, frontendUrl } from "@/lib/auth/google";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE, generateJWT } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const stateCookie = req.cookies.get("oauth_state")?.value;

  if (!state || !stateCookie || state !== stateCookie) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  let accessToken: string;
  let userInfo: { email: string; name: string; picture?: string };
  try {
    accessToken = await exchangeCodeForToken(code, req);
    userInfo = await fetchGoogleUserInfo(accessToken);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const user = await prisma.user.upsert({
    where: { email: userInfo.email },
    update: {
      name: userInfo.name,
      avatarUrl: userInfo.picture || null,
    },
    create: {
      email: userInfo.email,
      name: userInfo.name,
      avatarUrl: userInfo.picture || null,
      provider: "google",
    },
  });

  const jwt = await generateJWT(user.id);
  const isProd = process.env.NODE_ENV === "production";
  const target = `${frontendUrl(req)}/dashboard`;

  const res = NextResponse.redirect(target);
  res.cookies.set(AUTH_COOKIE, jwt, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
  res.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}
