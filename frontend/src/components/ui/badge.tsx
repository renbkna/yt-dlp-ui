import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent dark:bg-primary bg-secondary dark:text-primary-foreground text-secondary-foreground dark:hover:bg-primary/90 hover:bg-secondary/90",
        secondary:
          "border-transparent dark:bg-primary/20 bg-secondary/20 dark:text-primary-foreground text-secondary-foreground dark:hover:bg-primary/30 hover:bg-secondary/30",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "dark:border-primary/30 border-secondary/30 dark:text-primary-foreground text-secondary-foreground",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/90",
        info:
          "border-transparent bg-info text-info-foreground hover:bg-info/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
