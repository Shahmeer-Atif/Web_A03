import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";

export default async function AdminHome() {
  await connectDB();
  const [total, high, newLeads] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ priority: "high" }),
    Lead.countDocuments({ status: "new" }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Leads", value: total, color: "text-blue-600" },
          { label: "High Priority", value: high, color: "text-rose-600" },
          { label: "New (uncontacted)", value: newLeads, color: "text-amber-600" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link href="/admin/leads" className="btn-primary">Manage Leads</Link>
        <Link href="/admin/agents" className="btn-secondary">Manage Agents</Link>
      </div>
    </div>
  );
}
