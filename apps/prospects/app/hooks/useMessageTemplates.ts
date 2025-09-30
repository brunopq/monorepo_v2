import { useEffect } from "react"
import { useFetcher } from "react-router"

import type { loader as templatesLoader } from '~/routes/api/meta/whatsappTemplates'



export function useMessageTemplates(shouldFetch = false) {
    const fetcher = useFetcher<typeof templatesLoader>()

    const fetch = () => {
        fetcher.load('/api/whatsapp-templates')
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (shouldFetch) {
            fetch()
        }
    }, [shouldFetch])

    return {
        isLoading: fetcher.state === 'loading' || fetcher.state === 'submitting',
        data: fetcher.data,
        refetch: fetch,
    }
}