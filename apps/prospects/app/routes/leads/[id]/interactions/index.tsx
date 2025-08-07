import type { Route } from "./+types"

import { getUserOrRedirect } from "~/utils/authGuard"

import InteractionService, {
  newInteractionSchema,
} from "~/services/InteractionService"

export const action = async ({ request, params }: Route.ActionArgs) => {
  const user = await getUserOrRedirect(request)

  const formData = await request.formData()

  const leadId = params.id
  const interactionType = formData.get("interactionType")?.toString()
  const status = formData.get("interactionStatus")?.toString()
  const notes = formData.get("notes")?.toString()

  const { success, error, data } = newInteractionSchema.safeParse({
    leadId,
    interactionType,
    status,
    contactedAt: new Date(),
    sellerId: user.id,
    notes,
  })

  if (!success) {
    return {
      error: true,
      message: "Invalid input",
      details: error,
    }
  }

  return await InteractionService.create(data)
}
