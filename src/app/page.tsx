// Root landing. Server-side redirect to /login when no session, or to the
// appropriate dashboard based on role. Doing this on the server (instead
// of client-side useSession) keeps the role check off the wire and avoids
// a flash of unauthenticated content.

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(session.user.role === "admin" ? "/admin" : "/agent");
}
