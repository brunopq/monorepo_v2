import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../utils/classes"

const buttonVariants = cva(
  "inline-flex items-center justify-center shadow-sm  whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        default: "px-4 py-2",
        sm: "rounded-md text-sm py-1 px-3",
        lg: "rounded-md text-lg py-2 px-8",
      },
      icon: {
        left: "gap-2 pl-3",
        right: "gap-2 pr-3",
        true: "p-2",
      },
      variant: {
        default: "bg-primary-700 text-primary-50 hover:bg-primary-700/90",
        destructive: "bg-red-600 text-zinc-50 hover:bg-red-900/90",
        background:
          "border border-zinc-300 bg-zinc-100 hover:border-primary-200 hover:bg-primary-50 focus-visible:border-primary-400 focus-visible:bg-primary-50", // this one looks like the inputs
        outline:
          "border border-primary-400 bg-transparent text-primary-700 hover:bg-primary-100 hover:text-primary-900",
        secondary: "bg-accent-600 text-accent-50 hover:bg-accent-600/80",
        ghost: "shadow-none hover:bg-primary-100 hover:text-primary-900",
        link: "shadow-none p-0 text-accent-600 underline-offset-4 hover:underline",
      },
    },
    compoundVariants: [
      { icon: true, size: "lg", className: "p-3" },
      { icon: true, size: "default", className: "p-2" },
      { icon: true, size: "sm", className: "p-1" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, icon, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, icon, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
