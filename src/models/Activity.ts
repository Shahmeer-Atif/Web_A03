// Append-only audit log. Every mutation to a lead writes one document here.
// actorName is denormalized so the timeline still renders correctly if the
// agent account is later deleted or renamed.

import mongoose, { Schema, type Model } from "mongoose";
import type { ActivityAction } from "@/types";

export interface ActivityDoc {
  _id: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  action: ActivityAction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta: Record<string, any>;
  createdAt: Date;
}

const activitySchema = new Schema<ActivityDoc>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    action: {
      type: String,
      enum: [
        "created",
        "status_changed",
        "assigned",
        "reassigned",
        "note_added",
        "followup_set",
        "priority_changed",
        "deleted",
      ] as ActivityAction[],
      required: true,
    },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Compound index: leadId + createdAt DESC — the primary query pattern for timelines.
activitySchema.index({ leadId: 1, createdAt: -1 });

export const Activity: Model<ActivityDoc> =
  (mongoose.models.Activity as Model<ActivityDoc>) ||
  mongoose.model<ActivityDoc>("Activity", activitySchema);
