import { SignJWT, jwtVerify } from "jose";

const SEVEN_DAYS = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function generateJWT(userId: string): Promise<string> {
  return new SignJWT({ user_id: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SEVEN_DAYS}s`)
    .sign(secret());
}

export async function validateJWT(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
  const userId = payload.user_id;
  if (typeof userId !== "string") throw new Error("invalid token claims");
  return userId;
}

export const AUTH_COOKIE = "auth_token";
export const AUTH_COOKIE_MAX_AGE = SEVEN_DAYS;
