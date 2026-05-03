import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { Activity } from "@/models/Activity";
import Link from "next/link";
import PriorityBadge from "@/components/leads/PriorityBadge";
import StatusBadge from "@/components/leads/StatusBadge";
import WhatsAppButton from "@/components/leads/WhatsAppButton";
import ActivityTimeline from "@/components/leads/ActivityTimeline";
import LeadDetailActions from "@/components/leads/LeadDetailActions";
import FollowUpPicker from "@/components/leads/FollowUpPicker";
import AISuggest from "@/components/leads/AISuggest";
import StatusUpdater from "@/components/leads/StatusUpdater";
import { format } from "date-fns";
import type { LeadPriority, LeadStatus } from "@/types";
import { ChevronLeft } from "lucide-react";

export default async function AgentLeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const [lead, activities] = await Promise.all([
    Lead.findById(id).populate("assignedTo", "name email").populate("createdBy", "name").lean(),
    Activity.find({ leadId: id }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);

  if (!lead) notFound();
  const assignedId = lead.assignedTo
    ? (lead.assignedTo as unknown as { _id: { toString(): string } })._id?.toString() ?? lead.assignedTo.toString()
    : null;
  if (assignedId !== session.user.id) redirect("/agent");

  const fmt = (n: number) => new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n);

  const infoFields = [
    { label: "Budget", value: `PKR ${fmt(lead.budget)}` },
    { label: "Property Interest", value: lead.propertyInterest },
    { label: "Source", value: lead.source },
    { label: "Score", value: `${lead.score} / 100` },
    { label: "Created", value: format(lead.createdAt, "dd MMM yyyy") },
    { label: "Follow-up", value: lead.followUpAt ? format(lead.followUpAt, "dd MMM yyyy HH:mm") : "—" },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/agent" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
          <ChevronLeft size={16} /> Back to My Leads
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{lead.email} · {lead.phone}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PriorityBadge priority={lead.priority as LeadPriority} />
            <StatusBadge status={lead.status as LeadStatus} />
            <WhatsAppButton phone={lead.phone} name={lead.name} />
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {infoFields.map(({ label, value }) => (
          <div key={label} className="card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1.5 text-sm font-semibold text-slate-800 truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="card p-5">
          <p className="section-title mb-2">Notes</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
        </div>
      )}

      {/* Status updater — most important action for agent */}
      <StatusUpdater leadId={id} current={lead.status} />

      {/* Follow-up and AI side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FollowUpPicker leadId={id} current={lead.followUpAt ? lead.followUpAt.toISOString() : null} />
        <AISuggest leadId={id} />
      </div>

      <LeadDetailActions lead={JSON.parse(JSON.stringify(lead))} role="agent" userId={session.user.id} />

      {/* Timeline */}
      <div className="card p-5">
        <ActivityTimeline activities={JSON.parse(JSON.stringify(activities))} />
      </div>
    </div>
  );
}
