import { cva, type VariantProps } from "class-variance-authority"
import type { SubmissionState } from "~/.server/db/schema/submission"

import { cn } from "~/utils/classes"

const badgeVariants = cva(
  "inline-flex items-center rounded-full select-none px-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-primary-600 text-primary-50 dark:bg-primary-800",
        red: "bg-red-600 text-red-50 dark:bg-red-800",
        orange: "bg-orange-600 text-orange-50 dark:bg-orange-800",
        amber: "bg-amber-600 text-amber-50 dark:bg-amber-800",
        yellow: "bg-yellow-600 text-yellow-50 dark:bg-yellow-800",
        lime: "bg-lime-600 text-lime-50 dark:bg-lime-800",
        green: "bg-green-600 text-green-50 dark:bg-green-800",
        emerald: "bg-emerald-600 text-emerald-50 dark:bg-emerald-800",
        teal: "bg-teal-600 text-teal-50 dark:bg-teal-800",
        cyan: "bg-cyan-600 text-cyan-50 dark:bg-cyan-800",
        sky: "bg-sky-600 text-sky-50 dark:bg-sky-800",
        blue: "bg-blue-600 text-blue-50 dark:bg-blue-800",
        indigo: "bg-indigo-600 text-indigo-50 dark:bg-indigo-800",
        violet: "bg-violet-600 text-violet-50 dark:bg-violet-800",
        purple: "bg-purple-600 text-purple-50 dark:bg-purple-800",
        fuchsia: "bg-fuchsia-600 text-fuchsia-50 dark:bg-fuchsia-800",
        pink: "bg-pink-600 text-pink-50 dark:bg-pink-800",
        rose: "bg-rose-600 text-rose-50 dark:bg-rose-800",
        zinc: "bg-zinc-500 text-zinc-50 dark:bg-zinc-700",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <small className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

function SubmissionStateBadge({ state }: { state: SubmissionState }) {
  const colors: Record<
    SubmissionState,
    VariantProps<typeof badgeVariants>["variant"]
  > = {
    approved: "teal",
    changes_requested: "indigo",
    draft: "zinc",
    waiting_review: "orange",
  }

  const labels: Record<SubmissionState, string> = {
    approved: "Aprovado",
    changes_requested: "Esperando alterações",
    draft: "Rascunho",
    waiting_review: "Aguardando revisão",
  }

  return <Badge variant={colors[state]}>{labels[state]}</Badge>
}

export { Badge, badgeVariants, SubmissionStateBadge }
