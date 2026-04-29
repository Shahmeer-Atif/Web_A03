// GET /api/users — admin: returns list of active agents (for assignment dropdowns).

import "server-only";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireUser } from "@/lib/requireUser";
import { ok } from "@/lib/api";

export async function GET() {
  const { error } = await requireUser("admin");
  if (error) return error;

  await connectDB();
  const agents = await User.find({ role: "agent", isActive: true })
    .select("name email")
    .sort({ name: 1 })
    .lean();

  return ok(agents);
}
