import type { LeadStatus } from "@/types";

const styles: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-purple-100 text-purple-700",
  "in-progress": "bg-yellow-100 text-yellow-700",
  "closed-won": "bg-emerald-100 text-emerald-700",
  "closed-lost": "bg-zinc-100 text-zinc-500",
};

const labels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  "in-progress": "In Progress",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
};

export default function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
