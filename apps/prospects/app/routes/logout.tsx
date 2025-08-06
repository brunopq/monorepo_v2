import { getUserOrRedirect } from "~/utils/authGuard"
import type { Route } from "./+types"

import { destroySession, getSession } from "~/session"

export const loader = async ({ request }: Route.LoaderArgs) => {
  await getUserOrRedirect(request)

  const session = await getSession(request)

  return new Response(null, {
    headers: {
      "Set-Cookie": await destroySession(session),
      Location: "/login",
    },
    status: 302,
  })
}
