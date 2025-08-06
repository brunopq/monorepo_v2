import type { Route } from "./+types/[id]"
import { Form } from "react-router"
import { Link, useFetcher, useLoaderData } from "react-router"
import {
  ArrowLeftIcon,
  FileStackIcon,
  PencilLineIcon,
  Trash2Icon,
  PlusIcon,
} from "lucide-react"
import { Button, Dialog, Input, Select } from "iboti-ui"
import { useEffect, useState } from "react"

import { getUserOrRedirect } from "~/utils/authGuard"
import { cn, maxWidth } from "~/utils/styling"

import ListService from "~/services/ListService"
import SubListService, { type SubListState } from "~/services/SubListService"

import type { loader as usersLoader } from "~/routes/users"
import type { action as subListAction } from "~/routes/subLists/[id]"

export async function loader({ params, request }: Route.LoaderArgs) {
  await getUserOrRedirect(request)
  const listId = params.id

  const list = await ListService.getById(listId)
  const subLists = await SubListService.getForList(listId)

  if (!list) throw new Response("List not found", { status: 404 })

  return { list, subLists }
}

export async function action({ request, params }: Route.ActionArgs) {
  await getUserOrRedirect(request)
  const listId = params.id

  const formData = await request.formData()
  const subListsData = formData.get("subLists")

  if (!subListsData) {
    throw new Response("No sublists data provided", { status: 400 })
  }

  const subLists = subListsData
    .toString()
    .split(",")
    .map((count) => Number.parseInt(count, 10))

  if (subLists.some((count) => Number.isNaN(count)) || subLists.length === 0) {
    throw new Response("Invalid sublist counts provided", { status: 400 })
  }

  console.log("Creating sublists with counts:", subLists)

  await ListService.makeSubLists(
    listId,
    subLists.map((count) => ({
      leadsCount: count,
      assigneeId: undefined, // Assuming no specific assignee for simplicity
    })),
  )
}

export default function Id({ loaderData }: Route.ComponentProps) {
  const { list, subLists } = loaderData

  return (
    <div className={maxWidth("pt-4")}>
      <header className="mb-4 flex items-start gap-4 border-zinc-400 border-b border-dotted pb-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="..">
            <ArrowLeftIcon />
          </Link>
        </Button>

        <div className="mt-1">
          <h1 className="font-semibold text-2xl text-primary-800">
            Lista{" "}
            <strong className="font-semibold text-primary-600">
              {list.name}
            </strong>
          </h1>

          <div className="columns-2">
            <p className="text-sm">
              Criada por{" "}
              <strong className="text-primary-600">
                {list.createdBy.name}
              </strong>
            </p>

            <p className="text-sm">
              Origem:{" "}
              <strong className="text-primary-600">{list.origin}</strong>
            </p>

            <p className="text-sm">
              Leads:{" "}
              <strong className="text-primary-600">{list.leadsCount}</strong>
            </p>

            <p className="text-sm">
              Leads não atribuídos:{" "}
              <strong className="text-primary-600">
                {list.freeLeadsCount}
              </strong>
            </p>
          </div>
        </div>

        <span className="ml-auto flex flex-col gap-1">
          <Button
            className="inline-flex gap-2"
            variant="outline"
            size="sm"
            type="button"
            asChild
          >
            <Link to="edit">
              Editar
              <PencilLineIcon className="size-4" />
            </Link>
          </Button>

          <Button
            className="inline-flex gap-2"
            variant="destructive"
            size="sm"
            type="button"
          >
            Excluir
            <Trash2Icon className="size-4" />
          </Button>
        </span>
      </header>

      <main className="mt-6 space-y-8">
        <section>
          <SubListsSection />
        </section>

        {/* <section>
          <LeadsSection list={list} />
        </section> */}
      </main>
    </div>
  )
}


function SubListsSection() {
  const { subLists, list } = useLoaderData<typeof loader>()

  const canMakeSublists = list.freeLeadsCount > 0

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <span>
          <h2 className="font-semibold text-lg text-primary-700">
            Listinhas ({subLists.length})
          </h2>
          <p className="text-sm text-zinc-500">
            Listinhas são partes de uma lista, que podem ser atribuídas a um
            vendedor para captar os leads.
          </p>
        </span>

        <span>{canMakeSublists && <SplitListDialog />}</span>
      </header>

      <div className="space-y-4">
        {subLists.map((subList) => (
          <SubListCard key={subList.id} subList={subList} />
        ))}
      </div>
    </>
  )
}

type SubListCardProps = {
  subList: Awaited<ReturnType<typeof SubListService.getForList>>[number]
}

function SubListCard({ subList }: SubListCardProps) {
  return (
    <div key={subList.id} className="border-primary-500 border-l-[3px] pl-3">
      <header className="flex items-center gap-2">
        <h3 className="font-semibold text-lg text-primary-800">Listinha</h3>
        <SubListStatePill state={subList.state} />
      </header>

      <label className="text-sm">
        <span className="mr-2">Atribuído a:</span>
        <SubListAsigneeSelect
          subListId={subList.id}
          assigneeId={subList.assigneeId || undefined}
        />
      </label>

      <p className="text-sm text-zinc-600">Leads: {subList.leadsCount}</p>
    </div>
  )
}

type SubListAsigneeSelectProps = {
  subListId: string
  assigneeId?: string
}

function SubListAsigneeSelect({
  subListId,
  assigneeId,
}: SubListAsigneeSelectProps) {
  const usersFetcher = useFetcher<typeof usersLoader>({ key: "users" })
  const assigneeFetcher = useFetcher<typeof subListAction>()

  // biome-ignore lint/correctness/useExhaustiveDependencies: causes an infinite loop
  useEffect(() => {
    usersFetcher.load("/users")
  }, [])

  const handleValueChange = (value: string) => {
    assigneeFetcher.submit(
      { assigneeId: value },
      { method: "PATCH", action: `/listinhas/${subListId}` },
    )
  }

  return (
    <Select.Root defaultValue={assigneeId} onValueChange={handleValueChange}>
      <Select.Trigger className="inline-flex w-fit px-3 py-1 text-sm">
        <Select.Value placeholder="Atribuir a um vendedor" />
      </Select.Trigger>

      <Select.Content>
        {usersFetcher.data?.users.map((assignee) => (
          <Select.Item
            key={assignee.id}
            value={assignee.id}
            className="cursor-pointer"
          >
            {assignee.name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}

type SubListStatePillProps = {
  state: SubListState
}

function SubListStatePill({ state }: SubListStatePillProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-0.5 font-medium text-xs",
        {
          "bg-primary-200/75 text-primary-800": state === "new",
          "bg-yellow-200/75 text-yellow-800": state === "in_progress",
          "bg-green-200/75 text-green-800": state === "completed",
          "bg-red-200/75 text-red-800": state === "canceled",
        },
      )}
    >
      {
        {
          new: "Nova",
          in_progress: "Em andamento",
          completed: "Concluída",
          canceled: "Cancelada",
        }[state]
      }
    </span>
  )
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
type SplitListDialogProps = {}

type Sublist = {
  id: string
  leadsCount: number
}

function SplitListDialog() {
  const { list } = useLoaderData<typeof loader>()

  //   const [sublistsCount, setSublistsCount] = useState<number>()
  const [sublists, setSublists] = useState<Sublist[]>([])

  //   const generateSublists = () => {
  //     if (!sublistsCount || sublistsCount <= 0) {
  //       setSublists([])
  //       return
  //     }
  //     const leadsPerSublist = Math.floor(list.leads.length / sublistsCount)
  //     const remainingLeads = list.leads.length % sublistsCount
  //     const newSublists: Sublist[] = Array.from(
  //       { length: sublistsCount },
  //       (_, index) => ({
  //         id: `sublist-${index + 1}`,
  //         name: `Listinha ${index + 1}`,
  //         leadsCount: leadsPerSublist + (index < remainingLeads ? 1 : 0),
  //       }),
  //     )
  //     setSublists(newSublists)
  //   }

  const updateSublistLeads = (id: string, leadsCount: number) => {
    setSublists((prev) =>
      prev.map((sublist) =>
        sublist.id === id
          ? { ...sublist, leadsCount: Math.max(0, leadsCount || 0) }
          : sublist,
      ),
    )
  }

  const removeSublist = (id: string) => {
    setSublists((prev) => prev.filter((sublist) => sublist.id !== id))
  }

  const addSublist = () => {
    const newIndex = sublists.length + 1
    const newSublist: Sublist = {
      id: `sublist-${newIndex}`,
      leadsCount: 0,
    }
    setSublists((prev) => [...prev, newSublist])
  }

  const totalDistributed = sublists.reduce(
    (sum, sublist) => sum + sublist.leadsCount,
    0,
  )
  const remainingLeads = list.freeLeadsCount - totalDistributed

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="secondary" size="sm" className="inline-flex gap-2">
          Dividir lista
          <FileStackIcon className="size-4" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Content className="[--dialog-content-max-width:_38rem]">
        <Dialog.Title className="w-full text-lg">
          Dividir lista{" "}
          <strong className="font-semibold text-primary-600">
            {list.name}
          </strong>
        </Dialog.Title>

        <div className="max-h-[50vh] overflow-y-auto">
          <h3 className="mb-3 font-medium text-lg">Prévia da divisão</h3>

          <div className="space-y-3">
            {sublists.map((sl, i) => (
              <div key={sl.id} className="flex items-center gap-3 ">
                <span className="font-medium text-sm">Listinha {i + 1}</span>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={sl.leadsCount}
                    onChange={(e) =>
                      updateSublistLeads(sl.id, e.target.valueAsNumber)
                    }
                    className="w-20 py-1 text-sm"
                  />
                  <span className="text-sm text-zinc-600">leads</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSublist(sl.id)}
                  className="ml-auto size-8 text-red-600 hover:text-red-700"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="ghost"
              size="sm"
              onClick={addSublist}
              className="inline-flex gap-2 text-primary-600"
            >
              <PlusIcon className="size-4" />
              Adicionar listinha
            </Button>
          </div>

          <hr className="my-4 border-zinc-600 border-dotted" />

          <p className="text-zinc-600 *:text-primary-500">
            <strong>{totalDistributed}</strong> de{" "}
            <strong>{list.freeLeadsCount}</strong> leads distribuídos entre{" "}
            <strong>{sublists.length}</strong>{" "}
            {sublists.length === 1 ? "listinha" : "listinhas"}.
          </p>

          {remainingLeads > 0 && (
            <p className="text-zinc-600 *:text-primary-500">
              <strong>{remainingLeads}</strong> leads restantes para distribuir.
            </p>
          )}
          {remainingLeads < 0 && (
            <p className="text-red-800 *:text-red-600">
              <strong>{-remainingLeads}</strong> leads a mais do que o total
              disponível.
            </p>
          )}
        </div>

        <Dialog.Footer className="gap-2">
          <Dialog.Close asChild>
            <Button variant="outline">Cancelar</Button>
          </Dialog.Close>

          <Form method="POST">
            <Button
              className="bg-primary-600 hover:bg-primary-700"
              disabled={sublists.length <= 0 || remainingLeads < 0}
              onClick={() => {
                // TODO: Implement the actual split logic
                console.log("Splitting list with distribution:", sublists)
              }}
              name="subLists"
              value={sublists.map((sl) => sl.leadsCount).join(",")}
            >
              Confirmar divisão
            </Button>
          </Form>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}

/*
type LeadsSectionProps = {
  list: Awaited<ReturnType<typeof ListService.getById>>
}

function LeadsSection({ list }: LeadsSectionProps) {
  if (!list) return null

  return (
    <>
      <header>
        <h2 className="font-semibold text-lg text-primary-700">
          Leads ({list.leads.length})
        </h2>
      </header>

      <table>
        <thead>
          <tr>
            <th className="text-left">Nome</th>
            <th className="text-left">CPF</th>
            <th className="text-left">Telefone</th>
            <th className="text-left">Estado</th>
            <th className="text-left">Nascimento</th>
          </tr>
        </thead>
        <tbody>
          {list.leads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.name}</td>
              <td>{lead.cpf}</td>
              <td>{lead.phoneNumber}</td>
              <td>{lead.state || "Não informado"}</td>
              <td>
                {lead.birthDate
                  ? new Date(lead.birthDate).toLocaleDateString()
                  : "Não informado"}
              </td>
              {Object.values(lead.extraInfo || {}).map((value, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <td key={index} className="text-left">
                  {typeof value === "string" ? value : JSON.stringify(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
  */