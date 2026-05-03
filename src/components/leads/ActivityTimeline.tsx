import { formatDistanceToNow, format } from "date-fns";
import type { ActivityAction } from "@/types";
import { CheckCircle2, RefreshCw, UserCheck, ArrowLeftRight, FileText, Calendar, Zap, Trash2 } from "lucide-react";

interface Activity {
  _id: string;
  actorName: string;
  action: ActivityAction;
  meta: Record<string, unknown>;
  createdAt: string;
}

const ICONS: Record<ActivityAction, React.ElementType> = {
  created: CheckCircle2,
  status_changed: RefreshCw,
  assigned: UserCheck,
  reassigned: ArrowLeftRight,
  note_added: FileText,
  followup_set: Calendar,
  priority_changed: Zap,
  deleted: Trash2,
};

const COLORS: Record<ActivityAction, string> = {
  created: "bg-emerald-100 text-emerald-600",
  status_changed: "bg-blue-100 text-blue-600",
  assigned: "bg-violet-100 text-violet-600",
  reassigned: "bg-amber-100 text-amber-600",
  note_added: "bg-slate-100 text-slate-600",
  followup_set: "bg-cyan-100 text-cyan-600",
  priority_changed: "bg-orange-100 text-orange-600",
  deleted: "bg-rose-100 text-rose-600",
};

const describe = (a: Activity) => {
  const { action, meta } = a;
  if (action === "status_changed") return `Status changed: ${meta.from} → ${meta.to}`;
  if (action === "assigned") return `Lead assigned to agent`;
  if (action === "reassigned") return `Lead reassigned to another agent`;
  if (action === "note_added") return `Note updated`;
  if (action === "followup_set") return meta.to ? `Follow-up set for ${meta.to}` : `Follow-up cleared`;
  if (action === "priority_changed") return `Priority changed: ${meta.from} → ${meta.to}`;
  if (action === "created") return `Lead created with ${meta.priority} priority`;
  if (action === "deleted") return `Lead deleted`;
  return action;
};

export default function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Activity Timeline</h2>
      {activities.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No activity recorded yet.</p>
      ) : (
        <ol className="space-y-4">
          {activities.map((a, i) => {
            const Icon = ICONS[a.action] ?? CheckCircle2;
            const color = COLORS[a.action] ?? "bg-slate-100 text-slate-600";
            return (
              <li key={a._id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`rounded-full p-2 ${color} shrink-0`}>
                    <Icon size={13} />
                  </div>
                  {i < activities.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                </div>
                <div className="pb-4 pt-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{describe(a)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className="font-medium text-slate-500">{a.actorName}</span>
                    {" · "}
                    <span title={format(new Date(a.createdAt), "dd MMM yyyy HH:mm")}>
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
