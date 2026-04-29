// Lead is the core entity. priority + score are derived from budget/source/
// followUpAt but stored so the DB can sort/filter on them without a full
// collection scan. The pre-save hook keeps them in sync whenever those
// three fields change.

import mongoose, { Schema, type Model } from "mongoose";
import { computeScore } from "@/lib/scoring";
import type { LeadStatus, LeadPriority, LeadSource } from "@/types";

export interface LeadDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  budget: number;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  notes: string;
  assignedTo: mongoose.Types.ObjectId | null;
  followUpAt: Date | null;
  lastActivityAt: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<LeadDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    // Stored as digits-only with country code: 923001234567
    phone: { type: String, required: true, trim: true },
    propertyInterest: { type: String, required: true, trim: true },
    budget: { type: Number, required: true, min: 0 },
    source: {
      type: String,
      enum: ["facebook", "walk-in", "website", "referral", "other"] as LeadSource[],
      default: "other",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "in-progress", "closed-won", "closed-lost"] as LeadStatus[],
      default: "new",
      index: true,
    },
    // Derived + stored — recomputed by pre-save when budget/source/followUpAt change.
    priority: {
      type: String,
      enum: ["high", "medium", "low"] as LeadPriority[],
      default: "low",
      index: true,
    },
    score: { type: Number, default: 30 },
    notes: { type: String, default: "" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    followUpAt: { type: Date, default: null, index: true },
    lastActivityAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

leadSchema.pre("save", function recomputeScore() {
  if (
    this.isModified("budget") ||
    this.isModified("source") ||
    this.isModified("followUpAt") ||
    this.isNew
  ) {
    const { priority, score } = computeScore(
      this.budget,
      this.source,
      this.followUpAt,
    );
    this.priority = priority;
    this.score = score;
  }
});

// Normalize phone on every save: keep only digits, prepend 92 if starts with 0.
leadSchema.pre("save", function normalizePhone() {
  if (this.isModified("phone") || this.isNew) {
    let digits = this.phone.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = "92" + digits.slice(1);
    if (!digits.startsWith("92")) digits = "92" + digits;
    this.phone = digits;
  }
});

export const Lead: Model<LeadDoc> =
  (mongoose.models.Lead as Model<LeadDoc>) ||
  mongoose.model<LeadDoc>("Lead", leadSchema);
