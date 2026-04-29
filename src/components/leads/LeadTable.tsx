"use client";
import Link from "next/link";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import WhatsAppButton from "./WhatsAppButton";
import type { LeadPriority, LeadStatus } from "@/types";
import { format } from "date-fns";

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  budget: number;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  assignedTo?: { name: string } | null;
  createdAt: string;
  followUpAt?: string | null;
}

interface Props {
  leads: Lead[];
  role: "admin" | "agent";
  basePath: string;
  onEdit?: (lead: Lead) => void;
  onDelete?: (id: string) => void;
}

export default function LeadTable({ leads, role, basePath, onEdit, onDelete }: Props) {
  if (!leads.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
        <p className="text-sm font-medium text-zinc-500">No leads yet</p>
        <p className="mt-1 text-xs text-zinc-400">Create your first lead to get started.</p>
      </div>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 1 }).format(n);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
          <tr>
            {["Name","Contact","Property / Budget","Status","Priority","Assigned","Created","Actions"].map(h => (
              <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {leads.map(lead => (
            <tr key={lead._id} className={`hover:bg-zinc-50 ${lead.priority === "high" ? "bg-rose-50/40" : ""}`}>
              <td className="px-4 py-3">
                <Link href={`${basePath}/${lead._id}`} className="font-medium text-zinc-900 hover:underline">{lead.name}</Link>
              </td>
              <td className="px-4 py-3 text-zinc-600">
                <div>{lead.email}</div>
                <WhatsAppButton phone={lead.phone} name={lead.name} />
              </td>
              <td className="px-4 py-3">
                <div className="text-zinc-700">{lead.propertyInterest}</div>
                <div className="text-xs text-zinc-500">PKR {fmt(lead.budget)}</div>
              </td>
              <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
              <td className="px-4 py-3">
                <PriorityBadge priority={lead.priority} />
                <div className="text-xs text-zinc-400 mt-0.5">score {lead.score}</div>
              </td>
              <td className="px-4 py-3 text-zinc-600">{lead.assignedTo?.name ?? <span className="text-zinc-400">—</span>}</td>
              <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{format(new Date(lead.createdAt), "dd MMM yy")}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button onClick={() => onEdit(lead)} className="text-xs text-blue-600 hover:underline">Edit</button>
                  )}
                  {role === "admin" && onDelete && (
                    <button
                      onClick={() => { if (confirm("Delete this lead?")) onDelete(lead._id); }}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
