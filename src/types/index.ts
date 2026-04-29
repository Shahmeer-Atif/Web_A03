// Shared cross-layer types. Keeping these in one file prevents the same
// union literals (status, priority, role, source) from drifting between
// the model, the zod validators, and the UI.

export type Role = "admin" | "agent";

export type LeadStatus =
  | "new"
  | "contacted"
  | "in-progress"
  | "closed-won"
  | "closed-lost";

export type LeadPriority = "high" | "medium" | "low";

export type LeadSource =
  | "facebook"
  | "walk-in"
  | "website"
  | "referral"
  | "other";

export type ActivityAction =
  | "created"
  | "status_changed"
  | "assigned"
  | "reassigned"
  | "note_added"
  | "followup_set"
  | "priority_changed"
  | "deleted";

// Standard API envelope. All routes return one of these so the client
// has a single shape to narrow on.
export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fields?: Record<string, string[]>;
      };
    };
