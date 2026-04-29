// Pure scoring function — no side effects, no DB calls.
// Kept separate so it can be unit-tested and reused in the pre-save hook
// and in the PATCH route without duplication.
//
// Why a pre-save hook rather than recomputing only in the route?
// The hook guarantees the stored priority/score is always consistent with
// the current budget, even if the document is modified from the seed script
// or a future admin CLI.

import type { LeadPriority } from "@/types";

export type ScoreResult = {
  priority: LeadPriority;
  score: number;
};

export function computeScore(
  budget: number,
  source: string,
  followUpAt?: Date | null,
): ScoreResult {
  let base: number;
  let priority: LeadPriority;

  if (budget > 20_000_000) {
    priority = "high";
    base = 90;
  } else if (budget >= 10_000_000) {
    priority = "medium";
    base = 60;
  } else {
    priority = "low";
    base = 30;
  }

  // Bonus: walk-in and referral leads tend to convert better.
  if (source === "walk-in" || source === "referral") base += 10;

  // Bonus: a future follow-up is scheduled and isn't overdue yet.
  if (followUpAt && followUpAt > new Date()) base += 5;

  return { priority, score: Math.min(base, 100) };
}
