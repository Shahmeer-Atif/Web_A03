import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import LeadTable from "@/components/leads/LeadTable";
import type { LeadPriority, LeadStatus } from "@/types";
import mongoose from "mongoose";

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

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">My Leads</h1>

      {overdue.length > 0 && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          ⚠ {overdue.length} overdue follow-up{overdue.length > 1 ? "s" : ""}
        </div>
      )}
      {stale.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          ⏳ {stale.length} stale lead{stale.length > 1 ? "s" : ""} (no activity in 7 days)
        </div>
      )}

      <LeadTable
        leads={leads.map(l => ({ ...l, _id: l._id.toString(), status: l.status as LeadStatus, priority: l.priority as LeadPriority, assignedTo: l.assignedTo as never })) as never}
        role="agent"
        basePath="/agent/leads"
      />
    </div>
  );
}
