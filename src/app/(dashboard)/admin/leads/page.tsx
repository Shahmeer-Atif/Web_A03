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
