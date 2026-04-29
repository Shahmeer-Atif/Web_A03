import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export default async function AgentsPage() {
  await connectDB();
  const agents = await User.find({ role: "agent" }).select("name email isActive createdAt").sort({ name: 1 }).lean();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Agents</h1>
      <div className="rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              {["Name","Email","Status"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {agents.map(a => (
              <tr key={a._id.toString()}>
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3 text-zinc-600">{a.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                    {a.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
