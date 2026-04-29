// NextAuth's catch-all route. Re-exports the Auth.js GET/POST handlers.
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
