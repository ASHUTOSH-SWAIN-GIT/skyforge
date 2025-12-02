import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? "http://localhost:8080";

async function forwardRequest(
  request: NextRequest,
  params: { projectId: string },
  method: "GET" | "PUT" | "DELETE"
) {
  const targetUrl = `${BACKEND_BASE_URL}/projects/${params.projectId}`;

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

  if (method === "PUT") {
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers["content-type"] = contentType;
    }
  }

  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  if (method === "PUT") {
    init.body = await request.text();
  }

  const response = await fetch(targetUrl, init);

  if (response.status === 204) {
    return new NextResponse(null, { status: response.status });
  }

  const responseBody = await response.text();
  const nextResponse = new NextResponse(responseBody, { status: response.status });
  const responseType = response.headers.get("content-type");
  if (responseType) {
    nextResponse.headers.set("content-type", responseType);
  }

  return nextResponse;
}

export async function GET(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const params = await context.params;
  return forwardRequest(request, params, "GET");
}

export async function PUT(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const params = await context.params;
  return forwardRequest(request, params, "PUT");
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const params = await context.params;
  return forwardRequest(request, params, "DELETE");
}


