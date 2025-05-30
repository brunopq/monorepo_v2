import { forwardRef, type InputHTMLAttributes, useState } from "react"

// import { brl, currencyToNumber } from "~/utils/formatters"
import { cn } from "~/utils/classes"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "border-zinc-300 bg-zinc-100 file:text-zinc-950 placeholder:text-zinc-500 hover:border-primary-200 hover:bg-zinc-50 focus-visible:border-primary-400 focus-visible:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-visible:border-primary-700 dark:focus-visible:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-950 dark:placeholder:text-zinc-400 dark:file:text-zinc-50",
          "flex w-full rounded-md border px-3 py-2 shadow-sm outline-none transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm disabled:cursor-not-allowed disabled:opacity-50",
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

// export type BrlInputProps = Omit<
//   InputProps,
//   "onChange" | "value" | "placeholder"
// >
// export function BrlInput(props: BrlInputProps) {
//   const [state, setState] = useState<string>()

//   return (
//     <Input
//       value={state}
//       onChange={(e) => setState(brl(currencyToNumber(e.target.value)))}
//       placeholder="R$ 0,00"
//       {...props}
//     />
//   )
// }
