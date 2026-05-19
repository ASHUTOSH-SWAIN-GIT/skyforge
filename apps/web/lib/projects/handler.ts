import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError, getUserIdFromRequest } from "../auth/session";

type Handler = (req: NextRequest, ctx: { userId: string; params: Record<string, string> }) => Promise<NextResponse> | NextResponse;

export function withAuth<P extends Record<string, string>>(
  handler: (req: NextRequest, ctx: { userId: string; params: P }) => Promise<NextResponse> | NextResponse,
) {
  return async (req: NextRequest, context: { params: Promise<P> }) => {
    const params = await context.params;
    let userId: string;
    try {
      userId = await getUserIdFromRequest(req);
    } catch (err) {
      if (err instanceof UnauthorizedError)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      throw err;
    }
    try {
      return await handler(req, { userId, params });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}

export const _typecheck: Handler | undefined = undefined;
