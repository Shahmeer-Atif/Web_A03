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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fail("NO_AI", "AI suggestions not configured", 503);

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 1 } as Intl.NumberFormatOptions).format(n);

  const prompt = `You are a real estate CRM assistant. Write a short, friendly follow-up message an agent can send to this lead.

Lead details:
- Name: ${lead.name}
- Property interest: ${lead.propertyInterest}
- Budget: PKR ${fmt(lead.budget)}
- Source: ${lead.source}
- Status: ${lead.status}
- Notes: ${lead.notes ?? "none"}

Write ONE WhatsApp/SMS message (2-3 sentences max). Be professional, specific to their interest, and end with a clear call to action. Output only the message text, no explanation.`;

  const result = await model.generateContent(prompt);
  const suggestion = result.response.text().trim();

  return ok({ suggestion });
}
