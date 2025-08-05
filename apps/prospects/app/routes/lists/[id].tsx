import type { Route } from "./+types/[id]"
import { Link } from "react-router"
import {
  ArrowLeftIcon,
  FileStackIcon,
  PencilLineIcon,
  Trash2Icon,
  PlusIcon,
  MinusIcon,
} from "lucide-react"
import { Button, Dialog, Input } from "iboti-ui"
import { useState } from "react"

import { getUserOrRedirect } from "~/utils/authGuard"
import { cn, maxWidth } from "~/utils/styling"

import ListService, { type DomainList } from "~/services/ListService"

export async function loader({ params, request }: Route.LoaderArgs) {
  await getUserOrRedirect(request)
  const listId = params.id

  const list = await ListService.getById(listId)

  if (!list) throw new Response("List not found", { status: 404 })

  return { list }
}

export default function Id({ loaderData }: Route.ComponentProps) {
  const { list } = loaderData

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

          <p className="text-sm">
            Criada por{" "}
            <strong className="text-primary-600">{list.createdBy.name}</strong>
          </p>

          <p className="text-sm">
            Origem: <strong className="text-primary-600">{list.origin}</strong>
          </p>

          <p className="text-sm">
            Leads:{" "}
            <strong className="text-primary-600">{list.leads.length}</strong>
          </p>

          <p className="text-sm">
            Listinhas:{" "}
            <strong className="text-primary-600">{list.subLists.length}</strong>
          </p>
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

      <main>
        <section>
          <header className="mb-4 flex items-center justify-between">
            <span>
              <h2 className="font-medium text-lg text-primary-700">
                Listinhas ({list.subLists.length})
              </h2>
              <p className="text-sm text-zinc-500">
                Listinhas são partes de uma lista, que podem ser atribuídas a um
                vendedor para captar os leads.
              </p>
            </span>

            <span>
              <SplitListDialog list={list} />
            </span>
          </header>
        </section>
      </main>
    </div>
  )
}

type SplitListDialogProps = {
  list: Awaited<ReturnType<typeof ListService.getById>>
}

type Sublist = {
  id: string
  leadsCount: number
}

function SplitListDialog({ list }: SplitListDialogProps) {
  if (!list) return null

  const [sublistsCount, setSublistsCount] = useState<number>()
  const [sublists, setSublists] = useState<Sublist[]>([])

  const generateSublists = () => {
    if (!sublistsCount || sublistsCount <= 0) {
      setSublists([])
      return
    }
    const leadsPerSublist = Math.floor(list.leads.length / sublistsCount)
    const remainingLeads = list.leads.length % sublistsCount
    const newSublists: Sublist[] = Array.from(
      { length: sublistsCount },
      (_, index) => ({
        id: `sublist-${index + 1}`,
        name: `Listinha ${index + 1}`,
        leadsCount: leadsPerSublist + (index < remainingLeads ? 1 : 0),
      }),
    )
    setSublists(newSublists)
  }

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
  const remainingLeads = list.leads.length - totalDistributed

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
            <strong>{list.leads.length}</strong> leads distribuídos entre{" "}
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

          <Button
            className="bg-primary-600 hover:bg-primary-700"
            disabled={sublists.length <= 0 || remainingLeads < 0}
            onClick={() => {
              // TODO: Implement the actual split logic
              console.log("Splitting list with distribution:", sublists)
            }}
          >
            Confirmar divisão
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
