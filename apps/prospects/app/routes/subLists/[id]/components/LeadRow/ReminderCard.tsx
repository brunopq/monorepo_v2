import {
  format,
  formatDistanceToNow,
  isPast,
  isToday,
  isTomorrow,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "iboti-ui"
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
} from "lucide-react"

import { cn } from "~/utils/styling"

import type { DomainReminder } from "~/services/ReminderService"

type ReminderCardProps = {
  reminder: DomainReminder
}

export function ReminderCard({ reminder }: ReminderCardProps) {
  const remindDate = new Date(reminder.remindAt)
  const createdDate = new Date(reminder.createdAt)
  const isPassed = isPast(remindDate)
  const isDueToday = isToday(remindDate)
  const isDueTomorrow = isTomorrow(remindDate)

  const getStatusInfo = () => {
    if (isPassed) {
      return {
        icon: <AlertTriangleIcon className="size-5 text-zinc-700" />,
        status: "Passado",
        statusColor: "text-zinc-800",
        bgColor: "bg-zinc-50 border-zinc-200",
        timeText: `Passou há ${formatDistanceToNow(remindDate, { locale: ptBR })}`,
      }
    }

    if (isDueToday) {
      return {
        icon: <ClockIcon className="size-5 text-orange-700" />,
        status: "Hoje",
        statusColor: "text-orange-800",
        bgColor: "bg-orange-50 border-orange-300",
        timeText: `Hoje às ${format(remindDate, "HH:mm")}`,
      }
    }

    if (isDueTomorrow) {
      return {
        icon: <CalendarIcon className="size-5 text-blue-700" />,
        status: "Amanhã",
        statusColor: "text-blue-800",
        bgColor: "bg-blue-50 border-blue-300",
        timeText: `${format(remindDate, "HH:mm")}`,
      }
    }

    return {
      icon: <CalendarIcon className="size-5 text-green-700" />,
      status: "Agendado",
      statusColor: "text-green-800",
      bgColor: "bg-green-50 border-green-300",
      timeText: `${format(remindDate, "dd/MM/yyyy 'às' HH:mm")}`,
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className={cn("rounded-lg border p-2 shadow-sm", statusInfo.bgColor)}>
      {/* Header with status */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusInfo.icon}
          <span className={cn("font-semibold", statusInfo.statusColor)}>
            {statusInfo.status}, {statusInfo.timeText}
          </span>
        </div>

        <span className="text-gray-500 text-xs">
          Criado em {format(createdDate, "dd/MM/yyyy 'às' HH:mm")}
        </span>
      </div>

      {/* Message */}
      <div className="">
        <p className="text-gray-800 text-sm leading-relaxed">
          {reminder.message}
        </p>
      </div>

      {/* Footer */}
      {isPassed && (
        <div className="mt-2 flex items-center justify-between border-gray-200 border-t pt-2">
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-300 bg-zinc-100 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-200"
          >
            <CheckCircleIcon className="mr-1 size-3" />
            Marcar como concluído
          </Button>
        </div>
      )}
    </div>
  )
}
