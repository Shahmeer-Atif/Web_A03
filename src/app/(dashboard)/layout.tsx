"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/shared/SignOutButton";
import ChatBox from "@/components/shared/ChatBox";
import { Menu, X, LayoutDashboard, Users, BarChart2, ListFilter } from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: ListFilter },
  { href: "/admin/agents", label: "Agents", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
];

const agentNav = [
  { href: "/agent", label: "My Leads", icon: ListFilter },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "agent";
  const nav = role === "admin" ? adminNav : agentNav;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/admin" && href !== "/agent" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-emerald-50 text-emerald-700 font-medium"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Hamburger — visible below md */}
            <button
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 md:hidden"
              onClick={() => setOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link href={role === "admin" ? "/admin" : "/agent"} className="font-semibold text-zinc-900">
              CRM
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              <NavLinks />
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-500 sm:inline">
              {session?.user?.name}{" "}
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs uppercase tracking-wider text-zinc-500">
                {role}
              </span>
            </span>
            <SignOutButton />
          </div>
        </div>

        {/* Mobile nav drawer */}
        {open && (
          <div className="border-t border-zinc-100 bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              <NavLinks onClick={() => setOpen(false)} />
            </nav>
            <div className="mt-3 border-t border-zinc-100 pt-3 text-sm text-zinc-500">
              {session?.user?.name}{" "}
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs uppercase tracking-wider">
                {role}
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <ChatBox />
    </div>
  );
}
