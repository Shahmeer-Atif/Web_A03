"use client";

// Thin wrapper because NextAuth's SessionProvider is a client component;
// keeping it isolated lets the rest of the app stay server-rendered.

import { SessionProvider } from "next-auth/react";

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
