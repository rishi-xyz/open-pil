import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "premium-control h-10 w-full min-w-0 px-3 text-[16px] sm:text-[14px] rounded-md",
        className
      )}
      {...props}
    />
  )
}

export { Input }
