import "server-only";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { requireUser } from "@/lib/requireUser";
import { ok, fail } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;
  void user;

  const { id } = await params;
  await connectDB();

  const lead = await Lead.findById(id).populate("assignedTo", "name").lean();
  if (!lead) return fail("NOT_FOUND", "Lead not found", 404);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fail("NO_AI", "AI suggestions not configured", 503);

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const fmt = (n: number) => new Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 1 } as Intl.NumberFormatOptions).format(n);

  const prompt = `You are a real estate CRM assistant. Write a short, friendly follow-up message an agent can send to this lead.

Lead details:
- Name: ${lead.name}
- Property interest: ${lead.propertyInterest}
- Budget: PKR ${fmt(lead.budget)}
- Source: ${lead.source}
- Status: ${lead.status}
- Notes: ${lead.notes ?? "none"}

Write ONE WhatsApp/SMS message (2-3 sentences max). Be professional, specific to their interest, and end with a clear call to action. Do not include any explanation or preamble — only the message text.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const suggestion = message.content[0].type === "text" ? message.content[0].text.trim() : "";
  return ok({ suggestion });
}
