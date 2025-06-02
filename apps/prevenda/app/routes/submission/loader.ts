import type { Route } from "./+types"
import { redirect } from "react-router"
import { z } from "zod"

import { getToken, getUserOrRedirect } from "~/.server/cookies/authSession"
import SubmissionService from "~/.server/services/SubmissionService"

const modeSchema = z.enum(["view", "edit", "review"])

export type Mode = z.infer<typeof modeSchema>

export async function loader({ params, request }: Route.LoaderArgs) {
  const user = await getUserOrRedirect(request)
  // biome-ignore lint/style/noNonNullAssertion: get user or redirect will throw if user is not found
  const token = (await getToken(request))!

  const id = params.id
  const modeResult = modeSchema.safeParse(
    new URL(request.url).searchParams.get("mode"),
  )

  const submission = await SubmissionService.get(token, id)

  if (!submission) {
    throw redirect("/fichas")
  }

  const mode = modeResult.success ? modeResult.data : "view"

  return { submission, mode }
}
