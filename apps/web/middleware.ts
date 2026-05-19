import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth cookie now lives on the same domain as the app (no separate backend),
// so we can enforce route protection in every environment.
export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token");
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
