import type { SubListState } from "~/services/SubListService"
import { cn } from "~/utils/styling"

export type SubListStatusPillProps = {
  status: SubListState
}

export function SubListStatusPill({ status }: SubListStatusPillProps) {
  return (
    <span
      className={cn("inline rounded-full px-3 py-0.5 font-medium text-xs", {
        "bg-primary-200/75 text-primary-900": status === "new",
        "bg-yellow-200/75 text-yellow-900": status === "in_progress",
        "bg-green-200/75 text-green-900": status === "completed",
        "bg-red-200/75 text-red-900": status === "canceled",
      })}
    >
      {
        {
          new: "Nova",
          in_progress: "Em andamento",
          completed: "Concluída",
          canceled: "Cancelada",
        }[status]
      }
    </span>
  )
}
