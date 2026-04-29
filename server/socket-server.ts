// Standalone Socket.io server. Run with: npx tsx server/socket-server.ts
// Listens on SOCKET_PORT (default 4000).
// Rooms: user:${userId} and role:admin
// Events: lead:created, lead:assigned, lead:updated, lead:priority_changed

import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { Server } from "socket.io";

const PORT = Number(process.env.SOCKET_PORT ?? 4000);
const NEXT_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // Internal emit endpoint called by Next.js API routes
  if (req.method === "POST" && req.url === "/emit") {
    try {
      const body = JSON.parse(await readBody(req));
      const { event, rooms, data } = body as {
        event: string;
        rooms: string[];
        data: Record<string, unknown>;
      };
      for (const room of rooms) {
        io.to(room).emit(event, data);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.writeHead(400);
      res.end("Bad request");
    }
    return;
  }
  res.writeHead(200);
  res.end("Socket.io server running");
});

export const io = new Server(httpServer, {
  cors: {
    origin: NEXT_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // Client sends { userId, role } on connect to join rooms
  socket.on("join", ({ userId, role }: { userId: string; role: string }) => {
    if (userId) socket.join(`user:${userId}`);
    if (role === "admin") socket.join("role:admin");
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on port ${PORT}`);
});
