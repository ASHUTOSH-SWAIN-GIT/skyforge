import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
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