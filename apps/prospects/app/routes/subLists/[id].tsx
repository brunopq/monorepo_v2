import SubListService from "~/services/SubListService"
import type { Route } from "./+types/[id]"
import { getUserOrRedirect } from "~/utils/authGuard"

export const action = async ({ request, params }: Route.ActionArgs) => {
  await getUserOrRedirect(request)

  if (request.method === "PATCH") {
    const formData = await request.formData()
    const assigneeId = formData.get("assigneeId")?.toString()

    if (!assigneeId) {
      return {
        error: true,
        message: "Assignee ID is required",
      }
    }

    try {
      const subList = await SubListService.assign(params.id, assigneeId)
      return { subList }
    } catch (error) {
      console.error("Failed to assign sublist:", error)
      return {
        error: true,
        message: "Failed to assign sublist",
      }
    }
  }
}
