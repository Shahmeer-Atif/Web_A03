// GET  /api/leads  — list leads (admin: all; agent: only assigned to them)
// POST /api/leads  — create lead (any authed user)
//
// Scoring runs via the Mongoose pre-save hook on Lead; we don't call
// computeScore() here — the model is the single source of truth for
// priority/score.

import "server-only";
import { type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { logActivity } from "@/lib/logActivity";
import { requireUser } from "@/lib/requireUser";
import { createLeadSchema } from "@/lib/validators/lead";
import { ok, fail, zodFields } from "@/lib/api";
import mongoose from "mongoose";

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  await connectDB();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  // Agents only see their assigned leads.
  if (user.role === "agent") filter.assignedTo = new mongoose.Types.ObjectId(user.id);

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: re }, { email: re }, { phone: re }];
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ score: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Lead.countDocuments(filter),
  ]);

  return ok({ leads, total, page, limit });
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_json", "Request body must be valid JSON", 400);
  }

  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return fail("validation_error", "Some fields are invalid", 400, zodFields(parsed.error.flatten()));
  }

  await connectDB();

  const data = parsed.data;
  const lead = await Lead.create({
    ...data,
    followUpAt: data.followUpAt ? new Date(data.followUpAt) : null,
    assignedTo: data.assignedTo ? new mongoose.Types.ObjectId(data.assignedTo) : null,
    createdBy: new mongoose.Types.ObjectId(user.id),
    lastActivityAt: new Date(),
  });

  await logActivity({
    leadId: lead._id,
    actorId: user.id,
    actorName: user.name,
    action: "created",
    meta: { name: lead.name, budget: lead.budget, priority: lead.priority },
  });

  // TODO Phase 7: emit socket event "lead:created"
  // TODO Phase 8: send new-lead email notification to admin

  return ok(lead.toJSON(), 201);
}
