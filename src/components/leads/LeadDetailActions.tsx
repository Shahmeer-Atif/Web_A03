"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import LeadForm from "./LeadForm";
import type { CreateLeadInput } from "@/lib/validators/lead";

interface Props { lead: Record<string, unknown>; role: "admin" | "agent"; userId: string }

export default function LeadDetailActions({ lead, role }: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this lead permanently?")) return;
    const res = await fetch(`/api/leads/${lead._id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) { toast.success("Lead deleted"); router.push(role === "admin" ? "/admin/leads" : "/agent"); }
    else toast.error(json.error?.message ?? "Failed to delete");
  };

  return (
    <div className="flex gap-2">
      <button className="btn-secondary" onClick={() => setShowEdit(true)}>
        <Pencil size={14} /> Edit Lead
      </button>
      {role === "admin" && (
        <button className="btn-danger" onClick={handleDelete}>
          <Trash2 size={14} /> Delete
        </button>
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
