import { forwardRef, type InputHTMLAttributes } from "react"

import { cn } from "../utils/classes"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 shadow-sm outline-none transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm file:text-zinc-950 placeholder:text-zinc-500 hover:border-primary-200 hover:bg-primary-50 focus-visible:border-primary-400 focus-visible:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
