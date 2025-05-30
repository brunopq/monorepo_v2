import * as React from "react"

import { cn } from "~/utils/classes"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex max-h-48 min-h-20 w-full rounded-md border px-3 py-2 shadow-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          "border-zinc-300 bg-zinc-100 file:text-zinc-950 placeholder:text-zinc-500 hover:border-primary-200 hover:bg-zinc-50 focus-visible:border-primary-400 focus-visible:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-visible:border-primary-700 dark:focus-visible:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-950 dark:placeholder:text-zinc-400 dark:file:text-zinc-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = "Textarea"

export { Textarea }
