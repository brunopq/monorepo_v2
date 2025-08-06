import type { Route } from "./+types/index"

import { getSession } from "~/session"

import UserService from "~/services/UserService"

export const loader = async ({ request }: Route.LoaderArgs) => {
  const session = await getSession(request)

  const jwt = session.get("jwt")

  if (!jwt) {
    throw new Response("Unauthorized", { status: 401 })
  }

  const users = await UserService.findAll(jwt)

  return { users }
}
