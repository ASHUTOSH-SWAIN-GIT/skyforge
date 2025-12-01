import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname;

  // In production, the backend runs on a different domain, so the auth cookie
  // is not available on the frontend domain. If we enforce auth here, users
  // will be redirected back to /login even after a successful Google login.
  //
  // To avoid this, only enforce the cookie-based redirect logic when running
  // on localhost (local development). In production we let the app handle
  // auth client-side via API calls to the backend.
  const isLocalhost = host === "localhost" || host === "127.0.0.1";
  if (!isLocalhost) {
    return NextResponse.next();
  }

  // Get the auth token from cookies
  const token = request.cookies.get("auth_token");
  
  // Define protected routes
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isLoginPage = request.nextUrl.pathname === "/login";

  // 1. If trying to access dashboard without token -> Redirect to Login
  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. If trying to access login WITH token -> Redirect to Dashboard
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Only run middleware on specific paths to save performance
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};