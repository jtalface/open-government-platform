import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Middleware for protecting routes based on authentication and roles
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Manager routes (manager or admin)
    if (path.startsWith("/dashboard") || path.startsWith("/tickets")) {
      if (token?.role !== "MANAGER" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/incidents/:path*",
    "/dashboard/:path*",
    "/tickets/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/map/:path*",
  ],
};

