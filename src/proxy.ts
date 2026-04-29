// Route protection at the edge (was `middleware.ts` in Next 14/15 — renamed
// to `proxy.ts` in Next 16). We wrap NextAuth's `auth` so the JWT cookie is
// decoded and the role is available without a DB call.
//
// Rules:
//   /admin/*       → must be authed AND role === 'admin'
//   /agent/*       → must be authed (admins also allowed; they can see everything)
//   /api/leads/*   → must be authed (role check happens in the route handlers)
//   /login,/signup → if already authed, bounce to role-appropriate dashboard
//   everything else → public

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isAdminPath = pathname.startsWith("/admin");
  const isAgentPath = pathname.startsWith("/agent");
  const isLeadApi = pathname.startsWith("/api/leads");

  // Auth pages: send signed-in users to their dashboard.
  if (isAuthPage && session) {
    const dest = role === "admin" ? "/admin" : "/agent";
    return NextResponse.redirect(new URL(dest, req.nextUrl));
  }

  // Admin-only routes
  if (isAdminPath) {
    if (!session) return NextResponse.redirect(new URL("/login", req.nextUrl));
    if (role !== "admin")
      return NextResponse.redirect(new URL("/agent", req.nextUrl));
  }

  // Agent area (any authed user — admins allowed too)
  if (isAgentPath && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Protected lead API
  if (isLeadApi && !session) {
    return NextResponse.json(
      { ok: false, error: { code: "unauthorized", message: "Sign in required" } },
      { status: 401 },
    );
  }

  return NextResponse.next();
});

// Run the proxy on app pages and lead APIs. Skip Next internals & static files.
export const config = {
  matcher: [
    "/admin/:path*",
    "/agent/:path*",
    "/login",
    "/signup",
    "/api/leads/:path*",
  ],
};
