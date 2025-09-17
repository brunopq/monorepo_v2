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
  ClockIcon,
  CalendarIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  CalendarClockIcon,
} from "lucide-react"
import { Form, Link, useFetcher, useLoaderData } from "react-router"
import { Button, Tooltip, Table, Input, Select, Checkbox } from "iboti-ui"
import {
  differenceInDays,
  format,
  formatDistanceToNow,
  isPast,
  isToday,
  isTomorrow,
  subDays,
} from "date-fns"
import { ptBR } from "date-fns/locale"

import {
  interactionStatuses,
  interactionTypes,
  interactionStatusesLabels,
  interactionTypesLabels,
} from "~/constants/interactions"

import { getUserOrRedirect } from "~/utils/authGuard"
import { cn } from "~/utils/styling"
import { cnpj, cpf, phone } from "~/utils/formatting"

import SubListService, {
  subListStatesSchema,
  type DbSubList,
  type SubListState,
} from "~/services/SubListService"
import type { DomainInteraction } from "~/services/InteractionService"
import type {
  CompleteDomainLead,
  DomainLeadWithInteractions,
} from "~/services/LeadService"

import type { action as interactionAction } from "~/routes/leads/[id]/interactions/[id]"

import { SubListStatusPill } from "~/components/SubListStatusPill"
import type { DomainReminder } from "~/services/ReminderService"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request, "/login")

  const subList = await SubListService.getWithLeads(params.id)

  if (!subList) {
    throw new Response("SubList not found", { status: 404 })
  }

  if (user.role !== "ADMIN" && subList.assigneeId !== user.id) {
    throw new Response("Forbidden", { status: 403 })
  }

  const canEdit = subList.assigneeId === user.id

  return { user, subList, canEdit }
}

export const action = async ({ request, params }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request)

  const subList = await SubListService.getWithLeads(params.id)

  if (!subList) {
    throw new Response("SubList not found", { status: 404 })
  }

  if (user.role !== "ADMIN" && subList.assigneeId !== user.id) {
    throw new Response("Forbidden", { status: 403 })
  }

  if (request.method === "PATCH") {
    const formData = await request.formData()
    const assigneeId = formData.get("assigneeId")?.toString()
    const subListStatus = subListStatesSchema.safeParse(formData.get("status"))

    try {
      let subList: DbSubList

      if (assigneeId && user.role === "ADMIN") {
        subList = await SubListService.assign(params.id, assigneeId)
      } else if (subListStatus.success) {
        subList = await SubListService.updateStatus(
          params.id,
          subListStatus.data,
        )
      } else {
        return {
          error: true,
          message: "invalid data",
        }
      }

      return { subList }
    } catch (error) {
      console.error("Failed to update sublist:", error)
      return {
        error: true,
        message: "Failed to update sublist",
      }
    }
  }

  if (request.method === "DELETE") {
    try {
      await SubListService.delete(params.id)
      return { success: true }
    } catch (error) {
      console.error("Failed to delete sublist:", error)
      return {
        error: true,
        message: "Failed to delete sublist",
      }
    }
  }
}

export default function SubListRoute({ loaderData }: Route.ComponentProps) {
  const { user, subList, canEdit } = loaderData

  const [showContacted, setShowContacted] = useState(true)

  const headersSet = new Set<string>()

  subList.leads
    .flatMap((l) => Object.keys(l.extraInfo || {}))
    .map((h) => headersSet.add(h))

  const headers = [...headersSet]

  const leads: CompleteDomainLead[] = (
    showContacted
      ? subList.leads
      : subList.leads.filter((l) => l.interactions.length === 0)
  ).map((l) => ({
    ...l,
    extra: l.extraInfo || {},
    interactions: l.interactions.map((i) => ({
      ...i,
      notes: i.notes || undefined,
    })),
  }))

  const canStart = subList.state === "new"
  const canFinnish =
    subList.state === "in_progress" &&
    subList.leads.every((l) => l.interactions.length > 0)
  const canReopen = subList.state === "completed"

  return (
    <div className="grid h-screen grid-rows-[auto_1fr] gap-4 p-4">
      <header className="flex items-center justify-between gap-4 border-zinc-400 border-b border-dotted pb-2">
        <div className="flex items-start gap-4">
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
            <div className="columns-3 text-sm">
              {subList.assignee && (
                <p>
                  Atribuído a:{" "}
                  <strong className="text-primary-600">
                    {subList.assignee.name}
                  </strong>
                </p>
              )}
              <p>
                Leads:{" "}
                <strong className="text-primary-600">
                  {subList.leadsCount}
                </strong>
              </p>
              <p>
                Leads contatados:{" "}
                <strong className="text-primary-600">
                  {subList.contactedLeadsCount}
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div>
          {!canStart && !canReopen && !canFinnish && (
            <fieldset className="top-2 z-20 my-2 rounded-md border border-zinc-300 bg-zinc-50/50 p-1 text-sm shadow-sm backdrop-blur-2xl">
              <label
                className={cn(
                  "flex w-fit select-none items-center gap-2 rounded-sm px-2 py-0.5 transition-colors hover:bg-primary-300/25 ",
                  showContacted && "bg-primary-200/60",
                )}
              >
                Mostrar leads contatados{" "}
                <Checkbox
                  checked={showContacted}
                  onCheckedChange={(s) =>
                    setShowContacted(s === "indeterminate" ? true : s)
                  }
                />
              </label>
            </fieldset>
          )}

          {canStart && (
            <Form method="patch" className="inline-flex items-center">
              <Button
                name="status"
                value={"in_progress" satisfies SubListState}
                type="submit"
                variant="secondary"
              >
                Inciar
              </Button>
            </Form>
          )}

          {canReopen && (
            <Form method="patch" className="inline-flex items-center">
              <Button
                name="status"
                value={"in_progress" satisfies SubListState}
                type="submit"
                variant="ghost"
              >
                Reabrir
              </Button>
            </Form>
          )}

          {canFinnish && (
            <Form method="patch" className="inline-flex items-center">
              <Button
                name="status"
                value={"completed" satisfies SubListState}
                type="submit"
                variant="secondary"
              >
                Finalizar
              </Button>
            </Form>
          )}
        </div>
      </header>

      <LeadsTable
        isActive={subList.state === "in_progress"}
        leads={leads}
        headers={headers}
      />
    </div>
  )
}

type LeadsTableProps = {
  leads: CompleteDomainLead[]
  headers: string[]
  isActive: boolean
}

function LeadsTable({ headers, leads, isActive }: LeadsTableProps) {
  const { canEdit } = useLoaderData<typeof loader>()

  return (
    <div className="sticky left-0 overflow-auto">
      {!canEdit && (
        <div className="sticky left-0 mb-4 rounded-md border border-orange-300 bg-orange-50 p-3">
          <p className="text-orange-800 text-sm">
            Você não pode editar esta listinha pois ela está atribuída a outro
            usuário.
          </p>
        </div>
      )}

      <Table.Root className="space-y-2">
        <Table.Row>
          <Table.Head className="sticky top-0 z-10 bg-zinc-50/50 backdrop-blur-2xl">
            {/* Empty header for buttons */}
          </Table.Head>
          {headers.map((h) => (
            <Table.Head
              className="sticky top-0 z-10 bg-zinc-50/50 backdrop-blur-2xl"
              key={h}
            >
              {h}
            </Table.Head>
          ))}
        </Table.Row>
        <Table.Body>
          {leads.map((lead) => (
            <LeadRow
              key={lead.id}
              isActive={isActive}
              headers={headers}
              lead={lead}
            />
          ))}
        </Table.Body>
      </Table.Root>
    </div>
  )
}

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

function LeadRow({ lead, headers, isActive }: LeadRowProps) {
  const { canEdit } = useLoaderData<typeof loader>()

  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)

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

  const remindersCount = lead.reminders ? lead.reminders.length : 0

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
          !isActive && "cursor-default opacity-80",
          leadRowStyles,
        )}
      >
        <Table.Cell className="p-2">
          {remindersCount > 0 && (
            <RemindersTooltip reminders={lead.reminders} />
          )}
        </Table.Cell>
        {[...headers].map((h) => {
          let value = "-"
          if (lead.extra?.[h]) value = lead.extra[h]
          if (h.toLocaleLowerCase() === "cnpj") value = cnpj(value)

          return <Table.Cell key={h}>{value}</Table.Cell>
        })}
      </Table.Row>

      <Table.Row
        data-open={open}
        className="hidden transition-colors data-[open=true]:table-row data-[open=true]:bg-zinc-100"
      >
        <Table.Cell colSpan={9999} className="p-0">
          <div className="sticky left-0 w-[calc(100vw-2rem-1px)] p-4">
            <section>
              <header className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-lg text-primary-800">
                  Interações
                </h3>

                {canEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowForm(!showForm)}
                    className="ml-2"
                  >
                    {showForm
                      ? "Fechar formulário"
                      : "Registrar nova interação"}
                  </Button>
                )}
              </header>

              {showForm && canEdit && (
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
                      sellerName={interaction.sellerId}
                    />
                  ))
                ) : (
                  <p>Nenhuma interação registrada.</p>
                )}
              </div>
            </section>

            {remindersCount > 0 && (
              <section>
                <header className="mt-4 mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-primary-800">
                    Lembretes
                  </h3>
                </header>
                {lead.reminders.map((r) => (
                  <ReminderCard key={r.id} reminder={r} />
                ))}
              </section>
            )}
          </div>
        </Table.Cell>
      </Table.Row>
    </>
  )
}

type RemindersTooltipProps = {
  reminders: DomainReminder[]
}

function RemindersTooltip({ reminders }: RemindersTooltipProps) {
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

type ReminderCardProps = {
  reminder: DomainReminder
}

function ReminderCard({ reminder }: ReminderCardProps) {
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

type NewInteractionFormProps = {
  leadId: number
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

const reminderOptions = [
  { value: "disabled", label: "Desativado", default: true },
  { value: "1_day", label: "Em 1 dia" },
  { value: "2_days", label: "Em 2 dias" },
  { value: "1_week", label: "Em 1 semana" },
]

function NewInteractionForm({ leadId, onClose }: NewInteractionFormProps) {
  return (
    <Form
      navigate={false}
      method="post"
      action={`/leads/${leadId}/interactions`}
      onSubmit={onClose}
      className="@container inset-shadow-accent-600/20 inset-shadow-xs mb-2 rounded-md bg-zinc-200 p-2 shadow-accent-600/20 shadow-xs"
    >
      <div className="grid @5xl:grid-cols-[1fr_1fr_auto] grid-cols-1 @5xl:grid-rows-2 grid-rows-4 gap-1">
        <Select.Root name="interactionType">
          <Select.Trigger className="row-start-1 text-sm">
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
          <Select.Trigger className="row-start-2 text-sm">
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
          className="@5xl:row-start-1 row-start-3 text-sm"
        />

        <div className="@5xl:row-start-2 row-start-4 flex items-center gap-3 rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 shadow">
          <label className="font-medium text-sm text-zinc-700">Lembrete</label>
          <fieldset className="flex gap-1">
            {reminderOptions.map((option) => (
              <label
                key={option.value}
                className="cursor-pointer select-none text-nowrap rounded-md px-2 py-0.5 text-xs transition-colors hover:bg-zinc-300 has-checked:bg-accent-300/75 has-checked:text-accent-950"
              >
                <input
                  name="reminder"
                  className="hidden"
                  type="radio"
                  defaultChecked={option.default}
                  value={option.value}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        </div>

        <Button
          className="row-span-full row-start-1 ml-2 self-center"
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
  leadId: number
  sellerName: string
}

function LeadInteractionRow({
  interaction,
  leadId,
  sellerName,
}: LeadInteractionRowProps) {
  const { canEdit } = useLoaderData<typeof loader>()
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
      <div className="flex items-center justify-between gap-4">
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
          </div>
        )}
      </div>
    </div>
  )
}
