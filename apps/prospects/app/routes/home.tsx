import type { Route } from "./+types/home"
import { Link, NavLink, useLoaderData } from "react-router"

import { maxWidth } from "~/utils/styling"
import { getUserOrRedirect } from "~/utils/authGuard"

import ListService, { type DomainList } from "~/services/ListService"
import { Button } from "iboti-ui"
import SubListService from "~/services/SubListService"

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
        <nav>
          <ul className="flex gap-4">
            {[
              ["Listas", "/listas"],
              ["Home", "/app"],
              ["Sair", "/logout", "danger"],
            ].map(([name, path, danger]) => (
              <li key={name}>
                <NavLink
                  className={({ isActive }) =>
                    isActive
                      ? "text-accent-700 underline"
                      : danger
                        ? "text-red-700"
                        : "text-gray-500"
                  }
                  to={path}
                >
                  {name}
                </NavLink>
              </li>
            ))}
          </ul>
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
            className="border-primary-500 border-l-[3px] pl-3"
          >
            <Link
              to={`/listinhas/${subList.id}`}
              className="text-primary-600 hover:text-primary-800"
            >
              {subList.leadsCount} leads
            </Link>
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
          Suas Listas ({lists?.length || 0})
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
  list: DomainList
}

function ListCard({ list }: ListCardProps) {
  return (
    <li className="border-primary-500 border-l-[3px] pl-3 transition-colors hover:bg-zinc-100">
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
    </li>
  )
}