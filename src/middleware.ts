import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env["JWT_SECRET"] || "default-secret-change-me"
);

const publicPaths = ["/", "/login", "/api/auth/login", "/api/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    publicPaths.some((p) => pathname === p) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/join/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check session cookie
  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);

    // Admin-only routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid token, redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("session", "", { expires: new Date(0) });
    return response;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/editor/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/api/documents/:path*",
    "/api/admin/:path*",
  ],
};
