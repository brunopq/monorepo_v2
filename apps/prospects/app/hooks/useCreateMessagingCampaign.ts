import { useCallback } from "react"
import { useFetcher } from "react-router"

import type { action as CampaignsAction, NewCampaignPayload } from "~/routes/api/campaigns"

export function useCreateMessagingCampaign() {
    const fetcher = useFetcher<typeof CampaignsAction>()

    const create = useCallback(
        function create(data: NewCampaignPayload) {
            fetcher.submit(data, {
                action: "/api/campaigns",
                encType: 'application/json',
                method: "post",
            })
        }, [fetcher.submit]) // should not change but makes the linter happy

    return {
        create,
        creating: fetcher.state === "submitting",
        error: fetcher.data?.error ? fetcher.data.message : null,
    }
}