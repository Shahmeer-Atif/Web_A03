// Centralised activity logger. Every mutating route calls this so the audit
// trail is guaranteed to be consistent. Failures are non-fatal — we log
// and continue rather than letting a logging error kill the business action.

import "server-only";
import { Activity } from "@/models/Activity";
import type { ActivityAction } from "@/types";
import type mongoose from "mongoose";

interface LogActivityInput {
  leadId: mongoose.Types.ObjectId | string;
  actorId: string;
  actorName: string;
  action: ActivityAction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await Activity.create({
      leadId: input.leadId,
      actorId: input.actorId,
      actorName: input.actorName,
      action: input.action,
      meta: input.meta ?? {},
    });
  } catch (err) {
    // Don't let audit logging break the main request.
    console.error("[logActivity] Failed to write activity:", err);
  }
}
