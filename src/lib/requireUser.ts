// Centralised auth helper for route handlers. Reads the NextAuth session
// and returns typed user data or a ready-to-return error response.
// Using this in every route avoids copying the 401/403 pattern everywhere.

import "server-only";
import { auth } from "@/lib/auth";
import { fail } from "@/lib/api";
import type { Role } from "@/types";
import type { NextResponse } from "next/server";
import type { ApiResult } from "@/types";

type AuthUser = { id: string; role: Role; name: string; email: string };

type RequireUserResult =
  | { user: AuthUser; error: null }
  | { user: null; error: NextResponse<ApiResult<never>> };

export async function requireUser(requiredRole?: Role): Promise<RequireUserResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { user: null, error: fail("unauthorized", "Sign in required", 401) };
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return { user: null, error: fail("forbidden", "Access denied", 403) };
  }

  return {
    user: {
      id: session.user.id,
      role: session.user.role,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
    },
    error: null,
  };
}
