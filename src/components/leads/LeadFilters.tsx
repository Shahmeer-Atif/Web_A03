"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export default function LeadFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const set = useCallback((key: string, val: string) => {
    const params = new URLSearchParams(sp.toString());
    if (val) params.set(key, val); else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, sp]);

  return (
    <div className="flex flex-wrap gap-3">
      <input
        placeholder="Search name / email / phone"
        defaultValue={sp.get("search") ?? ""}
        onChange={(e) => set("search", e.target.value)}
        className="input max-w-xs"
      />
      <select defaultValue={sp.get("status") ?? ""} onChange={(e) => set("status", e.target.value)} className="input w-auto">
        <option value="">All statuses</option>
        {["new","contacted","in-progress","closed-won","closed-lost"].map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select defaultValue={sp.get("priority") ?? ""} onChange={(e) => set("priority", e.target.value)} className="input w-auto">
        <option value="">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <input type="date" defaultValue={sp.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} className="input w-auto" title="From date" />
      <input type="date" defaultValue={sp.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} className="input w-auto" title="To date" />
    </div>
  );
}
