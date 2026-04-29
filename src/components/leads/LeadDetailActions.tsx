"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LeadForm from "./LeadForm";
import type { CreateLeadInput } from "@/lib/validators/lead";

interface Props {
  lead: Record<string, unknown>;
  role: "admin" | "agent";
  userId: string;
}

export default function LeadDetailActions({ lead, role }: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this lead permanently?")) return;
    await fetch(`/api/leads/${lead._id}`, { method: "DELETE" });
    router.push(role === "admin" ? "/admin/leads" : "/agent");
  };

  return (
    <div className="flex gap-2">
      <button className="btn-secondary" onClick={() => setShowEdit(true)}>Edit lead</button>
      {role === "admin" && (
        <button className="btn-secondary text-rose-600 border-rose-200" onClick={handleDelete}>Delete</button>
      )}
      {showEdit && (
        <LeadForm
          role={role}
          existing={lead as unknown as Partial<CreateLeadInput & { _id: string }>}
          onClose={() => setShowEdit(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
