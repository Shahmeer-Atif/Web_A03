// NextAuth v5 configuration. Credentials provider with JWT session strategy
// (no DB session table — the role is embedded in the JWT and round-tripped
// to the client through the session callback). This makes the proxy/edge
// guard cheap: it can read role straight from the cookie-borne token.

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { loginSchema } from "@/lib/validators/auth";
import type { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role; name?: string | null; email?: string | null } & DefaultSession["user"];
  }
  interface User {
    id?: string;
    role?: Role;
  }
}

// JWT type augmentation lives in the same `next-auth` module — Auth.js
// re-exports JWT from there in v5, so we don't need a separate `declare
// module "next-auth/jwt"` block.

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  // Auth.js infers AUTH_SECRET; we keep NEXTAUTH_SECRET for parity with the spec.
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email })
          .select("+password")
          .lean(false); // need methods, not lean POJO

        if (!user || !user.isActive) return null;
        const okPwd = await user.verifyPassword(parsed.data.password);
        if (!okPwd) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Persist id + role into the JWT on sign-in. Subsequent requests
    // never hit the DB to know who the user is — this is the auth fast path.
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    // Reflect token data into the session object the client sees.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? "";
        session.user.role = (token.role as Role) ?? "agent";
      }
      return session;
    },
  },
});
