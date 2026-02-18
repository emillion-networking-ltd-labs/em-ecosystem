import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (authHeader) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: authHeader },
      });
    } catch {
      // Ignore backend errors during logout
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("refreshToken");
  return response;
}
