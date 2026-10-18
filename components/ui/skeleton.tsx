import { cn } from "cn";
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("bg-[var(--surface-3)] rounded-xs animate-[skeleton_1.6s_ease-in-out_infinite]", className)} {...props} />;
}
export { Skeleton };
