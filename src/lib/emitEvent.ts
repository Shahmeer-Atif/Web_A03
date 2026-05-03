// Fire-and-forget HTTP POST to the Socket.io server's internal emit endpoint.
// API routes call this after mutations; failures are logged but never thrown.

const SOCKET_SERVER = process.env.SOCKET_SERVER_URL ?? "http://localhost:4000";

export type LeadEvent =
  | "lead:created"
  | "lead:assigned"
  | "lead:updated"
  | "lead:priority_changed"
  | "chat:message";

interface EmitPayload {
  event: LeadEvent;
  // rooms to broadcast to — e.g. ["role:admin", "user:abc123"]
  rooms: string[];
  data: Record<string, unknown>;
}

export async function emitEvent(payload: EmitPayload): Promise<void> {
  try {
    await fetch(`${SOCKET_SERVER}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Socket server may not be running in dev — non-fatal
  }
}
