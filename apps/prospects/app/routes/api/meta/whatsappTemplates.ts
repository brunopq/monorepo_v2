import type { Route } from "./+types/whatsappTemplates"

import WhatsappTemplateService from "~/services/meta/WhatsappTemplateService"

import { getUserOrRedirect } from "~/utils/authGuard"

export async function loader({ request }: Route.LoaderArgs) {
    await getUserOrRedirect(request)

    try {
        const templates = await WhatsappTemplateService.listTemplates()
        return { ok: true as const, templates }
    } catch (error) {
        console.error("Error fetching WhatsApp templates:", error)
        return { ok: false as const, error: "Failed to fetch WhatsApp templates" }
    }
}
