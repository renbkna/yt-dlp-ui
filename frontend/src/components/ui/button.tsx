import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "dark:bg-primary bg-secondary text-primary-foreground hover:opacity-90 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline:
          "border dark:border-primary/30 border-secondary/30 dark:bg-background/50 bg-background/50 dark:text-primary-foreground text-secondary-foreground dark:hover:bg-primary/20 hover:bg-secondary/20 shadow-sm",
        secondary:
          "dark:bg-primary/20 bg-secondary/20 dark:text-primary-foreground text-secondary-foreground dark:hover:bg-primary/30 hover:bg-secondary/30",
        ghost: "dark:hover:bg-primary/20 hover:bg-secondary/20 dark:text-primary-foreground text-secondary-foreground dark:hover:text-primary hover:text-secondary",
        link: "underline-offset-4 hover:underline dark:text-primary text-secondary",
        gradient: "dark:bg-gradient-to-r dark:from-primary dark:to-accent/80 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 dark:shadow-lg dark:shadow-primary/20 shadow-lg shadow-secondary/20 text-white",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-lg",
        lg: "h-11 px-6 rounded-xl",
        xl: "h-12 px-8 text-base rounded-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
