import type { Route } from "./+types"
import { z } from "zod"

import { createMatcher } from "~/utils/actionMatcher"

import {
  templateFieldSchema,
  templateSchema,
} from "~/.server/services/db/schema/template"
import TemplateService from "~/.server/services/TemplateService"

const templateWithFieldsSchema = templateSchema.extend({
  // remove the id length constraint
  fields: z.array(templateFieldSchema.extend({ id: z.string() })),
})

async function putAction(request: Request) {
  const json = await request.json()

  const parsed = templateWithFieldsSchema.parse(json)

  const updated = await TemplateService.syncTemplateAndFields(parsed)

  return updated
}

export async function action({ request }: Route.ActionArgs) {
  const matcher = createMatcher<Request>()({
    PUT: putAction,
  })

  const match = await matcher(request.method, request)

  return match
}
