import { useCallback, useEffect } from "react"
import { useFetcher } from "react-router"

import type { loader } from "~/routes/api.indication"

export function useReferrers(year?: number) {
  const fetcher = useFetcher<typeof loader>()

  const load = useCallback(() => {
    let path = "/api/indication"

    if (year) {
      path += `?ano=${year}`
    }

    fetcher.load(path)
  }, [year, fetcher.load])

  useEffect(() => {
    load()
  }, [load])

  return {
    referrers: fetcher.data?.referrers,
    loading: fetcher.state === "loading" || fetcher.state === "submitting",
    refetch: load,
  }
}
