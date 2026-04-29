// Signup endpoint. Roles are not accepted from the client — every signup
// is created as 'agent'. Admins are minted by the seed script (or by
// promotion from another admin in a later phase), never via this route.

import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signupSchema } from "@/lib/validators/auth";
import { ok, fail, zodFields } from "@/lib/api";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_json", "Request body must be valid JSON", 400);
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "validation_error",
      "Some fields are invalid",
      400,
      zodFields(parsed.error.flatten()),
    );
  }

  const { name, email, password } = parsed.data;

  await connectDB();
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return fail("email_taken", "An account with that email already exists", 409);
  }

  const created = await User.create({ name, email, password, role: "agent" });

  return ok(
    {
      id: created._id.toString(),
      email: created.email,
      name: created.name,
      role: created.role,
    },
    201,
  );
}
