// Dashboard shell — proxy.ts already guarantees the user is authed before
// any /admin/* or /agent/* request reaches here, so we read the session
// without re-checking. Subsequent phases will add a real Sidebar/Topbar.

import { auth } from "@/lib/auth";
import SignOutButton from "@/components/shared/SignOutButton";
import Link from "next/link";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/analytics", label: "Analytics" },
];

const agentNav = [
  { href: "/agent", label: "My Leads" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role ?? "agent";
  const nav = role === "admin" ? adminNav : agentNav;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href={role === "admin" ? "/admin" : "/agent"} className="font-semibold text-zinc-900">
              CRM
            </Link>
            <nav className="flex items-center gap-1">
              {nav.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500">
              {session?.user?.name}{" "}
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs uppercase tracking-wider text-zinc-500">
                {role}
              </span>
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
