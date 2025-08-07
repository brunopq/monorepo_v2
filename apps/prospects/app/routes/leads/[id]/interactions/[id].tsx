import InteractionService from "~/services/InteractionService"
import type { Route } from "./+types"

import { getUserOrRedirect } from "~/utils/authGuard"

export const action = async ({ request, params }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request)

  console.log("action", request.method, params)

  if (request.method.toUpperCase() === "DELETE") {
    const interactionId = params.id

    await InteractionService.delete(interactionId)
  }
}
