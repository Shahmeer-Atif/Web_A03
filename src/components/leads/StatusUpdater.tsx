"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";

const STATUSES = [
  { value: "new", label: "New", bg: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100", active: "bg-blue-600 text-white border-blue-600" },
  { value: "contacted", label: "Contacted", bg: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100", active: "bg-violet-600 text-white border-violet-600" },
  { value: "in-progress", label: "In Progress", bg: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100", active: "bg-amber-500 text-white border-amber-500" },
  { value: "closed-won", label: "Closed Won", bg: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100", active: "bg-emerald-600 text-white border-emerald-600" },
  { value: "closed-lost", label: "Closed Lost", bg: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100", active: "bg-rose-600 text-white border-rose-600" },
] as const;

export default function StatusUpdater({ leadId, current }: { leadId: string; current: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const update = async (status: string) => {
    if (status === current || saving) return;
    setSaving(true);
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) { toast.success(`Status → ${status}`); router.refresh(); }
    else toast.error(json.error?.message ?? "Failed");
  };

  return (
    <div className="card p-5">
      <p className="section-title mb-3">Update Status</p>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => {
          const isActive = current === s.value;
          return (
            <button
              key={s.value}
              onClick={() => update(s.value)}
              disabled={saving}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                isActive ? s.active : s.bg
              }`}
            >
              {isActive && <Check size={12} />}
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
