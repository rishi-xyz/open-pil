import { Skeleton } from "@/components/ui/skeleton";
export function PetitionLoading() {
  return <div className="grid gap-8" role="status"><span className="sr-only">Loading petition from Arkiv…</span><div className="grid gap-3"><Skeleton className="h-7 w-3/5" /><Skeleton className="h-7 w-2/5" /></div><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="grid gap-6"><Skeleton className="h-60 w-full rounded-lg" /><Skeleton className="h-[480px] w-full rounded-lg" /></div><Skeleton className="h-[360px] w-full rounded-lg" /></div></div>;
}
