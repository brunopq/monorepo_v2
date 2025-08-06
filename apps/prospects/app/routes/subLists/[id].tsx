import type { Route } from "./+types/[id]"
import { ArrowLeftIcon } from "lucide-react"
import { Link } from "react-router"
import { Button, Table } from "iboti-ui"

import { getUserOrRedirect } from "~/utils/authGuard"
import { maxWidth } from "~/utils/styling"

import SubListService from "~/services/SubListService"

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
              <Table.Row key={lead.id}>
                <Table.Cell>{lead.name}</Table.Cell>
                <Table.Cell>{lead.cpf}</Table.Cell>
                <Table.Cell>{lead.phoneNumber}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  )
}
