import type { Route } from "./+types"
import { redirect } from "react-router"

import SubmissionService from "~/.server/services/SubmissionService"

export async function loader({ params }: Route.LoaderArgs) {
  const id = params.id

  const submission = await SubmissionService.get(id)

  if (!submission) {
    throw redirect("/fichas")
  }

  return submission
}
