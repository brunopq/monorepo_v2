import type { Route } from "./+types/login"
import { Form, redirect } from "react-router"
import z from "zod/v4"

import { Button, Input } from "iboti-ui"

import { getUserOrRedirect } from "~/utils/authGuard"
import { commitSession, getSession } from "~/session"
import AuthService from "~/services/AuthService"


const formValidator = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
})

export async function action({ request }: Route.ActionArgs) {
  try {
    const session = await getSession(request)

    const rawForm = Object.fromEntries(await request.formData())

    const userInfo = formValidator.parse(rawForm)

    const login = await AuthService.login(userInfo)

    session.set("user", login.user)
    session.set("jwt", login.token)

    return redirect("/app", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    })
  } catch (e) {
    console.log(e)
    return { error: true }
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserOrRedirect(request, { noredirect: true })

  if (user) {
    throw redirect("/app")
  }

  return null
}

export default function Login({ actionData }: Route.ComponentProps) {
  const error = actionData?.error

  return (
    <div className="grid h-screen place-items-center bg-zinc-300">
      <div className=" w-full max-w-xs rounded-lg bg-zinc-200 p-6 shadow-md">
        <header className="mb-4">
          <h1 className="text-center font-sans font-semibold text-2xl text-primary-600">
            Login
          </h1>
        </header>
        <Form method="POST" className="flex flex-col gap-2">
          <Input name="name" type="text" placeholder="Usuário" />
          <Input name="password" type="password" placeholder="Senha" />

          {error && (
            <p className="text-red-600 text-sm">Usuário ou senha inválidos</p>
          )}

          <Button className="mt-3">Entrar</Button>
        </Form>
      </div>
    </div>
  )
}
