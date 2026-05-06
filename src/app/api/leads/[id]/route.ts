// GET    /api/leads/[id]   — fetch one lead
// PATCH  /api/leads/[id]   — update (admin: any field; agent: status/notes/followUpAt of own)
// DELETE /api/leads/[id]   — admin only

import "server-only";
import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { User } from "@/models/User";
import { logActivity } from "@/lib/logActivity";
import { requireUser } from "@/lib/requireUser";
import { adminUpdateSchema, agentUpdateSchema } from "@/lib/validators/lead";
import { ok, fail, zodFields } from "@/lib/api";
import { emitEvent } from "@/lib/emitEvent";
import { sendMail } from "@/lib/email/mailer";
import { leadAssignedEmail } from "@/lib/email/templates";
import mongoose from "mongoose";
import { computeScore } from "@/lib/scoring";
import type { ActivityAction } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return fail("invalid_id", "Invalid lead ID", 400);

  await connectDB();
  const lead = await Lead.findById(id)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .lean();

  if (!lead) return fail("not_found", "Lead not found", 404);

  // Agents can only view their own assigned leads.
  if (user.role === "agent" && lead.assignedTo?.toString() !== user.id) {
    return fail("forbidden", "Access denied", 403);
  }

  return ok(lead);
}

// ── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return fail("invalid_id", "Invalid lead ID", 400);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_json", "Request body must be valid JSON", 400);
  }

  const schema = user.role === "admin" ? adminUpdateSchema : agentUpdateSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("validation_error", "Some fields are invalid", 400, zodFields(parsed.error.flatten()));
  }

  await connectDB();
  const lead = await Lead.findById(id);
  if (!lead) return fail("not_found", "Lead not found", 404);

  // Agents can only update their own assigned leads.
  if (user.role === "agent" && lead.assignedTo?.toString() !== user.id) {
    return fail("forbidden", "Access denied", 403);
  }

  const updates = parsed.data as Record<string, unknown>;
  const activities: { action: ActivityAction; meta: Record<string, unknown> }[] = [];

  // Detect status change
  if (updates.status && updates.status !== lead.status) {
    activities.push({ action: "status_changed", meta: { from: lead.status, to: updates.status } });
  }
  // Detect notes change
  if (updates.notes !== undefined && updates.notes !== lead.notes) {
    activities.push({ action: "note_added", meta: { notes: updates.notes } });
  }
  // Detect follow-up change
  if (updates.followUpAt !== undefined) {
    activities.push({ action: "followup_set", meta: { followUpAt: updates.followUpAt } });
  }

  // Admin-only: detect priority change from budget/source updates
  if (user.role === "admin") {
    const newBudget = (updates.budget as number) ?? lead.budget;
    const newSource = (updates.source as string) ?? lead.source;
    const newFollowUp = updates.followUpAt !== undefined
      ? (updates.followUpAt ? new Date(updates.followUpAt as string) : null)
      : lead.followUpAt;
    const { priority: newPriority } = computeScore(newBudget, newSource, newFollowUp);
    if (newPriority !== lead.priority) {
      activities.push({ action: "priority_changed", meta: { from: lead.priority, to: newPriority } });
    }
    if (updates.assignedTo !== undefined) {
      const action: ActivityAction = lead.assignedTo ? "reassigned" : "assigned";
      activities.push({ action, meta: { assignedTo: updates.assignedTo } });
    }
  }

  // Apply updates
  Object.assign(lead, updates);
  if (updates.followUpAt !== undefined) {
    lead.followUpAt = updates.followUpAt ? new Date(updates.followUpAt as string) : null;
  }
  if (user.role === "admin" && updates.assignedTo !== undefined) {
    lead.assignedTo = updates.assignedTo
      ? new mongoose.Types.ObjectId(updates.assignedTo as string)
      : null;
  }
  lead.lastActivityAt = new Date();
  await lead.save();

  // Email agent when lead is assigned/reassigned
  if (user.role === "admin" && updates.assignedTo) {
    const agent = await User.findById(updates.assignedTo).select("name email").lean();
    if (agent?.email) {
      const tpl = leadAssignedEmail({
        agentName: agent.name,
        leadName: lead.name,
        leadEmail: lead.email,
        leadPhone: lead.phone,
        propertyInterest: lead.propertyInterest,
        budget: lead.budget,
        appUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        leadId: id,
      });
      sendMail({ to: agent.email, ...tpl });
    }
  }

  // Write all detected activity entries
  for (const act of activities) {
    await logActivity({ leadId: lead._id, actorId: user.id, actorName: user.name, ...act });
  }

  const rooms = ["role:admin"];
  if (lead.assignedTo) rooms.push(`user:${lead.assignedTo.toString()}`);
  const hasPriorityChange = activities.some(a => a.action === "priority_changed");
  await emitEvent({
    event: hasPriorityChange ? "lead:priority_changed" : "lead:updated",
    rooms,
    data: { leadId: id },
  });

  return ok(lead.toJSON());
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { user, error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return fail("invalid_id", "Invalid lead ID", 400);

  await connectDB();
  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) return fail("not_found", "Lead not found", 404);

  await logActivity({
    leadId: lead._id,
    actorId: user.id,
    actorName: user.name,
    action: "deleted",
    meta: { name: lead.name },
  });

  return ok({ id });
}
