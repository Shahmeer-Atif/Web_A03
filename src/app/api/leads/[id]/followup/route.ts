// POST /api/leads/[id]/followup — agents and admins can set/clear a follow-up date.
// Agents can only update their own assigned leads.

import "server-only";
import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { logActivity } from "@/lib/logActivity";
import { requireUser } from "@/lib/requireUser";
import { ok, fail } from "@/lib/api";
import { z } from "zod";
import mongoose from "mongoose";

const schema = z.object({
  followUpAt: z.string().datetime().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return fail("invalid_id", "Invalid lead ID", 400);

  let body: unknown;
  try { body = await req.json(); } catch { return fail("invalid_json", "Body must be JSON", 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("validation_error", "followUpAt must be an ISO datetime string or null", 400);

  await connectDB();

  const lead = await Lead.findById(id);
  if (!lead) return fail("not_found", "Lead not found", 404);

  if (user.role === "agent" && lead.assignedTo?.toString() !== user.id) {
    return fail("forbidden", "Access denied", 403);
  }

  const prev = lead.followUpAt;
  lead.followUpAt = parsed.data.followUpAt ? new Date(parsed.data.followUpAt) : null;
  lead.lastActivityAt = new Date();
  await lead.save();

  await logActivity({
    leadId: lead._id,
    actorId: user.id,
    actorName: user.name,
    action: "followup_set",
    meta: {
      from: prev?.toISOString() ?? null,
      to: lead.followUpAt?.toISOString() ?? null,
    },
  });

  return ok({ followUpAt: lead.followUpAt });
}
