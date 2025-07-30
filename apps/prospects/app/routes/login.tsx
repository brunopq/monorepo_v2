import type { Route } from "./+types/login"
import { redirect } from "react-router"

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
      <h1>Login Page</h1>
      <form>
        <input type="text" placeholder="nome" />
        <input type="password" placeholder="senha" />

        <button type="submit">Entrar</button>
      </form>
    </div>
  )
}
