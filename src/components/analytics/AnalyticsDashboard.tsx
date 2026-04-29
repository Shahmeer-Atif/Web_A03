"use client";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface ByAgent {
  agentName: string;
  total: number;
  closed: number;
  inProgress: number;
  conversionRate: number;
}

interface Props {
  totalLeads: number;
  newThisWeek: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byAgent: ByAgent[];
}

const STATUS_COLORS: Record<string, string> = {
  new: "#6366f1",
  contacted: "#3b82f6",
  "in-progress": "#f59e0b",
  "closed-won": "#22c55e",
  "closed-lost": "#ef4444",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#6366f1",
};

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}

export default function AnalyticsDashboard({ totalLeads, newThisWeek, byStatus, byPriority, byAgent }: Props) {
  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(byPriority).map(([name, value]) => ({ name, value }));

  const closedWon = byStatus["closed-won"] ?? 0;
  const conversionRate = totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total leads" value={totalLeads} />
        <StatCard label="New this week" value={newThisWeek} />
        <StatCard label="Closed won" value={closedWon} />
        <StatCard label="Conversion rate" value={`${conversionRate}%`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status donut */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-zinc-700">Leads by status</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                {statusData.map(entry => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority bar */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-zinc-700">Leads by priority</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priorityData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {priorityData.map(entry => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent performance table */}
      {byAgent.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-700">Agent performance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-400">
                <tr>
                  {["Agent", "Total", "In progress", "Closed won", "Conversion"].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {byAgent.map(a => (
                  <tr key={a.agentName} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-800">{a.agentName}</td>
                    <td className="px-5 py-3 text-zinc-600">{a.total}</td>
                    <td className="px-5 py-3 text-zinc-600">{a.inProgress}</td>
                    <td className="px-5 py-3 text-zinc-600">{a.closed}</td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${a.conversionRate >= 50 ? "text-green-600" : a.conversionRate >= 20 ? "text-amber-600" : "text-zinc-500"}`}>
                        {a.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
