import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? "http://localhost:8080";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const targetUrl = `${BACKEND_BASE_URL}/projects/${projectId}/export/prisma`;

  const headers: Record<string, string> = {};
  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers["cookie"] = cookie;
  }

  const response = await fetch(targetUrl, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  const responseBody = await response.text();
  const nextResponse = new NextResponse(responseBody, { status: response.status });
  
  const responseType = response.headers.get("content-type");
  if (responseType) {
    nextResponse.headers.set("content-type", responseType);
  }

  return nextResponse;
}

