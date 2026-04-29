"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Agent {
  _id: string;
  name: string;
  email: string;
}

interface Props {
  leadId: string;
  currentAgentId?: string | null;
}

export default function AssignAgent({ leadId, currentAgentId }: Props) {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState(currentAgentId ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then(r => r.json())
      .then(j => { if (j.ok) setAgents(j.data); });
  }, []);

  const assign = async () => {
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/leads/${leadId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: selected || null }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) {
      toast.success("Agent assigned");
      router.refresh();
    } else {
      toast.error(json.error?.message ?? "Failed to assign");
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Assign agent</p>
      <div className="flex gap-2">
        <select
          className="input flex-1"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">— Unassigned —</option>
          {agents.map(a => (
            <option key={a._id} value={a._id}>{a.name} ({a.email})</option>
          ))}
        </select>
        <button className="btn-primary" onClick={assign} disabled={saving}>
          {saving ? "Saving…" : "Assign"}
        </button>
      </div>
    </div>
  );
}
