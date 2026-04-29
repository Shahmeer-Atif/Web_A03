// POST /api/leads/[id]/assign — admin only.
// Dedicated endpoint so assignment intent is explicit in the audit log
// (logged as 'assigned' or 'reassigned' depending on prior state) and
// the Phase 7 socket emit and Phase 8 email have a clear hook point.

import "server-only";
import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { User } from "@/models/User";
import { logActivity } from "@/lib/logActivity";
import { requireUser } from "@/lib/requireUser";
import { ok, fail } from "@/lib/api";
import { z } from "zod";
import mongoose from "mongoose";

const assignSchema = z.object({
  agentId: z.string().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { user, error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return fail("invalid_id", "Invalid lead ID", 400);

  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid_json", "Body must be JSON", 400); }

  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return fail("validation_error", "agentId is required (string or null)", 400);

  await connectDB();

  const lead = await Lead.findById(id);
  if (!lead) return fail("not_found", "Lead not found", 404);

  // Validate the target agent exists and is active (if not unassigning).
  if (parsed.data.agentId) {
    if (!mongoose.isValidObjectId(parsed.data.agentId))
      return fail("invalid_id", "Invalid agentId", 400);
    const agent = await User.findOne({ _id: parsed.data.agentId, role: "agent", isActive: true });
    if (!agent) return fail("not_found", "Agent not found or inactive", 404);
  }

  const wasAssigned = !!lead.assignedTo;
  const action = wasAssigned ? "reassigned" : "assigned";

  lead.assignedTo = parsed.data.agentId
    ? new mongoose.Types.ObjectId(parsed.data.agentId)
    : null;
  lead.lastActivityAt = new Date();
  await lead.save();

  await logActivity({
    leadId: lead._id,
    actorId: user.id,
    actorName: user.name,
    action,
    meta: { agentId: parsed.data.agentId },
  });

  // TODO Phase 7: emit socket event "lead:assigned"
  // TODO Phase 8: send assignment email to agent

  const populated = await Lead.findById(id).populate("assignedTo", "name email").lean();
  return ok(populated);
}
