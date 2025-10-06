import { forwardRef, type InputHTMLAttributes, useState } from "react"

import { brl, currencyToNumber } from "~/lib/formatters"
import { cn } from "~/lib/utils"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 shadow-xs outline-hidden transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm file:text-zinc-950 placeholder:text-zinc-500 hover:border-primary-200 hover:bg-primary-50 focus-visible:border-primary-400 focus-visible:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400 dark:file:text-zinc-50",
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

export type BrlInputProps = Omit<
  InputProps,
  "onChange" | "value" | "placeholder"
>
export function BrlInput(props: BrlInputProps) {
  const [state, setState] = useState<string>()

  return (
    <Input
      value={state}
      onChange={(e) => setState(brl(currencyToNumber(e.target.value)))}
      placeholder="R$ 0,00"
      {...props}
    />
  )
}
