import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRows } from "@/components/record/skeleton-rows";
export function PetitionsLoading() {
  return <div className="grid gap-8" role="status"><span className="sr-only">Loading public record…</span><Skeleton className="h-10 w-48" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}</div><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="card overflow-hidden"><SkeletonRows /></div><Skeleton className="h-60 rounded-lg" /></div></div>;
}
