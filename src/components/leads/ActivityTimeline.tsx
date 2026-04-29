import { format } from "date-fns";
import type { ActivityAction } from "@/types";

interface Activity {
  _id: string;
  actorName: string;
  action: ActivityAction;
  meta: Record<string, unknown>;
  createdAt: string;
}

const icons: Record<ActivityAction, string> = {
  created: "🟢", status_changed: "🔄", assigned: "👤", reassigned: "🔀",
  note_added: "📝", followup_set: "📅", priority_changed: "⚡", deleted: "🗑️",
};

const describe = (a: Activity) => {
  const { action, meta } = a;
  if (action === "status_changed") return `Status: ${meta.from} → ${meta.to}`;
  if (action === "assigned") return `Assigned to agent`;
  if (action === "reassigned") return `Reassigned to another agent`;
  if (action === "note_added") return `Note updated`;
  if (action === "followup_set") return `Follow-up scheduled`;
  if (action === "priority_changed") return `Priority: ${meta.from} → ${meta.to}`;
  if (action === "created") return `Lead created (priority: ${meta.priority})`;
  if (action === "deleted") return `Lead deleted`;
  return action;
};

export default function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">Activity timeline</h2>
      {!activities.length && <p className="text-sm text-zinc-400">No activity yet.</p>}
      <ol className="relative border-l border-zinc-200 space-y-4 pl-5">
        {activities.map(a => (
          <li key={a._id} className="relative">
            <span className="absolute -left-6 top-0.5 text-base">{icons[a.action] ?? "•"}</span>
            <p className="text-sm text-zinc-800">{describe(a)}</p>
            <p className="text-xs text-zinc-400">{a.actorName} · {format(new Date(a.createdAt), "dd MMM yyyy HH:mm")}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
