import { differenceInDays, format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Tooltip } from "iboti-ui"
import { CalendarClockIcon } from "lucide-react"

import type { DomainReminder } from "~/services/ReminderService"

type RemindersTooltipProps = {
  reminders: DomainReminder[]
}

export function RemindersTooltip({ reminders }: RemindersTooltipProps) {
  return (
    <div className="relative inline-block">
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="relative flex items-center justify-center rounded-full bg-white p-2 text-zinc-900">
            <CalendarClockIcon className="size-6" />
            <div className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-accent-600 font-semibold text-white text-xs">
              {reminders.length}
            </div>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Content className="text-start">
          <p className="mb-2 font-semibold">
            {reminders.length} lembrete{reminders.length !== 1 && "s"}:
          </p>
          <ul className="space-y-1">
            {reminders.map((r) => {
              const distanceInDays = differenceInDays(
                new Date(r.remindAt),
                new Date(),
              )
              let distance = `Em ${formatDistanceToNow(new Date(r.remindAt), {
                locale: ptBR,
                addSuffix: true,
              })}`

              if (distanceInDays === 0) {
                distance = "Hoje"
              } else if (distanceInDays === 1) {
                distance = "Amanhã"
              }

              return (
                <li key={r.id}>
                  {distance},{" "}
                  {format(new Date(r.remindAt), "dd/MM/yyyy 'às' HH:mm")}
                </li>
              )
            })}
          </ul>
        </Tooltip.Content>
      </Tooltip.Root>
    </div>
  )
}
