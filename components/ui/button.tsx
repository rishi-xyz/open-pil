import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
const buttonVariants = cva("inline-flex shrink-0 items-center justify-center gap-2 rounded-md border font-medium whitespace-nowrap transition-colors duration-[120ms] outline-none select-none focus-visible:shadow-[var(--focus-ring)] focus-visible:border-[var(--focus)] not-disabled:active:translate-y-px disabled:cursor-not-allowed disabled:bg-secondary disabled:text-[var(--text-disabled)] disabled:border-border disabled:shadow-none [&_svg]:size-4 [&_svg]:shrink-0", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-xs)] not-disabled:hover:bg-[var(--teal-hover)] not-disabled:active:bg-[var(--teal-active)]",
      secondary: "bg-secondary text-secondary-foreground border-transparent not-disabled:hover:bg-[var(--surface-3)] not-disabled:active:bg-[#DFE5E8]",
      outline: "bg-card text-foreground border-[var(--border-strong)] shadow-[var(--shadow-xs)] not-disabled:hover:bg-secondary not-disabled:active:bg-[var(--surface-3)] disabled:bg-card",
      ghost: "bg-transparent text-[var(--text-2)] border-transparent not-disabled:hover:bg-secondary not-disabled:hover:text-foreground not-disabled:active:bg-[var(--surface-3)] disabled:bg-transparent disabled:border-transparent",
      destructive: "bg-destructive text-white border-destructive not-disabled:hover:bg-[#8A1F16] not-disabled:active:bg-[#741A12]",
      link: "bg-transparent border-transparent text-primary underline underline-offset-3 not-disabled:hover:text-[var(--teal-hover)] not-disabled:hover:decoration-2 disabled:bg-transparent disabled:border-transparent disabled:no-underline h-auto! p-0!",
    },
    size: { sm: "h-9 px-3 text-[13px] leading-5", default: "h-10 px-4 text-sm leading-5", lg: "h-12 px-5 text-[15px] leading-6 [&_svg]:size-[18px]", icon: "size-10 p-0", "icon-sm": "size-8 p-0" },
  }, defaultVariants: { variant: "default", size: "default" },
});
function Button({ className, variant = "default", size = "default", loading = false, disabled, children, ...props }: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading && <Loader2 className="animate-spin" aria-hidden="true" />}{children}</ButtonPrimitive>;
}
export { Button, buttonVariants };
