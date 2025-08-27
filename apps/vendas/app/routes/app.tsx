import type { Route } from "./+types/app"
import type { MetaFunction } from "react-router"
import { Link, Outlet } from "react-router"
import { KeyRound, LogOut, Menu } from "lucide-react"

import logo from "~/assets/images/logo.png"

import { maxWidth } from "~/lib/utils"
import { getUserOrRedirect } from "~/lib/authGuard"

import { Button, DropdownMenu } from "~/components/ui"

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await getUserOrRedirect(request, "/login")
  console.log("returning user from loader", user)

  return user
}

export const meta: MetaFunction = () => [
  {
    title: "Vendas Iboti",
  },
]

export default function App({ loaderData }: Route.ComponentProps) {
  const user = loaderData

  return (
    <div>
      <nav className={maxWidth("flex items-center justify-between gap-4 py-4")}>
        <img
          src={logo}
          alt="logo iboti"
          className="pointer-events-none max-h-10"
        />

        {user.role === "ADMIN" && (
          <Button className="ml-auto" size="sm" variant="link" asChild>
            <Link to="admin">Ir para /admin</Link>
          </Button>
        )}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Menu />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item asChild>
              <Link to="/trocasenha">
                <KeyRound className="size-5" /> Trocar senha
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild variant="danger">
              <Link to="/sign-out">
                <LogOut className="size-5" />
                Sair
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </nav>
      <hr className="border-primary-300" />

      <div className={maxWidth("mt-8")}>
        <Outlet />
      </div>
    </div>
  )
}
