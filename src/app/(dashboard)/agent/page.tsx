import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import LeadTable from "@/components/leads/LeadTable";
import LeadEventRefresher from "@/components/shared/LeadEventRefresher";
import type { LeadPriority, LeadStatus } from "@/types";
import mongoose from "mongoose";
import { AlertCircle, Clock } from "lucide-react";

export default async function AgentHome() {
  const session = await auth();
  if (!session?.user?.id) return null;

  await connectDB();
  const leads = await Lead.find({ assignedTo: new mongoose.Types.ObjectId(session.user.id) })
    .populate("assignedTo", "name email")
    .populate("createdBy", "name")
    .sort({ score: -1, createdAt: -1 })
    .limit(50)
    .lean();

  const overdue = leads.filter(l => l.followUpAt && new Date(l.followUpAt) < new Date() && !l.status.startsWith("closed"));
  const stale = leads.filter(l => !overdue.includes(l) && new Date(l.lastActivityAt) < new Date(Date.now() - 7 * 86400_000) && !l.status.startsWith("closed"));

  const serialized = leads.map(l => ({
    ...l,
    _id: l._id.toString(),
    assignedTo: l.assignedTo ? { name: (l.assignedTo as unknown as { name: string }).name } : null,
    createdBy: l.createdBy ? { name: (l.createdBy as unknown as { name: string }).name } : null,
    status: l.status as LeadStatus,
    priority: l.priority as LeadPriority,
    followUpAt: l.followUpAt ? l.followUpAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    lastActivityAt: l.lastActivityAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <LeadEventRefresher userId={session.user.id} role="agent" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Leads</h1>
          <p className="text-sm text-slate-500 mt-1">{leads.length} lead{leads.length !== 1 ? "s" : ""} assigned to you</p>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5">
          <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
          <p className="text-sm font-medium text-rose-700">
            {overdue.length} overdue follow-up{overdue.length > 1 ? "s" : ""} — action needed
          </p>
        </div>
      )}
      {stale.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <Clock size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm font-medium text-amber-700">
            {stale.length} stale lead{stale.length > 1 ? "s" : ""} with no activity in 7 days
          </p>
        </div>
      )}

      <LeadTable leads={serialized} role="agent" basePath="/agent/leads" />
    </div>
  );
}
