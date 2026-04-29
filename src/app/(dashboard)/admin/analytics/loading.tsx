import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-32 animate-pulse rounded bg-zinc-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map(i => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-4 h-4 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="h-64 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={4} />
    </div>
  );
}
