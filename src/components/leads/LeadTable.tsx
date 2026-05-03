"use client";
import Link from "next/link";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import WhatsAppButton from "./WhatsAppButton";
import type { LeadPriority, LeadStatus } from "@/types";
import { format } from "date-fns";
import { Eye, Pencil, Trash2, Inbox } from "lucide-react";

interface Lead {
  _id: string; name: string; email: string; phone: string;
  propertyInterest: string; budget: number; status: LeadStatus;
  priority: LeadPriority; score: number;
  assignedTo?: { name: string } | null;
  createdAt: string; followUpAt?: string | null;
}

interface Props {
  leads: Lead[]; role: "admin" | "agent"; basePath: string;
  onEdit?: (lead: Lead) => void; onDelete?: (id: string) => void;
}

export default function LeadTable({ leads, role, basePath, onEdit, onDelete }: Props) {
  if (!leads.length) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <Inbox size={36} className="text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-slate-600">No leads yet</p>
        <p className="text-xs text-slate-400 mt-1">Create your first lead to get started.</p>
      </div>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 1 }).format(n);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Lead", "Contact", "Property / Budget", "Status", "Priority", role === "admin" ? "Assigned" : null, "Created", "Actions"]
                .filter(Boolean).map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map(lead => (
              <tr key={lead._id} className={`hover:bg-slate-50 transition-colors ${lead.priority === "high" ? "bg-rose-50/30" : ""}`}>
                <td className="px-5 py-4">
                  <Link href={`${basePath}/${lead._id}`} className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors">
                    {lead.name}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">Score: {lead.score}/100</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-slate-600 text-xs">{lead.email}</p>
                  <WhatsAppButton phone={lead.phone} name={lead.name} />
                </td>
                <td className="px-5 py-4">
                  <p className="text-slate-700 font-medium text-xs truncate max-w-[140px]">{lead.propertyInterest}</p>
                  <p className="text-xs text-slate-400 mt-0.5">PKR {fmt(lead.budget)}</p>
                </td>
                <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                <td className="px-5 py-4"><PriorityBadge priority={lead.priority} /></td>
                {role === "admin" && (
                  <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                    {lead.assignedTo?.name ?? <span className="text-slate-400 italic">Unassigned</span>}
                  </td>
                )}
                <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                  {format(new Date(lead.createdAt), "dd MMM yy")}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <Link href={`${basePath}/${lead._id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" title="View">
                      <Eye size={15} />
                    </Link>
                    {onEdit && (
                      <button onClick={() => onEdit(lead)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" title="Edit">
                        <Pencil size={15} />
                      </button>
                    )}
                    {role === "admin" && onDelete && (
                      <button
                        onClick={() => { if (confirm("Delete this lead?")) onDelete(lead._id); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
