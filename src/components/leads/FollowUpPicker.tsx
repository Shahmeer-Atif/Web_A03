"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, X } from "lucide-react";

export default function FollowUpPicker({ leadId, current }: { leadId: string; current: string | null }) {
  const router = useRouter();
  const toLocal = (iso: string | null) => iso ? new Date(iso).toISOString().slice(0, 16) : "";
  const [value, setValue] = useState(toLocal(current));
  const [saving, setSaving] = useState(false);
  const isOverdue = current && new Date(current) < new Date();

  const save = async () => {
    setSaving(true);
    const followUpAt = value ? new Date(value).toISOString() : null;
    const res = await fetch(`/api/leads/${leadId}/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpAt }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) { toast.success("Follow-up scheduled"); router.refresh(); }
    else toast.error(json.error?.message ?? "Failed");
  };

  const clear = async () => {
    setValue("");
    setSaving(true);
    const res = await fetch(`/api/leads/${leadId}/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpAt: null }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) { toast.success("Follow-up cleared"); router.refresh(); }
    else toast.error(json.error?.message ?? "Failed");
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title flex items-center gap-1.5">
          <Calendar size={13} />
          Follow-up Date
        </p>
        {isOverdue && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-600">
            Overdue
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="datetime-local"
          className="input flex-1"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "…" : "Set"}
        </button>
        {current && (
          <button className="btn-secondary px-3" onClick={clear} disabled={saving} title="Clear follow-up">
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
