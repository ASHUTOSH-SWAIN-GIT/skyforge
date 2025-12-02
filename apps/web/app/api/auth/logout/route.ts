import { NextResponse } from "next/server";

export async function POST() {
  // Clear the auth_token cookie on the frontend domain
  const response = NextResponse.json({ message: "Logged out successfully" });
  
  // Delete the cookie by setting it to expire in the past
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  return response;
}

