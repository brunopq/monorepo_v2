import { useCallback, useEffect } from "react"
import { useFetcher } from "react-router"
import { format } from "date-fns"
import { utc } from "@date-fns/utc"

import type { loader } from "~/routes/app.campaigns"

export function useCampaigns(date?: Date) {
  const fetcher = useFetcher<typeof loader>()

  const load = useCallback(
    (date: Date) => {
      const path = `/app/campaigns?date=${format(date, "yyyy-MM-dd", { in: utc })}`

      fetcher.load(path)
    },
    [fetcher.load],
  )

  useEffect(() => {
    load(date || new Date())
  }, [load, date])

  return {
    data: fetcher.data,
    loading: fetcher.state === "loading" || fetcher.state === "submitting",
    refetch: load,
  }
}
