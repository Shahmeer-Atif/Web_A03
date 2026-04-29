// GET /api/analytics — admin only.
// Returns aggregate stats: totals, byStatus, byPriority, byAgent.

import "server-only";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { requireUser } from "@/lib/requireUser";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const { user, error } = await requireUser("admin");
  if (error) return error;
  void user;

  await connectDB();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);

  const [
    totalLeads,
    newThisWeek,
    byStatusRaw,
    byPriorityRaw,
    byAgentRaw,
  ] = await Promise.all([
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
          closed: {
            $sum: {
              $cond: [{ $eq: ["$status", "closed-won"] }, 1, 0],
            },
          },
          inProgress: {
            $sum: {
              $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "agent",
        },
      },
      { $unwind: "$agent" },
      {
        $project: {
          agentName: "$agent.name",
          total: 1,
          closed: 1,
          inProgress: 1,
          conversionRate: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ["$closed", "$total"] }, 100] }, 1] },
            ],
          },
        },
      },
      { $sort: { conversionRate: -1 } },
    ]),
  ]);

  const byStatus = Object.fromEntries(byStatusRaw.map(r => [r._id, r.count]));
  const byPriority = Object.fromEntries(byPriorityRaw.map(r => [r._id, r.count]));

  return ok({
    totalLeads,
    newThisWeek,
    byStatus,
    byPriority,
    byAgent: byAgentRaw.map(r => ({
      agentName: r.agentName as string,
      total: r.total as number,
      closed: r.closed as number,
      inProgress: r.inProgress as number,
      conversionRate: r.conversionRate as number,
    })),
  });
}
