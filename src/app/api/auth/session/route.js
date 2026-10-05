import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("budget_auth_session")?.value;
    const isAuthenticated = sessionToken === "authenticated";

    return NextResponse.json({ authenticated: isAuthenticated });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
