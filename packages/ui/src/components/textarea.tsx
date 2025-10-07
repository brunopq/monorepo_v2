import { type TextareaHTMLAttributes, forwardRef } from "react"

import { cn } from "../utils/classes"

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex max-h-48 min-h-20 w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 shadow-xs outline-hidden transition-colors placeholder:text-zinc-500 hover:border-primary-200 hover:bg-primary-50 focus-visible:border-primary-400 focus-visible:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 dark:placeholder:text-zinc-400",
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
