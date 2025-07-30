import type { Route } from "./+types/login"
import { redirect } from "react-router"

import { Button } from "iboti-ui"


import { getUserOrRedirect } from "~/utils/authGuard"

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserOrRedirect(request, { noredirect: true })

  if (user) {
    throw redirect("/app")
  }

  return null
}

export default function Login() {
  return (
    <div>
      <h1 className="font-semibold text-4xl text-primary-600">Login Page</h1>
      <form>
        <input type="text" placeholder="nome" />
        <input type="password" placeholder="senha" />

        <button type="submit">Entrar</button>
        <Button>Entrar com o botão</Button>
      </form>
    </div>
  )
}
