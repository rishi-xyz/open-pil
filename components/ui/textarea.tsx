import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "premium-control w-full min-h-40 resize-y px-4 py-3 text-[16px] sm:text-[14px] leading-6 rounded-md",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
