"use client";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, AlertCircle, Clock } from "lucide-react";
import LeadTable from "@/components/leads/LeadTable";
import LeadFilters from "@/components/leads/LeadFilters";
import LeadForm from "@/components/leads/LeadForm";
import { TableSkeleton } from "@/components/ui/Skeleton";
import ExportButton from "@/components/leads/ExportButton";
import { useLeadEvents } from "@/hooks/useLeadEvents";

interface Lead { _id: string; name: string; email: string; phone: string; propertyInterest: string; budget: number; status: string; priority: string; score: number; assignedTo?: { name: string } | null; createdAt: string; followUpAt?: string | null; lastActivityAt?: string }

function LeadsContent() {
  const sp = useSearchParams();
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const isFirstLoad = useRef(true);

  const fetch_ = useCallback(async (silent = false) => {
    if (!silent) setInitialLoading(true);
    const res = await fetch(`/api/leads?${sp.toString()}`);
    const json = await res.json();
    if (json.ok) { setLeads(json.data.leads); setTotal(json.data.total); }
    setInitialLoading(false);
  }, [sp]);

  useEffect(() => {
    isFirstLoad.current = true;
    fetch_(false);
  }, [fetch_]);

  // Background refresh — no skeleton flash
  useLeadEvents({
    userId: session?.user?.id ?? "",
    role: "admin",
    onEvent: () => fetch_(true),
  });

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) toast.success("Lead deleted");
    else toast.error("Failed to delete lead");
    fetch_(true);
  };

  const overdue = leads.filter(l => l.followUpAt && new Date(l.followUpAt) < new Date() && !l.status.startsWith("closed"));
  const stale = leads.filter(l => !overdue.includes(l) && new Date(l.lastActivityAt ?? l.createdAt) < new Date(Date.now() - 7 * 86400_000) && !l.status.startsWith("closed"));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">{total} total</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton />
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> New Lead
          </button>
        </div>
      </div>

      <Suspense><LeadFilters /></Suspense>

      {overdue.length > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertCircle size={15} className="text-rose-500 shrink-0" />
          <p className="text-sm font-medium text-rose-700">{overdue.length} overdue follow-up{overdue.length > 1 ? "s" : ""} — action needed</p>
        </div>
      )}
      {stale.length > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock size={15} className="text-amber-500 shrink-0" />
          <p className="text-sm font-medium text-amber-700">{stale.length} stale lead{stale.length > 1 ? "s" : ""} with no activity in 7 days</p>
        </div>
      )}

      {initialLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <LeadTable
          leads={leads as never}
          role="admin"
          basePath="/admin/leads"
          onEdit={(l) => { setEditing(l as never); setShowForm(true); }}
          onDelete={handleDelete}
        />
      )}

      {showForm && (
        <LeadForm
          role="admin"
          existing={editing ? { ...editing, assignedTo: typeof editing.assignedTo === "object" ? (editing.assignedTo as { _id?: string })?._id : editing.assignedTo } as never : undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => fetch_(true)}
        />
      )}
    </div>
  );
}

export default function AdminLeadsPage() {
  return <Suspense><LeadsContent /></Suspense>;
}
