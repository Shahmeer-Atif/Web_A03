import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { Activity } from "@/models/Activity";
import PriorityBadge from "@/components/leads/PriorityBadge";
import StatusBadge from "@/components/leads/StatusBadge";
import WhatsAppButton from "@/components/leads/WhatsAppButton";
import ActivityTimeline from "@/components/leads/ActivityTimeline";
import LeadDetailActions from "@/components/leads/LeadDetailActions";
import AssignAgent from "@/components/leads/AssignAgent";
import { format } from "date-fns";
import type { LeadPriority, LeadStatus } from "@/types";

export default async function AdminLeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();

  const [lead, activities, session] = await Promise.all([
    Lead.findById(id).populate("assignedTo", "name email").populate("createdBy", "name").lean(),
    Activity.find({ leadId: id }).sort({ createdAt: -1 }).limit(50).lean(),
    auth(),
  ]);

  if (!lead) notFound();

  const fmt = (n: number) => new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{lead.name}</h1>
          <p className="text-sm text-zinc-500">{lead.email} · {lead.phone}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <PriorityBadge priority={lead.priority as LeadPriority} />
          <StatusBadge status={lead.status as LeadStatus} />
          <WhatsAppButton phone={lead.phone} name={lead.name} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Budget", `PKR ${fmt(lead.budget)}`],
          ["Source", lead.source],
          ["Interest", lead.propertyInterest],
          ["Score", `${lead.score}/100`],
          ["Assigned to", (lead.assignedTo as unknown as { name: string } | null)?.name ?? "Unassigned"],
          ["Created by", (lead.createdBy as unknown as { name: string })?.name],
          ["Created", format(lead.createdAt, "dd MMM yyyy")],
          ["Follow-up", lead.followUpAt ? format(lead.followUpAt, "dd MMM yyyy HH:mm") : "—"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="text-xs text-zinc-400 uppercase tracking-wide">{k}</div>
            <div className="mt-1 text-sm font-medium">{v}</div>
          </div>
        ))}
      </div>

      {lead.notes && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">Notes</p>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}

      <AssignAgent
        leadId={id}
        currentAgentId={(lead.assignedTo as unknown as { _id: string } | null)?._id?.toString() ?? null}
      />

      <LeadDetailActions
        lead={JSON.parse(JSON.stringify(lead))}
        role="admin"
        userId={session?.user?.id ?? ""}
      />

      <ActivityTimeline activities={JSON.parse(JSON.stringify(activities))} />
    </div>
  );
}
