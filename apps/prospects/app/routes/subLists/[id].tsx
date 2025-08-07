import type React from "react"
import { useState } from "react"
import type { Route } from "./+types/[id]"
import { ArrowLeftIcon } from "lucide-react"
import { Form, Link } from "react-router"
import { Button, Table, Input, Select } from "iboti-ui"

import { getUserOrRedirect } from "~/utils/authGuard"
import { maxWidth } from "~/utils/styling"

import SubListService from "~/services/SubListService"

import { SubListStatusPill } from "~/components/SubListStatusPill"
import type {
  DomainLead,
  DomainLeadWithInteractions,
} from "~/services/LeadService"
import { interactionStatuses, interactionTypes } from "~/constants/interactions"

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
    <div className={maxWidth("pt-4")}>
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

function LeadRow({ lead }: LeadRowProps) {
  const [open, setOpen] = useState(false)

  const handleToggle = () => setOpen(!open)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleToggle()
    }
  }

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
        className="cursor-pointer transition-colors focus:bg-zinc-100 focus:outline-none data-[open=true]:bg-primary-100"
      >
        <Table.Cell>{lead.name}</Table.Cell>
        <Table.Cell>{lead.cpf}</Table.Cell>
        <Table.Cell>{lead.phoneNumber}</Table.Cell>
      </Table.Row>

      <Table.Row
        data-open={open}
        className="hidden transition-colors data-[open=true]:table-row data-[open=true]:bg-primary-100"
      >
        <Table.Cell colSpan={20} className="p-4">
          <h3 className="font-semibold">Interações</h3>

          <span>
            Nova interação:
            <Form method="post" action={`/subLists/${lead.id}/interactions`}>
              <div className="grid grid-cols-[1fr_1fr_auto] grid-rows-2 gap-2">
                <Select.Root
                  name="interactionType"
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Selecione o tipo de interação" />
                  </Select.Trigger>
                  <Select.Content>
                    {interactionTypes.map((type) => (
                      <Select.Item key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>

                <Select.Root
                  name="status"
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Selecione o status" />
                  </Select.Trigger>
                  <Select.Content>
                    {interactionStatuses.map((status) => (
                      <Select.Item key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>

                <Input
                  name="notes"
                  placeholder="Notas (opcional)"
                  className="col-span-2"
                />

                <Button
                  className="col-start-3 row-span-2 row-start-1 ml-4 self-center"
                  type="submit"
                >
                  Registrar interação
                </Button>
              </div>
            </Form>
          </span>

          <div className="space-y-2">
            {lead.interactions.length > 0 ? (
              lead.interactions.map((interaction) => (
                <div key={interaction.id} className="rounded border p-2">
                  <p>
                    <strong>Tipo:</strong> {interaction.interactionType}
                  </p>
                  <p>
                    <strong>Status:</strong> {interaction.status}
                  </p>
                  <p>
                    <strong>Data:</strong>{" "}
                    {new Date(interaction.contactedAt).toLocaleDateString()}
                  </p>
                  {interaction.notes && (
                    <p>
                      <strong>Notas:</strong> {interaction.notes}
                    </p>
                  )}
                </div>
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
