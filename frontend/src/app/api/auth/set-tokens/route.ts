import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { refreshToken } = await request.json();

  const response = NextResponse.json({ ok: true });
  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}
