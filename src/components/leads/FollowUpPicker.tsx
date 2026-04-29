"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  leadId: string;
  current: string | null; // ISO string or null
}

export default function FollowUpPicker({ leadId, current }: Props) {
  const router = useRouter();
  // datetime-local needs "YYYY-MM-DDTHH:mm" format
  const toLocal = (iso: string | null) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : "";

  const [value, setValue] = useState(toLocal(current));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async () => {
    setSaving(true);
    setMsg("");
    const followUpAt = value ? new Date(value).toISOString() : null;
    const res = await fetch(`/api/leads/${leadId}/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpAt }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) {
      setMsg("Saved");
      router.refresh();
    } else {
      setMsg(json.error?.message ?? "Error");
    }
  };

  const clear = async () => {
    setValue("");
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/leads/${leadId}/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpAt: null }),
    });
    const json = await res.json();
    setSaving(false);
    setMsg(json.ok ? "Cleared" : (json.error?.message ?? "Error"));
    if (json.ok) router.refresh();
  };

  const isOverdue = current && new Date(current) < new Date();

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Follow-up date
        {isOverdue && <span className="ml-2 text-rose-500">⚠ Overdue</span>}
      </p>
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
          <button className="btn-secondary" onClick={clear} disabled={saving}>
            Clear
          </button>
        )}
      </div>
      {msg && <p className="text-xs text-zinc-500">{msg}</p>}
    </div>
  );
}
