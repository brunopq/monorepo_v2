import {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
  forwardRef,
  useMemo,
  type JSX,
} from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "~/utils/classes"
import { Button } from "./button"
import { Input } from "./input"

const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  children: JSX.Element | null
  setChildren: (children: JSX.Element | null) => void
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

type SideBarProviderProps = {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: JSX.Element
}

const SidebarProvider = ({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  children,
}: SideBarProviderProps) => {
  const [_open, _setOpen] = useState(defaultOpen)
  const [_children, _setChildren] = useState<JSX.Element | null>(null)
  const open = openProp ?? _open
  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
    },
    [setOpenProp, open],
  )

  const toggleSidebar = useCallback(() => {
    return setOpen((open) => !open)
  }, [setOpen])

  // Adds a keyboard shortcut to toggle the sidebar.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  return (
    <SidebarContext.Provider
      value={{
        state,
        open,
        setOpen,
        toggleSidebar,
        children: _children,
        setChildren: _setChildren,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

SidebarProvider.displayName = "SidebarProvider"

const Sidebar = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
    },
    ref,
  ) => {
    const { state, children } = useSidebar()

    return (
      <AnimatePresence>
        {state === "collapsed" || children === null ? null : (
          <SidebarInner side={side} />
        )}
      </AnimatePresence>
    )
  },
)
Sidebar.displayName = "Sidebar"

const SidebarInner = ({ side }: { side?: "left" | "right" }) => {
  const { children } = useSidebar()

  return (
    <motion.div
      className="h-screen max-w-0 md:relative md:max-w-full"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: SIDEBAR_WIDTH, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
    >
      <motion.div
        data-side={side}
        initial={{ x: "-50%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ bounce: 0 }}
        style={{ width: `calc(${SIDEBAR_WIDTH}px - var(--spacing) * 4)` }}
        className="absolute inset-4 right-auto w-max rounded-md border border-primary-900/75 bg-zinc-800/75 shadow-lg shadow-primary-800/5 backdrop-blur-2xl md:right-4 md:left-0"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

const SidebarTrigger = forwardRef<
  React.ComponentRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarHeader = forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="header"
        className={cn(
          "flex flex-col gap-2 border-zinc-700 border-b px-3 py-2 font-serif text-lg",
          className,
        )}
        {...props}
      />
    )
  },
)
SidebarHeader.displayName = "SidebarHeader"

// const SidebarFooter = forwardRef<
//   HTMLDivElement,
//   React.ComponentProps<"div">
// >(({ className, ...props }, ref) => {
//   return (
//     <div
//       ref={ref}
//       data-sidebar="footer"
//       className={cn("flex flex-col gap-2 p-2", className)}
//       {...props}
//     />
//   )
// })
// SidebarFooter.displayName = "SidebarFooter"

// const SidebarSeparator = forwardRef<
//   React.ElementRef<typeof Separator>,
//   React.ComponentProps<typeof Separator>
// >(({ className, ...props }, ref) => {
//   return (
//     <Separator
//       ref={ref}
//       data-sidebar="separator"
//       className={cn("mx-2 w-auto bg-sidebar-border", className)}
//       {...props}
//     />
//   )
// })
// SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    const { setChildren } = useSidebar()

    // biome-ignore lint/correctness/useExhaustiveDependencies: This might break in the future
    useEffect(() => {
      setChildren(
        <div
          ref={ref}
          data-sidebar="content"
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-1 group-data-[collapsible=icon]:overflow-hidden",
            className,
          )}
          {...props}
        />,
      )
      return () => setChildren(null)
    }, [ref, setChildren])

    return null
  },
)
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="group"
        className={cn("relative flex w-full min-w-0 flex-col px-2", className)}
        {...props}
      />
    )
  },
)
SidebarGroup.displayName = "SidebarGroup"
const SidebarGroupLabel = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md font-medium text-sm text-zinc-300 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

// const SidebarGroupAction = forwardRef<
//   HTMLButtonElement,
//   React.ComponentProps<"button"> & { asChild?: boolean }
// >(({ className, asChild = false, ...props }, ref) => {
//   const Comp = asChild ? Slot : "button"

//   return (
//     <Comp
//       ref={ref}
//       data-sidebar="group-action"
//       className={cn(
//         "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
//         // Increases the hit area of the button on mobile.
//         "after:-inset-2 after:absolute after:md:hidden",
//         "group-data-[collapsible=icon]:hidden",
//         className,
//       )}
//       {...props}
//     />
//   )
// })
// SidebarGroupAction.displayName = "SidebarGroupAction"

// const SidebarGroupContent = forwardRef<
//   HTMLDivElement,
//   React.ComponentProps<"div">
// >(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     data-sidebar="group-content"
//     className={cn("w-full text-sm", className)}
//     {...props}
//   />
// ))
// SidebarGroupContent.displayName = "SidebarGroupContent"

// const SidebarMenu = forwardRef<
//   HTMLUListElement,
//   React.ComponentProps<"ul">
// >(({ className, ...props }, ref) => (
//   <ul
//     ref={ref}
//     data-sidebar="menu"
//     className={cn("flex w-full min-w-0 flex-col gap-1", className)}
//     {...props}
//   />
// ))
// SidebarMenu.displayName = "SidebarMenu"

// const SidebarMenuItem = forwardRef<
//   HTMLLIElement,
//   React.ComponentProps<"li">
// >(({ className, ...props }, ref) => (
//   <li
//     ref={ref}
//     data-sidebar="menu-item"
//     className={cn("group/menu-item relative", className)}
//     {...props}
//   />
// ))
// SidebarMenuItem.displayName = "SidebarMenuItem"

// const sidebarMenuButtonVariants = cva(
//   "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
//   {
//     variants: {
//       variant: {
//         default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
//         outline:
//           "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
//       },
//       size: {
//         default: "h-8 text-sm",
//         sm: "h-7 text-xs",
//         lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//       size: "default",
//     },
//   },
// )

// const SidebarMenuButton = forwardRef<
//   HTMLButtonElement,
//   React.ComponentProps<"button"> & {
//     asChild?: boolean
//     isActive?: boolean
//     tooltip?: string | React.ComponentProps<typeof TooltipContent>
//   } & VariantProps<typeof sidebarMenuButtonVariants>
// >(
//   (
//     {
//       asChild = false,
//       isActive = false,
//       variant = "default",
//       size = "default",
//       tooltip,
//       className,
//       ...props
//     },
//     ref,
//   ) => {
//     const Comp = asChild ? Slot : "button"
//     const { state } = useSidebar()

//     const button = (
//       <Comp
//         ref={ref}
//         data-sidebar="menu-button"
//         data-size={size}
//         data-active={isActive}
//         className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
//         {...props}
//       />
//     )

//     if (!tooltip) {
//       return button
//     }

//     if (typeof tooltip === "string") {
//       tooltip = {
//         children: tooltip,
//       }
//     }

//     return (
//       <Tooltip>
//         <TooltipTrigger asChild>{button}</TooltipTrigger>
//         <TooltipContent
//           side="right"
//           align="center"
//           hidden={state !== "collapsed"}
//           {...tooltip}
//         />
//       </Tooltip>
//     )
//   },
// )
// SidebarMenuButton.displayName = "SidebarMenuButton"

// const SidebarMenuAction = forwardRef<
//   HTMLButtonElement,
//   React.ComponentProps<"button"> & {
//     asChild?: boolean
//     showOnHover?: boolean
//   }
// >(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
//   const Comp = asChild ? Slot : "button"

//   return (
//     <Comp
//       ref={ref}
//       data-sidebar="menu-action"
//       className={cn(
//         "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
//         // Increases the hit area of the button on mobile.
//         "after:-inset-2 after:absolute after:md:hidden",
//         "peer-data-[size=sm]/menu-button:top-1",
//         "peer-data-[size=default]/menu-button:top-1.5",
//         "peer-data-[size=lg]/menu-button:top-2.5",
//         "group-data-[collapsible=icon]:hidden",
//         showOnHover &&
//           "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
//         className,
//       )}
//       {...props}
//     />
//   )
// })
// SidebarMenuAction.displayName = "SidebarMenuAction"

// const SidebarMenuBadge = forwardRef<
//   HTMLDivElement,
//   React.ComponentProps<"div">
// >(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     data-sidebar="menu-badge"
//     className={cn(
//       "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 font-medium text-sidebar-foreground text-xs tabular-nums",
//       "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
//       "peer-data-[size=sm]/menu-button:top-1",
//       "peer-data-[size=default]/menu-button:top-1.5",
//       "peer-data-[size=lg]/menu-button:top-2.5",
//       "group-data-[collapsible=icon]:hidden",
//       className,
//     )}
//     {...props}
//   />
// ))
// SidebarMenuBadge.displayName = "SidebarMenuBadge"

// const SidebarMenuSkeleton = forwardRef<
//   HTMLDivElement,
//   React.ComponentProps<"div"> & {
//     showIcon?: boolean
//   }
// >(({ className, showIcon = false, ...props }, ref) => {
//   // Random width between 50 to 90%.
//   const width = useMemo(() => {
//     return `${Math.floor(Math.random() * 40) + 50}%`
//   }, [])

//   return (
//     <div
//       ref={ref}
//       data-sidebar="menu-skeleton"
//       className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
//       {...props}
//     >
//       {showIcon && (
//         <Skeleton
//           className="size-4 rounded-md"
//           data-sidebar="menu-skeleton-icon"
//         />
//       )}
//       <Skeleton
//         className="h-4 max-w-[--skeleton-width] flex-1"
//         data-sidebar="menu-skeleton-text"
//         style={
//           {
//             "--skeleton-width": width,
//           } as React.CSSProperties
//         }
//       />
//     </div>
//   )
// })
// SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

// const SidebarMenuSub = forwardRef<
//   HTMLUListElement,
//   React.ComponentProps<"ul">
// >(({ className, ...props }, ref) => (
//   <ul
//     ref={ref}
//     data-sidebar="menu-sub"
//     className={cn(
//       "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-sidebar-border border-l px-2.5 py-0.5",
//       "group-data-[collapsible=icon]:hidden",
//       className,
//     )}
//     {...props}
//   />
// ))
// SidebarMenuSub.displayName = "SidebarMenuSub"

// const SidebarMenuSubItem = forwardRef<
//   HTMLLIElement,
//   React.ComponentProps<"li">
// >(({ ...props }, ref) => <li ref={ref} {...props} />)
// SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

// const SidebarMenuSubButton = forwardRef<
//   HTMLAnchorElement,
//   React.ComponentProps<"a"> & {
//     asChild?: boolean
//     size?: "sm" | "md"
//     isActive?: boolean
//   }
// >(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
//   const Comp = asChild ? Slot : "a"

//   return (
//     <Comp
//       ref={ref}
//       data-sidebar="menu-sub-button"
//       data-size={size}
//       data-active={isActive}
//       className={cn(
//         "-translate-x-px flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
//         "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
//         size === "sm" && "text-xs",
//         size === "md" && "text-sm",
//         "group-data-[collapsible=icon]:hidden",
//         className,
//       )}
//       {...props}
//     />
//   )
// })
// SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  //   SidebarFooter,
  SidebarGroup,
  //   SidebarGroupAction,
  //   SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  //   SidebarInput,
  //   SidebarInset,
  //   SidebarMenu,
  //   SidebarMenuAction,
  //   SidebarMenuBadge,
  //   SidebarMenuButton,
  //   SidebarMenuItem,
  //   SidebarMenuSkeleton,
  //   SidebarMenuSub,
  //   SidebarMenuSubButton,
  //   SidebarMenuSubItem,
  SidebarProvider,
  //   SidebarRail,
  //   SidebarSeparator,
  SidebarTrigger,
  //   useSidebar,
}
