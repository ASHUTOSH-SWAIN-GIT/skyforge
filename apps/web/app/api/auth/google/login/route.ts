import { NextResponse } from "next/server";
import { buildAuthUrl, generateState } from "@/lib/auth/google";

export async function GET() {
  const state = generateState();
  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return res;
}
