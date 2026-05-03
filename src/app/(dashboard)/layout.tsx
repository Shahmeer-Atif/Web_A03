"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/shared/SignOutButton";
import {
  Menu, X, LayoutDashboard, Users, BarChart2, ListFilter,
  Building2, ChevronRight,
} from "lucide-react";

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
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon size={16} className={active ? "text-emerald-600" : "text-slate-400"} />
            {label}
            {active && <ChevronRight size={14} className="ml-auto text-emerald-400" />}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-5">
            <button
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
              onClick={() => setOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link href={role === "admin" ? "/admin" : "/agent"} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <Building2 size={16} className="text-white" />
              </div>
              <span className="font-bold text-slate-900 text-sm hidden sm:block">Property CRM</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <NavLinks />
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="text-sm font-medium text-slate-700">{session?.user?.name}</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {role}
              </span>
            </div>
            <SignOutButton />
          </div>
        </div>

        {open && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              <NavLinks onClick={() => setOpen(false)} />
            </nav>
            <div className="mt-3 border-t border-slate-100 pt-3 flex items-center gap-2 text-sm text-slate-600">
              <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              {session?.user?.name}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase tracking-wider text-slate-400 ml-auto">
                {role}
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
