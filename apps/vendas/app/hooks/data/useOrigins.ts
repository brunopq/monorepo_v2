import { useCallback, useEffect } from "react"
import { useFetcher } from "react-router"

import type { loader } from "~/routes/app.origins"

export function useOrigins(includeInactive = false) {
  const fetcher = useFetcher<typeof loader>()

  const load = useCallback(() => {
    const path = `/app/origins?includeInactive=${includeInactive}`

    fetcher.load(path)
  }, [includeInactive, fetcher.load])

  useEffect(() => {
    load()
  }, [load])

  return {
    origins: fetcher.data?.origins || [],
    loading: fetcher.state === "loading" || fetcher.state === "submitting",
    refetch: load,
  }
}
