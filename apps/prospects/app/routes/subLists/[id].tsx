import type React from "react"
import { useState } from "react"
import type { Route } from "./+types/[id]"
import {
  ArrowLeftIcon,
  PencilLineIcon,
  Trash2Icon,
  MessageCircleIcon,
  PhoneIcon,
  MailIcon,
  MoreHorizontalIcon,
} from "lucide-react"
import { Form, Link, useFetcher } from "react-router"
import { Button, Table, Input, Select } from "iboti-ui"

import {
  interactionStatuses,
  interactionTypes,
  interactionStatusesLabels,
  interactionTypesLabels,
} from "~/constants/interactions"

import { getUserOrRedirect } from "~/utils/authGuard"
import { cn, maxWidth } from "~/utils/styling"

import SubListService from "~/services/SubListService"
import type { DomainInteraction } from "~/services/InteractionService"
import type {
  DomainLead,
  DomainLeadWithInteractions,
} from "~/services/LeadService"

import type { action as interactionAction } from "~/routes/leads/[id]/interactions/[id]"

import { SubListStatusPill } from "~/components/SubListStatusPill"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request, "/login")

  const subList = await SubListService.getWithLeads(params.id)

  if (!subList) {
    throw new Response("SubList not found", { status: 404 })
  }

  return { user, subList }
}

export const action = async ({ request, params }: Route.ActionArgs) => {
  await getUserOrRedirect(request)

  if (request.method === "PATCH") {
    const formData = await request.formData()
    const assigneeId = formData.get("assigneeId")?.toString()

    if (!assigneeId) {
      return {
        error: true,
        message: "Assignee ID is required",
      }
    }

    try {
      const subList = await SubListService.assign(params.id, assigneeId)
      return { subList }
    } catch (error) {
      console.error("Failed to assign sublist:", error)
      return {
        error: true,
        message: "Failed to assign sublist",
      }
    }
  }
}

export default function SubListRoute({ loaderData }: Route.ComponentProps) {
  const { user, subList } = loaderData

  return (
    <div className={maxWidth("py-4")}>
      <header className="mb-4 flex items-start gap-4 border-zinc-400 border-b border-dotted pb-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="..">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <div className="mt-1">
          <span className="inline-flex items-center gap-2">
            <h1 className="font-semibold text-2xl text-primary-800">
              Listinha
            </h1>

            <SubListStatusPill status={subList.state} />
          </span>
          <p>Atribuído a: {subList.assignee?.name || "Não atribuída"}</p>
          <p>Leads: {subList.leadsCount}</p>
        </div>
      </header>

      <div className="mt-4">
        <h2 className="font-semibold text-xl">
          Leads ({subList.leads.length})
        </h2>

        <Table.Root className="space-y-2">
          <Table.Header>
            <Table.Row>
              <Table.Head>Nome</Table.Head>
              <Table.Head>CPF</Table.Head>
              <Table.Head>Telefone</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {subList.leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={{
                  ...lead,
                  extra: lead.extraInfo as unknown as Record<string, string>,
                  interactions: lead.interactions.map((i) => ({
                    ...i,
                    notes: i.notes || undefined,
                  })),
                }}
              />
            ))}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  )
}

type LeadRowProps = {
  lead: DomainLeadWithInteractions
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
      return "bg-green-50 hover:bg-green-100 border-l-4 border-l-green-400  data-[open=true]:bg-green-100"
    case "interested":
      return "bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-400 data-[open=true]:bg-blue-100"
    case "waiting_response":
      return "bg-lime-50 hover:bg-lime-100 border-l-4 border-l-lime-400 data-[open=true]:bg-lime-100"
    case "no_response":
    case "no_interest":
    case "lost":
      return "bg-red-50 hover:bg-red-100 border-l-4 border-l-red-400 data-[open=true]:bg-red-100"
    case "not_reachable":
    case "wrong_person":
      return "bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-400 data-[open=true]:bg-orange-100"
    default:
      return "bg-zinc-50 hover:bg-zinc-100"
  }
}

function LeadRow({ lead }: LeadRowProps) {
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleToggle = () => setOpen(!open)

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
        data-open={open}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        // biome-ignore lint/a11y/useSemanticElements: <explanation>
        role="button"
        aria-expanded={open}
        className={cn(
          "cursor-pointer transition-colors focus:outline-none",
          leadRowStyles,
        )}
      >
        <Table.Cell>{lead.name}</Table.Cell>
        <Table.Cell>{lead.cpf}</Table.Cell>
        <Table.Cell>{lead.phoneNumber}</Table.Cell>
      </Table.Row>

      <Table.Row
        data-open={open}
        className="hidden transition-colors data-[open=true]:table-row data-[open=true]:bg-zinc-100"
      >
        <Table.Cell colSpan={20} className="p-4">
          <header className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-lg text-primary-800">
              Interações
            </h3>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="ml-2"
            >
              {showForm ? "Fechar formulário" : "Registrar nova interação"}
            </Button>
          </header>

          {showForm && (
            <NewInteractionForm
              leadId={lead.id}
              onClose={() => setShowForm(false)}
            />
          )}

          <div className="space-y-2">
            {lead.interactions.length > 0 ? (
              lead.interactions.map((interaction) => (
                <LeadInteractionRow
                  key={interaction.id}
                  interaction={interaction}
                  leadId={lead.id}
                  sellerName={"usuari"}
                />
              ))
            ) : (
              <p>Nenhuma interação registrada.</p>
            )}
          </div>
        </Table.Cell>
      </Table.Row>
    </>
  )
}

type NewInteractionFormProps = {
  leadId: string
  onClose: () => void
}

const getInteractionTypeIcon = (type: string) => {
  switch (type) {
    case "whatsapp_message":
      return <MessageCircleIcon className="size-4 text-green-700" />
    case "whatsapp_call":
      return <PhoneIcon className="size-4 text-green-700" />
    case "call":
      return <PhoneIcon className="size-4" />
    case "email":
      return <MailIcon className="size-4" />
    case "other":
      return <MoreHorizontalIcon className="size-4" />
    default:
      return null
  }
}

function NewInteractionForm({ leadId, onClose }: NewInteractionFormProps) {
  return (
    <Form
      navigate={false}
      method="post"
      action={`/leads/${leadId}/interactions`}
      onSubmit={onClose}
      className="inset-shadow-accent-600/20 inset-shadow-xs mb-2 rounded-md bg-zinc-200 p-2 shadow-accent-600/20 shadow-xs"
    >
      <div className="grid grid-cols-[1fr_1fr_auto] grid-rows-2 gap-1">
        <Select.Root name="interactionType">
          <Select.Trigger className="text-sm">
            <Select.Value placeholder="Selecione o canal da interação" />
          </Select.Trigger>
          <Select.Content>
            {interactionTypes.map((type) => (
              <Select.Item key={type} value={type}>
                <div className="flex items-center gap-2">
                  {getInteractionTypeIcon(type)}
                  {interactionTypesLabels[type]}
                </div>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Select.Root name="interactionStatus">
          <Select.Trigger className="text-sm">
            <Select.Value placeholder="Selecione o status" />
          </Select.Trigger>
          <Select.Content>
            {interactionStatuses.map((status) => (
              <Select.Item key={status} value={status}>
                {interactionStatusesLabels[status]}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Input
          name="notes"
          placeholder="Notas (opcional)"
          className="col-span-2 text-sm"
        />

        <Button
          className="col-start-3 row-span-2 row-start-1 ml-2 self-center"
          type="submit"
        >
          Registrar interação
        </Button>
      </div>
    </Form>
  )
}

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
  leadId: string
  sellerName: string
}

function LeadInteractionRow({
  interaction,
  leadId,
  sellerName,
}: LeadInteractionRowProps) {
  const deleteFetcher = useFetcher<typeof interactionAction>()
  console.log(interaction.id)

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
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <span className="mr-2 inline-flex items-center gap-1 font-semibold text-primary-800">
            {
              interactionTypesLabels[
                interaction.interactionType as keyof typeof interactionTypesLabels
              ]
            }
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 font-medium text-xs",
              statusStyles.pillBg,
            )}
          >
            {
              interactionStatusesLabels[
                interaction.status as keyof typeof interactionStatusesLabels
              ]
            }
          </span>
          <p className="text-sm text-zinc-500">Vendedor: {sellerName}</p>
          {interaction.notes && (
            <p className="text-sm text-zinc-700">{interaction.notes}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-sm text-zinc-500">
            {new Date(interaction.contactedAt).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>

          <span>
            <Button
              size="icon"
              className="size-auto p-2 text-zinc-500"
              variant="ghost"
              onClick={handleEdit}
            >
              <PencilLineIcon className="size-4" />
            </Button>
            <Button
              size="icon"
              className="size-auto p-2 text-zinc-500"
              variant="ghost"
              onClick={handleDelete}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </span>
        </div>
      </div>
    </div>
  )
}