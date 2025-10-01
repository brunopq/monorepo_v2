import { useFetcher, useLoaderData } from "react-router"
import { Button } from "iboti-ui"
import { PencilLineIcon, Trash2Icon } from "lucide-react"

import { cn } from "~/utils/styling"
import {
  interactionStatusesLabels,
  interactionTypesLabels,
} from "~/constants/interactions"

import type { DomainInteraction } from "~/services/InteractionService"

import type { action as interactionAction } from "~/routes/leads/[id]/interactions/[id]"

import type { loader } from "../.."

const getStatusStyles = (status: string) => {
  switch (status) {
    case "converted":
      return {
        cardBg: "bg-green-50 border-green-300",
        pillBg: "bg-green-200 text-green-900",
      }
    case "interested":
      return {
        cardBg: "bg-blue-50 border-blue-300",
        pillBg: "bg-blue-200 text-blue-900",
      }
    case "waiting_response":
      return {
        cardBg: "bg-lime-50 border-lime-300",
        pillBg: "bg-lime-200 text-lime-900",
      }
    case "no_response":
    case "no_interest":
    case "lost":
      return {
        cardBg: "bg-red-50 border-red-300",
        pillBg: "bg-red-200 text-red-900",
      }
    case "not_reachable":
    case "wrong_person":
      return {
        cardBg: "bg-orange-50 border-orange-300",
        pillBg: "bg-orange-200 text-orange-900",
      }
    default:
      return {
        cardBg: "bg-zinc-50 border-zinc-300",
        pillBg: "bg-zinc-200 text-zinc-900",
      }
  }
}

type LeadInteractionRowProps = {
  interaction: DomainInteraction
  leadId: number
}

export function LeadInteractionRow({
  interaction,
  leadId,
}: LeadInteractionRowProps) {
  const { canEdit } = useLoaderData<typeof loader>()
  const deleteFetcher = useFetcher<typeof interactionAction>()

  const handleEdit = async () => {
    alert("Edição ainda não implementada, culpa do estagiário")
  }

  const handleDelete = async () => {
    deleteFetcher.submit(null, {
      method: "delete",
      action: `/leads/${leadId}/interactions/${interaction.id}`,
    })
  }

  const statusStyles = getStatusStyles(interaction.status)

  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1 shadow-sm",
        statusStyles.cardBg,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <span className="mr-2 inline-flex items-center gap-1 font-semibold text-primary-800">
            {interactionTypesLabels[interaction.interactionType]}
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 font-medium text-xs",
              statusStyles.pillBg,
            )}
          >
            {interactionStatusesLabels[interaction.status]}
          </span>
          <p className="text-sm text-zinc-500">
            {new Date(interaction.contactedAt).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
          {/* <p className="text-sm text-zinc-500">Vendedor: {sellerName}</p> */}
          {interaction.notes && (
            <p className="text-sm text-zinc-700">{interaction.notes}</p>
          )}
        </div>

        {canEdit && (
          <div className="space-x-1">
            <Button
              icon
              size="sm"
              className="text-zinc-500"
              variant="ghost"
              onClick={handleEdit}
            >
              <PencilLineIcon className="size-4" />
            </Button>
            <Button
              icon
              size="sm"
              className="text-zinc-500"
              variant="ghost"
              onClick={handleDelete}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
