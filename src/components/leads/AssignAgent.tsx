"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";

interface Agent { _id: string; name: string; email: string }

export default function AssignAgent({ leadId, currentAgentId }: { leadId: string; currentAgentId?: string | null }) {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState(currentAgentId ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(j => { if (j.ok) setAgents(j.data); });
  }, []);

  const assign = async () => {
    setSaving(true);
    const res = await fetch(`/api/leads/${leadId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: selected || null }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) { toast.success("Agent assigned"); router.refresh(); }
    else toast.error(json.error?.message ?? "Failed to assign");
  };

  return (
    <div className="card p-5">
      <p className="section-title mb-3">Assign Agent</p>
      <div className="flex gap-2">
        <select className="input flex-1" value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Unassigned</option>
          {agents.map(a => (
            <option key={a._id} value={a._id}>{a.name}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={assign} disabled={saving}>
          <UserCheck size={15} />
          {saving ? "Saving…" : "Assign"}
        </button>
      </div>
    </div>
  );
}
