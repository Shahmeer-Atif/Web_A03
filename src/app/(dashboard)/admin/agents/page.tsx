import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Users } from "lucide-react";

export default async function AgentsPage() {
  await connectDB();
  const agents = await User.find({ role: "agent" }).select("name email isActive createdAt").sort({ name: 1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
          <p className="text-sm text-slate-500 mt-1">{agents.length} agent{agents.length !== 1 ? "s" : ""} registered</p>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Users size={32} className="text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No agents yet</p>
          <p className="text-xs text-slate-400 mt-1">Agents can sign up at /signup</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Agent", "Email", "Status", "Joined"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map(a => (
                <tr key={a._id.toString()} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                        {a.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{a.email}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${a.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {a.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
