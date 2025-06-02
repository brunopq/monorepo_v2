import type { Route } from "./+types/login"
import { data, Form, redirect } from "react-router"
import { z } from "zod"

import AuthService from "~/.server/services/AuthService"
import {
  commitSession,
  getSession,
  getToken,
} from "~/.server/cookies/authSession"

import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
})

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getToken(request)
  if (token) {
    return redirect("/")
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = Object.fromEntries(await request.formData())

  const loginData = loginSchema.safeParse(formData)

  if (!loginData.success) {
    return new Response("Invalid data", { status: 400 })
  }

  try {
    const session = await getSession(request)

    const userToken = await AuthService.login(loginData.data)

    session.set("token", userToken)

    return data(
      { token: userToken },
      { headers: { "Set-Cookie": await commitSession(session) } },
    )
  } catch (e) {
    console.log(e)
    return new Response("Login failed", { status: 400 })
  }
}

export default function Login() {
  return (
    <div className="grid h-screen w-screen place-items-center">
      <div className="min-w-xs rounded border border-primary-700/50 bg-zinc-100/40 p-6 shadow-md dark:border-primary-200/25 dark:bg-zinc-800">
        <h1 className="mb-6 text-center font-semibold text-primary-900 text-xl dark:text-primary-100">
          Login
        </h1>

        <Form method="POST" className="flex flex-col gap-2">
          <Input name="username" placeholder="Usuário..." />
          <Input name="password" placeholder="Senha..." />

          <Button size="sm" className="mt-4 text-lg" type="submit">
            Entrar
          </Button>
        </Form>
      </div>
    </div>
  )
}
