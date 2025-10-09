import type { Route } from "./+types/api.indication"

import { getUserOrRedirect } from "~/lib/authGuard"
import { extractDateFromRequest } from "~/lib/extractDateFromRequest"

import IndicationService from "~/services/IndicationService"

export const loader = async ({ request }: Route.LoaderArgs) => {
  await getUserOrRedirect(request)

  const { year } = extractDateFromRequest(request)

  const referrers = await IndicationService.getReferrers(year)

  return { referrers }
}
