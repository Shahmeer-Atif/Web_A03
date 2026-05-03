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

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 1 } as Intl.NumberFormatOptions).format(n);

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    } catch {
      // Fall through to template-based suggestion on API error
    }
  }

  // Template-based fallback — rotate through variants so regenerate feels different
  const budgetStr = fmt(lead.budget);
  const templates = [
    `Assalam o Alaikum ${lead.name}! I wanted to follow up on your interest in ${lead.propertyInterest} with a budget of PKR ${budgetStr}. We have some great options that match your requirements — would you be available for a quick call today?`,
    `Dear ${lead.name}, hope you're doing well! I'm reaching out regarding your inquiry about ${lead.propertyInterest}. We've recently listed properties within your PKR ${budgetStr} range that I think you'll love. Can we schedule a visit this week?`,
    `Hi ${lead.name}! Just checking in about your property search for ${lead.propertyInterest}. We have exciting new listings within PKR ${budgetStr} that just became available. Let me know a convenient time and I'll walk you through the details!`,
    `Assalam o Alaikum ${lead.name}! Following up on your interest in ${lead.propertyInterest}. I have a few options within your PKR ${budgetStr} budget that are a perfect fit. Would you like to book a viewing at your earliest convenience?`,
  ];
  const suggestion = templates[Math.floor(Math.random() * templates.length)];

  return ok({ suggestion });
}
