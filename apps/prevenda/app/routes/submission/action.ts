import type { Route } from "./+types"
import { z } from "zod"

import { submittedFieldSchema } from "~/.server/db/schema/submission"
import SubmissionService from "~/.server/services/SubmissionService"

const submittedFieldSchema2 = submittedFieldSchema.extend({
  dateValue: z.coerce.date({ coerce: true }).nullable(),
})

export async function action({ request, params }: Route.ActionArgs) {
  const submissionId = params.id

  const json = await request.json()

  // TODO: numbers that exceed the integer limit break the app
  // please do not insert big numbers (I'm too lazy to fix this)
  const parsed = z.array(submittedFieldSchema2).parse(json)

  const updated = await SubmissionService.syncSubmittedFields(
    submissionId,
    parsed,
  )

  return updated
}
