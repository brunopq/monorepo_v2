import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "../utils/classes"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer size-4 shrink-0 rounded-sm border border-primary-900 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary-700 data-[state=checked]:text-white dark:border-zinc-800 dark:ring-offset-zinc-950 dark:data-[state=checked]:bg-zinc-50 dark:data-[state=checked]:text-zinc-900 dark:focus-visible:ring-zinc-300",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="size-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
