import z from "zod"
import type { Route } from "./+types/api.indication"

import { getUserOrRedirect } from "~/lib/authGuard"

import IndicationService from "~/services/IndicationService"

const loaderSearchParamsSchema = z.object({
  ano: z.coerce.number().nullish(),
  includeUsers: z.coerce
    .string()
    .transform((val) => val === "true")
    .nullish(),
})

export const loader = async ({ request }: Route.LoaderArgs) => {
  await getUserOrRedirect(request)

  const searchParams = Object.fromEntries(
    new URL(request.url).searchParams.entries(),
  )

  const { ano, includeUsers } = loaderSearchParamsSchema.parse(searchParams)

  const year = ano || new Date().getFullYear()

  const referrers = await IndicationService.getReferrers({
    year,
    includeUsers: includeUsers || false,
  })

  return { referrers }
}
