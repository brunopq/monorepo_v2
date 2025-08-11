import type { Route } from "./+types/home"
import { Link, NavLink, useLoaderData } from "react-router"
import { PencilLineIcon, Trash2Icon } from "lucide-react"
import { Button, PieChart } from "iboti-ui"

import { maxWidth } from "~/utils/styling"
import { getUserOrRedirect } from "~/utils/authGuard"

import ListService, { type DomainList } from "~/services/ListService"
import SubListService from "~/services/SubListService"

import { SubListStatusPill } from "~/components/SubListStatusPill"

export function meta() {
  return [{ title: "Prospects" }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserOrRedirect(request, "/login")

  const lists = user.role === "ADMIN" ? await ListService.getAll() : undefined
  const subLists = await SubListService.getForUser(user.id)

  return {
    user,
    lists,
    subLists,
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, lists } = loaderData

  return (
    <div className={maxWidth("pt-2")}>
      <header className="flex items-center justify-between border-primary-500 border-y border-dotted">
        <h1 className="font-bold text-lg text-primary-600">Listão</h1>
        <nav className="flex">
          <ul className="mx-4 flex gap-4">
            {[["Home", "/app"]].map(([name, path]) => (
              <li key={name}>
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "text-accent-600 underline" : "text-gray-500"
                  }
                  to={path}
                >
                  {name}
                </NavLink>
              </li>
            ))}
          </ul>
          <span className="border-primary-500 border-l border-dotted" />
          <Link
            className="ml-1 rounded-xs px-3 text-red-700 transition-colors hover:bg-red-200 hover:text-red-900"
            to="/logout"
          >
            Sair
          </Link>
        </nav>
      </header>

      <div className="mt-8">
        <h2 className="font-semibold text-xl">Olá, {user.name}!</h2>
      </div>

      {user.role === "ADMIN" && <ListsList />}

      <SubListsList />
    </div>
  )
}

function SubListsList() {
  const { subLists } = useLoaderData<typeof loader>()

  return (
    <div className="mt-4">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-lg text-primary-700">
          Suas listinhas ({subLists.length})
        </h3>
      </header>
      <ul className="space-y-2">
        {subLists?.map((subList) => (
          <li
            key={subList.id}
            className="flex items-center justify-between border-primary-500 border-l-[3px] pl-3 transition-colors hover:bg-zinc-100"
          >
            <div>
              <span className="flex items-center gap-2">
                <Link
                  to={`/listinhas/${subList.id}`}
                  className="text-primary-600 hover:text-primary-800"
                >
                  {subList.parentList.name}
                </Link>

                <SubListStatusPill status={subList.state} />
              </span>
              <p className="text-gray-500 text-sm">
                Criado em: {subList.parentList.createdAt.toLocaleDateString()}
              </p>
              <p className="text-gray-500 text-sm">
                Origem: {subList.parentList.origin}
              </p>
            </div>

            <div className="text-end text-sm">
              <p>
                {subList.contactedLeadsCount} de {subList.leadsCount} leads
                contatados
              </p>
              <p className="text-yellow-800">
                Aguardando resposta de {subList.record.waiting_response}{" "}
                {subList.record.waiting_response === 1 ? "lead" : "leads"}
              </p>
              <p className="text-blue-800">
                {subList.record.interested}{" "}
                {subList.record.interested === 1
                  ? "lead interessado"
                  : "leads interessados"}
              </p>
              <p className="text-green-800">
                {subList.record.converted}{" "}
                {subList.record.converted === 1
                  ? "lead convertido"
                  : "leads convertidos"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ListsList() {
  const { lists } = useLoaderData<typeof loader>()

  return (
    <div className="mt-4">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-lg text-primary-700">
          Listas ({lists?.length || 0})
        </h3>

        <Button asChild variant="secondary" size="sm">
          <Link to="/listas/novo" className="text-white">
            Nova Lista
          </Link>
        </Button>
      </header>
      <ul className="space-y-2">
        {lists?.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
      </ul>
    </div>
  )
}

type ListCardProps = {
  list: Awaited<ReturnType<(typeof ListService)["getAll"]>>[number]
}

function ListCard({ list }: ListCardProps) {
  const completeSublists = list.subLists.filter((l) => l.state === "completed")
  const inProgressSublists = list.subLists.filter(
    (l) => l.state === "in_progress",
  )

  return (
    <li className="flex items-center justify-between border-primary-500 border-l-[3px] pl-3 transition-colors hover:bg-zinc-100">
      <div>
        <Link
          to={`/listas/${list.id}`}
          className="text-primary-600 hover:text-primary-800"
        >
          {list.name} - {list.size} leads
        </Link>
        <p className="text-gray-500 text-sm">
          Criado em: {list.createdAt.toLocaleDateString()}
        </p>
        <p className="text-gray-500 text-sm">Origem: {list.origin}</p>
        <p className="text-gray-500 text-sm">
          Divido em {list.subLists.length} listinhas, {completeSublists.length}{" "}
          concluídas, {inProgressSublists.length} em progresso.
        </p>
      </div>

      <div className="flex flex-col gap-1 ">
        <Button className="gap-2" variant="outline" size="sm">
          Editar
          <PencilLineIcon className="size-4" />
        </Button>
        <Button className="gap-2" variant="destructive" size="sm">
          Excluir
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </li>
  )
}