import { useEffect, useState } from "react"
import { useFetcher } from "react-router"

import type { loader as templatesLoader } from '~/routes/api/meta/whatsappTemplates'

export function useMessageTemplates(shouldFetch = false) {
    const fetcher = useFetcher<typeof templatesLoader>()

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (shouldFetch) {
            fetcher.load('/api/whatsapp-templates')
        }
    }, [shouldFetch])

    return {
        templates: fetcher.data?.templates,
        isLoading: fetcher.state === 'loading',
    }
}