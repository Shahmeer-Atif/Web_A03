"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LeadTable from "@/components/leads/LeadTable";
import LeadFilters from "@/components/leads/LeadFilters";
import LeadForm from "@/components/leads/LeadForm";

interface Lead { _id: string; name: string; email: string; phone: string; propertyInterest: string; budget: number; status: string; priority: string; score: number; assignedTo?: { name: string } | null; createdAt: string; followUpAt?: string | null }

function LeadsContent() {
  const sp = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/leads?${sp.toString()}`);
    const json = await res.json();
    if (json.ok) { setLeads(json.data.leads); setTotal(json.data.total); }
    setLoading(false);
  }, [sp]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    fetch_();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-zinc-500">{total} total</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>+ New lead</button>
      </div>

      <Suspense><LeadFilters /></Suspense>

      {(() => {
        const overdue = leads.filter(l => l.followUpAt && new Date(l.followUpAt) < new Date() && !l.status.startsWith("closed"));
        const stale = leads.filter(l => !overdue.includes(l) && new Date((l as Lead & { lastActivityAt?: string }).lastActivityAt ?? l.createdAt) < new Date(Date.now() - 7 * 86400_000) && !l.status.startsWith("closed"));
        return (
          <>
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
          </>
        );
      })()}

      {loading ? (
        <p className="py-10 text-center text-sm text-zinc-400">Loading…</p>
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
          existing={editing ? { ...editing, assignedTo: typeof editing.assignedTo === "object" ? (editing.assignedTo as {_id?:string})?._id : editing.assignedTo } as never : undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={fetch_}
        />
      )}
    </div>
  );
}

export default function AdminLeadsPage() {
  return <Suspense><LeadsContent /></Suspense>;
}
