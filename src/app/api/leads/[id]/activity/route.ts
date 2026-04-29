// GET /api/leads/[id]/activity — chronological audit trail for a lead.
// Newest-first so timelines render top-to-bottom most-recent.

import "server-only";
import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { Activity } from "@/models/Activity";
import { requireUser } from "@/lib/requireUser";
import { ok, fail } from "@/lib/api";
import mongoose from "mongoose";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return fail("invalid_id", "Invalid lead ID", 400);

  await connectDB();

  const lead = await Lead.findById(id).lean();
  if (!lead) return fail("not_found", "Lead not found", 404);

  // Agents can only view activity for their assigned leads.
  if (user.role === "agent" && lead.assignedTo?.toString() !== user.id) {
    return fail("forbidden", "Access denied", 403);
  }

  const activities = await Activity.find({ leadId: id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return ok(activities);
}
