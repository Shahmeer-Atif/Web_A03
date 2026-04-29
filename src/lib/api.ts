// Tiny helpers so every route handler returns the same envelope:
//   { ok: true, data }  |  { ok: false, error: { code, message, fields? } }
// Keeping this in one place stops drift across routes and makes the client
// type-narrowing trivial.

import { NextResponse } from "next/server";
import type { ApiResult } from "@/types";

export function ok<T>(data: T, status = 200): NextResponse<ApiResult<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  fields?: Record<string, string[]>,
): NextResponse<ApiResult<never>> {
  return NextResponse.json(
    { ok: false, error: { code, message, fields } },
    { status },
  );
}

// Map a zod flatten() output into our `fields` shape.
export function zodFields(
  flat: { fieldErrors: Record<string, string[] | undefined> },
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(flat.fieldErrors)) {
    if (v && v.length) out[k] = v;
  }
  return out;
}
