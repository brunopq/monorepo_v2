import { ArrowLeftIcon } from "lucide-react"
import type { MetaFunction } from "react-router"
import { Link, NavLink, Outlet } from "react-router"
import { Button } from "iboti-ui"

import { cn, maxWidth } from "~/lib/utils"

export const meta: MetaFunction = () => [
  {
    title: "Admin | Vendas Iboti",
  },
]

const links = [
  { href: "usuarios", label: "usuários" },
  { href: "campanhas", label: "campanhas" },
  { href: "origens", label: "origens" },
  { href: "indicacoes", label: "indicações" },
]

export default function Admin() {
  return (
    <>
      <nav className={maxWidth("flex items-center justify-between gap-4 py-2")}>
        <span className="flex items-center gap-2 text-primary-700">
          <Button asChild icon variant="ghost" size="sm">
            <Link to="/app">
              <ArrowLeftIcon />
            </Link>
          </Button>
          <strong className="font-semibold text-lg">Admin</strong>
        </span>

        <ul className="flex items-center justify-between gap-2">
          {links.map(({ href, label }) => (
            <li key={href}>
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "underline-offset-2 transition-colors hover:text-primary-600",
                    isActive && "underline",
                  )
                }
                to={href}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <hr className="border-primary-300" />

      <Outlet />

      <footer className="mt-16 py-16" />
    </>
  )
}
