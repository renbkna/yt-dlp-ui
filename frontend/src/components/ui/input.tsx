import * as React from "react"

import { cn } from "@/lib/utils"

// Changed from interface to type alias since it adds no new properties
type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border dark:border-primary/30 border-secondary/30 dark:bg-background/60 bg-white/80 px-3 py-2 text-sm ring-offset-background dark:placeholder:text-primary-foreground/40 placeholder:text-secondary-foreground/50 focus-visible:outline-none focus-visible:ring-2 dark:focus-visible:ring-primary/20 focus-visible:ring-secondary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
export type { InputProps }
