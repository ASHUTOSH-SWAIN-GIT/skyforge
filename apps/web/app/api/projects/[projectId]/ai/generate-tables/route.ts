import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? "http://localhost:8080";

export async function POST(
  request: NextRequest,
  context: { params: { projectId: string } }
) {
  const { projectId } = context.params;
  const targetUrl = `${BACKEND_BASE_URL}/projects/${projectId}/ai/generate-tables`;

  const headers: Record<string, string> = {};
  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers["cookie"] = cookie;
  }
  headers["content-type"] = "application/json";

  const body = await request.text();

  const response = await fetch(targetUrl, {
    method: "POST",
    headers,
    body,
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

