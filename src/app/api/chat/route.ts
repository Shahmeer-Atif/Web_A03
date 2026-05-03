import "server-only";
import { connectDB } from "@/lib/db";
import { Message } from "@/models/Message";
import { requireUser } from "@/lib/requireUser";
import { ok, fail } from "@/lib/api";
import { emitEvent } from "@/lib/emitEvent";
import { z } from "zod";

const sendSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  toId: z.string().nullable().optional(),
});

// GET /api/chat — last 100 messages visible to this user
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  await connectDB();

  // Agents see messages between themselves and any admin.
  // Admins see all messages.
  const query =
    user.role === "admin"
      ? {}
      : {
          $or: [
            { fromId: user.id },
            { toId: user.id },
            { fromRole: "admin", toId: null },
          ],
        };

  const messages = await Message.find(query)
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();

  return ok(
    messages.map((m) => ({
      _id: m._id.toString(),
      fromId: m.fromId.toString(),
      fromName: m.fromName,
      fromRole: m.fromRole,
      toId: m.toId?.toString() ?? null,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }))
  );
}

// POST /api/chat — send a message
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const parsed = sendSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION", "Invalid message", 400);

  await connectDB();

  const msg = await Message.create({
    fromId: user.id,
    fromName: user.name,
    fromRole: user.role,
    toId: parsed.data.toId ?? null,
    body: parsed.data.body,
  });

  const payload = {
    _id: msg._id.toString(),
    fromId: user.id,
    fromName: user.name,
    fromRole: user.role,
    toId: parsed.data.toId ?? null,
    body: parsed.data.body,
    createdAt: msg.createdAt.toISOString(),
  };

  // Emit to relevant rooms
  const rooms: string[] = ["role:admin"];
  if (parsed.data.toId) rooms.push(`user:${parsed.data.toId}`);
  if (user.role === "agent") rooms.push(`user:${user.id}`);

  await emitEvent({ event: "chat:message", rooms, data: payload });

  return ok(payload);
}
