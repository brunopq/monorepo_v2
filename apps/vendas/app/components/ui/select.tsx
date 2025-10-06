import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn, glass } from "~/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

type SelectTriggerProps = React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Trigger
> & {
  showIcon?: boolean
}
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, showIcon = true, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex w-full items-center justify-between gap-2 rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 shadow-xs outline-hidden transition-colors placeholder:text-zinc-500 hover:border-primary-200 hover:bg-primary-50 focus-visible:border-primary-400 focus-visible:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-primary-400 data-[state=open]:bg-primary-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus:ring-zinc-300 dark:placeholder:text-zinc-400 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    {showIcon && (
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    )}
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

// const SelectScrollUpButton = React.forwardRef<
//   React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
//   React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
// >(({ className, ...props }, ref) => (
//   <SelectPrimitive.ScrollUpButton
//     ref={ref}
//     className={cn(
//       "flex cursor-default items-center justify-center py-1",
//       className,
//     )}
//     {...props}
//   >
//     <ChevronUp className="h-4 w-4" />
//   </SelectPrimitive.ScrollUpButton>
// ))
// SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

// const SelectScrollDownButton = React.forwardRef<
//   React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
//   React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
// >(({ className, ...props }, ref) => (
//   <SelectPrimitive.ScrollDownButton
//     ref={ref}
//     className={cn(
//       "flex cursor-default items-center justify-center py-1",
//       className,
//     )}
//     {...props}
//   >
//     <ChevronDown className="h-4 w-4" />
//   </SelectPrimitive.ScrollDownButton>
// ))
// SelectScrollDownButton.displayName =
//   SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={glass(
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border border-primary-400 text-zinc-900 shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
        position === "popper" &&
          "data-[side=left]:-translate-x-1 data-[side=top]:-translate-y-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      {/* <SelectScrollUpButton /> */}
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      {/* <SelectScrollDownButton /> */}
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pr-2 pl-8 font-semibold text-sm", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 outline-hidden transition-colors hover:bg-primary-50 focus:bg-primary-100 focus:text-zinc-900 data-disabled:pointer-events-none data-disabled:opacity-50 dark:focus:bg-zinc-800 dark:focus:text-zinc-50",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>

    <SelectPrimitive.ItemIndicator>
      <Check className="h-4 w-4 text-primary-700" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-zinc-100 dark:bg-zinc-800", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  // SelectScrollUpButton,
  // SelectScrollDownButton,
}
