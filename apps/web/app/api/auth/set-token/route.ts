import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  // Basic JWT format validation (has 3 parts separated by dots)
  if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)) {
    return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
  }

  // Set cookie on frontend domain (HttpOnly for security)
  // The backend will validate the JWT signature when it's used
  const response = NextResponse.json({ success: true });
  const isProduction = process.env.NODE_ENV === "production";
  
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return response;
}

