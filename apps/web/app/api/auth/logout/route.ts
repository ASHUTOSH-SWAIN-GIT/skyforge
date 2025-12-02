import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  const targetUrl = `${BACKEND_BASE_URL}/auth/logout`;

  const headers: Record<string, string> = {};
  
  // Get cookies from Next.js request object
  const cookies = request.cookies.getAll();
  if (cookies.length > 0) {
    // Format cookies as a cookie header string
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    headers["cookie"] = cookieString;
  } else {
    // Fallback to raw header if Next.js cookies aren't available
    const cookie = request.headers.get("cookie");
    if (cookie) {
      headers["cookie"] = cookie;
    }
  }

  const response = await fetch(targetUrl, {
    method: "POST",
    headers,
    cache: "no-store",
  });

  const responseBody = await response.text();
  const nextResponse = new NextResponse(responseBody, { status: response.status });
  
  const responseType = response.headers.get("content-type");
  if (responseType) {
    nextResponse.headers.set("content-type", responseType);
  }

  // Forward all Set-Cookie headers from backend to frontend (for cookie clearing)
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      nextResponse.headers.append("set-cookie", value);
    }
  });

  return nextResponse;
}

