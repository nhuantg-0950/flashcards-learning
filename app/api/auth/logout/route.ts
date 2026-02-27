import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Sign out from Supabase - this invalidates the session on the server
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
      return NextResponse.json(
        { error: "Failed to logout. Please try again." },
        { status: 500 }
      );
    }

    // Create response with success
    const response = NextResponse.json({ success: true });

    // Clear all Supabase auth cookies
    // The cookie names follow the pattern: sb-<project-ref>-auth-token
    // We'll clear the common patterns
    const cookiesToClear = [
      "sb-access-token",
      "sb-refresh-token",
      // Also clear any cookies that start with sb-
    ];

    cookiesToClear.forEach((name) => {
      response.cookies.delete(name);
    });

    // Clear cookies with the specific project reference pattern
    // These are set by @supabase/ssr
    response.cookies.set({
      name: "sb-access-token",
      value: "",
      maxAge: 0,
      path: "/",
    });

    response.cookies.set({
      name: "sb-refresh-token",
      value: "",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Unexpected logout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during logout." },
      { status: 500 }
    );
  }
}
