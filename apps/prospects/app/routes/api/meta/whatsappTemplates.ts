import type { Route } from "./+types/whatsappTemplates";

import WhatsappTemplateService from "~/services/meta/WhatsappTemplateService";

export async function loader({ request }: Route.LoaderArgs) {
    const templates = await WhatsappTemplateService.listTemplates()

    return { templates }
}