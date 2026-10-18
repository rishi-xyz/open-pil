import { Skeleton } from "@/components/ui/skeleton";
export function SkeletonRows() {
  return <div role="status" aria-label="Loading records"><span className="sr-only">Loading records…</span>{Array.from({ length: 4 }, (_, i) => <div key={i} className="record-skeleton-row"><Skeleton className="h-3 w-12" /><div className="grid gap-2"><Skeleton className="h-3.5 w-[70%]" /><Skeleton className="h-3.5 w-[45%]" /></div><Skeleton className="h-6 w-[88px] rounded-sm" /><div className="grid gap-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-24" /></div><Skeleton className="h-1.5 w-full rounded-full" /></div>)}</div>;
}
