// Lead validation schemas. createLeadSchema is used for POST; the two
// update schemas reflect what each role is allowed to touch:
//   - adminUpdateSchema: any field
//   - agentUpdateSchema: only status, notes, followUpAt (their own lead)

import { z } from "zod";

const SOURCES = ["facebook", "walk-in", "website", "referral", "other"] as const;
const STATUSES = ["new", "contacted", "in-progress", "closed-won", "closed-lost"] as const;

// Phone: accepts 03xxxxxxxxx, 923xxxxxxxxx, or +923xxxxxxxxx formats.
const phoneRegex = /^(\+?92|0)[0-9]{10}$/;

export const createLeadSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().regex(phoneRegex, "Enter a Pakistani phone (e.g. 03001234567)"),
  propertyInterest: z.string().trim().min(2, "Describe the property interest"),
  budget: z.number({ error: "Budget must be a number" }).int().positive("Budget must be positive"),
  source: z.enum(SOURCES, { error: "Invalid source" }),
  notes: z.string().trim().optional().default(""),
  assignedTo: z.string().nullable().optional(),
  followUpAt: z.string().datetime().nullable().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

// Admin can change any writeable field after creation.
export const adminUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().regex(phoneRegex).optional(),
  propertyInterest: z.string().trim().min(2).optional(),
  budget: z.number().int().positive().optional(),
  source: z.enum(SOURCES).optional(),
  status: z.enum(STATUSES).optional(),
  notes: z.string().trim().optional(),
  assignedTo: z.string().nullable().optional(),
  followUpAt: z.string().datetime().nullable().optional(),
});

export type AdminUpdateInput = z.infer<typeof adminUpdateSchema>;

// Agents can only update status, notes, and their follow-up date.
export const agentUpdateSchema = z.object({
  status: z.enum(STATUSES).optional(),
  notes: z.string().trim().optional(),
  followUpAt: z.string().datetime().nullable().optional(),
});

export type AgentUpdateInput = z.infer<typeof agentUpdateSchema>;
