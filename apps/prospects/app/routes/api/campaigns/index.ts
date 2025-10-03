import type { Route } from "./+types"
import { z } from "zod"

import { getAdminOrRedirect } from "~/utils/authGuard"

import MessagingCampaignService from "~/services/MessagingCampaignService"
import {
    newDomainMessagingCampaignSchema,
    newDomainOficialWhatsappMessageSchema,
} from "~/services/MessagingCampaignService/schemas"

export const newCampaignPayloadSchema = z.object({
    messagingCampaign: newDomainMessagingCampaignSchema,
    messages: z.array(newDomainOficialWhatsappMessageSchema),
})
export type NewCampaignPayload = z.infer<typeof newCampaignPayloadSchema>

/** 
TODO: 
- create an action that takes the template and mappings to create the campaign,
- parse the leads in the server to offload the client
*/
export const action = async ({ request }: Route.ActionArgs) => {
    await getAdminOrRedirect(request)

    const data = await request.json()

    const parsed = newCampaignPayloadSchema.safeParse(data)

    if (!parsed.success) {
        console.error("Invalid campaign data", { data, error: parsed.error })
        return {
            error: true,
            message: "Invalid campaign data",
        } as const
    }

    try {
        const { createdCampaign, createdMessages } = await MessagingCampaignService.createCampaign(
            parsed.data.messagingCampaign,
            parsed.data.messages,
        )

        return {
            success: true,
            campaign: createdCampaign,
            messages: createdMessages,
        } as const
    } catch (error) {
        console.error("Failed to create campaign", { error, data })
        return {
            error: true,
            message: "Failed to create campaign",
        } as const
    }
}
