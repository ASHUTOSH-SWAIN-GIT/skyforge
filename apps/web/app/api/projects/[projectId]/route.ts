import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? "http://localhost:8080";

async function forwardRequest(
  request: NextRequest,
  params: { projectId: string },
  method: "GET" | "PUT" | "DELETE"
) {
  const targetUrl = `${BACKEND_BASE_URL}/projects/${params.projectId}`;

  const headers: Record<string, string> = {};
  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers["cookie"] = cookie;
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

export async function GET(request: NextRequest, context: { params: { projectId: string } }) {
  return forwardRequest(request, context.params, "GET");
}

export async function PUT(request: NextRequest, context: { params: { projectId: string } }) {
  return forwardRequest(request, context.params, "PUT");
}

export async function DELETE(request: NextRequest, context: { params: { projectId: string } }) {
  return forwardRequest(request, context.params, "DELETE");
}


