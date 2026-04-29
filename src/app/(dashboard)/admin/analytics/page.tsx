import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export const dynamic = "force-dynamic";

async function getAnalytics() {
  await connectDB();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);

  const [totalLeads, newThisWeek, byStatusRaw, byPriorityRaw, byAgentRaw] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ createdAt: { $gte: weekAgo } }),
    Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Lead.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Lead.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: "$assignedTo",
          total: { $sum: 1 },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed-won"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
        },
      },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "agent" } },
      { $unwind: "$agent" },
      {
        $project: {
          agentName: "$agent.name",
          total: 1, closed: 1, inProgress: 1,
          conversionRate: {
            $cond: [
              { $eq: ["$total", 0] }, 0,
              { $round: [{ $multiply: [{ $divide: ["$closed", "$total"] }, 100] }, 1] },
            ],
          },
        },
      },
      { $sort: { conversionRate: -1 } },
    ]),
  ]);

  return {
    totalLeads,
    newThisWeek,
    byStatus: Object.fromEntries(byStatusRaw.map((r: { _id: string; count: number }) => [r._id, r.count])),
    byPriority: Object.fromEntries(byPriorityRaw.map((r: { _id: string; count: number }) => [r._id, r.count])),
    byAgent: byAgentRaw.map((r: { agentName: string; total: number; closed: number; inProgress: number; conversionRate: number }) => ({
      agentName: r.agentName,
      total: r.total,
      closed: r.closed,
      inProgress: r.inProgress,
      conversionRate: r.conversionRate,
    })),
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <AnalyticsDashboard {...data} />
    </div>
  );
}
