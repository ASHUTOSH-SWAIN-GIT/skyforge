import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { AUTH_COOKIE, validateJWT } from "./jwt";

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
  }
}

export async function getUserIdFromRequest(req?: NextRequest): Promise<string> {
  const token = req
    ? req.cookies.get(AUTH_COOKIE)?.value
    : (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) throw new UnauthorizedError();
  try {
    return await validateJWT(token);
  } catch {
    throw new UnauthorizedError();
  }
}
