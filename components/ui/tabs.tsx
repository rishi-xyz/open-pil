"use client";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
function Tabs({ className, orientation = "horizontal", ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" orientation={orientation} className={cn("group/tabs flex flex-col gap-2 data-vertical:flex-row", className)} {...props} />;
}
const tabsListVariants = cva("group/tabs-list inline-flex w-fit items-center gap-1 p-1 rounded-md text-[var(--text-2)]", { variants: { variant: { default: "bg-secondary", line: "bg-transparent border-b border-border rounded-none" } }, defaultVariants: { variant: "default" } });
function TabsList({ className, variant = "default", ...props }: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return <TabsPrimitive.List data-slot="tabs-list" data-variant={variant} className={cn(tabsListVariants({ variant }), className)} {...props} />;
}
function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return <TabsPrimitive.Tab data-slot="tabs-trigger" className={cn("relative inline-flex h-9 items-center justify-center gap-2 rounded-sm px-3 text-[13px] leading-5 font-medium text-[var(--text-2)] hover:text-foreground data-active:bg-card data-active:text-foreground data-active:shadow-[var(--shadow-xs)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 transition-colors duration-120 group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:shadow-none group-data-[variant=line]/tabs-list:data-active:after:absolute group-data-[variant=line]/tabs-list:data-active:after:inset-x-3 group-data-[variant=line]/tabs-list:data-active:after:bottom-0 group-data-[variant=line]/tabs-list:data-active:after:h-0.5 group-data-[variant=line]/tabs-list:data-active:after:bg-primary [&_svg]:size-3.5", className)} {...props} />;
}
function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
