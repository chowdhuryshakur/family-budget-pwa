import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { password } = await req.json();
    const validPassword = process.env.APP_PASSWORD || "1234";

    if (!password || String(password).trim() !== String(validPassword).trim()) {
      return NextResponse.json(
        { error: "Incorrect PIN or Password. Please try again." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("budget_auth_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Login successful!" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
