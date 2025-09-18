import { useLocation } from "react-router"
import { useEffect, useState } from "react"
import { Table } from "iboti-ui"

import { cn } from "~/utils/styling"
import { cnpj } from "~/utils/formatting"

import type {
  CompleteDomainLead,
  DomainLeadWithInteractions,
} from "~/services/LeadService"

import { RemindersTooltip } from "./ReminderTooltip"
import { LeadMenu } from "./LeadMenu"

type LeadRowProps = {
  lead: CompleteDomainLead
  headers: string[]
  isActive: boolean
}

const getLeadRowStyles = (lead: DomainLeadWithInteractions) => {
  if (lead.interactions.length === 0) {
    return "bg-white hover:bg-zinc-50"
  }

  // Define status priority (higher number = better status)
  const statusPriority = {
    converted: 9,
    interested: 8,
    waiting_response: 7,
    no_response: 4,
    wrong_person: 3,
    no_interest: 2,
    not_reachable: 2,
    lost: 1,
  } as const

  // Find the best status among all interactions
  const bestStatus = lead.interactions.reduce((best, interaction) => {
    const currentPriority =
      statusPriority[interaction.status as keyof typeof statusPriority] || 0
    const bestPriority =
      statusPriority[best as keyof typeof statusPriority] || 0
    return currentPriority > bestPriority ? interaction.status : best
  }, lead.interactions[0].status)

  // Return appropriate background color based on best status
  switch (bestStatus) {
    case "converted":
      return "bg-green-200/75 hover:bg-green-200 border-l-4 border-l-green-400  data-[open=true]:bg-green-200"
    case "interested":
      return "bg-blue-200/75 hover:bg-blue-200 border-l-4 border-l-blue-400 data-[open=true]:bg-blue-200"
    case "waiting_response":
      return "bg-lime-200/75 hover:bg-lime-200 border-l-4 border-l-lime-400 data-[open=true]:bg-lime-200"
    case "no_response":
    case "no_interest":
    case "lost":
      return "bg-red-200/75 hover:bg-red-200 border-l-4 border-l-red-400 data-[open=true]:bg-red-200"
    case "not_reachable":
    case "wrong_person":
      return "bg-orange-200/75 hover:bg-orange-200 border-l-4 border-l-orange-400 data-[open=true]:bg-orange-200"
    default:
      return "bg-zinc-50 hover:bg-zinc-100"
  }
}

export function LeadRow({ lead, headers, isActive }: LeadRowProps) {
  const { hash } = useLocation()
  const rowId = `lead-${lead.id}`

  // Initialize as false to match server state
  const [open, setOpen] = useState(false)

  // Update open state after hydration based on hash
  useEffect(() => {
    setOpen(hash.replace("#", "") === rowId)
  }, [hash, rowId])

  const handleToggle = () => {
    if (isActive) {
      setOpen(!open)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleToggle()
    }
  }

  const leadRowStyles = getLeadRowStyles(lead)

  return (
    <>
      <Table.Row
        id={rowId}
        data-open={open}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        // biome-ignore lint/a11y/useSemanticElements: <explanation>
        role="button"
        aria-expanded={open}
        className={cn(
          "cursor-pointer scroll-mt-12 transition-colors focus:outline-none",
          !isActive && "cursor-default opacity-80",
          leadRowStyles,
        )}
      >
        <Table.Cell className="p-2">
          {lead.reminders.length > 0 && (
            <RemindersTooltip reminders={lead.reminders} />
          )}
        </Table.Cell>
        {headers.map((h) => {
          let value = "-"
          if (lead.extra?.[h]) value = lead.extra[h]
          if (h.toLocaleLowerCase() === "cnpj") value = cnpj(value)

          return <Table.Cell key={h}>{value}</Table.Cell>
        })}
      </Table.Row>

      <LeadMenu lead={lead} />
    </>
  )
}
