import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { Users, TrendingUp, AlertCircle, Plus, ArrowRight } from "lucide-react";

export default async function AdminHome() {
  await connectDB();
  const [total, high, newLeads, inProgress] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ priority: "high" }),
    Lead.countDocuments({ status: "new" }),
    Lead.countDocuments({ status: "in-progress" }),
  ]);

  const stats = [
    { label: "Total Leads", value: total, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "High Priority", value: high, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    { label: "New / Uncontacted", value: newLeads, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "In Progress", value: inProgress, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back — here's your CRM overview</p>
        </div>
        <Link href="/admin/leads" className="btn-primary">
          <Plus size={16} /> New Lead
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className={`card p-5 border ${s.border}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
              <div className={`rounded-lg p-2 ${s.bg}`}>
                <s.icon size={16} className={s.color} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { href: "/admin/leads", label: "Manage Leads", desc: "View, create and assign leads", primary: true },
          { href: "/admin/agents", label: "Manage Agents", desc: "See all agent accounts", primary: false },
          { href: "/admin/analytics", label: "Analytics", desc: "Charts, conversion rates & performance", primary: false },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`card p-5 flex items-center justify-between group hover:shadow-md transition-shadow ${item.primary ? "border-emerald-200 bg-emerald-50" : ""}`}
          >
            <div>
              <p className={`font-semibold text-sm ${item.primary ? "text-emerald-800" : "text-slate-800"}`}>{item.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );
}
