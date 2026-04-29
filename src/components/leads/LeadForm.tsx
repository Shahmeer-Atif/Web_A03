"use client";
// Modal form for create + edit. Role determines which fields are shown.

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createLeadSchema, type CreateLeadInput } from "@/lib/validators/lead";

interface Agent { _id: string; name: string; email: string }
interface Props {
  onClose: () => void;
  onSaved: () => void;
  role: "admin" | "agent";
  existing?: Partial<CreateLeadInput & { _id: string }>;
}

const SOURCES = ["facebook","walk-in","website","referral","other"] as const;

export default function LeadForm({ onClose, onSaved, role, existing }: Props) {
  const isEdit = !!existing?._id;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: existing ?? {},
  });

  useEffect(() => {
    if (role === "admin") fetch("/api/users").then(r => r.json()).then(j => j.ok && setAgents(j.data));
  }, [role]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (values: any) => {
    setServerError(null);
    const url = isEdit ? `/api/leads/${existing!._id}` : "/api/leads";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const json = await res.json();
    if (!json.ok) {
      const msg = json.error?.message ?? "Failed";
      setServerError(msg);
      toast.error(msg);
      return;
    }
    toast.success(isEdit ? "Lead updated" : "Lead created");
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit lead" : "New lead"}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <F label="Full name" err={errors.name?.message}><input className="input" {...register("name")} /></F>
          <F label="Email" err={errors.email?.message}><input type="email" className="input" {...register("email")} /></F>
          <F label="Phone (e.g. 03001234567)" err={errors.phone?.message}><input className="input" {...register("phone")} /></F>
          <F label="Property interest" err={errors.propertyInterest?.message}><input className="input" {...register("propertyInterest")} /></F>
          <F label="Budget (PKR)" err={errors.budget?.message}>
            <input type="number" className="input" {...register("budget", { valueAsNumber: true })} />
          </F>
          <F label="Source" err={errors.source?.message}>
            <select className="input" {...register("source")}>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </F>
          <F label="Notes" err={errors.notes?.message}>
            <textarea rows={2} className="input" {...register("notes")} />
          </F>
          <F label="Follow-up date" err={errors.followUpAt?.message}>
            <input type="datetime-local" className="input" {...register("followUpAt")} />
          </F>
          {role === "admin" && (
            <F label="Assign to agent" err={undefined}>
              <select className="input" {...register("assignedTo")}>
                <option value="">Unassigned</option>
                {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </F>
          )}

          {serverError && <p className="text-sm text-rose-600">{serverError}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function F({ label, err, children }: { label: string; err?: unknown; children: React.ReactNode }) {
  const msg = typeof err === "string" ? err : undefined;
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
      {msg && <span className="text-xs text-rose-600">{msg}</span>}
    </label>
  );
}
