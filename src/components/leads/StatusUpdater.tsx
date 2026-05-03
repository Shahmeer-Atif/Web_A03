"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in-progress", label: "In Progress" },
  { value: "closed-won", label: "Closed Won" },
  { value: "closed-lost", label: "Closed Lost" },
] as const;

const COLORS: Record<string, string> = {
  "new": "bg-blue-100 text-blue-700 border-blue-200",
  "contacted": "bg-purple-100 text-purple-700 border-purple-200",
  "in-progress": "bg-amber-100 text-amber-700 border-amber-200",
  "closed-won": "bg-green-100 text-green-700 border-green-200",
  "closed-lost": "bg-red-100 text-red-700 border-red-200",
};

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
    if (json.ok) {
      toast.success(`Status updated to "${status}"`);
      router.refresh();
    } else {
      toast.error(json.error?.message ?? "Failed to update status");
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Update Status</p>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => update(s.value)}
            disabled={saving}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all
              ${current === s.value
                ? `${COLORS[s.value]} ring-2 ring-offset-1 ring-current`
                : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
              }`}
          >
            {current === s.value && "✓ "}{s.label}
          </button>
        ))}
      </div>
      {saving && <p className="text-xs text-zinc-400">Saving…</p>}
    </div>
  );
}
