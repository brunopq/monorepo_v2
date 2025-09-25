import { z } from "zod"

import QueueService from "./QueueService"


const whatsappMessagePayloadSchema = z.object({
    campaignId: z.string(),
    leadId: z.int(),
    messageId: z.string(),
    message: z.object({
        to: z.string(),
        templateName: z.string(),
        parameters: z.record(z.string(), z.string()).optional(),
    })
})

export type MessagePayload = z.infer<typeof whatsappMessagePayloadSchema>

const queueService = new QueueService<MessagePayload>(
    'oficial_whatsapp_messages',
    whatsappMessagePayloadSchema,
)
await queueService.connect()

export default queueService
