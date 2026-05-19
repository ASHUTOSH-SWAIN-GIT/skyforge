import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-cache" } },
  );
}
