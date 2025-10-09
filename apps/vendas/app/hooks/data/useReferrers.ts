import { useCallback, useEffect } from "react"
import { useFetcher } from "react-router"

import type { GetReferrersOptions } from "~/services/IndicationService"

import type { loader } from "~/routes/api.indication"

type UseReferrersOptions = Partial<GetReferrersOptions>

export function useReferrers({
  includeUsers,
  year,
}: Partial<UseReferrersOptions> = {}) {
  const fetcher = useFetcher<typeof loader>()

  const load = useCallback(() => {
    let path = "/api/indication?"

    if (year) {
      path += `ano=${year}&`
    }

    if (includeUsers) {
      path += "includeUsers=true"
    }

    fetcher.load(path)
  }, [year, includeUsers, fetcher.load])

  useEffect(() => {
    load()
  }, [load])

  return {
    referrers: fetcher.data?.referrers,
    loading: fetcher.state === "loading" || fetcher.state === "submitting",
    refetch: load,
  }
}
